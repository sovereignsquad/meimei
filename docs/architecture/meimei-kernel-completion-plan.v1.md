# MeiMei kernel completion plan — v1

**Status:** active plan (from repo state **2026-03-30**, package **`agent-meimei` ~0.8.13**).  
**Goal:** A **clear kernel** (runtime + contracts + shared libraries) with **all product surfaces** owned as **modules** (apps, tools, platform GET shells, integrations) — not a growing monolith in `dashboard/server.mjs`.  
**Companion docs:** [`meimei-repo-boundaries.v1.md`](meimei-repo-boundaries.v1.md) (layers + allowlist), [`meimei-system-vision-and-platform-audit.v3.md`](meimei-system-vision-and-platform-audit.v3.md) (vision + theory + application layer), [`meimei-kernel-code-audit.v1.md`](meimei-kernel-code-audit.v1.md) (evidence-based kernel baseline + inventory), [`../developers/meimei-kernel-handbook.v1.md`](../developers/meimei-kernel-handbook.v1.md) (integration handbook), [`meimei-platform-alignment-roadmap.v1.md`](meimei-platform-alignment-roadmap.v1.md) (Phases A–E), [`miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md) (R1–R8 scorecard).

---

## 1. Definitions (exit criteria)

### 1.1 MeiMei **kernel** (done when…)

The kernel is **only**:

| Area | Lives in | Kernel responsibility |
|------|----------|------------------------|
| HTTP entry + route table | `dashboard/server.mjs` | Register methods/paths, read bodies, **delegate** — no multi-hundred-line product blocks |
| Surface + static config | `dashboard/lib/dashboard-surface.mjs`, `config/*` | Listen/bind, routes, knowmore config pointers |
| Registry + runtime helpers | `dashboard/lib/miniapp-registry.mjs`, `runtime.mjs` | Resolve `id` → paths, shared miniapp config |
| Env SoT | `dashboard/lib/meimei-env-store.mjs` | Apply + API for operator secrets |
| Jobs + worker + inference | `meimei-job-queue.mjs`, `meimei-job-worker.mjs`, `inference-route.mjs` | `meimei_jobs`, `inference_v1`, blocking router |
| Observability / policy / adapters (shared) | allowlisted `dashboard/lib/*` per boundaries doc | Reusable primitives, not one app’s business rules |
| Design system delivery | `public/styles/*`, layout | Host tokens/CSS; layout merge from `page-layout` |

**Kernel does not own:** Checklist competitors pipeline, lead enrichment CRM logic, inbox Mail scripts, etc. Those are **modules**.

### 1.2 **Modules** (connected, not inside the kernel)

| Module class | Target shape | Connection to kernel |
|--------------|--------------|----------------------|
| **Registry apps/tools** | `apps/<id>/index.mjs` (POST + optional local helpers) | Imported only by `server.mjs` (or a future thin router) as `handleApi` |
| **Large GET HTML** | `dashboard/lib/platform-pages/*.mjs` | Pure render functions + injected deps (routes, `escapeHtml`, `buildLayoutFlowHtml`, …) |
| **knowmore** | Content JSON + catalog card in `platform-pages/catalog-pages.mjs` (or future `knowmore-pages.mjs`) | No `meimei_jobs`; config-driven |
| **Integrations** | `integrations/*` + bridge modules in `dashboard/lib/checklist-*.mjs` | Documented HTTP/env contracts |
| **Platform chrome** | Home, admin, layout editor | Either stay small in kernel or move to `platform-pages/home-admin.mjs` (see §3) |

### 1.3 **“Clean” bar (programmatic)**

- **`server.mjs`**: no remaining **`function render*Page`** / **`function render*SettingsPage`** bodies except **thin one-liners** that call `platform-pages/*` (or a single **`platform-chrome.mjs`** for home/admin).
- **Boundaries:** every registry `id` has a **single owner row** in **`meimei-repo-boundaries.v1.md`** §2; allowlist in §3 matches reality.
- **CI:** `npm run boundary:check` + full `npm run ci` green; optional extensions (§5).
- **Audit:** no undocumented **Red** on R1–R8 (or explicit **Accepted risk** with architect note in audit or §6 waivers).

---

## 2. Baseline (this moment)

Already landed (do not redo):

- POST extraction for **lead-outreach**, **ai-sdr-analytics**, **supabase-connector**, **lead-enrichment**; Checklist **shell / proxy / bridge HTTP** modules.
- **`platform-pages/`:** `catalog-pages.mjs`, `system-monitor-page.mjs`, `tool-surface-pages.mjs`, `reference-app-pages.mjs`.
- **CI:** `meimei-repo-boundaries-check.mjs` + `meimei-apps-cross-import-check.mjs`.
- **Phase B (scoped):** R8/R4 blocks on `functions/*.md`, checklist R3/R4 narrative, monitor unknown `payload_kind`, supabase R4 text.

**Still in `server.mjs` (as of plan authoring):** shared **chrome** (`renderPage`, `renderFlashcard`, `renderGlobalNav`, …) and many **per-miniapp GET + settings** renderers (inbox, memory, mission control, lead enrichment/outreach, what-next, explain-it routing settings, URL summary, daily briefing, admin, layout editor section, …). Approx. **~5k+** lines — the main remaining debt.

---

## 3. Workstreams (ordered)

Execute roughly in order; parallelize **3A** batches only when deps objects are stable.

### Phase K1 — Finish **GET/settings** extraction from `server.mjs`

**Objective:** Product HTML leaves `server.mjs`; server keeps **`toolSurfacePageDeps()`-style** facades.

Suggested **file batches** (names indicative):

| Batch | Suggested module | Render functions to move |
|-------|------------------|---------------------------|
| **K1a** ✅ **`0.8.7`** | `platform-pages/ops-tool-pages.mjs` | `renderInboxPage`, `renderInboxSettingsPage`, `renderMemoryPage`, `renderMemorySettingsPage`, `renderMissionControlPage`, `renderMissionControlSettingsPage` — **delivered** (`opsToolPageDeps()` in `server.mjs`) |
| **K1b** ✅ **`0.8.8`** | `platform-pages/gtm-pages.mjs` | `renderLeadEnrichmentPage`, `renderLeadEnrichmentSettingsPage`, `renderLeadOutreachPage`, `renderLeadOutreachSettingsPage` — **delivered** (`gtmPageDeps()` in `server.mjs`) |
| **K1c** ✅ **`0.8.9`** | `platform-pages/reader-pages.mjs` | `renderWhatNextPage`, `renderWhatNextSettingsPage`, `renderUrlSummaryPage`, `renderDailyBriefingPage`, `renderExplainItSettingsPage` — **delivered** (`readerPageDeps()` in `server.mjs`) |
| **K1d** ✅ **`0.8.10`** | `platform-pages/routing-settings-pages.mjs` | `renderAIRoutingSettingsPage`, `renderApiAccessSettingsPage` (tool settings only; main routing/adapter pages already in `tool-surface-pages.mjs`) — **delivered** (`routingSettingsPageDeps()` in `server.mjs`) |
| **K1e** ✅ **`0.8.11`** | `platform-pages/home-admin-pages.mjs` | `renderAdminPage`, `renderAdminLayoutEditorSection`, **`renderPage`** (home shell) — **delivered** (`homeAdminPageDeps()` in `server.mjs`; chrome in **K2**). |
| **K2** ✅ **`0.8.12`** | `platform-pages/chrome.mjs` | **`renderList`**, **`renderFlashcard`**, **`renderGlobalNav`**, **`renderGlobalNavScript`** — **delivered** (`dashboardChromeDeps()` + thin wrappers in `server.mjs`; **`catalogPageUiDeps()`** / **`homeAdminPageDeps()`** unchanged). |

**Per batch:** mirror the pattern used for **`tool-surface-pages.mjs`**: exported `(layoutDoc, d)` functions; **protect** `${d.*}` template interpolations from naive `d.escapeHtml` rewrites in client `<script>` blocks.

**Exit K1:** `grep '^function render' dashboard/server.mjs` shows only **wrappers** + **shared helpers** you explicitly keep (see K2).

### Phase K2 — **Shared dashboard chrome** ✅ **`0.8.12`**

**Objective:** Decide whether **`renderList`**, **`renderFlashcard`**, **`renderGlobalNav`**, **`renderGlobalNavScript`** stay in `server.mjs` or move to e.g. **`dashboard/lib/platform-pages/chrome.mjs`** (or `dashboard/lib/dashboard-chrome.mjs` on allowlist). (**`renderPage` / `renderAdminPage`** are thin wrappers over **`home-admin-pages.mjs`** as of K1e.)

**Recommendation:** Move shared nav + catalog helpers to **one module** so `server.mjs` trends toward **imports + createServer + route switch** + thin `render*` delegates only.

**Exit K2:** ✅ **`chrome.mjs`** owns global nav + list/flashcard + nav script; **`catalogPageUiDeps()`** / **`homeAdminPageDeps()`** pass the same thin delegates into **`catalog-pages.mjs`** / **`home-admin-pages.mjs`**; boundaries §3 allowlist updated.

### Phase K3 — **Phase C** (LLM + queue alignment) ✅ *delivered batch — **`0.8.13`*

Per **`meimei-platform-alignment-roadmap.v1.md`** §6 Phase C and **`miniapp-platform-audit.v1.md`**:

1. **R2:** Miniapp LLM hot paths use **`dashboard/lib/meimei-inference-client.mjs`** (in-process **`handleMeimeiInferenceRoute`** — same contract as **`POST /api/meimei/route`**). Migrated: inbox, what-next, explain-it, memory/brain, lead-enrichment, lead-outreach, checklist (legacy JSON + **`checklist-node`** jobs/regenerate), daily-briefing, home command (**`command-interface`**), home suggestions, operator URL summary in **`server.mjs`**. **Exception:** ai-routing / api-access **preview** still **`oc-agent`** (audit **Y**).
2. **R1:** Lead enrichment **`workflow_run`** — **documented exception** in **`functions/lead-enrichment.md`** (sunset **2027-06-30**). Checklist R1 remains **Y** per audit.
3. **Docs:** **`functions/daily-briefing.md`**, **`functions/lead-enrichment.md`** (R1), **`functions/checklist.md`** (inference note); registry **`platformAlignment`** object; audit §1/§2/§4 refreshed.

**Exit K3:** R2 **G** for migrated surfaces in **`miniapp-platform-audit.v1.md`**; remaining **Y** rows explicit (routing preview, checklist R1, etc.).

### Phase K4 — **Phase D + E** (polish + gates) — *baseline delivered — **`0.8.13`*

- **R6:** Inference responses carry **`meimei_meta.trace_id`**; monitor feed exposes **`trace_id`** per row (**`meimei-monitor-feed.mjs`**). **`MEIMEI_SMOKE_STRICT=1`** asserts feed JSON shape in **`meimei-dashboard-miniapps-smoke.mjs`**.
- **R5:** No broad HTML rewrite in this batch; legacy one-offs remain tracked in audit.
- **knowmore:** **`docs/operations/knowmore-content-refresh.md`** (operational cadence).
- **Admin:** **`docs/architecture/meimei-admin-vs-miniapp-ops.v1.md`** (platform vs miniapp ops split).
- **Gates:** Registry **`platformAlignment`**; strict smoke policy documented in smoke script header.

**Exit K4:** Baseline docs + strict smoke hook landed; roadmap Phase E sign-off remains with product owner.

---

## 4. Optional future (after kernel is clean)

Not required for “clean monorepo kernel,” but available if you need stronger isolation:

| Step | Meaning |
|------|---------|
| **Packages** | `@meimei/kernel` vs `@meimei/miniapp-*` npm workspaces; same contracts. |
| **Processes** | Separate worker/dashboard already partially true; split HTTP services only if SRE/security demands. |
| **Dynamic loading** | `import()` registry modules — requires stable manifest and tests. |

---

## 5. Enforcement backlog (extend as kernel hardens)

| Check | Purpose |
|-------|---------|
| **`meimei-apps-cross-import-check.mjs`** | Add **`import()`** / dynamic patterns when/if used. |
| **`meimei-server-size-check.mjs`** (optional) | Fail CI if `server.mjs` exceeds N lines or contains `function renderFooPage` with body > M lines (tune after K1). |
| **Audit JSON export** | Optional validator: no **Red** without `acceptedRisk` field. |

---

## 6. Tracking

- **Bump this doc v1** when kernel **definition** §1 or **exit criteria** change materially.
- **Ship log:** record each K-phase completion in **`docs/releases/CHANGELOG.md`** and a line in **`VERSION.md`** “Included issue deliveries” if you use that ledger.
- **Single source of priority:** keep **`miniapp-platform-audit.v1.md`** rows in sync when moving handlers.

---

## 7. References

- [`meimei-repo-boundaries.v1.md`](meimei-repo-boundaries.v1.md)  
- [`meimei-platform-alignment-roadmap.v1.md`](meimei-platform-alignment-roadmap.v1.md)  
- [`meimei-app-development-guide.v1.md`](meimei-app-development-guide.v1.md)  
- [`miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md)  
- [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md)
