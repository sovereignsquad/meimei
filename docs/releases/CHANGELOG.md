# CHANGELOG

## 2026-03-30 — Kernel K1e: Home + admin GET shells (`0.8.11`)

- **`dashboard/lib/platform-pages/home-admin-pages.mjs`** — **`renderPage`** (home), **`renderAdminPage`**, **`renderAdminLayoutEditorSection`** moved out of `server.mjs` (`homeAdminPageDeps()` — injects **`renderGlobalNav`** / **`renderGlobalNavScript`** from server; **`renderFlashcard`** stays in `server.mjs` for catalog per K2).
- **Docs:** `meimei-repo-boundaries.v1.md` allowlist; **`miniapp-platform-audit.v1.md`** admin row; **`meimei-kernel-completion-plan.v1.md`** K1e delivered; `platform-pages/README.md`, app development guide, kernel code audit metrics.
- **Version:** package **0.8.11**; checklist + platform modules **`@aligned package agent-meimei 0.8.11`**.

## 2026-03-30 — Docs: system vision & platform audit v3 (strategic / final audit trilogy)

- **`docs/architecture/meimei-system-vision-and-platform-audit.v3.md`** — Third audit: north star and purpose, theoretical foundations (dual planes, adapter quarantine, actor-style bus, contract-first miniapps, deterministic routing policy, markdown memory, governance gates), high/low-level architecture, workflows (sync miniapp, async inference, inter-app, command UI, OpenClaw), **application-layer build space**, alignment pillars, documentation research map. Linked from kernel code audit, kernel completion plan, `docs/README.md`, `docs/developers/README.md`.

## 2026-03-30 — Kernel K1d: AI routing & API access settings shells (`0.8.10`)

- **`dashboard/lib/platform-pages/routing-settings-pages.mjs`** — GET HTML for **AI routing** and **API access** **settings** moved out of `server.mjs` (`routingSettingsPageDeps()` thin wrappers). Main routing / API adapter tool pages stay in **`tool-surface-pages.mjs`**.
- **Docs:** `meimei-repo-boundaries.v1.md` allowlist; **`miniapp-platform-audit.v1.md`**; **`meimei-kernel-completion-plan.v1.md`** K1d delivered; `platform-pages/README.md`, app development guide, kernel code audit metrics.
- **Version:** package **0.8.10**; checklist + platform modules **`@aligned package agent-meimei 0.8.10`**.

## 2026-03-30 — Kernel K1c: Reader shells — What next, Explain it, Daily briefing (`0.8.9`)

- **`dashboard/lib/platform-pages/reader-pages.mjs`** — GET HTML for **What next** (main + settings), **Explain it** (URL summary + settings), **Daily briefing** moved out of `server.mjs` (`readerPageDeps()` thin wrappers). Module-level **`whatNextIssueId`** in `server.mjs` for deps.
- **Docs:** `meimei-repo-boundaries.v1.md` allowlist; **`miniapp-platform-audit.v1.md`**; **`meimei-kernel-completion-plan.v1.md`** K1c delivered; `platform-pages/README.md`, app development guide, kernel code audit metrics.
- **Version:** package **0.8.9**; checklist + platform modules **`@aligned package agent-meimei 0.8.9`**.

## 2026-03-30 — Docs: kernel audit v1.1 + handbook v1.1 (architect baseline)

- **`docs/architecture/meimei-kernel-code-audit.v1.md`** — Revision **v1.1**: document control (scope, method, refresh rules), executive summary reframed around strengths and contracted seams, design invariants, subsystem diagram, **full** boundaries §3 allowlist table + non-allowlisted `dashboard/lib` inventory, expanded job queue **public API** surface, concurrency/failure-domain matrix, **verification & governance** (`npm run ci` matrix), professional **disclosure alignment** section (kernel inference vs wider product per `ai-runtime-audit`), corrected **`server.mjs` line anchors** (v1.1 snapshot ~3840 lines; re-measured **~2244** after K1e in **0.8.11** — see audit §3.1), updated JSDoc metrics (**49** `dashboard/lib` files), peer-review **commentary rubric**, completeness / non-goals statement.
- **`docs/developers/meimei-kernel-handbook.v1.md`** — Revision **v1.1**: aligned with audit (invariants, persistence, HTTP line anchors + drift note), integration and v1 scope sections retitled for professional use.
- **`docs/developers/README.md`** — Reading order and audience descriptions updated.
- **`docs/README.md`** — Architecture index row for kernel audit updated.

