# V116.1 — Public Navigation Hotfix

## Observed failure

A normal browser navigation to the public harness root could return:

```json
{"error":"cross_origin_request_rejected"}
```

when the browser reported `Sec-Fetch-Site: cross-site` (for example, after following a link from another origin).

## Cause

The hosted-access helper correctly rejected cross-site state-changing submissions, but middleware also applied that helper to `/`. The helper did not distinguish safe navigation methods from state-changing methods, so a cross-site GET navigation could be rejected.

## Fix

1. Middleware now applies hosted-access filtering only to `/api/:path*`.
2. `requireHostedAccess` explicitly allows `GET`, `HEAD`, and `OPTIONS`.
3. Cross-site `POST` and other state-changing submissions remain rejected.
4. Public-behavior regression coverage now proves cross-site GET/HEAD navigation remains open while cross-site POST remains blocked.

This hotfix changes public transport/access behavior only. It does not change V116 fixtures, Specialty Pack responsibility mapping, Harmonic inputs, expected dispositions, or the frozen invariance claim.
