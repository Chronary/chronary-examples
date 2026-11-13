/**
 * Offline tests for the sign-up helpers: a real `Chronary` client talks to a
 * mocked `fetch`, so no network or inbox is needed. Run with `npm test`.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Chronary, ChronaryError } from '@chronary/sdk';
import {
  classifySignUp,
  fetchCurrentTermsVersion,
  signUpWithCurrentTerms,
} from './signup.js';

const BASE = 'https://api.test';

interface Recorded {
  method: string;
  path: string;
  body: Record<string, unknown> | undefined;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** A fetch that answers each call with the next queued response and records the request. */
function mockFetch(responses: Response[]): { fetch: typeof fetch; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const queue = [...responses];
  const fn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const raw = init?.body;
    calls.push({
      method: init?.method ?? 'GET',
      path: url.pathname,
      body: typeof raw === 'string' ? (JSON.parse(raw) as Record<string, unknown>) : undefined,
    });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected request ${url.pathname}`);
    return next;
  };
  return { fetch: fn as typeof fetch, calls };
}

const terms = (version: string) =>
  json(200, { version, effective_at: version, url: `https://chronary.ai/terms/v/${version}`, material: false });

const stale = (current: string) =>
  json(409, {
    error: {
      type: 'tos_version_stale',
      message: 'The submitted terms-of-service version is out of date',
      current_version: current,
      request_id: 'req_1',
    },
  });

const newOrg = {
  org_id: 'org_1',
  agent_id: 'agt_1',
  api_key: 'chr_sk_restricted_abcd',
  message: 'Verification code sent to email',
};

function setup(responses: Response[]) {
  const mock = mockFetch(responses);
  const client = new Chronary({ baseUrl: BASE, fetch: mock.fetch, maxRetries: 0 });
  const opts = { baseUrl: BASE, fetch: mock.fetch };
  return { client, opts, calls: mock.calls };
}

const input = { email: 'owner@example.com', agent_name: 'Self-Signup Bot' };

describe('fetchCurrentTermsVersion', () => {
  it('returns the manifest version', async () => {
    const { opts, calls } = setup([terms('2026-11-12')]);
    assert.equal(await fetchCurrentTermsVersion(`${BASE}/`, opts.fetch), '2026-11-12');
    assert.equal(calls[0]?.path, '/v1/auth/terms/current');
  });

  it('throws on a non-2xx answer', async () => {
    const { opts } = setup([json(503, { error: { type: 'unavailable', message: 'down' } })]);
    await assert.rejects(fetchCurrentTermsVersion(BASE, opts.fetch), /HTTP 503/);
  });

  it('throws when the manifest has no version', async () => {
    const { opts } = setup([json(200, {})]);
    await assert.rejects(fetchCurrentTermsVersion(BASE, opts.fetch), /did not include a version/);
  });
});

describe('signUpWithCurrentTerms', () => {
  it('sends the current Terms version, not a hardcoded one', async () => {
    const { client, opts, calls } = setup([terms('2026-11-12'), json(200, newOrg)]);
    const result = await signUpWithCurrentTerms(client, input, opts);
    assert.deepEqual(result, newOrg);
    assert.equal(calls.length, 2);
    assert.equal(calls[1]?.method, 'POST');
    assert.equal(calls[1]?.path, '/v1/agent/sign-up');
    assert.deepEqual(calls[1]?.body, { ...input, tos_version: '2026-11-12' });
  });

  it('retries once with current_version when the Terms rolled forward', async () => {
    const { client, opts, calls } = setup([terms('2026-11-12'), stale('2026-12-01'), json(200, newOrg)]);
    const result = await signUpWithCurrentTerms(client, input, opts);
    assert.deepEqual(result, newOrg);
    assert.equal(calls.length, 3);
    assert.equal(calls[1]?.body?.tos_version, '2026-11-12');
    assert.equal(calls[2]?.body?.tos_version, '2026-12-01');
  });

  it('gives up after one retry', async () => {
    const { client, opts, calls } = setup([terms('2026-11-12'), stale('2026-12-01'), stale('2026-12-02')]);
    await assert.rejects(signUpWithCurrentTerms(client, input, opts), (err: unknown) => {
      assert.ok(err instanceof ChronaryError);
      assert.equal(err.errorType, 'tos_version_stale');
      return true;
    });
    assert.equal(calls.length, 3);
  });

  it('does not retry when current_version equals the version just sent', async () => {
    const { client, opts, calls } = setup([terms('2026-11-12'), stale('2026-11-12')]);
    await assert.rejects(signUpWithCurrentTerms(client, input, opts), ChronaryError);
    assert.equal(calls.length, 2);
  });

  it('rethrows any other error without retrying', async () => {
    const { client, opts, calls } = setup([
      terms('2026-11-12'),
      json(400, { error: { type: 'validation_error', message: 'email is invalid' } }),
    ]);
    await assert.rejects(signUpWithCurrentTerms(client, input, opts), /email is invalid/);
    assert.equal(calls.length, 2);
  });
});

describe('classifySignUp', () => {
  it('new org: credentials are present', () => {
    const outcome = classifySignUp(newOrg);
    assert.equal(outcome.kind, 'new_org');
    assert.equal(outcome.kind === 'new_org' && outcome.api_key, newOrg.api_key);
  });

  it('waitlisted: sign-ups are paused, no key', async () => {
    const message = 'Sign-ups are paused. We will email you when a spot opens.';
    const { client, opts } = setup([terms('2026-11-12'), json(202, { waitlisted: true, message })]);
    const outcome = classifySignUp(await signUpWithCurrentTerms(client, input, opts));
    assert.deepEqual(outcome, { kind: 'waitlisted', message });
  });

  it('no credentials: keeps only the API message, never claims the email is registered', async () => {
    const message = 'Verification code sent to email';
    const { client, opts } = setup([terms('2026-11-12'), json(200, { message })]);
    const outcome = classifySignUp(await signUpWithCurrentTerms(client, input, opts));
    assert.deepEqual(outcome, { kind: 'no_credentials', message });
  });
});
