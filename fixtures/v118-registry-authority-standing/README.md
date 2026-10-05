# V118 — Registry Content Validity vs Registry / Issuer Authority Standing

**RED TEAM 003** moves one level upstream of V117.

V117 assumed an explicitly represented current source-authority relation. V118 asks what happens when the authority statement supplying that relation remains perfectly valid as a record while the authority that empowers the record no longer has current standing for the proposition.

## Frozen distinction

**Registry content validity ≠ registry / issuer authority standing.**

The authority-registry record is byte-for-byte identical across Case A and Case B. It remains current, signed, attributable, internally valid and unchanged. Only independently established issuer-standing evidence changes.

## Anti-circularity rule

**The registry cannot establish its own present authority solely through the statement whose authority is under examination.**

Case A admits the statement because independent charter evidence establishes the issuer as currently governing. Case B preserves the statement as a valid historical/current record but refuses to use it as governing because the issuer's standing has ended. No successor-issued source-governance statement is supplied, so the Pack remains `UNRESOLVED_AUTHORITY_STANDING`.

Primary PASS/FAIL is at the Specialty Pack authority-admission boundary. Harmonic replay is secondary integration evidence only. No rescue, reinterpretation or ownership shift is permitted after execution.

## V118.1 replay-integrity correction

The exact-replay harness rejects `prior_state_status` and `revalidation_required` in successor packets because those fields can preload case-specific constitutional significance. V118.1 therefore supplies only the attributable domain transition relationship required for the examination: `consistent_with_prior_state` for Case A and `invalidates_prior_state` for Case B. Harmonic's V3.8 interface accepts the relationship itself as sufficient material-transition input; the omitted fields are optional aliases/augmentations, not required fields. The fixture test now fails if either banned field or an upstream execution disposition reappears.
