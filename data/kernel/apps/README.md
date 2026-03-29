# Kernel app registry (local state)

`registry.json` in this directory holds **operator-local** registrations for externally installed MeiMei apps (see **`docs/planning/kernel-app-separation-and-https-program.v1.md`** — MM-KERNEL-202).

- The file is **gitignored**; paths inside it are absolute and machine-specific.
- Manage with: `npm run kernel:app-registry -- list|register|…` (see `scripts/meimei-kernel-app-registry.mjs`).
- Each app package must include **`meimei.app.json`** validated by **`npm run kernel:validate-app-manifest`**.

**Dynamic dispatch (MM-KERNEL-501 / MM-KERNEL-603):** `dashboard/lib/kernel-external-app-dispatch.mjs` resolves **`POST /api/functions/<manifest.api.pathSuffix>`** after static routes. **Builtins:** any in-repo package under **`apps/<name>/meimei.app.json`** is **`import()`**’d without **`MEIMEI_KERNEL_EXTERNAL_APPS`**. **Registry file:** entries in this registry are matched by default (including **disabled** entries → **403**). Set **`MEIMEI_KERNEL_EXTERNAL_APPS=0`** (or **`false`** / **`off`**) to ignore the file. Static **`server.mjs`** POST branches still win if matched earlier.

**Auth (MM-KERNEL-301):** optional **`MEIMEI_KERNEL_APP_AUTH=1`** requires **`X-MeiMei-App-Id`** to equal the resolved app’s **`app_id`**, unless the manifest sets **`kernel.authExempt`:** **`true`**. Per-app deployment secret: register with **`--secret`** (stored as **`auth_secret_sha256`**); callers must send **`X-MeiMei-App-Secret`** (plaintext; compared via SHA-256).

### Verification (no plain HTTP)

- **Automated (CI):** **`npm run kernel:external-dispatch:selftest`** — proves registry → dynamic **`import()`** → **`handleApi`** without opening a socket.
- **Against a running dashboard:** use the **same HTTPS entrypoint** as the rest of the product (e.g. TLS terminator on **8443** + **`https://meimei.localhost`**, certs via **`scripts/meimei-cert`**). Set **`MEIMEI_SMOKE_BASE`** (or your client) to that **`https://`** origin; trust the local CA (**`NODE_EXTRA_CA_CERTS`** to `~/.openclaw/certs/meimei.localhost.crt` is one option for CLI clients). **Do not** treat **`http://127.0.0.1:<node>`** as the contract surface when the program requires HTTPS everywhere.
