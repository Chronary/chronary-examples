# mcp-claude-desktop

Drop-in MCP configurations that give Claude Desktop, Cursor, and Claude Code access to Chronary's 23 calendar tools through the [`chronary-mcp`](https://github.com/Chronary/chronary-mcp) stdio server.

No code, no install — `npx -y chronary-mcp` runs the latest published version on demand.

## What this demonstrates

- The `chronary-mcp` stdio server, built on the toolkit's `/mcp` adapter.
- One config snippet per host editor — pick the one that matches yours.
- Cross-platform — separate example for Windows, where `npx` must be invoked through `cmd /c`.

## Prerequisites

- Node.js ≥ 18 on the machine where the MCP client runs.
- A Chronary API key — sign up at [console.chronary.ai](https://console.chronary.ai).

## Setup

### Claude Desktop (macOS / Linux)

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) — create the file if it does not exist.
2. Copy the contents of [`claude_desktop_config.example.json`](./claude_desktop_config.example.json) into it.
3. Replace `chr_sk_…` with your real Chronary API key.
4. Restart Claude Desktop.

### Claude Desktop (Windows)

1. Open `%APPDATA%\Claude\claude_desktop_config.json` — create the file if it does not exist.
2. Copy the contents of [`claude_desktop_config.windows.example.json`](./claude_desktop_config.windows.example.json) into it. The Windows variant wraps `npx` in `cmd /c` because Node's `spawn` cannot resolve `npx.cmd` directly.
3. Replace `chr_sk_…` with your real Chronary API key.
4. Restart Claude Desktop.

### Cursor

1. Open `~/.cursor/mcp.json` (user-level) or `.cursor/mcp.json` (project-level) — create the file if it does not exist.
2. Copy the contents of [`cursor.mcp.example.json`](./cursor.mcp.example.json) into it.
3. Replace `chr_sk_…` with your real Chronary API key.
4. Restart Cursor.

### Claude Code

```bash
claude mcp add chronary --env CHRONARY_API_KEY=chr_sk_… npx -y chronary-mcp
```

## Verify

Once the host is restarted, ask the assistant to list calendars:

```
You: List my Chronary calendars.
```

The model should call `list_calendars` and return your calendars.

## Pre-soft-launch note

`chronary-mcp` is not yet published to npm — see [issue #222](https://github.com/Chronary/chronary/issues/222). Until it ships, point the config at a local build:

```bash
# from the monorepo root
pnpm --filter @chronary/sdk build
pnpm --filter @chronary/toolkit build
pnpm --filter chronary-mcp build
```

Then change the config's `command` / `args` to:

```json
"command": "node",
"args": ["/absolute/path/to/agentservices/packages/mcp/dist/index.js"]
```

Once `chronary-mcp` ships to npm, the `npx -y chronary-mcp` form Just Works.

## Files

- [`claude_desktop_config.example.json`](./claude_desktop_config.example.json) — Claude Desktop on macOS / Linux.
- [`claude_desktop_config.windows.example.json`](./claude_desktop_config.windows.example.json) — Claude Desktop on Windows.
- [`cursor.mcp.example.json`](./cursor.mcp.example.json) — Cursor user / project config.

---

Last verified: 2026-04-24 against `chronary-mcp@0.1.0`.
