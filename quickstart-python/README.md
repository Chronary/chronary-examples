# quickstart-python

Calling Chronary in 60 seconds. No LLM, no framework — just `chronary` and the four primitives that make up every Chronary integration: agent, calendar, event, list.

```text
$ python quickstart.py

Agent:    agt_v4j8kLmN
Calendar: cal_3xQpRsT
iCal feed (subscribe in Apple/Google Calendar): https://api.chronary.ai/ical/abc.ics
Event:    evt_9wKzYaB — Hello from Chronary @ 2026-04-25T15:00:00+00:00

1 event(s) on Quickstart Calendar:
  • 2026-04-25T15:00:00+00:00  Hello from Chronary
```

## What this demonstrates

- The four-line dance every Chronary integration starts with: register agent → create calendar → create event → list.
- The Python SDK's typed resource clients (`client.agents`, `client.agents.calendars`, `client.events`).
- The `ical_url` returned on every calendar — paste it into Apple Calendar / Google Calendar and your phone shows the agent's schedule.

## Prerequisites

- Python ≥ 3.10
- A Chronary API key — sign up at [console.chronary.ai](https://console.chronary.ai), or see [`agent-self-signup`](../agent-self-signup) to have your agent register itself.

## Setup

```bash
cp .env.example .env
# fill in CHRONARY_API_KEY (test-mode key is fine)

python -m venv .venv
. .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install chronary
python quickstart.py
```

## Local development (pre-soft-launch)

`chronary` is not yet on PyPI — see [issue #222](https://github.com/Chronary/chronary/issues/222). Skip the `pip install chronary` step above and install the workspace build instead:

```bash
# from the monorepo root, in your venv
pip install -e packages/python-sdk

# then run the example directly (no pip install needed for the example itself)
python examples/quickstart-python/quickstart.py
```

## Files

- [`quickstart.py`](./quickstart.py) — the entire example.
- [`.env.example`](./.env.example) — required environment variables.

---

Last verified: 2026-04-24 against `chronary==0.1.0`.
