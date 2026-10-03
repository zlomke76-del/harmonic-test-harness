# Stale Historical Regression Notes

The source archive contained several npm regression commands whose assertions targeted superseded snapshots rather than the current public contract. They were removed from `package.json` as active commands but the underlying scripts remain preserved in `scripts/` for lineage inspection.

Removed from active npm commands:

- `test:v2-runtime-selector` — expected an older two-value runtime selector.
- `test:v72-obligation-witness` — expected an older obligation-witness injection string/build marker.
- `test:v76-synthetic-fixture-transport` — expected superseded fixture provenance markers.
- `test:v81-synthetic-fixture-transport` — expected natural-language fixture translation to be active by default; current methodology requires explicit opt-in/structured evidence.
- `test:v91` — expected older "Current Production" UI labels.

These scripts are historical assertions, not current public acceptance criteria. The current acceptance suite is `npm test` / `npm run test:current`.
