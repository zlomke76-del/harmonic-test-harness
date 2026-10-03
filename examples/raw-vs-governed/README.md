# Raw vs Governed — Runnable Terminal Contrast

This example is a **synthetic public-reference integration demo**. It shows the difference between:

1. an intentionally ungoverned path that sends a proposed NDA-signature consequence directly to a synthetic executor; and
2. a governed path that sends the same proposed consequence plus explicit constituted authority-state evidence to the configured Harmonic API before the local synthetic executor is allowed to proceed.

It runs a **paired ΔN** rather than a block-only demo:

- **Preserving ΔN:** a non-material supplier contact update; automation signature authority remains active.
- **Defeating ΔN:** the authorized legal actor revokes automation signature authority before the consequence.

This prevents the demo from “passing” merely by blocking every changed state.

## Run

```bash
HARMONIC_API_KEY=your_key npm run example:raw-vs-governed
```

Optional endpoint override:

```bash
HARMONIC_API_URL=https://www.solace-harmonic.com/api/evaluate \
HARMONIC_API_KEY=your_key \
npm run example:raw-vs-governed
```

The repository does **not** embed a production Harmonic key. Keep secrets in local environment variables or a server-side secret store.

## Expected shape

The raw lane is intentionally unsafe: it invokes the synthetic consequence without a governance determination.

The governed lane:

```text
explicit authority-state fixture
  -> Harmonic /api/evaluate
  -> bounded disposition
  -> local synthetic execution gate
  -> consequence or block
```

The runner fails closed when the live API response cannot be mapped to a bounded ALLOW/BLOCK disposition.

## Claim ceiling

This example demonstrates a **terminal-visible integration contrast**. It does not, by itself, prove that Harmonic controls every production execution route.

- Harmonic's returned disposition is the governance determination.
- The bundled synthetic executor demonstrates only the local demo enforcement path.
- Production non-bypassability is a separate property and must be examined separately.
- The existing V114 execution-boundary examination remains the dedicated harness test for the synthetic enforcement boundary.

**Models propose. Governance determines. Execution enforces.**
