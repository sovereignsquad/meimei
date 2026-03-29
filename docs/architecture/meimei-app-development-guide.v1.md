# MeiMei app development guide — v1

**Audience:** Engineers adding miniapps, adapters, or workers on `agent.meimei`.  
**Prerequisites:** Read `adapter-contract.v1.md`, `inference-route.v1.md`, `design-system-v1.md`, and this doc’s companion **`meimei-env-ui-contract.v1.md`**.

---

## Table of contents

1. [Platform mental model](#1-platform-mental-model)
2. [What a “MeiMei app” is](#2-what-a-meimei-app-is)
3. [Code standards — do not call the LLM in the hot path](#3-code-standards--do-not-call-the-llm-in-the-hot-path)
4. [Ingress, queue, inference, egress](#4-ingress-queue-inference-egress)
5. [Secrets & configuration](#5-secrets--configuration)
6. [UI & design system](#6-ui--design-system)
7. [Registry, routes, and APIs](#7-registry-routes-and-apis)
8. [Observability & tracing](#8-observability--tracing)
9. [Testing & CI](#9-testing--ci)
10. [Reference implementation](#10-reference-implementation)
11. [Inter-app communication (planned)](#11-inter-app-communication-planned)
12. [Checklist for a new capability](#12-checklist-for-a-new-capability)

---

## 1. Platform mental model

```text
[ External world: Obsidian, Discord, Mail, webhooks, … ]
        │  (adapters: no LLM here)
        ▼
[ SQLite meimei_jobs ]  ← ingress rows (pending)
        │  (single worker tick; bounded retries / dead letters)
        ▼
[ handleMeimeiInferenceRoute / future routers ]  ← OpenAI-shaped blocking v1
        ▼
[ Ollama / future runners ]
        ▼
[ completed jobs + egress adapters OR HTTP response for sync miniapps ]
```

- **Dashboard** serves HTML miniapps, design-system CSS, and JSON APIs.
- **HTTPS proxy** (`meimei-domain.mjs`) splits dashboard vs OpenClaw gateway paths.
- **Swift menubar** launches URLs and runs local LaunchAgents—it is not the app runtime.

---

## 2. What a “MeiMei app” is

| Type | Role | Examples |
|------|------|----------|
| **Miniapp** | Registry-contract UI + `POST /dashboard/api/functions/...` handler pattern | Environment variables, Checklist, Inbox |
| **Adapter daemon** | Separate Node process: filesystem/network → **enqueue only** | `meimei-adapter-obsidian.mjs`, `meimei-demo-file-drop-ingest.mjs` |
| **Core worker** | Inside `dashboard/server.mjs` today: drains `meimei_jobs` | `meimei-job-worker.mjs` |
| **Inference client** | Calls **`POST /api/meimei/route`** with OpenAI-shaped JSON (blocking v1) | Future internal tools—not raw Ollama fetch from random handlers |

A “MeiMei app” in the **product** sense usually means a **registry function** with a route and optional app folder under `apps/`.

---

## 3. Code standards — do not call the LLM in the hot path

**Forbidden in HTTP request handlers and adapter hot paths:**

- `fetch('http://127.0.0.1:11434/...')` scattered across miniapps
- Long synchronous file reads of user vaults inside `server.mjs` route handlers without streaming/queue

**Required patterns:**

- **Async work / burst / external I/O:** enqueue **`inference_v1`** (or future job kinds) in **`meimei_jobs`**; let the worker call **`handleMeimeiInferenceRoute`** (or dedicated processors).
- **Synchronous operator tools** that truly need inline LLM: use the **single** router contract **`POST /api/meimei/route`** so payloads stay OpenAI-shaped and observable—not ad hoc prompt strings.

**Exception:** Legacy code in `dashboard/lib/llm.mjs` exists for established miniapps; **new** features should prefer the router + queue model.

---

## 4. Ingress, queue, inference, egress

| Phase | Rule |
|-------|------|
| **Ingress** | Adapters **insert** SQLite rows (`pending`). They **do not** call `/api/meimei/route` over HTTP. |
| **Payload** | Documented JSON; v1 inference uses `kind: "inference_v1"` + `request` (+ optional extensions, e.g. `obsidian`). |
| **Worker** | Claims one job at a time; non-retryable HTTP **`400` / `413` / `501`** → dead letter; other failures retry to a cap (`MEIMEI_JOB_MAX_FAILURES`). |
| **Egress** | **Not** inside `server.mjs` for adapter-owned delivery (Obsidian append runs in the Obsidian daemon). |

See **`docs/architecture/adapter-contract.v1.md`** and **`adapter-obsidian.v1.md`**.

---

## 5. Secrets & configuration

**Source of truth:** `data/meimei-environment.v1.json` (see **`meimei-env-ui-contract.v1.md`**).

- Applied to **`process.env`** on dashboard load, scoped by **`MEIMEI_ENV_PROFILE`**.
- **Naming:** prefer `<APPIDENTIFIER>_<VARNAME>` for new keys; platform exceptions (`MEIMEI_*`, `PORT`, etc.) documented in the env contract.
- **`.env` files:** use **export** from the dashboard API (`export_dotenv`) or a future import that still persists into JSON—**avoid** two live writers.

**Miniapps** read configuration via `process.env` after load, or via small server-side helpers—never embed secrets in client-side JS sent to the browser.

---

## 6. UI & design system

- **Global CSS:** `public/styles/design-system.css` — linked via `config/dashboard-surface.v1.json`.
- **Themes:** `data-theme` on `<body>` (`green` / `blue` / `orange` / `red`).
- **Layout:** page chrome uses **`.layout-flow` / `.layout-box`** and `config/page-layout.v1.json`—no one-off full-page grids.
- **Components:** `.card`, `.ds-flashcard*`, `.button`, `.panel`, etc.—see **`design-system-v1.md`**.
- **No secrets in DOM** except masked fields; reveal only through explicit, same-origin actions.

Miniapps that are **only** API backends still follow registry + contract docs for naming and error shape.

---

## 7. Registry, routes, and APIs

1. Add or update **`functions/registry.v1.json`** (`id`, `route`, `api.path`, safety, capabilities).
2. Wire **`dashboard/server.mjs`** (thin router) and put product logic in **`apps/<registry-id>/index.mjs`** or an allowed **`dashboard/lib/*`** module per **`meimei-repo-boundaries.v1.md`**. Large catalog / tool GET HTML belongs in **`dashboard/lib/platform-pages/*`** (e.g. **`catalog-pages.mjs`**, **`tool-surface-pages.mjs`**, **`system-monitor-page.mjs`**, **`reference-app-pages.mjs`**, **`ops-tool-pages.mjs`**, **`gtm-pages.mjs`**, **`reader-pages.mjs`**, **`routing-settings-pages.mjs`**, **`home-admin-pages.mjs`**), not inline in `server.mjs`. **No** `apps/foo` importing **`apps/bar`** (CI: `meimei-apps-cross-import-check.mjs`).
3. Document the function in **`functions/<id>.md`** with API actions, env vars, and **operator transport / secrets (R8 / R4)** (loopback vs TLS prefix, env SoT).

---

## 8. Observability & tracing

- HTTP: prefer header **`x-meimei-trace-id`** where applicable; inference router logs **`[meimei/route][traceId]`**.
- Jobs: **`trace_id`** column on `meimei_jobs`.
- Adapters: log with **`[adapter-name]`** prefix; avoid logging secret values.

---

## 9. Testing & CI

- **`npm run ci`** — includes **`npm run boundary:check`** (single Checklist POST branch in `server.mjs` + no forbidden **`apps/*` → `apps/*`** static imports), then registry, policy, audit, telemetry samples, adapter validators, release-gates sample.
- **`npm run dashboard:smoke:miniapps`** — HTTP smoke against catalog APIs (optional strictness per runbook).
- **Local:** `npm run dashboard` + adapter daemons as needed; use demo enqueue / file-drop / Obsidian paths for integration smoke tests.

---

## 10. Reference implementation

**`reference-app-1`** / **`reference-app-2`** — `/790/Reference_app_1`, `/791/Reference_app_2`: **`REFAPP_FEATURE_TOGGLE`**; **`inference_v1`** via global worker; **`app_task`** ping/pong and standup digest with **`meimei_correlation`** + Claim Check in `meimei-job-worker.mjs`. Inbox: `meimei-reference-app-inbox.mjs` (**no peer HTTP**). APIs: `reference-app-queue-api.mjs`, `reference-app-2-queue-api.mjs`. Contracts: `functions/reference-app-1.md`, `functions/reference-app-2.md`.

## 11. Inter-app communication (planned)

**Do not** connect MeiMei apps with synchronous **`fetch`** to each other’s dashboard APIs for delegated work—you get timeouts, deadlocks, and undebuggable chains when one app waits on Ollama.

**Do** treat **`meimei_jobs`** as the **only** inter-app transport: enqueue **`kind: "app_task"`** (Milestone G) with **`target_adapter`** / **`source_adapter`**, sovereign inbox workers, and **egress** as new rows—not open HTTP callbacks. Large bodies use the **Claim Check** pattern (`data/meimei/artifacts/<trace_id>/` + pointer on the bus); thread **`trace_id`**, **`parent_job_id`**, **`reply_to`** across child jobs. Full blueprint: **`inter-app-message-bus.v1.md`**. Handoff: **`handoff-milestone-g-inter-app-bus.v1.md`**.

## 12. Checklist for a new capability

- [ ] Registry entry + contract doc updated (including **R8 / R4** transport + secrets section)  
- [ ] Owning path declared in **`meimei-repo-boundaries.v1.md`** (or propose allowlist change)  
- [ ] Secrets named per **`meimei-env-ui-contract.v1.md`**; catalog hints updated if common  
- [ ] LLM work goes through **queue** and/or **`POST /api/meimei/route`**  
- [ ] UI uses **design-system** classes and layout model  
- [ ] No duplicate `.env` / JSON writers; **no** cross-`apps/*` imports for product logic  
- [ ] **`npm run boundary:check`** passes after your change  
- [ ] CHANGELOG / `docs/releases/CHANGELOG.md` updated for operator-visible behavior  

---

## Versioning

Bump **v1** when platform boundaries (queue, router, env SoT) change materially.
