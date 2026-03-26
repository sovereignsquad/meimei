# iMessage Adapter Architecture v1

Issue: `mvp-factory-control#702`

## Purpose

Define the iMessage adapter implementation plan that conforms to:

- `channel-adapter-contract-v1.md`
- `channel-adapter-lifecycle-v1.md`

This document is architecture + execution plan, not a full runtime implementation.

## Scope

In scope:

- ingress/normalize/policy/disptach/egress/delivery-state design for iMessage
- provider boundary model
- reliability, idempotency, and safety constraints
- phased implementation plan with acceptance gates

Out of scope:

- shipping full iMessage transport integration in this issue
- UI redesign

## Constraints

- channel behavior must remain policy-driven and inspectable
- no hidden side effects
- must preserve least-privilege and explicit approval boundaries

## Provider Boundary

iMessage adapter sits between provider event source and miniapp dispatch.

```text
iMessage provider -> Adapter ingress -> Normalize -> Policy-check -> Dispatch -> Egress -> Delivery state
```

The adapter must not couple routing policy to provider-specific event structures.

## Canonical Normalized Event (iMessage)

```json
{
  "eventId": "imsg-evt-001",
  "channel": "imessage",
  "direction": "inbound",
  "receivedAt": "2026-03-26T13:00:00Z",
  "actor": {
    "userId": "imessage-peer-id",
    "displayName": "optional"
  },
  "thread": {
    "threadId": "chat-thread-id",
    "isGroup": false
  },
  "payload": {
    "text": "hello",
    "attachments": []
  },
  "meta": {
    "rawProvider": "imsg",
    "rawType": "incoming-message"
  }
}
```

## Policy Requirements

Minimum policy checks before dispatch:

1. sender/thread allowability
2. group-message policy handling
3. action intent risk tier
4. approval requirement gate

Policy output must be explicit:

```json
{
  "allowed": true,
  "reason": "allow by channel policy",
  "riskTier": "low",
  "requiresApproval": false
}
```

## Dispatch + Egress

Dispatch uses miniapp contract and routing policy; egress converts canonical payload to iMessage-native message shape.

Canonical outbound payload:

```json
{
  "message": "response text",
  "attachments": [],
  "channelHints": {
    "imessage": {
      "typing": false
    }
  }
}
```

## Delivery State Model

iMessage adapter must emit:

- `queued`
- `sent`
- `delivered`
- `failed`
- `blocked`

Each state transition must include:

- `eventId`
- timestamp
- reason (if not delivered)

## Idempotency and Retries

- idempotency key: `eventId`
- duplicate inbound events must not duplicate side effects
- retries append metadata while preserving `eventId`
- blocked policy outcomes are terminal (no transport retry)

## Observability Requirements

Per-event mandatory logs:

1. ingress log
2. normalized event log
3. policy decision log
4. dispatch result log
5. outbound attempt log
6. final delivery state log

## Implementation Phases

### Phase A: Contract and Policy Scaffolding

- define iMessage-specific normalization mapper
- define policy-check adapter hooks
- provide dry-run mode for simulated events

Exit gate:

- deterministic normalized event and policy records for fixture inputs

### Phase B: Transport Integration

- bind to iMessage provider runtime
- wire ingress and egress to real events
- preserve lifecycle logging

Exit gate:

- inbound to outbound roundtrip in controlled test channel

### Phase C: Reliability Hardening

- idempotency guard
- retry behavior and dead-letter handling
- delivery state reconciliation

Exit gate:

- repeated-event and transient failure tests pass

### Phase D: Production Readiness

- runbook entries for operational recovery
- parity validation against adapter contract
- board-linked validation evidence

Exit gate:

- go-live checklist pass + explicit review approval

## Acceptance Checks

- [ ] iMessage normalization conforms to channel adapter contract
- [ ] policy-check records are explicit and auditable
- [ ] dispatch/egress outputs match canonical payload contract
- [ ] delivery state transitions are visible and deterministic
- [ ] idempotency prevents duplicate side effects
- [ ] phased rollout gates are defined and testable
