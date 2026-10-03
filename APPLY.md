# Apply — Public Falsification Intake Upgrade

Copy the files in this delta over the repository root, preserving paths.

This upgrade adds:

- a visible `BREAK THIS FIRST` bounded falsification target;
- GitHub issue forms for falsification attempts and independent reproductions;
- a pull-request claim/evidence checklist;
- contribution guidance;
- security-sensitive disclosure guidance;
- changelog entry and harness package version `0.2.1`;
- public-contract regression assertions for the new intake surface.

## Verify

```bash
npm install
npm test
```

Expected current acceptance result: PASS.

## Still requires an owner decision

No general open-source license is added by this delta. Choose a license explicitly before representing the repository as open source or inviting unrestricted reuse.
