# team-scheduling-bot — the hero example

This is the demo that sells Chronary. In ~150 lines you'll see four things no other calendar API can do in one place:

1. **Three agent types collaborating** — `human` × 3 and `resource` × 1.
2. **iCal subscription (optional)** — pull a human's real Google/Outlook calendar in via `.ics` URL. No OAuth, no provider app, no token management.
3. **Cross-agent availability** — *"when are these 4 entities ALL free for 30 minutes tomorrow afternoon?"* in a single API call.
4. **Multi-agent proposals** — book three candidate slots, collect responses from each participant, auto-resolve the first slot every participant accepted into a confirmed event on a shared calendar.

```text
$ npm start

Creating team…
  Alice, Bob, Carol, Conference Room A

Finding 30-min slots when ALL 4 are free tomorrow afternoon…
  3 candidate slot(s):
    • 2026-04-25T12:30:00Z → 2026-04-25T13:00:00Z
    • 2026-04-25T14:00:00Z → 2026-04-25T15:00:00Z
    • 2026-04-25T16:00:00Z → 2026-04-25T16:30:00Z

Proposing 3 candidate slot(s) to the team…
  Proposal: prp_2bL…
  All 4 participants accepted slot 1.
  Confirmed → event on "Team meetings" at 2026-04-25T12:30:00Z.

Subscribe these URLs in Apple Calendar / Google Calendar / Outlook:
  Alice                https://api.chronary.ai/ical/abc….ics
  Bob                  https://api.chronary.ai/ical/def….ics
  Carol                https://api.chronary.ai/ical/ghi….ics
  Conference Room A    https://api.chronary.ai/ical/jkl….ics
  Team meetings        https://api.chronary.ai/ical/mno….ics
```

## Why this matters

| Capability | Chronary | Google Calendar API | Cronofy | Cal.com |
|---|---|---|---|---|
| Agents as scheduling participants (humans, AIs, resources) | ✅ | — | partial | — |
| One-call cross-agent availability | ✅ | — (N calls + client intersection) | partial | — |
| Inbound iCal subscription, no OAuth | ✅ | — | — | — |
| Multi-party proposals as a primitive | ✅ | — | — | — |
| Outbound iCal feed per calendar | ✅ | partial | partial | partial |

If you're building a scheduling agent, this is the differentiator surface. The example exercises all of it in one script.

## Prerequisites

- Node.js ≥ 18
- A Chronary API key — sign up at [console.chronary.ai](https://console.chronary.ai)
- *(Optional)* The "Secret address in iCal format" URL from your Google/Outlook calendar, if you want to see your real schedule respected by the availability query.

## Setup

```bash
cp .env.example .env
# fill in CHRONARY_API_KEY, optionally ALICE_ICAL_URL

npm install
npm start
```

After it finishes, paste any of the printed `ical_url` values into Apple Calendar (`File → New Calendar Subscription…`), Google Calendar (`Other calendars → Subscribe`), or Outlook. The agent's schedule shows up on your phone.

## How it maps to the API

| Step | Endpoint |
|---|---|
| Create human / resource agent | `POST /v1/agents` |
| Create agent-owned calendar | `POST /v1/agents/:id/calendars` |
| Subscribe to external iCal | `POST /v1/agents/:id/ical-subscriptions` |
| Cross-agent availability | `GET /v1/availability?agents=…` |
| Create proposal | `POST /v1/scheduling/proposals` |
| Respond to proposal | `POST /v1/scheduling/proposals/:id/respond` |
| Resolve proposal → event | `POST /v1/scheduling/proposals/:id/resolve` |

Every endpoint is also exposed as an MCP tool, so an LLM can drive this same flow via tool calling — see [`vercel-ai-sdk-calendar-chat`](../vercel-ai-sdk-calendar-chat) and [`openai-agent-scheduler`](../openai-agent-scheduler).

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
cd examples/team-scheduling-bot
npm install
npm start
```

Don't commit the `package.json` change — it's only for pre-soft-launch local runs.

## Files

- [`src/index.ts`](./src/index.ts) — the full demo.
- [`.env.example`](./.env.example) — required environment variables.

---

Last verified: 2026-04-24 against `@chronary/sdk@0.1.0`.
