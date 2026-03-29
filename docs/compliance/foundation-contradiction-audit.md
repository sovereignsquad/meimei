# Foundation Contradiction Audit

Issue: `mvp-factory-control#692`  
Scope: `agent.meimei` product repository

## Purpose

This document captures concrete contradictions between declared project truth and observed repository/runtime behavior.

It is intended to be a deterministic starting point for foundation remediation. Every finding includes:

- severity
- contradiction statement
- evidence
- impact
- remediation owner path

## Severity Scale

- `Critical`: creates false operational confidence or unsafe decisions.
- `High`: materially degrades delivery quality or onboarding accuracy.
- `Medium`: causes repeated friction, confusion, or maintenance overhead.
- `Low`: wording drift with limited direct execution impact.

## Contradiction Matrix

### C-001

- **2026-03-30 — Closed (historical):** The repository now has a full **`docs/`** tree; the contradiction below describes an **earlier** snapshot. Retained for audit trail only.
- Severity: `High` *(at time of finding)*
- Contradiction: Architecture claims a `docs/` directory defines the human contract, but no `docs/` directory exists in this repository.
- Evidence:
  - `architecture.md` states: "`docs/` define the human contract."
  - Repository layout contains root-level markdown docs, not `docs/`.
- Impact:
  - New contributors will look for a structure that does not exist.
  - Architecture references become non-actionable at first contact.
- Remediation:
  - Update architecture wording to reference root-level docs (or create/migrate to `docs/` and update all links).

### C-002

- Severity: `High`
- Contradiction: README declares foundation-only state while repository contains implemented runtime surfaces and operational scripts.
- Evidence:
  - `README.md` says: "This is the foundation layer only."
  - Repo includes production-like operational components (`dashboard/server.mjs`, API handlers, scripts, bootstrap paths).
- Impact:
  - Product maturity is understated; planning and prioritization are skewed.
  - Implementation progress can be misreported during delivery reviews.
- Remediation:
  - Replace "foundation layer only" with an accurate capability snapshot (implemented vs planned).

### C-003

- Severity: `High`
- Contradiction: Multiple docs use absolute machine-specific paths (`/Users/moldovancsaba/...`) inside repo-local references.
- Evidence:
  - `agent.meimei.ideabank.operations-manual.md`
  - `agent.meimei.ideabank.runbook.md`
  - `functions/daily-briefing.md`
- Impact:
  - Links break on any machine except one environment.
  - Documentation portability and onboarding reliability are damaged.
- Remediation:
  - Replace absolute paths with repo-relative links.

### C-004

- Severity: `Medium`
- Contradiction: Repo-level "source of truth" claim is broad, but governance artifacts and live runtime state can diverge without an enforced reconciliation gate.
- Evidence:
  - README claims repository is source of truth for operating rules and release discipline.
  - Existing health commands are present, but readiness aggregation and contradiction gating are not yet enforced as a single mandatory decision point.
- Impact:
  - Drift persists between docs/config/runtime until manually discovered.
  - Teams can ship based on stale assumptions.
- Remediation:
  - Adopt a single readiness gate command as release precondition.

### C-005

- Severity: `Medium`
- Contradiction: Issue and delivery governance is split across repositories, but in-repo docs still include external control references as if local anchors.
- Evidence:
  - Documentation references external control scripts with host-specific absolute paths.
- Impact:
  - Boundary between product repo and control repo is unclear in practice.
  - Cross-repo execution flows become fragile.
- Remediation:
  - Standardize cross-repo references to canonical GitHub URLs or explicit relative guidance.

## Execution Order

1. `C-003` absolute path cleanup (fastest, high impact)
2. `C-001` architecture directory-truth correction
3. `C-002` README state accuracy update
4. `C-005` cross-repo reference normalization
5. `C-004` readiness gate adoption and enforcement

## Done Criteria For Issue #692

- Contradictions are documented with explicit evidence and impact.
- Remediation ordering is clear and actionable.
- Teams can execute follow-up fixes without re-discovery work.

## Follow-up Links

- `mvp-factory-control#693` Unified readiness gate command
- `mvp-factory-control#684` Foundation reset baseline
