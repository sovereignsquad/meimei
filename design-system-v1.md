# Design System v1

Issue: `mvp-factory-control#723`

## Purpose

Define one centralized UI system for `agent.meimei` so all pages and miniapps share:

- one token model (theme + spacing + typography + radius + shadows)
- one component module set (cards, flashcards, nav chips, buttons, panels, modal, form fields)
- one runtime style source (`public/styles/design-system.css`)

## Canonical source of truth

- Global stylesheet: `public/styles/design-system.css`
- Server integration: `dashboard/server.mjs`

No page should hardcode full style systems inline. New pages and miniapps must consume centralized classes/tokens.

## Theme model

Theme is selected per page via `data-theme` on `<body>`:

- `green` -> dashboard surfaces
- `blue` -> knowmore surfaces
- `orange` -> admin surfaces
- `red` -> reserved for OpenClaw or red-themed pages

Theme tokens resolve these variables:

- `--accent`
- `--accent-2`
- `--card-border`
- `--surface-modal`
- `--surface-terminal`
- `--surface-code`
- `--text-code`
- `--brand-openclaw-*`

## Core component modules

### Flashcards

- Grid: `.ds-flashcard-grid`
- Card: `.ds-flashcard`
- Kind label: `.ds-flashcard-kind`
- Title: `.ds-flashcard-title`
- Content: `.ds-flashcard-content`

Required structure:

1. kind
2. title
3. content

UI wording style:

- App cards: `APP`, `<app name>`, `<summary>`
- Issue cards: `ISSUE #<id>`, `<issue title>`, `<summary>`

### Navigation

- Nav container: `.nav-actions`
- Mobile toggle: `.nav-toggle`
- Nav item: `.nav-chip`
- Active nav item: `.nav-chip.active`
- OpenClaw nav item: `.nav-chip.openclaw`

Mobile behavior is standardized:

- at `<=900px`, nav uses a toggle + collapsed vertical list
- open state uses `.nav-actions.is-open`
- desktop (`>=901px`) keeps nav open horizontally

OpenClaw branding is component-scoped by default (`.nav-chip.openclaw`) and can also be represented as a full page theme via `data-theme="red"` when needed.

### Shared surface primitives

- Shell: `.shell`
- Standard card: `.card`
- Section container: `.section`
- Result card: `.result-card`
- Panel: `.panel`
- Input field group: `.field`
- Buttons: `.button`, `.button.secondary`, `.button.good`, `.button.warn`
- Modal: `.modal-backdrop`, `.modal`

## Miniapp integration rule

Every new miniapp page must:

1. Include `public/styles/design-system.css`
2. Set `data-theme` on `<body>`
3. Reuse design-system components/classes rather than introducing page-local style systems

## Safety + state rules

- Do not use raw `innerHTML` for dynamic card content.
- Build dynamic card DOM with `createElement` + `textContent`.
- Use class/state toggles (e.g. `.is-open`) for visibility behavior instead of direct style mutation.

## Documentation + versioning requirement

Any UI module/token change must update:

- `design-system-v1.md` (this file)
- `CHANGELOG.md` (Unreleased section)
- `VERSION.md` (current version metadata when released)

## Release policy

- Backward-compatible visual refinements: patch
- New component modules/tokens/theme model updates: minor
- Breaking class/token removals: major
