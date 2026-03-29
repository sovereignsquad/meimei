# MeiMei environment UI & storage — contract v1

**Purpose:** Lock storage, security boundaries, and naming rules for “Vercel-style” secrets in the dashboard—**before** expanding UI or adding second sources of truth.

## Answer: dashboard web vs Swift menubar

| Surface | Role |
|---------|------|
| **Dashboard (browser)** | **Primary** editor: long lists, monospace values, reveal/copy, catalog hints, profile toggles (Production / Preview / Development). Served under the same HTTPS proxy as the rest of MeiMei. |
| **Swift menubar** | **Optional:** menu item **“Open environment variables”** → `open()` the dashboard URL (`/dashboard/726/Environment_variables` or canonical path from registry). **Do not** duplicate the full CRUD UI in AppKit—too easy to drift from validation rules and leak UX for secrets. |

**Verdict:** **Standalone web page (dashboard miniapp)** is the configuration manager; the menubar is a **launcher**, not the editor.

## Current implementation (source of truth)

The platform **already ships** this UI (not React—it is server-rendered HTML + JS in `dashboard/server.mjs`):

| Piece | Location |
|-------|-----------|
| **UI route** | Registry miniapp `environment-variables` → e.g. `/dashboard/726/Environment_variables` |
| **Storage (SoT)** | **`data/meimei-environment.v1.json`** — gitignored, `chmod 600` when possible |
| **Runtime** | Loaded on dashboard boot; entries applied to **`process.env`** per **`MEIMEI_ENV_PROFILE`** (`development` \| `preview` \| `production`) |
| **Catalog hints** | `config/meimei-env-catalog.v1.json` |
| **API** | `POST .../environment-variables` — `list`, `upsert`, `reveal`, `delete`, **`export_dotenv`**, etc. |

**Security (MVP):** Secrets live in a **local JSON file**, not inside an app database—no chicken-and-egg encrypted DB. Do not store secrets in SQLite `meimei_jobs` or telemetry tables.

## `.env` vs JSON — single writer rule

| Approach | Use |
|----------|-----|
| **Keep JSON as SoT** | **Recommended.** One file to backup, one code path to validate, profile metadata preserved. |
| **`.env` text** | **Derived artifact:** use API action **`export_dotenv`** (or a future **“Download .env”** button) for tools that only read dotenv. Optionally **import** from pasted `.env` text in a controlled action—still persisted into JSON after parse. |
| **Parallel `.env` + JSON** (two live writers) | **Forbidden** unless a future spec defines a single sync master and automated merge—otherwise operators get silent drift. |

If the product **must** mirror to a repo-root `.env` for another tool, treat it as **export-only** or a **one-way write** triggered after save from the same transaction that updates JSON—document that pipeline explicitly in a revision of this contract.

## Naming convention (architect rule)

**Target pattern for new keys (apps & integrations):**

```text
<APPIDENTIFIER>_<VARNAME>
```

Examples: `CHECKLIST_MONGODB_URI`, `MEIMEI_OPENAI_API_KEY`, `INBOX_MAILBOX_NAME`.

- **`APPIDENTIFIER`:** `A–Z` then `A–Z0–9` (no lowercase required but uppercase recommended).
- **`VARNAME`:** `A–Z` then `A–Z0–9_`.

**Regex vs allowlist:** Almost all integration keys already match **`/^[A-Z0-9]+_[A-Z0-9_]+$/`** (the underscore does the work). **`SYSTEM_ALLOWLIST`** in `meimei-env-store.mjs` is **only** for single-segment POSIX-style names (e.g. `PORT`, `HOME`) so strict mode does not brick the proxy. Do **not** maintain an exhaustive list of every `OPENAI_*` or `MEIMEI_*` key—that list goes stale immediately.

**Enforcement (shipped):**

1. **Soft (dashboard):** Yellow hint under the name field and a small **`!`** flag in the table when the key is not in `SYSTEM_ALLOWLIST` and does not match **`/^[A-Z0-9]+_[A-Z0-9_]+$/`**. Saves are **not** blocked.
2. **Strict (optional):** Set **`MEIMEI_ENV_STRICT_KEY_NAMES=1`** (or `true` / `yes`) so **`upsert`** rejects keys that fail the recommended pattern unless they are on **`MEIMEI_ENV_SYSTEM_ALLOWLIST`**. Default is **off** for backward compatibility.

Keys must still match the existing technical pattern: **`^[A-Za-z_][A-Za-z0-9_]*$`** (see `dashboard/lib/meimei-env-store.mjs`).

**API:** `list` and `catalog` responses include **`keyNaming`**: `{ recommendedPattern, systemAllowlist, strictNamesEnabled }`.

## UI constraints (Vercel-like)

- Same-origin dashboard only; **reveal** must not be exposed on public hostnames without auth (today: local / trusted operator).
- Mask by default; plaintext only on explicit **reveal** action.
- No secrets in URL query strings.

## Appendix: platform configuration surface (audit, v1)

Inventory of environment variable **names** referenced in this repository’s Node tooling (`process.env` reads, including `config/dashboard-surface.v1.json` indirection). Keys that match **`/^[A-Z0-9]+_[A-Z0-9_]+$/`** do **not** need to appear on **`MEIMEI_ENV_SYSTEM_ALLOWLIST`**. Regenerate this appendix when adding new first-class env reads.

### Dashboard surface (`envKeys` → `process.env[…]`)

| Name |
|------|
| `MEIMEI_OPENCLAW_CHAT_URL` |
| `MEIMEI_SETUP_COMMAND` |
| `OPENCLAW_CONFIG_PATH` |
| `PORT` |

### Core dashboard, jobs, inference

