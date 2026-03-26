---
name: core_daily_briefing
description: Produce a daily briefing that defaults to Apple Notes and falls back to markdown.
---

# Daily Briefing

## When to use

Use this skill when the user wants a quick operational summary of what matters today.

## What it does

- Groups active work by priority.
- Highlights blockers and deadlines.
- Creates a daily briefing for Apple Notes first.
- Falls back to markdown when Notes automation is unavailable.
- Keeps the briefing short and scan-friendly.

## Instructions

- Keep the output scannable.
- Surface only what matters now.
- End with the next concrete action.
- Prefer Apple Notes as the default sink on macOS.
- Preserve a markdown fallback so the briefing remains portable.

## Guardrails

- Do not turn the briefing into a generic status dump.
- Do not bury urgent items.
- Do not make Apple Notes optional in the default path.
