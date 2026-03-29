# Version

## Current

- Line: `foundation`
- Version: `0.8.10`
- Date: `2026-03-30`
- Codename: `kernel-k1d-routing-settings-pages-0.8.10`

## Included issue deliveries

- **2026-03-30 — Kernel plan K1d (`0.8.10`):** **`dashboard/lib/platform-pages/routing-settings-pages.mjs`** — AI routing + API access **settings** GET HTML out of `server.mjs` (`routingSettingsPageDeps()`). See **`meimei-kernel-completion-plan.v1.md`** Phase K1.
- **2026-03-30 — Kernel plan K1c (`0.8.9`):** **`dashboard/lib/platform-pages/reader-pages.mjs`** — What next (main + settings), Explain it URL summary + settings, Daily briefing GET HTML out of `server.mjs` (`readerPageDeps()`). See **`meimei-kernel-completion-plan.v1.md`** Phase K1.
- **2026-03-30 — Kernel plan K1b (`0.8.8`):** **`dashboard/lib/platform-pages/gtm-pages.mjs`** — Lead enrichment + Lead outreach main + settings GET HTML out of `server.mjs` (`gtmPageDeps()`). See **`meimei-kernel-completion-plan.v1.md`** Phase K1.
- **2026-03-30 — Kernel plan K1a (`0.8.7`):** **`dashboard/lib/platform-pages/ops-tool-pages.mjs`** — Inbox, Memory, Mission Control main + settings GET HTML out of `server.mjs` (`opsToolPageDeps()`). See **`meimei-kernel-completion-plan.v1.md`** Phase K1.
- **2026-03-30 — Reference app GET shells (`0.8.6`):** **`dashboard/lib/platform-pages/reference-app-pages.mjs`** — Reference app 1 & 2 HTML moved out of `server.mjs` (`referenceAppPageDeps()`). Audit rows note GET shell location. See `docs/releases/CHANGELOG.md`.
- **2026-03-30 — Phase 0 + Phase B batch (`0.8.5`):** Further `server.mjs` shrink — **`dashboard/lib/platform-pages/tool-surface-pages.mjs`** (routing preview, API channel adapter, AI SDR analytics, Supabase connector, environment variables GET HTML). System monitor feed shows **unknown `payload_kind`** values. Roadmap Phase 0 wiring/sign-off log + Phase B R3/R4/monitor items closed in docs; audit rows updated (**checklist** R3/R4 **G**, **supabase-connector** R4 **G**). See `docs/releases/CHANGELOG.md`.
- **2026-03-29 — Phase 0 platform alignment (0.8.1–0.8.4):** Mandatory repo boundaries doc; Checklist POST shell + local Next proxy/page + HTTP bridge extracted from `dashboard/server.mjs`; lead-outreach / ai-sdr-analytics / supabase-connector / lead-enrichment handlers in `apps/*`; Apps·Tools·knowmore catalog HTML in `dashboard/lib/platform-pages/catalog-pages.mjs`; `npm run boundary:check` = single Checklist POST invariant + no `apps/*` → sibling `apps/*` imports; all `functions/*.md` gain **Operator transport & secrets (R8 / R4)**; MeiMei Checklist integration (`integrations/checklist-web/`, `dashboard/lib/checklist-node/*`, renamed scripts). See `docs/releases/CHANGELOG.md` and `docs/releases/DELIVERY-phase-0-2026-03-29.v1.md`.
- `mvp-factory-control#631` - Supabase connector miniapp + Lead Enrichment `source: supabase` (PostgREST)
- `mvp-factory-control#650` - Lead enrichment workflow queue and `workflow_*` API
- `mvp-factory-control#651` - AI SDR analytics dashboard miniapp (SDR JSONL + workflow funnel)
- `mvp-factory-control#653` / `#654` - Lead outreach miniapp + SDR Mail draft, JSONL log, analytics, tracking
- Workspace **#726** - Environment variables miniapp (Vercel-style local secret store; not a board issue id)
- `mvp-factory-control#692` - Foundation contradiction audit baseline
- `mvp-factory-control#693` - Unified readiness gate
- `mvp-factory-control#694` - Miniapp contract v1
- `mvp-factory-control#695` - Function registry + validator
- `mvp-factory-control#696` - Dashboard runtime helper modularization
- `mvp-factory-control#697` - Issue quality standard + ready gate checklist
- `mvp-factory-control#699` - Channel adapter contract + lifecycle
- `mvp-factory-control#700` - API reference channel adapter + miniapp `/700/API_channel_adapter` + delivery doc
- `mvp-factory-control#701` - WhatsApp parity requirements + validator
- `mvp-factory-control#702` - iMessage adapter architecture plan
- `mvp-factory-control#703` - Email adapter architecture plan
- `mvp-factory-control#704` - Discord adapter architecture plan
- `mvp-factory-control#705` - Sovereign role taxonomy + authority matrix
- `mvp-factory-control#706` - Handoff artifact schema + stage-gate validator
- `mvp-factory-control#707` - Automated release gates mapped to DoD/testing
- `mvp-factory-control#723` - Centralized design system v1 + shared flashcard module
- `mvp-factory-control#724` - Design system hardening audit fixes (safe rendering + state classes + token cleanup)
- `mvp-factory-control#725` - Design system mobile navigation standardization

## Versioning policy

- Increment `major` for breaking governance/contract changes.
- Increment `minor` for new foundation capabilities and enforceable standards.
- Increment `patch` for bounded fixes, wording-only clarifications, and non-breaking doc adjustments.
