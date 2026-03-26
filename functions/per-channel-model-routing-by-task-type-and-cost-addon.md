# Per-Channel Model Routing Add-On Story

## Purpose

This add-on extends the routing miniapp for issue `#517`.

It keeps the same deterministic routing policy, but adds usability features that help users trust, reuse, and remember routing decisions.

This is an add-on, not a new function.

## Canonical Surface

- Miniapp: `Per-channel model routing by task type and cost`
- Route: `/dashboard/Per-channel_model_routing_by_task_type_and_cost`
- API: `/dashboard/api/functions/model-routing`

## Add-On User Stories

1. As a MeiMei operator, I want route presets like `WhatsApp quick reply` and `Dashboard review` so I can choose the common case in one click instead of selecting every field manually.
2. As a MeiMei operator, I want a `use as default` toggle per channel so the router can remember the preferred route for that channel without me reconfiguring it every time.
3. As a MeiMei operator, I want route history so I can inspect previous routing decisions, compare them, and confirm that the system stayed deterministic.

## Add-On Backlog

### 1. Route Presets

User story:

- As a MeiMei operator, I want route presets like `WhatsApp quick reply` and `Dashboard review` so I can choose the common case in one click instead of selecting every field manually.

Why it matters:

- reduces friction
- improves consistency
- makes the miniapp easier for non-technical users

### 2. Default Per Channel

User story:

- As a MeiMei operator, I want a `use as default` toggle per channel so the router can remember the preferred route for that channel without me reconfiguring it every time.

Why it matters:

- keeps the common route sticky
- prevents repetitive setup
- supports channel-specific workflows

### 3. Route History

User story:

- As a MeiMei operator, I want route history so I can inspect previous routing decisions, compare them, and confirm that the system stayed deterministic.

Why it matters:

- supports trust and auditability
- helps debugging
- makes routing decisions observable over time

## Acceptance Shape

The add-on is ready when:

- presets reduce the number of clicks for common routing choices
- defaults can be set per channel without changing the base routing behavior
- history is visible and readable
- the routing miniapp remains simple for first-time use

## Suggested Delivery Order

1. Route presets
2. Route history
3. Default per channel

## Expansion Rule

Do not add hidden automation first.
Keep the routing decision visible, then add convenience features on top.
