# AGENTS.md

## Operating rules

- Treat this repository as the primary workspace for `agent.meimei`.
- Use the docs in this repo first for project decisions.
- Prefer small, bounded changes that preserve intent.
- Keep skill work in `skills/` and document work in the top level docs.

## Working model

- OpenClaw orchestrates execution.
- OC supplies intent, approvals, and review.
- The repo is the durable memory surface.

## GitHub (mvp-factory-control)

- **Approved:** Agents may use the authenticated **`gh` CLI** (issues, PRs, labels, projects, etc.) when OC has cleared the action for that task.
- Canonical issue tracker for product work: **`moldovancsaba/mvp-factory-control`**. Board: [Project 1](https://github.com/users/moldovancsaba/projects/1).

## What to read first

- `README.md`
- `agent.md`
- `architecture.md`
- `skills/catalog.md`
- `runbook.md`
- `docs/README.md` (documentation map) and `documentation-audit.md` when changing or adding many `.md` files

