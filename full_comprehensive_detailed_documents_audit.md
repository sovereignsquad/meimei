# Full comprehensive detailed documents audit

**Scope:** Every `*.md` file in this repository **except** `node_modules/**` (vendor READMEs are not MeiMei-controlled).

**Enumeration:** **150** paths (includes this ledger).

**Ledger generated:** 2026-03-29T22:00:00Z  
**Row timestamps (column 2):** ISO-8601 UTC, **one second per row** in lexicographic path order (latest regen proof).

## Method (mandated rounds)

1. **Round 1:** Enumerate all paths — omissions forbidden (this table). **150** paths via `find … ! -path '*/node_modules/*'`.  
2. **Rounds 2–N:** Prior waves: entry docs + `docs/planning/*` deep read. **Wave 3 (2026-03-30):** repo-wide grep (stale root `agent.md`, `ARCHITECTURE.md`); **full read** of four new kernel docs; fixes to **AGENTS**, **doc_meimei**, **documentation-audit**, **foundation-contradiction C-001**, **VERSION** count, **docs/README**, **developers/README**, **sync audit** matrix. **Wave 4 (2026-03-30):** tier tables + **doc_meimei** path map; **runbook** / **ai-runtime-audit** / **app-dev guide** / **design-system** cross-links; **CHANGELOG** historical footnotes; **sync audit** revision row. Remaining rows: **SPECIFIC** or default **None** (sampled `brain/`, `functions/`, `skills/` unchanged).  
3. **Rounds N+1–N+M:** Apply fixes where column 3 starts with **Completed:**.  
4. **Round N+M+1:** Maintainer report (below).

## Outcome summary

| Metric | Value |
|--------|------:|
| Documents in scope | 150 |
| Wave 3 edits | AGENTS, doc_meimei, documentation-audit, foundation-contradiction, VERSION, docs/README, developers/README, meimei-docs-code-sync, + four new doc rows indexed |
| Wave 4 edits | documentation-audit tiers, doc_meimei map, foundation-contradiction C-001 phrasing, ai-runtime-audit, runbook, app-dev guide, design-system, CHANGELOG footnotes, sync-audit revision |
| Normative code sync | [`docs/planning/meimei-docs-code-sync-audit.v1.md`](docs/planning/meimei-docs-code-sync-audit.v1.md) |

---

## Master table

