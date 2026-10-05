const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const root = 'fixtures/v117-source-standing';
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

assert(freeze.status === 'PROSPECTIVE_FROZEN_EXAMINATION', 'V117 must remain prospective before live execution');
assert(freeze.red_team_id === 'RED TEAM 002', 'V117 must preserve RED TEAM 002 identity');
assert(freeze.no_further_reasoning_before_execution === true, 'no-further-reasoning rule must be frozen');
assert(freeze.no_post_result_rescue === true, 'no-post-result-rescue rule must be frozen');
assert(responsibility.forbidden_reclassification_after_run === true, 'source-responsibility map cannot be reclassified after execution');
assert(responsibility.frozen_non_authority_dimensions.includes('/sources'), 'source records must be frozen');
assert(responsibility.frozen_non_authority_dimensions.includes('/domain_rule'), 'domain rule must be frozen');

function diffPaths(x, y, current = '') {
  if (stable(x) === stable(y)) return [];
  if (Array.isArray(x) || Array.isArray(y) || !x || !y || typeof x !== 'object' || typeof y !== 'object') return [current || '/'];
  const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].sort();
  return keys.flatMap((key) => diffPaths(x[key], y[key], `${current}/${key}`));
}

const inputDiffs = diffPaths(aIn, bIn);
for (const diff of inputDiffs) {
  assert(responsibility.allowed_pair_differences.some((rootPath) => diff === rootPath || diff.startsWith(`${rootPath}/`)), `unfrozen Specialty Pack input difference: ${diff}`);
}
assert(stable(aIn.sources) === stable(bIn.sources), 'source records changed across the frozen pair');
assert(stable(aIn.domain_rule) === stable(bIn.domain_rule), 'domain rule changed across the frozen pair');
assert(stable(aIn.consequence) === stable(bIn.consequence), 'consequence changed across the frozen pair');
assert(aIn.observed_at === bIn.observed_at, 'observation time changed across the frozen pair');

for (const sourceKey of ['source_a', 'source_b']) {
  const left = aIn.sources[sourceKey];
  const right = bIn.sources[sourceKey];
  assert(stable(left.content) === stable(right.content), `${sourceKey}: content changed`);
  assert(stable(left.provenance) === stable(right.provenance), `${sourceKey}: provenance changed`);
  assert(stable(left.freshness) === stable(right.freshness), `${sourceKey}: freshness changed`);
  assert(left.hierarchy_position === right.hierarchy_position, `${sourceKey}: static hierarchy changed`);
  assert(left.availability === right.availability, `${sourceKey}: availability changed`);
  assert(left.confidence === right.confidence, `${sourceKey}: confidence changed`);
}

function intervalContains(interval, observedAt) {
  const t = Date.parse(observedAt);
  const from = Date.parse(interval?.from);
  const until = interval?.until == null ? Infinity : Date.parse(interval.until);
  return Number.isFinite(t) && Number.isFinite(from) && t >= from && t < until;
}

function derive(input) {
  const candidates = Object.entries(input.source_authority_state)
    .filter(([, state]) => state.standing_state === 'GOVERNING' && intervalContains(state.effective_interval, input.observed_at));
  assert(candidates.length === 1, `expected exactly one currently governing source; got ${candidates.length}`);
  const [authorityKey, authorityState] = candidates[0];
  const source = input.sources[authorityKey];
  assert(source, `governing authority points to missing source ${authorityKey}`);
  const value = source.content.execution_region;
  const required = input.consequence.required_execution_region;
  return {
    governing_source_id: source.source_id,
    proposition_value: value,
    source_authority_basis_ref: authorityState.authority_basis_ref,
    authority_effective_interval: authorityState.effective_interval,
    relationship: value === required ? input.domain_rule.preserving_class : input.domain_rule.defeating_domain_class,
  };
}

