# Program: Kernel / app separation + HTTPS-only surface

**Version:** v1  
**Date:** 2026-03-29  
**Owner:** Platform / architecture  
**Status:** **In progress (v1 kernel API track)** — **T2** registry (**201**–**203**, **301**) and **T4** dispatch (**501**, **603**) delivered; **T3** policy + app façades (**302**, **303a**–**d**), **T4** **@meimei/sdk** (**401**–**402**) + **602** pilot (**packages/daily-briefing**), **T5** merged catalog (**601**) + registry snapshot (**604** incremental), **T6** threat model + runbook + monitor **`app_id`** (**701**–**703**) delivered. **Remaining:** full **604** (generated `registry.v1.json`); optional deeper FS APIs (read file bytes); migrate additional miniapps into **`packages/*`** using the **`daily-briefing`** pilot pattern.

## Executive summary

Decouple MeiMei **applications** from the **kernel** so each app can live in its own directory (and eventually its own repository), register by path with a kernel-issued **`app_id`**, and consume shared services only through a **MeiMei API/SDK** with **per-app policy** (capabilities, priority, rate limits). In parallel, make **HTTPS** the only supported client-facing transport, including localhost.

**v1 scope decision (locked):** [ADR-001](../architecture/adr/ADR-001-app-runtime-v1.md) — operator-only, same-machine install; **in-process dynamic load** as default; sidecars deferred.

## Current status (rollup)

| Theme | IDs | State | Notes |
|-------|-----|--------|--------|
| **T1 HTTPS** | MM-TLS-*, ADR-003 | **Delivered** (CI + topology) | `meimei-https-e2e-ci`, operator runbook; façade clients use same TLS edge. |
| **T2 Registry / identity** | 201–203, 301 | **Delivered** | Manifest schema, `kernel-app-registry.mjs`, tombstoned `app_id`, optional auth + audit. |
| **T3 Policy + façades** | 302, 303a–d | **Delivered** | `schemas/meimei.app.policy.v1.json`, `POST/GET …/v1/apps/{id}/…` (inference, jobs enqueue, env, **fs/roots** read-only listing). |
| **T4 SDK + dispatch** | 401–402, 501, 603 | **Delivered** | `@meimei/sdk` workspace, contract + HTTP smoke selftests; dynamic `POST /api/functions/…`; no static `apps/*` in `server.mjs`. |
| **T5 Migration** | 601, 604, 602 | **Partial** | **601** merged catalog; **604** snapshot + **`npm run kernel:registry:drift-check`** (allowlists; scans **`apps/*`** and **`packages/*`** manifests); **`daily-briefing`** in `registry.v1.json` + GET route, pilot under **`packages/daily-briefing/`**; **602** playbook + pilot. |
| **T6 Governance** | 502, 701–703 | **Delivered** (502 = strategy doc) | Shells ADR note, threat model, `kernel-apps.v1.md` runbook, monitor `app_id` filter + row field. |

**CI hooks (kernel-related):** `kernel:registry:drift-check`, `kernel:validate-app-manifest`, `kernel:validate-app-policy`, `kernel:app-registry:selftest`, `kernel:policy:selftest`, `kernel:external-dispatch:selftest`, `kernel:sdk:selftest`, `kernel:fs-roots:selftest`, `kernel:facades:http:selftest`, `kernel:registry:snapshot` (manual / audit).

**Largest remaining epics:** **generate** `registry.v1.json` from manifests (604 stretch); optional **job status/query façade** for 303b; **file read** API beyond fs/roots listing; **rate limits** in policy (302 stretch); **602** — migrate more miniapps to `packages/*` ( **`daily-briefing`** pilot done).

---

## Program taxonomy

