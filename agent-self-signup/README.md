# agent-self-signup

**An AI agent registers itself with Chronary. No human signup, no OAuth, no console visit.**

This is the onramp that makes Chronary unique for autonomous agents. Your agent calls two endpoints, receives an email-delivered OTP, verifies, and walks away with its own org and API key.

```text
$ npm start

Org created:        org_8ab2…
Agent created:      agt_v4j8kLmN
API key:            chr_sk_…9f2c    ← restricted until OTP verified

We sent a 6-digit code to you@example.com.
Enter OTP: 482910

Full access unlocked

Authenticated as agent: Self-Signup Bot (agt_v4j8kLmN)

Store the key in your secret manager — anything an org-level key can do, this can do.
```

## What this demonstrates

- **`POST /v1/agent/sign-up`** — unauthenticated. Returns `org_id`, `agent_id`, and a restricted `api_key` that is only valid for the verify endpoint.
- **`POST /v1/agent/verify`** — authenticated with the restricted key. Unlocks the same key for full API access.
- **`tos_version`** — explicit consent to the Terms version the agent reviewed. The example reads it from `GET /v1/auth/terms/current` instead of hardcoding it (it rolls forward whenever the Terms change), and if the Terms change between that read and the sign-up, it retries once with the `current_version` from the `409 tos_version_stale` error. Sending it accepts the Terms for the owner of the email, so only sign up an inbox you are authorized for.
- **Three outcomes** — a new org with a restricted key; `202 { waitlisted: true }` while sign-ups are paused (no key, try again later); or a body with only a `message` and no credentials. The last one is deliberately opaque: to prevent email enumeration the API never says whether the email already had an account, so the example prints the API's message and does not guess.

## Why this matters

No other calendar API lets an agent self-register. Stripe, Google Calendar, Cronofy — every one of them requires a human to sign up first, then provision an API key, then hand it to the agent. Chronary collapses that into one round-trip an agent can make.

## Prerequisites

- Node.js ≥ 18
- An email inbox you can read (the OTP arrives within seconds)

## Setup

```bash
cp .env.example .env
# fill in SIGNUP_EMAIL with an inbox you control

npm install
npm start
# check email, paste OTP at the prompt
```

The script never prints the full key: it shows only the prefix and last four characters (`chr_sk_…9f2c`). The key itself is in `signUp.api_key` and is returned only once, so a real agent persists it to its secret manager or runtime environment (for example `CHRONARY_API_KEY`) at the marked spot at the end of [`index.ts`](./index.ts).

## Make it fully autonomous

For headless setups (CI, agent runtimes), replace the readline prompt with whatever can fetch the OTP — IMAP polling, a webhook receiver, a transactional-email API like Resend. The verify call works the same way.

## Tests

`signup.ts` holds the sign-up logic (Terms lookup, stale-version retry, outcome classification) with an injectable `fetch` and no prompts or process exits, and `signup.test.ts` covers it offline against a mocked `fetch`:

```bash
npm test
```

To point the example at another deployment, set `CHRONARY_BASE_URL` (defaults to `https://api.chronary.ai`).

## Files

- [`index.ts`](./index.ts) — the entire flow.
- [`signup.ts`](./signup.ts) — sign-up helpers: current Terms version, stale-version retry, outcome classification.
- [`signup.test.ts`](./signup.test.ts) — offline tests for the helpers.
- [`.env.example`](./.env.example) — environment variables.

---

Last verified: 2026-11-12 against `@chronary/sdk@0.9.0`.
