# Contributing to the Harmonic Public Test Harness

The most useful contribution is preserved evidence against a bounded claim.

## Start with one of three contribution types

1. **Falsification attempt** — a frozen claim predicts one result and your preserved run produces another.
2. **Independent reproduction** — you rerun a published examination and report PASS, FAIL, or UNRESOLVED with a claim ceiling.
3. **Implementation improvement** — a code or documentation change that does not silently broaden what the evidence establishes.

Start with [`docs/public/BREAK_THIS_FIRST.md`](docs/public/BREAK_THIS_FIRST.md).

## Evidence rules

- Freeze the proposition before arguing about it.
- Separate source intent, runtime behavior, authoritative external state, and consequence evidence.
- Do not promote correspondence into causation without evidence.
- Do not promote a run-level finding into a control-wide finding without coverage.
- Do not treat a descriptive status as execution authority.
- Preserve PASS, FAIL, and UNRESOLVED results.
- State the exact version, path, and environment examined.

## Pull requests

Before opening a PR:

```bash
npm install
npm test
```

If your change affects a specific examination, also run its direct script.

Keep historical lineage intact. If prior material is stale, move or label it as historical rather than rewriting the record.

## Secrets and private core

Never commit:

- Harmonic API keys;
- model-provider keys;
- receipt-signing/private keys;
- private Harmonic runtime source;
- customer data or credentials.

Use placeholders and local environment variables only.

## Scope language

Prefer exact statements such as:

> Reproduced the V114 synthetic execution-boundary behavior for this commit.

Avoid statements such as:

> Harmonic can never be bypassed.

unless the evidence actually covers that broader proposition.

## Licensing note

This repository does not currently publish a general open-source license. Do not assume redistribution or reuse rights beyond what GitHub access itself provides. A license decision should be made explicitly by the repository owner.
