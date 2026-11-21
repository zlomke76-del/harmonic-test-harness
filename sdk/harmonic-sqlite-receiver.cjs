'use strict';
// Reference receiver for a LOCAL synthetic settlement ledger. Requires node:sqlite.
// Administrative standing methods must never be exposed to payment submitters.
const { DatabaseSync } = require('node:sqlite');
const { randomUUID } = require('node:crypto');
const { verifyHarmonicExecutionRequest } = require('./harmonic-secure-execution-verifier.cjs');

class HarmonicSqliteReceiver {
  constructor({ filename, publicKeyPem, service, clock = () => new Date() }) {
    if (!filename || filename === ':memory:' || !publicKeyPem || !service) throw new Error('durable_receiver_configuration_required');
    this.publicKeyPem = publicKeyPem;
    this.service = service;
    this.clock = clock;
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA busy_timeout=5000;
      PRAGMA journal_mode=WAL;
      PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS standing (
        scope TEXT PRIMARY KEY, binding TEXT NOT NULL, active INTEGER NOT NULL,
        valid_until TEXT NOT NULL, evidence_ref TEXT NOT NULL, revision INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS settlements (
        scope TEXT PRIMARY KEY, binding TEXT NOT NULL, effect_id TEXT NOT NULL UNIQUE,
        receipt_id TEXT NOT NULL UNIQUE, nonce TEXT NOT NULL UNIQUE,
        idempotency_scope TEXT NOT NULL UNIQUE,
        committed_at TEXT NOT NULL, standing_revision INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS receiver_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL,
        scope TEXT, recorded_at TEXT NOT NULL, detail TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receiver_prepared_attempts (
        attempt_id TEXT PRIMARY KEY, scope TEXT NOT NULL, binding TEXT NOT NULL,
        receipt_id TEXT NOT NULL, standing_revision INTEGER NOT NULL);`);
  }
  close() { this.db.close(); }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  now() {
    const now = this.clock();
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('invalid_receiver_clock');
    return now;
  }
  check(request) {
    const check = verifyHarmonicExecutionRequest({ ...request,
      receiptPublicKeyPem: this.publicKeyPem, expectedService: this.service,
      now: this.now(), clockSkewSeconds: 0 });
    if (!check.ok) return check;
    const r = check.receipt;
    const operationId = request.execute?.payment_id;
    const required = [r.client_id, r.application_id, r.actor_id, r.action,
      r.intent_hash, r.authority_state_hash, r.policy_state_hash,
      r.receipt_id, r.nonce, r.idempotency_key, operationId];
    if (required.some(x => typeof x !== 'string' || !x.trim())) return { ok: false, reason: 'missing_receiver_binding' };
    if (r.action !== request.execute.action) return { ok: false, reason: 'receipt_action_mismatch' };
    // Business identity survives fresh receipt/nonces and changed idempotency keys.
    const scope = JSON.stringify([r.client_id, r.application_id, r.tenant_id || null, r.service, operationId]);
    const binding = JSON.stringify([check.executeHash, r.actor_id, r.action, r.intent_hash,
      r.authority_state_hash, r.policy_state_hash]);
    return { ...check, scope, binding };
  }
  event(kind, scope, detail) {
    return this.db.prepare('INSERT INTO receiver_events(kind,scope,recorded_at,detail) VALUES(?,?,?,?)')
      .run(kind, scope || null, this.now().toISOString(), JSON.stringify(detail)).lastInsertRowid;
  }
  // Trusted administrative ingestion of CURRENT authoritative evidence, not a
  // method callable with only an untrusted receipt. Evidence freshness is bounded.
  establishStanding({ receiptHeader, execute, validUntil, evidenceRef, expectedRevision, resolvesChallenge }) {
    return this.transaction(() => {
      const checked = this.check({ receiptHeader, execute });
      if (!checked.ok) throw new Error(checked.reason);
      const existing = this.db.prepare('SELECT revision,active,evidence_ref FROM standing WHERE scope=?').get(checked.scope);
      if (!Number.isInteger(expectedRevision) || expectedRevision < 0 || expectedRevision !== (existing?.revision || 0)) throw new Error('standing_revision_conflict');
      if (existing?.active === 2 && resolvesChallenge !== existing.evidence_ref) throw new Error('challenge_resolution_required');
      const expiry = new Date(validUntil);
      if (!Number.isFinite(expiry.getTime()) || expiry <= this.now() || typeof evidenceRef !== 'string' || !evidenceRef.trim()) throw new Error('current_standing_evidence_required');
      this.db.prepare(`INSERT INTO standing VALUES(?,?,1,?,?,1)
        ON CONFLICT(scope) DO UPDATE SET binding=excluded.binding,active=1,
        valid_until=excluded.valid_until,evidence_ref=excluded.evidence_ref,revision=standing.revision+1`)
        .run(checked.scope, checked.binding, expiry.toISOString(), evidenceRef);
      this.event('STANDING_ESTABLISHED', checked.scope, { evidence_ref: evidenceRef, valid_until: expiry.toISOString(), resolves_challenge: resolvesChallenge });
      return { ok: true };
    });
  }
  // Trusted revocation ingestion uses the business scope, including after expiry.
  revoke({ clientId, applicationId, tenantId = null, paymentId, evidenceRef }) {
    if ([clientId, applicationId, paymentId, evidenceRef].some(x => typeof x !== 'string' || !x.trim())) throw new Error('revocation_evidence_required');
    const scope = JSON.stringify([clientId, applicationId, tenantId, this.service, paymentId]);
    return this.transaction(() => {
      this.db.prepare(`INSERT INTO standing VALUES(?,'',0,'1970-01-01T00:00:00.000Z',?,1)
        ON CONFLICT(scope) DO UPDATE SET active=0,evidence_ref=excluded.evidence_ref,revision=standing.revision+1`)
        .run(scope, evidenceRef);
      this.event('STANDING_REVOKED', scope, { evidence_ref: evidenceRef });
      return { ok: true };
    });
  }
  // Trusted admission. This takes the same writer lock as settlement.
  admitChallenge({ clientId, applicationId, tenantId = null, paymentId, evidenceRef, expectedRevision }) {
    if ([clientId, applicationId, paymentId, evidenceRef].some(x => typeof x !== 'string' || !x.trim())) throw new Error('challenge_evidence_required');
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1) throw new Error('standing_revision_conflict');
    const scope = JSON.stringify([clientId, applicationId, tenantId, this.service, paymentId]);
    return this.transaction(() => {
      const result = this.db.prepare('UPDATE standing SET active=2,evidence_ref=?,revision=revision+1 WHERE scope=? AND revision=? AND active=1')
        .run(evidenceRef, scope, expectedRevision);
      if (!result.changes) throw new Error('standing_revision_conflict');
      return { sequence: this.event('CHALLENGE_EFFECTIVE', scope, { evidence_ref: evidenceRef, revision: expectedRevision + 1 }) };
    });
  }
  prepareAttempt(request) {
    return this.transaction(() => {
      const c = this.check(request);
      if (!c.ok) throw new Error(c.reason);
      const standing = this.db.prepare('SELECT * FROM standing WHERE scope=?').get(c.scope);
      if (standing?.active !== 1 || standing.binding !== c.binding || new Date(standing.valid_until) <= this.now()) {
        throw new Error('current_standing_not_established');
      }
      const attemptId = randomUUID();
      this.db.prepare('INSERT INTO receiver_prepared_attempts VALUES(?,?,?,?,?)')
        .run(attemptId, c.scope, c.binding, c.receipt.receipt_id, standing.revision);
      this.event('ATTEMPT_PREPARED', c.scope, { attempt_id: attemptId, standing: 'Preserved', standing_revision: standing.revision });
      return attemptId;
    });
  }
  commit(request, { preparedAttemptId } = {}) {
    return this.transaction(() => {
      // Verification happens AFTER acquiring the same write lock used by revocation.
      const c = this.check(request);
      let attemptId = randomUUID();
      const reject = (reason, standing) => {
        this.event('REJECTED', c.scope, { reason, attempt_id: attemptId, standing });
        return { ok: false, status: 'REJECTED', reason, attempt_id: attemptId };
      };
      if (!c.ok) return reject(c.reason);
      const prepared = preparedAttemptId == null ? null
        : this.db.prepare('SELECT * FROM receiver_prepared_attempts WHERE attempt_id=?').get(preparedAttemptId);
      if (preparedAttemptId != null) {
        if (!prepared || prepared.scope !== c.scope || prepared.binding !== c.binding ||
          prepared.receipt_id !== c.receipt.receipt_id) return reject('invalid_prepared_attempt');
        attemptId = preparedAttemptId;
        this.db.prepare('DELETE FROM receiver_prepared_attempts WHERE attempt_id=?').run(attemptId);
      }
      const prior = this.db.prepare('SELECT * FROM settlements WHERE scope=?').get(c.scope);
      if (prior) {
        if (prior.binding !== c.binding) return reject('payment_binding_conflict');
        this.event('DUPLICATE', c.scope, { effect_id: prior.effect_id, attempt_id: attemptId });
        return { ok: true, status: 'ALREADY_COMMITTED', effect_id: prior.effect_id, committed_at: prior.committed_at };
      }
      if (this.db.prepare('SELECT 1 FROM settlements WHERE receipt_id=? OR nonce=?').get(c.receipt.receipt_id, c.receipt.nonce)) return reject('receipt_already_consumed');
      const idempotencyScope = JSON.stringify([c.receipt.client_id, c.receipt.application_id, c.receipt.tenant_id || null, this.service, c.receipt.idempotency_key]);
      if (this.db.prepare('SELECT 1 FROM settlements WHERE idempotency_scope=?').get(idempotencyScope)) return reject('idempotency_key_conflict');
      const standing = this.db.prepare('SELECT * FROM standing WHERE scope=?').get(c.scope);
      if (standing?.active === 2) {
        const interrupted = prepared && prepared.standing_revision < standing.revision;
        const status = interrupted ? 'ABORTED' : 'HELD';
        this.event(status, c.scope, { attempt_id: attemptId, standing: 'Unresolved',
          evidence_ref: standing.evidence_ref, standing_revision: standing.revision });
        return { ok: false, status, reason: 'effective_material_challenge', attempt_id: attemptId };
      }
      if (!standing || standing.active !== 1) return reject('current_standing_not_established');
      if (standing.binding !== c.binding) {
        return reject('standing_binding_mismatch', 'Defeated');
      }
      if (new Date(standing.valid_until) <= this.now()) return reject('standing_evidence_expired');
      const effectId = `synthetic_${randomUUID()}`;
      const committedAt = this.now().toISOString();
      this.db.prepare('INSERT INTO settlements VALUES(?,?,?,?,?,?,?,?)').run(c.scope, c.binding,
        effectId, c.receipt.receipt_id, c.receipt.nonce, idempotencyScope, committedAt, standing.revision);
      this.event('COMMITTED', c.scope, { effect_id: effectId, receipt_id: c.receipt.receipt_id, standing_revision: standing.revision, standing: 'Preserved', attempt_id: attemptId });
      return { ok: true, status: 'COMMITTED', effect_id: effectId, committed_at: committedAt, attempt_id: attemptId };
    });
  }
  // Read-only reconciliation, including expired receipts or unknown transport outcomes.
  reconcile({ clientId, applicationId, tenantId = null, paymentId }) {
    const scope = JSON.stringify([clientId, applicationId, tenantId, this.service, paymentId]);
    const row = this.db.prepare('SELECT effect_id,committed_at FROM settlements WHERE scope=?').get(scope);
    return row ? { status: 'COMMITTED', ...row } : { status: 'NOT_FOUND_AT_READ' };
  }
}
module.exports = { HarmonicSqliteReceiver };
