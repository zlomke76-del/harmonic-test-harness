# Changelog

## 0.2.6 — V118 registry / issuer authority-standing examination

- Added prospective **V118 / RED TEAM 003** fixtures for registry-content validity vs registry/issuer standing.
- Freezes the authority-registry record byte-equivalent across the pair while changing only independently established issuer-standing state.
- Adds an explicit anti-circularity rule preventing the registry statement from bootstrapping its own issuer authority.
- Adds an executable Specialty Pack reference that returns `UNRESOLVED_AUTHORITY_STANDING` when a valid record's issuer no longer has standing.
- Uses canonical Harmonic V3.8 state-transition values (`consistent`, `invalidates_prior_state`, `current`, `non_current`) verified against the supplied private Harmonic source snapshot.
- Adds exact-replay Case A / Case B controls to the Research examinations panel.

## 0.2.2 — Public license

- Added the MIT License for the public Harmonic test harness.
- Clarified that the license applies only to materials contained in this repository and does not license the private Harmonic runtime or non-repository assets.
- Added `license: MIT` package metadata.
- Added public-contract coverage for the license surface.

## 0.2.1 — Public examination intake

- added a default **BREAK THIS FIRST** falsification target;
- added structured GitHub issue forms for falsification attempts and independent reproductions;
- added a pull request evidence/claim-boundary checklist;
- added contribution guidance and secret-handling rules;
- added a security disclosure boundary for sensitive findings;
- expanded the public contract test to preserve the examination intake surface.

## 0.2.0 — Raw vs Governed public release

- public raw-vs-governed terminal contrast;
- paired preserving and defeating ΔN fixtures;
- current `/api/evaluate` integration contract;
- V113 complete-information fixtures;
- V114 synthetic execution-boundary examination;
- public claim-boundary and validation documentation.
## 0.2.5 — V117 source-standing examination

- Added prospective **V117 / RED TEAM 002** fixtures for source standing vs source continuity.
- Freezes source content, provenance, freshness, confidence, availability and static hierarchy while changing only current source-authority state.
- Adds explicit authority effective intervals and retirement/supersession semantics.
- Adds fixture tests that reject freshness/hierarchy substitution for current governing authority.
- Adds exact-replay Case A / Case B controls to the Research examinations panel.
- Verifies fixture compatibility against the supplied private Harmonic runtime source without claiming a live result.
