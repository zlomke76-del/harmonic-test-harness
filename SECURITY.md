# Security Policy

## Do not publish secrets in issues or pull requests

Never post Harmonic API keys, provider credentials, signing keys, customer data, or private runtime source in this public repository.

If evidence contains a secret, redact the secret while preserving the surrounding structure needed to evaluate the claim.

## Security-sensitive findings

Do **not** open a public issue for a finding that could enable unauthorized access, secret extraction, production bypass, or exploitation of a live service.

Instead, contact the repository owner privately through an established private channel and provide:

- affected version/commit;
- bounded reproduction steps;
- expected vs. observed behavior;
- impact;
- redacted evidence sufficient to reproduce safely.

Public discussion can occur after the issue is contained and a disclosure boundary is agreed.

## Public falsification is still encouraged

Non-sensitive claim falsification, reproduction results, and synthetic harness failures should use the repository issue templates.
