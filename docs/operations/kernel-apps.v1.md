# Kernel apps — operator runbook (MM-KERNEL-702)

## Register and enable

1. Install app under a stable directory; ensure `meimei.app.json` validates: `npm run kernel:validate-app-manifest`.
2. Register: `npm run kernel:app-registry -- register <install_path>` (optional `--secret` for HTTP auth).
3. Optional **policy** overlay: edit `data/kernel/apps/registry.json` and add a `policy` object validated by `schemas/meimei.app.policy.v1.json` — `npm run kernel:validate-app-policy <file>`.

## HTTPS façade URLs

Use the **public** dashboard base (e.g. `https://meimei.localhost:8443/dashboard`) as `MEIMEI_KERNEL_BASE_URL` for clients.

- Inference: `POST …/api/meimei/v1/apps/{app_id}/inference`
- Jobs: `POST …/api/meimei/v1/apps/{app_id}/jobs/enqueue`
- Env: `GET …/api/meimei/v1/apps/{app_id}/env?keys=KEY1,KEY2`
- Filesystem (read-only roots): `GET …/api/meimei/v1/apps/{app_id}/fs/roots` — requires `filesystem.scoped` + `policy.filesystem.roots`

When `MEIMEI_KERNEL_APP_AUTH=1`, set `X-MeiMei-App-Id` and `X-MeiMei-App-Secret` as documented in the kernel handbook.

## Catalog

- Legacy `functions/registry.v1.json` plus builtins + registry file entries are **merged** for Apps/Tools pages (`kernel-catalog-merge.mjs`).

## Registry vs disk drift (MM-KERNEL-604)

- **`functions/registry.v1.json` is generated** — source: `functions/registry.shell.v1.json`, `functions/registry.fragments.v1.json`, `config/registry-functions-order.v1.json`, plus `meimei.app.json` under `apps/*` and `packages/*`. Run **`npm run kernel:registry:generate`** after editing those inputs; CI runs **`npm run kernel:registry:generate-check`**.
- `npm run kernel:registry:drift-check` — every disk manifest must have a matching `functions` row with `id === <pkg>`; registry **apps** (except allowlisted) must have that manifest on disk; registry **tools** must have a manifest or be listed as kernel-implemented. Allowlists: `config/kernel-registry-drift-allowlists.v1.json`.

## Registry snapshot (audit)

- `npm run kernel:registry:snapshot` — JSON to stdout (manifest copies + metadata). Redirect to a secure store if used for compliance.

## Pilot package

- **`packages/meimei-pilot-external-app`** — `MEIMEI_KERNEL_BASE_URL`, `MEIMEI_PILOT_APP_ID`, optional `MEIMEI_PILOT_APP_SECRET`; `node packages/meimei-pilot-external-app/pilot.mjs` (after `npm install` at repo root).

## Migrate a miniapp toward `packages/*` (MM-KERNEL-602)

1. Create `packages/<name>/` with the same `meimei.app.json` + `index.mjs` surface you had under `apps/<name>/` (no `dashboard/lib/*` imports in external callers — use `@meimei/sdk`). **Pilot:** `packages/daily-briefing/`.
2. Run `npm run kernel:validate-app-manifest` on the new tree; `npm run kernel:registry:drift-check` after you update `functions/registry.v1.json` (or register-only external flow).
3. `npm run kernel:app-registry -- register /absolute/path/to/packages/<name>` — note the printed **`app_id`** for façades and secrets.
4. Remove the old `apps/<name>/` tree **only after** dashboard POST routes are served via registry/builtins and `npm run ci` is green (see `meimei-dashboard-static-apps-import-check`).

## CI hooks

- `kernel:registry:drift-check`, `kernel:policy:selftest`, `kernel:validate-app-policy`, `kernel:sdk:selftest` are part of `npm run ci`.

## See also

- [`docs/api/meimei-app-facades-v1.md`](../api/meimei-app-facades-v1.md)
- [`docs/security/meimei-kernel-threat-model-v1.md`](../security/meimei-kernel-threat-model-v1.md)
- [`docs/architecture/meimei-kernel-external-app-shells-v1.md`](../architecture/meimei-kernel-external-app-shells-v1.md)
