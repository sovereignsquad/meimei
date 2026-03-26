# Sovereign Agent Role Taxonomy and Authority Matrix v1

Issue: `mvp-factory-control#705`

## Purpose

Define explicit role boundaries, authority limits, and handoff contracts for a sovereign multi-agent delivery team in `agent.meimei`.

## Role Taxonomy

Core delivery roles:

1. Planner
2. Architect
3. Implementer
4. Reviewer
5. Tester
6. Releaser

Human control role:

- OC (final authority for scope, approvals, and release decisions)

## Role Responsibilities

### Planner

- turns intent into bounded work packages
- defines objective, scope, and acceptance checks
- ensures issue quality and ready-gate completeness

### Architect

- defines implementation boundaries and interfaces
- selects integration points with existing contracts
- records key technical decisions and tradeoffs

### Implementer

- executes approved changes within scope
- updates docs/code and keeps behavior explicit
- provides implementation evidence and handoff notes

### Reviewer

- performs correctness and risk review
- validates contract alignment and non-regression
- rejects changes that violate scope or governance rules

### Tester

- validates acceptance criteria with explicit checks
- confirms failure behavior and observability signals
- reports residual risks and verification gaps

### Releaser

- confirms release gates and operational readiness
- performs or coordinates release steps
- publishes release evidence and rollback notes

## Authority Matrix

Decision classes:

- plan
- architecture
- implementation
- quality gate
- release

Authority levels:

- propose: can draft and recommend
- decide: can approve within role boundary
- veto: can block until conditions are met

### Matrix

- Planner: propose plan, decide planning scope, no release authority.
- Architect: propose architecture, decide interface shape, veto contract-breaking implementation.
- Implementer: propose implementation, decide low-level execution details inside approved scope, no release authority.
- Reviewer: decide review outcome, veto merge/release on correctness or governance violations.
- Tester: decide test pass/fail status, veto release on failed acceptance checks.
- Releaser: decide go/no-go when all mandatory gates pass, veto release on readiness gaps.
- OC: final override authority on scope and release decisions.

## Mandatory Handoff Contract

Every role handoff must include:

1. objective and scope boundary
2. acceptance checks and current status
3. known risks and unresolved questions
4. evidence links (commit, docs, validation output)

No role may pass work forward with implicit assumptions.

## Workflow Integration

Role sequence default:

1. Planner
2. Architect
3. Implementer
4. Reviewer
5. Tester
6. Releaser

Allowed parallelization:

- Architect and Planner can iterate together before implementation starts.
- Reviewer and Tester can run in parallel after implementation freeze.

Disallowed shortcuts:

- Implementer self-approving release
- Releaser bypassing failed test/review gates
- Architecture changes merged without architect/reviewer visibility

## Readiness Gates by Role

- Planner gate: issue-quality standard and ready-gate checklist pass.
- Architect gate: contracts/interfaces are explicit and aligned.
- Implementer gate: artifact complete with evidence and bounded scope.
- Reviewer gate: no critical correctness or governance violations.
- Tester gate: acceptance checks pass; failures are documented.
- Releaser gate: readiness checks and rollback notes are present.

## Failure and Escalation Rules

- any veto blocks forward progress until resolved or OC overrides
- unresolved cross-role conflict escalates to OC
- repeated policy violations require role reset and corrective plan

## Acceptance Checklist

- [ ] role boundaries are explicit and non-overlapping
- [ ] authority matrix defines propose/decide/veto responsibilities
- [ ] handoff contract is concrete and reusable
- [ ] workflow integration and forbidden shortcuts are explicit
- [ ] role gates and escalation behavior are testable and auditable
