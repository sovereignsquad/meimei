# MeiMei docs ↔ code sync audit (v1)

**Purpose:** Single place to track **truth** for operator-facing behaviour, **gaps** between code and prose, and **maintenance rules** after large UI/kernel changes.  
**Audience:** Maintainers and agents updating `dashboard/`, `docs/`, or `config/`.  
**Status:** Living document — update the matrix when you add routes, env vars, or persisted files.

---

## 1. Maintenance rule (PR discipline)

Any change that touches **HTTP routes**, **`config/dashboard-surface.v1.json`**, **new `process.env` reads**, or **gitignored runtime files** used by the dashboard must:

1. Update **this file’s matrix row** (or add a row) *or*  
2. Update the **canonical doc** linked in the matrix *and* add a **`CHANGELOG.md`** line for operator-visible behaviour.

Code comments should **point to docs** for specs; avoid duplicating long prose in JSDoc.

---

## 2. Capability matrix (P0 — platform shell & operator chrome)

| Capability | Code (source of truth) | Canonical doc | Comments / JSDoc | Notes |
|------------|------------------------|---------------|------------------|-------|
| **Surface config** | `config/dashboard-surface.v1.json`, `dashboard/lib/dashboard-surface.mjs` | Runbook §Local Dashboard; handbook §5 | `loadDashboardSurfaceSync` | Routes, `api.*`, `navIcons`, `staticPrefixes`, `designSystemCssPath` |
| **Public path prefix** | `stripDashboardMountPrefix`, `browserPathForNormalized` in `dashboard/server.mjs` | Runbook (this doc §3); [meimei-https-topology.v1.md](../architecture/meimei-https-topology.v1.md) | Env `MEIMEI_PUBLIC_PREFIX` (default `/dashboard`) | HTML `href`/`src` for `/images/`, `/styles/` must use prefixed URLs when prefix is set |
| **Design system CSS** | `public/styles/design-system.css` | [design-system-v1.md](../architecture/design-system-v1.md) | — | Base tokens + `data-theme` + nav chips |
| **Operator chrome (dynamic CSS)** | `GET /styles/operator-chrome.css` in `server.mjs`; `dashboard/lib/operator-chrome.mjs`; `dashboard/lib/chrome-theme-defaults.mjs` | This file §3; runbook; design-system-v1 | Module headers in `operator-chrome.mjs` | Served **before** static `/styles/*` so it overrides base tokens |
| **Operator chrome (persistence)** | `data/operator-chrome.v1.json` (gitignored); `mergeEffectiveChrome`, `persistMinimizedChrome` | Runbook; `.gitignore` | — | Only diffs from defaults stored |
| **Operator chrome (API)** | `GET`/`POST` `surface.api.operatorChrome` (default `/api/operator/chrome`) | Runbook; handbook §6 | — | `POST` body `{ nav, themes }` or `{ reset: true }` |
| **Operator chrome (admin UI)** | `home-admin-pages.mjs` → layout box `operatorChrome`; `page-layout.mjs` `pageBoxMeta` | design-system-v1 (layout); runbook | — | Admin → Operator chrome |
| **Global nav** | `platform-pages/chrome.mjs`; `dashboardChromeDeps()` + `getEffectiveChrome` | design-system-v1 §Navigation | — | Items: Apps, Tools, Dashboard, knowmore, Admin — **no** OpenClaw menu row |
| **Page layout API** | `GET`/`POST` `/api/page-layout` | design-system-v1 §Global layout system | — | Matches `surface.api.pageLayout` |
| **UI inline-style lint** | `scripts/lint-dashboard-inline-styles.mjs`; `npm run ui:lint-inline-styles` in `npm run ci` | `platform-pages/README.md` | — | Allowlisted `page-layout.mjs` `.layout-flow` inline vars only |
| **`surface.api` wiring** | `scripts/validate-dashboard-surface-api.mjs`; `npm run surface:validate-api` in `npm run ci` | This file §6 | — | Each `config/dashboard-surface.v1.json` `api` key must appear as `surface.api.<key>` in `server.mjs` |
| **Kernel external registry** | `data/kernel/apps/registry.json` (gitignored); `kernel-app-registry.mjs` | `data/kernel/apps/README.md`; handbook §6–7; CHANGELOG | — | **Default on**; `MEIMEI_KERNEL_EXTERNAL_APPS=0` / `false` / `off` / `""` disables |
| **Kernel external dispatch** | `kernel-external-app-dispatch.mjs`; `tryKernelExternalAppPost` | Handbook §6; planning kernel program docs | — | Order relative to static checklist branches — see audit §4 |
| **Manifest validation** | `meimei-app-manifest-validate.mjs`; `schemas/meimei.app.manifest.v1.json` | `kernel:validate-app-manifest`; example manifest in `docs/planning/examples/` | — | CI validates example + `apps/*/meimei.app.json` |
| **App-scoped façades** | `dashboard/server.mjs` branches + `kernel-app-*` | [meimei-app-facades-v1.md](../api/meimei-app-facades-v1.md) | — | `/api/meimei/v1/apps/{app_id}/inference`, `jobs/enqueue`, `env`, `fs` placeholder |
| **External app shells** | `kernel-catalog-merge.mjs`; proxy / catalog | [meimei-kernel-external-app-shells-v1.md](../architecture/meimei-kernel-external-app-shells-v1.md) | — | MM-KERNEL-502 UX note |
| **Kernel apps runbook** | `kernel:app-registry`, policy validators, SDK selftest | [kernel-apps.v1.md](../operations/kernel-apps.v1.md) | — | Operator steps + `MEIMEI_KERNEL_BASE_URL` |
| **Kernel apps threat model** | Registry, jobs, env store, auth | [meimei-kernel-threat-model-v1.md](../security/meimei-kernel-threat-model-v1.md) | — | MM-KERNEL-701 |

