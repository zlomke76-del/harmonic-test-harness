# V116 Public Repository Cleanup — Apply Instructions

This is a **full-files delta** against the uploaded `harmonic-test-harness-main (8)(1).zip` source.

## Apply

1. Copy every file/folder in this delta into the repository root, preserving paths.
2. Delete every path listed in `DELETE_PATHS.txt` from the repository root. Those historical records are not discarded; replacement copies are included under `docs/history/root-lineage/`.
3. Run:

```bash
npm install
npm test
```

4. Configure a real Harmonic key only in local/server environment variables. Do not commit it.

## What V116 fixes

- replaces the favicon-only README with current public harness documentation;
- removes the retired direct `/api/governance-pack` endpoint from `.env.example`;
- states that the raw-vs-governed demo uses a frozen synthetic proposal rather than a live LLM;
- removes claims of an external HTTP disclosure from the demo contract;
- requires explicit execution permission plus `admissible=true` before the synthetic consequence may proceed;
- stops generic `PASS`, `APPROVED`, `ADMISSIBLE`, `CONTACT_CONFIRMED`, and `AUTHORITY_CONTINUOUS` labels from being normalized into `ALLOW`;
- separates current public docs from historical lineage;
- gives the package a public-harness identity (`harmonic-public-test-harness`, v0.2.0);
- adds `npm test` / `test:current` as the current acceptance surface;
- removes stale historical regression commands from active npm scripts while preserving their source files;
- repairs the stale unified single-call test to assert the current methodology witness;
- adds public claim-boundary, integration, and validation documentation.

## Verified

`npm test` passes for the current public acceptance suite.

A production Next.js build was not completed in this environment because installing the full dependency tree timed out. No build success is claimed here.
