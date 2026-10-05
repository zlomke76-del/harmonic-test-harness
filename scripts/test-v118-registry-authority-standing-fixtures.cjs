const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const util = require('util');
const { constituteV118 } = require('./v118-pack-reference.cjs');

const root = 'fixtures/v118-registry-authority-standing';
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

assert(freeze.status === 'PROSPECTIVE_FROZEN_EXAMINATION', 'V118 must remain prospective before live execution');
assert(freeze.red_team_id === 'RED TEAM 003', 'V118 must preserve RED TEAM 003 identity');
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
  assert(responsibility.allowed_pair_differences.some((rootPath) => diff === rootPath || diff.startsWith(`${rootPath}/`)), `unfrozen V118 input difference: ${diff}`);
}
for (const p of responsibility.frozen_non_standing_dimensions) {
  const key = p.slice(1);
  assert(stable(aIn[key]) === stable(bIn[key]), `${p} changed across frozen pair`);
}
assert(stable(aIn.authority_registry_statement) === stable(bIn.authority_registry_statement), 'authority-registry statement must be byte-equivalent across pair');
assert(aIn.authority_registry_statement.signature.status === 'valid', 'registry statement must remain signed/valid');
assert(aIn.authority_registry_statement.record_status === 'current', 'registry statement must remain current');
assert(aIn.authority_registry_statement.provenance.integrity === 'preserved', 'registry statement provenance must remain intact');

for (const [label, input, expected, packet] of [
  ['case-a', aIn, aOut, aPacket],
  ['case-b', bIn, bOut, bPacket],
]) {
  const actual = constituteV118(input);
  assert(util.isDeepStrictEqual(actual, expected), `${label}: executable Pack reference does not match frozen output`);
  assert(packet.specialty_pack_evidence.registry_statement_content_valid === true, `${label}: packet must preserve record validity independently of issuer standing`);
  assert(packet.specialty_pack_evidence.anti_circularity_satisfied === true, `${label}: anti-circularity witness missing`);
  assert(packet.governing_basis.case_specific_constitutional_answer_supplied === false, `${label}: packet preloads constitutional answer`);
  assert(packet.state_transition.attributable_source === 'federation-domain-pack@1.2.0-v118', `${label}: transition attribution drifted`);
  assert(packet.state_transition.relationship === expected.relationship, `${label}: transition relationship must preserve Pack result`);
  assert(packet.state_transition.prior_state_status === (label === 'case-a' ? 'current' : 'non_current'), `${label}: canonical V3.8 prior-state status missing`);
  assert(packet.state_transition.revalidation_required === (label === 'case-b'), `${label}: canonical V3.8 revalidation flag incorrect`);
}

assert(aOut.constitution_status === 'CONSTITUTED', 'Case A must constitute from the valid statement of a standing issuer');
assert(aOut.governing_source_id === 'execution-region-registry-a', 'Case A must admit registry statement and select Source A');
assert(aOut.relationship === 'consistent', 'Case A must use canonical V3.8 preserving relationship');
assert(bOut.registry_statement_content_valid === true, 'Case B registry content must remain valid');
assert(bOut.registry_issuer_standing === 'NON_GOVERNING_SUPERSEDED', 'Case B issuer standing must be defeated independently');
assert(bOut.constitution_status === 'UNRESOLVED_AUTHORITY_STANDING', 'Case B must not treat valid record as valid governing authority');
assert(bOut.governing_source_id === null && bOut.proposition_value === null, 'Case B must not silently select a governing source from the disempowered statement');
assert(bOut.relationship === 'invalidates_prior_state', 'Case B must emit a canonical V3.8 defeating relationship');

// Anti-circularity is substantive: neither case may use the authority-registry record under examination as the issuer-standing witness.
for (const input of [aIn, bIn]) {
  const issuer = input.issuer_authority_state.registry_issuer;
  assert(issuer.standing_evidence.self_asserted === false, 'issuer standing may not be self-asserted');
  assert(issuer.standing_evidence.source_id !== input.authority_registry_statement.provenance.attributable_source, 'registry cannot bootstrap its own standing');
}

// Keep executor authority, consequence, obligation, safeguards and the registry statement fixed in the Harmonic pair.
for (const key of ['requested_action', 'authority_chain', 'revocation_state', 'relational_rule', 'governing_basis', 'obligation_witness', 'consequence_profile', 'safeguards']) {
  assert(stable(aPacket[key]) === stable(bPacket[key]), `${key} differs across Harmonic pair`);
}
assert(aPacket.packet_id !== bPacket.packet_id, 'packet IDs must be unique');

for (const file of fs.readdirSync(root).filter((x) => x.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(root, file));
  console.log(`${file} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`);
}
console.log('V118 Registry Content Validity vs Registry / Issuer Authority Standing fixtures: PASS');
console.log('Primary criterion: valid authority record is not treated as governing after independent issuer standing ends.');
console.log('Harmonic replay is secondary and cannot rescue an incorrect Pack constitution.');
