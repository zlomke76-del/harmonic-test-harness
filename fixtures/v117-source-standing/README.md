# V117 — Source Standing vs Source Continuity

**Status:** prospective frozen examination. No live result is claimed by these fixtures.

V117 implements **RED TEAM 002**. It asks whether a Specialty Pack can distinguish a source that is merely fresh, attributable, available, historically primary, and unchanged from a source that is **currently governing for the exact proposition**.

The two source records are byte-for-byte semantically identical across Case A and Case B. Their content, provenance, freshness, availability, confidence, and static hierarchy positions do not move. The consequence and domain rule do not move. Only the separately attributable source-authority state changes:

- **Case A:** Source A is currently governing; Source B is successor-pending.
- **Case B:** Source A's governing interval has ended; Source B is currently governing.

Source A continues to report `EU-WEST`; Source B continues to report `US-EAST` in both cases. The Pack must select the currently governing source under the frozen `source-standing-rule@1`, not whichever source is fresher, higher-ranked, historically primary, or more convenient.

The Pack therefore constitutes:

- Case A → governing source A → `EU-WEST` → `consistent_with_prior_state`
- Case B → governing source B → `US-EAST` → `material_contradiction`

The `material_contradiction` label is a domain transition classification produced after source selection under the frozen domain rule. It is not a Harmonic standing, admissibility, permit, or execution answer.

## Primary disposition

V117 passes or fails **at the Specialty Pack source-selection boundary first**.

- **PASS:** the Pack changes the constituted state solely because the current governing-source relation changed.
- **FAIL:** the Pack keeps relying on Source A because freshness, provenance, availability, confidence, historical primacy, or static hierarchy silently substitutes for current governing authority.
- **UNRESOLVED:** the Pack cannot independently represent the source-authority relation, or the frozen pair cannot be executed without changing a non-authority dimension.

The Harmonic packet is a secondary integration witness only. A live Harmonic result cannot rescue an incorrect Specialty Pack constitution.

## Run

```bash
npm run test:v117-source-standing
```

Then use the Research examinations panel to load Case A and Case B for exact packet replay. Preserve raw exports without editing either packet.
