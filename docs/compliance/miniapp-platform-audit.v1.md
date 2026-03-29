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
| ai-routing | tools | `routeViaApiAdapter` + **`openclaw-routing-preview.mjs`** (default); settings GET **`platform-pages/routing-settings-pages.mjs`** | — | G | — | Y | G | — | G | Y | P2 | **R2:** Preview is **deterministic rules** (no LLM), in-process parity with `oc-agent --route-only`. Legacy subprocess: `MEIMEI_ROUTING_PREVIEW_LEGACY_OC_AGENT=1`. |
| api-access | tools | Same as ai-routing (`routeViaApiAdapter`); settings GET **`platform-pages/routing-settings-pages.mjs`** | — | G | — | Y | G | — | G | Y | P2 | Same preview implementation as ai-routing row. |
| supabase-connector | tools | `apps/supabase-connector/index.mjs` | — | — | — | G | G | — | G | G | P2 | **R4:** Operator text in **`functions/supabase-connector.md`** — prefer env store for `MEIMEI_SUPABASE_*`; handler reads `process.env` only (no second SoT). |
| mission-control | tools | `apps/mission-control/index.mjs`; GET shell **`platform-pages/ops-tool-pages.mjs`** | — | — | — | — | G | Y | G | Y | P2 | OpenClaw/telemetry read-only; not on `meimei_jobs` feed. |
| memory | tools | `apps/memory/index.mjs` → `brain/*`; GET shell **`platform-pages/ops-tool-pages.mjs`** | — | G | — | — | G | — | G | Y | P2 | **`meimei-inference-client`** in `brain/memory.mjs` (kernel K3). |
| ai-sdr-analytics | apps | `apps/ai-sdr-analytics/index.mjs` | — | — | — | — | G | — | G | Y | P2 | Reads gitignored JSONL + workflow file; no LLM. |
| inbox | apps | `apps/inbox/index.mjs`; GET shell **`platform-pages/ops-tool-pages.mjs`** | — | G | — | — | G | — | G | Y | P2 | **`meimei-inference-client`**; Mail/AppleScript side effects unchanged. |
| what-next | apps | `apps/what-next/index.mjs`; GET shell **`platform-pages/reader-pages.mjs`** (main + settings) | — | G | — | — | G | — | Y | Y | P2 | **`meimei-inference-client`**; no queue (R1 —). |
| explain-it | apps | `apps/explain-it/index.mjs`; GET URL summary + settings **`platform-pages/reader-pages.mjs`** | — | G | — | — | G | — | Y | Y | P2 | **`meimei-inference-client`**; untrusted URL content path unchanged. |
| lead-enrichment | apps | `apps/lead-enrichment/index.mjs` (single-shot + `workflow_*`); GET shell **`platform-pages/gtm-pages.mjs`** | Y | G | — | Y | G | — | G | Y | P1 | **R2:** inference client. **R1:** `workflow_run` sync on handler — **documented exception** in **`functions/lead-enrichment.md`** (sunset 2027-06-30). |
| lead-outreach | apps | `apps/lead-outreach/index.mjs`; GET shell **`platform-pages/gtm-pages.mjs`** | — | G | — | — | G | — | G | Y | P2 | **`meimei-inference-client`** for `draft_touch`. |
| checklist | apps | POST shell → **`checklist-api-shell.mjs`**; GET proxy/page → **`checklist-local-integration.mjs`**; **`/api/checklist/bridge`** → **`checklist-bridge-http.mjs`** + `checklist-bridge.mjs` | Y | G | G | G | Y | Y | G | Y | P0 | **R2:** Node engine + legacy JSON paths use **`meimei-inference-client`** (K3). **R1/R5/R6** still **Y** (jobs/UI/trace). **R3/R4** documented in **`functions/checklist.md`**. |

### Registry doc filename gaps (R7)

| Registry id | `functions/<id>.md` |
|-------------|----------------------|
| Most ids | Present (`checklist.md`, `lead-enrichment.md`, …). |
| ai-routing | Uses `per-channel-model-routing-by-task-type-and-cost.md` (+ addon) — **name mismatch**; link from registry or rename for discoverability. |
| api-access | Uses `api-channel-adapter.md` — **name mismatch**. |
| explain-it | Uses `any-url-summarization-in-seconds.md` (+ addon) — **name mismatch**. |
| what-next | **`functions/what-next.md`** (registry id aligned). |

---

## 2. Non-registry operator surfaces

| Surface | Route / API | Handler | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Pri | Notes |
|---------|-------------|---------|----|----|----|----|----|----|----|----|-----|-------|
| knowmore | `config/dashboard-surface.v1.json` → `/knowmore` | **`renderKnowmorePage`** in **`dashboard/lib/platform-pages/catalog-pages.mjs`** (thin call from `server.mjs`) | — | — | — | — | G | — | G | Y | P2 | **`docs/operations/knowmore-content-refresh.md`** — operational refresh; no queue. |
| admin / settings | `/admin`, `*/settings` | Home + admin GET HTML **`platform-pages/home-admin-pages.mjs`** + `admin-layout-editor.mjs` script | — | G | — | — | G | — | Y | Y | P2 | Home command + **`home-suggestions`** (inference client). Routing preview: **`openclaw-routing-preview.mjs`**. Split: **`docs/architecture/meimei-admin-vs-miniapp-ops.v1.md`**. |
| System monitor | `/api/meimei/monitor/*` (and shell page) | Feed: `meimei-monitor-feed.mjs`; GET shell: **`platform-pages/system-monitor-page.mjs`** | — | — | — | — | — | G | G | Y | P2 | **Platform chrome** — reference for R6 when migrating apps. |
| Daily briefing | `POST /dashboard/api/functions/daily-briefing`; GET shell **`platform-pages/reader-pages.mjs`** | `apps/daily-briefing/index.mjs` | — | G | — | — | G | — | G | Y | P2 | **Not in registry**; contract **`functions/daily-briefing.md`**; **`meimei-inference-client`**. |

---

## 3. Code hygiene — boundaries CI (delivered 2026-03-29)

**Resolved:** One `POST` handler calls `handleChecklistPost`, which routes Checklist shell actions to **`dashboard/lib/checklist-api-shell.mjs`** and all other actions to `apps/checklist/index.mjs`. **`npm run boundary:check`** runs **`scripts/meimei-repo-boundaries-check.mjs`** (that invariant) **and** **`scripts/meimei-apps-cross-import-check.mjs`** (no `apps/*` → sibling `apps/*` static `from` imports). See **`meimei-repo-boundaries.v1.md`** §4, §6.

---

## 4. Suggested next actions (from this audit)

1. **P0 — Checklist:** Remaining **R1/R5/R6** — **R2** on **`meimei-inference-client`** as of kernel K3 **`0.8.13`**; **R3/R4** **G**.
2. **P1 — Lead workflow R1:** Enqueue workflow steps to `meimei_jobs` or keep **documented exception** (`functions/lead-enrichment.md`); review by **2027-06-30**.
3. **Routing preview:** Default **in-process** (`openclaw-routing-preview.mjs`); legacy **`MEIMEI_ROUTING_PREVIEW_LEGACY_OC_AGENT=1`**.
4. **R7:** **`functions/what-next.md`** added for registry id alignment (other filename mismatches remain in table above where noted).
5. **Smoke:** `MEIMEI_SMOKE_STRICT=1` validates **`GET /api/meimei/monitor/feed`** JSON shape (kernel K4).

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
