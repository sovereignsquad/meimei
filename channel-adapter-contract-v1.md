# Channel Adapter Contract v1

Issue: `mvp-factory-control#699`

## Purpose

Define a shared adapter interface so channels (API, WhatsApp, iMessage, Discord, Email) use one lifecycle instead of channel-specific ad hoc behavior.

## Adapter Lifecycle

Every adapter must follow this deterministic sequence:

1. ingress
2. normalize
3. policy-check
4. dispatch
5. egress
6. delivery-state

No step can be skipped silently.

## Canonical Event Shape

All channels must convert inbound signals into this normalized shape before routing:

```json
{
  "eventId": "evt_123",
  "channel": "whatsapp",
  "direction": "inbound",
  "receivedAt": "2026-03-26T13:00:00Z",
  "actor": {
    "userId": "channel-scoped-id",
    "displayName": "optional"
  },
  "thread": {
    "threadId": "conversation-id",
    "isGroup": false
  },
  "payload": {
    "text": "message body",
    "attachments": []
  },
  "meta": {
    "rawProvider": "provider-name",
    "rawType": "provider-event-type"
  }
}
```

## Policy Check Contract

Policy layer input:

- normalized event
- channel policy config
- action intent (reply/send/execute)

Policy layer output:

```json
{
  "allowed": true,
  "reason": "allow by channel policy",
  "riskTier": "low",
  "requiresApproval": false
}
```

If `allowed=false`, adapter must return a visible blocked response and log the decision.

Reference policy-as-code artifact:

- `external-channel-policy-engine-v1.md`

## Dispatch Contract

Dispatch consumes:

- normalized event
- selected miniapp contract
- routing decision

Dispatch returns:

```json
{
  "ok": true,
  "result": {},
  "error": null
}
```

## Egress Contract

Every adapter must expose a stable outbound payload model:

```json
{
  "message": "text output",
  "attachments": [],
  "channelHints": {}
}
```

Adapters are responsible for converting this canonical payload to channel-native format.

## Delivery State Model

Every outbound attempt must emit one of:

- `queued`
- `sent`
- `delivered`
- `failed`
- `blocked`

Minimum state event shape:

```json
{
  "eventId": "evt_123",
  "channel": "whatsapp",
  "state": "delivered",
  "at": "2026-03-26T13:01:00Z",
  "reason": ""
}
```

## Retry and Idempotency

- Every adapter must support idempotency keying by `eventId`.
- Duplicate inbound events must not produce duplicate side effects.
- Retries must preserve event id and append retry metadata.

## Error Handling Rules

- errors must be explicit and operator-readable
- no silent drops
- blocked/policy failures are not treated as transport failures

## Channel Coverage Plan

Reference adapter rollout order:

1. API adapter
2. WhatsApp adapter
3. iMessage adapter
4. Email adapter
5. Discord adapter

iMessage implementation plan artifact:

- `imessage-adapter-architecture-v1.md`
- `imessage-live-bridge-v1.md`

Email implementation plan artifact:

- `email-adapter-architecture-v1.md`

Discord implementation plan artifact:

- `discord-adapter-architecture-v1.md`

## Acceptance Checks

- [ ] all channels can normalize to the canonical event shape
- [ ] policy-check is explicit and logged
- [ ] delivery state transitions are visible
- [ ] idempotency prevents duplicate side effects
- [ ] adapter output remains compatible with miniapp contract v1