## 2026-03-30 — Docs: kernel code audit + developer handbook

- **`docs/architecture/meimei-kernel-code-audit.v1.md`** — Kernel inventory vs completion plan, `server.mjs` line/render counts, HTTP / inference / job / registry lifecycles, kernel-focused AI truth table (aligned with `docs/compliance/ai-runtime-audit.md`), gap analysis K1–K4, JSDoc metrics for `dashboard/lib` + `apps` + `server.mjs`, recommended standards for new kernel modules.
- **`docs/developers/README.md`**, **`docs/developers/meimei-kernel-handbook.v1.md`** — Atomic handbook for boot, config, routing, registry, `POST /api/meimei/route`, job worker, `llm.mjs`, HTTP vs vendoring integration modes, debugging, known limitations.
- **`docs/README.md`** — Developers section + links to audit and handbook.

## 2026-03-30 — Kernel K1b: Lead enrichment & Lead outreach shells (`0.8.8`)

- **`dashboard/lib/platform-pages/gtm-pages.mjs`** — GET HTML for **Lead enrichment** and **Lead outreach** (main + settings) moved out of `server.mjs` (`gtmPageDeps()` thin wrappers).
- **Docs:** `meimei-repo-boundaries.v1.md` allowlist; **`miniapp-platform-audit.v1.md`** handler column; **`meimei-kernel-completion-plan.v1.md`** K1b marked delivered; `platform-pages/README.md`, app development guide.
- **Version:** package **0.8.8**; checklist + platform modules **`@aligned package agent-meimei 0.8.8`**.

## 2026-03-30 — Kernel K1a: Inbox, Memory, Mission Control shells (`0.8.7`)

- **`dashboard/lib/platform-pages/ops-tool-pages.mjs`** — GET HTML for **Inbox**, **Memory**, **Mission Control** (main + settings) moved out of `server.mjs` (`opsToolPageDeps()` thin wrappers).
- **Docs:** `meimei-repo-boundaries.v1.md` allowlist; **`miniapp-platform-audit.v1.md`** handler column; **`meimei-kernel-completion-plan.v1.md`** K1a marked delivered; `platform-pages/README.md`.
- **Version:** package **0.8.7**; checklist + platform modules **`@aligned package agent-meimei 0.8.7`**.

## 2026-03-30 — Platform pages: Reference app 1 & 2 shells (`0.8.6`)

- **`dashboard/lib/platform-pages/reference-app-pages.mjs`** — GET HTML for **Reference app 1** and **Reference app 2** moved out of `server.mjs` (`referenceAppPageDeps()` thin wrappers).
- **Docs:** `meimei-repo-boundaries.v1.md` allowlist; **`miniapp-platform-audit.v1.md`** — handler column cites API modules + GET shell path; `platform-pages/README.md`.
- **Planning:** **`docs/architecture/meimei-kernel-completion-plan.v1.md`** — phased path (K1–K4) from current state to a clean **MeiMei kernel** and modular surfaces; linked from **`meimei-platform-alignment-roadmap.v1.md`** §9 and **`docs/README.md`**.
- **Version:** package **0.8.6**; checklist + platform modules **`@aligned package agent-meimei 0.8.6`**.

## 2026-03-30 — Phase 0 + Phase B: Tool surface pages + monitor kinds + audit (`0.8.5`)

- **`dashboard/lib/platform-pages/tool-surface-pages.mjs`** — GET HTML for **AI routing**, **API channel adapter**, **AI SDR analytics**, **Supabase connector**, **Environment variables** moved out of `server.mjs` (`toolSurfacePageDeps()` thin wrappers).
- **`dashboard/lib/meimei-monitor-feed.mjs`** — **`formatMonitorRow`** forwards unknown **`payload_kind`** / JSON **`kind`** values so System monitor stays readable when new job kinds ship.
- **Docs:** `meimei-repo-boundaries.v1.md` §6.1 sign-off log + allowlist; `meimei-platform-alignment-roadmap.v1.md` Phase 0 wiring + exit log + Phase B R3/R4 + monitor; **`miniapp-platform-audit.v1.md`** — checklist **R3/R4** green, supabase **R4** green; **`functions/checklist.md`** R3/R4 integration section; **`functions/supabase-connector.md`** env-store R4 note.
- **Version:** package **0.8.5**; checklist + platform page modules **`@aligned package agent-meimei 0.8.5`**.

