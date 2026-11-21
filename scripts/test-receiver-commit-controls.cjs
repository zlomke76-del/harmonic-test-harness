'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const coreRoot = process.env.HARMONIC_CORE_ROOT;
const sdk = coreRoot ? path.resolve(coreRoot, 'sdk') : path.resolve(__dirname, '../sdk');
const extension = coreRoot ? '.js' : '.cjs';
const { HarmonicSqliteReceiver } = require(path.join(sdk, 'harmonic-sqlite-receiver' + extension));
const { verifyHarmonicExecutionRequest } = require(path.join(sdk, 'harmonic-secure-execution-verifier' + extension));

// Fixture-only signing for the synthetic ledger.
const canonicalize = value => JSON.stringify(value, (_, item) => {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]));
  }
  return item;
});
const computeHash = value => crypto.createHash('sha256').update(canonicalize(value)).digest('hex');
function signReceipt(receipt, key) {
  const signature = crypto.sign(null, Buffer.from(canonicalize(receipt)), key).toString('base64');
  return { ...receipt, signature };
}
const encodeReceiptHeader = receipt => Buffer.from(JSON.stringify(receipt)).toString('base64');

if (process.argv[2] === '--worker') {
  const fixture = JSON.parse(fs.readFileSync(process.argv[3]));
  const receiver = new HarmonicSqliteReceiver(fixture.config);
  const result = process.argv[4] === 'revoke' ? receiver.revoke(fixture.revocation) : receiver.commit(fixture.request);
  receiver.close();
  process.stdout.write(JSON.stringify(result));
} else {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harmonic-receiver-'));
  const pair = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const config = { filename: path.join(directory, 'receiver.sqlite'), publicKeyPem: pair.publicKey, service: 'payments' };
  let receiver = new HarmonicSqliteReceiver(config);
  const cases = [];
  function fixture(paymentId, changes = {}, executeChanges = {}) {
    const execute = { payment_id: paymentId, action: 'payments:settle', amount: 50, currency: 'USD', beneficiary: 'beneficiary-A', ...executeChanges };
    const now = Date.now();
    const receipt = { version: '1.0.0', decision: 'PERMIT', service: 'payments', client_id: 'customer-A', application_id: 'app-A',
      actor_id: 'actor-A', action: execute.action, intent_hash: computeHash('settle'), authority_state_hash: computeHash('standing-v1'),
      policy_state_hash: computeHash('policy-v1'), receipt_id: crypto.randomUUID(), nonce: crypto.randomUUID(),
      idempotency_key: crypto.randomUUID(), execute_hash: computeHash(execute),
      issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 60000).toISOString(), ...changes };
    return { execute, receiptHeader: encodeReceiptHeader(signReceipt(receipt, pair.privateKey)) };
  }
  const grant = request => receiver.establishStanding({ ...request, expectedRevision: receiver.db.prepare('SELECT revision FROM standing WHERE scope=?').get(receiver.check(request).scope)?.revision || 0, validUntil: new Date(Date.now() + 120000).toISOString(), evidenceRef: 'trusted-authority-record-1' });
  const revoke = paymentId => ({ clientId: 'customer-A', applicationId: 'app-A', paymentId, evidenceRef: 'revocation-record-1' });
  const run = (name, fn) => { fn(); cases.push(name); };
  try {
    run('missing current standing holds', () => assert.equal(receiver.commit(fixture('missing')).reason, 'current_standing_not_established'));
    const first = fixture('first');
    run('valid standing commits once', () => { grant(first); assert.equal(receiver.commit(first).status, 'COMMITTED'); });
    run('replay and fresh receipt suppress duplicate', () => {
      assert.equal(receiver.commit(first).status, 'ALREADY_COMMITTED');
      assert.equal(receiver.commit(fixture('first')).status, 'ALREADY_COMMITTED');
      assert.equal(receiver.db.prepare('SELECT count(*) AS n FROM settlements').get().n, 1);
    });
    run('new signed amount cannot reuse payment', () => assert.equal(receiver.commit(fixture('first', {}, { amount: 999 })).reason, 'payment_binding_conflict'));
    run('revoked receipt cannot settle despite unexpired signature', () => {
      const request = fixture('revoked'); grant(request); receiver.revoke(revoke('revoked'));
      assert.equal(receiver.commit(request).reason, 'current_standing_not_established');
    });
    run('stale administrative evidence cannot overwrite revocation', () => {
      const request = fixture('stale-grant'); grant(request); receiver.revoke(revoke('stale-grant'));
      assert.throws(() => receiver.establishStanding({ ...request, expectedRevision: 1,
        validUntil: new Date(Date.now() + 120000).toISOString(), evidenceRef: 'old-evidence' }), /standing_revision_conflict/);
    });
    run('idempotency key cannot authorize a different payment', () => {
      const receipt = JSON.parse(Buffer.from(first.receiptHeader, 'base64'));
      const request = fixture('key-reuse', { idempotency_key: receipt.idempotency_key }); grant(request);
      assert.equal(receiver.commit(request).reason, 'idempotency_key_conflict');
    });
    run('changed standing defeats old receipt', () => {
      const old = fixture('changed'); grant(old);
      grant(fixture('changed', { authority_state_hash: computeHash('standing-v2') }));
      assert.equal(receiver.commit(old).reason, 'standing_binding_mismatch');
    });
    run('unknown standing after evidence expiry holds', () => {
      const r = fixture('expired-evidence'); grant(r);
      receiver.db.prepare('UPDATE standing SET valid_until=? WHERE scope LIKE ?').run('2000-01-01T00:00:00.000Z', '%expired-evidence%');
      assert.equal(receiver.commit(r).reason, 'standing_evidence_expired');
    });
    run('tamper, deny and invalid clock fail closed in the SDK verifier', () => {
      const verify = verifyHarmonicExecutionRequest;
      const options = { ...first, receiptPublicKeyPem: pair.publicKey, expectedService: 'payments' };
      assert.equal(verify({ ...options, execute: { ...first.execute, amount: 999 } }).ok, false);
      assert.equal(verify({ ...options, receiptHeader: fixture('deny', { decision: 'DENY' }).receiptHeader }).reason, 'receipt_not_permit');
      assert.equal(verify({ ...options, now: new Date('invalid') }).ok, false);
      assert.equal(verify({ ...options, receiptPublicKeyPem: 'invalid' }).ok, false);
    });
    run('receipt nonce cannot authorize another payment', () => {
      const receipt = JSON.parse(Buffer.from(first.receiptHeader, 'base64'));
      const r = fixture('nonce-reuse', { nonce: receipt.nonce }); grant(r);
      assert.equal(receiver.commit(r).reason, 'receipt_already_consumed');
    });
    run('cross customer standing isolation', () => assert.equal(receiver.commit(fixture('first', { client_id: 'customer-B' })).reason, 'current_standing_not_established'));
    run('commit is rolled back when evidence write fails', () => {
      const r = fixture('rollback'); grant(r);
      receiver.db.exec("CREATE TRIGGER fail_commit_event BEFORE INSERT ON receiver_events WHEN NEW.kind='COMMITTED' BEGIN SELECT RAISE(ABORT,'injected failure'); END;");
      assert.throws(() => receiver.commit(r), /injected failure/);
      assert.equal(receiver.reconcile({ ...revoke('rollback') }).status, 'NOT_FOUND_AT_READ');
      receiver.db.exec('DROP TRIGGER fail_commit_event');
      assert.equal(receiver.commit(r).status, 'COMMITTED');
    });
    run('lost acknowledgment reconciles after restart', () => {
      const r = fixture('lost-ack'); grant(r); receiver.commit(r); // deliberately discard response
      receiver.close(); receiver = new HarmonicSqliteReceiver(config);
      assert.equal(receiver.reconcile(revoke('lost-ack')).status, 'COMMITTED');
      assert.equal(receiver.commit(fixture('lost-ack')).status, 'ALREADY_COMMITTED');
    });
    run('revocation after commit preserves history without new settlement', () => {
      receiver.revoke(revoke('first'));
      assert.equal(receiver.commit(first).status, 'ALREADY_COMMITTED');
    });
    async function worker(file, operation = 'commit') {
      return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [__filename, '--worker', file, operation]);
        let out = '', err = '';
        child.stdout.on('data', x => out += x); child.stderr.on('data', x => err += x);
        child.on('error', reject); child.on('exit', code => code ? reject(new Error(err)) : resolve(JSON.parse(out)));
      });
    }
    const concurrent = fixture('concurrent'); grant(concurrent);
    const file = path.join(directory, 'workers.json');
    fs.writeFileSync(file, JSON.stringify({ config, request: concurrent, revocation: revoke('concurrent') }));
    const results = await Promise.all(Array.from({ length: 6 }, () => worker(file)));
    assert.equal(results.filter(x => x.status === 'COMMITTED').length, 1);
    assert.equal(results.filter(x => x.status === 'ALREADY_COMMITTED').length, 5);
    cases.push('six concurrent processes commit exactly once');
    const race = fixture('race'); grant(race);
    fs.writeFileSync(file, JSON.stringify({ config, request: race, revocation: revoke('race') }));
    const [commit] = await Promise.all([worker(file), worker(file, 'revoke')]);
    assert.ok(['COMMITTED', 'REJECTED'].includes(commit.status));
    const events = receiver.db.prepare('SELECT kind FROM receiver_events WHERE scope LIKE ? ORDER BY sequence').all('%"race"%').map(x => x.kind);
    if (commit.status === 'COMMITTED') assert.ok(events.indexOf('COMMITTED') < events.indexOf('STANDING_REVOKED'));
    else assert.ok(events.indexOf('STANDING_REVOKED') < events.indexOf('REJECTED'));
    assert.ok(['ALREADY_COMMITTED', 'REJECTED'].includes(receiver.commit(race).status));
    cases.push('revocation and commit serialize across processes');
    function examineChallenge(paymentId, superseded) {
      const request = fixture(paymentId);
      grant(request);
      const scope = receiver.check(request).scope;
      const events = () => receiver.db.prepare('SELECT sequence,kind,detail FROM receiver_events WHERE scope=? ORDER BY sequence')
        .all(scope).map(row => ({ ...row, ...JSON.parse(row.detail) }));
      const attemptA = receiver.prepareAttempt(request);
      const challenge = { ...revoke(paymentId), expectedRevision: 1, evidenceRef: 'material-challenge' };
      const other = new HarmonicSqliteReceiver(config);
      try { other.admitChallenge(challenge); } finally { other.close(); }
      const outcomeA = receiver.commit(request, { preparedAttemptId: attemptA });
      assert.equal(outcomeA.status, 'ABORTED');
      assert.equal(outcomeA.attempt_id, attemptA);
      const outcomeB = receiver.commit(request);
      assert.equal(outcomeB.status, 'HELD');
      const admitted = events().find(row => row.kind === 'CHALLENGE_EFFECTIVE');
      const aborted = events().find(row => row.attempt_id === attemptA && row.kind === 'ABORTED');
      assert.equal(aborted.evidence_ref, admitted.evidence_ref);
      assert.ok(events().find(row => row.kind === 'ATTEMPT_PREPARED').sequence < admitted.sequence);
      assert.ok(admitted.sequence < aborted.sequence);
      const held = events().find(row => row.attempt_id === outcomeB.attempt_id);
      assert.equal(held.standing, 'Unresolved');
      assert.equal(held.standing_revision, admitted.revision);
      assert.equal(receiver.reconcile(revoke(paymentId)).status, 'NOT_FOUND_AT_READ');

      const control = fixture(paymentId + '-independent');
      grant(control);
      assert.equal(receiver.commit(control).status, 'COMMITTED');

      const current = superseded ? fixture(paymentId, { actor_id: 'actor-B', authority_state_hash: computeHash('team-B') }) : request;
      assert.deepEqual(current.execute, request.execute);
      const adjudication = { ...current, expectedRevision: 2, validUntil: new Date(Date.now() + 120000).toISOString(),
        evidenceRef: 'competent-adjudication' };
      assert.throws(() => receiver.establishStanding(adjudication), /challenge_resolution_required/);
      receiver.establishStanding({ ...adjudication, resolvesChallenge: challenge.evidenceRef });
      if (superseded) {
        const denied = receiver.commit(request);
        assert.equal(denied.status, 'REJECTED');
        assert.equal(events().find(row => row.attempt_id === denied.attempt_id).standing, 'Defeated');
        assert.equal(receiver.reconcile(revoke(paymentId)).status, 'NOT_FOUND_AT_READ');
      }
      const resumed = receiver.commit(current);
      assert.equal(resumed.status, 'COMMITTED');
      const writes = events().filter(row => row.kind === 'COMMITTED');
      assert.deepEqual(writes.map(row => row.attempt_id), [resumed.attempt_id]);
      assert.equal(writes[0].standing, 'Preserved');
      assert.equal(writes[0].standing_revision, 3);
      const ledger = receiver.db.prepare('SELECT effect_id,standing_revision FROM settlements WHERE scope=?').all(scope);
      assert.deepEqual(ledger.map(row => row.effect_id), [writes[0].effect_id]);
      assert.equal(ledger[0].standing_revision, writes[0].standing_revision);
    }
    run('challenge aborts A, holds B and permits C after confirmation', () => examineChallenge('challenge-primary', false));
    run('superseded approval denied and alternate authority commits once', () => examineChallenge('challenge-alternate', true));
    run('commit before effective challenge retains exactly one settlement', () => {
      const request = fixture('challenge-after-commit');
      grant(request);
      assert.equal(receiver.commit(request).status, 'COMMITTED');
      receiver.admitChallenge({ ...revoke('challenge-after-commit'), expectedRevision: 1 });
      assert.equal(receiver.commit(request).status, 'ALREADY_COMMITTED');
      const scope = receiver.check(request).scope;
      const events = receiver.db.prepare("SELECT kind FROM receiver_events WHERE scope=? ORDER BY sequence").all(scope);
      assert.deepEqual(events.map(row => row.kind), ['STANDING_ESTABLISHED', 'COMMITTED', 'CHALLENGE_EFFECTIVE', 'DUPLICATE']);
    });
    console.log(JSON.stringify({ suite: 'receiver implementation regression tests; not Arkaya examination', passed: cases.length, cases }, null, 2));
  } finally { receiver.close(); fs.rmSync(directory, { recursive: true, force: true }); }
}
