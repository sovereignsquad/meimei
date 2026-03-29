# Platform pages (`dashboard/lib/platform-pages/`)

Large **GET** HTML builders for dashboard catalog surfaces. **`dashboard/server.mjs`** imports these modules and stays a thin router.

- **`chrome.mjs`** — Shared chrome: global nav, flashcard tile, list helper, nav toggle script (**K2**; wired via **`dashboardChromeDeps()`** in `server.mjs`).
- **`catalog-pages.mjs`** — Apps, Tools, and knowmore listing pages (shared layout + registry-driven UI).
- **`system-monitor-page.mjs`** — Tools → System monitor (queue explorer) GET HTML.
- **`tool-surface-pages.mjs`** — AI routing preview, API channel adapter, AI SDR analytics, Supabase connector, Environment variables (large GET shells).
- **`reference-app-pages.mjs`** — Reference app 1 & 2 (queue + inter-app bus demo GET shells).
- **`ops-tool-pages.mjs`** — Inbox, Memory, Mission Control (main + settings GET shells).
- **`gtm-pages.mjs`** — Lead enrichment, Lead outreach (main + settings GET shells).
- **`reader-pages.mjs`** — What next (main + settings), Explain it (URL summary + settings), Daily briefing.
- **`routing-settings-pages.mjs`** — AI routing & API access **settings** only (main UIs live in `tool-surface-pages.mjs`).
- **`home-admin-pages.mjs`** — Home (`/`) shell, admin/settings page, **Operator chrome** editor (layout box `operatorChrome`), layout editor section (injects `renderGlobalNav` / `renderGlobalNavScript` from server — re-exported from **`chrome.mjs`**).

Rules: **no** imports from `apps/*`; shared helpers come from `dashboard/lib/*`. See [`meimei-repo-boundaries.v1.md`](../../docs/architecture/meimei-repo-boundaries.v1.md) §3, §6.

**Styling:** Do not add `style="..."` attributes or `<style>` blocks in these modules. Use shared primitives and tokens in [`public/styles/design-system.css`](../../public/styles/design-system.css) (`ds-*` classes, `[hidden]`, theme variables). Shells also link **dynamic** `/styles/operator-chrome.css` after the base stylesheet (`shellStyleDeps()` in [`dashboard/server.mjs`](../../dashboard/server.mjs)) for operator overrides from `data/operator-chrome.v1.json` — see [`meimei-docs-code-sync-audit.v1.md`](../../docs/planning/meimei-docs-code-sync-audit.v1.md). `npm run ui:lint-inline-styles` enforces this for this folder, [`checklist-local-integration.mjs`](../checklist-local-integration.mjs), [`page-layout.mjs`](../page-layout.mjs) (only the allowed `buildLayoutFlowHtml` `--layout-cols-*` inline on `.layout-flow`), [`server.mjs`](../../dashboard/server.mjs), and the standalone [`checklist`](../../../apps/checklist/index.mjs) / [`explain-it`](../../../apps/explain-it/index.mjs) app shells.
