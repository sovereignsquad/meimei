# MeiMei platform alignment roadmap — v1

**Status:** planning artifact (not implementation).  
**Audience:** Product owner, architect, implementers.  
**Goal:** Audit every operator-facing surface (registry apps/tools, knowmore, admin/settings), compare them to the **core MeiMei platform** contracts, and sequence refactor work until alignment is explicit and testable. **Separation of core vs miniapps/tools vs integrations is mandatory** — Phase 0 establishes enforceable boundaries **before** the bulk of alignment refactors (Phases B–D), so work is not done twice.

---

## 1. What counts as “core MeiMei platform”

Use this as the **requirements baseline** for comparisons (sources of truth in-repo):

| Pillar | Contract / implementation | What “aligned” means |
|--------|---------------------------|----------------------|
| **Job spooler** | `docs/architecture/adapter-contract.v1.md`, `meimei-job-queue.mjs` | Async/burst work that can be modeled as jobs uses **`meimei_jobs`** with documented payloads (`inference_v1`, `app_task`, …); no ad-hoc long work on the HTTP handler thread where the contract forbids it. |
| **Inference** | `docs/api/inference-route.v1.md`, `handleMeimeiInferenceRoute` | New or refactored LLM paths use **`POST /api/meimei/route`** (OpenAI-shaped) or **enqueue `inference_v1`** for the worker — not scattered raw Ollama calls in new code (**legacy** `dashboard/lib/llm.mjs` allowed until migrated — see dev guide). |
| **Inter-app / adapters** | `docs/architecture/inter-app-message-bus.v1.md` | App-to-app delegation uses **`app_task` + `trace_id` + correlation / Claim Check** — not synchronous `fetch` to another miniapp API for delegated work. |
| **Secrets & config** | `docs/architecture/meimei-env-ui-contract.v1.md`, `meimei-env-store.mjs` | Keys documented in catalog where shared; naming conventions; single SoT JSON; no secrets in client DOM. |
| **UI shell** | `design-system-v1.md`, `page-layout.v1.json`, `meimei-app-development-guide.v1.md` §6 | Uses design-system CSS, layout-flow/boxes where applicable; no duplicate route definitions vs registry. |
| **Observability** | Dev guide §8, System Monitor | Meaningful **`trace_id`** on bus/router paths; operator can see lineage in **`GET /api/meimei/monitor/feed`** for queue-backed flows. |
| **Registry & docs** | `functions/registry.v1.json`, `functions/<id>.md`, `docs/architecture/miniapp-contract-v1.md` | Every catalogued function has an up-to-date contract doc and registry metadata (capabilities, safety). |

**Explicit non-goals for “full alignment”:**

- Replacing **knowmore** with the job queue (it is **issue metadata**, not runtime).
- Forcing **every** read-only tool through SQLite (e.g. env **list** can stay synchronous).
- HTTPS-only loopback (today: **HTTP** dashboard + **HTTPS** proxy — document, don’t pretend uniformity).

---

## 2. Scope of the audit (“surfaces”)

| Bucket | Included | Notes |
|--------|----------|--------|
| **Apps** | Every `category: "apps"` entry in `functions/registry.v1.json` | Includes Reference apps, Checklist, Inbox, etc. |
| **Tools** | Every `category: "tools"` entry in `functions/registry.v1.json` | Env, AI routing, Memory, Mission Control, Supabase, API access, … |
| **knowmore** | `/knowmore` (and related config) | `config/knowmore-releases.v1.json` — **content / PM spine**, not `meimei_jobs`. |
| **Admin / settings** | `/admin`, page-layout editor, ops panels in `server.mjs` | Mix of **platform chrome** and **operator tools** — split in audit. |

**Out of scope for *miniapp* alignment** (still document dependencies):

- **MeiMei Control** (Swift) — launcher only; already scoped separately.
- **LaunchAgents / proxy / menubar scripts** — ops, not registry miniapps.
- **External repos** (e.g. Next.js checklist) — audit **integration contract** only.

---

## 3. Audit methodology (repeatable)

For **each** registry function (and separately for knowmore + admin):

1. **Inventory**  
   - `id`, route, API path, handler location (`apps/<id>/`, `dashboard/server.mjs`, `dashboard/lib/*`).  
   - List **direct** `process.env` keys, **`llm.mjs` / `callOllama`**, **`fetch` to Ollama**, **`meimei_jobs` usage**, **`app_task`**, **`/api/meimei/route`**.

