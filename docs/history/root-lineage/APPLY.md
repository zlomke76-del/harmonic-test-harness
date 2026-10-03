# Apply V115 Raw-vs-Governed Demo Delta

Copy these files into the repository root, preserving paths.

This delta adds a public-reference terminal demo that:

- keeps Harmonic core private and calls the secure `/api/evaluate` boundary;
- embeds no API secret;
- runs a preserving and defeating ΔN pair;
- disables harness inference and does not treat model output as observed reality;
- fails closed on an unrecognized live disposition;
- preserves the distinction between Harmonic determination and local synthetic enforcement.

## Commands

```bash
npm run test:raw-vs-governed
npm run test:v114-execution-boundary
HARMONIC_API_KEY=... npm run example:raw-vs-governed
```

## Local verification performed

- `npm run test:raw-vs-governed` — PASS
- `npm run test:v114-execution-boundary` — PASS
- `npm run test:unified-harmonic` — FAILED on a pre-existing stale regression assertion expecting the removed string `v3.6-universal-transaction-projection-2026-08-09`; V115 does not touch `lib/governance-adapter.ts` or that test.

The live example was not executed because no Harmonic API secret was embedded or supplied during packaging.
