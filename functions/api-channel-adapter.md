# API channel adapter (reference)

Function: `api-channel-adapter`  
User-facing term: `miniapp`

Route: `/dashboard/700/API_channel_adapter`  
API: `POST /dashboard/api/functions/api-channel-adapter`  
Issue: `mvp-factory-control#700`

## Purpose

Expose the **reference channel adapter** (`dashboard/lib/api-channel-adapter.mjs`) as a first-class miniapp so operators can **inspect policy, audit, telemetry, and lifecycle stages** on every run. WhatsApp, iMessage, and Discord work is expected to **attach to this spine** ([`channel-api-adapter-reference-v1.md`](../channel-api-adapter-reference-v1.md)).

## Behavior

- Accepts the same routing inputs as model routing (`channel`, `taskType`, `costTarget`, optional `message`, optional `approved`).
- Returns `route` (when allowed) plus **`adapter`** with `lifecycle` and `state`.
- On policy block, HTTP 400 with `error` and **`adapter`** so failures remain inspectable.

## Miniapp Contract v1

See [`functions/registry.v1.json`](registry.v1.json) entry `api-channel-adapter`.