2. **Scorecard** (per pillar in §1)  
   - **Green:** Already matches contract.  
   - **Yellow:** Legacy acceptable per dev guide (“established miniapps”) but should migrate.  
   - **Red:** Violates a hard rule (e.g. peer `fetch` between apps for async work, secrets in page source, duplicate env SoT).

3. **Dependencies**  
   - macOS-only (Mail), external SaaS (Supabase), local daemons (Next, OpenClaw), Ollama.

4. **Test hooks**  
   - Extend **`npm run dashboard:smoke:miniapps`** with stricter assertions where useful; add **queue/monitor** assertions per app where applicable.

5. **Single owner row** in a tracking table (spreadsheet or GitHub Project): **Priority, Effort, Risk, Dependencies**.

Deliverable of Phase A: **`docs/compliance/miniapp-platform-audit.v1.md`** (or similar path) — a table with one row per surface + scorecard + links to issues.

---

## 3b. Mandatory separation — boundary model (Phase 0 reference)

These **layers** are how we manage apps, tools, and non-core modules **separately** from the core platform. Phase 0 makes them real in the repo, not only conceptual.

| Layer | Meaning | Target location (v1 direction) |
|-------|---------|--------------------------------|
| **Core platform** | HTTP server shell, registry loading, env apply, job queue/worker, inference route, design-system hosting, shared auth assumptions — **no product-specific business rules** | `dashboard/server.mjs` (thin), `dashboard/lib/*` modules on an **explicit allowlist** in the boundary doc |
| **Miniapp / tool** | One registry row (`functions/registry.v1.json`): operator-facing product surface with its own API contract | Prefer **`apps/<registry-id>/`** (`index.mjs` + helpers + tests); large shared reference demos may stay in `dashboard/lib/` only if the boundary doc names them and explains why |
| **Platform UI (non-registry)** | Home, admin/settings, knowmore, system monitor shell — operator chrome, not catalog miniapps | Documented sections in **`docs/architecture/meimei-repo-boundaries.v1.md`** (Phase 0 deliverable) + stable paths in `server.mjs` or extracted `dashboard/lib/platform-pages/*` |
| **Integrations** | Glue to **external** repos or services (Next.js checklist, external bridges) | **`integrations/<name>/`** + contract in `docs/` or `functions/*.md` |

**Dependency rule:** Phases **B–D** assume Phase **0** exit criteria are met (or explicitly waived per item with architect note). Otherwise refactors land in the monolith and must be **moved again** — forbidden under the mandatory separation policy.

---

## 4. Comparison dimensions (requirements matrix)

When comparing a surface to the core platform, score each dimension **Green / Yellow / Red** and note evidence (file:line or doc).

| # | Requirement | Question |
|---|-------------|----------|
| R1 | **Queue** | Should this feature’s heavy/async work be on `meimei_jobs`? Is it? |
| R2 | **Inference path** | LLM via **`/api/meimei/route`** or enqueued `inference_v1`, or legacy `llm.mjs`? |
| R3 | **Inter-app** | Does it call another miniapp’s HTTP API for delegated async work? (Anti-pattern per bus doc.) |
| R4 | **Env** | Reads only from applied env / catalog; no parallel secret store? |
| R5 | **UI** | Design-system + layout model; settings link pattern OK? |
| R6 | **Traceability** | `trace_id` / monitor visibility for queue-backed flows? |
| R7 | **Registry** | `functions/<id>.md` matches behavior; capabilities accurate? |
| R8 | **Transport expectations** | Document whether operator is expected to use HTTPS proxy vs raw loopback (no false “HTTPS only” claim). |

**knowmore / admin:** use a reduced matrix (R5, R7, content freshness; admin also R4 for ops secrets if any).

---

## 5. Refactor / fix / refine / rewrite — decision tree

| Scorecard | Action |
|-----------|--------|
| All Green | **Maintain** — add regression test only. |
| Yellow on R2 only | **Refine** — swap `llm.mjs` call sites to router or enqueue; keep UX. |
| Yellow on R1 | **Refactor** — introduce enqueue + worker handoff; keep same API contract where possible. |
| Red on R3 | **Refactor** — replace peer HTTP with `app_task` + inbox or merge flows. |
| Red on R4 | **Fix** — move secrets to env store; remove from DOM/repo. |
| Widespread Red + high debt | **Rewrite** — new handler + same registry `id`; deprecate old path behind flag. |

---

## 6. Phased execution plan

### Phase A — Inventory & audit (1–2 weeks wall-clock, parallelizable)

