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

## Public hosted access

The examination UI and API are open without HTTP Basic authentication.
`HARNESS_ACCESS_PASSWORD` is not required or used. Serve over HTTPS and keep
provider API keys server-side. Cross-site browser submissions are rejected.
Live public examinations use the configured server provider credentials and budgets.
