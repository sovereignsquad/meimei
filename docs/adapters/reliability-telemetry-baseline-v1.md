# Reliability Telemetry Baseline v1 (SLO Metrics and Event Schema)

Issue: `mvp-factory-control#710`

## Purpose

Define a baseline telemetry event schema and SLO summary metrics for miniapp/channel reliability.

## Runtime Surfaces

- Event logger: `dashboard/lib/reliability-telemetry.mjs`
- API adapter integration: `dashboard/lib/api-channel-adapter.mjs`
- Summary endpoint: `GET /api/telemetry/summary`
- Telemetry log: `telemetry/events.v1.jsonl`

## Event Schema (`request-completed`)

```json
{
  "v": "v1",
  "at": "2026-03-26T19:00:00.000Z",
  "type": "request-completed",
  "channel": "dashboard",
  "eventId": "api-evt-001",
  "ok": true,
  "state": "delivered",
  "latencyMs": 42,
  "riskTier": "low",
  "requiresApproval": false,
  "approved": false,
  "reason": "adapter flow completed"
}
```

## Baseline SLO Summary Metrics

Computed from telemetry events:

- `totalRequests`
- `successRate`
- `blockedRate`
- `failureRate`
- `avgLatencyMs`
- `p95LatencyMs`
- per-channel totals (`byChannel`)

## Validation

- `npm run telemetry:seed`
- `npm run telemetry:validate`

Where:

- `telemetry:seed` writes deterministic sample events.
- `telemetry:validate` checks schema and summary metric integrity.

## Visual Milestone

After seeding events and starting dashboard, reliability summary is visible at:

- `http://127.0.0.1:45285/api/telemetry/summary` (port from `config/dashboard-surface.v1.json` `defaults.port`)

This is the first live, directly testable reliability telemetry surface.

## Acceptance Checklist

- [ ] scope and boundary are explicit
- [ ] telemetry event schema is deterministic
- [ ] SLO summary metrics are computed and queryable
- [ ] validation commands produce objective pass/fail evidence
