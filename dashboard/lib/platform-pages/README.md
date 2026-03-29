# Platform pages (`dashboard/lib/platform-pages/`)

Large **GET** HTML builders for dashboard catalog surfaces. **`dashboard/server.mjs`** imports these modules and stays a thin router.

- **`catalog-pages.mjs`** — Apps, Tools, and knowmore listing pages (shared layout + registry-driven UI).
- **`system-monitor-page.mjs`** — Tools → System monitor (queue explorer) GET HTML.
- **`tool-surface-pages.mjs`** — AI routing preview, API channel adapter, AI SDR analytics, Supabase connector, Environment variables (large GET shells).
- **`reference-app-pages.mjs`** — Reference app 1 & 2 (queue + inter-app bus demo GET shells).
- **`ops-tool-pages.mjs`** — Inbox, Memory, Mission Control (main + settings GET shells).

Rules: **no** imports from `apps/*`; shared helpers come from `dashboard/lib/*`. See [`meimei-repo-boundaries.v1.md`](../../docs/architecture/meimei-repo-boundaries.v1.md) §3, §6.
