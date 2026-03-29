# Lead Enrichment — Miniapp Contract

Status: Draft  
Miniapp ID: `lead-enrichment`  
Issue: `mvp-factory-control#649`  
Extends: API access (connectors)

## Product Contract

**What it does:** Enriches raw contacts or company data into usable sales context for campaign generation and prioritization.

**Why it matters:** Campaigns are personalized from evidence instead of generic guessing.

## Input

```json
{
  "required": ["source", "sourceData"],
  "optional": ["enrichmentLevel", "priority", "async"],
  "examples": [
    { "source": "linkedin", "sourceData": { "profileUrl": "https://linkedin.com/in/example" } },
    { "source": "email", "sourceData": { "email": "john@example.com" }, "enrichmentLevel": "full" },
    { "source": "company", "sourceData": { "domain": "example.com" }, "priority": "high" }
  ]
}
```

### Source Types

| Source | Data Required | Use Case |
|--------|---------------|----------|
| `linkedin` | `profileUrl` | Profile enrichment |
| `email` | `email` | Contact enrichment |
| `company` | `domain` or `name` | Company enrichment |
| `phone` | `phone` | Phone-based enrichment |
| `crunchbase` | `companyName` | Funding/risk data |
| `supabase` | `table` + (`id` / `idColumn` or `match`) | Row from Supabase via PostgREST ([#631](./supabase-connector.md)) |

### Enrichment Levels

| Level | Depth | Speed |
|-------|-------|-------|
| `basic` | Name, title, company | Fast |
| `standard` | + Social profiles, location | Medium |
| `full` | + Funding, employees, tech stack | Slow |

## Output

```json
{
  "ok": true,
  "lead": {
    "id": "enriched_abc123",
    "source": "linkedin",
    "sourceData": { "profileUrl": "..." },
    "profile": {
      "name": "Jane Doe",
      "title": "VP Engineering",
      "company": "Acme Corp",
      "companySize": "51-200",
      "industry": "Technology",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/janedoe",
      "twitter": "@janedoe"
    },
    "signals": [
      { "type": "recent_hire", "confidence": 0.87, "detail": "Joined 3 months ago" },
      { "type": "funding", "confidence": 0.92, "detail": "Series B raised $50M" }
    ],
    "priority": "high",
    "enrichedAt": "2026-03-27T23:00:00Z"
  },
  "audit": {
    "enrichmentSources": ["linkedin", "company_db"],
    "confidence": 0.89,
    "expiresAt": "2026-03-28T23:00:00Z"
  }
}
```

## Safety & Constraints

- `untrustedInput`: true (external data sources)
- `allowedProtocols`: ["https"]
- Rate limiting per source provider
- Data retention: 30 days default, configurable

## Capabilities

- `channels`: ["dashboard", "api"]
- `sideEffects`: ["network-fetch", "local-file-write", "audit-append"]
- `requiresApproval`: false

## Failure Model

| Failure | Behavior |
|---------|----------|
| Rate limited | Return 429 with retry-after |
| Source unavailable | Partial results from available sources |
| Invalid input | Clear error with field validation |
| No data found | Return empty profile with `confidence: 0` |

## Settings

- API keys per enrichment provider
- Default enrichment level
- Data retention period
- Enrichment source priority order

## Supabase connector (#631) — delivered in app

**Implementation:** `source: "supabase"` with `sourceData` `{ table, id?, idColumn?, match?, limit? }`. Server uses `dashboard/lib/supabase-connector.mjs` (fetch to PostgREST; no npm `@supabase` dependency). Env: `MEIMEI_SUPABASE_URL` + `MEIMEI_SUPABASE_SERVICE_ROLE` or `MEIMEI_SUPABASE_ANON_KEY`. Operator UI: **Tools → Supabase connector** plus **Supabase row (#631)** on the enrichment form.

## Connector Contract (#632) — delivered in app

**Implementation:** `source: "crm"` with `sourceData` carrying `crmProvider`, `externalId` / `recordId`, `email`, `notes`, and optional `customFields` (object). The dashboard **Lead Enrichment** UI exposes **“CRM / connector record (#632)”** and a JSON field; `enrichLead()` in `dashboard/server.mjs` seeds the LLM from these fields and tags audit with `crm-connector#632`.

Connector requirements (still apply for future real APIs):
- Auth: API key per provider (settings / env when wired)
- Health: Ping endpoint per source
- Error: Structured error with source attribution

**Downstream:** [Lead outreach (#653)](./lead-outreach.md) consumes enriched profiles for drafts; **#654** (addon) delivers send/log/Mail draft, analytics, and tracking on that API. **[#651](./ai-sdr-analytics.md)** provides the combined SDR + workflow analytics dashboard.

## Workflow (#650) — delivered in app

**Goal:** End-to-end operator flow: queue → enrich → hand off to Lead outreach without re-pasting context.

**Storage:** `data/lead-enrichment-workflow.v1.json` (array of items; **gitignored**; local-only, may contain PII).

**API:** Same `POST` path as enrichment. When `action` starts with `workflow_`, the handler does not require the single-shot `source`/`sourceData` body shape.

| Action | Purpose |
|--------|---------|
| `workflow_overview` | Scope, stages, links (#650, outreach route) |
| `workflow_list` | All queue items (includes `result` when enriched) |
| `workflow_enqueue` | Add row (`source`, `sourceData`, optional `enrichmentLevel`, `priority`, `label`) |
| `workflow_run` | Run `enrichLead` for `workflowId`; sets `enriched` or `failed` |
| `workflow_skip` | Mark `skipped` |
| `workflow_remove` | Delete row |

**Dashboard:** Lead Enrichment page — workflow table, enqueue from current form, **Outreach** sets `sessionStorage` prefill for Lead outreach (`leadSummary`, `campaignName`).

---

## Related GitHub issues (Lead Enrichment addons / pipeline)

**Product repo:** code lives in `agent.meimei`. **Issues** live in [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control) (titles prefixed `agent.meimei #…`). Below: open issues that extend **#649** (miniapp), **#632** (connector contract), or the GTM path around enriched leads (SDR, campaigns, ops). Sorted by issue number.

| Issue | Title (short) | Why it matters for Lead Enrichment |
|------|-----------------|-------------------------------------|
| [#608](https://github.com/moldovancsaba/mvp-factory-control/issues/608) | GitHub auth and repo access | Context on dev-heavy leads; repo signals for scoring |
| [#609](https://github.com/moldovancsaba/mvp-factory-control/issues/609) | GitHub connector | Pull repo/activity data into enrichment or CRM |
| [#625](https://github.com/moldovancsaba/mvp-factory-control/issues/625) | Webhooks connector | Ingest lead events from external systems |
| [#626](https://github.com/moldovancsaba/mvp-factory-control/issues/626) | Webhook form pipeline | Capture inbound leads → enrichment queue |
| [#627](https://github.com/moldovancsaba/mvp-factory-control/issues/627) | Webhook connector layer | Same as above, workflow automation framing |
| [#628](https://github.com/moldovancsaba/mvp-factory-control/issues/628) | Email connector | Outbound sequences using enriched profiles |
| [#629](https://github.com/moldovancsaba/mvp-factory-control/issues/629) | Calendar connector | Meeting context after enrich + outreach |
| [#630](https://github.com/moldovancsaba/mvp-factory-control/issues/630) | Transcript provider connector | Call/meeting intel layered on leads |
| [#631](https://github.com/moldovancsaba/mvp-factory-control/issues/631) | Supabase connector | **Delivered:** tool + `source: supabase` in enrichment |
| [#632](https://github.com/moldovancsaba/mvp-factory-control/issues/632) | CRM-style lead enrichment connector | **Direct dependency** (see section above) |
| [#633](https://github.com/moldovancsaba/mvp-factory-control/issues/633) | Integration hub | Central wiring for enrichment + CRM + channels |
| [#634](https://github.com/moldovancsaba/mvp-factory-control/issues/634) | Task management layer | Queue follow-ups from enriched leads |
| [#639](https://github.com/moldovancsaba/mvp-factory-control/issues/639) | Mission control dashboard | Operator visibility on enrichment + outreach jobs |
| [#649](https://github.com/moldovancsaba/mvp-factory-control/issues/649) | **Lead enrichment miniapp** | **Core app** (this contract) |
| [#650](https://github.com/moldovancsaba/mvp-factory-control/issues/650) | Lead enrichment workflow | **Delivered:** queue + `workflow_*` API + UI + outreach prefill |
| [#651](https://github.com/moldovancsaba/mvp-factory-control/issues/651) | AI SDR analytics dashboard | **Delivered:** miniapp reads SDR JSONL + workflow JSON |
| [#652](https://github.com/moldovancsaba/mvp-factory-control/issues/652) | Campaign templates and auto replies | Uses enriched fields in messaging |
| [#653](https://github.com/moldovancsaba/mvp-factory-control/issues/653) | Hyper-personalized cold email campaigns | Primary consumer of enrichment output |
| [#654](https://github.com/moldovancsaba/mvp-factory-control/issues/654) | AI SDR and email engine | Outreach + tracking after enrich |
| [#655](https://github.com/moldovancsaba/mvp-factory-control/issues/655) | Outreach employee | GTM “lane” consuming lead context |
| [#656](https://github.com/moldovancsaba/mvp-factory-control/issues/656) | Discovery employee | Upstream of enrich (who to target) |
| [#657](https://github.com/moldovancsaba/mvp-factory-control/issues/657) | Proposal employee | Downstream of enrich (tailored offers) |
| [#658](https://github.com/moldovancsaba/mvp-factory-control/issues/658) | Onboarding employee | Handoff using enriched customer context |
| [#662](https://github.com/moldovancsaba/mvp-factory-control/issues/662) | Business operations loop | Full outreach→delivery loop including leads |
| [#664](https://github.com/moldovancsaba/mvp-factory-control/issues/664) | Competitor monitoring | Market context for pitch and ICP |
| [#666](https://github.com/moldovancsaba/mvp-factory-control/issues/666) | Competitor watch employee | Ongoing intel feeding messaging |
| [#668](https://github.com/moldovancsaba/mvp-factory-control/issues/668) | API connector (agent dispatch) | Call external enrichment or CRM APIs |
| [#673](https://github.com/moldovancsaba/mvp-factory-control/issues/673) | Lead enrichment as a service | Productization of enrichment |
| [#681](https://github.com/moldovancsaba/mvp-factory-control/issues/681) | AI lead generation pipeline | Scrape/discover → enrich → close |
| [#682](https://github.com/moldovancsaba/mvp-factory-control/issues/682) | Hyper-personalized campaign dashboard | Operator UI for campaigns using enrich |
| [#683](https://github.com/moldovancsaba/mvp-factory-control/issues/683) | Task management board | Work assignment tied to lead pipeline |

*Gathered via GitHub search on `mvp-factory-control` for agent.meimei issues touching leads, enrichment, SDR, campaigns, connectors, and adjacent employees. Re-run search periodically; board [Project 1](https://github.com/users/moldovancsaba/projects/1) remains source of truth for status.*

## Platform alignment — queue (R1) — **documented exception**

**Workflow `workflow_run`:** Executes `enrichLead` on the **HTTP handler thread** (see `dashboard/lib/lead-enrichment-workflow.mjs` + `apps/lead-enrichment/index.mjs`). This is **not** modeled as `meimei_jobs` today.

- **Why:** Preserves synchronous operator UX (run one queued item and get an immediate JSON result) without a second polling protocol.
- **Sunset target:** Revisit by **2027-06-30** — either enqueue enrichment as `inference_v1` / dedicated job kind with async poll, or reaffirm this exception in the audit.

**Single-shot `source` + `sourceData`:** Same thread; LLM call uses **`meimei-inference-client`** (kernel K3).

## Operator transport & secrets (R8 / R4)

| Topic | Guidance |
|-------|----------|
| **Local vs TLS** | Operators typically use **HTTP loopback** to the dashboard (listen and bind from `config/dashboard-surface.v1.json`). With an HTTPS reverse proxy (`scripts/meimei-domain.mjs`, LaunchAgents), browser URLs gain **`MEIMEI_PUBLIC_PREFIX`** (often `/dashboard`). Registry **`api.path`** values are logical — prepend the public prefix when calling through TLS. |
| **Secrets** | Use the MeiMei env store and [`meimei-env-ui-contract.v1.md`](../architecture/meimei-env-ui-contract.v1.md); one source of truth; no secrets embedded in static HTML or client bundles. |