for (const [label, input, output, packet] of [
  ['case-a', aIn, aOut, aPacket],
  ['case-b', bIn, bOut, bPacket],
]) {
  const d = derive(input);
  assert(output.governing_source_id === d.governing_source_id, `${label}: Pack selected the wrong current governing source`);
  assert(output.proposition_value === d.proposition_value, `${label}: Pack proposition value does not come from current governing source`);
  assert(output.source_authority_basis_ref === d.source_authority_basis_ref, `${label}: Pack did not preserve source authority basis`);
  assert(stable(output.authority_effective_interval) === stable(d.authority_effective_interval), `${label}: Pack did not preserve authority effective interval`);
  assert(output.relationship === d.relationship, `${label}: Pack domain relationship not derived from selected current governing source`);
  assert(output.source_selection_rule_ref === 'source-standing-rule@1', `${label}: source selection rule drifted`);
  assert(output.constitutional_answer_supplied === false, `${label}: Pack supplied a case-specific constitutional answer`);
  assert(output.source_freshness_preserved === true, `${label}: freshness preservation witness missing`);
  assert(output.source_provenance_preserved === true, `${label}: provenance preservation witness missing`);
  assert(output.static_hierarchy_ignored_as_authority_proxy === true, `${label}: hierarchy-proxy guard missing`);
  assert(stable(packet.specialty_pack_evidence) === stable(output), `${label}: Harmonic packet does not preserve exact Specialty Pack output`);
  assert(packet.state_transition.relationship === output.relationship, `${label}: Harmonic packet transition differs from Pack output`);
  assert(packet.state_transition.attributable_source === output.specialty_pack, `${label}: transition source is not the Pack`);
  assert(packet.governing_basis.case_specific_constitutional_answer_supplied === false, `${label}: Harmonic packet preloads a constitutional answer`);
}

assert(aOut.governing_source_id === 'execution-region-registry-a', 'Case A must select Source A');
assert(bOut.governing_source_id === 'execution-region-registry-b', 'Case B must select Source B');
assert(aOut.proposition_value === 'EU-WEST', 'Case A must constitute EU-WEST from Source A');
assert(bOut.proposition_value === 'US-EAST', 'Case B must constitute US-EAST from Source B');
assert(aOut.relationship === 'consistent_with_prior_state', 'Case A must preserve the prior domain relation');
assert(bOut.relationship === 'material_contradiction', 'Case B must expose the changed constituted domain relation');

// Prove this cannot be explained by content/freshness/provenance/hierarchy drift.
assert(aIn.sources.source_a.hierarchy_position < aIn.sources.source_b.hierarchy_position, 'Source A must remain statically higher-ranked to pressure-test hierarchy substitution');
assert(bOut.governing_source_id === 'execution-region-registry-b', 'Case B must override static hierarchy using current source standing');
assert(aIn.sources.source_a.freshness.status === 'current' && bIn.sources.source_a.freshness.status === 'current', 'Source A must remain current in both cases');
assert(aIn.sources.source_a.availability === 'available' && bIn.sources.source_a.availability === 'available', 'Source A must remain available in both cases');
assert(aIn.sources.source_a.confidence === 1 && bIn.sources.source_a.confidence === 1, 'Source A confidence must remain unchanged');

// Packet differences may include the Pack result and its attributable evidence, but execution authority,
// consequence, obligation and safeguard surfaces must remain fixed. This keeps source standing separate
// from the executor's own authority chain.
for (const key of ['requested_action', 'authority_chain', 'revocation_state', 'relational_rule', 'governing_basis', 'obligation_witness', 'consequence_profile', 'safeguards']) {
  assert(stable(aPacket[key]) === stable(bPacket[key]), `${key} differs across Harmonic pair`);
}
assert(aPacket.packet_id !== bPacket.packet_id, 'packet IDs must be unique');

for (const file of fs.readdirSync(root).filter((x) => x.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(root, file));
  console.log(`${file} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`);
}
console.log('V117 Source Standing vs Source Continuity fixtures: PASS');
console.log('Primary criterion: current source authority, not freshness/provenance/hierarchy, controls Pack source selection.');
console.log('Live Harmonic replay is secondary and cannot rescue an incorrect Pack constitution.');
