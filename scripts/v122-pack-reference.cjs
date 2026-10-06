function intervalContains(interval, observedAt) {
  const t = Date.parse(observedAt);
  const from = Date.parse(interval?.from);
  const until = interval?.until == null ? Infinity : Date.parse(interval.until);
  return Number.isFinite(t) && Number.isFinite(from) && t >= from && t < until;
}

function currentValid(record, observedAt) {
  return Boolean(
    record
    && record.record_status === 'current'
    && record.signature?.status === 'valid'
    && record.provenance?.integrity === 'preserved'
    && intervalContains(record.effective_interval || { from: record.issued_at, until: null }, observedAt)
  );
}

function includesAll(list, required) {
  return required.every((item) => Array.isArray(list) && list.includes(item));
}

function pathValid(path, root, consequence, observedAt) {
  return Boolean(
    path
    && path.root_anchor_id === root.anchor_id
    && path.root_to_intermediate?.standing_state === 'GOVERNING'
    && path.root_to_intermediate?.standing_evidence?.self_asserted === false
    && path.root_to_intermediate?.standing_evidence?.source_id === root.evidence_source_id
    && intervalContains(path.root_to_intermediate?.effective_interval, observedAt)
    && currentValid(path.intermediate_delegation, observedAt)
    && currentValid(path.authority_instrument, observedAt)
    && path.intermediate_delegation?.issuer_id === path.root_to_intermediate?.empowered_authority_id
    && path.intermediate_delegation?.delegate_id === path.authority_instrument?.issuer_id
    && includesAll(path.root_to_intermediate?.proposition_scope, [consequence.proposition_id])
    && includesAll(path.root_to_intermediate?.consequence_scope, [consequence.consequence_id])
    && includesAll(path.root_to_intermediate?.subscope, [consequence.scope_id])
    && includesAll(path.intermediate_delegation?.proposition_scope, [consequence.proposition_id])
    && includesAll(path.intermediate_delegation?.consequence_scope, [consequence.consequence_id])
    && includesAll(path.intermediate_delegation?.subscope, [consequence.scope_id])
    && path.authority_instrument?.proposition_id === consequence.proposition_id
    && includesAll(path.authority_instrument?.consequence_scope, [consequence.consequence_id])
    && includesAll(path.authority_instrument?.subscope, [consequence.scope_id])
    && ['PERMIT', 'REFUSE'].includes(path.authority_instrument?.statement?.disposition)
  );
}

function precedenceRecordValid(record, input) {
  return Boolean(
    currentValid(record, input.observed_at)
    && record.proposition_id === input.consequence.proposition_id
    && includesAll(record.consequence_scope, [input.consequence.consequence_id])
    && includesAll(record.subscope, [input.consequence.scope_id])
    && record.relation?.higher_authority_class
    && record.relation?.lower_authority_class
    && record.relation.higher_authority_class !== record.relation.lower_authority_class
  );
}

