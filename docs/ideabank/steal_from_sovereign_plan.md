# Steal-from-Sovereign plan — ideabank (research-backed)

**Status:** architecture research / adoption backlog  
**Date:** 2026-03-30  
**MeiMei repo:** `agent.meimei` (this workspace)  
**Sovereign repo researched:** `/Users/chappie/Projects/sovereign` (Next.js app under `apps/sovereign/`)  
**Sovereign doc bundle (constitutional + v3 masterwork):** `sovereign_audit.zip` (paths like `sovereign_audit/constitutional_specs/*.md`, `sovereign_audit/v3_masterwork/*.md`)

This document is **not** a runtime integration spec. It maps **proven or specified patterns** in Sovereign to **concrete adoption options** for MeiMei, with **file-level pointers** on both sides. Where Sovereign code has defects or inconsistencies, those are noted so MeiMei does not copy them blindly.

---

## 1. Executive summary

| Theme | Sovereign essence | MeiMei today | Steal priority |
|------|-------------------|--------------|----------------|
| **Governed state object** | `SovereignStatePayload` (Pydantic) is the SSOT passed through DAG nodes; mirrored in TS types. | `meimei_jobs.payload` JSON + `inference_v1` / `app_task` envelopes; Brain markdown. | **High** — formalize optional **workflow envelope** for high-risk paths without replacing SQLite. |
| **Multi-node pipeline** | Fixed DAG: intent → context → generate → evaluate → dispatch (`NODE_REGISTRY` in `orchestrator.py`). | Job worker runs **inference**; miniapps are heterogeneous. | **Medium** — optional **orchestrated job kind** or subprocess pattern for “generate+judge+gate”. |
| **LLM-as-judge + floors** | `CATASTROPHIC_FLOOR`, `PASS_THRESHOLD`, weighted sum, bounded retries with critique in `evaluator.py`. | Policy engine + compliance audits; no standard judge loop in kernel. | **High** for outbound/high-consequence features. |
| **Risk tier → consequence** | R1/R2 auto vs R3/R4 `AWAITING_HUMAN` + `callback_token` in `dispatcher.py` (see §8 caveats). | External channel policy, tool approval, `MANUAL_REQUIRED`-style patterns exist in **MeiMei** docs; kernel is thinner. | **High** — align **naming and gates** across policy + queue + UI. |
| **Compute matrix** | MLX → Ollama → optional cloud in `providers.py` with health checks. | `POST /api/meimei/route` is **Ollama-centric** v1; `llm.mjs` direct. | **Medium** — optional provider matrix **behind** inference route v2. |
| **RAG + time decay** | SQL `(1 - (embedding <=> q)) * exp(-λ * age_days)` in `context_builder.py`; pgvector + HNSW in migrations. | Brain files + optional search; no vector DB in kernel. | **Medium/Low** — only if semantic memory becomes a product requirement. |
| **Ingress isolation** | Discord Vanguard → HTTP API enqueue (`discord_vanguard.py`); Nexus Bridge **polls DB**, does not call LLM in HTTP handler. | Adapter contract: enqueue only; same **theory**. | **Low** (already aligned) — reinforce docs/tests. |
| **Constitutional docs** | Invariants, interface contract, failure taxonomy, workflow S0–S18, risk policy (zip). | Boundaries, miniapp contract, inter-app bus, alignment roadmap, vision v3. | **High** — add **MeiMei invariants spine** + optional **failure taxonomy** doc. |

---

## 2. Reference map — where to read what

### 2.1 Sovereign — code (repository paths)