---

## 3. Operator chrome — behaviour summary (code-accurate)

1. **Defaults** match `public/styles/design-system.css` for `data-theme` keys: `meimei`, `dashboard`, `admin`, `apps`, `tools`, `knowmore`, and nav `--chip-accent` per destination. Source: `chrome-theme-defaults.mjs`.
2. **Merged effective** state = `mergeEffectiveChrome(surface, readOperatorChromeOverrides(repoRoot))`.
3. **Stylesheet** `GET /styles/operator-chrome.css` returns `buildOperatorChromeStylesheet(effective)` with `Cache-Control: no-store`.
4. **Nav icon URLs** in HTML use `browserPathForNormalized` on paths from surface + overrides (same as design system + static assets).
5. **Admin save** validates hex and allowed `/images/...` icon paths; **minimizes** to diff-only JSON on disk; **reset** deletes the file.

---

## 4. HTTP dispatch — fragment order (early chain)

Exact order drifts with edits; verify with `grep -n normalizedPath dashboard/server.mjs`. As of audit authoring:

1. `GET` health (`surface.api.health`)  
2. `GET` meimei monitor feed  
3. `POST` meimei inference route  
4. Checklist public path — proxy attempt  
5. **`GET`/`HEAD` `/styles/operator-chrome.css`** (dynamic)  
6. Static files under `surface.staticPrefixes` (`/images/`, `/styles/` …)  
7. … checklist bridge, HTML pages, APIs including **`/api/operator/chrome`**, page layout, config, etc.

---

## 5. Known historical doc drift (fixed in this pass)

| Issue | Was | Now |
|-------|-----|-----|
| design-system-v1 theme table | Legacy `green`/`blue`/`orange`/`red` + OpenClaw nav | Matches **`data-theme` values** in CSS (`meimei`, `apps`, `tools`, …); nav **without** OpenClaw row; legacy aliases noted |
| design-system-v1 `--brand-openclaw-*` | Listed as active | **Removed** from tokens list (variables removed from `:root` in CSS) |
| Miniapp styling rule | Only base stylesheet | **Two** link tags: `design-system.css` then **`operator-chrome.css`** |
| CI Node version | Workflow Node 20 vs `engines` ≥22.5 | **Aligned to Node 22** in `.github/workflows/ci.yml` |
| Handbook §6 | No operator chrome | **Added** bullets for dynamic CSS + operator chrome API |
| CHANGELOG | No single entry for operator chrome + design consolidation | **Added** dated entry |

---

## 6. P1 backlog (next passes)

- [x] Refresh **line-number anchors** in `meimei-kernel-code-audit.v1.md` / handbook §6 — **done** 2026-03-29 (audit §3.1/§5; handbook already grep-based).  
- [x] **Miniapp-contract:** **`serverApiPath`** + `/dashboard` wording — **done** in [miniapp-contract-v1.md](../architecture/miniapp-contract-v1.md) §Registry `api.path` vs Node routing.  
- [x] **`surface.api` wiring check** — **`npm run surface:validate-api`** (`scripts/validate-dashboard-surface-api.mjs`), runs in **`npm run ci`**.

**Still optional:** re-measure §11 JSDoc percentages; per-miniapp audit table rows vs registry paths.

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-03-29 | P1 closed: kernel audit anchors + dispatch §5; miniapp-contract `serverApiPath`; `surface:validate-api` + CI |
| 2026-03-31 | v1 initial matrix + P0 fixes linked to design-system, runbook, handbook, platform README, CI Node 22, CHANGELOG |
| 2026-03-29 | Full markdown inventory: [`full_comprehensive_detailed_documents_audit.md`](../../full_comprehensive_detailed_documents_audit.md) — use for completeness; this file remains **normative** for code↔doc matrix. |
| 2026-03-30 | Matrix rows: app façades, external app shells, kernel-apps runbook, threat model + `docs/README` / `developers/README` index. |
| 2026-03-30 | **Wave 4:** [`documentation-audit.md`](../compliance/documentation-audit.md) tier tables → canonical `docs/…` paths; [`doc_meimei.md`](../compliance/doc_meimei.md) path map; cross-links in runbook, ai-runtime-audit, app-dev guide, design-system, foundation-contradiction evidence. |
| 2026-03-29 | **Inventory 150:** [`packages/README.md`](../../packages/README.md) in corpus; [`full_comprehensive_detailed_documents_audit.md`](../../full_comprehensive_detailed_documents_audit.md) regen **`2026-03-29T22:00:00Z`**; `README`, `docs/README`, [`documentation-audit.md`](../compliance/documentation-audit.md), [`VERSION.md`](../../VERSION.md) scope counts. |
