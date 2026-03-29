# Workspace packages (`@meimei/*`)

| Package | Role |
|---------|------|
| **`meimei-sdk`** | HTTP client for kernel app-scoped façades (`/api/meimei/v1/apps/{app_id}/…`). |
| **`meimei-pilot-external-app`** | Minimal process using the SDK only (env-driven smoke against a running dashboard). |
| **`daily-briefing`** | Pilot miniapp (`meimei.app.json` + `index.mjs`); loaded as a kernel builtin from `packages/` (MM-KERNEL-602). |

**MM-KERNEL-602:** Register any external install path with `npm run kernel:app-registry -- register <dir>`. In-repo pilots can live under `packages/<name>/` like **`daily-briefing`**. See [`kernel-apps.v1.md`](../docs/operations/kernel-apps.v1.md) (section *Migrate a miniapp toward `packages/*`*).
