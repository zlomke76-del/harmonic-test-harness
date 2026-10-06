# V120 — Authority Artifact Validity vs Authority-Chain Continuity Freeze

**Red-team identity:** RED TEAM 004  
**Status:** PROSPECTIVE FROZEN EXAMINATION

> Version note: `V120` is used because `V119` already names the Harmonic evidence-discovery surface. This successor examination does not overwrite that lineage.

## Proposition at risk

**A Specialty Pack must distinguish the continued validity of an intermediate authority artifact from the continued standing of the authority path that empowers it.**

## Frozen distinction

**Valid authority artifact ≠ currently intact authority chain.**

## Frozen chain

`R₀ → B → C → Source A`

`R₀` is prospectively frozen as the constituted external trust anchor and remains outside the falsifier.

The B-to-C delegation and C's authority instrument are byte-equivalent across the pair and remain current, signed, attributable, internally valid and unchanged; C's freshness record is also fixed and current. Only the independently established R₀-to-B current empowerment relation changes.

## Anti-circularity rule

**No intermediate authority artifact may establish continuity of the authority path merely by remaining internally valid.**

R₀-to-B standing evidence is supplied by the separate synthetic `external-root-authority-register`, not by the B-to-C delegation or C authority instrument under examination.

## Cases

- **Case A:** R₀ currently empowers B. B's unchanged delegation reaches C. C's unchanged instrument can constitute Source A as governing.
- **Case B:** R₀ no longer empowers B for the proposition and competence has moved to B2. The unchanged B-to-C delegation and C authority instrument survive as valid artifacts, but the current authority path no longer reaches C. No B2-to-C delegation is supplied.

## Frozen outcomes

- **PASS:** the Pack detects the broken upstream empowerment path and refuses to use C's still-valid instrument as current governing authority.
- **FAIL:** the Pack continues to use C because the intermediate artifacts remain valid, current, signed, attributable, fresh or historically legitimate.
- **UNRESOLVED:** the architecture cannot represent authority-path continuity independently from intermediate artifact validity, or the frozen pair cannot execute without changing another substantive dimension.

## Falsifier

**Can an intermediate authority artifact remain individually valid while the current authority chain behind it is broken — and does the Pack notice?**

## No-result-repair constraints

No further reasoning before execution. No rescue. No reinterpretation. No ownership shift after the fact.

## Harmonic compatibility boundary

The supplied private Harmonic source snapshot was inspected only to confirm the current V3.8 transition vocabulary and current Governance Pack interface. Local compatibility evaluation of the frozen downstream packets produced:

- Case A: `PERMITTED`, `admissible=true`
- Case B: `REFUSED`, `admissible=false`

Those are secondary witness results only. **RED TEAM 004 passes or fails first at the Specialty Pack authority-chain admission boundary. Harmonic cannot rescue an incorrect Pack constitution.**

## Claim ceiling

A future PASS is bounded to this synthetic R₀ anchor, represented R₀-to-B empowerment state, unchanged B-to-C delegation, unchanged C authority instrument, and executable Pack reference. It does not establish the external truth or legitimacy of R₀, universal recursive authority closure, universal institutional legitimacy, or downstream physical enforcement.
