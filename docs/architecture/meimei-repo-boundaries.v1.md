# MeiMei repository boundaries — v1

**Status:** draft — Phase 0 working document. Update as migrations land.  
**Companion:** [`meimei-platform-alignment-roadmap.v1.md`](meimei-platform-alignment-roadmap.v1.md) §3b, Phase 0.

---

## 1. Layers (mandatory mental model)

| Layer | Owns | May import from |
|-------|------|-----------------|
| **Core platform** | Process lifecycle, HTTP entry, registry resolution, env apply, job spooler/worker, inference route, shared telemetry hooks, design-system static hosting | Node stdlib, npm deps; **no** imports from `apps/*` |
| **Miniapp / tool** | One `functions/registry.v1.json` row | Core modules; **not** other `apps/*` (use inter-app bus contract when needed) |
| **Platform UI** | Home, `/admin`, `/knowmore`, system monitor page shell | Core + layout config |
| **Integration** | External repo/service glue | Core + integration README contract |

---

## 2. Registry id → owning module (inventory — update when moving)

| Registry `id` | Primary code location today | Target owner (Phase 0+) |
|---------------|----------------------------|-------------------------|
| reference-app-1 | `dashboard/lib/reference-app-queue-api.mjs` | Keep in lib **or** `apps/reference-app-1/` — pick one; document here |
| reference-app-2 | `dashboard/lib/reference-app-2-queue-api.mjs`, `meimei-reference-app-inbox.mjs` | Same |
| environment-variables | `dashboard/lib/meimei-env-store.mjs` | **Core** (SoT) |
| checklist | `checklist-api-shell.mjs` (POST shell); `checklist-local-integration.mjs` (Next proxy + page); **`checklist-bridge-http.mjs`** (`/api/checklist/bridge`); `server.mjs` wiring only; `apps/checklist/index.mjs` (legacy JSON) | **Done**; `integrations/checklist-web/` |
| lead-enrichment | `apps/lead-enrichment/index.mjs` (enrich + `workflow_*`) | **Done** — CRM/Supabase sources + disk workflow in one module |
| lead-outreach | `apps/lead-outreach/index.mjs` | **Done** — `server.mjs` delegates POST only |
| ai-sdr-analytics | `apps/ai-sdr-analytics/index.mjs` | **Done** — uses `dashboard/lib/gtm-analytics.mjs` |
| supabase-connector | `apps/supabase-connector/index.mjs` | **Done** — uses `dashboard/lib/supabase-connector.mjs` |
| inbox, memory, mission-control, what-next, explain-it, ai-routing | `apps/<id>/index.mjs` (+ `server.mjs` for some GET/legacy) | `apps/<id>/` |
| api-access | `routeViaApiAdapter` in `dashboard/lib/api-channel-adapter.mjs`, wired from `server.mjs` | Core adapter + thin app shell |

---

## 3. Core `dashboard/lib/*` allowlist (v1 proposal)

These are **shared platform** unless and until a future version moves a file to an app (then remove from allowlist here).

- **Surface & config:** `dashboard-surface.mjs`, `miniapp-registry.mjs`, `page-layout.mjs`, `runtime.mjs`
- **Env:** `meimei-env-store.mjs`
- **Jobs & inference:** `meimei-job-queue.mjs`, `meimei-job-worker.mjs`, `meimei-monitor-feed.mjs`, `inference-route.mjs`
- **HTTP / policy primitives:** `api-channel-adapter.mjs`, `external-channel-policy-engine.mjs`, `imessage-adapter.mjs`, `reliability-telemetry.mjs`, `audit-trail.mjs`
- **Legacy inference (until retired):** `llm.mjs`
- **Checklist (integration surface):** `checklist-api-shell.mjs`, `checklist-local-integration.mjs`, **`checklist-bridge-http.mjs`** (HTTP adapter), `checklist-bridge.mjs`, `checklist-node/*` — **integration-adjacent**
- **Platform GET catalog HTML:** `platform-pages/catalog-pages.mjs` (Apps / Tools / knowmore shells); **`platform-pages/system-monitor-page.mjs`** (queue explorer); **`platform-pages/tool-surface-pages.mjs`** (AI routing preview, API channel adapter shell, AI SDR analytics, Supabase connector, environment variables); **`platform-pages/reference-app-pages.mjs`** (Reference app 1 & 2 demo UIs); **`platform-pages/ops-tool-pages.mjs`** (Inbox, Memory, Mission Control — main + settings shells). Future siblings stay under `platform-pages/`; **must not** import from `apps/*`.

