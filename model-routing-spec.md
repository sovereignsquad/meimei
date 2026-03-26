# Per-Channel Model Routing Spec

Issue: `agent.meimei #517 P0: Per-channel model routing by task type and cost`

## Purpose

Route each MeiMei request to the right model based on:

- channel
- task type
- cost target

The router must be deterministic, explainable, and easy for OC to inspect.

## Canonical Rule

Use the simplest model that still satisfies the task.

Escalate only when the task justifies it.

## Routing Inputs

Routing decisions must consider:

1. channel
2. task type
3. cost target
4. fallback availability

## Model Tiers

Use these tier names in policy discussion:

- `tier_local_fast`: cheapest local or low-latency path for simple work
- `tier_local_reasoning`: stronger local reasoning path for harder work
- `tier_openrouter_free`: free external model path when local capacity is not enough
- `tier_openrouter_strong`: stronger external model path for higher-value work

## Default Policy Table

| Channel | Task Type | Cost Target | Preferred Tier | Fallback Tier | Reason |
| --- | --- | --- | --- | --- | --- |
| Dashboard | simple chat, quick assist | low | `tier_local_fast` | `tier_openrouter_free` | keep interactive tasks cheap and fast |
| Dashboard | summarization, extraction | low-medium | `tier_local_reasoning` | `tier_openrouter_free` | content tasks need a little more depth |
| Dashboard | research, synthesis | medium | `tier_openrouter_free` | `tier_openrouter_strong` | use broader external capability when needed |
| IM / WhatsApp | short reply | low | `tier_local_fast` | `tier_openrouter_free` | speed matters more than depth |
| IM / WhatsApp | context-heavy reply | medium | `tier_local_reasoning` | `tier_openrouter_strong` | preserve quality for conversational depth |
| API | deterministic utility | low | `tier_local_fast` | `tier_openrouter_free` | keep API predictable and inexpensive |
| API | customer-facing summary | medium | `tier_local_reasoning` | `tier_openrouter_free` | favor stable, explainable output |
| Internal ops | routing review, policy checks | medium-high | `tier_local_reasoning` | `tier_openrouter_strong` | prefer stronger reasoning when operator confidence matters |

## Deterministic Decision Order

The router should decide in this order:

1. identify the channel
2. classify the task type
3. read the cost target
4. choose the preferred tier
5. fall back only if the preferred tier is unavailable
6. record the chosen route and reason

## Fallback Rules

- If the preferred tier is unavailable, fall back to the next tier in the same row.
- If no tier in the row is available, use the safest available default and mark the result as fallback-routed.
- If the task cannot be classified, route it as a medium-confidence task and choose the safest reasonable path.

## Inspectability

Every routed request must expose:

- channel
- task type
- chosen tier
- fallback tier, if used
- routing reason

## Non-Goals

- hidden heuristics
- probabilistic route selection
- automatic optimization that the operator cannot explain
- changing provider infrastructure

## Acceptance Checks

- same inputs produce the same route under the same policy
- simple tasks use cheaper tiers when appropriate
- harder tasks escalate only when needed
- fallback behavior is visible
- the chosen route and reason can be inspected

## Implementation Notes

- keep the routing table small
- prefer declarative rules over clever logic
- log the route decision at the point of execution
- keep the policy editable without changing unrelated runtime behavior

## Related Skill

This spec should be implemented through [skills/core/model-routing/SKILL.md](./skills/core/model-routing/SKILL.md).

## Related Miniapp

The user-facing preview surface lives in [functions/per-channel-model-routing-by-task-type-and-cost.md](./functions/per-channel-model-routing-by-task-type-and-cost.md).

The add-on story lives in [functions/per-channel-model-routing-by-task-type-and-cost-addon.md](./functions/per-channel-model-routing-by-task-type-and-cost-addon.md).