function constituteV122(input) {
  const root = input.root_trust_anchor;
  const paths = input.authority_paths;
  if (!root || !Array.isArray(paths) || paths.length !== 2) {
    throw new Error('V122 requires one frozen root and exactly two concurrent authority paths');
  }

  const rootValid = root.anchor_id === 'R0'
    && root.outside_falsifier === true
    && root.status === 'FROZEN_EXTERNAL_TRUST_ANCHOR'
    && root.integrity === 'preserved'
    && root.scope?.includes(input.consequence.proposition_id)
    && intervalContains(root.effective_interval, input.observed_at);

  const evaluated = paths.map((path) => ({
    path_id: path.path_id,
    authority_class: path.authority_class,
    authority_id: path.authority_instrument.issuer_id,
    disposition: path.authority_instrument.statement.disposition,
    valid: rootValid && pathValid(path, root, input.consequence, input.observed_at),
    delegation_id: path.intermediate_delegation.instrument_id,
    authority_instrument_id: path.authority_instrument.record_id,
  }));

  const validPaths = evaluated.filter((item) => item.valid);
  const concurrentValid = validPaths.length === 2;
  const dispositions = [...new Set(validPaths.map((item) => item.disposition))].sort();
  const conflict = concurrentValid && dispositions.length === 2;

  const base = {
    specialty_pack: `${input.specialty_pack.id}@${input.specialty_pack.version}`,
    proposition_id: input.consequence.proposition_id,
    exact_scope_id: input.consequence.scope_id,
    exact_consequence_id: input.consequence.consequence_id,
    root_anchor_id: root.anchor_id,
    root_anchor_outside_falsifier: root.outside_falsifier === true,
    concurrent_authority_paths: evaluated,
    concurrent_paths_valid: concurrentValid,
    concurrent_conflict_present: conflict,
    candidate_dispositions: dispositions,
    constitutional_answer_supplied: false,
  };

  if (!concurrentValid) {
    return {
      ...base,
      precedence_relation_status: 'NOT_EVALUATED',
      constitution_status: 'UNRESOLVED_AUTHORITY_STANDING',
      proposition_value: null,
      governing_authority_id: null,
      governing_path_id: null,
      relationship: 'invalidates_prior_state',
      relationship_basis: 'one or more frozen concurrent authority paths failed ordinary standing before precedence could be examined',
    };
  }

  if (!conflict) {
    return {
      ...base,
      precedence_relation_status: 'NOT_REQUIRED_NO_CONFLICT',
      constitution_status: 'CONSTITUTED',
      proposition_value: validPaths[0].disposition,
      governing_authority_id: null,
      governing_path_id: null,
      relationship: 'consistent',
      relationship_basis: 'both concurrently valid authority paths agree; no precedence relation is required to preserve the common disposition',
    };
  }

  const rules = Array.isArray(input.precedence_relations) ? input.precedence_relations : [];
  const governingRules = rules.filter((record) => precedenceRecordValid(record, input));

  if (governingRules.length === 0) {
    return {
      ...base,
      precedence_relation_status: 'ABSENT_FOR_CONFLICT',
      precedence_rule_id: null,
      constitution_status: 'UNRESOLVED_AUTHORITY_CONFLICT',
      proposition_value: null,
      governing_authority_id: null,
      governing_path_id: null,
      relationship: 'invalidates_prior_state',
      relationship_basis: 'both authority paths are current, valid, scope-sufficient and consequence-specific, but no constituted precedence relation governs their conflicting dispositions; no winner may be manufactured',
    };
  }

  if (governingRules.length > 1) {
    return {
      ...base,
      precedence_relation_status: 'CONFLICTING_PRECEDENCE_RELATIONS',
      precedence_rule_id: null,
      constitution_status: 'UNRESOLVED_PRECEDENCE_CONFLICT',
      proposition_value: null,
      governing_authority_id: null,
      governing_path_id: null,
      relationship: 'invalidates_prior_state',
      relationship_basis: 'multiple current precedence relations govern the same exact conflict and the Pack will not invent precedence among precedence rules',
    };
  }

  const rule = governingRules[0];
  const higherClass = rule.relation.higher_authority_class;
  const lowerClass = rule.relation.lower_authority_class;
  const classSet = new Set(validPaths.map((item) => item.authority_class));
  if (!classSet.has(higherClass) || !classSet.has(lowerClass)) {
    return {
      ...base,
      precedence_relation_status: 'RULE_NOT_APPLICABLE_TO_BOTH_PATHS',
      precedence_rule_id: rule.rule_id,
      constitution_status: 'UNRESOLVED_AUTHORITY_CONFLICT',
      proposition_value: null,
      governing_authority_id: null,
      governing_path_id: null,
      relationship: 'invalidates_prior_state',
      relationship_basis: 'a precedence relation exists but does not map to both concurrently valid authority classes in the exact conflict',
    };
  }

  const selected = validPaths.find((item) => item.authority_class === higherClass);
  return {
    ...base,
    precedence_relation_status: 'CONSTITUTED_AND_APPLIED',
    precedence_rule_id: rule.rule_id,
    precedence_rule_source: rule.provenance.attributable_source,
    constitution_status: 'CONSTITUTED_WITH_PRECEDENCE',
    proposition_value: selected.disposition,
    governing_authority_id: selected.authority_id,
    governing_path_id: selected.path_id,
    relationship: 'consistent',
    relationship_basis: `the prospectively constituted precedence relation ${rule.rule_id} establishes ${higherClass} over ${lowerClass} for the exact proposition/scope/consequence; candidate iteration order is not a governing relation`,
  };
}

module.exports = { constituteV122 };
