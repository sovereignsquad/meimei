# What next? — Miniapp contract

**Registry id:** `what-next`  
**Issue:** #724  
**Category:** apps  
**API:** `POST` path from `functions/registry.v1.json` (typically `/dashboard/api/functions/what-next`).  
**GET shell:** `dashboard/lib/platform-pages/reader-pages.mjs` (main + settings).

## Product contract

Prioritized recommendations from Brain context plus optional Mail snippets. Returns JSON with a `recommendations` array.

## Inference (kernel K3)

Blocking LLM calls use **`dashboard/lib/meimei-inference-client.mjs`** (same plane as **`POST /api/meimei/route`**). Do not add new direct **`llm.mjs`** `callOllama*` on this hot path.

## Related docs

- Daily briefing is a **separate** non-registry app — **`functions/daily-briefing.md`**.  
- Explain it (URL summary) — **`functions/any-url-summarization-in-seconds.md`** (legacy filename; registry id `explain-it`).
