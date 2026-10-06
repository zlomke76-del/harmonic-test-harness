function intervalContains(interval, observedAt) {
  const t = Date.parse(observedAt);
  const from = Date.parse(interval?.from);
  const until = interval?.until == null ? Infinity : Date.parse(interval.until);
  return Number.isFinite(t) && Number.isFinite(from) && t >= from && t < until;
}

function currentValid(record, observedAt, requireFreshness = false) {
  const basic = Boolean(
    record
    && record.record_status === 'current'
    && record.signature?.status === 'valid'
    && record.provenance?.integrity === 'preserved'
    && intervalContains(record.effective_interval || { from: record.issued_at, until: null }, observedAt)
  );
  if (!basic || !requireFreshness) return basic;
  const seen = Date.parse(record.freshness?.observed_at);
  const now = Date.parse(observedAt);
  const maxAgeMs = Number(record.freshness?.max_age_seconds) * 1000;
  return record.freshness?.status === 'current'
    && Number.isFinite(seen) && Number.isFinite(now) && Number.isFinite(maxAgeMs)
    && maxAgeMs >= 0 && now >= seen && (now - seen) <= maxAgeMs;
}

function includesAll(list, required) {
  return required.every((item) => Array.isArray(list) && list.includes(item));
}

function constituteV121(input) {
  const root = input.root_trust_anchor;
  const rootToB = input.root_to_intermediate;
  const delegation = input.intermediate_delegation_b_to_c;
  const effectiveScope = input.effective_delegated_scope;
  const cInstrument = input.authority_instrument_c;
  if (!root || !rootToB || !delegation || !effectiveScope || !cInstrument) {
    throw new Error('R0, R0-to-B authority, B-to-C delegation, effective delegated scope, and C authority instrument are required');
  }

  const propositionId = cInstrument.proposition_id;
  const consequenceId = input.consequence.consequence_id;
  const subScopeId = input.consequence.scope_id;

  const rootValid = root.anchor_id === 'R0'
    && root.outside_falsifier === true
    && root.status === 'FROZEN_EXTERNAL_TRUST_ANCHOR'
    && root.integrity === 'preserved'
    && root.scope?.includes(propositionId)
    && intervalContains(root.effective_interval, input.observed_at);

  const rootToBValid = rootValid
    && rootToB.anchor_id === root.anchor_id
    && rootToB.empowered_authority_id === delegation.issuer_id
    && rootToB.standing_state === 'GOVERNING'
    && includesAll(rootToB.proposition_scope, [propositionId])
    && includesAll(rootToB.consequence_scope, [consequenceId])
    && includesAll(rootToB.subscope, [subScopeId])
    && intervalContains(rootToB.effective_interval, input.observed_at)
    && rootToB.standing_evidence?.self_asserted === false
    && rootToB.standing_evidence?.source_id === root.evidence_source_id;

  const delegationValid = currentValid(delegation, input.observed_at)
    && delegation.delegate_id === cInstrument.issuer_id
    && includesAll(delegation.proposition_scope_ceiling, [propositionId]);

  const cInstrumentValid = currentValid(cInstrument, input.observed_at, true);
  const chainIntact = Boolean(rootToBValid && delegationValid && cInstrumentValid);

  const effectiveScopeValid = currentValid(effectiveScope, input.observed_at)
    && effectiveScope.issuer_id === delegation.issuer_id
    && effectiveScope.delegate_id === delegation.delegate_id;

  const childWithinParent = includesAll(rootToB.proposition_scope, effectiveScope.proposition_scope || [])
    && includesAll(rootToB.consequence_scope, effectiveScope.consequence_scope || [])
    && includesAll(rootToB.subscope, effectiveScope.subscope || []);

  const childWithinInstrumentCeiling = includesAll(delegation.proposition_scope_ceiling, effectiveScope.proposition_scope || [])
    && includesAll(delegation.consequence_scope_ceiling, effectiveScope.consequence_scope || [])
    && includesAll(delegation.subscope_ceiling, effectiveScope.subscope || []);

  const exactScopeCovered = effectiveScopeValid
    && childWithinParent
    && childWithinInstrumentCeiling
    && includesAll(effectiveScope.proposition_scope, [propositionId])
    && includesAll(effectiveScope.consequence_scope, [consequenceId])
    && includesAll(effectiveScope.subscope, [subScopeId]);

  const base = {
    specialty_pack: `${input.specialty_pack.id}@${input.specialty_pack.version}`,
    proposition_id: propositionId,
    root_anchor_id: root.anchor_id,
    root_anchor_outside_falsifier: root.outside_falsifier === true,
    root_to_intermediate_standing: rootToB.standing_state,
    intermediate_delegation_id: delegation.instrument_id,
    intermediate_delegation_content_valid: delegationValid,
    effective_scope_record_id: effectiveScope.scope_record_id,
    effective_scope_record_valid: effectiveScopeValid,
    effective_proposition_scope: effectiveScope.proposition_scope,
    effective_consequence_scope: effectiveScope.consequence_scope,
    effective_subscope: effectiveScope.subscope,
    authority_instrument_id: cInstrument.record_id,
    authority_instrument_content_valid: cInstrumentValid,
    authority_chain_status: chainIntact ? 'INTACT' : 'BROKEN',
    child_scope_within_parent: childWithinParent,
    child_scope_within_delegation_ceiling: childWithinInstrumentCeiling,
    exact_scope_id: subScopeId,
    exact_consequence_id: consequenceId,
    exact_scope_sufficient: Boolean(chainIntact && exactScopeCovered),
    domain_rule_ref: `${input.domain_rule.rule_id}@${input.domain_rule.version}`,
    constitutional_answer_supplied: false,
  };

  if (!chainIntact) {
    return {
      ...base,
      constitution_status: 'UNRESOLVED_AUTHORITY_CHAIN',
      proposition_value: null,
      governing_source_id: null,
      relationship: 'invalidates_prior_state',
      relationship_basis: 'the authority chain itself is not intact; RED TEAM 005 cannot treat chain failure as a scoped-standing result',
    };
  }

  if (!exactScopeCovered) {
    return {
      ...base,
      constitution_status: 'UNRESOLVED_AUTHORITY_SCOPE',
      proposition_value: null,
      governing_source_id: null,
      relationship: 'invalidates_prior_state',
      relationship_basis: `R0 -> B -> C remains intact, but the current effective B-to-C scope does not cover proposition ${propositionId}, Scope ${subScopeId}, and Consequence ${consequenceId} together; unaffected delegated scope remains preserved`,
    };
  }

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
      ? `current R0 -> B -> C chain is intact and the effective B-to-C scope covers proposition ${propositionId}, Scope ${subScopeId}, and Consequence ${consequenceId}; C selects Source A and the value matches the frozen domain rule`
      : 'current scoped authority is sufficient, but the selected source conflicts with the frozen domain rule',
  };
}

module.exports = { constituteV121 };
