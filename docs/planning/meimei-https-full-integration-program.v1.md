# Program: Full HTTPS integration — micro-deliverables

**Version:** v1  
**Date:** 2026-03-30  
**Status:** Planning (execution not started)  
**Related:** [ADR-003 — TLS termination](../architecture/adr/ADR-003-tls-termination-v1.md) (Proposed), [kernel separation program](./kernel-app-separation-and-https-program.v1.md) (MM-TLS track), `scripts/meimei-domain.mjs`, `scripts/meimei-cert`

---

## 1. Why this is crucial — and a show-stopper

### 1.1 Security and trust

- **Confidentiality / integrity on the wire:** Without HTTPS as the **default, enforced** operator and user surface, credentials, tokens, prompts, and PII can traverse **plaintext HTTP** on loopback or LAN. Loopback is not a universal trust boundary (malware, other users on shared machines, mis-bound ports, accidental exposure via SSH tunnels or `0.0.0.0`).
- **No ambiguous “two truths”:** If docs say “HTTPS only” but the default dev path is `http://127.0.0.1`, operators learn the wrong habit; production drift is guaranteed.

### 1.2 Browser and platform reality

- **Secure context:** Geolocation, some storage, Service Workers, Subresource Integrity expectations, and future APIs increasingly assume **HTTPS** (or `localhost` exceptions that you cannot rely on for custom hostnames like `meimei.localhost` in all browsers without proper TLS).
- **Mixed content:** Any page loaded over HTTPS that loads or posts to HTTP creates **mixed content** warnings or hard blocks — fragile for miniapps, embeds, and future SDK clients.

### 1.3 Product / architecture alignment

- **Kernel–app separation:** External apps and SDKs need **one canonical secure origin** (`https://meimei.localhost:8443` or production host). If the “real” API is still `http://` on another port, every integration duplicates policy and you cannot enforce **`Secure` cookies**, **`SameSite`**, or **CORS** consistently.
- **Audit and compliance:** “TLS in production only” fails audits that ask for **consistent** controls; hash-chained audit logs are weaker if ingress is not clearly **authenticated transport**.

### 1.4 Why it blocks forward motion

- **Show-stopper:** Any milestone that claims “ready for operators / external apps / strict smoke” **without** a defined, testable HTTPS path is **not shippable** under your stated non-negotiable.
- **Dependency:** MM-TLS is a **gate** for MM-KERNEL-301 (app auth headers), strict external smoke, and “HTTPS-only” client documentation.

---

## 2. Current state (repo snapshot)

| Area | State |
|------|--------|
| Node dashboard | **`http.createServer`** — plain HTTP on configured port |
| TLS edge | **`meimei-domain`** can expose **`https://meimei.localhost:8443`** → proxy to **HTTP** upstream (`scripts/meimei-domain.mjs`) |
| Certs | **`meimei-cert`** / `~/.openclaw/certs/meimei.localhost.{crt,key}` |
| ADR-003 | **Proposed** — default termination model not formally accepted |
| Smoke / probe | Default **`http://127.0.0.1:<port>`** (`meimei-dashboard-miniapps-smoke.mjs`, `meimei-dashboard-probe.mjs`) |
| Config defaults | e.g. `defaults.openclawChatUrl` uses **`http://127.0.0.1:…`** in `dashboard-surface.v1.json` |
| Registry | **`allowedProtocols`** mixed (`[]` vs `["https"]`) — not a single ingress policy |

**Conclusion:** TLS **can** exist via proxy; it is **not** the single obvious default, **not** fully enforced, and **not** consistently validated in automation.

---

## 3. Target state (definition of done)

