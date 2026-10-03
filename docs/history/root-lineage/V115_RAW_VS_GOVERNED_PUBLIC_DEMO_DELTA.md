# V115 — Raw vs Governed Public Terminal Demo Delta

## Purpose

Add a runnable public-reference integration contrast without copying the Harmonic core into the harness.

## Architecture

```text
RAW
proposed consequence -> local synthetic executor

GOVERNED
proposed consequence + explicit constituted authority state
  -> secure Harmonic /api/evaluate
  -> returned governance disposition
  -> local synthetic execution gate
```

## Examination discipline

The demo uses a paired ΔN:

- a preserving change where automation authority remains active;
- a defeating change where automation signature authority is revoked.

The proposal is never promoted to observed reality. Harness inference is disabled. An unrecognized API disposition is treated as UNRESOLVED and the synthetic consequence is held.

## Added

- `examples/raw-vs-governed/run.mjs`
- `examples/raw-vs-governed/README.md`
- `examples/raw-vs-governed/fixtures/nda-authority-pair.json`
- `scripts/test-raw-vs-governed-example.cjs`
- `npm run example:raw-vs-governed`
- `npm run test:raw-vs-governed`

## Claim boundary

A Harmonic determination is not silently converted into a claim of universal downstream enforcement. The example's synthetic executor demonstrates only its own local gate. V114 remains the separate execution-boundary examination.
