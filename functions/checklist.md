# Checklist

**Issue:** #727
**Category:** Apps
**Route:** `/727/Checklist` (registry: `/dashboard/727/Checklist`)
**API:** `POST /dashboard/api/functions/checklist`

## Description

Competitor monitoring and decision-support tool. Migrated from standalone Original Checklist app.

## POST dispatch (MeiMei dashboard)

`dashboard/server.mjs` exposes **one** `POST` route for this API. Requests are routed as follows:

1. **Checklist shell** — `action` omitted, empty, or one of `overview`, `worker_health`, `ensure_worker` → **`dashboard/lib/checklist-api-shell.mjs`** (`processChecklistShell` / `handleChecklistPostShell`). Matches `functions/registry.v1.json` examples.
2. **Legacy JSON miniapp** — any other `action` → `apps/checklist/index.mjs` (competitors, pipeline, checklist CRUD, annotations).

## MeiMei Checklist bridge & Node engine

Hosted **consultant-followup-web** talks to the Mac via the dashboard HTTP bridge (not the `POST /api/functions/checklist` route above).

| Item | Detail |
|------|--------|
| Bridge path | `/api/checklist/bridge` (after `MEIMEI_PUBLIC_PREFIX` strip internally — same pattern as other dashboard APIs; browser/proxy URL is often `/dashboard/api/checklist/bridge`) |
| Registry shell | `dashboard/lib/checklist-api-shell.mjs` |
| Local Next proxy + fallback page | `dashboard/lib/checklist-local-integration.mjs` (`tryProxyChecklistRequest`, `renderChecklistLocalShellPage`) |
| HTTP bridge handler | `dashboard/lib/checklist-bridge-http.mjs` (`serveChecklistBridgeHttp`) |
| Bridge + Node engine | `dashboard/lib/checklist-bridge.mjs`, `dashboard/lib/checklist-node/*` (`MEIMEI_CHECKLIST_ENGINE=node`) |
| Auth | `MEIMEI_CHECKLIST_SHARED_SECRET` on MeiMei; requests must send `x-meimei-checklist-secret` with the same value (`GET /health` exempt when secret is set) |
| Python worker | `MEIMEI_CHECKLIST_ENGINE=python` + `MEIMEI_CHECKLIST_ROOT` → localhost `worker_bridge.py`; MeiMei still maps secrets into the worker’s expected env |
| Local SQLite (node) | Default `data/checklist/agent_brain.sqlite3` (override with `MEIMEI_CHECKLIST_DB_PATH`) |
| Neon queue consumer | `npm run checklist:queue-consumer` — see `integrations/checklist-web/README.md` |

### LLM (kernel K3)

Legacy miniapp JSON paths (`apps/checklist/index.mjs` — insights, recommendations) and **`checklist-node/jobs.mjs`** / **`regenerate.mjs`** use **`dashboard/lib/meimei-inference-client.mjs`** (same inference plane as `POST /api/meimei/route`). **R1** (heavy work on `meimei_jobs`) and **R6** (trace through queue) remain improvement areas for the Checklist product, not the raw Ollama client.

## R3 / R4 — integration HTTP vs inter-app bus (Phase B)

- **Not R3 violation:** HTTP from the hosted Checklist UI to MeiMei’s **`/api/checklist/bridge`** (or local Next proxy) is an **documented integration edge**, not synchronous **miniapp-to-miniapp** delegation on the `meimei_jobs` bus. Async work inside MeiMei still uses **`checklist-node/*`** and the env SoT.
- **R4:** Shared bridge auth uses **`MEIMEI_CHECKLIST_SHARED_SECRET`** (env store / process env) and **`x-meimei-checklist-secret`** on requests — no second secret SoT in static HTML; values are not rendered into page source.

## Actions (legacy JSON miniapp)

| Action | Description |
|--------|-------------|
| `list` | Get overview + active checklist items |
| `competitors.list` | Get tracked competitors |
| `competitors.update` | Update competitor list |
| `pipeline.run` | Run weekly snapshot pipeline |
| `pipeline.snapshots` | Get recent snapshots |
| `pipeline.insights` | Get recent insights |
| `checklist.get` | Get active + archived items |
| `checklist.generate` | Generate new recommendations |
| `checklist.update` | Update item status (done/edit/decline/clarify) |
| `annotations.list` | Get feedback annotations |

## Data Storage

Local JSON files in `apps/checklist/data/`:
- `competitors.json` — Tracked competitors
- `snapshots.json` — Captured snapshots
- `insights.json` — Generated insights
- `checklist.json` — Active + archived items
- `annotations.json` — User feedback

## Test

```bash
# List competitors
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"competitors.list"}'

# Add competitor
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"competitors.update","competitors":[{"name":"Acme","url":"https://acme.com"}]}'

# Run pipeline
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"pipeline.run"}'

# Generate recommendations
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"checklist.generate","businessName":"My Startup"}'
```

## Dependencies

- `dashboard/lib/llm.mjs` (callOllamaJson, parseJsonResponse)
- `dashboard/lib/brain/index.mjs` (brain.log, brain.buildContext)
- `checklist-api-shell.mjs` + `checklist-local-integration.mjs` + `checklist-bridge-http.mjs` + `checklist-bridge.mjs` + `checklist-node/*`
- Ollama at localhost:11434

## Status

✅ Production — LLM-powered recommendations

## Operator transport & secrets (R8 / R4)

For Checklist-specific paths, headers (`x-meimei-checklist-secret`), and proxy URLs, see **MeiMei Checklist bridge & Node engine** above. General rules:

| Topic | Guidance |
|-------|----------|
| **Local vs TLS** | Operators typically use **HTTP loopback** to the dashboard (listen and bind from `config/dashboard-surface.v1.json`). With an HTTPS reverse proxy (`scripts/meimei-domain.mjs`, LaunchAgents), browser URLs gain **`MEIMEI_PUBLIC_PREFIX`** (often `/dashboard`). Registry **`api.path`** values are logical — prepend the public prefix when calling through TLS. |
| **Secrets** | Use the MeiMei env store and [`meimei-env-ui-contract.v1.md`](../architecture/meimei-env-ui-contract.v1.md); one source of truth; no secrets embedded in static HTML or client bundles. |
