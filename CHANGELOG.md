# Changelog

## Unreleased

- Added `design-system-v1.md` defining centralized theme tokens, component modules, and integration policy for all dashboard/miniapp pages.
- Added shared stylesheet `public/styles/design-system.css` as the single source of UI truth for typography, backgrounds, cards, nav, forms, modal, and flashcards.
- Refactored `dashboard/server.mjs` pages (dashboard, knowmore, admin, URL summary, daily briefing, routing) to consume the centralized design system instead of per-page style blocks.
- Standardized flashcard content structure to `kind`, `title`, `content` rendering (`APP` / `ISSUE #...`) without variable-name prefixes.
- Hardened design-system implementation: removed obsolete styles/tokens, replaced dynamic knowmore `innerHTML` card rendering with safe DOM creation, and moved modal visibility to class-based state (`.is-open`).
- Expanded design tokens for modal/terminal/code surfaces and OpenClaw brand colors; added explicit `data-theme="red"` token mapping for consistent documentation/runtime alignment.
- Added a standardized mobile navigation component (`.nav-toggle` + `.nav-actions.is-open`) with responsive behavior across dashboard, knowmore, and admin pages.

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

