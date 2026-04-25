# openai-agent-scheduler

A one-shot terminal agent that uses the OpenAI Chat Completions API and the Chronary toolkit's `/openai` adapter to read and write calendars.

```text
$ npm start -- "Find a 30-minute slot tomorrow afternoon and book Deep work on my default calendar."

  → list_calendars({})
  → get_availability({"calendar_id":"cal_xyz","start_time":"2026-04-25T13:00:00Z","end_time":"2026-04-25T18:00:00Z","duration_minutes":30})
  → create_event({"calendar_id":"cal_xyz","title":"Deep work","start_time":"2026-04-25T14:00:00Z","end_time":"2026-04-25T14:30:00Z"})

Booked "Deep work" tomorrow from 2:00–2:30 PM on your default calendar.
```

## What this demonstrates

- The toolkit's [`/openai` adapter](https://github.com/Chronary/chronary-toolkit) — `new ChronaryToolkit({ apiKey }).getTools()` returns ChatCompletion-format tool definitions.
- A simple agent loop — call the model, dispatch tool calls via `toolkit.execute(name, args)`, feed results back, repeat until the model stops calling tools.
- No framework required — just the `openai` npm package and the toolkit.

## Prerequisites

- Node.js ≥ 18
- A Chronary API key — sign up at [console.chronary.ai](https://console.chronary.ai)
- An OpenAI API key

## Setup

```bash
cp .env.example .env
# fill in CHRONARY_API_KEY and OPENAI_API_KEY

npm install
npm start -- "Find a 30-minute slot tomorrow at 2pm and book it as Focus block."
```

Pass any natural-language scheduling request as the argument. Omit it to use the default prompt.

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
cd examples/openai-agent-scheduler
npm install
npm start
```

Don't commit the `package.json` change — it's only for pre-soft-launch local runs.

## Files

- [`src/index.ts`](./src/index.ts) — the full agent loop in ~60 lines.
- [`.env.example`](./.env.example) — required environment variables.

---

Last verified: 2026-04-24 against `@chronary/sdk@0.1.0` and `@chronary/toolkit@0.1.0`.
