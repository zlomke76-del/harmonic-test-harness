# Harmonic Public Test Harness

This repository is a **public examination and integration harness** for Harmonic.
It does **not** contain the private Harmonic runtime.

The harness supplies explicit, bounded test evidence to the configured Harmonic API, preserves returned governance dispositions, and provides synthetic consequence boundaries for reproducible examination of determination and enforcement behavior.

**Start here:** [`BREAK THIS FIRST`](docs/public/BREAK_THIS_FIRST.md) · [`Contributing`](CONTRIBUTING.md) · [`Claim boundaries`](docs/public/CLAIM_BOUNDARIES.md) · [`Validation`](docs/public/VALIDATION.md)

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
npm ci
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

## Public hosted access

The original examination UI and API are open to visitors without a login or password.
`HARNESS_ACCESS_PASSWORD` is no longer required or used. Serve over HTTPS and keep
Harmonic and model-provider keys in server-side environment variables.
Cross-site state-changing browser submissions are rejected. Normal public GET/HEAD navigation remains open, including visitors arriving from links on other origins.
Live public tests use the deployment's configured provider credentials and budgets.

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
.github/                Falsification/reproduction issue forms and PR template
```

Historical release notes and delta manifests are preserved under `docs/history/` so they remain auditable without being mistaken for current integration instructions.

## Version vocabulary

This repository contains several kinds of version labels. They are not interchangeable:

- **Harmonic runtime version** — version of the secure Harmonic service being examined.
- **Harness release version** — version of this public repository/package.
- **V### examination lineage** — preserved examination/revision identifiers such as V113 or V114.
- **methodology version** — frozen packet-construction methodology used by a specific examination path.

Do not infer runtime version from an examination identifier.

## V116 Specialty Pack boundary-invariance examination

V116 is a **prospectively frozen** test of the Specialty Pack / Harmonic responsibility boundary. The pair holds every Pack-visible fact, rule, provenance, freshness condition, evidence-sufficiency condition, Pack output, and domain relationship constant. Only `/obligation_witness`, prospectively classified as downstream consequence-relative constitutional basis, changes; `/packet_id` changes only for transport identity.

Frozen property: **constitutional significance must not leak upstream into domain constitution.**

Run `npm run test:v116-pack-boundary-invariance` before any live replay, then use the Research examinations panel to run Case A and Case B unchanged and preserve both raw exports. V116 is not a result until the live pair has been executed and adjudicated against the frozen files.

## V114 execution-boundary examination

The V114 route is a **synthetic constituted executor boundary**. It generates an ephemeral Ed25519 keypair for the examination and tests receiptless bypass, forgery, payload tampering, expiry, refusal, missing governance evidence, and a positive control.

It is not the production Harmonic secure-execution implementation and does not claim exhaustive production path coverage.

## Public falsification and reproduction

The preferred entry point for external examination is [`docs/public/BREAK_THIS_FIRST.md`](docs/public/BREAK_THIS_FIRST.md).

GitHub issue forms distinguish:

- **Falsification attempt** — preserved evidence contradicts a frozen proposition; and
- **Reproduction result** — an independent PASS, FAIL, or UNRESOLVED rerun with an explicit claim ceiling.

A useful refinement is not automatically a falsification. Freeze the claim, show the evidence, and state exactly what the result reaches.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

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

## License

This public harness is released under the [MIT License](LICENSE).

The license applies to the contents of this repository only. It does **not** grant access to, disclose, or license the private Harmonic runtime, private credentials, private infrastructure, trademarks, or materials not included in this repository.

## Public evidence rule

A public claim should be no broader than the evidence preserved by the corresponding examination.

**PASS where earned. Stop where the evidence stops.**

## V117 Source Standing vs Source Continuity examination

V117 implements **RED TEAM 002** and moves upstream of V116. It freezes two current, attributable, available source records whose content, provenance, freshness, confidence and static hierarchy positions are identical across the pair. Only the independently attributable **current source-authority relation** changes.

The Pack must distinguish **historically authoritative** from **currently governing for this proposition**. Case A selects Source A. Case B must stop relying on still-fresh, still-available, historically primary Source A after its governing interval ends and select Source B under the frozen source-standing rule.

The primary disposition is local to the Specialty Pack source-selection boundary. Harmonic exact replay is deliberately secondary; it confirms that the constituted transition is accepted by the current Harmonic interface but cannot rescue an incorrect Pack result.

Run `npm run test:v117-source-standing`, then use the Research examinations panel to load Case A and Case B unchanged. Preserve both raw exports. No live result is claimed until the frozen pair is executed and adjudicated.

## V118 Registry Content Validity vs Issuer Standing examination

V118 implements **RED TEAM 003** and moves one level upstream of V117. The authority-registry record is fixed across the pair: same content, same issuer, same current status, same valid signature, same attribution and same integrity. Only the **independently established standing of the registry issuer** changes.

The frozen distinction is **registry content validity ≠ registry / issuer authority standing**. The anti-circularity rule is explicit: the registry statement under examination may not establish its own issuer standing.

Case A admits the record because independent charter evidence establishes the issuer as currently governing. Case B preserves the record as valid but refuses to use it as governing after the issuer's standing ends; because no successor-issued source-governance statement is supplied, the Pack returns `UNRESOLVED_AUTHORITY_STANDING` rather than silently inheriting the old authority statement.

Run `npm run test:v118-registry-authority-standing`, then use the Research examinations panel to load Case A and Case B unchanged. Harmonic exact replay is downstream witness evidence only. No live result is claimed until the frozen pair is executed and independently adjudicated.

## V121 / RED TEAM 005 — Authority scope sufficiency

Frozen distinction: **authority-chain continuity ≠ consequence-specific scope sufficiency**.

V121 keeps `R₀ → B → C` current and valid in both cases. The exact proposition, Scope `scope-s`, and Consequence `consequence-k` are fixed. Only the current effective B-to-C delegated scope changes. The Pack must derive the mismatch from the current delegation itself; no precomputed `scope_insufficient` flag is supplied.

Run the fixture integrity test with:

```bash
npm run test:v121-authority-scope-sufficiency
```

Then use **Research examinations → V121** for exact packet replay. Primary PASS/FAIL is at the Specialty Pack scope-admission boundary; Harmonic is downstream witness evidence only.

