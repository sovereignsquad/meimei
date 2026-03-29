# Daily Briefing — operator contract (non-registry route)

**Route:** `POST /dashboard/api/functions/daily-briefing` (wired in `dashboard/server.mjs`; not a row in `functions/registry.v1.json`).  
**Handler:** `packages/daily-briefing/index.mjs`  
**Inference:** Blocking LLM via **`dashboard/lib/meimei-inference-client.mjs`** (kernel K3 — same plane as `POST /api/meimei/route`).

## Behavior

- Builds Brain context + optional Mail snippets, returns JSON briefing (`headline`, `sections`, `priorities`, `insights`).
- `sink`: `apple-notes` (default) or `markdown` for formatted output in the response.

## R7 note

Canonical registry-style naming is this file (`daily-briefing.md`). If the route is promoted into `registry.v1.json`, keep this doc as the contract source.
