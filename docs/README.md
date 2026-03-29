# Documentation Library

**agent.meimei** — Knowledge library index for the AI-native agent platform.

## Quick Navigation

| Section | Purpose |
|---------|---------|
| [Architecture](#architecture) | System design, contracts, patterns |
| [Governance](#governance) | Rules, roles, quality standards |
| [Operations](#operations) | How to run, deploy, maintain |
| [Agent Identity](#agent-identity) | Who is MeiMei, how it thinks |
| [Adapters](#adapters) | Channel integration specs |
| [Compliance](#compliance) | Security, audits, validations |
| [Ideabank](#ideabank) | Feature inventory and operations |
| [Releases](#releases) | Changelog, roadmap, versions |

## Root Files

| File | Purpose |
|------|---------|
| [README.md](../README.md) | Project overview and getting started |
| [VERSION.md](../VERSION.md) | Current version and release history |
| [cursor-kilo.md](../cursor-kilo.md) | Agent coordination (KILO ↔ CURSOR) |
| [briefing.md](../briefing.md) | Latest generated daily briefing |

---

## Architecture

System design, technical contracts, and standards.

| File | Description |
|------|-------------|
| [system-overview.md](architecture/system-overview.md) | Core architecture with LLM layer, Brain system, design patterns |
| [design-system-v1.md](architecture/design-system-v1.md) | UI components, tokens, layout system |
| [miniapp-contract-v1.md](architecture/miniapp-contract-v1.md) | Miniapp/app/tool contract specification |
| [function-lifecycle.md](architecture/function-lifecycle.md) | How functions are created, registered, served |
| [model-routing-spec.md](architecture/model-routing-spec.md) | Brain-muscle model routing architecture |
| [naming-conventions.md](architecture/naming-conventions.md) | File naming and code conventions |
| [project-vocabulary-v1.md](architecture/project-vocabulary-v1.md) | Standardized project terminology |
| [inference-route.v1.md](api/inference-route.v1.md) | `POST /api/meimei/route` — OpenAI-shaped inference contract (v1) |
| [adapter-contract.v1.md](architecture/adapter-contract.v1.md) | Job spooler + adapter quarantine (ingress/egress, dead letters) |
| [adapter-obsidian.v1.md](architecture/adapter-obsidian.v1.md) | Vault watcher daemon (`chokidar`), ingress/egress rules |

## Governance

Rules, roles, quality standards, and decision processes.

| File | Description |
|------|-------------|
| [AGENTS.md](governance/AGENTS.md) | What KILO/CURSOR may do, capabilities list |
| [definition-of-done.md](governance/definition-of-done.md) | Quality bar for delivery |
| [issue-quality-standard.md](governance/issue-quality-standard.md) | How to write good issues |
| [issue-ready-gate-checklist.md](governance/issue-ready-gate-checklist.md) | Gate before work starts |
| [sovereign-agent-role-taxonomy-v1.md](governance/sovereign-agent-role-taxonomy-v1.md) | Role definitions for agents |
| [external-channel-policy-engine-v1.md](governance/external-channel-policy-engine-v1.md) | Channel policy rules |

## Operations

How to run, deploy, maintain, and troubleshoot.

| File | Description |
|------|-------------|
| [runbook.md](operations/runbook.md) | Daily operations and CLI commands |
| [HEARTBEAT.md](operations/HEARTBEAT.md) | System health monitoring |
| [learnings.md](operations/learnings.md) | Lessons learned |
| [testing.md](operations/testing.md) | Testing strategy |
| [workflow.md](operations/workflow.md) | Development workflow |
| [mac-mini-go-live-checklist.md](operations/mac-mini-go-live-checklist.md) | Production deployment checklist |
| [mac-mini-migration-audit.md](operations/mac-mini-migration-audit.md) | Migration audit |
| [second-mac-mini-handoff.md](operations/second-mac-mini-handoff.md) | Multi-machine setup |
| [vercel-env-inventory.md](operations/vercel-env-inventory.md) | Environment variables |

## Agent Identity

Who is MeiMei and how it operates.

| File | Description |
|------|-------------|
| [agent.md](agent-identity/agent.md) | Agent definition and purpose |
| [IDENTITY.md](agent-identity/IDENTITY.md) | Canonical identity |
| [SOUL.md](agent-identity/SOUL.md) | Tone, behavior, operating stance |
| [USER.md](agent-identity/USER.md) | Operator context |
| [MEMORY.md](agent-identity/MEMORY.md) | Memory system specification |
| [TOOLS.md](agent-identity/TOOLS.md) | Available tools |

## Adapters

Channel integration specifications and architectures.

| File | Description |
|------|-------------|
| [channel-adapter-contract-v1.md](adapters/channel-adapter-contract-v1.md) | Adapter contract standard |
| [channel-adapter-lifecycle-v1.md](adapters/channel-adapter-lifecycle-v1.md) | Adapter lifecycle states |
| [channel-api-adapter-reference-v1.md](adapters/channel-api-adapter-reference-v1.md) | Reference adapter implementation |
| [discord-adapter-architecture-v1.md](adapters/discord-adapter-architecture-v1.md) | Discord integration |
| [email-adapter-architecture-v1.md](adapters/email-adapter-architecture-v1.md) | Email integration |
| [imessage-adapter-architecture-v1.md](adapters/imessage-adapter-architecture-v1.md) | iMessage integration |
| [imessage-live-bridge-v1.md](adapters/imessage-live-bridge-v1.md) | iMessage live bridge |
| [whatsapp-adapter-parity-v1.md](adapters/whatsapp-adapter-parity-v1.md) | WhatsApp integration |
| [reliability-telemetry-baseline-v1.md](adapters/reliability-telemetry-baseline-v1.md) | Telemetry baseline |

## Compliance

Security, audits, validations, and policy.

| File | Description |
|------|-------------|
| [security.md](compliance/security.md) | Security policies |
| [foundation-contradiction-audit.md](compliance/foundation-contradiction-audit.md) | Architecture contradictions |
| [ai-runtime-audit.md](compliance/ai-runtime-audit.md) | AI runtime audit |
| [documentation-audit.md](compliance/documentation-audit.md) | Documentation quality audit |
| [doc_meimei.md](compliance/doc_meimei.md) | Documentation standards |
| [ice_meimei.md](compliance/ice_meimei.md) | ICE compliance |

## Ideabank

Feature inventory, operations, and runbook.

| File | Description |
|------|-------------|
| [audit.md](ideabank/audit.md) | Feature audit |
| [inventory.md](ideabank/inventory.md) | Feature inventory |
| [operations-manual.md](ideabank/operations-manual.md) | How to manage ideabank |
| [runbook.md](ideabank/runbook.md) | Ideabank runbook |
| [idea-support-map.md](ideabank/idea-support-map.md) | Feature mapping |

## Releases

Changelog, roadmap, and version history.

| File | Description |
|------|-------------|
| [CHANGELOG.md](releases/CHANGELOG.md) | Full changelog with all releases |
| [0.9.0.md](releases/0.9.0.md) | Release 0.9.0 notes (AI-Native Platform) |
| [product_roadmap.md](releases/product_roadmap.md) | Product roadmap |
| [roadmap.md](releases/roadmap.md) | Technical roadmap |
| [10hrs.md](releases/10hrs.md) | 10-hour implementation plan |

## Brain System

Agent learning and memory architecture.

| File | Description |
|------|-------------|
| [context.md](../brain/context.md) | Current project context |
| [identity.md](../brain/identity.md) | Agent identity |
| [user.md](../brain/user.md) | User preferences |
| [skills.md](../brain/skills.md) | Skills catalog |
| [durable.md](../brain/durable.md) | Learned facts and decisions |
| [log.md](../brain/log.md) | Activity log |
| [core-platform-plan.md](../brain/core-platform-plan.md) | Delivery plan for 54 core issues |

## Functions

App and tool contracts.

| File | Description |
|------|-------------|
| [inbox.md](../functions/inbox.md) | Email inbox tool |
| [lead-enrichment.md](../functions/lead-enrichment.md) | Lead enrichment app |
| [memory.md](../functions/memory.md) | Brain memory tool |
| [mission-control.md](../functions/mission-control.md) | System telemetry tool |
| [what-next.md](../functions/what-next.md) | Recommendations app |
| [daily-briefing.md](../functions/daily-briefing.md) | Daily briefing app |
| [ai-sdr-analytics.md](../functions/ai-sdr-analytics.md) | SDR analytics app |
| [lead-outreach.md](../functions/lead-outreach.md) | Lead outreach app |
| [supabase-connector.md](../functions/supabase-connector.md) | Supabase connector tool |
| [environment-variables.md](../functions/environment-variables.md) | Environment config tool |

## Skills

Core skills catalog.

| File | Description |
|------|-------------|
| [catalog.md](../skills/catalog.md) | Skills catalog |
| [daily-briefing/SKILL.md](../skills/core/daily-briefing/SKILL.md) | Daily briefing skill |
| [email-triage/SKILL.md](../skills/core/email-triage/SKILL.md) | Email triage skill |
| [health-checks/SKILL.md](../skills/core/health-checks/SKILL.md) | Health check skill |
| [model-routing/SKILL.md](../skills/core/model-routing/SKILL.md) | Model routing skill |
| [openclaw-ops/SKILL.md](../skills/core/openclaw-ops/SKILL.md) | OpenClaw operations skill |
| [operations/SKILL.md](../skills/core/operations/SKILL.md) | Operations skill |
| [planning/SKILL.md](../skills/core/planning/SKILL.md) | Planning skill |
| [research/SKILL.md](../skills/core/research/SKILL.md) | Research skill |
| [review/SKILL.md](../skills/core/review/SKILL.md) | Review skill |
| [safety/SKILL.md](../skills/core/safety/SKILL.md) | Safety skill |
| [shipping/SKILL.md](../skills/core/shipping/SKILL.md) | Shipping skill |
| [synthesis/SKILL.md](../skills/core/synthesis/SKILL.md) | Synthesis skill |
| [url-summarization/SKILL.md](../skills/core/url-summarization/SKILL.md) | URL summarization skill |

---

## How to Navigate

1. **New developer?** Start with [system-overview.md](architecture/system-overview.md)
2. **Need to deploy?** Check [runbook.md](operations/runbook.md) and [mac-mini-go-live-checklist.md](operations/mac-mini-go-live-checklist.md)
3. **Building a feature?** Read [miniapp-contract-v1.md](architecture/miniapp-contract-v1.md)
4. **Understanding agents?** Start with [agent.md](agent-identity/agent.md)
5. **Need to troubleshoot?** Check [HEARTBEAT.md](operations/HEARTBEAT.md) and [learnings.md](operations/learnings.md)

---

**Maintained by:** KILO + CURSOR
**Last updated:** 2026-03-28
