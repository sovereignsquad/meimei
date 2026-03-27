# CHANGELOG

## Unreleased

- Dashboard miniapp cards and route constants are derived from `functions/registry.v1.json` (`dashboard/lib/miniapp-registry.mjs`); registry entries require `description` and may set `catalogOrder`.

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

