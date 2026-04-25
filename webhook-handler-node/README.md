# webhook-handler-node

Production-ready webhook receiver for Chronary. Verifies HMAC-SHA256, rejects replays, and dispatches to typed handlers per event type.

```text
$ npm start

Listening for Chronary webhooks at http://localhost:3000/webhooks/chronary
✓ agent.created — agt_v4j8kLmN
✓ event.created — evt_9wKzYaB on cal_3xQpRsT
✓ proposal.confirmed — prp_2bL… → event evt_aQz…
✗ rejected: Webhook signature verification failed
```

## What this demonstrates

- **`constructEvent(rawBody, headers, secret)`** — verifies signature + parses JSON in one call. Uses `crypto.subtle.verify` under the hood, so it runs on Node, Bun, Cloudflare Workers, Deno, and Vercel Edge with no extra deps.
- **Replay protection** — Chronary's `X-Timestamp` header is checked against a 5-minute tolerance. Old payloads are rejected.
- **Typed event router** — the `WebhookEvent.type` discriminant covers all 17 event types Chronary emits today (`agent.*`, `event.*`, `event.hold_*`, `proposal.*`, `webhook.deactivated`).
- **Retry-aware error handling** — 400 on bad signature (Chronary backs off and retries: immediate → +1m → +5m → +30m → deactivates after 50 failures); 500 on handler errors (also retried).

## Prerequisites

- Node.js ≥ 18
- A Chronary webhook subscription:
  ```bash
  # one-off setup, e.g. via the SDK
  await chronary.webhooks.create({
    url: 'https://your-tunnel.example.com/webhooks/chronary',
    events: ['agent.created', 'event.created', 'proposal.confirmed'],
  });
  // ^ save the returned `secret` — it's shown only once
  ```
- A public URL to receive deliveries — easiest path is `cloudflared tunnel`:
  ```bash
  cloudflared tunnel --url http://localhost:3000
  # → use the printed https://<random>.trycloudflare.com URL when creating the webhook
  ```

## Setup

```bash
cp .env.example .env
# fill in CHRONARY_WEBHOOK_SECRET (from the webhook creation response)

npm install
npm start
```

Trigger an event in your Chronary org (create an agent, schedule an event) and watch the console.

## Idempotency

Every delivery includes `X-Delivery-Id`. Persist it (Postgres, Redis, even an in-memory `Set` for demos) and skip if you've seen it — Chronary will retry on any non-2xx response, so handlers must be idempotent. Not shown in this example to keep it lean.

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
cd examples/webhook-handler-node
npm install
npm start
```

Don't commit the `package.json` change — it's only for pre-soft-launch local runs.

## Files

- [`src/server.ts`](./src/server.ts) — the receiver and event router.
- [`.env.example`](./.env.example) — required environment variable.

---

Last verified: 2026-04-24 against `@chronary/sdk@0.1.0`.
