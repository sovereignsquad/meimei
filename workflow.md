# Workflow

## Intake

Work enters the system as a request, note, issue, or operator instruction.

The first task is to classify it:

- new capability
- skill update
- documentation update
- operational fix
- review or audit

For a new product function, also classify it against the standard function delivery lifecycle in [function-lifecycle.md](./function-lifecycle.md) and the required miniapp contract in [miniapp-contract-v1.md](./miniapp-contract-v1.md).

## Triage

For each item, determine:

- what the request actually means
- whether a skill already covers it
- whether OC approval is required
- whether it should be implemented now or queued

## Design

Before execution, define:

- the target outcome
- the scope boundary
- the acceptance checks
- the skill or docs that should own the work
- the function route and primary action if this is a product function

## Execution

Prefer one of these paths:

- update a doc
- add or refine a skill
- create a new capability module
- split the work into smaller tasks

For a new function, follow the default sequence:

1. define
2. shape
3. route
4. build
5. verify
6. handoff

## Verification

Every change should end with:

- a coherence check
- a scope check
- a safety check
- a handoff check

## Handoff

When work is ready for OC, provide:

- what changed
- why it changed
- what was verified
- what remains open

For product functions, include the live route, the back path, and the next extension layer if any.
