/**
 * Team scheduling bot — Chronary's hero demo.
 *
 * In ~150 lines you'll see four things no other calendar API can do in one
 * place:
 *
 *   1. Three agent types collaborating — `human` × 3 and `resource` × 1.
 *   2. (Optional) iCal subscription — pulling a real Google/Outlook calendar
 *      into one of the human agents.
 *   3. Cross-agent availability — "when are these 4 entities ALL free for 30
 *      minutes tomorrow afternoon?" in a single API call.
 *   4. Multi-agent proposals — book three candidate slots, collect responses
 *      from each participant, auto-resolve the first slot every participant
 *      accepted into a confirmed event on a shared calendar.
 *
 * At the end the script prints each calendar's iCal feed URL so you can
 * subscribe in Apple Calendar / Google / Outlook and watch the schedule live.
 */

import { Chronary } from '@chronary/sdk';
import type { ProposalSlot } from '@chronary/sdk';

const apiKey = process.env.CHRONARY_API_KEY;
if (!apiKey) throw new Error('CHRONARY_API_KEY is not set');

const aliceICalUrl = process.env.ALICE_ICAL_URL; // optional — see README

const chronary = new Chronary({ apiKey });

// ── 1. Set up the team ──────────────────────────────────────────
console.log('Creating team…');
const alice = await chronary.agents.create({ name: 'Alice', type: 'human' });
const bob = await chronary.agents.create({ name: 'Bob', type: 'human' });
const carol = await chronary.agents.create({ name: 'Carol', type: 'human' });
const room = await chronary.agents.create({ name: 'Conference Room A', type: 'resource' });

const aliceCal = await chronary.calendars.create({ agentId: alice.id, name: 'Alice', timezone: 'America/New_York' });
const bobCal = await chronary.calendars.create({ agentId: bob.id, name: 'Bob', timezone: 'America/New_York' });
const carolCal = await chronary.calendars.create({ agentId: carol.id, name: 'Carol', timezone: 'America/New_York' });
const roomCal = await chronary.calendars.create({ agentId: room.id, name: 'Conference Room A', timezone: 'America/New_York' });
const teamCal = await chronary.calendars.create({ name: 'Team meetings', timezone: 'America/New_York' });

console.log(`  ${alice.name}, ${bob.name}, ${carol.name}, ${room.name}\n`);

// ── 2. Fill calendars with simulated busy time ──────────────────
// Tomorrow's working window: noon → 5 PM UTC.
const tomorrow = new Date();
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
tomorrow.setUTCHours(12, 0, 0, 0);
const dayStart = new Date(tomorrow);
const dayEnd = new Date(dayStart.getTime() + 5 * 60 * 60 * 1000);
const minutes = (m: number) => new Date(dayStart.getTime() + m * 60_000).toISOString();

// Each participant has one busy block. Designed to leave three cross-agent
// free windows of at least 30 minutes inside the 12:00–17:00 UTC range.
await chronary.events.create(aliceCal.id, { title: '1:1 with manager', start_time: minutes(60), end_time: minutes(120) });   // 13:00–14:00
await chronary.events.create(bobCal.id, { title: 'Customer call', start_time: minutes(180), end_time: minutes(240) });        // 15:00–16:00
await chronary.events.create(carolCal.id, { title: 'Code review', start_time: minutes(270), end_time: minutes(300) });       // 16:30–17:00
await chronary.events.create(roomCal.id, { title: 'Town hall', start_time: minutes(0), end_time: minutes(30) });             // 12:00–12:30

// Optional: link Alice's real calendar via inbound iCal subscription.
if (aliceICalUrl) {
  console.log('Linking Alice\'s real calendar via iCal…');
  await chronary.icalSubscriptions.create(alice.id, {
    calendar_id: aliceCal.id,
    url: aliceICalUrl,
    label: "Alice's Google Calendar",
  });
  console.log('  Linked. (External events sync in the background every 30 min.)\n');
}

// ── 3. Cross-agent availability ─────────────────────────────────
console.log('Finding 30-min slots when ALL 4 are free tomorrow afternoon…');
const availability = await chronary.availability.check({
  agents: [alice.id, bob.id, carol.id, room.id],
  start: dayStart.toISOString(),
  end: dayEnd.toISOString(),
  slot_duration: '30m',
});
console.log(`  ${availability.slots.length} candidate slot(s):`);
for (const slot of availability.slots.slice(0, 6)) {
  console.log(`    • ${slot.start} → ${slot.end}`);
}
if (availability.slots.length === 0) {
  console.error('No slots found — try widening the window in the script.');
  process.exit(1);
}

// ── 4. Multi-agent proposal ─────────────────────────────────────
const candidateSlots: ProposalSlot[] = availability.slots.slice(0, 3).map((s) => ({
  start_time: s.start,
  end_time: s.end,
}));

console.log(`\nProposing ${candidateSlots.length} candidate slot(s) to the team…`);
const proposal = await chronary.scheduling.create({
  title: 'Quarterly sync',
  organizer_agent_id: alice.id,
  participant_agent_ids: [alice.id, bob.id, carol.id, room.id],
  calendar_id: teamCal.id,
  slots: candidateSlots,
});
console.log(`  Proposal: ${proposal.id}`);

// Fetch the proposal so we can address each slot by id.
const detail = await chronary.scheduling.get(proposal.id);
const firstSlotId = detail.slots[0]!.id!;

// Each participant accepts the first slot. The API auto-resolves the proposal
// on the final accept — there is no need to call `scheduling.resolve()` once
// every participant has responded. (`resolve()` is for organizer-driven manual
// resolution before all responses are in.)
for (const agentId of [alice.id, bob.id, carol.id, room.id]) {
  await chronary.scheduling.respond(proposal.id, {
    agent_id: agentId,
    response: 'accept',
    selected_slot_id: firstSlotId,
  });
}
console.log('  All 4 participants accepted slot 1.');

// Re-fetch to read the resolved state.
const final = await chronary.scheduling.get(proposal.id);
if (final.status !== 'confirmed' || !final.resolved_slot) {
  console.error(`Proposal did not confirm (status=${final.status}).`);
  process.exit(1);
}
console.log(`  Confirmed → event on "${teamCal.name}" at ${final.resolved_slot.start_time}.`);

// ── 5. Print iCal feed URLs ─────────────────────────────────────
console.log('\nSubscribe these URLs in Apple Calendar / Google Calendar / Outlook:');
for (const cal of [aliceCal, bobCal, carolCal, roomCal, teamCal]) {
  console.log(`  ${cal.name.padEnd(20)} ${cal.ical_url}`);
}
console.log('\nDone.');
