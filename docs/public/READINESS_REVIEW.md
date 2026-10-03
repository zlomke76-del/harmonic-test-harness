# Public readiness review — October 3, 2026

Reviewed base commit: `d59845694916573531b344ce4df54d5749af5f89`.

The public documentation correctly separates constituted evidence, Harmonic
judgment, and synthetic execution. The private runtime is not included in the
reviewed current source. V113 fixture checks preserve the verdict-path claim ceiling;
V114 remains a synthetic boundary examination with a locally generated signer.

## Owner-directed public access update

The owner requested the original full harness remain publicly accessible. The
password gate added during this review has been removed. The UI and API accept
anonymous same-origin use, including live tests with configured provider credentials.
`HARNESS_ACCESS_PASSWORD` is not required or used. Cross-site browser submissions
still reject, and server API keys remain server-side.

## Changes applied before hosted use

- Updated Next.js to 15.5.27 and React/React DOM to 19.0.4; pinned patched
  PostCSS and Sharp transitive dependencies. Removed unused ESLint dependencies
  and replaced the unconfigured `next lint` command with `typecheck`.
- Preserved public access as directed by the owner, with independent cross-site
  request checks before routes use model or Harmonic server credentials. Use HTTPS.
- Removed the ten-second acceptance grace period outside signed receipt validity.
  Malformed receipt structures and key/signature verification failures fail closed.
- Added executable tests of the actual synthetic sink route and the hosted-access
  helper; preserved historical source/fixture checks as distinct evidence.
- Added CI acceptance, build, type checking, and production dependency audit.
- Added bounded transport timeouts for exact replay and the CLI example, and
  bounded model request timeout/retries/output.
- Expanded ignored environment-file patterns to avoid accidental credential commits.

## Validation

- `npm test`: PASS, including actual route receipt behavior and V114 controls.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm audit`: zero known vulnerabilities at review time.
- Local production HTTP checks: anonymous UI and V114 examination succeed;
  malformed anonymous API inputs reach validation; cross-origin POST rejects.
- Common credential-pattern scan: 439 commits / 456 unique blobs inspected;
  matches in historical documentation/environment examples were labeled placeholders.
  This is a bounded pattern scan, not a universal secret-detection guarantee.

## Remaining evidence boundaries

No live Harmonic API or model-provider call was made during this review; no key was
provided. Local success does not claim live determination or production enforcement.
The synthetic sink has no persisted receipt consumption; valid in-window replay is
possible. It does not establish anti-replay or exactly-once execution.

Public live execution uses the configured providers and their budgets. This
repository does not implement durable per-visitor quotas.
The review does not verify any existing deployment's environment configuration.
