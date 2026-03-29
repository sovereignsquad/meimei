# Documentation audit — agent.meimei markdown corpus

**Date:** 2026-03-28 (original pass); **superseded inventory:** 2026-03-29  
**Scope (original):** All `*.md` files under the repository (**84** files at that time).  
**Scope (current):** **149** repo-owned markdown files (excluding `node_modules/**`) — canonical table with **per-file audit timestamps** in **[`full_comprehensive_detailed_documents_audit.md`](../../full_comprehensive_detailed_documents_audit.md)** at repo root.  
**Goal:** Surface overlap, staleness risk, and a **practical** path to a unified doc system without breaking OC/repo conventions.

**Wave 4 (2026-03-30):** Tier tables below are updated so **canonical paths** match today’s tree (**`docs/…`**). Older prose that said “root `agent.md`” described a **prior layout**.

---

## Executive summary

| Finding | Severity |
|--------|----------|
| **~55+ root-level `.md` files** (plus `skills/**`) — discovery is hard; search hits many parallel “roadmaps,” ideation dumps, and meta-docs. | High |
| **Duplicate or overlapping roles:** `docs/releases/roadmap.md` vs `docs/releases/product_roadmap.md`, `docs/governance/tasks.md` vs board vs product roadmap priorities, `docs/agent-identity/agent.md` vs `IDENTITY.md` / `SOUL.md` / `MEMORY.md`, `doc_meimei.md` as a *meta* index vs `README.md`. | High |
| **Time-bound / inventory docs** (`agent.meimei.ideabank.*`, board line counts, issue ranges) **rot** unless someone owns refresh; they read authoritative but drift. | Medium |
| **Large ideation corpora** (`10hrs.md`, `ice_meimei.md`, `idea-support-map.md`) are valuable **backlog intelligence** but clutter **operator** search if kept at repo root. | Medium |
| **Canonical engineering docs** live under **`docs/`** (e.g. `docs/architecture/system-overview.md`, `design-system-v1.md`, `miniapp-contract-v1.md`, `docs/operations/runbook.md`, `docs/releases/CHANGELOG.md`); link graph from root `README.md` is much improved but still grep occasionally for bare legacy names. | Low (structure) |

**Recommendation:** Treat docs as **layers** (entry → operations → product → governance → archive). Move or namespace **archive/ideation** first; add **`docs/README.md` as a map**; keep **`README.md`**, **`docs/governance/AGENTS.md`**, and identity under **`docs/agent-identity/`** (some tooling still expects `AGENTS.md` under `docs/governance/`).

---

## Inventory by tier

### Tier A — Entry & daily use

| Canonical path | Role |
|----------------|------|
| [`README.md`](../../README.md) | Project front door |
| [`docs/governance/AGENTS.md`](../governance/AGENTS.md) | AI/agent operating rules for this workspace |
| [`docs/agent-identity/agent.md`](../agent-identity/agent.md) | MeiMei identity & collaboration contract |
| [`docs/operations/runbook.md`](../operations/runbook.md) | Operator procedures |
| [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) | Shipped history |
| [`VERSION.md`](../../VERSION.md) | Current line/version/issue mapping |

**Action:** Root `README.md` should link [`docs/README.md`](../README.md) and [`full_comprehensive_detailed_documents_audit.md`](../../full_comprehensive_detailed_documents_audit.md).

### Tier B — Engineering & UX contracts (`docs/architecture/`, `docs/api/`, …)

| Canonical path | Role |
|----------------|------|
| [`docs/architecture/system-overview.md`](../architecture/system-overview.md) | System shape (product architecture) |
| [`docs/architecture/design-system-v1.md`](../architecture/design-system-v1.md) | Global UI + layout system |
| [`docs/architecture/miniapp-contract-v1.md`](../architecture/miniapp-contract-v1.md) | Miniapp schema |
| [`docs/architecture/function-lifecycle.md`](../architecture/function-lifecycle.md) | How functions ship |
| [`docs/architecture/model-routing-spec.md`](../architecture/model-routing-spec.md) | Routing policy |
| [`docs/architecture/project-vocabulary-v1.md`](../architecture/project-vocabulary-v1.md) | Wording rules |
| [`docs/operations/workflow.md`](../operations/workflow.md) | Idea → delivery flow |
| [`docs/operations/testing.md`](../operations/testing.md), [`docs/compliance/security.md`](security.md), [`docs/governance/definition-of-done.md`](../governance/definition-of-done.md) | Quality & safety |

