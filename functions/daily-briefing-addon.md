# Daily Briefing Add-On Stories

Function: `daily briefing`
User-facing term: `miniapp`
Add-on: `multi-source, multi-output briefing pipeline`

## Purpose

Expand the daily briefing miniapp from a single-source, single-sink workflow into a reusable pipeline that can gather from multiple sources and publish to multiple outputs.

This add-on keeps the core briefing function stable while adding new source adapters and sink adapters in separate deliverable chunks.

## Foundation

The base function remains the same:

- one dashboard surface
- one primary action
- one visible result area
- Apple Notes as the default sink
- markdown as the fallback sink

The add-on layer adds more sources and more outputs without changing the core function identity.

## Deliverable Chunks

### Story 1: Multiple source intake

As a MeiMei user, I want the daily briefing to gather data from multiple sources so that the briefing is more complete and less dependent on one file or one signal.

#### What this delivers

- `tasks.md`
- `ice_meimei.md`
- `learnings.md`
- workspace git status

#### Acceptance

- The briefing can combine at least three sources.
- The output still reads as one short briefing.
- Missing sources do not break the run.

### Story 2: Source ranking and weighting

As a MeiMei user, I want the briefing to rank sources by importance so that the most useful items appear first.

#### What this delivers

- a source priority order
- a simple weighting rule for high-signal sources
- a stable merge order

#### Acceptance

- Important sources appear before low-signal sources.
- The ordering stays consistent across runs.
- The user can understand why one source appears first.

### Story 3: Source adapters

As a MeiMei user, I want each source to be wrapped in its own adapter so that new sources can be added without changing the core briefing logic.

#### What this delivers

- one adapter per source type
- a shared source interface
- clean error handling per source

#### Acceptance

- Adding a new source does not require rewriting the whole briefing builder.
- A failing adapter does not stop the other adapters from producing a briefing.

### Story 4: Multiple output sinks

As a MeiMei user, I want the briefing to write to multiple outputs so that I can read it in the place that fits my workflow.

#### What this delivers

- Apple Notes as the primary sink
- markdown fallback as the archival sink
- additional sinks later, such as Obsidian or message delivery

#### Acceptance

- At least one primary sink and one fallback sink are supported.
- A failure in one sink does not erase the briefing from the other sink.
- The default sink stays Apple Notes on macOS.

### Story 5: Sink adapters

As a MeiMei user, I want each destination to use its own sink adapter so that outputs can be added without changing the briefing builder.

#### What this delivers

- one sink adapter per output type
- shared writing interface
- per-sink error reporting

#### Acceptance

- Sink code is isolated by destination.
- A broken sink does not block another sink from receiving the briefing.
- The system can report which sink succeeded or failed.

### Story 6: Output routing policy

As a MeiMei user, I want MeiMei to choose the default output automatically so that the briefing goes to the right place without extra steps.

#### What this delivers

- Apple Notes as the default route
- markdown as fallback
- optional future policy for message delivery and API delivery

#### Acceptance

- The default sink is chosen without user friction.
- Fallback behavior is explicit and visible.
- The routing rule is stable and documented.

### Story 7: Delivery status visibility

As a MeiMei user, I want to see which sources and sinks were used so that I can trust the briefing output.

#### What this delivers

- a source summary
- a sink summary
- clear success/failure indication per sink

#### Acceptance

- The briefing output shows what was used.
- The user can tell whether Apple Notes or markdown received the note.
- Partial success is visible instead of hidden.

### Story 8: Source and sink configuration UI

As a MeiMei user, I want to enable or disable sources and sinks so that the briefing matches my environment and preference.

#### What this delivers

- source toggles
- sink toggles
- defaults that keep Apple Notes first

#### Acceptance

- Sources can be enabled without editing code.
- Sinks can be changed without editing code.
- The default experience stays simple for first-time users.

## Recommended Delivery Order

1. Multiple source intake
2. Source ranking and weighting
3. Multiple output sinks
4. Delivery status visibility
5. Source adapters
6. Sink adapters
7. Configuration UI

## Notes

- Keep the core miniapp simple.
- Treat source adapters and sink adapters as implementation details.
- Keep Apple Notes as the default sink until a future product decision changes it.
- Use `add-on` for this backlog layer, not a new function name.