| Dimension | Values |
|-----------|--------|
| **Themes** | T1 Transport (HTTPS), T2 Identity & registry, T3 Capability API & policy, T4 Loader & runtime, T5 Migration & deprecation, T6 Governance & ops |
| **Issue types** | ADR, Epic, Story, Task, Spike |
| **Suggested GitHub labels** | `area:kernel`, `area:apps`, `area:security`, `area:ops`, `priority:P0–P2`, `type:adr`, `type:feature`, `type:chore`, `blocked-by:adr-001` |
| **Non-goals (v1)** | Public third-party app marketplace; multi-tenant billing; remote app hosts (see ADR-001) |

## System map (target)

```mermaid
flowchart LR
  subgraph clients [Clients]
    Browser[Browser HTTPS]
    SDK[App code via SDK]
  end
  subgraph edge [Edge]
    TLS[TLS termination]
  end
  subgraph kernel [Kernel]
    Router[HTTP router]
    Auth[App auth + policy]
    Inf[inference]
    Jobs[jobs / monitor]
    Env[env store]
    Reg[App registry]
    Loader[Dynamic loader]
  end
  subgraph apps [Registered apps]
    A1[App package A]
    A2[App package B]
  end
  Browser --> TLS --> Router
  SDK --> TLS --> Router
  Router --> Auth
  Auth --> Inf
  Auth --> Jobs
  Auth --> Env
  Reg --> Loader
  Loader --> A1
  Loader --> A2
  A1 -.->|SDK / API only| TLS
  A2 -.->|SDK / API only| TLS
```

## Business layer mapping

| Business need | Technical carrier |
|---------------|-------------------|
| Independent app teams & repos | Manifest + install path; no static kernel import |
| Discoverable platform surface | Registry + catalog merge |
| Fair shared AI/queue usage | Policy: priority, concurrency, rate limits |
| Audit & compliance | `app_id` on logs, monitor rows, job metadata |
| Trusted local product | HTTPS + operator-only install (v1) |

## Dependency graph (issues)

```text
ADR-001 (accepted) ─┬─► MM-KERNEL-201 … 203
                      ├─► MM-KERNEL-301 … 303d
                      ├─► MM-KERNEL-501 … 502
                      └─► MM-KERNEL-701

ADR-002 (proposed) ───► MM-KERNEL-203, 301, 302, 303*, 401

ADR-003 (accepted) ───► MM-TLS-101 … 103

MM-KERNEL-202 ─► MM-KERNEL-203 ─► MM-KERNEL-301
MM-KERNEL-302 ─► MM-KERNEL-303a–d
MM-KERNEL-303a + MM-KERNEL-401 ─► MM-KERNEL-602
MM-KERNEL-501 + MM-KERNEL-602 ─► MM-KERNEL-603
```

---

## How to use this document

Each subsection **GitHub issue body** can be copied into a new GitHub issue (e.g. `mvp-factory-control` or `agent.meimei`, per your workflow). Titles are on the first line after **Title:**.

---

# Theme T1 — HTTPS-only

**Expanded execution backlog (micro-deliverables, rationale, CI matrix):** [`meimei-https-full-integration-program.v1.md`](./meimei-https-full-integration-program.v1.md) (**TLS-001–TLS-071**). The items below (**MM-TLS-***) stay as high-level epics; implementers should map them to **TLS-*** tasks.

## MM-TLS-ADR-003 — Finalize ADR-003 default (proxy vs Node TLS)

**Title:** `[MM-TLS-ADR-003] Finalize TLS termination default (ADR-003)`

**Type:** ADR / Task  
**Dependencies:** None  
**Blocks:** MM-TLS-101, MM-TLS-102

### Requirements

- Choose **single default** for Mac mini + local dev: **reverse proxy** vs **Node `https.createServer`**.
- Document cert paths (`meimei-cert`), ports, and failure modes.

### Deliverables

- [x] [ADR-003](../architecture/adr/ADR-003-tls-termination-v1.md) **Accepted** — **Option A** (`meimei-domain`).
- [x] Runbook + topology + health JSON + smoke/probe TLS modes — see [`meimei-https-full-integration-program.v1.md`](./meimei-https-full-integration-program.v1.md) phase-0 changelog.

