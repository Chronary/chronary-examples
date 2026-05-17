# quickstart-node

Calling Chronary in 60 seconds. No LLM, no framework — just `@chronary/sdk` and the four primitives that make up every Chronary integration: agent, calendar, event, list.

```text
$ npm start

Agent:    agt_v4j8kLmN
Calendar: cal_3xQpRsT
iCal feed (subscribe in Apple/Google Calendar): https://api.chronary.ai/ical/abc.ics
Event:    evt_9wKzYaB — Hello from Chronary @ 2026-04-25T15:00:00.000Z

1 event(s) on Quickstart Calendar:
  • 2026-04-25T15:00:00.000Z  Hello from Chronary
```

## What this demonstrates

- The four-line dance every Chronary integration starts with: register agent → create calendar → create event → list.
- The SDK's typed resource clients (`chronary.agents`, `chronary.calendars`, `chronary.events`).
- The `ical_url` returned on every calendar — paste it into Apple Calendar / Google Calendar and your phone shows the agent's schedule.

## Prerequisites

- Node.js ≥ 18
- A Chronary API key — sign up at [console.chronary.ai](https://console.chronary.ai), or see [`agent-self-signup`](../agent-self-signup) to have your agent register itself.

## Setup

```bash
cp .env.example .env
# fill in CHRONARY_API_KEY (test-mode key is fine)

npm install
npm start
```

That's it. ~30 lines of code, no AI required.

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
cd examples/quickstart-node
npm install
npm start
```

Don't commit the `package.json` change — it's only for pre-soft-launch local runs.

## Files

- [`index.ts`](./index.ts) — the entire example.
- [`.env.example`](./.env.example) — required environment variables.

---

Last verified: 2026-04-24 against `@chronary/sdk@0.1.0`.