| Area | Path | What to read |
|------|------|----------------|
| DAG loop | `apps/sovereign/scripts/sovereign_dag/orchestrator.py` | `NODE_REGISTRY`, `execute_dag()`, validation after each node |
| Nexus Bridge (DB poller) | `apps/sovereign/scripts/sovereign_dag/bridge.py` | `poll_and_execute()`, `FOR UPDATE SKIP LOCKED`, `AgentTask` status transitions, payload bootstrap |
| SSOT models | `apps/sovereign/scripts/sovereign_dag/models.py` | `SovereignStatePayload`, `TaskProfile`, `ExecutionState`, `ScoreVector`, `WorkflowStatus`, `RiskTier`, `TaskType` |
| Node 1 | `apps/sovereign/scripts/sovereign_dag/nodes/intent_router.py` | Instructor structured `IntentClassification`; low confidence → `AWAITING_HUMAN` |
| Node 2 | `apps/sovereign/scripts/sovereign_dag/nodes/context_builder.py` | `get_embedding`, pgvector SQL, `DECAY_LAMBDA = 0.05` |
| Node 3 | `apps/sovereign/scripts/sovereign_dag/nodes/generator.py` | OpenAI-shaped chat completion; feedback history in prompt |
| Node 4 | `apps/sovereign/scripts/sovereign_dag/nodes/evaluator.py` | `CATASTROPHIC_FLOOR`, `PASS_THRESHOLD`, `WEIGHTS`, `_trigger_retry` |
| Node 5 | `apps/sovereign/scripts/sovereign_dag/nodes/dispatcher.py` | R1/R2 vs R3/R4 branching; `callback_token` |
| Compute / embeddings | `apps/sovereign/scripts/sovereign_dag/providers.py` | `ComputeMatrix`, env vars `SOVEREIGN_PRIMARY_*`, `SOVEREIGN_FALLBACK_*`, `SOVEREIGN_EMBEDDING_*` |
| TS mirror types | `apps/sovereign/src/lib/sovereign-dag.ts` | Types aligned to Pydantic; `isAwaitingHuman` ↔ `MANUAL_REQUIRED` |
| Nexus UI data | `apps/sovereign/src/lib/nexus-control.ts` | `listSovereignTasks`, `agentKey: "SOVEREIGN_DAG"` |
| Task policy → manual | `apps/sovereign/src/lib/tasks.ts` | `MANUAL_REQUIRED`, tool policy, events (`TASK_MANUAL_REQUIRED`) |
| Project memory CRUD + semantic | `apps/sovereign/src/lib/memory.ts` | `captureProjectMemoryFromTaskResult`, `searchProjectMemorySemantic`, `updateProjectMemoryEmbedding` |
| Prisma schema | `apps/sovereign/prisma/schema.prisma` | `AgentTask`, `ProjectMemory`, `LifecycleAuditEvent`, `TaskPromptPackageInvariant`, `OrchestratorLease` |
| pgvector migrations | `apps/sovereign/prisma/migrations/20260319210000_memory_lld006_pgvector/migration.sql` | extension `vector`, `embedding vector(768)` |
| HNSW index | `apps/sovereign/prisma/migrations/20260321103000_project_memory_embedding_hnsw/migration.sql` | partial HNSW on `embedding` |
| Discord ingress | `apps/sovereign/scripts/discord_vanguard.py` | Posts to API, polls `/api/sovereign/status`, approval URL pattern |

### 2.2 Sovereign — theory / initiative (zip paths)

| Topic | File in `sovereign_audit.zip` |
|------|------------------------------|
| Philosophy (governed objects, metabolism, risk) | `sovereign_audit/v3_masterwork/SOVEREIGN_SYSTEM_PHILOSOPHY.md` |
| Operational pipeline (nodes, adjudication, egress) | `sovereign_audit/v3_masterwork/SOVEREIGN_OPERATIONAL_PIPELINE.md` |
| Application-layer vision | `sovereign_audit/v3_masterwork/SOVEREIGN_APPLICATION_MANIFESTO.md` |
| HLD/LLD + S0–S18 table | `sovereign_audit/v3_masterwork/SOVEREIGN_HLD_LLD_SPECIFICATION.md` |
| Invariants (numbered spine) | `sovereign_audit/constitutional_specs/sovereign_constitutional_invariants_v1.md` |
| Object families + JSON envelope | `sovereign_audit/constitutional_specs/sovereign_interface_contract_spec_v1.md` |
| Workflow states S0–S18 | `sovereign_audit/constitutional_specs/sovereign_workflow_state_machine_v1.md` |
| Risk classes / escalation | `sovereign_audit/constitutional_specs/sovereign_risk_classes_and_escalation_policy_v1.md` |
| Failure taxonomy | `sovereign_audit/constitutional_specs/sovereign_failure_taxonomy_spec_v1.md` |
| Score vector / calibration | `sovereign_audit/constitutional_specs/sovereign_score_vector_and_calibration_spec_v1.md` |
| Memory retention / decay | `sovereign_audit/constitutional_specs/sovereign_memory_retention_and_decay_spec_v1.md` |
| Metabolism metrics | `sovereign_audit/constitutional_specs/sovereign_metabolism_metrics_spec_v1.md` |
| Initiative README (Gemini, pillars) | `sovereign_audit/strategic_initiative/README.md` |

### 2.3 MeiMei — analogues (this repo)