### Acceptance criteria

- [x] Canonical operator path documented as **`https://meimei.localhost:8443/dashboard/`** with upstream HTTP labeled explicitly.

---

## MM-TLS-101 — Inventory listeners and documented URLs

**Title:** `[MM-TLS-101] Inventory HTTP listeners and document HTTPS migration targets`

**Type:** Task  
**Dependencies:** MM-TLS-ADR-003  
**Blocks:** MM-TLS-102

### System map

Scan: `dashboard/server.mjs`, menubar scripts, smoke scripts, OpenClaw wrappers, checklist bridge, env examples.

### Deliverables

- Spreadsheet or markdown table: *component, bind address, port, protocol today, target protocol, owner issue*.

### Acceptance criteria

- No undocumented public plain-HTTP port remains without an explicit “internal only” classification.

---

## MM-TLS-102 — Implement HTTPS default path

**Title:** `[MM-TLS-102] Implement default HTTPS access (dev + prod)`

**Type:** Story  
**Dependencies:** MM-TLS-101, MM-TLS-ADR-003  
**Blocks:** MM-TLS-103, MM-KERNEL-303* (API clients)

### Technical design

- Implement ADR-003 option A or B: proxy config repo artifact **or** `https.createServer` in dashboard bootstrap.
- Preserve backward compatibility window via env flag if needed (`MEIMEI_ALLOW_INSECURE_HTTP=1` deprecated, logged).

### Deliverables

- Code and/or `config/` + script changes; update `npm run dashboard` documentation.

### Acceptance criteria

- Documented primary URL is `https://…`; CI documents how to trust or skip verify in automation.

---

## MM-TLS-103 — Contracts and validation: HTTPS-only semantics

**Title:** `[MM-TLS-103] Align miniapp/registry/docs with HTTPS-only policy`

**Type:** Task  
**Dependencies:** MM-TLS-102

### Deliverables

- Update [miniapp-contract-v1.md](../architecture/miniapp-contract-v1.md) examples to HTTPS.
- Optional: tighten `validate-function-registry.mjs` for new entries’ `allowedProtocols`.

### Acceptance criteria

- No official doc recommends `http://` for operator-facing MeiMei URLs except explicitly marked internal.

---

# Theme T2 — Manifest & registry

## MM-KERNEL-201 — App manifest schema v1

**Title:** `[MM-KERNEL-201] Define meimei.app manifest schema v1 + JSON Schema`

**Type:** Story  
**Dependencies:** [ADR-001](../architecture/adr/ADR-001-app-runtime-v1.md)  
**Blocks:** MM-KERNEL-202, MM-KERNEL-501

### Requirements

- Machine-readable manifest at app root (e.g. `meimei.app.json` — name TBD in implementation).
- Minimum fields: `name`, `version`, `entry` (ESM path relative to package root), `api` (method/path pattern or handler export name), `capabilities.required[]` (strings enumerating kernel features).

### Deliverables

- `schemas/meimei.app.manifest.v1.json` (repo path TBD).
- Example manifest in `docs/planning/examples/` or template repo reference.

### Acceptance criteria

- [x] Schema validates example; **`npm run kernel:validate-app-manifest`** in CI.

---

## MM-KERNEL-202 — Persistent app registry (kernel)

**Title:** `[MM-KERNEL-202] Implement kernel app registry (register by path, enable/disable)`

**Type:** Story  
**Dependencies:** MM-KERNEL-201  
**Blocks:** MM-KERNEL-203, MM-KERNEL-501

### Technical design

- Store: `data/kernel/apps/registry.json` **or** SQLite table under kernel data dir — pick one; justify in PR.
- Operations: register (idempotent), list, disable, remove (tombstone).

### Deliverables

