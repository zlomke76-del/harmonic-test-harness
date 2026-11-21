'use strict';
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = process.argv[2];
if (!root) throw new Error('Usage: npm run test:receiver-alignment -- /path/to/harmonic-core');
const coreRoot = path.resolve(root);
const harnessSdk = path.resolve(__dirname, '../sdk');

for (const name of ['harmonic-sqlite-receiver', 'harmonic-secure-execution-verifier']) {
  const core = readFileSync(path.join(coreRoot, 'sdk', name + '.js'), 'utf8');
  const harness = readFileSync(path.join(harnessSdk, name + '.cjs'), 'utf8');
  const expected = core.replace(
    "require('./harmonic-secure-execution-verifier')",
    "require('./harmonic-secure-execution-verifier.cjs')"
  );
  assert.equal(harness, expected, name + ' differs from Harmonic core');
}

const suite = path.join(__dirname, 'test-receiver-commit-controls.cjs');
for (const [label, core] of [['Harness SDK', ''], ['Harmonic core SDK', coreRoot]]) {
  console.log(label);
  execFileSync(process.execPath, [suite], {
    stdio: 'inherit',
    env: { ...process.env, HARMONIC_CORE_ROOT: core }
  });
}
console.log('Receiver alignment: PASS');