## 2026-03-29 — Phase 0: Platform catalog extraction + boundary guards + R8/R4 docs (`0.8.4`)

- **`dashboard/lib/platform-pages/catalog-pages.mjs`** — Apps / Tools / knowmore GET HTML moved out of `server.mjs`; **`system-monitor-page.mjs`** — System monitor (queue explorer) shell; **`dashboard/lib/platform-pages/README.md`** describes the folder.
- **`scripts/meimei-apps-cross-import-check.mjs`** — fails if any `apps/*` module imports another app’s path; **`npm run boundary:check`** runs it after `meimei-repo-boundaries-check.mjs`.
- **Docs:** **`meimei-repo-boundaries.v1.md`** §6 Phase 0 scope / waivers / sign-off; allowlist adds `platform-pages/catalog-pages.mjs`. **`functions/*.md`** — **Operator transport & secrets (R8 / R4)** (loopback vs TLS prefix, env SoT).
- **Version:** package **0.8.4**; checklist integration modules **`@aligned package agent-meimei 0.8.4`**.

## 2026-03-29 — Phase 0: Checklist bridge HTTP extracted (`0.8.3`)

- **`dashboard/lib/checklist-bridge-http.mjs`** — **`serveChecklistBridgeHttp`** handles **`/api/checklist/bridge`** (OPTIONS/CORS, secret, Node engine, Python worker forward). `server.mjs` calls it in one `if (await serveChecklistBridgeHttp(…)) return`.
- **Version:** package **0.8.3**; checklist modules **`@aligned package agent-meimei 0.8.3`**.
- **Docs:** boundaries, roadmap, audit, `functions/checklist.md`, delivery record.

## 2026-03-29 — Phase 0: Checklist local proxy + shell page (`0.8.2`)

- **`dashboard/lib/checklist-local-integration.mjs`** — **`tryProxyChecklistRequest`** (reverse-proxy to local Next.js) and **`renderChecklistLocalShellPage`** (fallback HTML when upstream disabled). **`server.mjs`** drops unused **`node:https`** import (proxy uses https inside the new module).
- **Version alignment:** package **0.8.2**; checklist modules’ **`@aligned package agent-meimei 0.8.2`**.
- **Docs:** `meimei-repo-boundaries.v1.md`, `meimei-platform-alignment-roadmap.v1.md` Phase 0; audit + `functions/checklist.md` updated.

## 2026-03-29 — Phase 0: Checklist shell extraction + version alignment (`0.8.1`)

- **Checklist registry shell** moved from inline `dashboard/server.mjs` to **`dashboard/lib/checklist-api-shell.mjs`** (`processChecklistShell`, `handleChecklistPostShell`, `checklistUpstreamOrigin`, `checklistUpstreamPathPrefix`). `server.mjs` keeps a thin `handleChecklistPost` delegate and proxy/bridge wiring.
- **Comment / version alignment:** `checklist-api-shell.mjs`, `checklist-bridge.mjs`, and `checklist-node/engine.mjs` document **`@version 1.0.0`** and **`@aligned package agent-meimei 0.8.1`**.
- **Docs:** `meimei-repo-boundaries.v1.md` checklist row + allowlist; `meimei-platform-alignment-roadmap.v1.md` Phase 0 checkbox; `miniapp-platform-audit.v1.md`; `functions/checklist.md`. **Delivery record:** [`docs/releases/DELIVERY-phase-0-2026-03-29.v1.md`](DELIVERY-phase-0-2026-03-29.v1.md).
- **`functions/registry.v1.json`:** `generatedAt` **2026-03-29** (metadata only).
- **MeiMei Checklist platform rename** (same release train): **`MEIMEI_CHECKLIST_*`**, **`/api/checklist/bridge`**, **`x-meimei-checklist-secret`**, SQLite under **`data/checklist/`**, scripts **`checklist:queue-consumer`** / **`checklist:sync-theme`**.

