# Channel Adapter Lifecycle v1

Issue: `mvp-factory-control#699`

## Goal

Provide one operational lifecycle that all channel adapters implement with the same checkpoints and observability.

## Stage 1: Ingress

Collect raw provider event and assign:

- `eventId`
- channel id
- receive timestamp

Required output:

- raw event archive record

## Stage 2: Normalize

Convert raw event into canonical adapter event shape defined in:

- `channel-adapter-contract-v1.md`

Required output:

- normalized event record

## Stage 3: Policy Check

Evaluate:

- channel policy
- sender/thread constraints
- action intent constraints

Required output:

- policy decision record (`allowed`, `riskTier`, `requiresApproval`, `reason`)

## Stage 4: Dispatch

Resolve miniapp and route, then execute through platform runtime.

Required output:

- dispatch record (`miniappId`, `route`, `resultStatus`)

## Stage 5: Egress

Translate canonical outbound payload to provider-native payload and send.

Required output:

- outbound request record

## Stage 6: Delivery State

Track and emit final state:

- `queued` / `sent` / `delivered` / `failed` / `blocked`

Required output:

- delivery state transition record

## Required Logs Per Event

Each event must generate:

1. ingress log
2. normalized event log
3. policy decision log
4. dispatch log
5. outbound log
6. final delivery state log

## Phase-1 Non-Goals

- implementing every adapter immediately
- changing existing routing policy logic
- introducing channel-specific hidden heuristics

## Phase-1 Deliverables

- contract spec
- lifecycle spec
- reference event schema
- acceptance criteria for adapter implementations
