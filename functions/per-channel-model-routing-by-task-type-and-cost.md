# Per-Channel Model Routing By Task Type And Cost

## Purpose

This is MeiMei's model-routing miniapp.

It previews the route MeiMei will use for a request based on:

- channel
- task type
- cost target

It does not run the task. It only shows the recommended route, fallback, and reason in a simple user-facing format.

## User Route

- Function page: `/dashboard/Per-channel_model_routing_by_task_type_and_cost`
- Back path: `/dashboard/`

## MVP UI

- one channel selector
- one task type selector
- one cost target selector
- one `Route` button
- one result area with the chosen route and reason

## API

- `POST /dashboard/api/functions/model-routing`
- body:
  - `{ "channel": "whatsapp", "taskType": "chat", "costTarget": "low" }`

The current response includes:

- channel
- task type
- cost target
- recommended agent
- thinking level
- tier
- fallback agent
- fallback thinking
- routing reason

## Safety

- routing is deterministic for the same inputs
- the selected route and reason are visible
- fallback behavior is explicit
- the page previews routing only and does not execute the turn

## Expansion Path

After MVP, this miniapp can grow into:

- route presets
- route history
- per-channel defaults
- better routing explanations
- message-based delivery
- API access from other platforms
- policy editing

The add-on backlog and user stories live in [per-channel-model-routing-by-task-type-and-cost-addon.md](./per-channel-model-routing-by-task-type-and-cost-addon.md).

## Policy

The routing policy lives in [model-routing-spec.md](../model-routing-spec.md).

## Miniapp Contract v1 Instance

```json
{
  "id": "model-routing",
  "version": "v1",
  "displayName": "Per-channel model routing by task type and cost",
  "route": "/dashboard/Per-channel_model_routing_by_task_type_and_cost",
  "api": {
    "method": "POST",
    "path": "/dashboard/api/functions/model-routing"
  },
  "input": {
    "required": [
      "channel",
      "taskType",
      "costTarget"
    ],
    "optional": [
      "message"
    ],
    "examples": [
      {
        "channel": "dashboard",
        "taskType": "chat",
        "costTarget": "low"
      }
    ]
  },
  "output": {
    "statusField": "ok",
    "payloadShape": "object",
    "requiredFields": [
      "ok",
      "route"
    ]
  },
  "safety": {
    "untrustedInput": false,
    "allowedProtocols": [],
    "notes": [
      "Preview-only flow; does not execute the task."
    ]
  },
  "capabilities": {
    "channels": [
      "dashboard",
      "api"
    ],
    "sideEffects": [],
    "requiresApproval": false
  },
  "failureModel": {
    "clearErrorMessages": true,
    "fallbackBehavior": "return route calculation error"
  }
}
```