| Concern | Primary references |
|---------|-------------------|
| Kernel + queue theory | `docs/architecture/meimei-system-vision-and-platform-audit.v3.md`, `docs/architecture/adapter-contract.v1.md`, `docs/architecture/inter-app-message-bus.v1.md` |
| Job implementation | `dashboard/lib/meimei-job-queue.mjs`, `dashboard/lib/meimei-job-worker.mjs` |
| Inference contract | `docs/api/inference-route.v1.md`, `dashboard/lib/inference-route.mjs` |
| Policy / channels | `docs/governance/external-channel-policy-engine-v1.md`, `dashboard/lib/external-channel-policy-engine.mjs` |
| Miniapp shape | `docs/architecture/miniapp-contract-v1.md` |
| Brain memory | `docs/architecture/system-overview.md` §2, `brain/*.md`, `dashboard/lib/brain/` |
| Alignment scorecard | `docs/architecture/meimei-platform-alignment-roadmap.v1.md`, `docs/compliance/miniapp-platform-audit.v1.md` |

---

## 3. Steal items (detailed backlog)

Each item: **Idea** · **Sovereign reference (theory + code)** · **MeiMei hook** · **Adoption shape** · **Risk**.

### I1 — Constitutional invariants spine (doc-only, high leverage)

- **Sovereign:** `sovereign_constitutional_invariants_v1.md` — short normative list (control authority, risk boundary, assurance vs local eval, consequence routing, provenance, memory governance, human boundary, precedence).
- **MeiMei:** Rules are distributed across boundaries, miniapp contract, bus, policy engine.
- **Adoption:** Add `docs/architecture/meimei-constitutional-invariants.v1.md` (10–15 bullets) explicitly aligned with RFC 2119 language; cross-link to existing contracts. No code day one.
- **Risk:** Low. Reduces architectural drift in future PRs.

### I2 — Governed workflow envelope (typed payload over queue)

- **Sovereign:** `SovereignStatePayload` in `models.py` + TS `sovereign-dag.ts`; persisted as `AgentTask.payload` JSON in `bridge.py` after DAG run.
- **MeiMei:** `meimei_jobs.payload` already JSON; `inference_v1` and `app_task` are kinds.
- **Adoption:** Define optional payload kind **`workflow_v1`** (name TBD) with schema: `task_profile` (intent, task_type, risk_tier), `execution_state` (node, retry_count, status), `draft`, `score_vector`, `node_results` — subset of Sovereign model. Worker dispatches to a **small orchestrator** (Node-style functions in one module) instead of only `handleMeimeiInferenceRoute`.
- **Risk:** Medium. Touches job schema and worker; needs migration story and monitor feed formatting.

### I3 — LLM-as-judge loop with numeric gates

- **Sovereign code:** `nodes/evaluator.py` — `CATASTROPHIC_FLOOR = 0.40`, `PASS_THRESHOLD = 0.75`, `WEIGHTS` for grounding/completeness/policy, Instructor `LLMDimensions`, `_trigger_retry` max 3, append critique to `feedback_history`, route back to `generator`.
- **Sovereign theory:** `SOVEREIGN_OPERATIONAL_PIPELINE.md` §2 (adjudication), `sovereign_score_vector_and_calibration_spec_v1.md`.
- **MeiMei:** No default judge between generation and egress; some features use Ollama directly.
- **Adoption:** For **high-consequence** miniapps (outbound comms, destructive file ops): add **post-generation evaluation** step either (a) inside a new job kind pipeline, or (b) as a **library** `dashboard/lib/meimei-artifact-evaluator.mjs` callable from apps. Persist scores in job `result_json` or artifact metadata.
- **Risk:** Medium. Calibration and false negatives need tuning; document that scores are **not** permission alone (see I4).

### I4 — Risk tier → human gate (consequence routing)

- **Sovereign code:** `nodes/dispatcher.py` — R1/R2 or `human_approved` → complete; R3/R4 → `callback_token`, `WorkflowStatus.AWAITING_HUMAN`.
- **Sovereign theory:** `sovereign_risk_classes_and_escalation_policy_v1.md`, interface spec §20 consequence routing.
- **MeiMei:** `external-channel-policy-engine`, tool approval patterns; inter-app bus avoids sync peer calls.
- **Adoption:** Unify **risk class** vocabulary (R1–R4 or MeiMei-specific) in **one** doc; map to **policy engine** tiers and to **queue pause** states (e.g. job row `status` extension or `payload.awaiting_approval`). UI: Control Room equivalent or extend System monitor + admin.
- **Risk:** Medium. Product/UX commitment.

