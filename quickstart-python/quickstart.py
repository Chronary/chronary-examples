"""Chronary 60-second quickstart — pure SDK, no LLM."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from chronary import Chronary

api_key = os.environ.get("CHRONARY_API_KEY")
if not api_key:
    raise SystemExit("CHRONARY_API_KEY is not set")

chronary = Chronary(api_key=api_key)

# 1. Reuse the org's agent if it has one (Free allows 1 agent), else register one.
#    Three types: 'ai', 'human', 'resource'.
agents = chronary.agents.list(limit=1).data
agent = agents[0] if agents else chronary.agents.create(name="Quickstart Bot", type="ai")
print(f"Agent:    {agent.id}")

# 2. Reuse the agent's calendar if it has one (Free allows 1 calendar), else create one.
calendars = chronary.agents.calendars.list(agent.id, limit=1).data
calendar = (
    calendars[0]
    if calendars
    else chronary.agents.calendars.create(
        agent.id,
        name="Quickstart Calendar",
        timezone="America/New_York",
    )
)
print(f"Calendar: {calendar.id}")
print(f"iCal feed (subscribe in Apple/Google Calendar): {calendar.ical_url}")

# 3. Schedule an event.
start = datetime.now(timezone.utc) + timedelta(hours=1)
end = start + timedelta(minutes=30)
event = chronary.events.create(
    calendar.id,
    title="Hello from Chronary",
    start_time=start.isoformat(),
    end_time=end.isoformat(),
)
print(f"Event:    {event.id} — {event.title} @ {event.start_time}")

# 4. List the events back.
page = chronary.events.list(calendar.id, limit=5)
print(f"\n{len(page.data)} event(s) on {calendar.name}:")
for e in page.data:
    print(f"  • {e.start_time}  {e.title}")
