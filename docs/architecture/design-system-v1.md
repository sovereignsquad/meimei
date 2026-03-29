# Design System v1

Issue: `mvp-factory-control#723`

## Purpose

Define one centralized UI system for `agent.meimei` so all pages and miniapps share:

- one token model (theme + spacing + typography + radius + shadows)
- one component module set (cards, flashcards, nav chips, buttons, panels, modal, form fields)
- one runtime style source (`public/styles/design-system.css`)

## Canonical source of truth

- Global stylesheet: `public/styles/design-system.css`
- **Operator overrides (optional):** dynamic **`GET /styles/operator-chrome.css`** — merged nav chip accents + `body[data-theme="…"]` tokens from `data/operator-chrome.v1.json` (see [`meimei-docs-code-sync-audit.v1.md`](../planning/meimei-docs-code-sync-audit.v1.md)). Shells link this **after** the base stylesheet so overrides win.
- Server integration: `dashboard/server.mjs` (static asset paths prefixed with `browserPathForNormalized` when `MEIMEI_PUBLIC_PREFIX` is set)
- **Page layout (order, row breaks, column span, desktop column count):** `config/page-layout.v1.json` — loaded/merged by `dashboard/lib/page-layout.mjs`; CSS for the grid lives in the stylesheet above (not in the JSON).

