# Chronary examples

Runnable sample agents that talk to the [Chronary](https://chronary.ai) API. Each example is self-contained — own `package.json` / `pyproject.toml`, own `.env.example`, own README — so you can copy any one of them out of this repo and run it standalone.

## Where to start

If you've never used Chronary before, follow this order:

1. **[`quickstart-node`](./quickstart-node)** or **[`quickstart-python`](./quickstart-python)** — agent + calendar + event in 60 seconds, no LLM required.
2. **[`team-scheduling-bot`](./team-scheduling-bot)** — the hero demo. Cross-agent availability, multi-agent proposals, iCal subscription, outbound feeds — the four things no other calendar API offers, exercised in one ~150-line script.
3. Pick the one that matches your stack: `mcp-claude-desktop` (Claude / Cursor users), `vercel-ai-sdk-chat`, or `openai-agent-scheduler`.

## All examples

### Try Chronary in 60 seconds — no LLM, no framework

| Example | Stack | What it shows |
|---|---|---|
| [`quickstart-node`](./quickstart-node) | TypeScript · Node | Agent + calendar + event + list — the four primitives every integration starts with. ~30 lines. |
| [`quickstart-python`](./quickstart-python) | Python | Same dance, in Python. |

### Drop into your AI stack

| Example | Stack | What it shows |
|---|---|---|
| [`mcp-claude-desktop`](./mcp-claude-desktop) | Config files · `@chronary/mcp` over stdio | Drop-in MCP configs for Claude Desktop, Cursor, Claude Code. Zero code. |
| [`vercel-ai-sdk-chat`](./vercel-ai-sdk-chat) | TypeScript · Vercel AI SDK | Terminal chat using the toolkit's `/ai-sdk` adapter and `generateText({ tools })`. |
| [`openai-agent-scheduler`](./openai-agent-scheduler) | TypeScript · OpenAI SDK | One-shot agent loop using the toolkit's `/openai` adapter. |

### Why Chronary — exercise the differentiators

| Example | Stack | What it shows |
|---|---|---|
| [`agent-self-signup`](./agent-self-signup) | TypeScript · Node | An AI agent registers itself via API, no human signup. **Unique to Chronary.** |
| [`team-scheduling-bot`](./team-scheduling-bot) ★ | TypeScript · Node | The hero demo. Three agent types collaborating, iCal subscription, cross-agent availability, multi-agent proposals, outbound feeds — in one script. |

### Production-readiness

| Example | Stack | What it shows |
|---|---|---|
| [`webhook-handler-node`](./webhook-handler-node) | TypeScript · Hono on Node | HMAC-SHA256 signature verification, replay protection, typed event router. Same pattern works on Cloudflare Workers, Bun, Vercel Edge. |

## Conventions

- Each example is self-contained — copy any folder and it runs standalone (after npm publish; see below).
- API keys are read from `CHRONARY_API_KEY`. Never hardcoded.
- Cross-platform — scripts use `tsx` / `node` / `python`, no bash assumptions.
- Each README ends with a `Last verified` footer pinning the verified version of `@chronary/sdk` / `@chronary/toolkit`.

## Pre-soft-launch note

These examples reference `@chronary/sdk` and `@chronary/toolkit` at `^0.1.0`. The packages are not yet published — they will be at soft launch (tracked in [issue #222](https://github.com/Chronary/chronary/issues/222)). Until then, each README has a "Local development (pre-soft-launch)" section showing how to point npm/pip at the workspace builds.
