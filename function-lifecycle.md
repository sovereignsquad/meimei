# Function Delivery Lifecycle

This is the standard method MeiMei uses every time we start delivering a new product function.

## Purpose

Every function should ship through the same visible sequence so the product stays consistent, testable, and easy for OC to review.

The lifecycle exists to:

- keep the user-facing surface simple
- keep the implementation path repeatable
- leave room for future APIs and channel adapters
- prevent each feature from inventing its own process

## Terminology

Use `function` for the canonical repo term.
Use `miniapp` when a friendlier user-facing synonym is needed.
Use `add-on` for an expansion of an existing function.
Use `plugin` for a technical integration or extension point.
Use `module` for internal implementation units.
Use `widget` for UI elements inside a page.
Use `feature` only for capability or behavior, not for a surface or route.

## Default Shape

For every new function:

- one function
- one primary route
- one primary user action
- one visible result area
- one back path to the dashboard root

The root dashboard becomes the function launcher.
The function page becomes the working surface.

## Lifecycle Stages

### 1. Define

Confirm:

- the exact function name
- the user outcome
- the first-screen action
- the result format
- the fallback behavior

### 2. Shape

Design the smallest useful UI:

- centered primary input
- one clear action button
- result in the main body
- optional helper settings only if they are required for the MVP

### 3. Route

Assign a stable path for the function, such as:

- `/dashboard/<function_name>`

Keep the dashboard root as the function index and return path.

### 4. Build

Implement:

- the function page
- the handler or backend route
- the launch path from the dashboard root
- any local operator controls needed to run it

### 5. Verify

Confirm:

- the page loads cleanly
- the primary action works
- the output appears in the main body
- the back button returns to the dashboard root
- the behavior matches the agreed scope

### 6. Handoff

Before release, update:

- the docs
- the dashboard entry point
- the launch instructions
- the acceptance notes if needed

## Dependency Recording Rule

Every function card must separate dependencies into two buckets:

- managed dependencies: dependencies already represented by a card, owner, or tracked delivery item
- unmanaged dependencies: external services, environment constraints, or missing primitives that are required but not yet actively managed

If a card depends on something unmanaged, record it explicitly in the card and in this lifecycle file until it is managed.

### Current Unmanaged Dependencies Observed in the OpenClaw Source Set

These were surfaced while delivering the recent `agent.meimei` OpenClaw cards:

- email inbox provider and inbox identity management
- browser runtime support on VPS / remote hosts
- strict-site browser login flow for X/Twitter-style services
- QMD backend performance and hardware requirements
- ClawHub distribution / reuse path for skills
- external API pricing and spend visibility
- message / channel pairing and allowlist behavior

These items should stay visible until they are either converted into tracked function cards or explicitly marked as resolved.

## Future Extension Rule

After the MVP is stable, extend the function in layers:

- UI refinements
- add-ons
- plugins
- API access
- message-based access
- platform adapters

Do not start with the adapters.
Start with the human-facing function page first.

Use [naming-conventions.md](./naming-conventions.md) to decide whether a future change is an add-on, plugin, module, widget, or API layer.

## Contract Rule

This lifecycle is the default delivery method for MeiMei functions unless OC explicitly approves a different path.

All new functions/miniapps must conform to [miniapp-contract-v1.md](./miniapp-contract-v1.md).

For naming consistency, use [naming-conventions.md](./naming-conventions.md) alongside this lifecycle.