**Implementation caveat (Sovereign):** In `dispatcher.py`, the `elif risk_tier in [RiskTier.R3, RiskTier.R4]:` block sets `AWAITING_HUMAN` but then contains a second log/error that sets `FAILED` for “Unknown risk tier” — logically inconsistent (dead code path / bug). MeiMei should **not** replicate that structure; use clear if/else with no fall-through.

### I5 — Compute matrix (multi-provider health + fallback)

- **Sovereign code:** `providers.py` — `ComputeMatrix.get_active_provider()` probes `/v1/models` on primary MLX URL then Ollama then optional cloud API key.
- **MeiMei:** `dashboard/lib/inference-route.mjs` targets Ollama; `llm.mjs` same; model-routing spec describes tiers conceptually.
- **Adoption:** If product needs **automatic** fallback: implement **behind** `handleMeimeiInferenceRoute` (v2) or a `meimei-compute-matrix.mjs` used only by worker — keep **OpenAI-shaped** external contract stable.
- **Risk:** Medium (operational complexity, cost, latency).

### I6 — Context builder: pgvector + time-decayed ranking

- **Sovereign code:** `context_builder.py` — SQL on `"ProjectMemory"` with `(1 - (embedding <=> %s::vector)) * exp(-λ * age_seconds/86400)`; `DECAY_LAMBDA = 0.05`; `providers.get_embedding`.
- **Sovereign DB:** `prisma/schema.prisma` `ProjectMemory.embedding` as `Unsupported("vector")`; migrations for `vector(768)`, HNSW index.
- **MeiMei:** Brain markdown; no pgvector.
- **Adoption:** **Optional “Brain v2”** service: Postgres + pgvector sidecar or managed DB; ingest from `brain/durable.md` / task results; expose **read API** to `llm.mjs` or inference route context injection. Large effort; only if semantic recall becomes P0.
- **Risk:** High (new infra, sync, privacy).

### I7 — Nexus Bridge patterns (polling, SKIP LOCKED, bootstrap payload)

- **Sovereign code:** `bridge.py` — `FOR UPDATE SKIP LOCKED`, claim `RUNNING`, increment `attemptCount`, bootstrap dict when `task_profile` missing (lines ~77–94), `execute_dag`, map `WorkflowStatus` → `AgentTask.status` (`DONE`/`FAILED`).
- **MeiMei:** `meimei-job-queue.mjs` uses SQLite `claimNextInferencePending` / `claimNextAppTaskForTarget`; `meimei-job-worker.mjs` resets stale processing.
- **Adoption:** (1) Document **SKIP LOCKED** equivalent if MeiMei ever runs **multiple workers** on SQLite (SQLite has different concurrency model — may need Postgres or single worker). (2) **Payload bootstrap** pattern: default envelope for legacy enqueue — similar to bridge’s `intent_raw` fallback. (3) **Explicit finished payload** write — already `result_json` in MeiMei.
- **Risk:** Low for docs; medium if multi-worker.

### I8 — Intent router: structured classification + confidence floor

- **Sovereign code:** `intent_router.py` — `IntentClassification` via Instructor; confidence &lt; 0.75 → `AWAITING_HUMAN`.
- **MeiMei:** Command interface / `parseIntent` flows in `dashboard/lib/command-interface.mjs` (and related).
- **Adoption:** Add **confidence threshold** to NL routing; on low confidence return **clarify** or **operator queue** instead of silent wrong navigation. Tie to alignment R2/R6.
- **Risk:** Low–medium (UX).

### I9 — Failure taxonomy (doc + monitor)

- **Sovereign theory:** `sovereign_failure_taxonomy_spec_v1.md` — classes drive retry vs escalation vs root-cause ticket.
- **Sovereign schema hints:** `AgentTask.lastFailureCode`, `lastFailureKind`, `deadLetteredAt`, `escalatedAt` in `schema.prisma`.
- **MeiMei:** Job `error_message`, `status` failed; inference HTTP codes.
- **Adoption:** Add `docs/architecture/meimei-failure-taxonomy.v1.md`; extend `meimei-monitor-feed.mjs` to show **failure_class** when populated; optional columns on `meimei_jobs` in future migration.
- **Risk:** Low incremental.

### I10 — Lifecycle audit events (append-only)

- **Sovereign:** `LifecycleAuditEvent` model in `schema.prisma` (`entityType`, `fromState`, `toState`, `allowed`, `reason`).
- **MeiMei:** `docs/contracts/decision-action-audit-trail-v1.md`, `dashboard/lib/audit-trail.mjs`, monitor feed.
- **Adoption:** For workflow jobs, emit **structured transition rows** (could reuse SQLite table or file append) mirroring `LifecycleAuditEvent` semantics.
- **Risk:** Medium (storage, PII).

