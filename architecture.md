# Architecture

## Overview

`agent.meimei` is a markdown-first OpenClaw workspace with a skill-centric operating model.

The architecture is intentionally simple:

- `docs/` define the human contract.
- `skills/` define reusable agent behavior.
- OpenClaw loads the workspace and skill packs.
- OC coordinates the work and approves the important boundaries.

## Core layers

### 1. Identity layer

The identity layer defines who MeiMei is, how she behaves, and how she collaborates with OC.

Primary files:

- `agent.md`
- `security.md`
- `definition-of-done.md`

### 2. Operating layer

The operating layer defines how work enters the system and how it moves to completion.

Primary files:

- `workflow.md`
- `function-lifecycle.md`
- `runbook.md`
- `testing.md`
- `roadmap.md`
- `tasks.md`

### 3. Skill layer

The skill layer defines reusable task behavior.

Skills live under `skills/` as OpenClaw-compatible skill folders with `SKILL.md` frontmatter.

### 4. Collaboration layer

OpenClaw is the runtime and OC is the control partner.

The collaboration boundary is:

- OpenClaw manages sessions, skills, and execution flow.
- OC defines priorities, approves sensitive moves, and reviews outputs.

## Skill scale model

The system is designed to support hundreds of skills by using:

- a consistent naming scheme
- a shared skill template
- a catalog index
- clear scope separation
- one skill per capability cluster

## Recommended directory shape

```text
agent.meimei/
  agent.md
  architecture.md
  definition-of-done.md
  README.md
  workflow.md
  runbook.md
  security.md
  testing.md
  roadmap.md
  tasks.md
  learnings.md
  CHANGELOG.md
  skills/
    catalog.md
    _template/
      SKILL.md
    core/
      ...
```

## Design principles

- Markdown is the durable control plane.
- Skills are composable and narrow.
- Operational decisions are explicit and documented.
- The project should be easy to understand before it is easy to automate.