1. **Single documented operator URL** for the dashboard: **`https://<canonical-host>:<canonical-tls-port><MEIMEI_PUBLIC_PREFIX>`** (e.g. `https://meimei.localhost:8443/dashboard`).
2. **Upstream Node** listens on **loopback HTTP** or **Unix socket** only — **no** unintended exposure; optional hardening: refuse non-loopback binds when proxy mode is on.
3. **Plain HTTP** on the public listener either **absent** or **301 → HTTPS** only (no silent dual-use without explicit dev waiver env).
4. **All first-party scripts and smoke defaults** that “hit the product” use **HTTPS** + documented **trust** (`NODE_EXTRA_CA_CERTS` or OS keychain after `cert:install`).
5. **CI** includes at least one job or documented reproducible step: **TLS smoke** (or subprocess proxy + `fetch` with CA) — not only plain HTTP.
6. **ADR-003** → **Accepted**; mac-mini / runbook / go-live checklist aligned.
7. **Outbound URL policy** (miniapps fetching arbitrary URLs) **explicitly documented**: ingress is HTTPS-only; outbound may still allow `http` where contract says so, or tighten per **`allowedProtocols`**.

---

## 4. Guiding decisions (lock before coding)

| ID | Decision | Options | Output |
|----|----------|---------|--------|
| **D1** | Default topology | **A)** Reverse proxy (existing `meimei-domain`) as **canonical** dev+prod vs **B)** Node `https.createServer` as canonical | ADR-003 **Accepted** with one paragraph |
| **D2** | Dev default command | `npm run dashboard` starts **HTTP only** vs **`npm run dashboard:secure`** starts proxy+node vs **single** command | One blessed path in README |
| **D3** | Public hostname | `meimei.localhost` only vs configurable `MEIMEI_PUBLIC_HOST` | Document env matrix |
| **D4** | Production HSTS | On for real DNS hosts only vs off for `.localhost` | Table per environment |

---

## 5. Micro-deliverables (execution backlog)

Each item: **ID**, **theme**, **deliverable**, **acceptance**, **deps**.

### Phase P0 — Decision + documentation spine

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-001** | ADR | **Accept ADR-003** with chosen default (**A proxy** recommended; cite `meimei-domain` as reference impl). | ADR status **Accepted**; Open points cleared or deferred with issue IDs. | — |
| **TLS-002** | Docs | **Canonical URL spec** in `docs/operations/runbook.md` + link from README: scheme, host, port, prefix, trust steps. | New operator can open dashboard **only** via documented HTTPS URL after `cert:install` + `meimei-domain` (or chosen path). | TLS-001 |
| **TLS-003** | Docs | **`docs/architecture/meimei-https-topology.v1.md`** (new): diagram ASCII/Mermaid — client → TLS listener → upstream Node/socket. | Architecture review checkbox; linked from `docs/README.md`. | TLS-001 |

### Phase P1 — Edge hardening (proxy + bind)

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-010** | Proxy | **`meimei-domain`**: optional **HTTP→HTTPS redirect** on a dedicated HTTP port (e.g. 8080) or same host **301** when someone hits `http://meimei.localhost:8443` incorrectly — exact behavior per D1. | Documented matrix; manual or script test passes. | TLS-001 |
| **TLS-011** | Node | **`dashboard/server.mjs`** (or surface config): when **`MEIMEI_UPSTREAM_ONLY=1`** (name TBD), refuse to bind `0.0.0.0`; enforce **`127.0.0.1`** or **`::1`** unless explicit override. | CI or unit check; log line on boot shows bind mode. | TLS-002 |
| **TLS-012** | Node | Optional **`MEIMEI_UNIX_SOCKET`** path: Node listens on socket instead of TCP (proxy connects via `http+unix`). | Works on macOS; documented in topology doc. | TLS-003 |
| **TLS-013** | Config | **`config/dashboard-surface.v1.json`** (or env): **`publicBaseUrlHttps`** (optional) for server-generated absolute links in HTML (if any today relative-only, document “relative OK”). | Grep shows no hardcoded `http://127.0.0.1` in **user-visible** HTML from server for primary flows. | TLS-002 |

