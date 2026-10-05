function intervalContains(interval, observedAt) {
  const t = Date.parse(observedAt);
  const from = Date.parse(interval?.from);
  const until = interval?.until == null ? Infinity : Date.parse(interval.until);
  return Number.isFinite(t) && Number.isFinite(from) && t >= from && t < until;
}

function constituteV118(input) {
  const registry = input.authority_registry_statement;
  const issuer = input.issuer_authority_state?.registry_issuer;
  if (!registry || !issuer) throw new Error('registry statement and registry issuer standing are required');

  const registryContentValid = registry.record_status === 'current'
    && registry.signature?.status === 'valid'
    && registry.provenance?.integrity === 'preserved';

  const independentStandingEvidence = issuer.standing_evidence
    && issuer.standing_evidence.source_id
    && issuer.standing_evidence.self_asserted === false
    && issuer.standing_evidence.source_id !== registry.provenance?.attributable_source;

  const issuerCurrentlyGoverning = issuer.standing_state === 'GOVERNING'
    && intervalContains(issuer.effective_interval, input.observed_at)
    && issuer.scope?.includes(registry.proposition_id)
    && independentStandingEvidence;

  const base = {
    specialty_pack: `${input.specialty_pack.id}@${input.specialty_pack.version}`,
    proposition_id: registry.proposition_id,
    authority_registry_record_id: registry.record_id,
    registry_statement_content_valid: registryContentValid,
    registry_issuer_id: registry.issuer_id,
    registry_issuer_standing: issuer.standing_state,
    registry_issuer_standing_basis_ref: issuer.standing_basis_ref,
    registry_issuer_authority_effective_interval: issuer.effective_interval,
    issuer_standing_evidence_source: issuer.standing_evidence?.source_id || null,
    anti_circularity_satisfied: Boolean(independentStandingEvidence),
    domain_rule_ref: `${input.domain_rule.rule_id}@${input.domain_rule.version}`,
    scope: input.consequence.scope,
    constitutional_answer_supplied: false,
  };

  if (registryContentValid && issuerCurrentlyGoverning) {
    const source = Object.values(input.sources).find((candidate) => candidate.source_id === registry.statement.governing_source_id);
    if (!source) throw new Error('registry statement names a source not present in the Pack input');
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
        ? 'valid registry statement is empowered by independently standing issuer and selects Source A, whose value matches the frozen domain rule'
        : 'valid registry statement is empowered by independently standing issuer; selected source conflicts with frozen domain rule',
    };
  }

  return {
    ...base,
    constitution_status: 'UNRESOLVED_AUTHORITY_STANDING',
    proposition_value: null,
    governing_source_id: null,
    relationship: 'invalidates_prior_state',
    relationship_basis: 'registry statement remains internally valid but cannot govern because its issuer no longer has current standing for the proposition; no successor-issued source-governance statement is supplied',
  };
}

module.exports = { constituteV118 };
