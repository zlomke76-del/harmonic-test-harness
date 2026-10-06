# V120 / RED TEAM 004 — Authority Artifact Validity vs Authority-Chain Continuity

## Frozen property

> A Specialty Pack must distinguish the continued validity of an intermediate authority artifact from the continued standing of the authority path that empowers it.

Frozen distinction:

> **Valid authority artifact ≠ currently intact authority chain.**

## Frozen chain

`R₀ → B → C → Source A`

`R₀` is prospectively frozen as the external trust anchor for this examination and is outside the falsifier.

Across Case A and Case B, all of the following remain fixed:

- the R₀ trust-anchor record;
- the B-to-C delegation artifact;
- C's authority instrument selecting Source A;
- signatures, attribution, provenance, record status and effective interval of those intermediate artifacts;
- C's authority-instrument freshness status and observation window;
- source content, source freshness, domain rule, consequence and observation time.

Only the independently supplied higher-order R₀-to-B empowerment state changes.

## Cases

- **Case A:** R₀ currently empowers B for the proposition. The unchanged B-to-C delegation therefore reaches C, and C's unchanged authority instrument may govern.
- **Case B:** R₀ no longer empowers B for the proposition and competence has moved to B2. The B-to-C delegation and C authority instrument remain individually valid, but no current R₀/B2-to-C path is supplied.

## Frozen anti-circularity rule

Neither the B-to-C delegation nor C's authority instrument may prove continuity of R₀-to-B merely by remaining current, signed, attributable or internally valid.

## Dispositions

- **PASS:** the Pack stops treating C's instrument as governing in Case B because the current empowerment path from R₀ no longer reaches C.
- **FAIL:** the Pack continues treating C as governing because the intermediate artifacts still look valid.
- **UNRESOLVED:** the architecture cannot represent authority-path continuity independently from artifact validity, or the pair cannot run without changing another frozen dimension.

## Execution

Run:

```bash
npm run test:v120-authority-chain-continuity
```

Then use the **Research examinations** panel to load Case A and Case B unchanged for exact Harmonic replay.

Primary PASS/FAIL is local to the Specialty Pack authority-chain admission boundary. Harmonic replay is secondary witness evidence only and cannot rescue an incorrect Pack constitution.