**Action:** Prefer linking **`docs/…`** paths in new prose; avoid resurrecting root-only `architecture.md` as if it still lived at repo root.

### Tier C — Governance & compliance specs (often `*-v1.md`)

Frozen-style specs: channel adapters, handoff, release gates, policy, audit, telemetry, WhatsApp parity, iMessage live bridge, etc.

**Action:** Consider `docs/governance/` or `docs/specs/` **only** when ready to mass-update cross-links; high churn cost.

### Tier D — Product planning (overlap risk)

| File | Notes |
|------|--------|
| [`docs/releases/roadmap.md`](../releases/roadmap.md) | **Phased** foundation/runtime/multi-channel — stable, abstract |
| [`docs/releases/product_roadmap.md`](../releases/product_roadmap.md) | **Executive** Apps/Tools, issues, board link — **most current for product** |
| [`docs/governance/tasks.md`](../governance/tasks.md) | Short execution bullets — often **stale** vs board |

**Merge proposal (lightweight):**

- Keep **`product_roadmap.md`** as the **default product source**.
- **`roadmap.md`** → rename conceptually to “Delivery phases” or merge a **short “Phases” section** into `product_roadmap.md` and **archive** `roadmap.md` (or keep as stub that only points to product roadmap).
- **`tasks.md`** → either **delete** in favor of GitHub issues/projects or add banner: *“Superseded by board; kept for scratch only.”*

### Tier E — Ideabank & research (high noise in search)

| File | Notes |
|------|--------|
| `agent.meimei.ideabank.inventory.md` | Board/issue inventory — **dated**; verify before trusting counts |
| `agent.meimei.ideabank.audit.md` | Audit trail for ideabank |
| `agent.meimei.ideabank.operations-manual.md` | Ops for ideabank |
| `agent.meimei.ideabank.runbook.md` | Runbook slice |
| `10hrs.md` | Large transcript-derived worksheet |
| `ice_meimei.md` | ICE scoring table |
| `idea-support-map.md` | Issue dependency map |

**Action:** Move to **`docs/ideation/`** or **`archive/ideation/`** and add **`docs/ideation/README.md`** explaining freshness policy.

### Tier F — Meta / duplicate “index” docs

| File | Notes |
|------|--------|
| [`doc_meimei.md`](doc_meimei.md) | **Recommended doc set** (generic template); overlaps `README` + `AGENTS` pointers — risk of **two competing maps** |

**Action:** **`docs/README.md` exists** — keep `doc_meimei.md` as generic industry template + repo note; point operators at [`documentation-audit.md`](documentation-audit.md) + [`full_comprehensive_detailed_documents_audit.md`](../../full_comprehensive_detailed_documents_audit.md).

### Tier G — Short identity fragments (merge candidates)

| File | Content |
|------|---------|
| [`docs/agent-identity/IDENTITY.md`](../agent-identity/IDENTITY.md) | Name, product, vibe |
| [`docs/agent-identity/SOUL.md`](../agent-identity/SOUL.md) | Tone & behavior bullets |
| [`docs/agent-identity/MEMORY.md`](../agent-identity/MEMORY.md) | Four durable bullets |
| [`docs/agent-identity/USER.md`](../agent-identity/USER.md) | OC operator addressing convention |

**Action:** Fold into **`docs/agent-identity/agent.md`** sections **or** keep fragments if tooling requires them; document hierarchy in `agent.md`.

### Tier H — Misc / situational

