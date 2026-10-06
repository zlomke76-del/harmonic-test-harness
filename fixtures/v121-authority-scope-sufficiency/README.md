# V121 / RED TEAM 005 — Authority-Chain Continuity vs Consequence-Specific Scope Sufficiency

## Frozen property

> A currently intact authority chain does not imply standing for every proposition or consequence inside that chain.

Frozen distinction:

> **authority-chain continuity ≠ consequence-specific scope sufficiency**

## Frozen chain

`R₀ → B → C`

The authority chain remains current and valid in both cases. The following stay fixed:

- R₀ and the current R₀-to-B empowerment;
- the B-to-C delegation instrument and its broad scope ceiling;
- C's authority instrument;
- signatures, attribution, provenance, current status and effective intervals of those chain artifacts;
- domain facts, source content/freshness, domain rule, exact requested consequence and observation time.

Only the **currently effective B-to-C delegated scope** changes.

## Exact consequence

The Pack must derive standing for all three exact dimensions:

- proposition: `execution_region_for_shared_execution`;
- sub-scope: `scope-s`;
- consequence: `consequence-k`.

There is no precomputed `scope_insufficient` flag and no case-specific constitutional answer in the Pack input.

## Cases

- **Case A:** the current effective B-to-C scope covers the proposition, `scope-s`, and `consequence-k`. The Pack may constitute normally.
- **Case B:** the same chain remains intact, but the effective B-to-C scope narrows to preserve `scope-t` / `consequence-j` only. C remains a valid authority elsewhere but no longer carries standing for the exact `scope-s` / `consequence-k` consequence.

## Hard rule

> **No child authority may inherit broader standing than the currently effective scope of the authority empowering it.**

## Dispositions

- **PASS:** affected authority is removed for the exact consequence while unaffected authority remains represented.
- **FAIL:** intact chain continuity causes the exact consequence to inherit authority outside the currently effective delegated scope.
- **UNRESOLVED:** scoped standing cannot be represented independently from overall chain continuity, or another frozen dimension must change to make the pair run.

## Execution

Run:

```bash
npm run test:v121-authority-scope-sufficiency
```

Then use **Research examinations → V121** to load Case A and Case B unchanged for exact Harmonic replay.

Primary PASS/FAIL is local to the Specialty Pack scope-admission boundary. Harmonic replay is secondary witness evidence only and cannot rescue an incorrect Pack constitution.