No page should hardcode full style systems inline. New pages and miniapps must consume centralized classes/tokens. **Do not** invent ad hoc full-page grids; add named blocks to the page-layout model and render them through `buildLayoutFlowHtml` (see [Global layout system](#global-layout-system)).

## Theme model

Theme is selected per page via `data-theme` on `<body>`. **Primary** values (also what the operator chrome editor controls for page chrome):

| `data-theme` | Typical use |
|--------------|-------------|
| `meimei` | Default MeiMei product shell (e.g. home `/`) — blue accent |
| `dashboard` | Gold accent for “Dashboard” nav destination context |
| `admin` | Admin / settings |
| `apps` | Apps catalog and most app miniapp shells |
| `tools` | Tools catalog and tool-heavy pages (routing, system monitor, …) |
| `knowmore` | knowmore catalog |

**Legacy aliases** in CSS (`green`, `blue`, `orange`, `red`) remain for old bookmarks or external shells; prefer the primary keys above for new pages.

Theme tokens resolve these variables (among others):

- `--accent`
- `--accent-2`
- `--card-border`
- `--surface-modal`
- `--surface-terminal`
- `--surface-code`
- `--text-code`

Nav menu chips use **`--chip-accent`** per `.nav-chip.nav-dest-*` (overridable via operator chrome).

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
- Section chips: `.nav-chip.nav-dest-apps`, `.nav-dest-tools`, `.nav-dest-dashboard`, `.nav-dest-knowmore`, `.nav-dest-admin` (icon + `--chip-accent` border/hover/active)

Global nav items (in order): **Apps**, **Tools**, **Dashboard**, **knowmore**, **Admin**. OpenClaw is **not** a menu row (gateway remains an under-the-hood / scripts concern).

Mobile behavior is standardized:

- at `<=900px`, nav uses a toggle + collapsed vertical list
- open state uses `.nav-actions.is-open`
- desktop (`>=901px`) keeps nav open horizontally

Inactive section chips use a tint of `--chip-accent`; see `public/styles/design-system.css` (and optional `operator-chrome.css` overrides).

### Shared surface primitives

- Shell: `.shell`
- Standard card: `.card`
- Section container: `.section`
- Result card: `.result-card`
- Panel: `.panel`
- Input field group: `.field`
- Buttons: `.button`, `.button.secondary`, `.button.good`, `.button.warn`
- Modal: `.modal-backdrop`, `.modal`

## Global layout system

All **top-level page chrome** under `.shell` (except the shared top nav / topbar where applicable) should flow through one responsive grid so width and reading order stay consistent across dashboard, admin, knowmore, and miniapps.

### Behavior

- **Small (&lt;640px):** one column (`--layout-cols-sm: 1`).
- **Tablet (≥640px and &lt;1024px):** two columns (`--layout-cols-md: 2`).
- **Desktop (≥1024px):** `N` columns (`--layout-cols-lg`), default **3**, operator-configurable **3–10** via **Admin → Page layout → Desktop columns** (persisted in `config/page-layout.v1.json`).

### CSS building blocks

| Class | Role |
|--------|------|
| `.layout-flow` | Grid container; set inline style `--layout-cols-sm`, `--layout-cols-md`, `--layout-cols-lg` (server supplies `lg` from saved desktop column count). |
| `.layout-box` | One reorderable block; carries `data-layout-box="<id>"` for debugging. |
| `.layout-break` | Full-width zero-height row break so the next box starts on a new row (`grid-column: 1 / -1`). |
| `.layout-span-md-1`, `.layout-span-md-2` | Max horizontal span on tablet (capped at 2). |
| `.layout-span-lg-1` … `.layout-span-lg-10` | Span on desktop (server picks class so span ≤ min(10, desktop columns)). |

Child boxes use `minmax(0, 1fr)` tracks so wide content (tables, pre) scrolls inside cells instead of blowing the viewport.

### Data + server wiring

- **Defaults and merge rules:** `dashboard/lib/page-layout.mjs` (`loadPageLayoutMerged`, `buildLayoutFlowHtml`, `pageBoxMeta`, `defaultItemsForPage`).
- **Persistence:** `config/page-layout.v1.json` (version `v1`); **GET/POST** `/api/page-layout` for the admin editor and tooling.
- **Admin UI:** **Page layout** section — pick page, set desktop columns, drag reorder, unit width radios, **New line**, **Save layout**.

### `.grid` vs `.layout-flow`

- **`.layout-flow`** — **page-level** composition: ordered blocks, responsive column count, optional row breaks.
- **`.grid`** — **legacy / inner** two-column helper (e.g. admin forms, miniapp result **panel** grids). Still valid **inside** a `.layout-box` or `.card`; do not use `.grid` alone as the only full-page wrapper for a single full-width section (that pattern was replaced by `.layout-flow`).

### Adding a new page or miniapp surface

1. Register **box ids** and human labels in `pageBoxMeta` / `defaultItemsForPage` in `dashboard/lib/page-layout.mjs`.
2. Render HTML fragments keyed by those ids; call `buildLayoutFlowHtml(layoutDoc, pageKey, fragments, escapeAttr)` from `dashboard/server.mjs`.
3. Add any new layout CSS to `public/styles/design-system.css` (prefer tokens; avoid one-off magic numbers unless documented here).
4. Extend the admin page picker if a new `pageKey` should appear in **Page layout**.

## Miniapp integration rule

Every new miniapp page must:

1. Include `public/styles/design-system.css` **and** link **`/styles/operator-chrome.css`** after it (use the same prefixed URL as other static assets — `shellStyleDeps()` in `server.mjs` supplies both for platform shells)
2. Set `data-theme` on `<body>`
3. Reuse design-system components/classes rather than introducing page-local style systems
4. Participate in the **global layout system** for shell content: split the page into named fragments (e.g. `topbar`, `main`) and render via `buildLayoutFlowHtml` with `miniapp:<registry-id>` as `pageKey` unless a dedicated layout page key is documented
5. Call dashboard APIs using the **registry-derived API path** interpolated server-side (same pattern as existing miniapps), not hardcoded strings — paths are contract-shaped and may include a `/dashboard` prefix stripped for the local server (`dashboard/lib/miniapp-registry.mjs` → `serverApiPath`)
6. **Dashboard function catalog** (home / Apps flashcards) must come from `functions/registry.v1.json` via `dashboard/lib/miniapp-registry.mjs` — do not duplicate titles, descriptions, or routes in `dashboard/server.mjs`

## Safety + state rules

- Do not use raw `innerHTML` for dynamic card content.
- Build dynamic card DOM with `createElement` + `textContent`.
- Use class/state toggles (e.g. `.is-open`) for visibility behavior instead of direct style mutation.

## Documentation + versioning requirement

Any UI module/token change must update:

- `design-system-v1.md` (this file)
- [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) (Unreleased section)
- [`VERSION.md`](../../VERSION.md) (current version metadata when released)

## Release policy

- Backward-compatible visual refinements: patch
- New component modules/tokens/theme model updates: minor
- Breaking class/token removals: major