## Unreleased

- **Alignment delivery (Phase 0 — lead enrichment):** **`enrichLead`** (LinkedIn, email, company, phone, **CRM**, **Supabase**) and **workflow** actions (`workflow_overview`, `workflow_list`, enqueue/run/skip/remove) moved from `dashboard/server.mjs` into **`apps/lead-enrichment/index.mjs`**. `workflow_run` passes `(opts) => enrichLead(opts, repoRoot)` into `runWorkflowItem`. Server POST delegates to `leadEnrichmentHandler` only.
- **Alignment delivery (Phase 0 — app extraction):** **Lead outreach**, **AI SDR analytics**, and **Supabase connector** APIs moved from inline `dashboard/server.mjs` logic to **`apps/lead-outreach/index.mjs`**, **`apps/ai-sdr-analytics/index.mjs`**, **`apps/supabase-connector/index.mjs`** (registry links resolved via `miniappRuntimeConfig`). Server delegates POST only.
- **Alignment delivery (Phase 0 code):** **Checklist** registry API — single `POST` via `handleChecklistPost` → **`checklist-api-shell.mjs`** for shell actions or `apps/checklist/index.mjs` for legacy JSON. **`npm run boundary:check`** enforces one branch; wired into **`npm run ci`**. Contract [`functions/checklist.md`](../../functions/checklist.md) + audit [`miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md) updated.
- **Architecture (alignment roadmap):** **Phase 0 — mandatory separation** added before Phases B–D — core vs miniapp vs platform UI vs integrations; prerequisite for P0/P1 refactors. New §3b boundary model + Phase 0 checklist in [`docs/architecture/meimei-platform-alignment-roadmap.v1.md`](../architecture/meimei-platform-alignment-roadmap.v1.md). Draft boundary inventory: [`docs/architecture/meimei-repo-boundaries.v1.md`](../architecture/meimei-repo-boundaries.v1.md) (registry → owner table, core `dashboard/lib` allowlist proposal, `server.mjs` rules).
- **Compliance:** Phase A miniapp platform audit — [`docs/compliance/miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md) (registry R1–R8 scorecard, knowmore/admin surfaces, checklist duplicate-route finding). Roadmap Phase A checkboxes updated in [`docs/architecture/meimei-platform-alignment-roadmap.v1.md`](../architecture/meimei-platform-alignment-roadmap.v1.md).
- **MeiMei Control (menu bar):** App bundle renamed from **MeiMei.app** to **MeiMei Control.app** with display name **MeiMei Control** (`CFBundleName` / `CFBundleDisplayName`); internal executable remains **MeiMei**; `npm run menubar:install` installs to `~/Applications/MeiMei Control.app` and removes legacy `~/Applications/MeiMei.app`. Docs and runbook updated.
- **MeiMei Control (scope):** Menu is **Start / Stop / Restart**, **Open dashboard in browser**, log, **Preferences**, Quit (no OpenClaw/Checklist/extra links — use the web dashboard). **`npm run menubar:install`** writes **`~/.meimei/repository_root`**; **`MEIMEI_REPO_ROOT`** and `~/Projects/agent.meimei`-style paths for auto-discovery. Orange triangle = checkout not resolved.
- **MeiMei Control (health UX):** **Orange** “needs setup” when **repository root** is unset (typical `~/Applications` install) instead of misleading **red**; menu bar icon bootstraps health from defaults on **label** `onAppear` (not only when the menu opens); **45s** grace before red while launchd/Node starts; **Open Preferences — set repository root** in menu; **Start** without repo shows an alert; root README step for repository root. Re-run `npm run menubar:build && npm run menubar:install` to pick up.
- **Milestone H (System monitor / Queue Explorer):** Read-only dashboard **`/system-monitor`** (Tools → **System monitor** card) — polls **`GET /api/meimei/monitor/feed`** with optional **`trace_id`** for chronological lineage; human-readable feed lines from schema v2 routing columns + intent; **Claim Check** rows show artifact path badge only (`dashboard/lib/meimei-monitor-feed.mjs`, **`listMonitorFeed`** on `meimei-job-queue.mjs`). **`inter-app-message-bus.v1.md` §8** updated.
- **Milestone G (inter-app bus):** SQLite schema v2 — `payload_kind`, `target_adapter`, `source_adapter`; inference worker claims **`inference_v1`** only; **`claimNextAppTaskForTarget`** + **`getJobByIdForParty`**, **`listAppTasksForTraceParty`**, **`listInboxAppTasksForTarget`**. **`meimei_correlation`** on inference enqueues reply **`app_task`** (Claim Check over 64 KiB → `data/meimei/artifacts/<trace_id>/digest.md`). **`startReferenceApp2Inbox`** (env **`MEIMEI_APP_INBOX_WORKER`**, **`MEIMEI_APP_INBOX_POLL_MS`**). Registry **`reference-app-2`** (`/791/Reference_app_2`). Reference App 1 UI: ping/pong + standup digest. Script **`npm run test:mas-handshake`**. Docs: **`adapter-contract.v1.md`**, **`functions/reference-app-1.md`**, **`functions/reference-app-2.md`**.
- **Operations (headless server epic):** Runbook **`docs/operations/mac-headless-server.md`** (power recovery, sleep, FileVault vs auto-login, LaunchAgents login trap, Ollama bootstrap, post-reboot checks). Developer backlog handoff **`docs/operations/handoff-roadmap-headless-server.v1.md`**. Linked from **`docs/operations/runbook.md`**.
- **Architecture (Milestone G prep):** **`inter-app-message-bus.v1.md`** — event bus + `app_task`, **§4 Claim Check** (~64 KiB control-plane limit, `data/meimei/artifacts/<trace_id>/`), **§5 correlation** (`trace_id`, `parent_job_id`, `reply_to`, Standup test mandate), traceability §8, Milestone G (ping/pong → Standup Digest). Handoff **`handoff-milestone-g-inter-app-bus.v1.md`**. Pointers in **`adapter-contract.v1.md`**, **`meimei-app-development-guide.v1.md`**.
- **Reference app 1 (Phase 4):** Registry miniapp **`reference-app-1`** — `/790/Reference_app_1`, API **`/dashboard/api/functions/reference-app-1`**. Gated by **`REFAPP_FEATURE_TOGGLE`**; enqueues **`inference_v1`** to **`meimei_jobs`** (`adapter_name` **`reference-app-1`**) and polls **`status`** (scoped `getJobByIdForAdapter`). Handler: `dashboard/lib/reference-app-queue-api.mjs`. Contract: `functions/reference-app-1.md`.
- **Environment variables:** Soft naming hints in the Tools → Environment variables UI (`!` flag + yellow text for non-`APP_VAR` keys); optional **`MEIMEI_ENV_STRICT_KEY_NAMES=1`** rejects `upsert` unless the key matches `/^[A-Z0-9]+_[A-Z0-9_]+$/` or is on **`MEIMEI_ENV_SYSTEM_ALLOWLIST`** (`PORT`, `HOME`, `USER`, …). `list` / `catalog` return **`keyNaming`**. Contract appendix: `docs/architecture/meimei-env-ui-contract.v1.md`.
- **Dashboard:** Removed duplicate `checklistRoute` / checklist constants in `dashboard/server.mjs`; registry fallback API path is `/dashboard/api/functions/checklist`.
- **Obsidian adapter (Milestone E v1):** `scripts/meimei-adapter-obsidian.mjs` — `chokidar` on vault, **2s** debounce, triggers `_meimei_inbox/**/*.md` or `#meimei-summarize`, egress poll appends MeiMei callout and **deletes** completed rows. Queue helpers: `listCompletedForAdapter`, `deleteJob`. Doc: `docs/architecture/adapter-obsidian.v1.md`. Dependency: **`chokidar@4`**.
- **Adapter quarantine (Milestone D v1):** SQLite `meimei_jobs` spooler (`node:sqlite` + **WAL** / `busy_timeout` for multi-process enqueue), in-process worker (`dashboard/lib/meimei-job-worker.mjs`), contract `docs/architecture/adapter-contract.v1.md`. Demos: `npm run jobs:demo-enqueue`, `npm run jobs:demo-file-drop` (polls `data/meimei-demo-in/*.json`). Env: `MEIMEI_JOB_POLL_MS`, `MEIMEI_JOB_MAX_FAILURES`, `MEIMEI_JOB_WORKER=0`, `MEIMEI_FILE_DROP_POLL_MS`.
- **Inference plane (Milestone C v1):** `POST /api/meimei/route` — OpenAI Chat Completions–shaped blocking router to Ollama (`/v1/chat/completions`), cheap token estimate guard (`413`), `stream: true` and `localOnly: false` → `501`, `meimei_meta` on success. Spec: `docs/api/inference-route.v1.md`. HTTPS proxy routes `/api/meimei/*` to the dashboard.
- **Menubar (Milestone B):** Start / Stop / Restart platform (async scripts, no main-thread `waitUntilExit`), `GET` polling of configurable health URL (default loopback `/api/health`), menu bar icon tint by status, `~/.meimei/logs/MeiMeiControl.log`, Preferences field **Health check URL**.
- **Milestone A — MeiMei LaunchAgents:** Canonical labels `com.agent.meimei.dashboard-ui`, `com.agent.meimei.dashboard-proxy`, `com.agent.meimei.dashboard-health`; logs under `~/.meimei/logs/`. Retired `ai.openclaw.meimei.dashboard-*` plists removed on `meimei-domain install` / migrator `scripts/meimei-platform-migrate.sh` (`--force`). LLSD: `docs/operations/meimei-platform-launchd.v1.md`.
- **`GET /api/health`:** Fast liveness JSON (`config/dashboard-surface.v1.json` `api.health`); HTTPS proxy routes it to the dashboard (not OpenClaw gateway). Health watchdog probes this path by default (interval default 60s).
- **`npm run dashboard:watchdog:install`:** Delegates to `meimei-domain install` + `meimei-openclaw-dashboard-watchdog-install.sh` to avoid a second dashboard on the same port.

