# Raw vs Governed — Runnable Terminal Contrast

This is a **synthetic public-reference integration demo**.

It does not claim that a live LLM generated the proposal or that the raw lane performs an external HTTP disclosure. The proposed NDA action is a frozen fixture so the comparison holds the candidate consequence still while changing only the authority state.

The demo compares:

1. an intentionally ungoverned local path that sends the frozen proposed NDA-signature consequence directly to a synthetic executor; and
2. a governed path that sends the same proposed consequence plus explicit constituted authority-state evidence to the configured Harmonic API before the local synthetic executor is allowed to proceed.

It runs a **paired ΔN**:

- **Preserving ΔN:** a non-material supplier contact update; automation signature authority remains active.
- **Defeating ΔN:** the authorized legal actor revokes automation signature authority before the consequence.

The pair prevents the demo from appearing successful merely because it blocks every changed state.

## Run

```bash
HARMONIC_API_KEY=your_issued_key npm run example:raw-vs-governed
```

Optional endpoint override:

```bash
HARMONIC_API_URL=https://www.solace-harmonic.com/api/evaluate \
HARMONIC_API_KEY=your_issued_key \
npm run example:raw-vs-governed
```

The repository never embeds a production Harmonic key. Keep secrets in local environment variables or a server-side secret store.

## Flow

```text
frozen proposed consequence
       |
       +--> RAW: local synthetic executor
       |
       +--> GOVERNED: explicit authority-state fixture
                      -> Harmonic /api/evaluate
                      -> current bounded disposition
                      -> local synthetic execution gate
                      -> consequence or hold/block
```

## Execution-authority rule

The governed synthetic executor is fail-closed.

It executes only when the current Harmonic response contains:

- `admissible=true`; and
- an explicit execution-permission signal from the `ALLOW` / `PERMIT` family.

`PASS`, `APPROVED`, `ADMISSIBLE`, and similar descriptive/evidentiary labels are **not** treated as execution authority.

Explicit refusal or `admissible=false` blocks. An unrecognized or incomplete response is **UNRESOLVED** and the synthetic consequence is held.

## Claim ceiling

This example demonstrates a **terminal-visible integration contrast**. It does not, by itself, prove that Harmonic controls every production execution route.

- Harmonic's returned disposition is the governance determination for the submitted packet.
- The bundled synthetic executor demonstrates only this demo's local enforcement path.
- The proposal fixture is not authoritative reality.
- The fixture supplies constituted domain state; it does not supply the case-specific Harmonic disposition.
- Production non-bypassability is a separate property and must be examined separately.
- V114 remains the dedicated synthetic execution-boundary falsification examination.

**Models propose. Governance determines. Execution enforces.**
