const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(process.cwd(), 'app/api/synthetic-execution-sink/route.ts'), 'utf8');

// V114 harness-side regression: the synthetic consequence boundary must not
// contain an unverified success path. Behavioral falsification lives in the
// Harmonic core V114 test; this protects the harness boundary from drift.
assert(src.includes('missing_or_invalid_harmonic_execution_receipt'), 'sink must reject receiptless execution');
assert(src.includes('receipt_not_execution_permit'), 'sink must require PERMIT decision');
assert(src.includes('receipt_outside_validity_window'), 'sink must reject stale/not-yet-valid receipts');
assert(src.includes('invalid_receipt_signature'), 'sink must verify Harmonic signature');
assert(src.includes('execute_hash_mismatch'), 'sink must bind the exact execute payload');

const effectIndex = src.indexOf('effect_observed: true');
const sigIndex = src.indexOf('invalid_receipt_signature');
const hashIndex = src.indexOf('execute_hash_mismatch');
assert(effectIndex > sigIndex && effectIndex > hashIndex, 'effect must be constructed only after signature and payload verification');

console.log('V114 synthetic execution sink boundary regression: PASS');
