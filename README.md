# agent.meimei

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
- `miniapp-contract-v1.md` - frozen contract standard for all MeiMei miniapps.
- `issue-quality-standard.md` - required quality rules for implementation issues.
- `issue-ready-gate-checklist.md` - checklist used before moving issues to `Ready (NEXT)`.
- `handoff-artifact-schema-v1.md` - required structured handoff artifact and stage-gate enforcement rules.
- `channel-adapter-contract-v1.md` - canonical interface for all channel adapters.
- `channel-adapter-lifecycle-v1.md` - required ingress-to-delivery adapter lifecycle.
- `sovereign-agent-role-taxonomy-v1.md` - role boundaries and authority matrix for sovereign multi-agent delivery.
- `imessage-adapter-architecture-v1.md` - phased architecture and implementation plan for iMessage adapter.
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
- `runbook.md` - day-to-day operating steps.
- `security.md` - safety and access rules.
- `testing.md` - verification expectations.
- `definition-of-done.md` - shipping bar.
- `skills/` - skill packs and catalog scaffolding.
- `functions/` - product function pages and API contracts.
- `functions/daily-briefing.md` - Apple Notes-first daily briefing miniapp.
- `functions/any-url-summarization-in-seconds.md` - URL summarization miniapp.
- `functions/per-channel-model-routing-by-task-type-and-cost.md` - routing preview miniapp.
- `openclaw.config.json` - portable OpenClaw seed template for new machines.
- `~/.openclaw/openclaw.json` - live OpenClaw config rendered from the seed template and used by the dashboard and wrapper scripts.
- `scripts/oc` - wrapper that pins `openclaw` to the live OpenClaw config.
- `scripts/oc-agent` - agent turn wrapper with deterministic model routing inputs.
- `scripts/oc-launch` - launch helper for the gateway.
- `scripts/oc-status` - health and readiness helper.
- `scripts/oc-readiness` - unified PASS/FAIL readiness gate (blocks on critical findings).
- `scripts/web-search` - local DuckDuckGo-based web search fallback.
- `Makefile` - convenience targets for launch, status, doctor, skills, and agent turns.
- `dashboard/server.mjs` - localhost control panel for settings, search, and OpenClaw operations.
- `package.json` - `npm run dashboard` entry point for the control panel.

## Current state

This is the foundation layer only.
It is designed to support:

- many reusable skills
- repeatable delivery
- safe collaboration with OC
- future implementation work without rethinking the base structure

## Next step

Start by reading `agent.md`, `architecture.md`, and `skills/catalog.md`.

## Launch

Use one of these from the repo root:

- `./scripts/oc-status`
- `./scripts/oc-readiness`
- `./scripts/oc-launch`
- `make status`
- `make launch`
- `npm run dashboard` then open `http://127.0.0.1:3030`
- `./scripts/meimei-domain` then open `https://meimei.localhost:8443/dashboard/`
- `npm run setup` for the one-step local domain start/open flow
- `npm run bootstrap` for the full target-machine bootstrap and verification flow
- `npm run config:seed` to render the live OpenClaw config from the repo seed
- `npm run readiness` for the unified go/no-go readiness gate
- `npm run registry:validate` to validate all miniapp contract entries
- `npm run adapter:whatsapp:validate` to validate WhatsApp adapter parity requirements
- `npm run handoff:validate -- handoffs/sample.stage-gate.v1.json` to validate role handoff artifacts and stage gates