## 2026-03-28 - AI-Native Platform: 100% LLM-based system (`0.9.0`)

### LLM Foundation (Phase 1)
- **LLM abstraction layer** (`dashboard/lib/llm.mjs`): `callOllama()`, `callOllamaJson()`, `parseJsonResponse()` with robust JSON extraction from markdown/code blocks. Handles Ollama `format: "json"` and `thinking` field for qwen3.5.
- **Prompt cache** (#613): LRU cache with 30-minute TTL. `GET /api/llm/cache/stats`, `POST /api/llm/cache/clear`.
- **Model routing engine** (#517, #561, #612): Brain-muscle architecture. Per-channel (dashboard/api/chat/heartbeat) and per-task model selection. `GET/POST /api/llm/routing`.
- **Token tracking** (#617): Tracks input/output tokens by model and task type. `GET /api/llm/stats`, `POST /api/llm/stats/reset`.

### Brain Memory System (Phase 1 + Wave 1)
- **Brain architecture** (`dashboard/lib/brain/`, `brain/`): 6-layer memory (identity, user, context, skills, durable, log). All markdown-based, git-tracked.
- **Durable backbone** (#564): Token counting, context budget (4096 tokens), log compaction with LLM summarization, durable memory deduplication, snapshots before compaction.
- **Session discipline** (#614): Per-layer token budgets, context truncation when over budget.
- **Brain API**: `think()`, `learn()`, `log()`, `buildContext()`. Memory tool with `query`, `learn`, `think`, `stats`, `compact`, `curate`, `snapshot` actions.
- **Brain health endpoint**: `GET /api/brain/health`.

### Real Data Integration (Phase 2)
- **Lead Enrichment** (#649): Ollama LLM for profile generation from email/LinkedIn/company. `callOllamaJson()` with `format: "json"`.
- **Inbox** (#563): Real macOS Mail via AppleScript (`dashboard/lib/mail-adapter.mjs`). AI priority sorting with LLM. No more fake `Math.random()` data.
- **Memory** (#601): Brain system with line-by-line markdown parser. `think`, `learn`, `query` actions.
- **Mission Control** (#635): Real OpenClaw telemetry (`dashboard/lib/telemetry.mjs`). Gateway status, agent list, workspace logs.
- **What Next** (#724): Direct LLM with Brain context + Mail data. No more external scripts.
- **Explain It** (#516): Web fetch + `callOllamaJson()` with Brain context.

### AI Command Interface (Phase 3)
- **Natural language API** (#7): `POST /api/command` with keyword + LLM intent parsing. Handles: check inbox, enrich leads, what next, system status, summarize URLs, learn facts.
- **Home chat UI**: Search-box command bar, chat bubbles, typing indicator.
- **Context-aware suggestions** (#9): `GET /api/command/suggestions`. Proactive next actions based on Brain state.
- **Daily Briefing**: `callOllamaJson()` with Brain context + Mail data. Writes to `briefing.md`.

### Proxy & Infrastructure
- **Proxy routing fix**: `/api/functions/*`, `/api/command/*`, `/api/llm/*`, `/api/brain/*` route to the dashboard HTTP server (`config/dashboard-surface.v1.json` `defaults.port`), not OpenClaw gateway (port 18789). (`scripts/meimei-domain.mjs`).
- **Design system**: `.ds-markdown` component for markdown rendering. No hardcoded styles in miniapps.

### Documentation
- **`ARCHITECTURE.md`**: Full system architecture with diagrams, data flows, component specs.
- **`brain/` directory**: Identity, user, context, skills, durable, log layers.
- **`cursor-kilo.md`**: Agent coordination (KILO + CURSOR parallel work).

### GitHub Issues Closed
- Phase 1: #601, #602, #603, #604, #605, #635
- Wave 1: #564, #614, #613
- Wave 2: #517, #561, #612, #615, #617
- **Total: 14 issues closed**

### Bug Fixes
- Mission Control null error: `renderDashboard()` was trying to update stat cards before they existed. Removed direct `querySelector` calls, now uses `innerHTML` approach only.
- Memory regex errors: Template literal escaping for `\*` and backtick characters in client-side JavaScript.

---

## 2026-03-28 - Operator GTM funnel and environment governance (`0.8.0`)

### Lead pipeline and SDR (mvp-factory-control)

- **#650** — Lead enrichment workflow: local queue (`data/lead-enrichment-workflow.v1.json`), `workflow_*` API actions, dashboard table with Run / Skip / Remove / Outreach handoff to Lead outreach via `sessionStorage` prefill (`dashboard/lib/lead-enrichment-workflow.mjs`).
- **#653 / #654** — Lead outreach: `draft_touch`, `sdr_send` (Apple Mail draft + JSONL), `sdr_analytics`, `sdr_track` (`dashboard/lib/sdr-analytics.mjs`, `mail-adapter.mjs`); docs in `functions/lead-outreach.md`.
- **#651** — AI SDR analytics miniapp `/651/AI_SDR_analytics`: combined metrics from SDR log and workflow store (`dashboard/lib/gtm-analytics.mjs`); contract `functions/ai-sdr-analytics.md`.
- **#631** — Supabase connector tool `/631/Supabase_connector` and Lead Enrichment source `supabase` (PostgREST via fetch; env `MEIMEI_SUPABASE_*`) (`dashboard/lib/supabase-connector.mjs`, `functions/supabase-connector.md`).

### Secrets and configuration (workspace #726)

- **Environment variables** miniapp `/726/Environment_variables`: Vercel-style name / value / Production·Preview·Development CRUD; `data/meimei-environment.v1.json` (gitignored, chmod 600); applies to `process.env` on load and after save; `MEIMEI_ENV_PROFILE` two-pass apply; suggested keys in `config/meimei-env-catalog.v1.json` (`dashboard/lib/meimei-env-store.mjs`, `functions/environment-variables.md`).
- `vercel-env-inventory.md` documents the dashboard editor alongside Vercel pull.

### Registry and operator UX

- **12** function contracts in `functions/registry.v1.json`; Inbox catalog order adjusted for new apps.
- Command interface and home-suggestions navigate to SDR analytics, Supabase connector, and Environment variables.

### Documentation and product map

- `ai-runtime-audit.md`, `product_roadmap.md`, `documentation-audit.md`, `docs/README.md`, `config/knowmore-releases.v1.json`, and related README links updated in this wave.
- Optional `scripts/what-next.mjs` and `scripts/what-next-schedule` added for local scheduling experiments.

## 2026-03-27 - API channel adapter miniapp (`0.7.4`)

### Channel reference (`mvp-factory-control#700`)

- Added miniapp route `/700/API_channel_adapter` and HTTP `GET`/`POST` `/api/functions/api-channel-adapter` (same adapter engine as model routing; dedicated contract path).
- Documented delivery artifact in `channel-api-adapter-reference-v1.md` and `functions/api-channel-adapter.md`; registry entry `api-channel-adapter`.
- Updated knowmore card for issue 700, `product_roadmap.md`, and `architecture.md` channel layer references.

## 2026-03-27 - Design system hardening wave (`0.7.3`)

### Documentation and communication quality

- Added `project-vocabulary-v1.md` to standardize project-level wording and release-note language.
- Rewrote `architecture.md` with explicit layer boundaries, runtime topology, and enforceability principles.
- Updated `README.md` state/version language to match released runtime maturity and `VERSION.md`.

### Design system centralization and hardening

- Added shared stylesheet `public/styles/design-system.css` as the single source of UI tokens/components across dashboard and miniapp pages.
- Standardized flashcard structure to `kind`, `title`, `content` rendering (`APP` / `ISSUE #...`) without variable-name prefixes.
- Hardened knowmore rendering and modal behavior:
  - safe DOM card creation (`createElement`/`textContent`)
  - class-based modal state (`.is-open`) instead of inline style mutation.
- Expanded token model for modal/terminal/code surfaces and OpenClaw branding; added explicit `data-theme=\"red\"` support.
- Added standardized mobile nav component (`.nav-toggle` + `.nav-actions.is-open`) across dashboard, knowmore, and admin.

## 2026-03-26 - Foundation hardening wave

### Governance and quality gates

- Added `foundation-contradiction-audit.md` to capture concrete baseline contradictions and remediation order (`48fb09b`).
- Added `issue-quality-standard.md` and `issue-ready-gate-checklist.md` for issue quality and phase-entry discipline (`dc2a042`).
- Added `sovereign-agent-role-taxonomy-v1.md` defining planner/architect/implementer/reviewer/tester/releaser boundaries and authority matrix (`6a37691`).
- Added `handoff-artifact-schema-v1.md` plus handoff validator and sample artifact for stage-gate enforcement (`dcdbee6`).
- Added `release-gates-dod-v1.md` plus release validator and sample artifact to enforce DoD/testing release readiness (`9f5463a`).

### Miniapp contract and registry

- Added frozen `miniapp-contract-v1.md` standard for all miniapps (`b946e53`).
- Added machine-readable `functions/registry.v1.json` and `scripts/validate-function-registry.mjs` (`7596b3d`).
- Updated core function docs to include explicit Miniapp Contract v1 instances (`6cd58c5`).

### Channel adapter architecture

- Added `channel-adapter-contract-v1.md` and `channel-adapter-lifecycle-v1.md` as canonical multi-channel standards (`3e5d092`).
- Implemented API reference adapter in `dashboard/lib/api-channel-adapter.mjs` and integrated server path (`efed945`).
- Added WhatsApp parity spec and validator (`whatsapp-adapter-parity-v1.md`, `scripts/validate-whatsapp-adapter.mjs`) (`7db3687`).
- Added iMessage adapter architecture plan (`imessage-adapter-architecture-v1.md`) (`acbb161`).
- Added Email adapter architecture plan (`email-adapter-architecture-v1.md`) (`abf2642`).
- Added Discord adapter architecture plan (`discord-adapter-architecture-v1.md`) (`5f31612`).

### Runtime and operations

- Added unified readiness gate command/script (`scripts/oc-readiness`, `npm run readiness`) (`a365920`).
- Refactored runtime helpers from `dashboard/server.mjs` into `dashboard/lib/runtime.mjs` (`d22c74e`).
- Updated runbook/readme command surfaces for readiness and validator workflows (multiple commits in this wave).

