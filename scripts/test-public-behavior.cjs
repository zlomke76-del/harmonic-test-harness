const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { generateKeyPairSync, sign, createHash } = require('node:crypto');

// Execute route exports, not string assertions. No external service or key required.
function load(relative) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled, filename);
  return mod.exports;
}
function stable(v) {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])]));
  return v;
}
const canon = v => JSON.stringify(stable(v));
const hash = v => createHash('sha256').update(canon(v)).digest('hex');

(async () => {
  const original = { ...process.env };
  try {
    const { requireHostedAccess } = load('lib/hosted-access.ts');
    const req = (auth, origin) => new Request('https://harness.example/api/compare', {
      method: 'POST', headers: { ...(auth ? { authorization: auth } : {}), ...(origin ? { origin } : {}) }
    });
    delete process.env.HARNESS_ACCESS_PASSWORD;
    for (const mode of ['development', 'production']) {
      process.env.NODE_ENV = mode;
      assert.equal(requireHostedAccess(req()), null);
      assert.equal(requireHostedAccess(req(undefined, 'https://harness.example')), null);
      assert.equal(requireHostedAccess(req(undefined, 'https://attacker.example')).status, 403);
    }
    process.env.HARNESS_ACCESS_PASSWORD = 'obsolete-password-does-not-enable-a-gate';
    assert.equal(requireHostedAccess(req()), null);
    assert.equal(requireHostedAccess(new Request('https://harness.example/api/compare', {
      method: 'POST', headers: { 'sec-fetch-site': 'cross-site' }
    })).status, 403);

    const sink = load('app/api/synthetic-execution-sink/route.ts');
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    process.env.HARMONIC_SECURE_EXECUTION_PUBLIC_KEY_PEM = publicKey.export({ type: 'spki', format: 'pem' });
    const execute = { target: 'synthetic', amount: 1 };
    const now = Date.now();
    function receipt(overrides = {}) {
      const unsigned = { version: '1.0.0', decision: 'PERMIT', receipt_id: 'test', execute_hash: hash(execute), issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 60000).toISOString(), ...overrides };
      return { ...unsigned, signature: sign(null, Buffer.from(canon(unsigned)), privateKey).toString('base64') };
    }
    async function attempt(r, payload = execute) {
      const res = await sink.POST(new Request('https://harness.example/api/synthetic-execution-sink', {
        method: 'POST', headers: { 'content-type': 'application/json', ...(r === undefined ? {} : { 'x-harmonic-execution-receipt': Buffer.from(JSON.stringify(r)).toString('base64') }) },
        body: JSON.stringify({ execute: payload })
      }));
      return { status: res.status, body: await res.json() };
    }
    const valid = receipt();
    const success = await attempt(valid);
    assert.equal(success.status, 200);
    assert.equal(success.body.effect_observed, true);
    for (const [name, r, payload, status] of [
      ['receiptless', undefined, execute, 401],
      ['array receipt', [], execute, 401],
      ['primitive receipt', 5, execute, 401],
      ['forged', { ...valid, signature: Buffer.alloc(64, 7).toString('base64') }, execute, 403],
      ['refusal', receipt({ decision: 'REFUSE' }), execute, 403],
      ['payload tamper', valid, { ...execute, amount: 999 }, 403],
      ['expired one second ago', receipt({ expires_at: new Date(now - 1).toISOString() }), execute, 403],
      ['not yet valid', receipt({ issued_at: new Date(now + 5000).toISOString() }), execute, 403],
      ['reversed window', receipt({ expires_at: new Date(now - 2000).toISOString() }), execute, 403]
    ]) {
      const result = await attempt(r, payload);
      assert.equal(result.status, status, name);
      assert.notEqual(result.body.effect_observed, true, name);
    }
    process.env.HARMONIC_SECURE_EXECUTION_PUBLIC_KEY_PEM = 'invalid key';
    assert.equal((await attempt(valid)).status, 403);
    delete process.env.HARMONIC_SECURE_EXECUTION_PUBLIC_KEY_PEM;
    assert.equal((await attempt(valid)).status, 503);
    const examination = await load('app/api/v114-execution-boundary/route.ts').POST();
    const result = await examination.json();
    assert.equal(result.positive_control_passed, true);
    assert.equal(result.falsifier_triggered, false);
    assert.equal(result.consequence_count, 1);
    assert(result.cases.every(c => c.passed));
    console.log('Anonymous public access and actual synthetic receipt route behavior: PASS');
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
