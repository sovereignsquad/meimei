# Decision and Action Audit Trail Pipeline v1

Issue: `mvp-factory-control#709`

## Purpose

Create append-only, hash-chained audit records for routing decisions, approvals, policy outcomes, and delivery states.

## Implementation Surfaces

- Logger: `dashboard/lib/audit-trail.mjs`
- Integration point: `dashboard/lib/api-channel-adapter.mjs`
- Validator: `scripts/validate-audit-trail.mjs`
- Log path: `audit/decision-action-trail.v1.jsonl`

## Record Shape

```json
{
  "v": "v1",
  "at": "2026-03-26T18:00:00.000Z",
  "type": "policy-decision",
  "channel": "email",
  "eventId": "api-kv9...",
  "outcome": "blocked",
  "reason": "High-risk external-channel action requires explicit approval",
  "riskTier": "high",
  "requiresApproval": true,
  "approved": false,
  "details": {
    "taskType": "research",
    "costTarget": "high",
    "actionIntent": "send"
  },
  "prevHash": "GENESIS",
  "hash": "sha256(record-without-hash)"
}
```

## Immutability Model

- Records are appended only (JSONL).
- Each record stores `prevHash` from prior record.
- Each record stores `hash` over its content (without `hash` field).
- Chain validation fails if any record is edited/reordered/removed.

## Event Types (v1)

- `policy-decision`
- `routing-decision`
- `delivery-state`

## Validation

- `npm run audit:validate`

This command validates:

- JSON parse integrity
- required field shape (`v`, `type`, `at`, chain fields)
- hash chain continuity (`prevHash`)
- recomputed hash equality

## Acceptance Checklist

- [ ] scope and boundaries are explicit
- [ ] implementation is integrated into adapter runtime flow
- [ ] immutable chain model is deterministic and inspectable
- [ ] validator provides objective pass/fail evidence
