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
- V114 synthetic execution-boundary enforcement;
- the raw-vs-governed public terminal demo contract.

Historical snapshot tests are not silently treated as current acceptance criteria. Where a historical assertion no longer matches the present architecture, it is preserved as lineage and documented under `docs/history/` rather than allowed to fail the public default suite.
