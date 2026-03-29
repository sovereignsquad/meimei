# MeiMei inference route API — v1

**Endpoint:** `POST /api/meimei/route`  
**Purpose:** Single blocking entry point for chat-style LLM calls. Adapters and miniapps use **OpenAI Chat Completions–shaped** JSON only (plus optional `meimei` extension).

**See also:** `dashboard/lib/inference-route.mjs`

## Request body

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `model` | string | yes | Use `"router-auto"` for policy-based selection, or an Ollama model id (e.g. `llama3:latest`). |
| `messages` | array | yes | OpenAI-style `{ "role", "content" }`. `content` is string (v1). |
| `temperature` | number | no | Forwarded when present. |
| `max_tokens` | number | no | Forwarded when present. |
| `stream` | boolean | no | **`true` → `501 Not Implemented`** (SSE reserved for a later release). |
| `meimei` | object | no | MeiMei extensions (below). |

### `meimei` extension

| Field | Type | Notes |
|-------|------|--------|
| `traceId` | string | Correlation id; server generates UUID if omitted. Logged as `[meimei/route][<traceId>]`. Same id may be sent as header **`x-meimei-trace-id`** (wins over body if both present — implementation uses header first, then body, then UUID). |
| `localOnly` | boolean | If `true`, only local runners (v1: Ollama). If `false`, non-local backends are **not** implemented in v1 → `501`. |
| `taskCategory` | string | Used when `model === "router-auto"` (e.g. `summarize`, `classify`, `default`). |
| `fallbackAllowed` | boolean | Reserved; no cloud fallback in v1. |

### Example

```json
{
  "model": "router-auto",
  "messages": [
    { "role": "system", "content": "You are a summarizer." },
    { "role": "user", "content": "Summarize this..." }
  ],
  "temperature": 0.2,
  "stream": false,
  "meimei": {
    "traceId": "req-12345-abcde",
    "localOnly": true,
    "taskCategory": "summarize",
    "fallbackAllowed": true
  }
}
```

## Success response — `200 OK`

OpenAI **chat.completion** shape, plus `meimei_meta`:

```json
{
  "id": "chatcmpl-…",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "ollama/gemma3:1b",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "…" },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 56,
    "completion_tokens": 31,
    "total_tokens": 87
  },
  "meimei_meta": {
    "backend_used": "ollama",
    "latency_ms": 1450,
    "trace_id": "…"
  }
}
```

`usage` may be estimated when the runner omits token counts.

## Errors

### `413 Payload Too Large` — context guard

Cheap heuristic before any runner I/O: **~1 token per 4 characters** over all message text. Compared to `MEIMEI_INFERENCE_MAX_CONTEXT` (default `8192`).

```json
{
  "error": "context_too_large",
  "message": "Estimated tokens exceed backend limit of 8192."
}
```

### `501 Not Implemented`

- **`stream: true`** — SSE streaming not implemented in v1.
- **`localOnly: false`** — non-local backends not implemented in v1.

```json
{
  "error": {
    "code": "not_implemented",
    "message": "…"
  }
}
```

### Other

- **`400`** — invalid body (missing `messages`, bad types).
- **`502`** — runner reachable but error response.
- **`503`** — runner unreachable / network failure.

## Logging

The dashboard server logs one line per request:

```text
[meimei/route][<traceId>] inference start
```

Process **stdout/stderr** for the dashboard LaunchAgent (`com.agent.meimei.dashboard-ui`) is where this appears (not `dashboard-proxy.log`, which is the HTTPS proxy process).

## Versioning

Bump this document and `dashboard/lib/inference-route.mjs` together when the wire contract changes.
