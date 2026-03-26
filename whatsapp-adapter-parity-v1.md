# WhatsApp Adapter Parity v1

Issue: `mvp-factory-control#701`

## Purpose

Define hard parity requirements for WhatsApp channel behavior so runtime config remains consistent with the channel adapter contract and policy expectations.

## Required Parity Rules

1. `channels.whatsapp.enabled` must be `true`.
2. `plugins.allow` must include `whatsapp`.
3. `plugins.entries.whatsapp.enabled` must be `true`.
4. `channels.whatsapp.dmPolicy` must be `disabled`.
5. `channels.whatsapp.groupPolicy` must be `allowlist`.
6. `channels.whatsapp.groupAllowFrom` must be a non-empty array.
7. `channels.whatsapp.accounts.default` must exist.
8. `channels.whatsapp.accounts.default.groupPolicy` must match top-level `groupPolicy`.
9. `channels.whatsapp.accounts.default.groupAllowFrom` must match top-level `groupAllowFrom`.
10. `channels.whatsapp.accounts.default.dmPolicy` must match top-level `dmPolicy`.

## Why These Rules Exist

- They enforce explicit group-message control boundaries.
- They prevent hidden drift between default account behavior and top-level channel policy.
- They align channel behavior with the adapter lifecycle policy-check stage.

## Validation Command

- `npm run adapter:whatsapp:validate`

If validation fails, the runtime is not parity-safe for WhatsApp adapter assumptions.