- [x] **`dashboard/lib/kernel-app-registry.mjs`** — load/save, register (idempotent by `install_path`), list, enable/disable, remove → tombstone.
- [x] **`scripts/meimei-kernel-app-registry.mjs`** — CLI; env **`MEIMEI_KERNEL_APP_REGISTRY`** overrides path.
- [x] **`data/kernel/apps/registry.json`** — default path (**gitignored**); **`data/kernel/apps/README.md`**.
- [x] **`npm run kernel:app-registry`** / **`kernel:app-registry:selftest`** (in **`npm run ci`**).

### Acceptance criteria

- [x] Two apps registered to two paths; registry file persists (selftest + manual `register`).

---

## MM-KERNEL-203 — UUID issuance and audit events

**Title:** `[MM-KERNEL-203] Issue immutable app_id (UUID/ULID) and audit registration`

**Type:** Task  
**Dependencies:** MM-KERNEL-202, [ADR-002](../architecture/adr/ADR-002-app-identity-and-addressing-v1.md) (when accepted)  
**Blocks:** MM-KERNEL-301

### Deliverables

- [x] On first register: **`randomUUID()`** as `app_id`; tombstone on remove (**id never reused**).
- [x] Optional audit (**default on** for CLI): `kernel-app-registered`, `kernel-app-updated`, `kernel-app-removed` via **`audit-trail.mjs`** (pass `{ audit: false }` for tests).

### Acceptance criteria

- [x] Deleting an app does not reuse its `app_id` for a new install (new register → new id).

---

# Theme T3 — Capability API & policy

## MM-KERNEL-301 — App authentication context middleware

**Title:** `[MM-KERNEL-301] Kernel middleware: resolve app_id + auth for privileged routes`

**Type:** Story  
**Dependencies:** MM-KERNEL-203  
**Blocks:** MM-KERNEL-302, MM-KERNEL-303a–d

### Requirements

- Requests to resource façades carry **`X-MeiMei-App-Id`** (or path) + secret/HMAC/session established at registration.
- Deny with structured error if app disabled or unknown.

### Deliverables

- [x] **`dashboard/lib/kernel-app-auth.mjs`** — optional **`MEIMEI_KERNEL_APP_AUTH=1`** ( **`X-MeiMei-App-Id`** vs registry/builtin **`app_id`**; manifest **`kernel.authExempt`**); optional per-app **`auth_secret_sha256`** + **`X-MeiMei-App-Secret`**; integrated in **`kernel-external-app-dispatch.mjs`**.
- [x] **`register … --secret`** + registry field **`auth_secret_sha256`**; extended **`meimei-kernel-external-dispatch-selftest.mjs`**.
- Threat: store **only** SHA-256 of deployment secret on disk; rotate by re-registering with a new secret.

### Acceptance criteria

