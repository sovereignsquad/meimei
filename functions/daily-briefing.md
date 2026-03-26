# Daily Briefing Miniapp

Function: `daily briefing`
User-facing term: `miniapp`

Route: `/dashboard/Daily_briefing`
API: `/dashboard/api/functions/daily-briefing`
Add-on backlog: [functions/daily-briefing-addon.md](/Users/moldovancsaba/Projects/agent.meimei/functions/daily-briefing-addon.md)

## Purpose

Create a short day-start briefing for MeiMei and write it to Apple Notes by default on macOS.

If Apple Notes automation is unavailable, fall back to markdown so the briefing is still preserved.

## User Story

As a MeiMei user, I want one button that creates my daily briefing and stores it in Apple Notes so I can start the day with a dependable note instead of scattered context.

## Behavior

- The dashboard shows one simple action: `Create briefing`.
- The briefing is generated from current workspace signals, priorities, reminders, and high-ICE focus items.
- Apple Notes is the default destination.
- A markdown copy is written for portability and fallback.
- The page shows a short progress terminal while the briefing is being built.

## Acceptance

- A user can open the miniapp from the dashboard.
- A user can create a briefing with one click.
- Apple Notes is the default sink.
- Markdown fallback exists when Apple Notes cannot be written.
- The result is short, scannable, and repeatable.

## Notes

- Keep the UI minimal.
- Keep the delivery deterministic.
- Keep the terminology consistent with the MeiMei contract:
  - `function` in repo docs
  - `miniapp` for the user-facing surface
  - `add-on` for future expansion
- Treat multiple sources and multiple outputs as add-ons, not as part of the core MVP.

## Miniapp Contract v1 Instance

```json
{
  "id": "daily-briefing",
  "version": "v1",
  "displayName": "Daily briefing",
  "route": "/dashboard/Daily_briefing",
  "api": {
    "method": "POST",
    "path": "/dashboard/api/functions/daily-briefing"
  },
  "input": {
    "required": [],
    "optional": [],
    "examples": [
      {}
    ]
  },
  "output": {
    "statusField": "ok",
    "payloadShape": "object",
    "requiredFields": [
      "ok",
      "title",
      "sink"
    ]
  },
  "safety": {
    "untrustedInput": false,
    "allowedProtocols": [],
    "notes": [
      "Writes to Apple Notes first and markdown fallback."
    ]
  },
  "capabilities": {
    "channels": [
      "dashboard",
      "api"
    ],
    "sideEffects": [
      "apple-notes-write",
      "local-file-write"
    ],
    "requiresApproval": false
  },
  "failureModel": {
    "clearErrorMessages": true,
    "fallbackBehavior": "markdown fallback when Apple Notes is unavailable"
  }
}
```
