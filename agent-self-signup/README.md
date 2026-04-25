# agent-self-signup

**An AI agent registers itself with Chronary. No human signup, no OAuth, no console visit.**

This is the onramp that makes Chronary unique for autonomous agents. Your agent calls two endpoints, receives an email-delivered OTP, verifies, and walks away with its own org and live API key.

```text
$ npm start

Org created:        org_8ab2…
Agent created:      agt_v4j8kLmN
Test-mode key:      chr_sk_test_…    ← usable now
Live-mode key:      chr_sk_live_…    ← restricted until OTP verified

We sent a 6-digit code to you@example.com.
Enter OTP: 482910

Full access unlocked

Authenticated as agent: Self-Signup Bot (agt_v4j8kLmN)
```

## What this demonstrates

- **`POST /v1/agent/sign-up`** — unauthenticated. Returns `org_id`, `agent_id`, a `test_api_key` (usable immediately) and a restricted `api_key` (live mode, only valid for the verify endpoint).
- **`POST /v1/agent/verify`** — authenticated with the restricted live key. Unlocks the same key for full API access.
- **Anti-enumeration design** — if the email is already registered, the response is opaque (`isAgentSignUpNewOrg` returns false, no credentials leaked).
- **`tos_version`** — explicit consent to the terms version the agent reviewed.

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

The script prints both keys at the end. Save the live key somewhere safe — it's shown once.

## Make it fully autonomous

For headless setups (CI, agent runtimes), replace the readline prompt with whatever can fetch the OTP — IMAP polling, a webhook receiver, a transactional-email API like Resend. The verify call works the same way.

## Local development (pre-soft-launch)

`@chronary/sdk` is not yet on npm — see [issue #222](https://github.com/Chronary/chronary/issues/222). To run against the workspace build, swap the registry ref for a local file path:

```bash
# 1. Build the workspace package
pnpm --filter @chronary/sdk build

# 2. In this example's package.json, change:
#      "@chronary/sdk": "^0.1.0"
#    to:
#      "@chronary/sdk": "file:../../packages/sdk"

# 3. Install and run
cd examples/agent-self-signup
npm install
npm start
```

Don't commit the `package.json` change — it's only for pre-soft-launch local runs.

## Files

- [`index.ts`](./index.ts) — the entire flow.
- [`.env.example`](./.env.example) — required environment variable.

---

Last verified: 2026-04-24 against `@chronary/sdk@0.1.0`.
