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
| **Kernel external registry** | `data/kernel/apps/registry.json` (gitignored); `kernel-app-registry.mjs` | `data/kernel/apps/README.md`; handbook §6–7; CHANGELOG | — | Opt-in `MEIMEI_KERNEL_EXTERNAL_APPS=1` |
| **Kernel external dispatch** | `kernel-external-app-dispatch.mjs`; `tryKernelExternalAppPost` | Handbook §6; planning kernel program docs | — | Order relative to static checklist branches — see audit §4 |
| **Manifest validation** | `meimei-app-manifest-validate.mjs`; `schemas/meimei.app.manifest.v1.json` | `kernel:validate-app-manifest`; example manifest in `docs/planning/examples/` | — | CI validates example + `apps/*/meimei.app.json` |

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

- [ ] Refresh **line-number anchors** in `meimei-kernel-code-audit.v1.md` / handbook §6 using automated grep or remove stale numbers.  
- [ ] **Miniapp-contract** / per-miniapp docs: confirm `serverApiPath` and `/dashboard` prefix wording matches `miniapp-registry.mjs`.  
- [ ] Optional script: diff `surface.api` keys vs `grep` handlers in `server.mjs`.

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-03-31 | v1 initial matrix + P0 fixes linked to design-system, runbook, handbook, platform README, CI Node 22, CHANGELOG |
