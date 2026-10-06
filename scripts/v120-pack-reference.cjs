function intervalContains(interval, observedAt) {
  const t = Date.parse(observedAt);
  const from = Date.parse(interval?.from);
  const until = interval?.until == null ? Infinity : Date.parse(interval.until);
  return Number.isFinite(t) && Number.isFinite(from) && t >= from && t < until;
}

function freshnessCurrent(freshness, observedAt) {
  if (!freshness || freshness.status !== 'current') return false;
  const seen = Date.parse(freshness.observed_at);
  const now = Date.parse(observedAt);
  const maxAgeMs = Number(freshness.max_age_seconds) * 1000;
  return Number.isFinite(seen) && Number.isFinite(now) && Number.isFinite(maxAgeMs) && maxAgeMs >= 0 && now >= seen && (now - seen) <= maxAgeMs;
}

function instrumentInternallyValid(instrument, observedAt, requireFreshness = false) {
  return Boolean(
    instrument
    && instrument.record_status === 'current'
    && instrument.signature?.status === 'valid'
    && instrument.provenance?.integrity === 'preserved'
    && (!requireFreshness || freshnessCurrent(instrument.freshness, observedAt))
  );
}

function constituteV120(input) {
  const root = input.root_trust_anchor;
  const rootToB = input.authority_path_state?.root_to_intermediate;
  const bToC = input.intermediate_delegation_b_to_c;
  const cInstrument = input.authority_instrument_c;
  if (!root || !rootToB || !bToC || !cInstrument) {
    throw new Error('R0, R0-to-B state, B-to-C delegation, and C authority instrument are required');
  }

  const propositionId = cInstrument.proposition_id;
  const rootFrozen = root.anchor_id === 'R0'
    && root.outside_falsifier === true
    && root.status === 'FROZEN_EXTERNAL_TRUST_ANCHOR'
    && root.integrity === 'preserved'
    && root.scope?.includes(propositionId)
    && intervalContains(root.effective_interval, input.observed_at);

  const rootEvidenceIndependent = rootToB.standing_evidence
    && rootToB.standing_evidence.self_asserted === false
    && rootToB.standing_evidence.source_id === root.evidence_source_id
    && rootToB.standing_evidence.source_id !== bToC.provenance?.attributable_source
    && rootToB.standing_evidence.source_id !== cInstrument.provenance?.attributable_source;

  const rootCurrentlyEmpowersB = rootFrozen
    && rootToB.anchor_id === root.anchor_id
    && rootToB.empowered_authority_id === bToC.issuer_id
    && rootToB.standing_state === 'GOVERNING'
    && rootToB.scope?.includes(propositionId)
    && intervalContains(rootToB.effective_interval, input.observed_at)
    && rootEvidenceIndependent;

  const bToCValid = instrumentInternallyValid(bToC, input.observed_at)
    && bToC.delegate_id === cInstrument.issuer_id
    && bToC.scope?.includes(propositionId)
    && intervalContains(bToC.effective_interval, input.observed_at);

  const cInstrumentValid = instrumentInternallyValid(cInstrument, input.observed_at, true);
  const authorityPathIntact = Boolean(rootCurrentlyEmpowersB && bToCValid && cInstrumentValid);

  const base = {
    specialty_pack: `${input.specialty_pack.id}@${input.specialty_pack.version}`,
    proposition_id: propositionId,
    root_anchor_id: root.anchor_id,
    root_anchor_authority_id: root.authority_id,
    root_anchor_outside_falsifier: root.outside_falsifier === true,
    root_to_intermediate_standing: rootToB.standing_state,
    root_to_intermediate_basis_ref: rootToB.standing_basis_ref,
    root_to_intermediate_evidence_source: rootToB.standing_evidence?.source_id || null,
    intermediate_delegation_id: bToC.instrument_id,
    intermediate_delegation_content_valid: bToCValid,
    authority_instrument_id: cInstrument.record_id,
    authority_instrument_content_valid: cInstrumentValid,
    authority_instrument_issuer_id: cInstrument.issuer_id,
    authority_chain_status: authorityPathIntact ? 'INTACT' : 'BROKEN_UPSTREAM_EMPOWERMENT',
    anti_circularity_satisfied: Boolean(rootEvidenceIndependent),
    domain_rule_ref: `${input.domain_rule.rule_id}@${input.domain_rule.version}`,
    scope: input.consequence.scope,
    constitutional_answer_supplied: false,
  };

  if (authorityPathIntact) {
    const source = Object.values(input.sources).find((candidate) => candidate.source_id === cInstrument.statement.governing_source_id);
    if (!source) throw new Error('C authority instrument names a source not present in the Pack input');
    const value = source.content.execution_region;
    const relationship = value === input.consequence.required_execution_region
      ? input.domain_rule.preserving_class
      : input.domain_rule.defeating_domain_class;
    return {
      ...base,
      constitution_status: 'CONSTITUTED',
      proposition_value: value,
      governing_source_id: source.source_id,
      relationship,
      relationship_basis: relationship === input.domain_rule.preserving_class
        ? 'current authority path R0 -> B -> C is intact; unchanged C instrument selects Source A, whose value matches the frozen domain rule'
        : 'current authority path R0 -> B -> C is intact; selected source conflicts with the frozen domain rule',
    };
  }

  return {
    ...base,
    constitution_status: 'UNRESOLVED_AUTHORITY_CHAIN',
    proposition_value: null,
    governing_source_id: null,
    relationship: 'invalidates_prior_state',
    relationship_basis: 'C authority instrument and B-to-C delegation remain internally valid, but the current empowerment path from frozen R0 no longer reaches B for this proposition; no current R0/B2-to-C path is supplied',
  };
}

module.exports = { constituteV120 };
