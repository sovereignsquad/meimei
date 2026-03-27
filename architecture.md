# Architecture

## System overview

`agent.meimei` is a governed agent product workspace that combines:

- a markdown-first control plane (contracts, policies, runbooks, release rules)
- a runtime operator surface (`dashboard/server.mjs`)
- machine-checkable validation gates (readiness, registry, release, policy, telemetry, adapter checks)
- channel-adapter standards for multi-channel ingress/egress

The repository is intentionally structured so that behavior is explainable in docs and enforceable in code.

## Architectural boundaries

### Human governance boundary (OC)

OC sets priorities, approves high-impact decisions, and accepts/rejects deliveries.

### Runtime execution boundary (OpenClaw + agent runtime)

Runtime components execute tasks, route requests, apply policies, and expose operational control surfaces.

### Evidence boundary (repository artifacts)

All meaningful decisions and releases must leave durable artifacts:

- contracts
- validator outputs
- release notes/version metadata
- audit and telemetry traces

## Layer model

### 1) Governance and contracts

Defines the operating rules and quality bars.

Key artifacts:

- `agent.md`
- `security.md`
- `definition-of-done.md`
- `issue-quality-standard.md`
- `issue-ready-gate-checklist.md`
- `miniapp-contract-v1.md`
- `channel-adapter-contract-v1.md`
- `channel-adapter-lifecycle-v1.md`
- `release-gates-dod-v1.md`
- `handoff-artifact-schema-v1.md`

### 2) Product runtime and operations

Implements local operator UX and runtime orchestration.

Key artifacts:

- `dashboard/server.mjs`
- `public/styles/design-system.css`
- `scripts/meimei-domain*`
- `scripts/meimei-setup`
- `scripts/meimei-cert`
- `scripts/meimei-dashboard-watchdog-*`
- `scripts/meimei-always-on-*`

### 3) Validation and reliability layer

Turns governance into machine-checkable gates.

Key artifacts:

- `scripts/oc-readiness`
- `scripts/validate-function-registry.mjs`
- `scripts/validate-release-gates.mjs`
- `scripts/validate-handoff-artifact.mjs`
- `scripts/validate-external-channel-policy.mjs`
- `scripts/validate-audit-trail.mjs`
- `scripts/validate-telemetry.mjs`
- `scripts/validate-imessage-adapter.mjs`

### 4) Channel and integration layer

Normalizes channel behavior and delivery lifecycle.

Key artifacts:

- `dashboard/lib/api-channel-adapter.mjs`
- `channel-api-adapter-reference-v1.md` (reference adapter delivery and verification, `mvp-factory-control#700`)
- `dashboard/lib/imessage-adapter.mjs`
- `imessage-adapter-architecture-v1.md`
- `email-adapter-architecture-v1.md`
- `discord-adapter-architecture-v1.md`
- `whatsapp-adapter-parity-v1.md`

### 5) Documentation and release intelligence layer

Maintains product-level communication quality and traceability.

Key artifacts:

- `README.md`
- `CHANGELOG.md`
- `VERSION.md`
- `design-system-v1.md`
- `project-vocabulary-v1.md`

## Runtime topology

### Control UI and local domain

- Dashboard app serves on local runtime port.
- `meimei.localhost` proxy routes requests to dashboard or gateway based on path.
- TLS certificate lifecycle is managed by `scripts/meimei-cert`.

### Gateway and adapter path

- Channel requests enter through API routes.
- Policy and routing checks run before dispatch.
- Telemetry and audit events record key decisions and outcomes.

## Design principles

- **Document first, enforce in code:** every critical rule should have both prose and validator coverage.
- **Single source per concern:** one canonical style system, one release metadata surface, one contract per domain.
- **Deterministic operations:** readiness and release gates must be reproducible.
- **Traceable change management:** version, changelog, and issue mapping must stay synchronized.
