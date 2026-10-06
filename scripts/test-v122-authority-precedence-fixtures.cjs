const assert = require('assert');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { constituteV122 } = require('./v122-pack-reference.cjs');

const ROOT = path.join(__dirname, '..');
const FIX = path.join(ROOT, 'fixtures', 'v122-authority-precedence');
const read = (name) => JSON.parse(fs.readFileSync(path.join(FIX, name), 'utf8'));
const stable = (value) => JSON.stringify(value, Object.keys(value).sort());

const freeze = read('freeze.json');
const map = read('responsibility-map.json');
const aIn = read('case-a-specialty-input.json');
const bIn = read('case-b-specialty-input.json');
const aOut = read('case-a-specialty-output.json');
const bOut = read('case-b-specialty-output.json');
const aPacket = read('case-a-harmonic-packet.json');
const bPacket = read('case-b-harmonic-packet.json');

assert.strictEqual(freeze.red_team_id, 'RED TEAM 006');
assert.strictEqual(freeze.distinction, 'Authority validity is not equivalent to authority precedence.');
assert.ok(freeze.hard_rules.includes('Concurrent validity does not create precedence. Precedence must itself be constituted.'));
assert.ok(freeze.hard_rules.includes('Where no governing precedence relation exists, the Pack must not manufacture one from execution order or implementation convenience.'));
assert.ok(map.forbidden_proxies_for_precedence.includes('array_order'));
assert.ok(map.forbidden_proxies_for_precedence.includes('first_match'));

// Freeze all dimensions except specimen identity and constituted-precedence presence.
for (const key of ['specialty_pack','observed_at','consequence','domain_rule','root_trust_anchor','authority_paths']) {
  assert.deepStrictEqual(aIn[key], bIn[key], `${key} changed across the frozen pair`);
}
assert.strictEqual(aIn.precedence_relations.length, 1, 'Case A must contain exactly one prospectively constituted precedence relation');
assert.strictEqual(bIn.precedence_relations.length, 0, 'Case B must contain no governing precedence relation');

// Both concurrent authority paths must remain current, valid, exact-scope sufficient and conflicting.
for (const input of [aIn, bIn]) {
  assert.strictEqual(input.authority_paths.length, 2, 'exactly two authority paths required');
  const [p1,p2] = input.authority_paths;
  for (const p of [p1,p2]) {
    assert.strictEqual(p.root_to_intermediate.standing_state, 'GOVERNING');
    assert.strictEqual(p.intermediate_delegation.record_status, 'current');
    assert.strictEqual(p.intermediate_delegation.signature.status, 'valid');
    assert.strictEqual(p.authority_instrument.record_status, 'current');
    assert.strictEqual(p.authority_instrument.signature.status, 'valid');
    assert.ok(p.root_to_intermediate.proposition_scope.includes(input.consequence.proposition_id));
    assert.ok(p.root_to_intermediate.consequence_scope.includes(input.consequence.consequence_id));
    assert.ok(p.root_to_intermediate.subscope.includes(input.consequence.scope_id));
    assert.ok(p.intermediate_delegation.proposition_scope.includes(input.consequence.proposition_id));
    assert.ok(p.intermediate_delegation.consequence_scope.includes(input.consequence.consequence_id));
    assert.ok(p.intermediate_delegation.subscope.includes(input.consequence.scope_id));
  }
  const dispositions = input.authority_paths.map((p) => p.authority_instrument.statement.disposition).sort();
  assert.deepStrictEqual(dispositions, ['PERMIT','REFUSE']);
}

// No precomputed winner or proxy may be supplied to the Pack input.
for (const input of [aIn, bIn]) {
  const raw = JSON.stringify(input);
  for (const forbidden of ['"winner"','"priority"','"override"','"selected_authority"','"governing_authority_id"','"governing_path_id"','"constitution_status"']) {
    assert(!raw.includes(forbidden), `forbidden precomputed answer/proxy supplied: ${forbidden}`);
  }
}

// Executable Pack reference must reproduce frozen outputs exactly.
for (const [label,input,expected,packet] of [
  ['case-a',aIn,aOut,aPacket],
  ['case-b',bIn,bOut,bPacket],
]) {
  const actual = constituteV122(input);
  assert(util.isDeepStrictEqual(actual, expected), `${label}: executable Pack reference does not match frozen output`);
  assert.strictEqual(actual.concurrent_paths_valid, true, `${label}: both paths must remain valid`);
  assert.strictEqual(actual.concurrent_conflict_present, true, `${label}: real concurrent conflict must remain present`);
  assert.deepStrictEqual(actual.candidate_dispositions, ['PERMIT','REFUSE']);
  assert.strictEqual(packet.governing_basis.case_specific_constitutional_answer_supplied, false, `${label}: downstream packet must preserve no-answer-smuggling marker`);
}

assert.strictEqual(aOut.precedence_relation_status, 'CONSTITUTED_AND_APPLIED');
assert.strictEqual(aOut.constitution_status, 'CONSTITUTED_WITH_PRECEDENCE');
assert.strictEqual(aOut.precedence_rule_id, 'PRECEDENCE-122-CONSTITUTIONAL-OVER-LOCAL');
assert.strictEqual(aOut.proposition_value, 'PERMIT');
assert.strictEqual(aOut.governing_authority_id, 'authority-node-c1');
assert.strictEqual(aOut.governing_path_id, 'PATH-C1');

assert.strictEqual(bOut.precedence_relation_status, 'ABSENT_FOR_CONFLICT');
assert.strictEqual(bOut.constitution_status, 'UNRESOLVED_AUTHORITY_CONFLICT');
assert.strictEqual(bOut.proposition_value, null);
assert.strictEqual(bOut.governing_authority_id, null);
assert.strictEqual(bOut.governing_path_id, null);

// Order-independence is load-bearing: reversing candidate iteration order cannot change the constitutional result.
for (const [label,input,expected] of [['case-a',aIn,aOut],['case-b',bIn,bOut]]) {
  const reversed = JSON.parse(JSON.stringify(input));
  reversed.authority_paths.reverse();
  const actual = constituteV122(reversed);
  const scrub = (out) => ({...out, concurrent_authority_paths:[...out.concurrent_authority_paths].sort((x,y)=>x.path_id.localeCompare(y.path_id))});
  assert.deepStrictEqual(scrub(actual), scrub(expected), `${label}: result changed when candidate iteration order was reversed`);
}

assert.strictEqual(aPacket.understanding_state.current, true);
assert.strictEqual(aPacket.understanding_state.complete, true);
assert.strictEqual(aPacket.specialty_pack_evidence.constitution_status, 'CONSTITUTED_WITH_PRECEDENCE');
assert.strictEqual(bPacket.understanding_state.current, false);
assert.strictEqual(bPacket.understanding_state.complete, false);
assert.strictEqual(bPacket.state_transition.relationship, 'invalidates_prior_state');
assert.strictEqual(bPacket.specialty_pack_evidence.constitution_status, 'UNRESOLVED_AUTHORITY_CONFLICT');

console.log('V122 / RED TEAM 006 fixture integrity: PASS');
console.log('Frozen distinction: authority validity != authority precedence');
console.log('Case A: two valid conflicting paths + constituted precedence -> CONSTITUTED_WITH_PRECEDENCE');
console.log('Case B: two valid conflicting paths + no governing precedence -> UNRESOLVED_AUTHORITY_CONFLICT');
console.log('Candidate-order reversal preserves both results; no winner/priority/override answer is pre-supplied.');
