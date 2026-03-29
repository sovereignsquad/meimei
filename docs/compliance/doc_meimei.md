# Agentic Work Docs for Agent MeiMei

**Repo note (`agent.meimei`):** Below lists **generic** filenames. In this repository, many live under **`docs/`** (e.g. `docs/agent-identity/agent.md`, `docs/architecture/system-overview.md`, `docs/operations/runbook.md`). See [`docs/README.md`](../README.md) and [`full_comprehensive_detailed_documents_audit.md`](../../full_comprehensive_detailed_documents_audit.md).

This is the recommended document set for a clean, maintainable agentic workspace. The names below use common industry conventions where possible, and map your examples to the standard form.

## Core Repository Docs

- `README.md` - top-level overview, purpose, quick start, and links to the rest of the docs.
- `agent.md` - agent identity, capabilities, operating rules, and behavior contract.
- `architecture.md` - system architecture, boundaries, major components, and data flow.
- `architecture-decisions/` or `adr/` - architecture decision records, one file per decision.
- `learnings.md` - lessons learned, postmortems, and reusable operational knowledge.
- `definition-of-done.md` - acceptance bar for shipping work. This is the standard name for `DoD.md`.
- `release-notes.md` or `CHANGELOG.md` - release history and user-visible changes. `CHANGELOG.md` is the more standard choice.
- `roadmap.md` - planned work, sequencing, and priorities.
- `tasks.md` - execution backlog or work queue.
- `spec.md` or `requirements.md` - functional requirements and product intent.

## Agentic Execution Docs

- `prompting.md` - prompt patterns, guardrails, and reusable instructions.
- `workflow.md` - how work moves from idea to implementation to verification.
- `runbook.md` - operational procedures for recurring or risky tasks.
- `ops.md` - short operational reference for day-to-day maintenance.
- `testing.md` - test strategy, test commands, and quality gates.
- `evaluation.md` - benchmark setup, scoring, and model/workflow evaluation.
- `benchmarks.md` - benchmark cases and regression suite notes.
- `observability.md` - logs, metrics, traces, and health signals.
- `security.md` - threat model, secrets handling, permissions, and safe execution rules.

## Content And Knowledge Docs

- `notes.md` - short-form working notes and scratch context.
- `learned.md` or `learnings.md` - prefer `learnings.md` for durable lessons.
- `glossary.md` - project-specific terms and definitions.
- `faq.md` - repeated questions and canonical answers.
- `links.md` - trusted references and source links.

## Delivery And Planning Docs

- `requirements.md` - what must be true before implementation starts.
- `design.md` - solution design for a specific feature or system.
- `implementation-plan.md` - step-by-step delivery sequence.
- `decision-log.md` - lightweight record of important product or technical calls.
- `risk-register.md` - known risks, mitigations, and open concerns.
- `release-checklist.md` - launch checklist before shipping.

## Naming Guidance

Use these conventions:

- Prefer kebab-case or standard camel-free lowercase filenames for docs, e.g. `definition-of-done.md`, `release-notes.md`, `architecture.md`.
- Prefer `CHANGELOG.md` over `release_notes.md` for general release history.
- Prefer `definition-of-done.md` over `DoD.md` for clarity and searchability.
- Prefer `adr/0001-title.md` for decision records instead of a single monolithic decision file.
- Prefer `learnings.md` over `learned.md` when the file is meant to accumulate durable operational lessons.
- Prefer `security.md` over scattered security notes.
- Prefer `runbook.md` for operational procedures and `workflow.md` for process flow.
- If you need a layout or structure spec, use `layout-spec.md` or `document-grammar.md` rather than `layout_grammar.md`.

## Recommended Minimum Set

If you want the smallest useful set for agentic work, keep these first:

- `README.md`
- `agent.md`
- `architecture.md`
- `adr/`
- `definition-of-done.md`
- `runbook.md`
- `security.md`
- `testing.md`
- `learnings.md`
- `CHANGELOG.md`
- `roadmap.md`
- `tasks.md`

## Practical Rule

If a document explains what the system is, how it works, how to change it, how to verify it, or how to operate it, it belongs in this doc set.

