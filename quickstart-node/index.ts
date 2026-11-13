import { Chronary } from '@chronary/sdk';

const apiKey = process.env.CHRONARY_API_KEY;
if (!apiKey) throw new Error('CHRONARY_API_KEY is not set');

const chronary = new Chronary({ apiKey });

// 1. Reuse the org's agent if it has one (Free allows 1 agent), else register one.
//    Three types: 'ai', 'human', 'resource'.
const existingAgents = await chronary.agents.list({ limit: 1 }).getPage(0, 1);
const agent =
  existingAgents.data[0] ??
  (await chronary.agents.create({ name: 'Quickstart Bot', type: 'ai' }));
console.log(`Agent: ${agent.id}`);

// 2. Reuse the agent's calendar if it has one (Free allows 1 calendar), else create one.
const existingCalendars = await chronary.calendars
  .list({ agentId: agent.id, limit: 1 })
  .getPage(0, 1);
const calendar =
  existingCalendars.data[0] ??
  (await chronary.calendars.create({
    agentId: agent.id,
    name: 'Quickstart Calendar',
    timezone: 'America/New_York',
  }));
console.log(`Calendar: ${calendar.id}`);
console.log(`iCal feed (subscribe in Apple/Google Calendar): ${calendar.ical_url}`);

// 3. Schedule an event.
const start = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 min
const event = await chronary.events.create(calendar.id, {
  title: 'Hello from Chronary',
  start_time: start.toISOString(),
  end_time: end.toISOString(),
});
console.log(`Event:    ${event.id} — ${event.title} @ ${event.startTime}`);

// 4. List the events back.
const page = await chronary.events.list({ calendarId: calendar.id }).getPage(0, 5);
console.log(`\n${page.data.length} event(s) on ${calendar.name}:`);
for (const e of page.data) {
  console.log(`  • ${e.startTime}  ${e.title}`);
}
