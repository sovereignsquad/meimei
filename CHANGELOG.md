# CHANGELOG

## Unreleased

- Nothing yet.

## 2026-03-28 - Operator GTM funnel and environment governance (`0.8.0`)

### Lead pipeline and SDR (mvp-factory-control)

- **#650** — Lead enrichment workflow: local queue (`data/lead-enrichment-workflow.v1.json`), `workflow_*` API actions, dashboard table with Run / Skip / Remove / Outreach handoff to Lead outreach via `sessionStorage` prefill (`dashboard/lib/lead-enrichment-workflow.mjs`).
- **#653 / #654** — Lead outreach: `draft_touch`, `sdr_send` (Apple Mail draft + JSONL), `sdr_analytics`, `sdr_track` (`dashboard/lib/sdr-analytics.mjs`, `mail-adapter.mjs`); docs in `functions/lead-outreach.md`.
- **#651** — AI SDR analytics miniapp `/651/AI_SDR_analytics`: combined metrics from SDR log and workflow store (`dashboard/lib/gtm-analytics.mjs`); contract `functions/ai-sdr-analytics.md`.
- **#631** — Supabase connector tool `/631/Supabase_connector` and Lead Enrichment source `supabase` (PostgREST via fetch; env `MEIMEI_SUPABASE_*`) (`dashboard/lib/supabase-connector.mjs`, `functions/supabase-connector.md`).

### Secrets and configuration (workspace #726)

- **Environment variables** miniapp `/726/Environment_variables`: Vercel-style name / value / Production·Preview·Development CRUD; `data/meimei-environment.v1.json` (gitignored, chmod 600); applies to `process.env` on load and after save; `MEIMEI_ENV_PROFILE` two-pass apply; suggested keys in `config/meimei-env-catalog.v1.json` (`dashboard/lib/meimei-env-store.mjs`, `functions/environment-variables.md`).
- `vercel-env-inventory.md` documents the dashboard editor alongside Vercel pull.

### Registry and operator UX

- **12** function contracts in `functions/registry.v1.json`; Inbox catalog order adjusted for new apps.
- Command interface and home-suggestions navigate to SDR analytics, Supabase connector, and Environment variables.

### Documentation and product map

- `ai-runtime-audit.md`, `product_roadmap.md`, `documentation-audit.md`, `docs/README.md`, `config/knowmore-releases.v1.json`, and related README links updated in this wave.
- Optional `scripts/what-next.mjs` and `scripts/what-next-schedule` added for local scheduling experiments.

## 2026-03-27 - API channel adapter miniapp (`0.7.4`)

### Channel reference (`mvp-factory-control#700`)

- Added miniapp route `/700/API_channel_adapter` and HTTP `GET`/`POST` `/api/functions/api-channel-adapter` (same adapter engine as model routing; dedicated contract path).
- Documented delivery artifact in `channel-api-adapter-reference-v1.md` and `functions/api-channel-adapter.md`; registry entry `api-channel-adapter`.
- Updated knowmore card for issue 700, `product_roadmap.md`, and `architecture.md` channel layer references.

## 2026-03-27 - Design system hardening wave (`0.7.3`)

### Documentation and communication quality

- Added `project-vocabulary-v1.md` to standardize project-level wording and release-note language.
- Rewrote `architecture.md` with explicit layer boundaries, runtime topology, and enforceability principles.
- Updated `README.md` state/version language to match released runtime maturity and `VERSION.md`.

### Design system centralization and hardening

- Added shared stylesheet `public/styles/design-system.css` as the single source of UI tokens/components across dashboard and miniapp pages.
- Standardized flashcard structure to `kind`, `title`, `content` rendering (`APP` / `ISSUE #...`) without variable-name prefixes.
- Hardened knowmore rendering and modal behavior:
  - safe DOM card creation (`createElement`/`textContent`)
  - class-based modal state (`.is-open`) instead of inline style mutation.
- Expanded token model for modal/terminal/code surfaces and OpenClaw branding; added explicit `data-theme=\"red\"` support.
- Added standardized mobile nav component (`.nav-toggle` + `.nav-actions.is-open`) across dashboard, knowmore, and admin.

## 2026-03-26 - Foundation hardening wave

### Governance and quality gates

- Added `foundation-contradiction-audit.md` to capture concrete baseline contradictions and remediation order (`48fb09b`).
- Added `issue-quality-standard.md` and `issue-ready-gate-checklist.md` for issue quality and phase-entry discipline (`dc2a042`).
- Added `sovereign-agent-role-taxonomy-v1.md` defining planner/architect/implementer/reviewer/tester/releaser boundaries and authority matrix (`6a37691`).
- Added `handoff-artifact-schema-v1.md` plus handoff validator and sample artifact for stage-gate enforcement (`dcdbee6`).
- Added `release-gates-dod-v1.md` plus release validator and sample artifact to enforce DoD/testing release readiness (`9f5463a`).

### Miniapp contract and registry

- Added frozen `miniapp-contract-v1.md` standard for all miniapps (`b946e53`).
- Added machine-readable `functions/registry.v1.json` and `scripts/validate-function-registry.mjs` (`7596b3d`).
- Updated core function docs to include explicit Miniapp Contract v1 instances (`6cd58c5`).

### Channel adapter architecture

- Added `channel-adapter-contract-v1.md` and `channel-adapter-lifecycle-v1.md` as canonical multi-channel standards (`3e5d092`).
- Implemented API reference adapter in `dashboard/lib/api-channel-adapter.mjs` and integrated server path (`efed945`).
- Added WhatsApp parity spec and validator (`whatsapp-adapter-parity-v1.md`, `scripts/validate-whatsapp-adapter.mjs`) (`7db3687`).
- Added iMessage adapter architecture plan (`imessage-adapter-architecture-v1.md`) (`acbb161`).
- Added Email adapter architecture plan (`email-adapter-architecture-v1.md`) (`abf2642`).
- Added Discord adapter architecture plan (`discord-adapter-architecture-v1.md`) (`5f31612`).

### Runtime and operations

- Added unified readiness gate command/script (`scripts/oc-readiness`, `npm run readiness`) (`a365920`).
- Refactored runtime helpers from `dashboard/server.mjs` into `dashboard/lib/runtime.mjs` (`d22c74e`).
- Updated runbook/readme command surfaces for readiness and validator workflows (multiple commits in this wave).

