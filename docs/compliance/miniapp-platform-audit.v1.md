# Miniapp platform audit — v1

**Status:** Phase A inventory (see [`docs/architecture/meimei-platform-alignment-roadmap.v1.md`](../architecture/meimei-platform-alignment-roadmap.v1.md)).  
**Generated:** 2026-03-29 (repo snapshot).  
**Method:** Registry-driven inventory + static scan of `dashboard/server.mjs`, `apps/*/index.mjs`, and key `dashboard/lib/*` imports.

### Legend (R1–R8)

| Code | Requirement |
|------|-------------|
| **R1** | Queue — heavy/async work on `meimei_jobs` where contract applies |
| **R2** | Inference — `POST /api/meimei/route` or enqueued `inference_v1` vs legacy `llm.mjs` / direct Ollama |
| **R3** | Inter-app — no synchronous peer HTTP between miniapps for delegated async work |
| **R4** | Env — secrets via env store / catalog; no parallel secret SoT |
| **R5** | UI — design-system + layout model (`page-layout`, registry SoT) |
| **R6** | Trace — `trace_id` / System monitor visibility for queue-backed flows |
| **R7** | Registry docs — `functions/<id>.md` exists and matches behavior |
| **R8** | Transport — documented loopback HTTP vs HTTPS proxy (no false “HTTPS only”) |

**Scores:** **G** = aligned, **Y** = legacy / acceptable short-term per dev guide, **R** = violation or high risk, **—** = not applicable.

**Priority:** **P0** safety & hard architecture breaks, **P1** inference/queue migration, **P2** polish and docs.

---

## 1. Registry functions (`functions/registry.v1.json`)

| id | Category | Primary handler | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Pri | Notes |
|----|----------|-----------------|----|----|----|----|----|----|----|----|-----|-------|
| reference-app-1 | apps | API: `reference-app-queue-api.mjs` + worker; GET shell: **`platform-pages/reference-app-pages.mjs`** | G | G | G | G | G | G | G | Y | P2 | Canonical queue + `handleMeimeiInferenceRoute` in worker. |
| reference-app-2 | apps | API: `reference-app-2-queue-api.mjs` + `meimei-reference-app-inbox.mjs`; GET shell: **`platform-pages/reference-app-pages.mjs`** | G | G | G | G | G | G | G | Y | P2 | SQLite `app_task` only; correlation replies per bus doc. |
| environment-variables | tools | `meimei-env-store.mjs` | — | — | — | G | G | — | G | Y | P2 | Platform SoT; `reveal` is intentional plaintext server-side. |
| ai-routing | tools | `routeViaApiAdapter` + `previewModelRouting` (bash) | — | Y | — | Y | G | — | Y | Y | P2 | Preview via `oc-agent --route-not-llm-router`; not `/api/meimei/route`. |
| api-access | tools | Same as ai-routing (`routeViaApiAdapter`) | — | Y | — | Y | G | — | Y | Y | P2 | Shares routing preview path; adapter lifecycle only. |
| supabase-connector | tools | `apps/supabase-connector/index.mjs` | — | — | — | G | G | — | G | G | P2 | **R4:** Operator text in **`functions/supabase-connector.md`** — prefer env store for `MEIMEI_SUPABASE_*`; handler reads `process.env` only (no second SoT). |
| mission-control | tools | `apps/mission-control/index.mjs` | — | — | — | — | G | Y | G | Y | P2 | OpenClaw/telemetry read-only; not on `meimei_jobs` feed. |
| memory | tools | `apps/memory/index.mjs` → `brain/*` | — | Y | — | — | G | — | G | Y | P1 | `brain/memory.mjs` uses `callOllama` for summarization / queries. |
| ai-sdr-analytics | apps | `apps/ai-sdr-analytics/index.mjs` | — | — | — | — | G | — | G | Y | P2 | Reads gitignored JSONL + workflow file; no LLM. |
| inbox | apps | `apps/inbox/index.mjs` | — | Y | — | — | G | — | G | Y | P1 | Uses `callOllama` for prioritization; Mail/AppleScript side effects. |
| what-next | apps | `apps/what-next/index.mjs` | — | Y | — | — | G | — | Y | Y | P1 | `callOllamaJson`; no queue. |
| explain-it | apps | `apps/explain-it/index.mjs` | — | Y | — | — | G | — | Y | Y | P1 | Fetches URL + `callOllamaJson`; untrusted content path. |
| lead-enrichment | apps | `apps/lead-enrichment/index.mjs` (single-shot + `workflow_*`) | Y | Y | — | Y | G | — | G | Y | P1 | `enrichLead` + workflow queue consolidated in app; `runWorkflowItem` still sync on handler thread — not `meimei_jobs`. |
| lead-outreach | apps | `apps/lead-outreach/index.mjs` | — | Y | — | — | G | — | G | Y | P1 | `draft_touch` uses `callOllamaJson` on request thread. |
| checklist | apps | POST shell → **`checklist-api-shell.mjs`**; GET proxy/page → **`checklist-local-integration.mjs`**; **`/api/checklist/bridge`** → **`checklist-bridge-http.mjs`** + `checklist-bridge.mjs` | Y | Y | G | G | Y | Y | G | Y | P0 | Phase B: **R3/R4** — integration HTTP vs bus documented in **`functions/checklist.md`**; bridge secret pattern explicit. R1/R2/R5/R6 remain **Y** (queue/inference/UI/trace improvements tracked separately). |

