/**
 * Watch an AI agent register itself with Chronary.
 *
 * No human visits the console, no OAuth dance — the agent calls the API and
 * gets its own org + key in two requests:
 *
 *   1. POST /v1/agent/sign-up    — unauthenticated, sends an OTP to email.
 *   2. POST /v1/agent/verify     — authenticated with the restricted key
 *                                  returned in step 1; unlocks full access.
 */

import { createInterface } from 'node:readline/promises';
import { Chronary } from '@chronary/sdk';
import { DEFAULT_BASE_URL, classifySignUp, signUpWithCurrentTerms } from './signup.js';

/** Show a key's prefix and last 4 characters only — never log a full API key. */
function maskKey(key: string): string {
  const prefix = /^chr_[a-z]+_/.exec(key)?.[0] ?? '';
  return `${prefix}…${key.slice(-4)}`;
}

const email = process.env.SIGNUP_EMAIL;
if (!email) throw new Error('SIGNUP_EMAIL is not set');
const baseUrl = process.env.CHRONARY_BASE_URL ?? DEFAULT_BASE_URL;

// Step 1 — unauthenticated client requests an OTP. The helper reads the current
// Terms version from GET /v1/auth/terms/current (never hardcode it: it rolls
// forward when the Terms change) and retries once with `current_version` if the
// API answers 409 `tos_version_stale`. Sending `tos_version` accepts the Terms
// for the owner of SIGNUP_EMAIL, so only sign up an inbox you are authorized for.
const unauth = new Chronary({ baseUrl });
const outcome = classifySignUp(
  await signUpWithCurrentTerms(unauth, { email, agent_name: 'Self-Signup Bot' }, { baseUrl }),
);

if (outcome.kind === 'waitlisted') {
  // HTTP 202: sign-ups are paused (waitlist mode or early access full). No key
  // is issued, and the body is the same for every email.
  console.log(outcome.message);
  console.log('Sign-ups are paused right now, so no key was issued. Try again later.');
  process.exit(0);
}

if (outcome.kind === 'no_credentials') {
  // No credentials in the body. To prevent email enumeration the API does not
  // say why (the email may already have an account), so don't guess either.
  console.log(outcome.message);
  console.log('No key was issued. If this inbox already has a Chronary account, sign in at https://console.chronary.ai.');
  process.exit(0);
}

const signUp = outcome;

console.log(`Org created:        ${signUp.org_id}`);
console.log(`Agent created:      ${signUp.agent_id}`);
console.log(`API key:            ${maskKey(signUp.api_key)}    ← restricted until OTP verified`);
console.log(`\nWe sent a 6-digit code to ${email}.`);

// Step 2 — prompt for the OTP and verify with the restricted key.
const rl = createInterface({ input: process.stdin, output: process.stdout });
const otp = (await rl.question('Enter OTP: ')).trim();
rl.close();

// Construct a second client with the restricted key. Until OTP verification it
// can only call /v1/agent/verify; after verification the same key unlocks the
// full API.
const authed = new Chronary({ apiKey: signUp.api_key, baseUrl });
const verified = await authed.agentAuth.verify({ otp });
console.log(`\n${verified.message}`);

const me = await authed.agents.list({ limit: 1 }).getPage(0, 1);
console.log(`\nAuthenticated as agent: ${me.data[0]?.name ?? '(none)'} (${me.data[0]?.id})`);

// The full key lives only in `signUp.api_key` and is never shown again. A real
// agent persists it here — to its secret manager or runtime environment
// (e.g. CHRONARY_API_KEY) — instead of printing it.
console.log('\nStore the key in your secret manager — anything an org-level key can do, this can do.');
