# Mission Control — Miniapp Contract

Status: Draft  
Miniapp ID: `mission-control`  
Issue: `mvp-factory-control#635`  
Category: Tools

## Product Contract

**What it does:** Provides a live board of MeiMei activity and state — agent status, recent runs, failures, and action traces.

**Why it matters:** Operators need a stable place to inspect state, debug issues, and intervene quickly. Without it, status is buried across tools and supervision becomes slower than work itself.

## Input

```json
{
  "required": [],
  "optional": ["filter", "timeRange", "scope"],
  "examples": [
    {},
    { "filter": "errors" },
    { "filter": "runs", "timeRange": "1h" },
    { "scope": "agent" }
  ]
}
```

### Filters

| Filter | Description |
|--------|-------------|
| `all` | All activity |
| `runs` | Recent runs only |
| `errors` | Failed runs only |
| `agents` | Agent status |

## Output

```json
{
  "ok": true,
  "overview": {
    "totalRuns": 42,
    "successRate": 95.2,
    "avgDuration": "2.3s",
    "activeAgents": 3
  },
  "recentRuns": [
    {
      "id": "run_abc123",
      "type": "lead-enrichment",
      "status": "success",
      "duration": "1.2s",
      "timestamp": "2026-03-27T23:00:00Z"
    }
  ],
  "errors": [],
  "agentStatus": [
    { "agent": "writer", "status": "idle", "lastRun": "2026-03-27T22:45:00Z" }
  ]
}
```

## Safety & Constraints

- `untrustedInput`: false (internal telemetry)
- `allowedProtocols`: []
- Read-only surface (no execution)

## Capabilities

- `channels`: ["dashboard", "api"]
- `sideEffects`: []
- `requiresApproval`: false

## Failure Model

| Failure | Behavior |
|---------|----------|
| No data | Return empty state with message |
| Telemetry unavailable | Return partial with available data |

## Settings

- Refresh interval
- Time range defaults
- Notification thresholds