### Registry doc filename gaps (R7)

| Registry id | `functions/<id>.md` |
|-------------|----------------------|
| Most ids | Present (`checklist.md`, `lead-enrichment.md`, …). |
| ai-routing | Uses `per-channel-model-routing-by-task-type-and-cost.md` (+ addon) — **name mismatch**; link from registry or rename for discoverability. |
| api-access | Uses `api-channel-adapter.md` — **name mismatch**. |
| explain-it | Uses `any-url-summarization-in-seconds.md` (+ addon) — **name mismatch**. |
| what-next | Uses `daily-briefing.md` — **name mismatch** (different product surface). |

---

## 2. Non-registry operator surfaces

| Surface | Route / API | Handler | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Pri | Notes |
|---------|-------------|---------|----|----|----|----|----|----|----|----|-----|-------|
| knowmore | `config/dashboard-surface.v1.json` → `/knowmore` | **`renderKnowmorePage`** in **`dashboard/lib/platform-pages/catalog-pages.mjs`** (thin call from `server.mjs`) | — | — | — | — | G | — | Y | Y | P2 | Static cards from `config/knowmore-releases.v1.json`; no queue. Refresh cadence is operational, not code. |
| admin / settings | `/admin`, `*/settings` | `server.mjs` + `admin-layout-editor.mjs` | — | Y | — | — | G | — | Y | Y | P2 | `previewModelRouting` / home command / suggestions may use LLM (`command-interface`, `home-suggestions`). Layout editor persists `page-layout.v1.json`. |
| System monitor | `/api/meimei/monitor/*` (and shell page) | Feed: `meimei-monitor-feed.mjs`; GET shell: **`platform-pages/system-monitor-page.mjs`** | — | — | — | — | — | G | G | Y | P2 | **Platform chrome** — reference for R6 when migrating apps. |
| Daily briefing | `POST /dashboard/api/functions/daily-briefing` | `apps/daily-briefing/index.mjs` | — | Y | — | — | G | — | Y | Y | P2 | **Not in registry**; companion to Explain it; `callOllamaJson`. |

---

## 3. Code hygiene — boundaries CI (delivered 2026-03-29)

**Resolved:** One `POST` handler calls `handleChecklistPost`, which routes Checklist shell actions to **`dashboard/lib/checklist-api-shell.mjs`** and all other actions to `apps/checklist/index.mjs`. **`npm run boundary:check`** runs **`scripts/meimei-repo-boundaries-check.mjs`** (that invariant) **and** **`scripts/meimei-apps-cross-import-check.mjs`** (no `apps/*` → sibling `apps/*` static `from` imports). See **`meimei-repo-boundaries.v1.md`** §4, §6.

---

## 4. Suggested next actions (from this audit)

1. **P0 — Checklist:** Remaining **R1/R2/R5/R6** (queue, inference, UI, trace) — **R3/R4** documented in **`functions/checklist.md`** and scored **G** in §1; continue hardening async work and observability as needed.
2. **P1 — LLM migration batch:** explain-it, what-next, inbox (priority), lead-enrichment (dedupe server vs app `enrichLead`), lead-outreach `draft_touch`, memory/brain — move to `inference_v1` enqueue or `handleMeimeiInferenceRoute` per [`docs/api/inference-route.v1.md`](../api/inference-route.v1.md).
3. **P1 — Lead workflow:** Model long-running workflow steps as `meimei_jobs` (or document explicit exception) so R1 matches adapter contract.
4. **P2 — Docs:** Rename or symlink `functions/*.md` to match registry `id` for R7; add `functions/daily-briefing.md` if the route stays public.
5. **P2 — Smoke:** Extend `scripts/meimei-dashboard-miniapps-smoke.mjs` with optional probes for `/api/meimei/monitor/feed` row shapes when strict CI is enabled.

---

## 5. References

- [`docs/architecture/meimei-repo-boundaries.v1.md`](../architecture/meimei-repo-boundaries.v1.md) — mandatory separation (Phase 0); registry → owner paths.  
- [`docs/architecture/meimei-platform-alignment-roadmap.v1.md`](../architecture/meimei-platform-alignment-roadmap.v1.md)
- [`docs/architecture/meimei-app-development-guide.v1.md`](../architecture/meimei-app-development-guide.v1.md)
- [`functions/registry.v1.json`](../../functions/registry.v1.json)
- `npm run dashboard:smoke:miniapps`

---

## Versioning

Bump **v1** when the registry set changes or when a row’s **Pri** shifts after intentional acceptance of risk.
