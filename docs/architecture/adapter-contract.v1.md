# MeiMei adapter & job spooler contract — v1

**Status:** binding contract for Milestone D (adapter quarantine + local queue).  
**Implements:** `dashboard/lib/meimei-job-queue.mjs`, `dashboard/lib/meimei-job-worker.mjs`

## Purpose

External systems (Discord, Mail, Obsidian, webhooks, etc.) **must not** call `POST /api/meimei/route` directly from their hot paths. They **must not** import Discord SDKs or long-running file watchers inside `dashboard/server.mjs` request handlers.

Instead:

1. **Ingress:** adapters turn external events into **small JSON payloads** and **enqueue** work in the local SQLite spooler.
2. **Worker:** a **single** polling worker (in-process with the dashboard in v1) claims jobs, calls the inference router (`handleMeimeiInferenceRoute`), and updates job rows.
3. **Egress:** (future) adapters consume `egress` jobs and perform side effects (send message, write file) without blocking the router.

This isolates rate limits, I/O stalls, and third-party bugs from the HTTP server event loop.

---

## 1. Spooler schema — `meimei_jobs` (SQLite)

Database file (v1): **`data/meimei/meimei-jobs.sqlite`** (under repo root; gitignored). The queue module enables **`PRAGMA journal_mode=WAL`**, **`busy_timeout`**, and **`synchronous=NORMAL`** so a **separate** ingest process can enqueue while the dashboard worker claims jobs.

| Column | Type | Notes |
|--------|------|--------|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | |
| `trace_id` | TEXT NOT NULL | Correlation id; propagated to `meimei.traceId` on inference calls. |
| `adapter_name` | TEXT NOT NULL | e.g. `demo-cli`, `obsidian-watcher` (future). |
| `direction` | TEXT NOT NULL | `ingress` \| `egress` |
| `payload` | TEXT NOT NULL | JSON string — see **Payload envelope** below. |
| `status` | TEXT NOT NULL | `pending` \| `processing` \| `completed` \| `failed` |
| `retry_count` | INTEGER NOT NULL DEFAULT 0 | Number of **failed processing attempts** already consumed. |
| `result_json` | TEXT NULL | JSON string — router output or structured error on completion. |
| `error_message` | TEXT NULL | Short human-readable reason when `failed` or last error when retrying. |
| `created_at` | INTEGER NOT NULL | Unix ms |
| `updated_at` | INTEGER NOT NULL | Unix ms |
| `payload_kind` | TEXT NULL | `inference_v1` \| `app_task` (v2 schema); NULL legacy rows treated as `inference_v1`. |
| `target_adapter` | TEXT NULL | For `app_task`: inbox key (denormalized for indexing). |
| `source_adapter` | TEXT NULL | For `app_task`: sender id (denormalized). |

Indexes (v1): query by `status` + `id` for FIFO pending claims; v2 adds inbox index on `(status, target_adapter, payload_kind, id)`.

### Payload envelope (`payload` column)

Minimum for **inference** jobs (v1):

```json
{
  "kind": "inference_v1",
  "request": {
    "model": "router-auto",
    "messages": [{ "role": "user", "content": "Hello" }],
    "stream": false,
    "meimei": { "localOnly": true, "taskCategory": "summarize" }
  }
}
```

Future kinds (`obsidian_note_v1`, `discord_message_v1`, …) must be documented before code changes.

### Inter-app tasks (`app_task`) — Milestone G (implemented)

**`kind: "app_task"`** — asynchronous messages between MeiMei apps via the same `meimei_jobs` table. Rows carry denormalized **`payload_kind`**, **`target_adapter`**, **`source_adapter`** for inbox queries. The global inference worker **only** claims **`inference_v1`**; sovereign inbox loops claim **`app_task`** by **`target_adapter`**.

**Inference follow-up:** Optional **`meimei_correlation`** on an **`inference_v1`** envelope (sibling to **`request`**) triggers a reply **`app_task`** after successful router completion — see `dashboard/lib/meimei-job-worker.mjs`.

**Payload size / artifacts:** Claim Check and **~64 KiB** control-plane guidance; **correlation:** **`trace_id`**, **`parent_job_id`**, **`reply_to`** — **`docs/architecture/inter-app-message-bus.v1.md`** §4–§5.

**Reference path:** `reference-app-1` → `reference-app-2` inbox (`meimei-reference-app-inbox.mjs`); ping/pong and standup digest; **no peer HTTP**.

---

