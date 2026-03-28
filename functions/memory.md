# Memory — Miniapp Contract

Status: Draft  
Miniapp ID: `memory`  
Issue: `mvp-factory-control#601`  
Category: Platform (foundational)

## Product Contract

**What it does:** Defines and manages MeiMei's core identity as a durable context layer — who she is, what she optimizes for, and how she behaves.

**Why it matters:** This is the "Business Brain" — the stable identity layer that ensures MeiMei's behavior stays coherent over time, separate from noisy event history.

## Memory Layers

| Layer | Purpose | What Goes Here |
|-------|---------|----------------|
| **Level 1: Identity** | Core identity | Name, mission, values, tone, operating principles |
| **Level 2: Context** | Working context | Current projects, priorities, stakeholders |
| **Level 3: Events** | Running log | Day-to-day events, decisions, outcomes |

## Input

```json
{
  "required": [],
  "optional": ["layer", "action", "key", "value"],
  "examples": [
    {},
    { "layer": "identity" },
    { "layer": "context", "action": "get" },
    { "layer": "context", "action": "set", "key": "currentProject", "value": "Lead Enrichment" }
  ]
}
```

### Actions

| Action | Description |
|--------|-------------|
| `get` | Retrieve current memory |
| `set` | Update a memory key |
| `review` | Get memory for review |

## Output

```json
{
  "ok": true,
  "layer": "identity",
  "content": {
    "name": "MeiMei",
    "mission": "Help operators run efficient AI-powered businesses",
    "values": ["clarity", "action", "trust"],
    "tone": "professional but warm",
    "operatingPrinciples": [
      "Always provide actionable recommendations",
      "Prefer concise over verbose"
    ]
  },
  "updatedAt": "2026-03-27T10:00:00Z"
}
```

## Safety & Constraints

- `untrustedInput`: false (internal context)
- `allowedProtocols`: []
- Memory changes are logged for audit

## Capabilities

- `channels`: ["dashboard", "api"]
- `sideEffects`: ["local-file-write"]
- `requiresApproval`: true (for identity changes)

## Failure Model

| Failure | Behavior |
|---------|----------|
| File not accessible | Create default memory layer |
| Invalid layer | Return error with valid layers |

## Settings

- Memory file location
- Auto-backup frequency
- Review reminders
