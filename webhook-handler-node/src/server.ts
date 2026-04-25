/**
 * Webhook receiver for Chronary events.
 *
 * Verifies the HMAC-SHA256 signature, parses the JSON, and dispatches to a
 * typed handler per event type. The same pattern works on any Hono-compatible
 * runtime (Node, Bun, Cloudflare Workers, Vercel Edge).
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { ChronaryError, constructEvent } from '@chronary/sdk';
import type { WebhookEvent } from '@chronary/sdk';

const secret = process.env.CHRONARY_WEBHOOK_SECRET;
const port = Number(process.env.PORT ?? 3000);
if (!secret) throw new Error('CHRONARY_WEBHOOK_SECRET is not set');

const app = new Hono();

app.post('/webhooks/chronary', async (c) => {
  const rawBody = await c.req.text();

  let event: WebhookEvent;
  try {
    event = await constructEvent(rawBody, c.req.raw.headers, secret);
  } catch (error) {
    // Bad signature, expired timestamp, malformed JSON → 400. Chronary will
    // back off and retry: immediate, +1m, +5m, +30m before deactivating.
    const message = error instanceof ChronaryError ? error.message : 'verification failed';
    console.error(`✗ rejected: ${message}`);
    return c.json({ error: message }, 400);
  }

  try {
    await handleEvent(event);
  } catch (error) {
    // Return 500 so Chronary retries. Idempotency: every payload includes
    // X-Delivery-Id; persist it server-side and skip duplicates.
    console.error('✗ handler error:', error);
    return c.json({ error: 'handler failed' }, 500);
  }

  return c.json({ received: true });
});

async function handleEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case 'agent.created':
      console.log(`✓ agent.created — ${(event.data.agent as { id: string }).id}`);
      break;
    case 'event.created':
      console.log(`✓ event.created — ${(event.data.event as { id: string }).id} on ${event.data.calendar_id}`);
      break;
    case 'event.updated':
      console.log(`✓ event.updated — ${(event.data.event as { id: string }).id}`);
      break;
    case 'event.deleted':
      console.log(`✓ event.deleted — ${event.data.event_id}`);
      break;
    case 'proposal.confirmed':
      console.log(`✓ proposal.confirmed — ${event.data.proposal_id} → event ${event.data.created_event_id}`);
      break;
    case 'webhook.deactivated':
      console.warn('⚠ Chronary deactivated this webhook after repeated failures.');
      break;
    default:
      console.log(`· ${event.type}`);
  }
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening for Chronary webhooks at http://localhost:${info.port}/webhooks/chronary`);
});
