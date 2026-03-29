# Delivery record — Phase 0 alignment (cumulative `0.8.1` → `0.8.4`)

**Date:** 2026-03-29  
**Package:** `agent-meimei` **0.8.6** (release train **0.8.1** → **0.8.6**; see **`CHANGELOG.md`**)  
**Scope:** Mandatory separation — core vs miniapps vs platform UI vs integrations: thin `server.mjs`, Checklist integration modules, `apps/*` POST owners, catalog GET HTML in `platform-pages/`, documented boundaries + CI guards, operator R8/R4 on every function contract, VERSION/lockfile aligned with `package.json`.

---

## 1. Goals satisfied (train summary)

| Goal | Evidence |
|------|----------|
| Thin `server.mjs` for Checklist | `checklist-api-shell.mjs`, `checklist-local-integration.mjs`, `checklist-bridge-http.mjs`; delegates only |
| Single Checklist POST branch | `npm run boundary:check` → `meimei-repo-boundaries-check.mjs` |
| No cross-app static imports | `meimei-apps-cross-import-check.mjs` (chained in `boundary:check`) |
| POST handlers in `apps/*` | `lead-outreach`, `ai-sdr-analytics`, `supabase-connector`, `lead-enrichment` (+ existing apps) |
| Platform GET HTML extracted | `catalog-pages.mjs` (Apps/Tools/knowmore); **`system-monitor-page.mjs`**; **`tool-surface-pages.mjs`** (routing, API adapter, SDR analytics, Supabase, env UI) — `README.md` in folder |
| Boundary policy documented | `meimei-repo-boundaries.v1.md` — allowlist, `server.mjs` rules, **§6** Phase 0 scope / waivers / sign-off |
| Version coherence | `package.json` / `package-lock.json` / `VERSION.md` / README “Current version” → **0.8.4**; checklist modules `@aligned package agent-meimei 0.8.4` |
| Operator transport + secrets (R8 / R4) | Every `functions/*.md` — loopback vs TLS prefix, env SoT link |
| Roadmap + audit | `meimei-platform-alignment-roadmap.v1.md`, `miniapp-platform-audit.v1.md` updated with Phase 0 / CI |

---

## 2. Files added (high level)

| Path | Role |
|------|------|
| `apps/lead-outreach/`, `apps/ai-sdr-analytics/`, `apps/supabase-connector/` | Registry POST handlers (delegated from server) |
| `dashboard/lib/checklist-api-shell.mjs` | Checklist POST shell actions |
| `dashboard/lib/checklist-local-integration.mjs` | Local Next proxy + fallback HTML |
| `dashboard/lib/checklist-bridge-http.mjs` | `/api/checklist/bridge` |
| `dashboard/lib/checklist-bridge.mjs`, `dashboard/lib/checklist-node/*` | Node engine + bridge wiring |
| `dashboard/lib/platform-pages/catalog-pages.mjs` | Apps / Tools / knowmore catalog pages |
| `dashboard/lib/platform-pages/system-monitor-page.mjs` | System monitor (queue explorer) GET shell |
| `dashboard/lib/platform-pages/tool-surface-pages.mjs` | Routing, API adapter, SDR analytics, Supabase, env variables GET shells |
| `dashboard/lib/platform-pages/reference-app-pages.mjs` | Reference app 1 & 2 GET shells |
| `dashboard/lib/platform-pages/README.md` | Folder contract |
| `dashboard/lib/meimei-monitor-feed.mjs` | System monitor feed (queue lineage) |
| `scripts/meimei-repo-boundaries-check.mjs` | Assert single `POST` + `checklistApiRoute` |
| `scripts/meimei-apps-cross-import-check.mjs` | Forbid `apps/*` → sibling `apps/*` `from` imports |
| `scripts/meimei-dashboard-miniapps-smoke.mjs` | Miniapp HTTP smoke |
| `scripts/checklist-queue-consumer.mjs`, `scripts/sync-checklist-theme.mjs` | MeiMei Checklist ops (renamed from agent-chappie) |
| `integrations/checklist-web/` | External Next.js checklist integration docs/assets |
| `docs/architecture/meimei-repo-boundaries.v1.md` | Boundary map + §6 |
| `docs/architecture/meimei-platform-alignment-roadmap.v1.md` | Phases 0–E |
| `docs/compliance/miniapp-platform-audit.v1.md` | R1–R8 scorecard |