### Phase P2 — Certificates lifecycle

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-020** | Certs | **`meimei-cert`**: document **SAN** coverage (`meimei.localhost`, `localhost`, IP SANs); align with `meimei-domain`. | Single source of truth in `docs/operations/`; no conflicting openssl snippets. | TLS-002 |
| **TLS-021** | Certs | **`npm run cert:rotate`** path tested + **runbook** note (downtime, proxy reload). | Checklist step in mac-mini go-live. | TLS-020 |
| **TLS-022** | Future spike | **Issue (not impl):** ACME/Let’s Encrypt for non-localhost prod hostname — spike doc only. | Issue filed; no false promise in README. | TLS-001 |

### Phase P3 — Clients, probes, smoke (HTTPS by default)

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-030** | Smoke | **`meimei-dashboard-miniapps-smoke.mjs`**: default **`MEIMEI_SMOKE_BASE`** to **`https://meimei.localhost:8443`** when **`MEIMEI_SMOKE_USE_TLS=1`** or when **`MEIMEI_PUBLIC_HOST`** set; keep **`http://127.0.0.1`** only under explicit **`MEIMEI_SMOKE_INSECURE=1`**. | Document envs; CI job matrix: one **TLS** job (starts proxy+server in subprocess or uses existing script). | TLS-001, TLS-002 |
| **TLS-031** | Probe | **`meimei-dashboard-probe.mjs`**: probe **`https://`** when `MEIMEI_PROBE_TLS=1` or default flip after cutover. | Watchdog / LaunchAgent docs updated. | TLS-030 |
| **TLS-032** | Scripts | Audit **`scripts/*.mjs`**, **`scripts/*.sh`** for **operator-facing** `http://` URLs; replace with **HTTPS** canonical or env-driven base. | Grep report checked in PR; exceptions listed with `// INSECURE_LEGACY` + issue link. | TLS-002 |
| **TLS-033** | Env | Document **`NODE_EXTRA_CA_CERTS=$HOME/.openclaw/certs/meimei.localhost.crt`** (or system trust) for **Node fetch** in CI/smoke. | Copy-paste block in runbook. | TLS-020 |

### Phase P4 — Application semantics (ingress policy)

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-040** | Contract | **`miniapp-contract-v1.md`**: **ingress** MUST be HTTPS; **outbound** fetch rules unchanged but cross-linked. | Registry validation optional warning for new `http` in examples. | TLS-002 |
| **TLS-041** | Registry | **`validate-function-registry.mjs`**: optional strict mode **`MEIMEI_REGISTRY_HTTPS_STRICT=1`** — `allowedProtocols` cannot suggest `http` for user-facing URL fields (define rule). | CI optional job or pre-commit. | TLS-040 |
| **TLS-042** | Server | If request hits Node **directly** on HTTP with header **`X-Forwarded-Proto: https`**, respect for logging only; **do not** treat as cryptographic proof (document). | Security note in topology doc. | TLS-003 |
| **TLS-043** | Cookies | If any **Set-Cookie** exists in server responses, add **`Secure`** when `secure` mode; **`SameSite`** policy documented. | Grep `Set-Cookie`; if none, document “N/A today”. | TLS-011 |

### Phase P5 — Integrations and external apps

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-050** | Bridge | **`checklist-local-integration.mjs` / bridge docs:** callback URLs for deployed Next point to **HTTPS** MeiMei edge. | `functions/checklist.md` examples use `https://`. | TLS-002 |
| **TLS-051** | Kernel apps | **`kernel-external-app-dispatch` + SDK (future):** document **only** HTTPS origin for API calls; reject or warn on `http://` base URL in SDK default. | Program doc cross-link. | TLS-002 |
| **TLS-052** | OpenClaw | **`defaults.openclawChatUrl`**: path to migrate to **HTTPS** when gateway supports it, or document exception + threat acceptance. | Entry in `meimei-kernel-completion-plan` or waiver line. | D1 |