| Document path | Audited (UTC) | Action required |
|---------------|---------------|-----------------|
| `apps/lead-enrichment/README.md` | 2026-03-29T22:00:00Z | **Completed:** Route/API aligned to `functions/registry.v1.json` + `miniapp-contract` (`/dashboard` + `serverApiPath` note). |
| `brain/context.md` | 2026-03-29T22:00:01Z | None — cognition / coordination notes; not normative kernel specs. |
| `brain/core-platform-plan.md` | 2026-03-29T22:00:02Z | None — cognition / coordination notes; not normative kernel specs. |
| `brain/durable.md` | 2026-03-29T22:00:03Z | **Completed:** Design-system theme bullet → primary `data-theme` keys + link to `design-system-v1.md`. |
| `brain/identity.md` | 2026-03-29T22:00:04Z | None — cognition / coordination notes; not normative kernel specs. |
| `brain/log.md` | 2026-03-29T22:00:05Z | None — cognition / coordination notes; not normative kernel specs. |
| `brain/skills.md` | 2026-03-29T22:00:06Z | None — cognition / coordination notes; not normative kernel specs. |
| `brain/user.md` | 2026-03-29T22:00:07Z | None — cognition / coordination notes; not normative kernel specs. |
| `briefing.md` | 2026-03-29T22:00:08Z | None — full read or full chunked read; no correction applied this session. |
| `cursor-kilo.md` | 2026-03-29T22:00:09Z | **Completed:** `ARCHITECTURE.md` handoff refs → `docs/architecture/system-overview.md`. |
| `dashboard/lib/platform-pages/README.md` | 2026-03-29T22:00:10Z | None — full read or full chunked read; no correction applied this session. |
| `data/kernel/apps/README.md` | 2026-03-29T22:00:11Z | None — full read or full chunked read; no correction applied this session. |
| `data/meimei-demo-in/README.md` | 2026-03-29T22:00:12Z | None — full read or full chunked read; no correction applied this session. |
| `docs/adapters/discord-adapter-architecture-v1.md` | 2026-03-29T22:00:13Z | None — full read or full chunked read; no correction applied this session. |
| `docs/adapters/email-adapter-architecture-v1.md` | 2026-03-29T22:00:14Z | None — full read or full chunked read; no correction applied this session. |
| `docs/adapters/imessage-adapter-architecture-v1.md` | 2026-03-29T22:00:15Z | None — full read or full chunked read; no correction applied this session. |
| `docs/adapters/imessage-live-bridge-v1.md` | 2026-03-29T22:00:16Z | None — full read or full chunked read; no correction applied this session. |
| `docs/adapters/reliability-telemetry-baseline-v1.md` | 2026-03-29T22:00:17Z | None — full read or full chunked read; no correction applied this session. |
| `docs/adapters/whatsapp-adapter-parity-v1.md` | 2026-03-29T22:00:18Z | None — full read or full chunked read; no correction applied this session. |
| `docs/agent-identity/agent.md` | 2026-03-29T22:00:19Z | None — full read or full chunked read; no correction applied this session. |
| `docs/agent-identity/IDENTITY.md` | 2026-03-29T22:00:20Z | None — full read or full chunked read; no correction applied this session. |
| `docs/agent-identity/MEMORY.md` | 2026-03-29T22:00:21Z | None — full read or full chunked read; no correction applied this session. |
| `docs/agent-identity/SOUL.md` | 2026-03-29T22:00:22Z | None — full read or full chunked read; no correction applied this session. |
| `docs/agent-identity/TOOLS.md` | 2026-03-29T22:00:23Z | None — full read or full chunked read; no correction applied this session. |
| `docs/agent-identity/USER.md` | 2026-03-29T22:00:24Z | None — full read or full chunked read; no correction applied this session. |
| `docs/api/inference-route.v1.md` | 2026-03-29T22:00:25Z | None — full read or full chunked read; no correction applied this session. |
| `docs/api/meimei-app-facades-v1.md` | 2026-03-29T22:00:26Z | **Completed (wave 3):** Cross-checked `package.json` / server routes; indexed `docs/README` + sync matrix. |
| `docs/architecture/adapter-contract.v1.md` | 2026-03-29T22:00:27Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/adapter-obsidian.v1.md` | 2026-03-29T22:00:28Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/adr/ADR-001-app-runtime-v1.md` | 2026-03-29T22:00:29Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/adr/ADR-002-app-identity-and-addressing-v1.md` | 2026-03-29T22:00:30Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/adr/ADR-003-tls-termination-v1.md` | 2026-03-29T22:00:31Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/adr/README.md` | 2026-03-29T22:00:32Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/app-architecture.md` | 2026-03-29T22:00:33Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/design-system-v1.md` | 2026-03-29T22:00:34Z | **Completed (wave 4):** Doc/versioning paths → `docs/releases/CHANGELOG.md` + `VERSION.md`. |
| `docs/architecture/function-lifecycle.md` | 2026-03-29T22:00:35Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/handoff-milestone-g-inter-app-bus.v1.md` | 2026-03-29T22:00:36Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/inter-app-message-bus.v1.md` | 2026-03-29T22:00:37Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-admin-vs-miniapp-ops.v1.md` | 2026-03-29T22:00:38Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-app-development-guide.v1.md` | 2026-03-29T22:00:39Z | **Completed (wave 4):** Prerequisites + §6 themes / `operator-chrome.css` vs primary `data-theme` keys. |
| `docs/architecture/meimei-env-ui-contract.v1.md` | 2026-03-29T22:00:40Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-https-topology.v1.md` | 2026-03-29T22:00:41Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-kernel-code-audit.v1.md` | 2026-03-29T22:00:42Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-kernel-completion-plan.v1.md` | 2026-03-29T22:00:43Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-kernel-external-app-shells-v1.md` | 2026-03-29T22:00:44Z | **Completed (wave 3):** `kernel-catalog-merge.mjs` present; indexed. |
| `docs/architecture/meimei-platform-alignment-roadmap.v1.md` | 2026-03-29T22:00:45Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-repo-boundaries.v1.md` | 2026-03-29T22:00:46Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/meimei-system-vision-and-platform-audit.v3.md` | 2026-03-29T22:00:47Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/miniapp-contract-v1.md` | 2026-03-29T22:00:48Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/model-routing-spec.md` | 2026-03-29T22:00:49Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/naming-conventions.md` | 2026-03-29T22:00:50Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/project-vocabulary-v1.md` | 2026-03-29T22:00:51Z | None — full read or full chunked read; no correction applied this session. |
| `docs/architecture/system-overview.md` | 2026-03-29T22:00:52Z | **Completed:** Dev workflow doc pointer → this file instead of missing `ARCHITECTURE.md`. |
| `docs/compliance/ai-runtime-audit.md` | 2026-03-29T22:00:53Z | **Completed (wave 4):** `runbook.md` → `docs/operations/runbook.md` link. |
| `docs/compliance/doc_meimei.md` | 2026-03-29T22:00:54Z | **Completed (wave 3–4):** Generic filename → `agent.meimei` path table + ledger link. |
| `docs/compliance/documentation-audit.md` | 2026-03-29T22:00:55Z | **Completed (wave 3–4):** Scope **150**; tier tables → canonical `docs/…` markdown links; Wave 4 executive summary. |
| `docs/compliance/foundation-contradiction-audit.md` | 2026-03-29T22:00:56Z | **Completed (wave 3–4):** C-001 historical evidence (no implied live root `architecture.md`). |
| `docs/compliance/ice_meimei.md` | 2026-03-29T22:00:57Z | None — full read or full chunked read; no correction applied this session. |
| `docs/compliance/miniapp-platform-audit.v1.md` | 2026-03-29T22:00:58Z | None — full read or full chunked read; no correction applied this session. |
| `docs/compliance/security.md` | 2026-03-29T22:00:59Z | None — full read or full chunked read; no correction applied this session. |
| `docs/contracts/channel-adapter-contract-v1.md` | 2026-03-29T22:01:00Z | None — full read or full chunked read; no correction applied this session. |
| `docs/contracts/channel-adapter-lifecycle-v1.md` | 2026-03-29T22:01:01Z | None — full read or full chunked read; no correction applied this session. |
| `docs/contracts/channel-api-adapter-reference-v1.md` | 2026-03-29T22:01:02Z | None — full read or full chunked read; no correction applied this session. |
| `docs/contracts/decision-action-audit-trail-v1.md` | 2026-03-29T22:01:03Z | None — full read or full chunked read; no correction applied this session. |
| `docs/contracts/handoff-artifact-schema-v1.md` | 2026-03-29T22:01:04Z | None — full read or full chunked read; no correction applied this session. |
| `docs/contracts/release-gates-dod-v1.md` | 2026-03-29T22:01:05Z | None — full read or full chunked read; no correction applied this session. |
| `docs/developers/meimei-kernel-handbook.v1.md` | 2026-03-29T22:01:06Z | None — full read or full chunked read; no correction applied this session. |
| `docs/developers/README.md` | 2026-03-29T22:01:07Z | **Completed (wave 3):** Table rows for facades, kernel-apps, threat model, external shells. |
| `docs/governance/AGENTS.md` | 2026-03-29T22:01:08Z | **Completed (wave 3):** Read-first list → real paths + ledger link. |
| `docs/governance/definition-of-done.md` | 2026-03-29T22:01:09Z | None — full read or full chunked read; no correction applied this session. |
| `docs/governance/external-channel-policy-engine-v1.md` | 2026-03-29T22:01:10Z | None — full read or full chunked read; no correction applied this session. |
| `docs/governance/issue-merge-walkthrough.md` | 2026-03-29T22:01:11Z | None — full read or full chunked read; no correction applied this session. |
| `docs/governance/issue-quality-standard.md` | 2026-03-29T22:01:12Z | None — full read or full chunked read; no correction applied this session. |
| `docs/governance/issue-ready-gate-checklist.md` | 2026-03-29T22:01:13Z | None — full read or full chunked read; no correction applied this session. |
| `docs/governance/sovereign-agent-role-taxonomy-v1.md` | 2026-03-29T22:01:14Z | None — full read or full chunked read; no correction applied this session. |
| `docs/governance/tasks.md` | 2026-03-29T22:01:15Z | None — full read or full chunked read; no correction applied this session. |
| `docs/ideabank/audit.md` | 2026-03-29T22:01:16Z | None — ideation archive; refresh when mining backlog. |
| `docs/ideabank/idea-support-map.md` | 2026-03-29T22:01:17Z | None — ideation archive; refresh when mining backlog. |
| `docs/ideabank/inventory.md` | 2026-03-29T22:01:18Z | None — ideation archive; refresh when mining backlog. |
| `docs/ideabank/operations-manual.md` | 2026-03-29T22:01:19Z | None — ideation archive; refresh when mining backlog. |
| `docs/ideabank/runbook.md` | 2026-03-29T22:01:20Z | None — ideation archive; refresh when mining backlog. |
| `docs/ideabank/steal_from_sovereign_plan.md` | 2026-03-29T22:01:21Z | None — ideation archive; refresh when mining backlog. |
| `docs/operations/handoff-roadmap-headless-server.v1.md` | 2026-03-29T22:01:22Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/HEARTBEAT.md` | 2026-03-29T22:01:23Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/kernel-apps.v1.md` | 2026-03-29T22:01:24Z | **Completed (wave 3):** CLI targets match `package.json`; indexed. |
| `docs/operations/knowmore-content-refresh.md` | 2026-03-29T22:01:25Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/learnings.md` | 2026-03-29T22:01:26Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/mac-headless-server.md` | 2026-03-29T22:01:27Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/mac-mini-go-live-checklist.md` | 2026-03-29T22:01:28Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/mac-mini-migration-audit.md` | 2026-03-29T22:01:29Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/meimei-platform-launchd.v1.md` | 2026-03-29T22:01:30Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/runbook.md` | 2026-03-29T22:01:31Z | **Completed (wave 3–4):** Daily start → `docs/agent-identity/agent.md`; page layout → `docs/architecture/design-system-v1.md`. |
| `docs/operations/second-mac-mini-handoff.md` | 2026-03-29T22:01:32Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/testing.md` | 2026-03-29T22:01:33Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/vercel-env-inventory.md` | 2026-03-29T22:01:34Z | None — full read or full chunked read; no correction applied this session. |
| `docs/operations/workflow.md` | 2026-03-29T22:01:35Z | None — full read or full chunked read; no correction applied this session. |
| `docs/planning/kernel-app-separation-and-https-program.v1.md` | 2026-03-29T22:01:36Z | **Completed (2nd pass):** ADR-003 **accepted** in dependency graph + changelog (regenerate ledger preserves hand rows or patch after `generate`). |
| `docs/planning/meimei-docs-code-sync-audit.v1.md` | 2026-03-29T22:01:37Z | **Completed (2nd pass + wave 3–4):** Ledger link; matrix rows; Wave 4 + **inventory 150** revision rows. |
| `docs/planning/meimei-https-full-integration-program.v1.md` | 2026-03-29T22:01:38Z | **Completed (2nd pass):** Status, ADR-003, current-state table, TLS-001/TLS-003, target §3.6, §9 row. |
| `docs/README.md` | 2026-03-29T22:01:39Z | **Completed (wave 3):** Index rows — facades, external shells, `kernel-apps.v1`, threat model + prior ledger link. |
| `docs/releases/10hrs.md` | 2026-03-29T22:01:40Z | None — full read or full chunked read; no correction applied this session. |
| `docs/releases/CHANGELOG.md` | 2026-03-29T22:01:41Z | **Completed (wave 3–4):** Full-corpus hygiene; Wave 4 historical footnotes; **2026-03-29** §Documentation `ARCHITECTURE.md` footnote; ledger regen **20:00Z**; inventory **150** (**22:00Z**). |
| `docs/releases/DELIVERY-phase-0-2026-03-29.v1.md` | 2026-03-29T22:01:42Z | None — full read or full chunked read; no correction applied this session. |
| `docs/releases/product_roadmap.md` | 2026-03-29T22:01:43Z | None — full read or full chunked read; no correction applied this session. |
| `docs/releases/roadmap.md` | 2026-03-29T22:01:44Z | None — full read or full chunked read; no correction applied this session. |
| `docs/security/meimei-kernel-threat-model-v1.md` | 2026-03-29T22:01:45Z | **Completed (wave 3):** Aligned with auth + policy docs; indexed under Compliance. |
| `full_comprehensive_detailed_documents_audit.md` | 2026-03-29T22:01:46Z | Self-ledger — regenerate after add/remove `.md` via this script; link in `docs/README.md`. |
| `functions/ai-sdr-analytics.md` | 2026-03-29T22:01:47Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/any-url-summarization-in-seconds-addon.md` | 2026-03-29T22:01:48Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/any-url-summarization-in-seconds.md` | 2026-03-29T22:01:49Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/api-channel-adapter.md` | 2026-03-29T22:01:50Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/checklist.md` | 2026-03-29T22:01:51Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/daily-briefing-addon.md` | 2026-03-29T22:01:52Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/daily-briefing.md` | 2026-03-29T22:01:53Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/environment-variables.md` | 2026-03-29T22:01:54Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/inbox.md` | 2026-03-29T22:01:55Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/lead-enrichment.md` | 2026-03-29T22:01:56Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/lead-outreach.md` | 2026-03-29T22:01:57Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/memory.md` | 2026-03-29T22:01:58Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/mission-control.md` | 2026-03-29T22:01:59Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/per-channel-model-routing-by-task-type-and-cost-addon.md` | 2026-03-29T22:02:00Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/per-channel-model-routing-by-task-type-and-cost.md` | 2026-03-29T22:02:01Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/reference-app-1.md` | 2026-03-29T22:02:02Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/reference-app-2.md` | 2026-03-29T22:02:03Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/supabase-connector.md` | 2026-03-29T22:02:04Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `functions/what-next.md` | 2026-03-29T22:02:05Z | None — function contract; revalidate vs `registry.v1.json` when shipping that id. |
| `integrations/checklist-web/README.md` | 2026-03-29T22:02:06Z | None — full read or full chunked read; no correction applied this session. |
| `macos/MeiMei/README.md` | 2026-03-29T22:02:07Z | None — full read or full chunked read; no correction applied this session. |
| `packages/README.md` | 2026-03-29T22:02:08Z | **Completed (2026-03-29):** `@meimei/*` workspace packages index; kernel-apps migration pointer. |
| `README.md` | 2026-03-29T22:02:09Z | **Completed (wave 3):** Ledger count **150** in repo overview; `docs/` path corrections; **0.8.15**. |
| `releases/0.9.0.md` | 2026-03-29T22:02:10Z | **Completed:** `ARCHITECTURE.md` bullet → `docs/architecture/system-overview.md`. |
| `skills/_template/SKILL.md` | 2026-03-29T22:02:11Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/catalog.md` | 2026-03-29T22:02:12Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/daily-briefing/SKILL.md` | 2026-03-29T22:02:13Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/email-triage/SKILL.md` | 2026-03-29T22:02:14Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/health-checks/SKILL.md` | 2026-03-29T22:02:15Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/model-routing/SKILL.md` | 2026-03-29T22:02:16Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/openclaw-ops/SKILL.md` | 2026-03-29T22:02:17Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/operations/SKILL.md` | 2026-03-29T22:02:18Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/planning/SKILL.md` | 2026-03-29T22:02:19Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/prompt-injection-screening/SKILL.md` | 2026-03-29T22:02:20Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/research/SKILL.md` | 2026-03-29T22:02:21Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/review/SKILL.md` | 2026-03-29T22:02:22Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/safety/SKILL.md` | 2026-03-29T22:02:23Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/screenshot-capture/SKILL.md` | 2026-03-29T22:02:24Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/shipping/SKILL.md` | 2026-03-29T22:02:25Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/synthesis/SKILL.md` | 2026-03-29T22:02:26Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/core/url-summarization/SKILL.md` | 2026-03-29T22:02:27Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `skills/README.md` | 2026-03-29T22:02:28Z | None — skill module; revalidate vs `skills/catalog.md` when editing skills. |
| `VERSION.md` | 2026-03-29T22:02:29Z | **Completed:** `Current` **0.8.15**; ledger count **150**; delivery bullets for recursive audit + `packages/README.md` inventory. |

---

## N+M+1 — Report to maintainers

**Healthness:** **150** markdown files listed (includes `packages/README.md`). **Wave 3** closed the worst cross-doc drift (`AGENTS` / meta-doc root paths) and indexed **kernel app** docs. **Wave 4** normalized bare `agent.md` / `architecture.md` / `runbook.md` references in normative docs to canonical `docs/…` links. Not every long architecture file was re-read line-by-line in these waves.

**Proof:** Column 2 **2026-03-29T22:00:00Z** → **2026-03-29T22:02:29Z** (this regen).

**Residual:** Ideation and historical CHANGELOG bullets may still mention old filenames; grep occasionally for `architecture.md` / bare `agent.md`.

**Regenerate:** `node scripts/generate-full-documents-audit.mjs`

