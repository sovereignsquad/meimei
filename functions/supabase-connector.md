# Supabase connector — Miniapp contract

**Miniapp ID:** `supabase-connector`  
**GitHub:** [mvp-factory-control#631](https://github.com/moldovancsaba/mvp-factory-control/issues/631)

## Product

Tool surface for **PostgREST** connectivity: environment status, optional table ping, and row preview. Powers **Lead Enrichment** when `source` is `supabase`.

## Environment

| Variable | Role |
|----------|------|
| `MEIMEI_SUPABASE_URL` | Project URL (no trailing slash required) |
| `MEIMEI_SUPABASE_SERVICE_ROLE` | Preferred for server-side reads |
| `MEIMEI_SUPABASE_ANON_KEY` | Alternative if RLS allows required selects |

Documented in `vercel-env-inventory.md` (local-only).

## Lead Enrichment

`POST` lead-enrichment with `source: "supabase"` and `sourceData`:

- `{ "table": "leads", "id": "<uuid>", "idColumn": "id" }`  
- or `{ "table": "leads", "match": { "email": "a@b.com" } }`

First matching row is passed to the same LLM enrichment path as other sources.

## API

- `POST /dashboard/api/functions/supabase-connector`
- Actions: `overview`, `health` (optional `testTable`), `preview_fetch` (`table`, `id`, `idColumn`, optional `limit`)

## Registry

See `functions/registry.v1.json` → `supabase-connector`.