### Phase P6 — CI gates and release discipline

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-060** | CI | **`scripts/meimei-https-e2e-ci.mjs`** + **`npm run https:e2e-ci`** (in **`npm run ci`**): temp openssl cert, dashboard subprocess, mini TLS proxy, **`GET …/dashboard/api/health`** over HTTPS with temp CA. | Green on Ubuntu + macOS where `openssl` exists; no `meimei.localhost` keychain. | TLS-030, TLS-033 |
| **TLS-061** | Lint | Optional **`scripts/lint-no-insecure-ingress-docs.mjs`**: fail on new `http://127.0.0.1:<dashboard port>` in `docs/**` (allowlist exceptions). | Runs in CI or weekly. | TLS-002 |
| **TLS-062** | Gates | **`releases/*.json`** or **`mac-mini-go-live-checklist`**: add **HTTPS-only** pass/fail step. | Human + machine check listed. | TLS-002 |

### Phase P7 — Observability and failure modes

| ID | Theme | Deliverable | Acceptance | Deps |
|----|--------|-------------|------------|------|
| **TLS-070** | Logs | Boot log line: **public URL** (HTTPS) vs **upstream** (loopback) — no secret material. | Visible in `dashboard` stdout. | TLS-013 |
| **TLS-071** | Health | **`GET /api/health`** JSON field optional: **`transport": "upstream-http"`** + **`publicTls": "meimei-domain"`** for operators. | Documented schema bump if needed. | TLS-070 |

---

## 6. Dependency graph (summary)

```text
TLS-001 (ADR accept)
  → TLS-002, TLS-003
      → TLS-010–013 (edge + bind)
      → TLS-020–022 (certs)
      → TLS-030–033 (clients)
      → TLS-040–043 (app semantics)
      → TLS-050–052 (integrations)
      → TLS-060–062 (CI/gates)
      → TLS-070–071 (observability)

TLS-030 blocks TLS-060
TLS-020 blocks TLS-033
```

---

## 7. Suggested execution order (sprints)

| Sprint | Focus | Exit |
|--------|--------|------|
| **S1** | TLS-001 — TLS-003 | ADR + topology + runbook spine |
| **S2** | TLS-010 — TLS-013, TLS-020 — TLS-021 | Proxy redirect + bind hardening + cert docs |
| **S3** | TLS-030 — TLS-033, TLS-040 | HTTPS smoke path + client env docs |
| **S4** | TLS-050 — TLS-052, TLS-041 — TLS-043 | Integrations + registry strict optional |
| **S5** | TLS-060 — TLS-062, TLS-070 — TLS-071 | CI HTTPS job + go-live gate + health metadata |

---

## 8. Explicit non-goals (this program)

- **Replacing** all outbound `http://` fetches for arbitrary user URLs (e.g. “summarize this link”) unless product decides **TLS-041**-style tightening — that is a **separate** policy decision.
- **Third-party app code signing / PKI** (“certify apps”) — not TLS program scope; see kernel separation (**MM-KERNEL-301**).

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-03-30 | **Delivered (TLS-060):** **`meimei-https-e2e-ci.mjs`** — live HTTPS → dashboard health in CI via ephemeral cert + mini proxy (**`npm run https:e2e-ci`**, part of **`npm run ci`**). |
| 2026-03-30 | **Delivered (phase 1):** **`validate-https-doc-contract.mjs`** + **`npm run https:validate-docs`** in **`npm run ci`** (TLS-061 baseline); topology **TLS-042/043** (forwarded proto + cookies); handbook HTTPS pointer; kernel plan **TLS-052** waiver for **`openclawChatUrl`**; health **`public_https.termination`**. |
| 2026-03-30 | **Delivered (phase 0):** ADR-003 **Accepted** (proxy default); **`meimei-https-topology.v1.md`**; runbook/README/miniapp-contract/checklist; server boot hint + **`GET /api/health`** `public_https` + bind envs; **`MEIMEI_DOMAIN_HTTP_REDIRECT`**; smoke **`MEIMEI_SMOKE_HTTPS`**, probe **`MEIMEI_PROBE_TLS`**; **`npm run dashboard:smoke:https`**, **`dashboard:probe:tls`**. |
| 2026-03-30 | Initial program: rationale, target state, micro-deliverables TLS-001–TLS-071. |
