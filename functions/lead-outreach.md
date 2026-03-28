# Lead outreach — Miniapp contract

**Miniapp ID:** `lead-outreach`  
**GitHub:** [mvp-factory-control#653](https://github.com/moldovancsaba/mvp-factory-control/issues/653) — *Hyper-personalized cold email campaigns*

## Product

Operator-facing app to plan and draft **campaign-style outreach** built on enriched lead context. Pair with **Lead Enrichment** ([#649](./lead-enrichment.md)) for inputs.

## Addon (same product family)

| Issue | Role |
|-------|------|
| [#654](https://github.com/moldovancsaba/mvp-factory-control/issues/654) | **AI SDR and email engine** — **delivered** as actions on this API: Mail draft compose (macOS), JSONL event log (`data/sdr-outbound.jsonl`, gitignored), analytics summary, manual tracking notes. Full funnel charts: **[#651](./ai-sdr-analytics.md)** miniapp. |

## API

- `POST /dashboard/api/functions/lead-outreach`
- Actions:
  - `overview` (default) — scope and next steps
  - `draft_touch` — LLM draft for one touch (`campaignName`, `leadSummary`, `tone`)
  - `sdr_send` — log send attempt; open Apple Mail outgoing draft when Mail is available (`toEmail`, `subjectLine`, `body`, optional `campaignName`)
  - `sdr_analytics` — counts and recent events from the outbound log
  - `sdr_track` — append manual outcome (`note`, optional `trackType`, `relatedEventId`, `campaignName`)

## Registry

See `functions/registry.v1.json` → `lead-outreach`.
