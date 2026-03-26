# Any-URL Summarization In Seconds Add-On Story

## Naming

The full naming rules live in [naming-conventions.md](../naming-conventions.md).

Short version:

- canonical repo term: `function`
- best user-facing synonym: `miniapp`
- stable route names follow the function slug
- do not mix `widget`, `applet`, `module`, and `featurette` in the same story

## User Story

As a MeiMei user, I want the `Any-URL summarization in seconds` function to grow into a trusted, reusable miniapp that gives me faster feedback, clearer results, and more ways to use the same capability, so I can rely on it for everyday URL reading across web, messaging, and API surfaces.

## Add-On Goal

This add-on is not a rewrite of issue `#516`. It expands the same function with trust, workflow, and platform support while keeping the one-screen summary experience intact.

This document is an `add-on` story, not a `plugin` spec.
If a future item needs an integration point, write the plugin as a separate technical doc and keep the add-on story focused on product behavior.

## Add-On Backlog

1. As a user, I want to copy the summary result so I can paste it into another tool without re-reading the page.
2. As a user, I want PDF-specific metadata and citation display so I can trust where the summary came from.
3. As a user, I want a recent history of URLs and summaries so I can revisit earlier results quickly.
4. As a user, I want a status panel for the model and extraction pipeline so I can see whether the system is healthy.
5. As a user, I want the terminal progress area to show explicit stages like fetch, extract, summarize, and render so I can trust that the system is working.
6. As a user, I want clearer error states for unreachable, blocked, or invalid URLs so I know why a source failed.
7. As a user, I want optional advanced controls such as citations on/off, fetch depth, timeout, extraction mode, and model choice so I can tune difficult sources.
8. As a user, I want a richer output layout for long articles so key facts, next steps, and caveats stay easy to scan.
9. As a user, I want stronger trust signals like source title, fetch time, and limited/full summary status so I can judge result quality fast.
10. As a user, I want shared navigation across MeiMei functions so this page becomes one of many consistent product surfaces.
11. As a user, I want API access from other platforms so MeiMei can return summaries in IM, WhatsApp, and future integrations.
12. As a user, I want more MeiMei functions to reuse the same lifecycle so new capabilities feel consistent and predictable.

## Acceptance Shape

This add-on is ready when:

- the main summary flow still stays simple
- the new controls do not bury the primary action
- each extension can be added without breaking the base route
- the function still works as a stable product surface

## Suggested Order

1. Copy button
2. Better trust signals
3. Better progress stages
4. Error handling improvements
5. History
6. PDF metadata
7. Advanced controls
8. API and messaging integrations

## Product Language

Use the shared naming conventions from [naming-conventions.md](../naming-conventions.md).
