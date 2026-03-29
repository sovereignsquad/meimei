# MeiMei kernel completion plan — v1

**Status:** active plan (from repo state **2026-03-30**, package **`agent-meimei` ~0.8.10**).  
**Goal:** A **clear kernel** (runtime + contracts + shared libraries) with **all product surfaces** owned as **modules** (apps, tools, platform GET shells, integrations) — not a growing monolith in `dashboard/server.mjs`.  
**Companion docs:** [`meimei-repo-boundaries.v1.md`](meimei-repo-boundaries.v1.md) (layers + allowlist), [`meimei-kernel-code-audit.v1.md`](meimei-kernel-code-audit.v1.md) (evidence-based kernel baseline + inventory), [`../developers/meimei-kernel-handbook.v1.md`](../developers/meimei-kernel-handbook.v1.md) (integration handbook), [`meimei-platform-alignment-roadmap.v1.md`](meimei-platform-alignment-roadmap.v1.md) (Phases A–E), [`miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md) (R1–R8 scorecard).

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
| **K1e** | `platform-pages/home-admin-pages.mjs` | `renderAdminPage`, `renderAdminLayoutEditorSection`, and optionally **`renderPage`** if kept as shell |

**Per batch:** mirror the pattern used for **`tool-surface-pages.mjs`**: exported `(layoutDoc, d)` functions; **protect** `${d.*}` template interpolations from naive `d.escapeHtml` rewrites in client `<script>` blocks.

**Exit K1:** `grep '^function render' dashboard/server.mjs` shows only **wrappers** + **shared helpers** you explicitly keep (see K2).

### Phase K2 — **Shared dashboard chrome** (optional consolidation)

**Objective:** Decide whether **`renderList`**, **`renderFlashcard`**, **`renderGlobalNav`**, **`renderGlobalNavScript`**, **`renderPage`** stay in `server.mjs` or move to e.g. **`dashboard/lib/platform-pages/chrome.mjs`** (or `dashboard/lib/dashboard-chrome.mjs` on allowlist).

**Recommendation:** Move to **one module** once K1 is done, so `server.mjs` is **imports + createServer + route switch** only.

**Exit K2:** Single file (or two: chrome + server) owns global nav / home shell; boundaries §3 allowlist updated.

### Phase K3 — **Phase C** (LLM + queue alignment) — *modules stay modules*

Per **`meimei-platform-alignment-roadmap.v1.md`** §6 Phase C and **`miniapp-platform-audit.v1.md`** Yellow rows:

1. **R2:** Migrate **Yellow** miniapps from raw **`llm.mjs`** on the hot path to **`POST /api/meimei/route`** or enqueued **`inference_v1`** (inbox, what-next, explain-it, memory/brain, lead-outreach `draft_touch`, Checklist paths as scoped).
2. **R1:** Where work is truly async/burst, enqueue **`meimei_jobs`** (or document an explicit exception in the app contract).
3. After each app: **CHANGELOG**, **`functions/<id>.md`**, optional **`dashboard:smoke:miniapps`** assertion.

**Exit K3:** Audit R1/R2 columns **Green** or **documented Yellow with dated sunset** in audit.

### Phase K4 — **Phase D + E** (polish + gates)

- **R6:** `trace_id` through migrated flows; monitor rows useful for those apps.
- **R5:** One-off HTML aligned to layout-flow / tokens where still legacy.
- **knowmore:** operational refresh process (content + links), no queue.
- **Admin:** Doc split “platform config” vs “miniapp ops” + env keys (**`meimei-app-development-guide`** + runbook).
- **Gates:** Optional **`registry.platformAlignment`** sidecar; **`dashboard:smoke:miniapps`** in CI/nightly + **`MEIMEI_SMOKE_STRICT`** policy; architect sign-off bullets in roadmap §6 Phase E.

**Exit K4:** Roadmap Phase D/E checkboxes satisfied; release discipline documented.

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
