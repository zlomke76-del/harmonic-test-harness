# Current Validation Surface

Run:

```bash
npm test
```

The current public acceptance suite checks:

- public-repository documentation and secret hygiene;
- the single-call `/api/evaluate` integration contract;
- v4.2 contract visibility;
- current explicit-witness methodology integrity;
- V108/V109/V112/V113 examination-lineage fixtures;
- V114 source regression and executable synthetic receipt-route tests (positive control, forgery, tamper, refusal, exact expiry, future validity, malformed receipt, and unavailable key);
- the raw-vs-governed public terminal demo contract.

Historical snapshot tests are not silently treated as current acceptance criteria. Where a historical assertion no longer matches the present architecture, it is preserved as lineage and documented under `docs/history/` rather than allowed to fail the public default suite.

## Evidence limits

Most legacy scripts assert source structure or frozen fixture hashes. Those checks do
not rerun the live Harmonic service. `test:public-behavior` executes the actual sink
route export and hosted access helper locally with an ephemeral test key. V114's
self-contained examination uses a locally generated key, not a Harmonic-issued permit.
No live-service PASS is implied by `npm test` or a successful production build.

The synthetic sink does not persist receipt consumption or enforce one-time use.
A valid receipt can be replayed within its validity window. No anti-replay or
exactly-once production execution claim is made.
