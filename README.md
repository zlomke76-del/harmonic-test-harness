# Harmonic Public Test Harness

This repository is a **public examination and integration harness** for Harmonic.
It does **not** contain the private Harmonic runtime.

The harness supplies explicit, bounded test evidence to the configured Harmonic API, preserves returned governance dispositions, and provides synthetic consequence boundaries for reproducible examination of determination and enforcement behavior.

## What this repository demonstrates

The public harness is designed to make three layers inspectable without collapsing them:

1. **Constituted test evidence** — fixtures and structured witnesses describe the examined state.
2. **Harmonic determination** — the secure Harmonic API evaluates the submitted packet and returns a governance disposition.
3. **Synthetic execution enforcement** — local harness routes can demonstrate whether a bounded synthetic consequence is allowed to proceed when the required execution authorization is present.

**Models propose. Governance determines. Execution enforces.**

## What this repository does not prove

A successful harness run does not establish that every downstream production route is non-bypassable.

Unless an examination explicitly says otherwise, this repository does **not** claim:

- that Harmonic independently infers arbitrary domain meaning from raw facts;
- that a model response is authoritative reality;
- that a returned governance disposition proves downstream execution control;
- that a synthetic consequence is a real-world production effect;
- that one passing scenario generalizes to unrelated systems, domains, or versions.

See [`docs/public/CLAIM_BOUNDARIES.md`](docs/public/CLAIM_BOUNDARIES.md).

## Quick start

Requirements:

- Node.js 20+
- npm
- an issued Harmonic API key for live API examples

```bash
npm install
```

Run the raw-vs-governed terminal contrast:

```bash
HARMONIC_API_KEY=your_issued_key npm run example:raw-vs-governed
```

Run the synthetic execution-boundary examination:

```bash
npm run test:v114-execution-boundary
```

Run the public-repository contract checks:

```bash
npm run test:public-contract
```

Run the full current acceptance suite:

```bash
npm test
```

See [`docs/public/VALIDATION.md`](docs/public/VALIDATION.md) for the exact current validation surface.

## Raw vs Governed demo

The public demo uses a **frozen synthetic proposal fixture**. It is intentionally **not described as a live LLM run**.

The raw lane sends the frozen proposed consequence directly to a local synthetic executor.

The governed lane sends the same proposed consequence plus explicit constituted authority-state evidence to Harmonic before the local synthetic executor is permitted to proceed.

The paired test contains:

- a preserving ΔN, where authority remains active; and
- a defeating ΔN, where automation signature authority is revoked.

This prevents a block-only implementation from appearing successful merely because it refuses every changed state.

See [`examples/raw-vs-governed/README.md`](examples/raw-vs-governed/README.md).

## API boundary

Current public integrations use the single Harmonic endpoint:

```text
POST https://www.solace-harmonic.com/api/evaluate
```

The public harness is a **client** of that secure API. It does not duplicate the Harmonic core.

Configuration:

```bash
cp .env.example .env.local
```

Then set:

```text
HARMONIC_API_KEY=your_issued_key
```

Never commit a real Harmonic key, model-provider key, receipt signing key, or other secret.

## Exact execution-authority rule

For consequence-bearing demo execution, the harness is fail-closed.

A generic `PASS`, `APPROVED`, `ADMISSIBLE`, or similar descriptive status is **not** treated as execution authority.

The raw-vs-governed demo proceeds only when the current Harmonic response contains an explicit executable permission (`ALLOW`/`PERMIT` family) together with `admissible=true`. Explicit refusal or `admissible=false` blocks. Anything else is unresolved and holds the synthetic consequence.

## Repository structure

```text
app/                    Next.js examination UI and API routes
examples/               Runnable public integration examples
fixtures/               Frozen synthetic examination fixtures
lib/                    Harness adapters and types
scripts/                Regression and examination scripts
docs/public/            Current public architecture and claim boundaries
docs/history/           Preserved historical release/examination lineage
```

Historical release notes and delta manifests are preserved under `docs/history/` so they remain auditable without being mistaken for current integration instructions.

## Version vocabulary

This repository contains several kinds of version labels. They are not interchangeable:

- **Harmonic runtime version** — version of the secure Harmonic service being examined.
- **Harness release version** — version of this public repository/package.
- **V### examination lineage** — preserved examination/revision identifiers such as V113 or V114.
- **methodology version** — frozen packet-construction methodology used by a specific examination path.

Do not infer runtime version from an examination identifier.

## V114 execution-boundary examination

The V114 route is a **synthetic constituted executor boundary**. It generates an ephemeral Ed25519 keypair for the examination and tests receiptless bypass, forgery, payload tampering, expiry, refusal, missing governance evidence, and a positive control.

It is not the production Harmonic secure-execution implementation and does not claim exhaustive production path coverage.

## Historical lineage

The repository intentionally preserves prior examinations, deltas, and manifests. Those records may describe retired endpoints or historical architectures.

Current integration guidance is authoritative only in:

- this README;
- `.env.example`;
- `docs/public/`; and
- the current executable source/tests.

Historical records live under [`docs/history/`](docs/history/).

## Package publication

`"private": true` in `package.json` intentionally prevents accidental npm publication. It does **not** mean the GitHub repository itself must be private.

## Public evidence rule

A public claim should be no broader than the evidence preserved by the corresponding examination.

**PASS where earned. Stop where the evidence stops.**