## 2. Ingress rules — outside → in

**Isolation boundary:** An ingress adapter **never** invokes `POST /api/meimei/route` over HTTP.

It **only**:

1. Validates / normalizes external data.
2. Builds a **payload envelope** (JSON).
3. **INSERTs** a row with `status = 'pending'`, `direction = 'ingress'`, and a **new** `trace_id` (or one propagated from upstream if already assigned).

**Examples (allowed):**

- **Demo CLI** (`scripts/meimei-demo-enqueue-job.mjs`): runs on the operator’s machine, opens the SQLite DB via the shared queue module, inserts one `pending` row. *Proof of the spooler without network.*
- **Future Obsidian watcher:** separate **Node process** or **LaunchAgent** that watches a directory; on file change, inserts `pending` rows. Still **no** call to `/api/meimei/route`.
- **Future webhook:** a minimal HTTP receiver **could** accept POST and enqueue — that service is **not** the inference route; it is a dedicated ingress surface with its own timeouts and auth.

**Examples (forbidden in adapter code):**

- Calling `fetch('http://127.0.0.1:…/api/meimei/route')` from inside a Discord bot loop tied to `server.mjs`.
- Blocking `server.mjs` request handlers on `fs.readFileSync` of vault paths.

**Optional ergonomics (not the adapter pattern):** localhost-only helpers (e.g. enqueue API) may exist for **development** only; production ingress adapters must still prefer **direct enqueue** or a **dedicated** micro-receiver, not the main dashboard thread.

---

## 3. Dead letter policy

- **`MAX_JOB_FAILURES`** (v1: `3`): each **processing attempt** that ends in a **retryable** failure increments the failure cycle (see worker rules below).
- After **`retry_count`** would exceed the allowed attempts for retryable errors, the worker sets:
  - `status = 'failed'`
  - `error_message` set to the last error summary
  - **no further claims** for that row (dead letter).

**Non-retryable errors** (v1 worker): HTTP **400**, **413**, **501** from the inference router → job moves to **`failed` immediately** (no infinite loop on bad input).

**Retryable errors** (v1): network errors to Ollama, **502**, **503**, thrown exceptions during processing → increment `retry_count`, set `status = 'pending'` again until cap, then `failed`.

**No infinite retries:** the worker never resets `failed` rows automatically. Operators must inspect `result_json` / `error_message` and insert a new job if they want a manual retry.

---

## 4. Worker behavior (v1)

- Runs **inside** the dashboard process on an interval (**`MEIMEI_JOB_POLL_MS`**, default `5000`).
- On worker **startup**, any row still in **`processing`** is reset to **`pending`** (single in-process worker; recovers crash/kill mid-job).
- At most **one** job in **`processing`** per worker tick (FIFO by `id`).
- **Claim:** transactional `pending` → `processing`.
- **Success (2xx inference):** `status = 'completed'`, `result_json` = router JSON.
- **Failure:** per dead-letter rules above.

---

## 5. Sacrificial lamb (v1)

**Step 1 — demo-cli:** `scripts/meimei-demo-enqueue-job.mjs` / `npm run jobs:demo-enqueue` — enqueues a single `inference_v1` job. Proves **CLI → SQLite → worker → router** without Discord, Obsidian, or webhooks.

**Step 2 — file-drop (separate process):** `scripts/meimei-demo-file-drop-ingest.mjs` / `npm run jobs:demo-file-drop` — polls **`data/meimei-demo-in/*.json`**, validates the envelope, **`INSERT`s** via `createMeimeiJobQueue`, then moves files to **`processed/`** or **`failed/`**. Runs **outside** the dashboard process to prove **multi-process** access to `meimei-jobs.sqlite` (queue opens with **WAL** + `busy_timeout`).

File format: see `data/meimei-demo-in/README.md` (same `kind` / `request` shape as the spooler `payload` JSON; optional top-level **`traceId`**).

**Step 3 — Obsidian (real vault):** `scripts/meimei-adapter-obsidian.mjs` / `npm run adapter:obsidian` — **chokidar** on `MEIMEI_OBSIDIAN_VAULT`, debounced ingress + egress polling. Spec: **`docs/architecture/adapter-obsidian.v1.md`**.

**Still deferred:** Discord/Mail and other channels as dedicated adapters.

---

## 6. Versioning

Bump **v1** when changing table schema, payload kinds, or dead-letter rules; migrate SQLite with explicit `PRAGMA user_version` steps in `meimei-job-queue.mjs`.
