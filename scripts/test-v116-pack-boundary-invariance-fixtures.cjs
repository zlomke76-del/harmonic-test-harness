const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const root = 'fixtures/v116-pack-boundary-invariance';
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const assert = (value, message) => { if (!value) throw new Error(message); };
const stable = (value) => JSON.stringify(value);

const freeze = read('freeze.json');
const responsibility = read('responsibility-boundary.json');
const input = read('specialty-input.json');
const output = read('specialty-output.json');
const a = read('case-a-harmonic-packet.json');
const b = read('case-b-harmonic-packet.json');

assert(freeze.status === 'PROSPECTIVE_FROZEN_EXAMINATION', 'freeze must remain prospective before live execution');
assert(freeze.no_post_result_redesign === true, 'no-post-result-redesign rule must be frozen');
assert(responsibility.forbidden_reclassification_after_run === true, 'responsibility ownership must be frozen prospectively');
assert(responsibility.downstream_consequence_relative_constitutional_basis.includes('/obligation_witness'), 'obligation_witness must be frozen downstream');
assert(responsibility.transport_identity_only.includes('/packet_id'), 'packet_id must be classified as transport identity only');

function derive(packInput) {
  const x = packInput.authoritative_facts.authority_a.execution_region;
  const y = packInput.authoritative_facts.authority_b.accepted_execution_region;
  return x === y ? 'consistent_with_prior_state' : 'material_contradiction';
}

assert(output.relationship === derive(input), 'Specialty Pack relationship is not derived from frozen Pack-visible facts/rule');
assert(output.freshness === input.evidence_state.freshness, 'Pack freshness changed outside Pack-visible evidence');
assert(output.provenance === input.evidence_state.provenance, 'Pack provenance changed outside Pack-visible evidence');
assert(output.evidence_sufficiency === input.evidence_state.sufficiency, 'Pack evidence sufficiency changed outside Pack-visible evidence');
assert(output.constitutional_answer_supplied === false, 'Specialty Pack must not supply the constitutional answer');

const bannedFields = new Set(['standing_status','standing_preserved','standing_defeated','admissibility_status','expected_decision','expected_outcome','permit','deny','allow','block']);
const bannedValues = /\b(standing\s+(preserved|defeated)|admissible|inadmissible|permitted|denied|allowed|blocked|expected\s+(decision|outcome))\b/i;
function audit(node, where='value') {
  if (Array.isArray(node)) return node.forEach((v, i) => audit(v, `${where}[${i}]`));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      assert(!bannedFields.has(k.toLowerCase()), `${where}.${k}: case-specific constitutional answer field supplied upstream`);
      audit(v, `${where}.${k}`);
    }
    return;
  }
  if (typeof node === 'string') assert(!bannedValues.test(node), `${where}: case-specific constitutional answer supplied upstream`);
}
audit(output, 'specialty_output');

for (const [label, packet] of [['case-a', a], ['case-b', b]]) {
  assert(stable(packet.specialty_pack_evidence) === stable(output), `${label}: Specialty Pack evidence differs from frozen invariant output`);
  assert(packet.state_transition.relationship === output.relationship, `${label}: state transition relationship differs from frozen Pack output`);
  assert(packet.governing_basis.case_specific_constitutional_answer_supplied === false, `${label}: governing basis answer flag must be false`);
  audit(packet.specialty_pack_evidence, `${label}.specialty_pack_evidence`);
}

function diffPaths(x, y, current='') {
  if (stable(x) === stable(y)) return [];
  if (Array.isArray(x) || Array.isArray(y) || !x || !y || typeof x !== 'object' || typeof y !== 'object') return [current || '/'];
  const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].sort();
  return keys.flatMap((key) => diffPaths(x[key], y[key], `${current}/${key}`));
}

const diffs = diffPaths(a, b);
const allowedRoots = responsibility.allowed_pair_differences;
for (const diff of diffs) {
  assert(allowedRoots.some((rootPath) => diff === rootPath || diff.startsWith(`${rootPath}/`)), `unfrozen pair difference outside responsibility boundary: ${diff}`);
}
assert(diffs.some((p) => p === '/packet_id' || p.startsWith('/packet_id/')), 'pair packet IDs must differ');
assert(diffs.some((p) => p.startsWith('/obligation_witness/')), 'pair must differ in frozen downstream constitutional basis');
assert(stable(a.specialty_pack_evidence) === stable(b.specialty_pack_evidence), 'Specialty Pack output is not invariant across pair');
assert(stable(a.state_transition) === stable(b.state_transition), 'Pack-derived state transition is not invariant across pair');
assert(a.obligation_witness.source === b.obligation_witness.source, 'downstream constitutional rule source must remain the same across pair');
assert(a.obligation_witness.status === 'not_applicable', 'Case A downstream basis must establish prohibition not applicable');
assert(b.obligation_witness.status === 'unsatisfied', 'Case B downstream basis must establish binding prohibition unsatisfied');
assert(a.packet_id !== b.packet_id, 'packet IDs must be unique');

for (const file of fs.readdirSync(root).filter((x) => x.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(root, file));
  console.log(`${file} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`);
}
console.log('V116 Specialty Pack boundary invariance fixtures: PASS');
console.log('Frozen live criterion: invariant Pack output; only downstream constitutional basis differs.');
