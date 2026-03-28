# Documentation audit — agent.meimei markdown corpus

**Date:** 2026-03-28  
**Scope:** All `*.md` files under the repository (84 files at audit time), excluding transient editor noise.  
**Goal:** Surface overlap, staleness risk, and a **practical** path to a unified doc system without breaking OC/repo conventions.

---

## Executive summary

| Finding | Severity |
|--------|----------|
| **~55+ root-level `.md` files** (plus `skills/**`) — discovery is hard; search hits many parallel “roadmaps,” ideation dumps, and meta-docs. | High |
| **Duplicate or overlapping roles:** `roadmap.md` vs `product_roadmap.md`, `tasks.md` vs board vs `product_roadmap` priorities, `agent.md` vs `IDENTITY.md` / `SOUL.md` / `MEMORY.md`, `doc_meimei.md` as a *meta* index vs `README.md`. | High |
| **Time-bound / inventory docs** (`agent.meimei.ideabank.*`, board line counts, issue ranges) **rot** unless someone owns refresh; they read authoritative but drift. | Medium |
| **Large ideation corpora** (`10hrs.md`, `ice_meimei.md`, `idea-support-map.md`) are valuable **backlog intelligence** but clutter **operator** search if kept at repo root. | Medium |
| **Canonical engineering docs** (`architecture.md`, `design-system-v1.md`, `miniapp-contract-v1.md`, `runbook.md`, `CHANGELOG.md`) are in good shape relative to code; link graph from `README.md` is incomplete. | Low (structure) |

**Recommendation:** Treat docs as **layers** (entry → operations → product → governance → archive). Move or namespace **archive/ideation** first; add **`docs/README.md` as a map**; keep **`README.md`, `AGENTS.md`, `agent.md`** at root for tooling expectations.

---

## Inventory by tier

### Tier A — Entry & daily use (keep at repository root)

| File | Role |
|------|------|
| `README.md` | Project front door |
| `AGENTS.md` | AI/agent operating rules for this workspace |
| `agent.md` | MeiMei identity & collaboration contract |
| `runbook.md` | Operator procedures |
| `CHANGELOG.md` | Shipped history |
| `VERSION.md` | Current line/version/issue mapping |

**Action:** Expand `README.md` “What is in the repo” with a **single link** to `documentation-audit.md` or future `docs/README.md` map (not a full duplicate list).

### Tier B — Engineering & UX contracts (keep at root *or* under `docs/engineering/` in a later phase)

| File | Role |
|------|------|
| `architecture.md` | System shape |
| `design-system-v1.md` | Global UI + layout system |
| `miniapp-contract-v1.md` | Miniapp schema |
| `function-lifecycle.md` | How functions ship |
| `model-routing-spec.md` | Routing policy |
| `project-vocabulary-v1.md` | Wording rules |
| `workflow.md` | Idea → delivery flow |
| `testing.md`, `security.md`, `definition-of-done.md` | Quality & safety |

**Action:** No merge required; ensure `architecture.md` links stay aligned when files move.

### Tier C — Governance & compliance specs (often `*-v1.md`)

Frozen-style specs: channel adapters, handoff, release gates, policy, audit, telemetry, WhatsApp parity, iMessage live bridge, etc.

**Action:** Consider `docs/governance/` or `docs/specs/` **only** when ready to mass-update cross-links; high churn cost.

### Tier D — Product planning (overlap risk)

| File | Notes |
|------|--------|
| `roadmap.md` | **Phased** foundation/runtime/multi-channel — stable, abstract |
| `product_roadmap.md` | **Executive** Apps/Tools, issues, board link — **most current for product** |
| `tasks.md` | Short execution bullets — often **stale** vs board |

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
| `doc_meimei.md` | **Recommended doc set** (generic template); overlaps `README` + `AGENTS` pointers — risk of **two competing maps** |

**Action:** **Merge** into `docs/README.md` (when created) or trim `doc_meimei.md` to a single paragraph: “See `documentation-audit.md`.”

### Tier G — Short identity fragments (merge candidates)

| File | Content |
|------|---------|
| `IDENTITY.md` | Name, product, vibe |
| `SOUL.md` | Tone & behavior bullets |
| `MEMORY.md` | Four durable bullets |
| `USER.md` | OC operator addressing convention |

**Action:** Fold into **`agent.md`** sections (Identity, Voice, Durable context) **or** keep only if external tooling requires separate files; document in `agent.md` frontmatter which files are authoritative.

### Tier H — Misc / situational

| File | Notes |
|------|--------|
| `HEARTBEAT.md` | Ultra-short checklist — OK; link from `runbook` or OC playbooks |
| `learnings.md` | Lessons — keep; link from README map |
| `issue-merge-walkthrough.md`, `issue-quality-standard.md`, `issue-ready-gate-checklist.md` | Governance — keep; could live under `docs/governance/issues/` later |
| `mac-mini-migration-audit.md`, `mac-mini-go-live-checklist.md`, `second-mac-mini-handoff.md` | **Same theme** — candidate **single** `docs/migration/mac-mini.md` with anchors |
| `vercel-env-inventory.md` | Environment-specific — `docs/infra/` or leave root with label |
| `naming-conventions.md`, `TOOLS.md` | Support docs — namespace or link from catalog |

### Tier I — `functions/*.md` & `skills/**`

Product function specs and skills: **correct location**; avoid duplicating registry fields in prose (point to `functions/registry.v1.json`).

### Tier J — `macos/MeiMei/README.md`

Local app; keep next to code.

### Tier K — `ai-runtime-audit.md`

Runtime truth table for **OpenClaw vs Ollama vs rules vs sample data**; keep at repo root next to `architecture.md`; update when adding miniapps or changing `dashboard/server.mjs` AI paths.

---

## Staleness patterns to watch

1. **Issue lists and “created on board” ranges** — change weekly; if kept, need **owner + review date** in file header.  
2. **`VERSION.md` vs `package.json` vs `CHANGELOG`** — must bump together at release.  
3. **Miniapp copy** duplicated in `server` (forbidden) vs **registry** (allowed) — already enforced in code; docs should never tell contributors to edit catalog copy in `server.mjs`.  
4. **URLs** — `meimei.localhost:8443`, port `3030`, paths `/apps`, `/tools` — verify against `config/dashboard-surface.v1.json` when paths change.

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
