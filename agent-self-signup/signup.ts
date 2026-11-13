/**
 * Sign-up helpers for the agent-self-signup example, kept free of I/O side
 * effects (no stdin, no process.exit) so `signup.test.ts` can run them offline
 * against a mocked `fetch`.
 */

import { ChronaryError, isAgentSignUpNewOrg } from '@chronary/sdk';
import type { AgentSignUpNewOrgResponse, AgentSignUpResponse, Chronary } from '@chronary/sdk';

export const DEFAULT_BASE_URL = 'https://api.chronary.ai';

/**
 * Read the current Terms of Service version from the public manifest
 * (`GET /v1/auth/terms/current`). Sign-up only accepts this exact string, so
 * never hardcode it: it rolls forward every time the Terms change.
 */
export async function fetchCurrentTermsVersion(
  baseUrl: string = DEFAULT_BASE_URL,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchFn(`${baseUrl.replace(/\/+$/, '')}/v1/auth/terms/current`);
  if (!res.ok) {
    throw new Error(`Could not read the current Terms version (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { version?: unknown };
  if (typeof body.version !== 'string' || body.version === '') {
    throw new Error('The Terms manifest did not include a version');
  }
  return body.version;
}

/** `current_version` from a `409 tos_version_stale` error, or null for any other error. */
export function staleTermsCurrentVersion(err: unknown): string | null {
  if (!(err instanceof ChronaryError) || err.errorType !== 'tos_version_stale') return null;
  const current = err.body?.current_version;
  return typeof current === 'string' && current !== '' ? current : null;
}

export interface SignUpInput {
  email: string;
  agent_name: string;
}

export interface SignUpOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

/**
 * Sign up with the Terms version that is current right now. If the Terms roll
 * forward between reading the manifest and signing up, the API answers
 * `409 tos_version_stale` with `current_version`; retry once with that value.
 * A second stale answer (or any other error) is thrown to the caller.
 *
 * Sending `tos_version` accepts the Terms for the owner of `email`: only do it
 * when they have authorized you to.
 */
export async function signUpWithCurrentTerms(
  client: Pick<Chronary, 'agentAuth'>,
  input: SignUpInput,
  options: SignUpOptions = {},
): Promise<AgentSignUpResponse> {
  const tosVersion = await fetchCurrentTermsVersion(options.baseUrl, options.fetch);
  try {
    return await client.agentAuth.signUp({ ...input, tos_version: tosVersion });
  } catch (err) {
    const current = staleTermsCurrentVersion(err);
    if (current === null || current === tosVersion) throw err;
    return client.agentAuth.signUp({ ...input, tos_version: current });
  }
}

export type SignUpOutcome =
  | ({ kind: 'new_org' } & AgentSignUpNewOrgResponse)
  /** HTTP 202: sign-ups are paused. No key is issued; the body is the same for every email. */
  | { kind: 'waitlisted'; message: string }
  /**
   * No credentials in the body. The API does not say why (the email may
   * already have an account), so callers must not claim either way (#1655).
   */
  | { kind: 'no_credentials'; message: string };

export function classifySignUp(result: AgentSignUpResponse): SignUpOutcome {
  if (isAgentSignUpNewOrg(result)) {
    return { kind: 'new_org', ...result };
  }
  if ('waitlisted' in result && result.waitlisted === true) {
    return { kind: 'waitlisted', message: result.message };
  }
  return { kind: 'no_credentials', message: result.message };
}