- [x] Generate the **audit table** for all registry entries + knowmore + admin sections — see [`docs/compliance/miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md).  
- [x] Tag each row **P0 / P1 / P2** (see §7).  
- [x] Land **`docs/compliance/miniapp-platform-audit.v1.md`** in-repo.  
- [ ] Optional: add **`registry.platformAlignment`** (or sidecar JSON) with `{ "era": "legacy|queue|bus", "queue": false, ... }` for UI truth — *only if* you want the dashboard to show alignment state to operators.

### Phase 0 — Mandatory separation (core vs miniapps vs platform UI vs integrations)

**Policy:** Physical and ownership boundaries are **not optional**. This phase runs **after** Phase A (inventory) and **before** Phase B, so P0/P1 fixes are implemented **inside** the right layer.

- [x] Add **`docs/architecture/meimei-repo-boundaries.v1.md`** (draft — refine during Phase 0): boundary map (paths → layer), **core `dashboard/lib` allowlist** proposal, registry `id` → owner inventory, **`server.mjs` rules**, integrations pointer.  
- [x] **Wiring-only rule:** Codified in **`meimei-repo-boundaries.v1.md`** §4; **new** product logic belongs in `apps/*`, `dashboard/lib/*` (allowlist), or **`platform-pages/*`** for large GET HTML — not inline in `server.mjs`. Remaining inline `render*Page` handlers are **legacy**; migrate incrementally.  
- [x] **Fix duplicate / unreachable routing** where the audit identified it — **checklist** `POST` merged into `handleChecklistPost` + `npm run boundary:check`.  
- [x] **Extract** inline miniapp POST handlers to `apps/` — **lead-outreach**, **ai-sdr-analytics**, **supabase-connector** (2026-03-29); `server.mjs` delegates only.  
- [x] **Lead enrichment:** moved **`enrichLead`** (all sources including CRM/Supabase) + **`workflow_*`** from `server.mjs` into **`apps/lead-enrichment/index.mjs`**; single POST path with try/catch.  
- [x] **Checklist registry shell:** **`processChecklistShell`** / **`handleChecklistPostShell`** in **`dashboard/lib/checklist-api-shell.mjs`**; `server.mjs` delegates POST; upstream env helpers co-located in shell module.  
- [x] **Checklist local integration:** **`tryProxyChecklistRequest`** + **`renderChecklistLocalShellPage`** in **`dashboard/lib/checklist-local-integration.mjs`** (Phase 0 — shrink `server.mjs`).  
- [x] **Checklist bridge HTTP:** **`serveChecklistBridgeHttp`** in **`dashboard/lib/checklist-bridge-http.mjs`** (`/api/checklist/bridge` — Node engine + Python forward).  
- [x] **Imports:** miniapps depend on **core** via stable public modules; **no** miniapp-to-miniapp **`from`** imports — enforced by **`scripts/meimei-apps-cross-import-check.mjs`** (extend for `import()` if needed). Async delegation uses **bus** contract, not peer HTTP.  
- [x] **Optional enforcement (v1):** **`npm run boundary:check`** runs `meimei-repo-boundaries-check.mjs` + `meimei-apps-cross-import-check.mjs`; extend scripts per `meimei-repo-boundaries.v1.md` §6.  
- [x] **Exit — sign-off (repo posture):** **`meimei-repo-boundaries.v1.md` §6.1** sign-off log started (2026-03-30). Named PO/architect rows replace the placeholder when available. Phase B work proceeds under documented owner paths; waivers use §6 **Waivers** line format.

### Phase B — P0 hard fixes (safety & architecture violations)

**Prerequisite:** Phase **0** exit criteria met for the surfaces touched (or documented waiver).

- [x] **Red on R3 / R4 / secrets (scoped 2026-03-30):** Audit **Red** cells cleared or downgraded per **`miniapp-platform-audit.v1.md`** update; **Checklist** integration boundaries and **Supabase** R4 operator text documented; undeclared client-side secrets — none added (bridge/header patterns documented in **`functions/checklist.md`**). Re-audit when Checklist queue or bridge contracts change.  
- [x] Document **HTTPS vs HTTP** expectations per surface in each `functions/<id>.md` (operator-facing) — **Operator transport & secrets (R8 / R4)** block (2026-03-29).  
- [x] **System monitor / queue kinds:** **`formatMonitorRow`** (`meimei-monitor-feed.mjs`) preserves unknown **`payload_kind`** values and shows them in the feed line (forward-compatible with new job kinds).  

### Phase C — P1 migrations (LLM + queue alignment)

- [ ] Per miniapp plan: migrate **Yellow R2** to router or `inference_v1` enqueue.  
- [ ] Per miniapp plan: migrate **Yellow R1** where burst/async is real (Inbox batch, Lead enrichment long runs, etc.).  
- [ ] After each migration: update **smoke script** + **CHANGELOG** + contract doc.

### Phase D — P2 polish (UX, observability, consolidation)

- [ ] **R6:** ensure `trace_id` propagation from ingress through inference for migrated flows.  
- [ ] **R5:** align older HTML pages to layout-flow / tokens where still one-off.  
- [ ] **knowmore:** refresh cadence + link to board; no queue work.  
- [ ] **Admin:** clarify which panels are “platform config” vs “miniapp ops”; document env keys that affect admin only.

### Phase E — Gates

- [ ] **`npm run ci`** unchanged or extended with alignment validators (optional script: fail on Red rows in sidecar).  
- [ ] **`npm run dashboard:smoke:miniapps`** in CI or nightly (with `MEIMEI_SMOKE_STRICT` policy documented).  
- [ ] Architect sign-off: “no synchronous app-to-app HTTP for async delegation” + “LLM entry points enumerated.”

---

## 7. Suggested default priorities (starting point — validate in Phase A)

| Priority | Typical candidates (validate with audit) | Rationale |
|----------|------------------------------------------|-------------|
| **P0** | Surfaces that **move secrets**, **call other miniapps’ APIs for async work**, or **block the event loop** on huge I/O | Risk / reliability. |
| **P1** | High-traffic **LLM** miniapps still on **`llm.mjs` only** (What next, Explain it, Lead enrichment, parts of Checklist bridge) | Single inference + observability story. |
| **P2** | **Mission Control**, **AI SDR analytics**, **Memory** polish, UI-only tools | Often read-mostly or already bounded. |
| **P2** | **Supabase connector** | Tied to env + network; align docs and error shape. |
| **Special** | **Checklist** | Split: **MeiMei Node engine** vs **Next.js** — audit *two* integration contracts. |
| **Special** | **Environment variables** | Already core SoT — audit = confirm no second writers + catalog completeness. |
| **Special** | **knowmore** | **Exclude** from queue alignment; audit = content + links + design-system only. |

---

## 8. Success criteria (definition of done for “v1 alignment program”)

1. **`docs/architecture/meimei-repo-boundaries.v1.md`** exists and is current; **core vs miniapp vs platform UI vs integration** locations are unambiguous for implementers.  
2. Every registry function has an **audit row** and **no undocumented Red** (either fixed or explicitly **Accepted risk** with architect note).  
3. **New** features default to **Green** on R1–R7 per **meimei-app-development-guide.v1.md** §12 **and** land only in the **declared owning path** for that registry `id` (no new logic stranded in `server.mjs`).  
4. Operators can answer “how does this talk to the rest of MeiMei?” from **`functions/<id>.md` + System monitor** without reading source.  
5. Smoke + CI policy documented in **`docs/releases/CHANGELOG.md`** or runbook.

---

## 9. References

- [`meimei-kernel-completion-plan.v1.md`](meimei-kernel-completion-plan.v1.md) — **From current repo state → clean kernel + modular surfaces** (phases K1–K4, exit criteria).  
- `docs/architecture/meimei-repo-boundaries.v1.md` — Phase 0 boundary map (landed; refine as extractions continue).  
- `docs/compliance/miniapp-platform-audit.v1.md` — Phase A scorecard (registry + knowmore + admin).  
- `docs/architecture/meimei-app-development-guide.v1.md`  
- `docs/architecture/adapter-contract.v1.md`  
- `docs/architecture/inter-app-message-bus.v1.md`  
- `docs/architecture/meimei-env-ui-contract.v1.md`  
- `docs/architecture/miniapp-contract-v1.md`  
- `docs/api/inference-route.v1.md`  
- `functions/registry.v1.json`  
- `npm run dashboard:smoke:miniapps` — `scripts/meimei-dashboard-miniapps-smoke.mjs`  
- `npm run boundary:check` — `scripts/meimei-repo-boundaries-check.mjs` **+** `scripts/meimei-apps-cross-import-check.mjs`

---

## Versioning

Bump **v1** when the **definition of core platform** (§1), **boundary model** (§3b), or **success criteria** (§8) changes materially.