| File | Notes |
|------|--------|
| [`docs/operations/HEARTBEAT.md`](../operations/HEARTBEAT.md) | Ultra-short checklist — OK; link from runbook or OC playbooks |
| [`docs/operations/learnings.md`](../operations/learnings.md) | Lessons — keep; link from README map |
| [`docs/governance/issue-merge-walkthrough.md`](../governance/issue-merge-walkthrough.md), [`issue-quality-standard.md`](../governance/issue-quality-standard.md), [`issue-ready-gate-checklist.md`](../governance/issue-ready-gate-checklist.md) | Governance — keep |
| [`docs/operations/mac-mini-migration-audit.md`](../operations/mac-mini-migration-audit.md), [`mac-mini-go-live-checklist.md`](../operations/mac-mini-go-live-checklist.md), [`second-mac-mini-handoff.md`](../operations/second-mac-mini-handoff.md) | **Same theme** — migration / go-live |
| [`docs/operations/vercel-env-inventory.md`](../operations/vercel-env-inventory.md) | Environment-specific inventory |
| [`docs/architecture/naming-conventions.md`](../architecture/naming-conventions.md), [`docs/agent-identity/TOOLS.md`](../agent-identity/TOOLS.md) | Support docs |

### Tier I — `functions/*.md` & `skills/**`

Product function specs and skills: **correct location**; avoid duplicating registry fields in prose (point to `functions/registry.v1.json`).

### Tier J — `macos/MeiMei/README.md`

Local app; keep next to code.

### Tier K — [`docs/compliance/ai-runtime-audit.md`](ai-runtime-audit.md)

Runtime truth table for **OpenClaw vs Ollama vs rules vs sample data**; update when adding miniapps or changing `dashboard/server.mjs` AI paths.

---

## Staleness patterns to watch

1. **Issue lists and “created on board” ranges** — change weekly; if kept, need **owner + review date** in file header.  
2. **`VERSION.md` vs `package.json` vs `CHANGELOG`** — must bump together at release.  
3. **Miniapp copy** duplicated in `server` (forbidden) vs **registry** (allowed) — already enforced in code; docs should never tell contributors to edit catalog copy in `server.mjs`.  
4. **URLs** — `meimei.localhost:8443`, dashboard `defaults.port`, paths `/apps`, `/tools` — verify against `config/dashboard-surface.v1.json` when paths change.

---

## Proposed target structure (phased)

**Phase 1 — No moves, only navigation** *(partially done 2026-03-28)*

- **`docs/README.md`** added: short map to core docs + link to this audit.  
- **`README.md`** and **`AGENTS.md`** link to the audit / map.

**Phase 2 — Isolate noise**

- Create **`docs/ideation/`**; `git mv` Tier E files there; add `docs/ideation/README.md` (purpose + last-reviewed).  
- Create **`docs/migration/`**; merge mac-mini trio into one doc **or** move all three and cross-link.

**Phase 3 — Consolidate planning**

- Resolve `roadmap.md` / `product_roadmap.md` / `tasks.md` per Tier D.  
- Merge `IDENTITY` / `SOUL` / `MEMORY` into `agent.md` **or** document hierarchy explicitly.

**Phase 4 — Optional deep rehome**

- `docs/specs/*.md` for `*-v1.md` governance (large link-update commit).

---

## Success criteria

- New contributor finds **architecture + design system + miniapp contract + runbook** in **≤2 clicks** from `README.md`.  
- Search for “roadmap” yields **one primary** product doc + optional phase doc.  
- Ideation/research docs **do not** appear beside governance specs in flat root search.  
- Each inventory-style doc has **`Updated:`** or **`Review by:`** or is archived.

---

## Next step (single PR suggestion)

1. Add **`docs/README.md`** (map).  
2. Move **`agent.meimei.ideabank.*`**, **`10hrs.md`**, **`ice_meimei.md`**, **`idea-support-map.md`** → **`docs/ideation/`** (update minimal links in `README` / `product_roadmap` if any).  
3. Add **`Updated`** headers to `tasks.md` or replace with pointer to board.

This audit file should be **updated** when major doc moves complete (date + changelog pointer).
