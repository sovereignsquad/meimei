# agent.meimei

[![CI](https://github.com/moldovancsaba/agent.meimei/actions/workflows/ci.yml/badge.svg)](https://github.com/moldovancsaba/agent.meimei/actions/workflows/ci.yml)

`agent.meimei` is a fresh OpenClaw workspace and product shell for a large-skill agent system.

This repository is the source of truth for:

- the agent identity
- the operating rules
- the skill catalog
- the OpenClaw collaboration model
- the work backlog and release discipline

The project is intentionally markdown-first so it can grow from a clean foundation without hiding important behavior in code.

## What this is

- A product workspace for a long-lived agent named MeiMei.
- A place to define hundreds of skills in a predictable structure.
- A collaboration model where OpenClaw handles orchestration and OC provides human steering and approval.

## What is in the repo

- `agent.md` - identity and behavioral contract.
- `architecture.md` - system shape and boundaries.
- `foundation-contradiction-audit.md` - contradiction matrix and remediation order for foundation hardening.
- `VERSION.md` - current foundation version and issue-delivery mapping.
- `CHANGELOG.md` - chronological release notes and foundation delivery history.
- `documentation-audit.md` - markdown corpus audit, staleness notes, and proposed doc structure (`docs/README.md` is the short map).
- `ai-runtime-audit.md` - where OpenClaw, Ollama, rules, and sample/stub data are used (LLM integration truth table).
- `miniapp-contract-v1.md` - frozen contract standard for all MeiMei miniapps.
- `issue-quality-standard.md` - required quality rules for implementation issues.
- `issue-ready-gate-checklist.md` - checklist used before moving issues to `Ready (NEXT)`.
- `handoff-artifact-schema-v1.md` - required structured handoff artifact and stage-gate enforcement rules.
- `release-gates-dod-v1.md` - machine-checkable release gates mapped to Definition of Done and testing rules.
- `external-channel-policy-engine-v1.md` - risk-tier policy-as-code contract for outbound channel actions.
- `decision-action-audit-trail-v1.md` - append-only hash-chained audit pipeline for policy/routing/delivery events.
- `reliability-telemetry-baseline-v1.md` - baseline telemetry event schema and SLO summary metrics.
- `design-system-v1.md` - centralized UI tokens/components/themes, **global layout system** (`.layout-flow` / `.layout-box`), and integration rules.
- `config/page-layout.v1.json` - persisted per-page block order, spans, and desktop column count (edited from **Admin → Page layout**).
- `macos/MeiMei/` - optional macOS menu bar app for the local dashboard (`npm run menubar:build`; `npm run menubar:install` copies **MeiMei.app** to `~/Applications` for Spotlight — see `macos/MeiMei/README.md`).
- `project-vocabulary-v1.md` - canonical product vocabulary and documentation wording rules.
- `channel-adapter-contract-v1.md` - canonical interface for all channel adapters.
- `channel-adapter-lifecycle-v1.md` - required ingress-to-delivery adapter lifecycle.
- `sovereign-agent-role-taxonomy-v1.md` - role boundaries and authority matrix for sovereign multi-agent delivery.
- `imessage-adapter-architecture-v1.md` - phased architecture and implementation plan for iMessage adapter.
- `imessage-live-bridge-v1.md` - live inbound/outbound iMessage bridge endpoint and test protocol.
- `email-adapter-architecture-v1.md` - phased architecture and provider strategy for Email adapter.
- `discord-adapter-architecture-v1.md` - phased architecture and provider strategy for Discord adapter.
- `whatsapp-adapter-parity-v1.md` - enforced parity requirements for WhatsApp config and policy.
- `functions/registry.v1.json` - machine-readable registry of active miniapp contracts.
- `function-lifecycle.md` - standard delivery method for new MeiMei functions.
- `model-routing-spec.md` - deterministic routing policy for channel, task type, and cost.
- `mac-mini-migration-audit.md` - dependency and portability audit for moving the product to another Mac mini.
- `mac-mini-go-live-checklist.md` - strict pass/fail gates for cutover.
- `vercel-env-inventory.md` - secret inventory and Vercel sync notes.
- `second-mac-mini-handoff.md` - copy-paste task for the migration agent.
- `workflow.md` - intake to delivery flow.
- `product_roadmap.md` - executive view of shipped miniapps and FR/CR themes (plain English).
- `issue-merge-walkthrough.md` - how to walk issues, add FR/CR traceability, and link backlog to miniapps.
- `runbook.md` - day-to-day operating steps.
- `security.md` - safety and access rules.
- `testing.md` - verification expectations.
- `definition-of-done.md` - shipping bar.
- `skills/` - skill packs and catalog scaffolding.
- `functions/` - product function pages and API contracts.
- `functions/daily-briefing.md` - Apple Notes-first daily briefing miniapp.
- `functions/any-url-summarization-in-seconds.md` - URL summarization miniapp.
- `functions/per-channel-model-routing-by-task-type-and-cost.md` - routing preview miniapp.
- `functions/api-channel-adapter.md` - API reference channel adapter miniapp (`#700`).
- `channel-api-adapter-reference-v1.md` - delivery artifact and verification for the API adapter basement.
- `openclaw.config.json` - portable OpenClaw seed template for new machines.
- `~/.openclaw/openclaw.json` - live OpenClaw config rendered from the seed template and used by the dashboard and wrapper scripts.
- `scripts/oc` - wrapper that pins `openclaw` to the live OpenClaw config.
- `scripts/oc-agent` - agent turn wrapper with deterministic model routing inputs.
- `scripts/oc-launch` - launch helper for the gateway.
- `scripts/oc-status` - health and readiness helper.
- `scripts/oc-readiness` - unified PASS/FAIL readiness gate (blocks on critical findings).
- `scripts/meimei-always-on-install` - installs macOS `launchd` always-on gateway service.
- `scripts/meimei-always-on-uninstall` - removes macOS always-on gateway service.
- `scripts/meimei-always-on-status` - prints always-on service state and gateway probe.
- `scripts/meimei-dashboard-watchdog-install` - installs `meimei-domain` stack + MeiMei health watcher (`com.agent.meimei.*`).
- `scripts/meimei-platform-migrate.sh` - dry-run / `--force` cleanup of retired `ai.openclaw.meimei.dashboard-*` LaunchAgents.
- `docs/architecture/adapter-contract.v1.md` - SQLite job spooler + adapter quarantine; `npm run jobs:demo-enqueue` enqueues a sample job; `npm run jobs:demo-file-drop` scans `data/meimei-demo-in/*.json` in a **separate process** (dashboard + Ollama still required for job completion).
- `docs/architecture/adapter-obsidian.v1.md` - Obsidian vault watcher (`npm run adapter:obsidian` + `MEIMEI_OBSIDIAN_VAULT`); uses **`chokidar`** (see `package.json` dependencies).
- `scripts/meimei-dashboard-watchdog-status` - prints dashboard/watchdog service state and health probe.
- `scripts/meimei-dashboard-watchdog-uninstall` - removes dashboard watcher services.
- `scripts/web-search` - local DuckDuckGo-based web search fallback.
- `Makefile` - convenience targets for launch, status, doctor, skills, and agent turns.
- `dashboard/server.mjs` - localhost control panel for settings, search, and OpenClaw operations.
- `public/styles/design-system.css` - global design system stylesheet used by dashboard + miniapps.
- `package.json` - `npm run dashboard` entry point for the control panel.

## Current state

This repository is beyond bootstrap and includes both foundation governance and operational runtime surfaces.
Current baseline includes:

- reusable skills and miniapp contracts
- policy, audit, telemetry, and release-gate validators
- operator runtime UI + local-domain proxy + watchdog services
- repeatable release/version governance

Current version line:

- `foundation 0.8.0` (`gtm-env-operator-726`, `2026-03-28`)

Release metadata source of truth:

- `VERSION.md` is canonical for current version/date/codename.

## Next step

Start by reading `agent.md`, `architecture.md`, and `skills/catalog.md`.

## Launch

Use one of these from the repo root:

- `./scripts/oc-status`
- `./scripts/oc-readiness`
- `./scripts/oc-launch`
- `make status`
- `make launch`
- `npm run dashboard` then open `http://127.0.0.1:45285` (or whatever `defaults.port` is in `config/dashboard-surface.v1.json`)
- `./scripts/meimei-domain` then open `https://meimei.localhost:8443/dashboard/`
- `npm run setup` for the one-step local domain start/open flow
- `npm run bootstrap` for the full target-machine bootstrap and verification flow
- `npm run config:seed` to render the live OpenClaw config from the repo seed
- `npm run readiness` for the unified go/no-go readiness gate
- `npm run registry:validate` to validate all miniapp contract entries
- `npm run adapter:whatsapp:validate` to validate WhatsApp adapter parity requirements
- `npm run handoff:validate -- handoffs/sample.stage-gate.v1.json` to validate role handoff artifacts and stage gates
- `npm run release:gates -- releases/sample.release-gate.v1.json` to validate release readiness gates
- `npm run policy:validate` to validate external-channel risk-tier policy enforcement
- `npm run audit:validate` to validate audit trail chain integrity
- `npm run telemetry:seed` to seed deterministic sample telemetry events
- `npm run telemetry:validate` to validate telemetry summary/SLO schema integrity
- `npm run imessage:validate` to validate iMessage adapter lifecycle and idempotency behavior
- `npm run always-on:install` to install and start always-on gateway auto-restart service
- `npm run always-on:status` to inspect launchd service state and gateway health
- `npm run always-on:uninstall` to remove always-on gateway service
- `npm run dashboard:watchdog:install` to keep dashboard always-on (boot/login, crash restart, health-triggered restart)
- `npm run dashboard:watchdog:status` to inspect dashboard watcher services and health
- `npm run dashboard:watchdog:uninstall` to remove dashboard watcher services
