# V113 Full-Files Delta Manifest

Prospective successor correction to V112. Harmonic runtime is unchanged.

Complete files in this delta:

- `V113_COMPLETE_INFORMATION_STANDING_SUCCESSOR_EXAMINATION.md`
- `V113_FULL_FILES_DELTA_MANIFEST.md`
- `app/page.tsx`
- `app/api/replay-exact/route.ts`
- `lib/examination-integrity.ts`
- `scripts/test-v113-complete-information-standing-fixtures.cjs`
- `fixtures/v113-complete-information-standing/freeze.json`
- `fixtures/v113-complete-information-standing/dn1-specialty-input.json`
- `fixtures/v113-complete-information-standing/dn1-specialty-output.json`
- `fixtures/v113-complete-information-standing/dn1-harmonic-packet.json`
- `fixtures/v113-complete-information-standing/dn2-specialty-input.json`
- `fixtures/v113-complete-information-standing/dn2-specialty-output.json`
- `fixtures/v113-complete-information-standing/dn2-harmonic-packet.json`

V113 changes the examination integrity boundary so that Harmonic receives the complete caller-attributed transition classification required by its constituted interface (`consistent_with_prior_state` / `material_contradiction`) while still rejecting case-specific standing, revalidation, admissibility, or execution-disposition answers upstream.

Fixture verification: V108 PASS, V109 PASS, V112 PASS, V113 PASS.
Full Next build was not executed because the uploaded repository does not include `node_modules`.
