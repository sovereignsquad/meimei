# Inter-app message bus (local MAS) — v1 specification

**Status:** Milestone G **shipped** for the reference-app-1 ↔ reference-app-2 path (`app_task`, inbox loop, `meimei_correlation`, Claim Check in worker). Further apps/adapters remain incremental.  
**Implements:** `meimei-job-queue.mjs` (v2 columns + claims), `meimei-job-worker.mjs` (correlation replies), `meimei-reference-app-inbox.mjs`.  
**Companion:** `adapter-contract.v1.md` (payload kinds), `meimei-app-development-guide.v1.md`.

## Why this exists

MeiMei apps should behave as **sovereign actors**: own state, own decisions, bounded territory. Letting App A call App B’s HTTP API directly creates a **synchronous spaghetti web**—timeouts when B is blocked on Ollama, cascading blocks when B needs C, and logs that are impossible to reconstruct.

**Rule:** MeiMei apps **must not** use `fetch()` (or equivalent) to another app’s dashboard API for inter-app work. They **only** enqueue and dequeue jobs in **`meimei_jobs`** (SQLite WAL). The queue is the **event bus** and **shock absorber**.

This is the **Actor Model** locally: communicate by **messages** (rows), not by holding open request/response chains between apps.

---

## 1. Task envelope — `kind: "app_task"`

Extend the payload JSON (same `payload` column as today). New kind:

