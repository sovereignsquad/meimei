# MeiMei Naming Conventions

These are the default naming rules for product functions and add-ons.

This document follows the rigid foundation:

- `function` is the canonical repo term for a user-facing surface.
- `miniapp` is the best user-facing synonym for the same surface.
- `add-on` is a product expansion of an existing function.
- `plugin` is a technical integration or extension point.
- `module` is an internal implementation unit.
- `widget` is a UI element inside a page.
- `feature` is a capability or behavior, not a surface.
- `applet` should be avoided unless mirroring an external system.

## Canonical Terms

- `function` is the canonical repo term.
- `miniapp` is the preferred user-facing synonym.

## Strict Vocabulary

These terms have fixed meanings in MeiMei:

- `function`: a user-facing product surface with one main route and one main action
- `miniapp`: the friendlier user-facing label for the same surface
- `add-on`: a documented expansion of an existing function, not a new function
- `plugin`: a technical integration or extension point that plugs into a function or runtime
- `module`: an internal implementation unit, not a user-facing product label
- `widget`: a UI element inside a page, not the page or product itself
- `feature`: a capability or behavior, not a surface
- `applet`: avoid unless an external system uses that word and we are mirroring it explicitly

## Forbidden Ambiguity

Do not use `widget`, `module`, `feature`, or `applet` as interchangeable replacements for `function` or `miniapp`.

Do not use `feature` to mean a surface, page, app, or route. A feature is a capability. A function is the surface that exposes it.

Do not mix terms inside the same doc, issue, UI flow, or route description.

If a term is used, it must carry the same meaning everywhere in that artifact.

## What To Use Where

- Repo docs: `function`
- Product docs: `function`
- Add-on docs: `add-on`
- Plugin docs: `plugin`
- User-facing labels: `miniapp` or `function`, but pick one per surface
- Route names: stable, slugged paths based on the function name
- Issue titles: plain English task title first, issue number second when needed
- Dashboard buttons: short, task-oriented labels

## Issue Language

In issues:

- use `function` when naming a user-facing surface or workflow card
- use `miniapp` only when the user-facing prose needs a friendlier label
- use `add-on` for an expansion of an existing function
- use `plugin` for technical integration points
- use `module` only for implementation structure
- use `widget` only for UI pieces inside a page
- use `feature` only when talking about capability, behavior, or the board field type

## Add-Ons And Plugins

Use `add-on` when the work extends an existing function but does not change its identity.

Use `plugin` when the work is a technical connector, adapter, or external integration point.

Use both only when the distinction matters:

- the add-on is the product story
- the plugin is the technical mechanism

## Naming Pattern For MeiMei Surfaces

Use one of these forms for the function surface itself:

- `Any-URL summarization in seconds`
- `Summarize URL`
- `Summary miniapp`

Prefer the longest name only for the first launch page and the shortest practical label in navigation.

## Route Pattern

- Function route: `/dashboard/<Function_Name>`
- Back path: `/dashboard/`
- API route: `/dashboard/api/functions/<slug>`

Keep the visible title and the route slug aligned, even if the slug uses underscores.

## Product Language Rules

- If the surface is meant to be task-specific and user-facing, call it a `function`.
- If you want a friendlier product word for the same surface, call it a `miniapp`.
- If you are describing a technical integration point, use `plugin`.
- If you are describing implementation structure, use `module`.
- If you are describing a UI element inside a page, use `widget`.

## Avoid

- mixing `widget`, `applet`, `module`, and `feature` in the same product story
- inventing a new term per feature
- renaming the same surface in every doc

## Decision Rule

If there is any doubt, default to `function` in the repo and `miniapp` in user-facing prose.

If the work extends a function, call the work an `add-on`.

If the work plugs into the function or runtime, call it a `plugin`.
