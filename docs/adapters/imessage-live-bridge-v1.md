# iMessage Live Bridge v1

Issue: `mvp-factory-control#711`

## Purpose

Deliver a live iMessage inbound/outbound bridge path so you can message MeiMei and receive a reply through the adapter flow.

## Runtime Surface

- Endpoint: `POST /api/channels/imessage/inbound`
- Adapter: `dashboard/lib/imessage-adapter.mjs`
- Server wiring: `dashboard/server.mjs`

## Inbound Request Shape

```json
{
  "eventId": "imsg-evt-001",
  "from": "+15550001111",
  "threadId": "+15550001111",
  "text": "hello meimei",
  "taskType": "chat",
  "costTarget": "low",
  "actionIntent": "reply",
  "approved": false
}
```

## Behavior

1. normalize inbound event to canonical iMessage form
2. run external-channel risk-tier policy checks
3. execute agent turn through `scripts/oc-agent` (`--channel imessage`)
4. when `actionIntent=reply`, invoke deliver mode:
   - `--deliver --reply-channel imessage --reply-to <from>`
5. emit audit and telemetry events
6. return adapter lifecycle and result payload

## Validation

- `npm run imessage:validate`

## Local Test

```bash
curl -sS -X POST "http://127.0.0.1:45285/api/channels/imessage/inbound" \
  -H "content-type: application/json" \
  -d '{
    "eventId":"imsg-manual-001",
    "from":"+15550001111",
    "text":"hello meimei",
    "taskType":"chat",
    "costTarget":"low",
    "actionIntent":"reply"
  }'
```

If iMessage delivery channel is available in your OpenClaw runtime, this sends a real reply to `from`.
If not available, you still get structured adapter result plus audit/telemetry evidence.
