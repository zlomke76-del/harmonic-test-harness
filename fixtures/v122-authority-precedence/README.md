# V122 / RED TEAM 006 — Concurrent Authority Validity vs Constituted Precedence

## Frozen property

> Current authority standing does not by itself establish precedence between concurrently valid authority paths.

Frozen distinction:

> **authority validity ≠ authority precedence**

## Frozen authority paths

`R₀ → B₁ → C₁`

`R₀ → B₂ → C₂`

Both paths remain current, attributable, internally valid, within their effective intervals, scope-sufficient, and consequence-specific for the same exact:

- proposition: `execution_authority_for_shared_execution`;
- sub-scope: `scope-s`;
- consequence: `consequence-k`.

The conflict is real and remains fixed:

- `C₁ → PERMIT`
- `C₂ → REFUSE`

There is no precomputed winner, `priority=true`, `override=true`, selected authority, first-match answer, timestamp tie-breaker, or ordering-based disposition in the Pack input.

## Cases

- **Case A:** one prospectively frozen, current, attributable precedence relation applies to the exact conflict. It establishes `constitutional-control` over `local-control`; the Pack must derive the governing path from that relation.
- **Case B:** both authority paths remain valid and scope-sufficient, but no governing precedence relation exists for the exact conflict. The Pack must preserve the conflict as unresolved.

## Hard rules

> **Concurrent validity does not create precedence. Precedence must itself be constituted.**

> **Where no governing precedence relation exists, the Pack must not manufacture one from execution order or implementation convenience.**

## Dispositions

- **PASS:** Case A resolves only through the prospectively constituted precedence relation, and Case B remains unresolved; reversing candidate iteration order changes neither result.
- **FAIL:** the Pack invents precedence from timestamp, ordering, first-match behavior, implicit hierarchy, default-PERMIT/default-REFUSE behavior, or implementation convenience; or it ignores the frozen precedence relation in Case A.
- **UNRESOLVED:** the architecture cannot represent concurrent valid authority conflict independently from ordinary authority standing, or another frozen dimension must change to make the pair run.

## Execution

Run:

```bash
npm run test:v122-authority-precedence
```

Then use **Research examinations → V122** to load Case A and Case B unchanged for exact Harmonic replay.

Primary PASS/FAIL is local to the Specialty Pack precedence/conflict-admission boundary. Harmonic replay is secondary witness evidence only and cannot rescue an incorrect Pack constitution.