**Not on allowlist as “pure core” (candidates to re-home under apps or explicit integration packages):** `lead-enrichment-workflow.mjs`, `gtm-analytics.mjs`, `sdr-analytics.mjs`, `supabase-connector.mjs`, `home-suggestions.mjs`, `command-interface.mjs`, `mail-adapter.mjs`, `telemetry.mjs`, `brain/*`, `admin-layout-editor.mjs` (platform UI — may stay lib with label **platform UI**), `reference-app-queue-api.mjs`, `reference-app-2-queue-api.mjs`, `meimei-reference-app-inbox.mjs`.

*Architect adjusts this list as Phase 0 completes — the roadmap success criterion is an **unambiguous** doc, not frozen filenames on day one.*

---

## 4. `dashboard/server.mjs` rules

1. **Register** routes, **read** body, **call** one exported `handleApi` or `processX` from `apps/*` or `dashboard/lib/*`.  
2. **Do not** add new multi-hundred-line product logic inline.  
3. **One** `POST` handler per normalized API path (no duplicate branches).  
4. **CI guard:** `npm run boundary:check` — asserts a single `POST` branch for `checklistApiRoute` (extend script as more invariants are added).

---

## 5. `integrations/*`

Each subdirectory documents an **external** boundary (e.g. Next.js Checklist). Core repo does not duplicate that product; it hosts bridge config and operator docs.

---

## 6. Phase 0 scope, waivers, and sign-off

**In scope for Phase 0 (this doc + CI):**

- Registry → owner table and core allowlist are **explicit**; ambiguous “misc lib” files are labeled candidates, not silently core.
- `dashboard/server.mjs` stays a **thin router**: register routes, read body, delegate to one `apps/*` or `dashboard/lib/*` entrypoint — no new large product blocks (see §4).
- **Automated guards:** `npm run boundary:check` runs (1) single `POST` branch for `checklistApiRoute` in `server.mjs`, (2) **no cross-app imports** (`apps/foo` must not `from` another `apps/bar` path). Extend the scripts as new invariants are agreed.

**Deferred (documented, not waived silently):**

- Moving every remaining GET/legacy handler out of `server.mjs` into `platform-pages/*` or apps — **incremental**; catalog, system monitor, and **tool surface** pages (routing, API adapter, SDR analytics, Supabase, env UI) are extracted (**`tool-surface-pages.mjs`** as of 2026-03-30).
- Re-homing “not on allowlist” lib modules into `apps/*` or named integration packages — **per-roadmap** after architect sign-off.

**Waivers:** Any exception to §1–§4 or the allowlist must be a **dated one-line** in this section (none by default). Example: `YYYY-MM-DD — waiver: <file> may import X because <reason>; remove by <target>.`

**Sign-off:** Platform owner acknowledges the current allowlist and registry table; architect updates §3–§4 when filenames move. CI red on boundary drift is the default posture.

### 6.1 Sign-off log (append-only)

| Date | Milestone | Notes |
|------|-----------|--------|
| 2026-03-30 | Phase 0 structural delivery | Boundaries doc + CI + `apps/*` POST owners + `platform-pages/*` extractions (catalog, system monitor, tool surfaces); continuing Phase B in-repo. Replace this row with named PO/architect acknowledgment when formal sign-off is recorded. |

---

## Versioning

Bump **v1** when the **allowlist** or **registry → owner** table changes in a breaking way for implementers.