| Name |
|------|
| `AGENT_SHARED_SECRET` |
| `MEIMEI_AGENT_CHAPPIE_SHARED_SECRET` |
| `MEIMEI_CHECKLIST_LOCAL_UPSTREAM` |
| `MEIMEI_CHECKLIST_UPSTREAM_PATH_PREFIX` |
| `MEIMEI_INFERENCE_MAX_CONTEXT` |
| `MEIMEI_JOB_MAX_FAILURES` |
| `MEIMEI_JOB_POLL_MS` |
| `MEIMEI_JOB_WORKER` |
| `MEIMEI_LLM_GATEWAY_SECRET` |
| `MEIMEI_PUBLIC_PREFIX` |
| `OLLAMA_HOST` |

### Agent Chappie bridge, Python worker env, Neon queue consumer

| Name |
|------|
| `AGENT_LOCAL_DB_PATH` |
| `AGENT_SHARED_SECRET` |
| `AGENT_WORKER_HOST` |
| `AGENT_WORKER_PORT` |
| `APP_QUEUE_BASE_URL` |
| `DATABASE_URL` |
| `MEIMEI_AGENT_CHAPPIE_AUTO_START` |
| `MEIMEI_AGENT_CHAPPIE_DATABASE_URL` |
| `MEIMEI_AGENT_CHAPPIE_DB_PATH` |
| `MEIMEI_AGENT_CHAPPIE_ENGINE` |
| `MEIMEI_AGENT_CHAPPIE_PYTHON` |
| `MEIMEI_AGENT_CHAPPIE_ROOT` |
| `MEIMEI_AGENT_CHAPPIE_SHARED_SECRET` |
| `MEIMEI_AGENT_CHAPPIE_WORKER_HOST` |
| `MEIMEI_AGENT_CHAPPIE_WORKER_PORT` |
| `MEIMEI_LLM_GATEWAY_SECRET` |
| `OLLAMA_URL` (injected into child process env from bridge) |
| `WORKER_COMPLETE_ATTEMPTS` |
| `WORKER_FAIL_ATTEMPTS` |
| `WORKER_HTTP_TIMEOUT_CLAIM` |
| `WORKER_HTTP_TIMEOUT_COMPLETE` |
| `WORKER_HTTP_TIMEOUT_FAIL` |
| `WORKER_HTTP_TIMEOUT_WORKSPACE` |
| `WORKER_QUEUE_DRAIN_ONCE` |
| `WORKER_QUEUE_POLL_SECONDS` |
| `WORKER_QUEUE_SHARED_SECRET` |
| `WORKER_RETRY_SLEEP_CAP_SECONDS` |
| `WORKER_WORKSPACE_ATTEMPTS` |

### HTTPS proxy / domain helper (`scripts/meimei-domain.mjs`)

| Name |
|------|
| `HOME` |
| `MEIMEI_DASHBOARD_PORT` |
| `MEIMEI_LAUNCHD_SOCKET` |
| `MEIMEI_PUBLIC_HOST` |
| `MEIMEI_PUBLIC_PREFIX` |
| `OPENCLAW_GATEWAY_PORT` |

### Env store & profile

| Name |
|------|
| `MEIMEI_ENV_PROFILE` |
| `MEIMEI_ENV_STRICT_KEY_NAMES` |

### Supabase connector

| Name |
|------|
| `MEIMEI_SUPABASE_ANON_KEY` |
| `MEIMEI_SUPABASE_SERVICE_ROLE` |
| `MEIMEI_SUPABASE_URL` |

### Adapters & demos

| Name |
|------|
| `MEIMEI_FILE_DROP_POLL_MS` |
| `MEIMEI_OBSIDIAN_DEBOUNCE_MS` |
| `MEIMEI_OBSIDIAN_EGRESS_POLL_MS` |
| `MEIMEI_OBSIDIAN_VAULT` |
| `MEIMEI_REPO_ROOT` |

### Reference app (queue demo)

| Name |
|------|
| `REFAPP_FEATURE_TOGGLE` |
| `REFAPP_MAX_PROMPT_CHARS` |

### Operator scripts

| Name |
|------|
| `CHECKLIST_WEB_APP` |
| `MEIMEI_AGENT_CHAPPIE_ENGINE` |
| `MEIMEI_BRIEFING_DIR` |
| `MEIMEI_BRIEFING_FOLDER` |
| `MEIMEI_BRIEFING_NOTES_ACCOUNT` |
| `MEIMEI_BRIEFING_NOTES_ACTIVATE` |
| `MEIMEI_BRIEFING_SINK` |
| `OPENCLAW_CONFIG_PATH` |

### Catalog-suggested (integrations; not all read in repo `.mjs`)

Examples from `config/meimei-env-catalog.v1.json`: `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`, `NOTION_API_KEY`, `OLLAMA_API_KEY`, `OPENAI_API_KEY`, `OPENCLAW_AGENT`, `OPENCLAW_BIN`, `OPENCLAW_CHANNEL`, `OPENCLAW_COST_TARGET`, `OPENCLAW_ROUTE_ONLY`, `OPENCLAW_ROUTE_REPORT`, `OPENCLAW_TASK_TYPE`, `OPENROUTER_API_KEY`, `ORIGINAL_PIPELINE_MEIMEI_GATEWAY_SECRET`, `ORIGINAL_PIPELINE_MEIMEI_GATEWAY_URL`, `ORIGINAL_PIPELINE_MEIMEI_MODEL`, `SHERPA_ONNX_MODEL_DIR`, `SHERPA_ONNX_RUNTIME_DIR`, `TRELLO_API_KEY`, `TRELLO_TOKEN`, and additional `MEIMEI_*` / `OPENCLAW_*` entries in that file.

---

## Versioning

Bump this file when SoT changes, when dotenv import/export semantics change, when strict naming defaults change, or when the configuration surface in the appendix changes materially.
