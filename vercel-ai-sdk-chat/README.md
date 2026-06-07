# vercel-ai-sdk-chat

A terminal chat where the model uses the Chronary toolkit's Vercel AI SDK adapter to read and write calendars.

```text
$ npm start

Chronary scheduling chat. Type "exit" to quit.

you ▸ Schedule a 30-min sync with the team next Tuesday at 10am.
bot ▸ I checked the team's availability and booked "Team sync" on Tuesday Apr 30 from
       10:00–10:30 ET. Anything else?
```

## What this demonstrates

- The toolkit's [`/ai-sdk` adapter](https://github.com/Chronary/chronary-toolkit) — pass `chronaryTools({ apiKey })` straight into `generateText({ tools })`.
- Multi-step tool calls via `maxSteps: 5` so the model can chain `list_calendars` → `find_meeting_time` → `create_event` in one turn.
- A pure-Node terminal loop with `readline` — no Next.js scaffolding to wade through.

## Prerequisites

- Node.js ≥ 18
- A Chronary API key — sign up at [console.chronary.ai](https://console.chronary.ai)
- An OpenAI API key

## Setup

```bash
cp .env.example .env
# fill in CHRONARY_API_KEY and OPENAI_API_KEY

npm install
npm start
```

Type a scheduling request at the `you ▸` prompt. `exit` quits.

## Local development (pre-soft-launch)

`@chronary/sdk` and `@chronary/toolkit` are not yet on npm — see [issue #222](https://github.com/Chronary/chronary/issues/222). To run against the workspace builds, swap the registry refs for local file paths:

```bash
# 1. Build the workspace packages
pnpm --filter @chronary/sdk build
pnpm --filter @chronary/toolkit build

# 2. In this example's package.json, change:
#      "@chronary/sdk": "^0.1.0"        →  "@chronary/sdk": "file:../../packages/sdk"
#      "@chronary/toolkit": "^0.1.0"    →  "@chronary/toolkit": "file:../../packages/toolkit"

# 3. Install and run
cd examples/vercel-ai-sdk-chat
npm install
npm start
```

Don't commit the `package.json` change — it's only for pre-soft-launch local runs.

## Files

- [`index.ts`](./index.ts) — the entire example.
- [`.env.example`](./.env.example) — required environment variables.

---

Last verified: 2026-04-24 against `@chronary/sdk@0.1.0` and `@chronary/toolkit@0.1.0`.
