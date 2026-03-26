# Any-URL Summarization In Seconds

## Purpose

This is MeiMei's first product function page.

It accepts one URL at a time, reads the page or PDF, and returns a short summary that keeps the key facts, names, decisions, and next steps.

## User Route

- Function page: `/dashboard/Any-URL_summarization_in_seconds`
- Back path: `/dashboard/`

## MVP UI

- one centered URL input
- one `Summarize` button
- one result area in the main body
- one back button to the dashboard root

## API

- `POST /dashboard/api/functions/url-summary`
- body: `{ "url": "https://example.com" }`

The current response includes:

- source metadata
- summary bullets
- key facts
- next steps
- caveats

## Safety

- only `http` and `https` URLs are accepted
- source content is treated as untrusted
- the summarizer is instructed to ignore instructions embedded in the source
- unsafe or unreadable sources fail clearly instead of guessing

## Expansion Path

After MVP, this function can grow into:

- richer extraction rules
- citations
- IM delivery
- API access from other platforms
- more MeiMei functions using the same lifecycle

The add-on backlog and user story live in [any-url-summarization-in-seconds-addon.md](./any-url-summarization-in-seconds-addon.md).

The shared naming rules live in [naming-conventions.md](../naming-conventions.md).