### I11 — Prompt package invariant (reproducibility)

- **Sovereign:** `TaskPromptPackageInvariant` in `schema.prisma` — `snapshotHash`, `promptText`, `packageSections`, `payloadSnapshot` linked to `taskId`.
- **MeiMei:** Trace id + job payload; no standard **prompt hash** artifact.
- **Adoption:** For regulated or high-value flows, store **hash of prompt + model id + temperature** on job completion (optional JSON field or sidecar file under `data/meimei/artifacts/`).
- **Risk:** Low.

### I12 — Discord / external Vanguard pattern

- **Sovereign:** `discord_vanguard.py` — mention/DM → POST API → poll status → approval link to Control Room.
- **MeiMei:** `docs/adapters/discord-adapter-architecture-v1.md`, checklist bridges, iMessage adapter docs.
- **Adoption:** When implementing Discord, **mirror** enqueue + poll + governance URL pattern; **never** call Ollama from Discord process — align with `adapter-contract.v1.md`.
- **Risk:** N/A (future feature).

### I13 — Interface contract `{meimei}` → `{zeno}` handoff

- **Sovereign theory:** `sovereign_interface_contract_spec_v1.md` §8 Task contract — “initial normalization by `{meimei}`”, “authoritative workflow ownership by `{zeno}`”.
- **MeiMei:** If federation is real: export **normalized Task JSON** from registry or queue (intent, constraints, risk suggestion, trace_id) for external orchestrator consumption.
- **Adoption:** Spec-only in `docs/architecture/meimei-external-task-export.v1.md` + optional `POST` or file drop.
- **Risk:** Low until partner system exists.

### I14 — “Metabolism” metrics (operational learning)

- **Sovereign theory:** `sovereign_metabolism_metrics_spec_v1.md` + philosophy §3.
- **MeiMei:** Telemetry, CI gates, miniapp audit.
- **Adoption:** Define **operator metrics**: retry rate per miniapp, time-in-`processing`, judge failure rate, Ollama 503 rate — dashboard or export to `reliability-telemetry` schema.
- **Risk:** Low.

---

## 4. What not to copy (without redesign)

| Item | Reason |
|------|--------|
| `dispatcher.py` R3/R4 branch structure | Contains contradictory terminal assignment after `AWAITING_HUMAN` (likely bug). |
| Mapping `AWAITING_HUMAN` → DB status `DONE` in `bridge.py` | Comments admit ambiguity; MeiMei should keep **explicit** `awaiting_human` or separate column if introducing human gates. |
| Entire Postgres requirement | MeiMei’s SQLite + file Brain is intentional for operator-local simplicity; adopt pgvector only with explicit product decision. |
| “Certified 10/10” audit tone | `AUDIT_LEDGER.md` style claims; MeiMei should keep **evidence-style** audits (`meimei-kernel-code-audit.v1.md`, `ai-runtime-audit.md`). |

---

## 5. Suggested phased roadmap (MeiMei)

| Phase | Scope | Deliverables |
|-------|--------|--------------|
| **P0** | Documentation | `meimei-constitutional-invariants.v1.md`, `meimei-failure-taxonomy.v1.md`; link from `meimei-system-vision-and-platform-audit.v3.md` |
| **P1** | High-risk product paths | Evaluator library or job-stage; risk tier enum in policy; monitor surfacing |
| **P2** | Workflow job kind | `workflow_v1` schema + worker module; lifecycle audit events |
| **P3** | Infra | Compute matrix behind inference v2; optional Postgres/pgvector for semantic memory |

---

## 6. Verification notes (research method)

- **Code:** Inspected first-party Python under `apps/sovereign/scripts/` (excluding `venv`/`.venv`), Prisma schema and selected migrations, and TypeScript libs `sovereign-dag.ts`, `nexus-control.ts`, `memory.ts`, `tasks.ts` (grep-assisted).
- **Docs:** Cross-referenced `sovereign_audit.zip` listing and full read of constitutional interface + v3 masterwork samples in prior session; philosophy/pipeline/manifesto/HLD and invariants re-read for this document.
- **Not done:** Full Next.js route handlers (`app/api/**`), every Prisma model consumer, or runtime execution tests on Sovereign.

---

## 7. Revision log

| Date | Change |
|------|--------|
| 2026-03-30 | Initial ideabank plan from Sovereign repo + zip research. |
