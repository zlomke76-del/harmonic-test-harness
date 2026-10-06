const fs = require('fs');
const path = require('path');
const util = require('util');
const { constituteV121 } = require('./v121-pack-reference.cjs');

const root = 'fixtures/v121-authority-scope-sufficiency';
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const assert = (value, message) => { if (!value) throw new Error(message); };
const stable = (value) => JSON.stringify(value);

const freeze = read('freeze.json');
const responsibility = read('responsibility-map.json');
const aIn = read('case-a-specialty-input.json');
const bIn = read('case-b-specialty-input.json');
const aOut = read('case-a-specialty-output.json');
const bOut = read('case-b-specialty-output.json');
const aPacket = read('case-a-harmonic-packet.json');
const bPacket = read('case-b-harmonic-packet.json');

assert(freeze.status === 'PROSPECTIVE_FROZEN_EXAMINATION', 'V121 must remain prospective before live execution');
assert(freeze.red_team_id === 'RED TEAM 005', 'V121 must preserve RED TEAM 005 identity');
assert(freeze.distinction === 'Authority-chain continuity is not equivalent to consequence-specific scope sufficiency.', 'frozen distinction changed');
assert(freeze.no_further_reasoning_before_execution === true, 'no-further-reasoning rule must be frozen');
assert(freeze.no_post_result_rescue === true, 'no-rescue rule must be frozen');
assert(freeze.no_post_result_reinterpretation === true, 'no-reinterpretation rule must be frozen');
assert(freeze.no_post_result_ownership_shift === true, 'no-ownership-shift rule must be frozen');
assert(responsibility.forbidden_reclassification_after_run === true, 'post-run reclassification must be forbidden');
assert(responsibility.forbidden_ownership_shift_after_run === true, 'post-run ownership shift must be forbidden');

function diffPaths(x, y, current = '') {
  if (stable(x) === stable(y)) return [];
  if (Array.isArray(x) || Array.isArray(y) || !x || !y || typeof x !== 'object' || typeof y !== 'object') return [current || '/'];
  const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].sort();
  return keys.flatMap((key) => diffPaths(x[key], y[key], `${current}/${key}`));
}

for (const diff of diffPaths(aIn, bIn)) {
  assert(responsibility.allowed_pair_differences.some((rootPath) => diff === rootPath || diff.startsWith(`${rootPath}/`)), `unfrozen V121 input difference: ${diff}`);
}
for (const p of responsibility.frozen_non_scope_dimensions) {
  const key = p.slice(1);
  assert(stable(aIn[key]) === stable(bIn[key]), `${p} changed across frozen pair`);
}

// The chain itself is fixed and valid. Only the effective delegated scope changes.
assert(stable(aIn.root_trust_anchor) === stable(bIn.root_trust_anchor), 'R0 changed across pair');
assert(stable(aIn.root_to_intermediate) === stable(bIn.root_to_intermediate), 'R0-to-B authority changed across pair');
assert(stable(aIn.intermediate_delegation_b_to_c) === stable(bIn.intermediate_delegation_b_to_c), 'B-to-C delegation instrument changed across pair');
assert(stable(aIn.authority_instrument_c) === stable(bIn.authority_instrument_c), 'C authority instrument changed across pair');
assert(aIn.root_to_intermediate.standing_state === 'GOVERNING' && bIn.root_to_intermediate.standing_state === 'GOVERNING', 'R0-to-B must remain governing in both cases');
assert(aIn.intermediate_delegation_b_to_c.record_status === 'current' && bIn.intermediate_delegation_b_to_c.record_status === 'current', 'B-to-C instrument must remain current');
assert(aIn.authority_instrument_c.record_status === 'current' && bIn.authority_instrument_c.record_status === 'current', 'C authority instrument must remain current');
assert(aIn.intermediate_delegation_b_to_c.signature.status === 'valid' && bIn.intermediate_delegation_b_to_c.signature.status === 'valid', 'B-to-C signature must remain valid');
assert(aIn.authority_instrument_c.signature.status === 'valid' && bIn.authority_instrument_c.signature.status === 'valid', 'C signature must remain valid');
assert(aIn.consequence.scope_id === bIn.consequence.scope_id && aIn.consequence.consequence_id === bIn.consequence.consequence_id, 'exact consequence changed across pair');

