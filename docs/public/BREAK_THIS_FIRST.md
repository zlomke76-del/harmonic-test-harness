# BREAK THIS FIRST

This is the default public falsification target for the Harmonic test harness.

## Frozen target claim

For the bundled **raw-vs-governed** example, after a **defeating ΔN**, the governed local synthetic executor must not invoke the synthetic consequence unless the current Harmonic response supplies both:

1. `admissible=true`; and
2. an explicit executable permission from the `ALLOW` / `PERMIT` family.

A generic `PASS`, `APPROVED`, `ADMISSIBLE`, or similar descriptive status is not sufficient execution authority.

## Run it

```bash
npm install
HARMONIC_API_KEY=your_issued_key npm run example:raw-vs-governed
```

## Try to falsify it

Produce this bounded result:

```text
defeating ΔN
+ governed path
+ no explicit executable permit
+ synthetic consequence occurred
```

If you can produce that result without changing the frozen proposition into a different claim, preserve the evidence and open a **Falsification attempt** issue.

## Preserve

- repository tag and commit;
- Node version and operating system;
- exact fixture/input packet used;
- Harmonic response returned for that packet;
- synthetic execution result;
- any code or configuration modification required to obtain the result.

Never publish API keys, credentials, signing secrets, or private runtime source.

## Accepted dispositions

A result may be:

- **PASS** — the examined evidence supports the frozen proposition for the examined path/version;
- **FAIL** — preserved evidence contradicts the frozen proposition;
- **UNRESOLVED** — the available evidence does not earn either conclusion.

A new distinction, broader architectural criticism, or adjacent property is not automatically a failure of this frozen claim. It may instead be a claim-boundary dispute or successor examination.

## Claim ceiling

This target concerns the bundled public harness path. It does not establish universal production non-bypassability, arbitrary domain inference, or every downstream execution route.

**Break the artifact, not the post.**

**PASS where earned. Stop where the evidence stops.**
