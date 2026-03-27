# Miniapp Contract v1

Status: frozen (`v1`)  
Owner: `agent.meimei` platform  
Issue: `mvp-factory-control#694`

## Purpose

Define one canonical contract for all MeiMei miniapps so delivery, review, and channel expansion stay consistent.

This contract is mandatory for new miniapps and the target format for existing miniapps during migration.

## Design Goals

- one predictable miniapp shape
- deterministic route and API structure
- explicit safety and failure behavior
- channel-agnostic core contract
- additive evolution without v1 breakage

## Contract Object

Every miniapp must define a contract object with this schema:

```json
{
  "id": "daily-briefing",
  "version": "v1",
  "displayName": "Daily briefing",
  "description": "One-line catalog copy for dashboard flashcards (max 480 characters).",
  "catalogOrder": 2,
  "route": "/dashboard/518/Daily_briefing",
  "api": {
    "method": "POST",
    "path": "/dashboard/api/functions/daily-briefing"
  },
  "input": {
    "required": [],
    "optional": [],
    "examples": [{}]
  },
  "output": {
    "statusField": "ok",
    "payloadShape": "object",
    "requiredFields": ["ok"]
  },
  "safety": {
    "untrustedInput": true,
    "allowedProtocols": ["http", "https"],
    "notes": []
  },
  "capabilities": {
    "channels": ["dashboard", "api"],
    "sideEffects": ["local-file-write"],
    "requiresApproval": false
  },
  "failureModel": {
    "clearErrorMessages": true,
    "fallbackBehavior": "return error payload"
  }
}
```

## Required Fields

- `id`: stable snake-case or kebab-case identifier
- `version`: must be `v1`
- `displayName`: user-facing name
- `description`: required catalog blurb for dashboard flashcards (machine-enforced max 480 characters in `registry:validate`)
- `catalogOrder`: optional integer; lower values appear first on the dashboard (omit for alphabetical fallback by issue id)
- `route`: canonical browser URL path for the function page (must include GitHub issue id; see Route Rules)
- `api.method` and `api.path`: canonical HTTP entry point
- `input`: required/optional contract and at least one example
- `output`: minimum success shape and required fields
- `safety`: input trust model and constraints
- `capabilities`: channels, side effects, approval requirement
- `failureModel`: explicit failure behavior

## Route Rules

- **Canonical miniapp URL:** `/dashboard/<githubIssueId>/<slug>`
  - `<githubIssueId>` is the unique id from `mvp-factory-control` (digits only). It is the stable identifier; renaming the miniapp does not change it.
  - `<slug>` is human-readable only (underscores allowed to match historical names). It may vary; routing is resolved by issue id, not by slug text.
- When the dashboard is mounted behind the local HTTPS proxy (`meimei.localhost`), the public URL is `https://meimei.localhost:8443/dashboard/<id>/<slug>` (same path after the host).
- **Legacy slug-only paths** (for example `/dashboard/Daily_briefing` with no issue id) are not supported; do not document or rely on them.
- API path must remain under `/dashboard/api/functions/` in the contract registry (that path is the stable HTTP entry for adapters and docs parity checks).
- Route and API must be stable after release; breaking changes require a new versioned miniapp contract or an explicit migration note.

## Input Rules

- Input must be explicit and typed in docs (even when empty).
- Optional fields must have defaults or clear omitted behavior.
- Any external input source is treated as untrusted by default.

## Output Rules

- Response must include deterministic success/failure signaling.
- Failure payload must be operator-readable.
- Output shape must be stable for all supported channels.

## Safety Rules

- Miniapps must never execute instructions extracted from untrusted source content.
- Network and protocol constraints must be explicit.
- Side effects must be declared in `capabilities.sideEffects`.

## Capability Rules

- `channels` declares where the miniapp is supported now.
- Future channel adapters must consume this field rather than infer support.
- `requiresApproval` indicates whether policy gates are mandatory before execution.

## Failure Model Rules

- Failure states must be visible in UI and API.
- Silent failures are disallowed.
- Fallback behavior must be explicit and documented.

## Change Governance

- `v1` is frozen for breaking changes.
- Allowed changes in `v1`:
  - additive optional fields
  - additive capability metadata
  - clearer docs without behavior changes
- Disallowed in `v1`:
  - removing required fields
  - changing required field meaning
  - changing route/API in incompatible ways

## Review Checklist

- [ ] all required fields present (including `description` for registry-driven dashboard cards)
- [ ] `route` is `/dashboard/<githubIssueId>/<slug>` and API path is under `/dashboard/api/functions/`
- [ ] input/output and failure behavior are explicit
- [ ] safety and side effects are declared
- [ ] channel capability and approval requirements are declared

## Initial Mapping Targets

Contract migration order:

1. `daily-briefing`
2. `url-summary`
3. `model-routing`

These three become reference implementations for all future miniapps.

## Registry Binding

The machine-readable source of active contract instances is:

- `functions/registry.v1.json`

Validation command:

- `npm run registry:validate`
