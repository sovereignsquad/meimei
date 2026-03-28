# Environment variables — Miniapp contract

**Miniapp ID:** `environment-variables`  
**Route:** `/dashboard/726/Environment_variables` (issue id **726** — workspace delivery; board issue optional)

## Product

Vercel-style **name / value / environment** CRUD for everything MeiMei tools and apps read from `process.env`: API keys, PATs, tokens, URLs, OpenClaw paths, Supabase, `PORT`, etc.

## Storage

| Path | Notes |
|------|--------|
| `data/meimei-environment.v1.json` | Gitignored, `chmod` 600 when possible |

## Runtime behavior

- On dashboard startup, the store is loaded and matching entries are applied to **`process.env`**.
- **`MEIMEI_ENV_PROFILE`** (`production` \| `preview` \| `development`, default **`development`**) decides which rows apply. Rows with **no** environment selected apply to **all** three (same as all checked).
- Shell / launchd env still loads first; the store **overwrites** the same keys when a row applies.

## Suggested keys (not required)

`config/meimei-env-catalog.v1.json` — grouped hints (Vercel mirror list, local-only, MeiMei connectors). Operators may add **any** valid `NAME`.

## API

`POST /dashboard/api/functions/environment-variables`

| Action | Purpose |
|--------|---------|
| `list` | Rows with masked values + targets + `appliesNow` |
| `catalog` | Suggested key groups |
| `upsert` | Create/update (`key`, optional `id`, `value`, `targets[]`) |
| `reveal` | Plaintext value for one `id` (dashboard-only; do not expose publicly) |
| `delete` | Remove by `id` |
| `export_dotenv` | Optional `target` filter; returns `.env`-style text |

## Registry

`functions/registry.v1.json` → `environment-variables`.
