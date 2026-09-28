# V108 — Successor Examination Integrity

This delta changes the **test harness only**. Harmonic is unchanged.

## Boundary 1 — no semantic smuggling upstream

Exact packet replay now has an optional **Successor examination integrity gate**. When enabled, the harness rejects the specimen before transport if the packet contains standing-bearing classifications that would preload the property under examination (for example `revalidation_required`, `prior_state_status`, standing labels, supersession/revalidation language, or material-contradiction language).

The gate is an examination-integrity control, not a governance primitive. It never converts facts into a Harmonic disposition.

## Boundary 2 — observable downstream consequence

The harness now exposes `POST /api/synthetic-execution-sink`. It accepts only a Harmonic secure-execution request carrying a valid signed PERMIT receipt whose execute hash matches the payload. A successful call returns an observable synthetic effect receipt.

To use it, configure the existing Harmonic secure-execution tier to an allowlisted service URL pointing to this endpoint and configure the same receipt public key in the harness. No Harmonic code change is required.

This permits a successor examination to preserve separate evidence for:

1. attributable changed facts,
2. Harmonic determination,
3. governed route enforcement,
4. observed synthetic consequence (positive control), and
5. absence of that consequence when Harmonic refuses forwarding.

The sink does not prove every external route is controlled. Claims remain bounded to the configured effect-capable route under examination.
