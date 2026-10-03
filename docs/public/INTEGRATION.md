# Public Integration Boundary

The public harness integrates with the secure Harmonic service as an external client.

```text
fixture / model proposal
        |
        v
explicit structured witness
        |
        v
POST /api/evaluate  ---> private Harmonic runtime
        |
        v
governance disposition
        |
        v
examined local execution boundary
```

The repository must never contain a production Harmonic secret or a copy of the private Harmonic core.

## Current endpoint

```text
POST https://www.solace-harmonic.com/api/evaluate
Authorization: Bearer <issued key>
Content-Type: application/json
```

## Public-secret rule

For local CLI use, the operator supplies an issued key through the environment.

For a browser-hosted public demo, keep the Harmonic credential server-side and expose only an allowlisted synthetic-demo route. Never ship the credential to the browser bundle.

## Determination vs enforcement

A Harmonic response establishes the returned governance disposition for the submitted packet. It does not by itself prove that every downstream production route obeyed that disposition.

Where enforcement is examined, preserve the exact boundary and falsifier separately.

## Hosted examiner access

Set `HARNESS_ACCESS_PASSWORD` to a unique password of at least 24 characters and
serve over HTTPS. The UI and API require HTTP Basic access (`harness` username).
The model-comparison and exact-replay routes check authentication themselves before
using server credentials. Never publish the password in source or a browser bundle.
Authenticated examiners can still incur provider costs; use provider budgets as well.
Anonymous public access requires a separate fixture allowlist and durable quotas.
