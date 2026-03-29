# Channel API adapter reference (delivery artifact)

Issue: `mvp-factory-control#700`  
Repository: `moldovancsaba/agent.meimei`

## What this is

The **reference implementation** of the channel adapter lifecycle for the **`api`** channel: normalize → policy → dispatch (model-routing preview) → audit → telemetry → delivery state. It is the **basement** for transport-specific channels (WhatsApp, iMessage, Discord) that must plug into the same checkpoints ([`channel-adapter-contract-v1.md`](channel-adapter-contract-v1.md), [`channel-adapter-lifecycle-v1.md`](channel-adapter-lifecycle-v1.md)).

## Ownership and boundaries

| Area | Artifact |
|------|----------|
| Adapter logic | `dashboard/lib/api-channel-adapter.mjs` |
| Policy | `dashboard/lib/external-channel-policy-engine.mjs` |
| Audit | `dashboard/lib/audit-trail.mjs` |
| Telemetry | `dashboard/lib/reliability-telemetry.mjs` |
| HTTP (this miniapp) | `POST /api/functions/api-channel-adapter` (and `GET` with query params) |
| Operator UI | `GET /700/API_channel_adapter` → `renderApiChannelAdapterPage()` in `dashboard/server.mjs` |

**Out of scope for #700:** real WhatsApp / iMessage / Discord transports — those are **#701 / #702 / #704** (feature requests on this basement).

## Verification

1. Run `npm run registry:validate` (registry includes `api-channel-adapter`).
2. Start dashboard: `npm run dashboard`.
3. Open `http://127.0.0.1:<defaults.port>/700/API_channel_adapter` (see `config/dashboard-surface.v1.json`), or via `meimei.localhost` proxy: `/dashboard/700/API_channel_adapter`.
4. Run **Run adapter** with defaults — expect `adapter.state` `delivered` and a `route` object.
5. Toggle **approved** / pick a channel that triggers policy block if configured — expect HTTP 400 with `adapter` and blocked lifecycle.

## Related issues (FR on #700)

Treat these as **downstream** of the reference spine unless explicitly merged:

| Issue | Role |
|-------|------|
| [#699](https://github.com/moldovancsaba/mvp-factory-control/issues/699) | Contract + lifecycle **definition** (this issue **implements** the reference path). |
| [#701](https://github.com/moldovancsaba/mvp-factory-control/issues/701) | WhatsApp adapter **FR** |
| [#702](https://github.com/moldovancsaba/mvp-factory-control/issues/702) | iMessage adapter **FR** |
| [#704](https://github.com/moldovancsaba/mvp-factory-control/issues/704) | Discord adapter **FR** |
| [#536](https://github.com/moldovancsaba/mvp-factory-control/issues/536) | Multi-channel product umbrella |

## Handoff

- Operators use the **miniapp** for acceptance evidence.  
- Developers extend **#701/#702/#704** by matching lifecycle events and policy hooks, not by forking ad hoc flows.
