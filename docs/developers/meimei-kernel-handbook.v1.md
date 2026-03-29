# MeiMei kernel — technical handbook

**Document revision:** v1.2  
**Audience:** Software architects and senior engineers integrating, extending, or reviewing the MeiMei platform core.  
**Runtime:** Node.js **ESM** (`.mjs`), engines **≥22.5** per [`package.json`](../../package.json).  
**Normative audit:** [meimei-kernel-code-audit.v1.md](../architecture/meimei-kernel-code-audit.v1.md) (inventory, contracts, governance, line anchors).  
**Boundaries:** [meimei-repo-boundaries.v1.md](../architecture/meimei-repo-boundaries.v1.md).  
**Inference contract:** [inference-route.v1.md](../api/inference-route.v1.md).  
**Product runtime map:** [ai-runtime-audit.md](../compliance/ai-runtime-audit.md).  
**HTTPS topology:** [meimei-https-topology.v1.md](../architecture/meimei-https-topology.v1.md) — canonical **`https://meimei.localhost:8443/dashboard/`** vs upstream Node HTTP; [ADR-003](../architecture/adr/ADR-003-tls-termination-v1.md).

---

## Table of contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Terminology](#2-terminology)
3. [Architectural invariants](#3-architectural-invariants)
4. [Boot and process model](#4-boot-and-process-model)
5. [Configuration](#5-configuration)
6. [HTTP entry and dispatch](#6-http-entry-and-dispatch)
7. [Registry](#7-registry)
8. [Inference API](#8-inference-api)
9. [Job queue and worker](#9-job-queue-and-worker)
10. [Persistence layout](#10-persistence-layout)
11. [LLM library (`llm.mjs`) vs inference route](#11-llm-library-llmmjs-vs-inference-route)
12. [Integrating external platforms](#12-integrating-external-platforms)
13. [Observability](#13-observability)
14. [v1 scope and boundaries](#14-v1-scope-and-boundaries)

---

## 1. Purpose and scope

This handbook explains **how the kernel behaves** and **which contracts are stable** for reuse. It does not replace the per-function markdown in [`functions/`](../../functions) or the compliance audit’s full product surface map.

**Stable integration seams (recommended)**

- `POST /api/meimei/route` — OpenAI Chat Completions–shaped request/response; see §8.  
- Job spooler patterns — enqueue and observe via SQLite-backed APIs documented in [adapter-contract.v1.md](../architecture/adapter-contract.v1.md) and the audit §4.2–4.3.

**Unstable or product-coupled**

- Large sections of [`dashboard/server.mjs`](../../dashboard/server.mjs) HTML generators (being extracted per kernel completion plan).  
- Individual miniapp business rules in [`apps/*`](../../apps).

---

## 2. Terminology

| Term | Definition |
|------|------------|
| **Kernel** | HTTP entry (`server.mjs`), allowlisted `dashboard/lib/*` modules, registry projection, env store, job spooler + inference worker, static design system delivery — as delimited in [meimei-repo-boundaries.v1.md](../architecture/meimei-repo-boundaries.v1.md). |
| **Miniapp / tool** | Registry row in `functions/registry.v1.json` with POST handler typically in `apps/<id>/index.mjs`. |
| **Platform UI** | Operator-facing HTML: home, admin, catalogs — implemented via `render*` chains and `platform-pages/*`. |
| **Integration** | External products bridged via `integrations/*` and checklist modules. |

---

## 3. Architectural invariants

1. **Layering:** `dashboard/lib` (allowlisted core) does not import one `apps/*` module from another; cross-app work uses queue/bus contracts.  
2. **Inference contract:** Versioned HTTP+JSON at `/api/meimei/route`; behavior matches [inference-route.v1.md](../api/inference-route.v1.md).  
3. **Job isolation:** The default in-process worker claims **`inference_v1`** jobs only; **`app_task`** rows are processed by designated adapters.  
4. **Registry SSOT:** Catalog strings and API paths derive from `registry.v1.json` through `miniapp-registry.mjs`.  
5. **Platform pages:** Modules under `platform-pages/` do not import `apps/*`.

---

## 4. Boot and process model

| Step | Mechanism |
|------|-----------|
| Process start | `npm start` / `npm run dashboard` → `node dashboard/server.mjs` |
| Repository root | Resolved via `import.meta.url` and [`runtime.mjs`](../../dashboard/lib/runtime.mjs) helpers |
| Registry load | Synchronous read of [`functions/registry.v1.json`](../../functions/registry.v1.json) via [`miniapp-registry.mjs`](../../dashboard/lib/miniapp-registry.mjs) |
| Job worker | [`startMeimeiJobWorker`](../../dashboard/lib/meimei-job-worker.mjs) runs in the **same Node process** as HTTP unless `MEIMEI_JOB_WORKER=0` |

There is no separate mandatory worker binary for inference in v1; horizontal scaling is an **external** deployment concern.

---

## 5. Configuration

| Layer | Artifacts |
|-------|-----------|
| Listen / surface | [`dashboard-surface.mjs`](../../dashboard/lib/dashboard-surface.mjs), [`config/dashboard-surface.v1.json`](../../config/dashboard-surface.v1.json) |
| Bind normalization | [`config/dashboard-listen-normalize.mjs`](../../config/dashboard-listen-normalize.mjs) |
| Layout | [`page-layout.mjs`](../../dashboard/lib/page-layout.mjs) |
| Operator chrome (optional) | `data/operator-chrome.v1.json` (gitignored) — merged with [`chrome-theme-defaults.mjs`](../../dashboard/lib/chrome-theme-defaults.mjs); API + dynamic CSS in [`operator-chrome.mjs`](../../dashboard/lib/operator-chrome.mjs); audit [`meimei-docs-code-sync-audit.v1.md`](../planning/meimei-docs-code-sync-audit.v1.md) |
| Operator secrets/config | [`meimei-env-store.mjs`](../../dashboard/lib/meimei-env-store.mjs) → `data/meimei-environment.v1.json`; catalog `config/meimei-env-catalog.v1.json` |
| Inference | `OLLAMA_HOST`, `MEIMEI_INFERENCE_MAX_CONTEXT` |

---

## 6. HTTP entry and dispatch

**Entry:** `http.createServer` in [`dashboard/server.mjs`](../../dashboard/server.mjs). Line numbers drift — use `grep -n 'createServer\|server.listen' dashboard/server.mjs` after large merges.

**HTTPS (operator contract):** Browsers and operators should use the **TLS reverse proxy** (`scripts/meimei-domain.mjs` → **`https://meimei.localhost:8443/dashboard/`**). The Node process is **upstream HTTP on loopback** only — see [meimei-https-topology.v1.md](../architecture/meimei-https-topology.v1.md). **`GET /api/health`** returns **`public_https.operator_url`** and **`listen.url`** for probes.

**Dispatch order (summary)** — see [sync audit §5](../planning/meimei-docs-code-sync-audit.v1.md) for rationale; exact order: `grep -n normalizedPath dashboard/server.mjs`.

1. Health  
2. `GET /api/meimei/monitor/feed`  
3. `POST /api/meimei/route`  
4. Checklist public path — reverse-proxy attempt when configured  
5. **`GET`/`HEAD` `/styles/operator-chrome.css`** — dynamic merged operator theme CSS ([`operator-chrome.mjs`](../../dashboard/lib/operator-chrome.mjs))  
6. Static assets under `public/` for `surface.staticPrefixes` (`/images/`, `/styles/` …)  
7. JSON APIs (e.g. **`GET`/`POST /api/operator/chrome`**, page layout, config, …) and `apps/*` POST branches where still inlined in `server.mjs`  
8. Fallback **`POST /api/functions/<suffix>`** — [`kernel-external-app-dispatch.mjs`](../../dashboard/lib/kernel-external-app-dispatch.mjs): **builtins** from `apps/<pkg>/meimei.app.json` (always), plus **`data/kernel/apps/registry.json`** when **`MEIMEI_KERNEL_EXTERNAL_APPS=1`**. **Auth:** optional **`MEIMEI_KERNEL_APP_AUTH=1`** + headers **`X-MeiMei-App-Id`** / **`X-MeiMei-App-Secret`**; see [`kernel-app-auth.mjs`](../../dashboard/lib/kernel-app-auth.mjs) and program doc MM-KERNEL-301.  
9. HTML `render*` responses  

**Adding behavior:** prefer `meimei.app.json` + dynamic dispatch for new POST APIs; legacy path is a **short** branch in `server.mjs` — per boundaries §4 and **`meimei-dashboard-static-apps-import-check.mjs`** allowlist.

---

## 7. Registry

- **Machine-readable:** [`functions/registry.v1.json`](../../functions/registry.v1.json)  
- **Validation:** `npm run registry:validate`  
- **Projection:** [`miniapp-registry.mjs`](../../dashboard/lib/miniapp-registry.mjs) — `parseContractRoute`, `serverApiPath`, catalog builders  
- **Human contracts:** [`functions/<id>.md`](../../functions)

---

## 8. Inference API

**Specification:** [inference-route.v1.md](../api/inference-route.v1.md).

| Aspect | Detail |
|--------|--------|
| Endpoint | `POST /api/meimei/route` |
| Runner | Ollama OpenAI-compatible chat completions |
| Trace | Prefer header `x-meimei-trace-id`; else `body.meimei.traceId`; else UUID |
| Model | Concrete Ollama tag or `router-auto` + `meimei.taskCategory` (deterministic map in `inference-route.mjs`) |
| Errors | **400** validation, **413** context estimate, **501** unsupported stream/non-local, **502/503** runner |

`router-auto` is a **policy map**, not a neural routing step — document UX accordingly when exposing to end users ([ai-runtime-audit.md](../compliance/ai-runtime-audit.md)).

---

## 9. Job queue and worker

**Contract:** [adapter-contract.v1.md](../architecture/adapter-contract.v1.md).

| Component | Role |
|-----------|------|
| [`createMeimeiJobQueue`](../../dashboard/lib/meimei-job-queue.mjs) | SQLite spooler API (`enqueueIngress`, claims, monitor listing, party-scoped reads) |
| [`startMeimeiJobWorker`](../../dashboard/lib/meimei-job-worker.mjs) | Polls inference jobs, invokes inference route, retries, Claim Check spill, optional correlation enqueue |
| Env | `MEIMEI_JOB_POLL_MS`, `MEIMEI_JOB_MAX_FAILURES`, `MEIMEI_JOB_WORKER` |

Full method list and semantics: [kernel audit §4.2–4.4](../architecture/meimei-kernel-code-audit.v1.md#42-job-queue--public-surface-createmeimeijobqueue).

---

## 10. Persistence layout

| Path | Content |
|------|---------|
| `data/meimei/meimei-jobs.sqlite` | Job spooler (WAL) |
| `data/meimei/artifacts/<trace>/` | Large assistant payloads (Claim Check) |
| `data/meimei-environment.v1.json` | Operator env store |

Protect these paths with host-level permissions and backup policy.

---

## 11. LLM library (`llm.mjs`) vs inference route

[`dashboard/lib/llm.mjs`](../../dashboard/lib/llm.mjs) provides direct Ollama access, JSON extraction robustness, optional prompt cache, and routing-configuration helpers used across the dashboard.

| Use case | Recommendation |
|----------|------------------|
| External system on another stack calling MeiMei | **`POST /api/meimei/route`** only |
| New in-repo adapter code | Prefer inference route; align with kernel completion plan K3 |
| Legacy miniapp paths | May still call `llm.mjs` until migrated |

**OpenClaw** agent execution (`scripts/oc-agent`, gateway) is **orthogonal** to the inference route contract — see [ai-runtime-audit.md](../compliance/ai-runtime-audit.md).

**Routing preview** (AI routing / API access tools): default implementation is [`openclaw-routing-preview.mjs`](../../dashboard/lib/openclaw-routing-preview.mjs) in **`server.mjs`** — deterministic rules, no LLM, parity with `oc-agent --route-only`. Legacy subprocess: **`MEIMEI_ROUTING_PREVIEW_LEGACY_OC_AGENT=1`**.

---

## 12. Integrating external platforms

### Mode A — HTTP client (preferred)

1. Co-locate or securely network to the host running MeiMei and Ollama.  
2. Call `POST /api/meimei/route` with the v1 JSON shape.  
3. Forward `x-meimei-trace-id` for cross-system correlation.  
4. Apply **your** TLS, authentication, and rate limits at the edge; the v1 kernel contract does not define multi-tenant auth.

### Mode B — Source vendoring

1. Copy only the minimal allowlisted modules (e.g. `inference-route.mjs`) and honor their license.  
2. Re-implement or inject `repoRoot`, storage paths, and process boundaries.  
3. If copying the job queue, ship schema migrations and worker semantics unchanged or fork under a new contract version.  
4. Record divergences from upstream in your own architecture decision records.

---

## 13. Observability

| Mechanism | Use |
|-----------|-----|
| Structured log lines | `[meimei/route][<traceId>]`, `[meimei/jobs][<traceId>]` |
| `GET /api/meimei/monitor/feed` | Operator timeline; `trace_id` query for chronological trace |
| [`meimei-monitor-feed.mjs`](../../dashboard/lib/meimei-monitor-feed.mjs) | Row formatting for UI and API consumers |
| `./scripts/oc-readiness` | OpenClaw / gateway readiness (adjacent to agent features) |
| `npm run dashboard:probe` | Local dashboard reachability |

---

## 14. v1 scope and boundaries

| Item | v1 posture |
|------|------------|
| Streaming SSE | Not implemented (`stream: true` → **501**) |
| Non-local LLM backends via inference route | Not implemented (`localOnly: false` → **501**) |
| Product-wide uniform LLM backend | Not claimed — multiple backends coexist ([ai-runtime-audit.md](../compliance/ai-runtime-audit.md)) |
| Packaged `@meimei/kernel` npm module | Future option per kernel completion plan §4 |

The kernel’s strength is **explicit contracts** (inference + jobs) and **enforced modularity** (boundaries CI), not the absence of further refactoring in `server.mjs`.

---

## Revision log

| Revision | Date | Summary |
|----------|------|---------|
| v1.0 | 2026-03-30 | Initial handbook sections. |
| v1.1 | 2026-03-30 | Aligned with audit v1.1: invariants, persistence, corrected HTTP anchors, professional scope section, integration modes clarified. |
