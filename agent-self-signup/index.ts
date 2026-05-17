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
import { Chronary, isAgentSignUpNewOrg } from '@chronary/sdk';

const email = process.env.SIGNUP_EMAIL;
if (!email) throw new Error('SIGNUP_EMAIL is not set');

// Step 1 — unauthenticated client requests an OTP.
const unauth = new Chronary();
const signUp = await unauth.agentAuth.signUp({
  email,
  agent_name: 'Self-Signup Bot',
  // The ToS version the agent has accepted. If this is stale the API returns
  // 409 `tos_version_stale` with `current_version` in the error body; production
  // apps should catch that, present the new ToS, and retry.
  tos_version: 'pre-launch',
});

if (!isAgentSignUpNewOrg(signUp)) {
  // Existing-org dedup branch — same opaque message, no credentials. To prevent
  // email enumeration, the API does not tell you whether the email already had
  // an account. Sign in to the console with this email instead.
  console.log(signUp.message);
  console.log('That email is already registered. Sign in via the console.');
  process.exit(0);
}

console.log(`Org created:        ${signUp.org_id}`);
console.log(`Agent created:      ${signUp.agent_id}`);
console.log(`API key:            ${signUp.api_key}    ← restricted until OTP verified`);
console.log(`\nWe sent a 6-digit code to ${email}.`);

// Step 2 — prompt for the OTP and verify with the restricted key.
const rl = createInterface({ input: process.stdin, output: process.stdout });
const otp = (await rl.question('Enter OTP: ')).trim();
rl.close();

// Construct a second client with the restricted key. Until OTP verification it
// can only call /v1/agent/verify; after verification the same key unlocks the
// full API.
const authed = new Chronary({ apiKey: signUp.api_key });
const verified = await authed.agentAuth.verify({ otp });
console.log(`\n${verified.message}`);

const me = await authed.agents.list({ limit: 1 }).getPage(0, 1);
console.log(`\nAuthenticated as agent: ${me.data[0]?.name ?? '(none)'} (${me.data[0]?.id})`);
console.log('\nKeep this key safe — anything an org-level key can do, this can do.');