**Removed (rename / consolidation):** `dashboard/lib/agent-chappie-*`, `integrations/agent-chappie-checklist/`, `scripts/agent-chappie-queue-consumer.mjs`, `scripts/sync-agent-chappie-checklist-theme.mjs` — superseded by MeiMei Checklist modules and `integrations/checklist-web/`.

---

## 3. Product / stack / rules (operator-facing)

- **MeiMei Control** (macOS): menu bar app; repository root discovery; LaunchAgents for dashboard + proxy — see `macos/MeiMei/README.md`.
- **Dashboard:** HTTP loopback (default `127.0.0.1:45285` from `config/dashboard-surface.v1.json`); HTTPS via `meimei-domain` / `MEIMEI_PUBLIC_PREFIX` (often `/dashboard`).
- **Coding standards:** `meimei-app-development-guide.v1.md` — queue, inference route, env SoT, bus for inter-app async work; **new:** `npm run boundary:check` + `meimei-repo-boundaries.v1.md` for layer ownership.
- **CI:** `npm run ci` includes `boundary:check` (both scripts) plus registry, policy, audit, telemetry, adapters, release gates.

---

## 4. Version alignment matrix

| Artifact | Version / stamp |
|----------|------------------|
| `package.json` / `package-lock.json` → `agent-meimei` | **0.8.6** |
| `VERSION.md` | **0.8.6**, codename **platform-reference-app-pages-0.8.6** |
| `functions/registry.v1.json` | `version: "v1"`; `generatedAt` per last registry edit |
| Checklist stack (`checklist-api-shell`, `checklist-local-integration`, `checklist-bridge-http`, `checklist-bridge`, `checklist-node/engine`) | `@version 1.0.0`, `@aligned package agent-meimei 0.8.6` |
| `platform-pages/*` (catalog, system-monitor, tool-surface, **reference-app-pages**) | `@aligned package agent-meimei 0.8.6` |
| `meimei-repo-boundaries.v1.md` | Document **v1** (bump per file §Versioning on breaking boundary changes) |

---

## 5. Tests executed

```bash
npm run boundary:check
npm run ci
node --check dashboard/server.mjs
node --check dashboard/lib/platform-pages/catalog-pages.mjs
node --check scripts/meimei-apps-cross-import-check.mjs
```

Optional: `npm run dashboard:smoke:miniapps` with dashboard listening.

---

## 6. Still open (roadmap)

- Further shrink `server.mjs` (per-miniapp GET/settings pages → `platform-pages/*` or app-owned modules).  
- Phase **B–E** items (P0 Reds, LLM migration, smoke in CI, formal sign-off line in boundaries §6 when ready).

---

## 7. References

- [`meimei-repo-boundaries.v1.md`](../architecture/meimei-repo-boundaries.v1.md)  
- [`meimei-platform-alignment-roadmap.v1.md`](../architecture/meimei-platform-alignment-roadmap.v1.md)  
- [`miniapp-platform-audit.v1.md`](../compliance/miniapp-platform-audit.v1.md)  
- [`CHANGELOG.md`](CHANGELOG.md)  
- [`functions/checklist.md`](../../functions/checklist.md)  
- [`integrations/checklist-web/README.md`](../../integrations/checklist-web/README.md)  
- [`meimei-app-development-guide.v1.md`](../architecture/meimei-app-development-guide.v1.md)
