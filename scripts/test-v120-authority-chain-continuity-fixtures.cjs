const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const util = require('util');
const { constituteV120 } = require('./v120-pack-reference.cjs');

const root = 'fixtures/v120-authority-chain-continuity';
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

assert(freeze.status === 'PROSPECTIVE_FROZEN_EXAMINATION', 'V120 must remain prospective before live execution');
assert(freeze.red_team_id === 'RED TEAM 004', 'V120 must preserve RED TEAM 004 identity');
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
  assert(responsibility.allowed_pair_differences.some((rootPath) => diff === rootPath || diff.startsWith(`${rootPath}/`)), `unfrozen V120 input difference: ${diff}`);
}
for (const p of responsibility.frozen_non_chain_dimensions) {
  const key = p.slice(1);
  assert(stable(aIn[key]) === stable(bIn[key]), `${p} changed across frozen pair`);
}

// R0 is frozen and external to the falsifier. The two intermediate artifacts are byte-equivalent.
assert(aIn.root_trust_anchor.anchor_id === 'R0' && aIn.root_trust_anchor.outside_falsifier === true, 'R0 must be frozen outside the falsifier');
assert(stable(aIn.root_trust_anchor) === stable(bIn.root_trust_anchor), 'R0 changed across pair');
assert(stable(aIn.intermediate_delegation_b_to_c) === stable(bIn.intermediate_delegation_b_to_c), 'B-to-C delegation must be byte-equivalent across pair');
assert(stable(aIn.authority_instrument_c) === stable(bIn.authority_instrument_c), 'C authority instrument must be byte-equivalent across pair');
assert(aIn.intermediate_delegation_b_to_c.signature.status === 'valid', 'B-to-C delegation signature must remain valid');
assert(aIn.intermediate_delegation_b_to_c.record_status === 'current', 'B-to-C delegation must remain current');
assert(aIn.authority_instrument_c.signature.status === 'valid', 'C authority instrument signature must remain valid');
assert(aIn.authority_instrument_c.record_status === 'current', 'C authority instrument must remain current');
assert(aIn.authority_instrument_c.freshness?.status === 'current', 'C authority instrument freshness must remain current');
assert(stable(aIn.authority_instrument_c.freshness) === stable(bIn.authority_instrument_c.freshness), 'C authority instrument freshness must be byte-equivalent across pair');

for (const [label, input, expected, packet] of [
  ['case-a', aIn, aOut, aPacket],
  ['case-b', bIn, bOut, bPacket],
]) {
  const actual = constituteV120(input);
  assert(util.isDeepStrictEqual(actual, expected), `${label}: executable Pack reference does not match frozen output`);
  assert(packet.specialty_pack_evidence.intermediate_delegation_content_valid === true, `${label}: B-to-C artifact validity must remain preserved`);
  assert(packet.specialty_pack_evidence.authority_instrument_content_valid === true, `${label}: C artifact validity must remain preserved`);
  assert(packet.specialty_pack_evidence.root_anchor_outside_falsifier === true, `${label}: R0 freeze witness missing`);
  assert(packet.specialty_pack_evidence.anti_circularity_satisfied === true, `${label}: anti-circularity witness missing`);
  assert(packet.governing_basis.case_specific_constitutional_answer_supplied === false, `${label}: packet preloads constitutional answer`);
  assert(packet.state_transition.attributable_source === 'federation-domain-pack@1.3.0-v120', `${label}: transition attribution drifted`);
  const expectedRelationship = label === 'case-a' ? 'consistent_with_prior_state' : 'invalidates_prior_state';
  assert(packet.state_transition.relationship === expectedRelationship, `${label}: Harmonic transition relationship drifted`);
  assert(!Object.prototype.hasOwnProperty.call(packet.state_transition, 'prior_state_status'), `${label}: prior_state_status would preload a case-specific constitutional answer`);
  assert(!Object.prototype.hasOwnProperty.call(packet.state_transition, 'revalidation_required'), `${label}: revalidation_required would preload a case-specific constitutional answer`);
  const packetText = JSON.stringify(packet);
  assert(!/\"(?:prior_state_status|revalidation_required|standing_status|standing_preserved|standing_defeated|admissibility_status|expected_decision|expected_outcome)\"/i.test(packetText), `${label}: banned constitutional-answer field present upstream`);
  assert(!/\b(?:admissible|inadmissible|permit(?:ted)?|den(?:y|ied)|allow(?:ed)?|block(?:ed)?)\b/i.test(packetText), `${label}: case-specific constitutional disposition appears upstream`);
}

assert(aOut.constitution_status === 'CONSTITUTED', 'Case A must constitute when R0 -> B -> C is currently intact');
assert(aOut.authority_chain_status === 'INTACT', 'Case A authority chain must be intact');
assert(aOut.governing_source_id === 'execution-region-registry-a', 'Case A must admit C instrument and select Source A');
assert(aOut.relationship === 'consistent', 'Case A must use canonical preserving domain relationship');

assert(bOut.intermediate_delegation_content_valid === true, 'Case B B-to-C artifact must remain valid');
assert(bOut.authority_instrument_content_valid === true, 'Case B C artifact must remain valid');
assert(bOut.root_to_intermediate_standing === 'NON_GOVERNING_SUPERSEDED', 'Case B must change only higher-order R0-to-B empowerment standing');
assert(bOut.authority_chain_status === 'BROKEN_UPSTREAM_EMPOWERMENT', 'Case B must detect the broken upstream authority path');
assert(bOut.constitution_status === 'UNRESOLVED_AUTHORITY_CHAIN', 'Case B must not treat valid intermediate artifacts as a current authority chain');
assert(bOut.governing_source_id === null && bOut.proposition_value === null, 'Case B must not silently select a governing source through the broken chain');
assert(bOut.relationship === 'invalidates_prior_state', 'Case B must emit a canonical defeating relationship');

// Anti-circularity is substantive: the artifacts whose continuity is being tested cannot attest to R0 -> B standing.
for (const input of [aIn, bIn]) {
  const rootEvidence = input.authority_path_state.root_to_intermediate.standing_evidence;
  assert(rootEvidence.self_asserted === false, 'R0-to-B standing may not be self-asserted');
  assert(rootEvidence.source_id === input.root_trust_anchor.evidence_source_id, 'R0-to-B standing must come from the frozen external root evidence source');
  assert(rootEvidence.source_id !== input.intermediate_delegation_b_to_c.provenance.attributable_source, 'B-to-C delegation cannot bootstrap upstream chain continuity');
  assert(rootEvidence.source_id !== input.authority_instrument_c.provenance.attributable_source, 'C instrument cannot bootstrap upstream chain continuity');
}

// Keep executor authority, consequence, obligation, safeguards and governing rule fixed downstream.
for (const key of ['requested_action', 'authority_chain', 'revocation_state', 'relational_rule', 'governing_basis', 'obligation_witness', 'consequence_profile', 'safeguards']) {
  assert(stable(aPacket[key]) === stable(bPacket[key]), `${key} differs across Harmonic pair`);
}
assert(aPacket.packet_id !== bPacket.packet_id, 'packet IDs must be unique');

for (const file of fs.readdirSync(root).filter((x) => x.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(root, file));
  console.log(`${file} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`);
}
console.log('V120 / RED TEAM 004 Valid Authority Artifact vs Current Authority-Chain Continuity fixtures: PASS');
console.log('Primary criterion: unchanged valid intermediate artifacts do not remain governing after the current R0 -> B empowerment path breaks.');
console.log('Harmonic replay is secondary and cannot rescue an incorrect Pack constitution.');
