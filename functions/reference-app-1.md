# Reference app 1 — Queue inference + inter-app bus (Phase 4 + Milestone G)

**Registry id:** `reference-app-1`  
**UI:** `/790/Reference_app_1` (card href from registry)  
**API:** `POST /dashboard/api/functions/reference-app-1`

## Purpose

Validates MeiMei app rules: configuration from `process.env` (via `meimei-environment.v1.json`), **no** direct LLM calls from the handler; inference uses `inference_v1` → `meimei_jobs` → in-process worker → `handleMeimeiInferenceRoute`.

**Milestone G:** Enqueues **`app_task`** to **`reference-app-2`** only via SQLite (**no peer `fetch`**). Uses **`trace`**, **`inbox`**, **`ping`**, **`standup`** for bus workflows.

## Environment

| Key | Effect |
|-----|--------|
| `REFAPP_FEATURE_TOGGLE` | `1` / `true` / `yes` / `on` enables API + UI. |
| `REFAPP_MAX_PROMPT_CHARS` | Max prompt length (default `8000`, clamped). |

## API actions

| Action | Body | Result |
|--------|------|--------|
| `config` | — | `{ enabled, toggleKey, maxPromptChars, adapter, mas? }` |
| `enqueue` | `{ prompt }` | `{ jobId, traceId }` — `inference_v1` job |
| `status` | `{ jobId }` | Job status; uses **`getJobByIdForParty`** (sender or receiver on `app_task`) |
| `ping` | optional `traceId`, `nonce` | Enqueues **`app_task`** ping → Reference App 2 inbox |
| `standup` | optional `date`, `scope`, `traceId` | **`standup_digest_request`** → App 2 |
| `trace` | `{ traceId }` | **`app_task`** rows for this trace visible to **`reference-app-1`** |
| `inbox` | — | Recent **`app_task`** targeted at **`reference-app-1`** |

## Security

`status` / party reads: **`getJobByIdForParty`** — party must match `adapter_name`, `source_adapter`, `target_adapter`, or legacy payload fields.
