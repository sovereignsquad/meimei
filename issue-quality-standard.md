# Issue Quality Standard

Issue: `mvp-factory-control#697`

## Purpose

This standard defines the minimum issue quality required before implementation starts for `agent.meimei`.

The goal is consistent, implementation-ready work packages with clear acceptance and review evidence.

## Required Issue Sections

Every implementation issue must include:

- Objective
- Unified Context
- Problem
- Goal
- Scope
- Execution Prompt
- Implementation Expectations
- Scope / Non-Goals
- Constraints
- Acceptance Checks
- Dependencies
- Risks
- Delivery Artifact
- Developer Notes

## Ready-Gate Checklist

An issue is `Ready (NEXT)` only when all checks pass.

### 1) Clarity Gate

- [ ] objective is one sentence and concrete
- [ ] expected outcome is measurable
- [ ] problem statement is specific (not generic)

### 2) Scope Gate

- [ ] in-scope and non-goals are explicit
- [ ] boundaries prevent overlap with adjacent work
- [ ] dependencies are listed and linked

### 3) Contract Gate

- [ ] required interfaces/contracts are named
- [ ] acceptance checks are testable and observable
- [ ] delivery artifact list is specific enough to review

### 4) Safety and Governance Gate

- [ ] constraints include safety/review requirements where relevant
- [ ] escalation triggers are clear when decisions are blocked
- [ ] repo boundary is explicit:
  - code in `agent.meimei`
  - issue/board tracking in `mvp-factory-control`

### 5) Handoff Gate

- [ ] developer notes identify likely touched surfaces
- [ ] reviewer can validate completion without hidden assumptions
- [ ] next-phase follow-up is clear if this is incremental delivery

## Status Transition Rules

- Move to `Ready (NEXT)` only if all Ready-Gate checks pass.
- Move to `In Progress (NOW)` only when active implementation begins.
- Move to `Review` only after:
  - implementation is pushed
  - verification evidence is posted
  - board status reflects real phase

## Evidence Requirement for Review

Every delivered issue must include:

- commit hash
- changed file list
- validation commands run
- result summary (pass/fail + notes)

## Fast Rejection Rules

Reject issue quality immediately if any of the below is true:

- missing acceptance checks
- missing non-goals
- ambiguous ownership
- hidden dependency on undefined external systems
- contradictory scope language

## Mapping to Existing Standards

This standard complements:

- `definition-of-done.md`
- `testing.md`
- `workflow.md`
- `miniapp-contract-v1.md`

It does not replace them.
