# What next? — Miniapp contract

**Issue:** [#724](https://github.com/moldovancsaba/mvp-factory-control/issues/724)  
**Category:** App  
**Version:** v1  
**Status:** Draft

---

## Overview

**What next?** is an app that answers Joe's daily question: *"What should I focus on today?"*

Combines:
- Scheduled briefing (from configured sources)
- Source prioritization (AI routing)
- Action recommendations (top 3 priorities)

## Contract

```json
{
  "id": "what-next",
  "version": "v1",
  "displayName": "What next?",
  "description": "Your daily guide — get prioritized recommendations based on your sources and AI analysis.",
  "route": "/dashboard/724/What_next",
  "api": {
    "method": "POST",
    "path": "/dashboard/api/functions/what-next"
  },
  "input": {
    "required": [],
    "optional": ["sources", "scheduleTime", "priority"],
    "examples": [
              {},
      { "scheduleTime": "06:00" },
      { "sources": ["news", "tasks", "calendar"], "priority": "high" }
    ]
  },
  "output": {
    "statusField": "ok",
    "payloadShape": "object",
    "requiredFields": ["ok", "recommendations", "sources"]
  },
  "safety": {
    "untrustedInput": false,
    "allowedProtocols": [],
    "notes": ["Reads from configured sources, generates recommendations."]
  },
  "capabilities": {
    "channels": ["dashboard", "api"],
    "sideEffects": ["network-fetch", "apple-notes-write"],
    "requiresApproval": false
  },
  "failureModel": {
    "clearErrorMessages": true,
    "fallbackBehavior": "Return partial results with available sources"
  }
}
```

## UI

### Page title
**What next?**

### Back link
`← Back to Apps`

### Layout
1. **Header** — Title + scheduled time display
2. **Sources panel** — List of configured sources with status
3. **Run button** — "What's next?" — triggers briefing
4. **Results panel** — Top 3 recommendations with reasoning
5. **Action buttons** — "Start", "Delegate", "Schedule"

### Alarm setting
- Time picker (default 06:00)
- "Daily at [time]" label
- Toggle on/off

## API

### POST /dashboard/api/functions/what-next

**Request:**
```json
{
  "sources": ["news", "tasks", "calendar"],
  "priority": "high",
  "schedule": false
}
```

**Response:**
```json
{
  "ok": true,
  "sources": ["news", "tasks"],
  "recommendations": [
    {
      "rank": 1,
      "title": "Review Q1 budget variance",
      "reasoning": "From your task list — deadline is today",
      "source": "tasks",
      "action": "Start",
      "urgency": "high"
    }
  ],
  "insights": ["2 conflicts detected between meetings"],
  "generatedAt": "2026-03-27T06:00:00Z"
}
```

## Dependencies

- #516 (Explain it) — URL summarization core
- #517 (AI routing) — Source prioritization
- #518 (Daily briefing) — Scheduling pattern

## Checklist

- [ ] Miniapp contract v1
- [ ] Registry entry
- [ ] UI page
- [ ] API implementation
- [ ] Scheduling integration
- [ ] Source ranking
- [ ] Recommendation engine
- [ ] Test with real sources