// No precomputed scope verdict is allowed in Pack input.
for (const input of [aIn, bIn]) {
  const serialized = stable(input);
  assert(!serialized.includes('scope_insufficient'), 'precomputed scope_insufficient flag smuggled into Pack input');
  assert(!serialized.includes('exact_scope_sufficient'), 'precomputed exact_scope_sufficient verdict smuggled into Pack input');
  assert(!serialized.includes('UNRESOLVED_AUTHORITY_SCOPE'), 'case-specific constitutional answer smuggled into Pack input');
}

for (const [label, input, expected, packet] of [
  ['case-a', aIn, aOut, aPacket],
  ['case-b', bIn, bOut, bPacket],
]) {
  const actual = constituteV121(input);
  assert(util.isDeepStrictEqual(actual, expected), `${label}: executable Pack reference does not match frozen output`);
  assert(actual.authority_chain_status === 'INTACT', `${label}: authority chain must remain intact`);
  assert(actual.intermediate_delegation_content_valid === true, `${label}: B-to-C delegation must remain valid`);
  assert(actual.authority_instrument_content_valid === true, `${label}: C authority artifact must remain valid`);
  assert(actual.child_scope_within_parent === true, `${label}: child scope must not exceed parent authority`);
  assert(actual.child_scope_within_delegation_ceiling === true, `${label}: effective scope must remain within delegation ceiling`);
  assert(packet.specialty_pack_evidence.authority_chain_status === 'INTACT', `${label}: Harmonic packet must preserve intact-chain witness`);
  assert(packet.governing_basis.case_specific_constitutional_answer_supplied === false, `${label}: Harmonic packet must preserve no-answer-smuggling marker`);
}

assert(aOut.constitution_status === 'CONSTITUTED', 'Case A must constitute normally');
assert(aOut.exact_scope_sufficient === true, 'Case A exact scope must be sufficient');
assert(aOut.governing_source_id === 'execution-region-registry-a', 'Case A must select Source A');
assert(aOut.proposition_value === 'EU-WEST', 'Case A must preserve proposition value');

assert(bOut.constitution_status === 'UNRESOLVED_AUTHORITY_SCOPE', 'Case B must become unresolved on exact authority scope');
assert(bOut.exact_scope_sufficient === false, 'Case B exact scope must be insufficient');
assert(bOut.authority_chain_status === 'INTACT', 'Case B must not misclassify the chain as broken');
assert(bOut.proposition_value === null, 'Case B must clear proposition value');
assert(bOut.governing_source_id === null, 'Case B must clear governing source for affected consequence');
assert(bOut.effective_consequence_scope.includes('consequence-j'), 'Case B must preserve unaffected consequence authority');
assert(!bOut.effective_consequence_scope.includes('consequence-k'), 'Case B must not preserve removed Consequence K authority');
assert(bOut.effective_subscope.includes('scope-t'), 'Case B must preserve unaffected sub-scope authority');
assert(!bOut.effective_subscope.includes('scope-s'), 'Case B must not preserve removed Scope S authority');

assert(aPacket.understanding_state.current === true && aPacket.understanding_state.complete === true, 'Case A Harmonic witness must carry established constituted state');
assert(bPacket.understanding_state.current === false && bPacket.understanding_state.complete === false, 'Case B Harmonic witness must carry unresolved constituted state');
assert(bPacket.state_transition.relationship === 'invalidates_prior_state', 'Case B downstream witness must preserve invalidating transition');
assert(bPacket.specialty_pack_evidence.constitution_status === 'UNRESOLVED_AUTHORITY_SCOPE', 'Case B packet must preserve Pack scope finding');

console.log('V121 / RED TEAM 005 fixture integrity: PASS');
console.log('Frozen distinction: authority-chain continuity != consequence-specific scope sufficiency');
console.log('Case A: chain intact + Scope S / Consequence K covered -> CONSTITUTED');
console.log('Case B: chain intact + current B-to-C scope narrowed -> UNRESOLVED_AUTHORITY_SCOPE');
console.log('No precomputed scope-insufficient flag supplied; Pack derives the exact-scope mismatch.');