- [x] Missing / wrong identity or secret → **401**/**403**; disabled app → **403** (selftest).

---

## MM-KERNEL-302 — Policy model v1 (capabilities, priority, limits)

**Title:** `[MM-KERNEL-302] Per-app policy schema: allowlist, queue priority, rate limits`

**Type:** Story  
**Dependencies:** MM-KERNEL-301  
**Blocks:** MM-KERNEL-303a–d

### Deliverables

- [x] `schemas/meimei.app.policy.v1.json`; optional `policy` on registry rows; `kernel-app-policy.mjs`; `npm run kernel:policy:selftest` + `kernel:validate-app-policy`.

### Acceptance criteria

- [x] Selftest: policy can deny `jobs.enqueue` while satisfying required caps only when allowlist matches (`meimei-kernel-policy-selftest.mjs`).

---

## MM-KERNEL-303a — Inference façade

**Title:** `[MM-KERNEL-303a] App-scoped inference HTTP API + policy enforcement`

**Type:** Story  
**Dependencies:** MM-KERNEL-302, MM-TLS-102 (for external callers per ADR-003)  
**Blocks:** MM-KERNEL-401, MM-KERNEL-602

### Technical design

- New route namespace e.g. `POST /api/meimei/v1/apps/{appId}/inference` delegating to existing `handleMeimeiInferenceRoute` after policy check.

### Deliverables

- [x] `POST /api/meimei/v1/apps/{app_id}/inference` — `kernel-app-http-facades.mjs`; doc [`docs/api/meimei-app-facades-v1.md`](../api/meimei-app-facades-v1.md); inference + monitor `app_id` tagging.

---

## MM-KERNEL-303b — Jobs façade

**Title:** `[MM-KERNEL-303b] App-scoped jobs enqueue/query + policy`

**Type:** Story  
**Dependencies:** MM-KERNEL-302

### Deliverables

- Job rows or metadata include `app_id`; optional partition by app for operator queries.

---

## MM-KERNEL-303c — Env store façade

**Title:** `[MM-KERNEL-303c] App-scoped env secret read API + allowlist`

**Type:** Story  
**Dependencies:** MM-KERNEL-302

### Deliverables

- [x] `GET …/env?keys=` with `policy.env.allowKeys` only (`kernel-app-http-facades.mjs`).

---

## MM-KERNEL-303d — Filesystem / bridge façade (if applicable)

**Title:** `[MM-KERNEL-303d] App-scoped filesystem or integration roots (policy-bound)`

**Type:** Story  
**Dependencies:** MM-KERNEL-302

### Requirements

- Only if apps require file access: jail paths in policy; deny `..` traversal.

### Deliverables

- [x] `GET …/fs/roots` — read-only root listing + shallow `entries_sample` per [`kernel-app-fs-roots.mjs`](../../dashboard/lib/kernel-app-fs-roots.mjs); jailed to **`install_path`**; **`npm run kernel:fs-roots:selftest`**.

---

# Theme T4 — SDK & loader

## MM-KERNEL-401 — @meimei/sdk package (Node)

**Title:** `[MM-KERNEL-401] Create @meimei/sdk — inference, jobs, env clients`

**Type:** Story  
**Dependencies:** MM-KERNEL-303a (MVP: inference only), then 303b–c  
**Blocks:** MM-KERNEL-602

### Deliverables

- [x] `packages/meimei-sdk` (workspace); `MeiMeiKernelClient` — inference, jobs, env, filesystem roots (GET).

### Acceptance criteria

- [x] Pilot package **`packages/meimei-pilot-external-app`** imports only `@meimei/sdk`.

---

## MM-KERNEL-402 — SDK contract tests

**Title:** `[MM-KERNEL-402] SDK integration tests against mock kernel HTTP`

**Type:** Task  
**Dependencies:** MM-KERNEL-401

### Deliverables

- [x] `npm run kernel:sdk:selftest` (`scripts/meimei-sdk-contract-selftest.mjs`).

---

## MM-KERNEL-501 — Registry-driven dispatch (replace static imports)

**Title:** `[MM-KERNEL-501] Dynamic route registration from kernel app registry`

**Type:** Story  
**Dependencies:** MM-KERNEL-202, ADR-001  
**Blocks:** MM-KERNEL-602, MM-KERNEL-603

### Technical design

- **Delivered:** **`tryKernelExternalAppPost`** in **`dashboard/server.mjs`** (fallback **after** built-in POST routes). **`POST /api/functions/<suffix>`** → dynamic **`import()`** of **`manifest.entry.module`** (+ optional **`api.subroutes`** exports). **Registry file** dispatch is **on by default**; set **`MEIMEI_KERNEL_EXTERNAL_APPS=0`** to disable. **`kernel-external-app-dispatch.mjs`** + **`npm run kernel:external-dispatch:selftest`** (CI). Dispatch asserts **`assertManifestCapabilitiesSatisfiedForDispatch`** after auth.
- **Open:** none for in-repo static-import removal (**MM-KERNEL-603** done); **MM-KERNEL-601** merged catalog shipped (**`kernel-catalog-merge.mjs`** + Apps/Tools pages).

### Acceptance criteria

- [x] At least one route can be served via registry + dynamic import — **verified in CI** by **`npm run kernel:external-dispatch:selftest`** (in-process; **no plain-HTTP assumption**).
- **End-to-end through the real edge:** only over **HTTPS** (e.g. `https://meimei.localhost:8443` after **`meimei-cert` / `npm run cert:install`**), with a registered app (registry on by default) — same transport contract as the rest of MeiMei (**ADR-003** / TLS program). Do **not** document or rely on ad-hoc **`http://`** checks for this path.
- [x] In-repo miniapps use **`meimei.app.json`** + dynamic dispatch; no static **`apps/*`** imports in **`server.mjs`** — **MM-KERNEL-603**.

---

## MM-KERNEL-502 — GET shells / static assets for external apps

**Title:** `[MM-KERNEL-502] Strategy for app UI assets and public URLs`

**Type:** Story  
**Dependencies:** MM-KERNEL-201, MM-KERNEL-501, ADR-002

### Requirements

- Resolve: path-prefix `/apps/{appId}/…` vs kernel-proxied static files from install dir vs iframe to app dev server (dev only).

### Deliverables

- [x] [`docs/architecture/meimei-kernel-external-app-shells-v1.md`](../architecture/meimei-kernel-external-app-shells-v1.md) — proxy / iframe / catalog options vs ADR-002.

---

# Theme T5 — Migration

## MM-KERNEL-601 — Dual-write catalog (legacy registry + manifests)

**Title:** `[MM-KERNEL-601] Merge catalog from registry.v1.json and dynamic app registry`

**Type:** Task  
**Dependencies:** MM-KERNEL-202, MM-KERNEL-201

### Deliverables

- [x] **`dashboard/lib/kernel-catalog-merge.mjs`** + **`catalog-pages.mjs`** use **`getMergedCatalog()`** from **`server.mjs`**.

---

## MM-KERNEL-602 — Pilot app migration

**Title:** `[MM-KERNEL-602] Migrate one pilot app to external package + SDK`

**Type:** Story  
**Dependencies:** MM-KERNEL-401, MM-KERNEL-501, MM-KERNEL-303a  
**Blocks:** MM-KERNEL-603

### Recommendation

Start with **reference-app-1** or smallest tool to limit blast radius.

### Deliverables

- [x] Operator playbook — [`docs/operations/kernel-apps.v1.md`](../operations/kernel-apps.v1.md) § *Migrate a miniapp toward `packages/*`*; **`packages/README.md`** workspace index.
- [x] Pilot **`daily-briefing`** under **`packages/daily-briefing/`**; kernel builtins + drift + manifest CI include **`packages/*`**; miniapp smoke POST body for **`daily-briefing`**.

---

## MM-KERNEL-603 — Remove static imports for migrated apps

**Title:** `[MM-KERNEL-603] Remove static server.mjs imports for migrated apps`

**Type:** Task  
**Dependencies:** MM-KERNEL-602

### Deliverables

- [x] **`scripts/meimei-dashboard-static-apps-import-check.mjs`** — fails on any static **`../apps/<pkg>/`** import in **`dashboard/server.mjs`** (**`npm run boundary:check`**); allowlist empty when fully migrated.
- [x] All in-repo miniapps: **`meimei.app.json`**, no static app imports; **`POST /api/functions/…`** via **`kernel-external-app-dispatch.mjs`** (checklist shell branch + dynamic **`apps/checklist`** load retained for boundary CI).

---

## MM-KERNEL-604 — Deprecate registry.v1.json as sole SoT

**Title:** `[MM-KERNEL-604] Transition functions/registry.v1.json to generated or read-only mirror`

**Type:** Epic  
**Dependencies:** MM-KERNEL-603 (all apps migrated or explicitly legacy)

### Deliverables (incremental)

- [x] **`npm run kernel:registry:snapshot`** — JSON snapshot of registry + manifests for audit / drift detection. **`functions/registry.v1.json`** remains operator SoT for legacy miniapps until full generation exists.
- [x] **`npm run kernel:registry:drift-check`** — CI ensures `registry.v1.json` ↔ `apps/*/meimei.app.json` parity (`config/kernel-registry-drift-allowlists.v1.json`).

---

# Theme T6 — Governance & ops

## MM-KERNEL-701 — Threat model & trust boundaries

**Title:** `[MM-KERNEL-701] Document threat model for kernel-app boundary (v1)`

**Type:** Task  
**Dependencies:** ADR-001  
**Blocks:** MM-KERNEL-702

### Deliverables

- [x] [`docs/security/meimei-kernel-threat-model-v1.md`](../security/meimei-kernel-threat-model-v1.md).

---

## MM-KERNEL-702 — Runbook: register / upgrade / rollback app

**Title:** `[MM-KERNEL-702] Operator runbook for app lifecycle`

**Type:** Task  
**Dependencies:** MM-KERNEL-202, MM-TLS-102

### Deliverables

- [x] [`docs/operations/kernel-apps.v1.md`](../operations/kernel-apps.v1.md).

---

## MM-KERNEL-703 — Observability per app_id

**Title:** `[MM-KERNEL-703] Metrics and logs: tag app_id; monitor feed extensions`

**Type:** Story  
**Dependencies:** MM-KERNEL-301, MM-KERNEL-303a

### Acceptance criteria

- [x] **`GET /api/meimei/monitor/feed?app_id=`**; feed rows expose **`app_id`** when present on payload / **`meimei_meta`**.

---

## Suggested epic rollup (optional GitHub epics)

| Epic | Issues |
|------|--------|
| **E-TLS** | MM-TLS-ADR-003, MM-TLS-101–103 |
| **E-Registry** | MM-KERNEL-201–203 |
| **E-API** | MM-KERNEL-301–302, 303a–d |
| **E-SDK-Loader** | MM-KERNEL-401–402, 501–502 |
| **E-Migrate** | MM-KERNEL-601–604 |
| **E-Gov** | MM-KERNEL-701–703 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-29 | **604 drift-check CI**, **daily-briefing** registry + GET route, **602** migration playbook (`kernel-apps.v1.md`, `packages/README.md`). |
| 2026-03-29 | **602 pilot:** **`packages/daily-briefing/`**; builtin loader + drift + **`kernel:validate-app-manifest`** scan **`packages/*`**. |
| 2026-03-29 | **303d read-only `fs/roots`:** `kernel-app-fs-roots.mjs`, SDK `readFilesystemRoots`, `kernel:fs-roots:selftest`, `kernel:facades:http:selftest`. |
| 2026-03-29 | **MM-KERNEL-302–303d, 401–402, 501 policy gate, 502, 601, 604 snapshot, 701–703, pilot SDK package:** façades, merged catalog, monitor `app_id`, workspaces `@meimei/sdk`, CI selftests. |
| 2026-03-29 | **Doc pass:** dependency graph — **ADR-003 (accepted)** (was marked proposed). |
| 2026-03-30 | **MM-KERNEL-301** auth; **MM-KERNEL-501** builtins + registry (**default on** since follow-up: `MEIMEI_KERNEL_EXTERNAL_APPS=0` disables); **MM-KERNEL-603** all in-repo manifests, no static `server.mjs` app imports, static-import CI guard. |
| 2026-03-29 | MM-KERNEL-501 (partial): `kernel-external-app-dispatch.mjs`, `MEIMEI_KERNEL_EXTERNAL_APPS=1`, server fallback POST, `kernel:external-dispatch:selftest` in CI. |
| 2026-03-29 | MM-KERNEL-202/203: `kernel-app-registry.mjs`, CLI, selftest, gitignored `data/kernel/apps/registry.json`, audit event types for register/update/remove. |
| 2026-03-29 | MM-KERNEL-201: `schemas/meimei.app.manifest.v1.json`, planning example, `validate-meimei-app-manifest.mjs`, CI hook. |
| 2026-03-29 | Initial program + ADR-001 accepted (operator-only, in-process v1). |