```json
{
  "kind": "app_task",
  "target_adapter": "writer_app",
  "source_adapter": "research_app",
  "payload": {
    "intent": "draft_summary",
    "context_id": "job-9876",
    "constraints": ["bullet_points", "max_500_words"]
  }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `kind` | yes | Literal `"app_task"`. |
| `target_adapter` | yes | Logical inbox name for the **receiver**; must match how that app’s worker filters jobs. |
| `source_adapter` | yes | Sender id for replies, auditing, and egress targeting. |
| `payload` | yes | Opaque-to-platform JSON; **receiver** validates `intent` and shape. |

**Row-level fields (unchanged v1 schema):** `adapter_name` / `direction` semantics need a **documented mapping** when this ships—for example, ingress rows may set `adapter_name` to `target_adapter` for routing, or a dedicated column may be added in a migration. That choice belongs in the implementation milestone; this doc locks the **envelope shape** and **behavioral** contract.

---

## 2. Sovereign inbox (receiver)

The receiver **does not** expose a dedicated HTTP “take order” endpoint for peer apps.

Instead:

1. A timer-driven **inbox worker** (per app or shared utility) queries for work addressed to that app’s `target_adapter` (exact query TBD with schema).
2. The receiver **claims** one job (same transactional discipline as today’s global worker where applicable).
3. It parses `payload`, checks `intent` and internal policy.
4. If invalid: **`failed`** with a clear `error_message`—the sender cannot force execution.
5. If valid: the receiver chooses **how** to execute (e.g. enqueue its own `inference_v1`, write files, enqueue `app_task` to another adapter). That is **sovereignty**.

---

## 3. Egress / callback (async reply)

When the receiver finishes, it **does not** block the sender’s HTTP request (there is none). It inserts a **new** row—typically another `app_task` (or a typed result envelope) with `target_adapter` set to the original **`source_adapter`**, carrying correlation (`context_id`, parent job id, `trace_id`, etc.).

The original sender’s loop eventually observes the new job or a dedicated “completion” channel and continues its state machine.

---

## 4. Payload size limits & artifact spillover (Claim Check pattern)

The SQLite `payload` / `result_json` columns are **control-plane** data only. They are **not** a blob store. Stuffing multi‑megabyte strings (PDFs, long Markdown digests, base64) into rows **bloats WAL**, slows backups, breaks the future **Queue Explorer**, and risks operational failure.

**Rule:** `app_task` and related envelope JSON MUST contain only **metadata**, **small structured fields**, **pointers**, and **short** strings (e.g. ping/pong, error summaries).

**Soft / hard threshold (v1):** keep the serialized JSON footprint of a single message body (the logical content that would live in `payload` or inline result fields) **≤ ~64 KiB** unless spilled. Implementations SHOULD reject or spill at this boundary rather than growing unbounded rows.

**Spillover (mandatory for large artifacts):** If an app produces a large artifact (standup digest Markdown, reports, exports), it MUST write bytes to disk under:

```text
data/meimei/artifacts/<trace_id>/<filename>
```

Use the **same** `trace_id` as the inbound `app_task` (or the correlation id agreed for that chain) so operators and tools can list artifacts per conversation. File naming and retention are implementation details; path must stay under repo `data/meimei/artifacts/` (or a single documented root) and MUST NOT allow path traversal.

**The ticket on the bus:** The replying `app_task` MUST carry only a **pointer**, for example:

```json
{
  "intent": "standup_digest_ready",
  "artifact_path": "data/meimei/artifacts/<trace_id>/digest.md",
  "content_type": "text/markdown",
  "byte_length": 12800
}
```

(Optional: `sha256` for integrity.) The consumer reads the file from disk; it does not parse a novel out of the queue row.

This is the standard **Claim Check** pattern: heavy luggage in storage; only the ticket rides the bus.

---

## 5. Correlation lineage (`trace_id`, `parent_job_id`, `reply_to`)

**Trap:** App B receives an `app_task`, enqueues `inference_v1`, and later completes inference—but **loses** the link to the original request. The digest is generated and **dropped on the floor** because B never enqueues the egress reply to the right peer or request.

**Rules (binding):**

1. **Thread `trace_id`:** Any sovereign app that handles an `app_task` and spawns a child job (e.g. `inference_v1`, nested `app_task`) MUST propagate the **original** `trace_id` into that child row (reuse the same `meimei_jobs.trace_id` value when enqueueing, unless a documented sub-trace scheme exists—default is **one trace per user-facing chain**).
2. **Egress identification:** When sending a reply `app_task`, the payload MUST include explicit correlation so the receiver can match callbacks:
   - **`reply_to`:** logical adapter id of the app that should receive this message (typically the original **`source_adapter`** of the inbound task).
   - **`parent_job_id`:** the **`meimei_jobs.id`** of the **inbound** `app_task` row this message completes (or the id the platform defines as the parent contract).

   These may live inside the JSON `payload` object or in dedicated columns if the schema is extended—either way they MUST be **queryable** and **documented** in the implementation.

3. **Inference handoff:** Before Milestone G is considered complete for the **Standup Digest** path, there MUST be an **automated test** (or scripted integration check) that: inbound `app_task` → child `inference_v1` shares `trace_id` → completion → outbound `app_task` includes correct `parent_job_id` / `reply_to` and, when using Claim Check, a valid `artifact_path`.

---

## 6. Autonomy pattern (“brain loop”)

A sovereign app may run a simple cycle:

1. **Wake** (timer or event).
2. **Inbox:** drain or claim `app_task` rows addressed to it.
3. **Observe:** files, env, other local signals (within its scope).
4. **Think (optional):** enqueue `inference_v1` via the **same** queue/router path—never ad-hoc LLM in the HTTP handler.
5. **Act:** enqueue outbound `app_task`, write artifacts, etc.
6. **Sleep** until next tick.

---

## 7. Milestone G (developer deliverables)

1. **Contract & schema:** Update `adapter-contract.v1.md` and `meimei-job-queue.mjs` (and worker split if needed) so `app_task` is first-class: validation, routing fields, and inbox queries are defined and tested. Schema/index choices SHOULD anticipate **§8 (Queue Explorer)** and **§5 (correlation)**—do not bury `target_adapter` / `reply_to` / `parent_job_id` only in unindexed opaque blobs if you need to query lineage.
2. **Inbox worker utility:** Shared helper pattern for “claim next `app_task` for `target_adapter` X” with the same WAL / busy_timeout expectations.
3. **Ping/pong first:** `intent: "ping"` / reply `intent: "pong"` with nonce—no LLM—proves routing and egress before Standup Digest complexity.
4. **Standup Digest path:** Producer → `app_task` → Reference App 2 → `inference_v1` (with **threaded `trace_id`**) → Claim Check artifact if over threshold → reply `app_task` with **`parent_job_id`**, **`reply_to`**, and pointer or small payload per **§4** and **§5**. **Required:** explicit test for correlation + inference handoff (no dropped digest).

---

## 8. Horizon: traceability (the “black box” trap)

With a single app and `inference_v1`, debugging is tractable: inspect the queue row, then Ollama / router logs.

With **chains** (App A → `app_task` → B → `app_task` → C), SQLite becomes a **distributed state machine** in one file. If C **silently** drops or mis-routes work, A can wait **indefinitely** with no obvious error—pure “black box” pain.

**Operational requirement immediately after Milestone G is proven:** **traceability** for operators. Plan a **Queue Explorer** (or equivalent) in the dashboard: read-only view of recent `meimei_jobs` rows with filters by `trace_id`, `adapter_name` / target, `kind`, and `status`, plus enough payload summary to reconstruct **lineage** (which job spawned which reply). This is not optional for running a local MAS in production; it is how you avoid weeks of printf archaeology.

Exact UI and API shape are **TBD**; the product commitment is: **visual lineage of `app_task` traffic** before inter-app traffic grows past demo scale. The UI renders human-friendly lines (e.g. “Checklist requested … from Calendar”) from **structured rows**—never require apps to emit natural-language protocols on the bus.

---

## 9. Versioning

Bump **v1** when the envelope fields change, when `meimei_jobs` schema gains routing columns, when dead-letter rules for `app_task` diverge from `inference_v1`, when Claim Check paths or size thresholds change, when correlation field rules change, or when traceability contracts (Queue Explorer) are specified.
