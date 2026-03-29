# AI / LLM runtime audit — agent.meimei

**Issue:** Product expectation vs implementation truth for “AI-native” behavior.  
**Scope:** Repository code paths that invoke generative models, OpenClaw agent turns, or substitute deterministic/sample data.  
**Method:** Static review of `dashboard/server.mjs`, `dashboard/lib/*`, `scripts/*`, and OpenClaw wrappers (`scripts/oc-*`). No runtime probes in this pass.

---

## Executive summary

| Finding | Severity | Notes |
|--------|----------|--------|
| **Two separate “AI” backends** | **High (clarity)** | **OpenClaw** (`openclaw` CLI → configured cloud/local models) vs **Ollama** (`http://localhost:11434` via `dashboard/lib/llm.mjs`). They are not unified; behavior differs by feature. |
| **Model routing is not LLM-driven** | **Medium (expectations)** | Routing preview uses `scripts/oc-agent --route-only`: **shell rules** (`select_route`, regex task inference). Product language “AI routing” describes **policy + rules**, not a neural router. |
| **Several “apps” use no generative model** | **High (honesty)** | **What next?** (`scripts/what-next.mjs`) uses **hard-coded calendar events**, **static “news” items**, and **tasks.md** parsing only; **Daily briefing** (`scripts/daily-briefing.mjs`) is **markdown/git/ICE extraction** + Apple Notes — **no LLM**. |
| **Inbox falls back to fabricated sample mail** | **High (trust)** | When Mail is unavailable or read fails, responses use **`generateSampleMessages`** with fictional senders/subjects while still returning `ok: true` (sometimes with `source: "sample"`). |
| **Lead enrichment is synthetic-by-prompt** | **Medium** | Ollama is asked to invent “realistic” JSON profiles from minimal inputs — **not** verified third-party enrichment. Labeling should reflect **synthetic / local LLM**, not live CRM data. |
| **Explain-it uses local Ollama** | **Medium (ops)** | After fetch + text extraction, **`callOllamaJson`** (default reasoning model, e.g. `llama3:latest`) with optional Brain context — **not** OpenClaw. Requires Ollama; `provider` in response is `ollama`. |

---

## Taxonomy (how to classify a path)

1. **OpenClaw agent turn** — Subprocess to `scripts/oc-agent` → `openclaw agent …`. Actual model choice lives in **OpenClaw config** (`~/.openclaw/openclaw.json`, `.env`). Repo does not embed OpenAI/Anthropic SDKs for these paths.
2. **Ollama (local)** — HTTP to `localhost:11434` (`dashboard/lib/llm.mjs`: `callOllama`, `callOllamaJson`, `summarize`, etc.).
3. **Deterministic / rules** — Policy engine, routing tables, validators, HTML generation, file parsing, `openclaw gateway status`-style **telemetry** (CLI output parsing).
4. **Sample / stub** — Hard-coded JSON, fake inbox messages, static calendar/news, demo content with optional `warning` fields.

---

## Inventory by operator / API surface

| Surface | Route / entry | Model / intelligence | Class |
|--------|----------------|----------------------|--------|
| Explain it (URL/PDF) | `POST` explain-it API → `summarizeUrlSource` | **Ollama** via `callOllamaJson`; Brain layers `identity`/`user`/`context`/`durable` for OC emphasis | Ollama + file context |
| Dashboard “agent” command | `POST /api/run` `cmd: agent` | **OpenClaw** via `oc-agent --message …` | OpenClaw agent turn |
| iMessage inbound (delivery) | `imessage-adapter` → `runAgentTurn` | **OpenClaw** via `oc-agent` with channel args | OpenClaw agent turn |
| Model routing preview | `GET/POST` routing / API adapter APIs → `previewModelRouting` | **`openclaw-routing-preview.mjs`** (default; parity with **`oc-agent --route-only`**). Legacy: `MEIMEI_ROUTING_PREVIEW_LEGACY_OC_AGENT=1` | Deterministic |
| API channel adapter | `routeViaApiAdapter` | Policy + audit + telemetry + call to `previewModelRouting` | Deterministic + rules |
| Lead enrichment | `POST` lead-enrichment → `enrichLead` | **Ollama** `callOllamaJson` (e.g. `qwen3.5:0.8b`) | Ollama (synthetic JSON) |
| Inbox list (AI sort) | `POST` inbox `useAI: true` | **Ollama** optional; else order unchanged | Ollama optional |
| Inbox list (no Mail) | same | **`generateSampleMessages`** | Sample / stub |
| Inbox read (no Mail / error) | `action: read` fallthrough | **Hard-coded Jane Doe message** | Sample / stub |
| Inbox summary | `summarize` from `llm.mjs` | **Ollama** | Ollama |
| Memory / “brain” | `POST` memory → `brain.*` | **`dashboard/lib/brain/memory.mjs`** uses **`callOllama`** for think/learn/context paths | Ollama + file layers |
| Mission control | `POST` mission-control | **`openclaw` CLI** + log file reads (`telemetry.mjs`) | Deterministic telemetry |
| What next? | `POST` what-next → `what-next.mjs` | **No LLM**; static calendar/news + `tasks.md` + optional Mail AppleScript | Deterministic + sample news |
| Daily briefing | `daily-briefing.mjs` | **No LLM**; `tasks.md`, `ice_meimei.md`, `git status`, Apple Notes | Deterministic |
| Web search (ops panel) | `executeCommand` → `scripts/web-search.mjs` | **DuckDuckGo HTML scrape** — no LLM | Deterministic (web fetch + parse) |
| Config / page layout / telemetry summary APIs | various `GET`/`POST` | JSON / files / in-repo telemetry | Deterministic |

---

## Dependencies and failure modes

| Dependency | If missing / down |
|------------|-------------------|
| `openclaw` on `PATH` | `oc-agent` fails (exit 127); dashboard agent cmd, iMessage turns, routing preview fail. Explain-it does **not** require OpenClaw. |
| Gateway not running | Readiness / doctor / status fail per `oc-readiness`; agent cmd / iMessage turns typically fail. Explain-it still works if Ollama is up. |
| Ollama on `:11434` | `llm.mjs` calls fail; lead enrichment, Brain, inbox AI, **Explain-it** error or skip without it. |
| Apple Mail / Notes / `osascript` | What-next email empty; daily briefing Notes path fails; inbox uses **sample** data. |

---

## Mislabeling risks (UX / product copy)

- **“AI routing”** tool: routing is **rule-based** unless product copy explicitly says “policy + configured route table.”
- **“What next?”**: recommendations can look intelligent while **news and calendar are largely static templates** — disclose data sources.
- **Inbox**: when `source: "sample"`, UI should be unmistakable (banner), not optional `warning` only.
- **Lead enrichment**: “enriched” implies external truth; current behavior is **LLM-generated plausible fiction** from minimal inputs.

---

## Recommendations (prioritized)

1. **Truth-in-labeling** — Add short, visible **data source** strings per miniapp (e.g. “Rules + OpenClaw config”, “Local Ollama only”, “Sample data — Mail not connected”).
2. **Unify or document the split** — Either route more product features through **one** spine (e.g. OpenClaw-only) or publish an **architecture diagram**: OpenClaw vs Ollama vs deterministic.
3. **Replace or gate sample data** — Prefer **explicit demo mode** (`?demo=1` or settings flag) over silent fictional inbox when Mail is absent.
4. **What next / Daily briefing** — If the roadmap promises “AI”, add an **optional** `oc-agent` summarization step over aggregated context, or rename features to “Daily digest (local files)” / “Prioritized queue (rules)”.
5. **CI** — Existing `npm run ci` does not prove OpenClaw or Ollama; add a **documented manual smoke** (`oc-readiness`, one Explain-it request, Ollama health) in `runbook.md` (partially present; extend for Ollama).

---

## Key file references

| Area | Files |
|------|--------|
| OpenClaw wrapper | `scripts/oc-agent`, `scripts/oc-launch`, `scripts/oc-status`, `scripts/oc-doctor` |
| Dashboard agent / summarize | `dashboard/server.mjs` (`previewModelRouting`, `summarizeUrlSource`, `executeCommand`) |
| Ollama client | `dashboard/lib/llm.mjs` |
| Brain / memory LLM | `dashboard/lib/brain/memory.mjs`, `dashboard/lib/brain/index.mjs` |
| Routing / policy | `scripts/oc-agent` (`select_route`, `--route-only`), `dashboard/lib/api-channel-adapter.mjs`, `dashboard/lib/external-channel-policy-engine.mjs` |
| Telemetry (CLI) | `dashboard/lib/telemetry.mjs` |
| What next (no LLM) | `scripts/what-next.mjs` |
| Daily briefing (no LLM) | `scripts/daily-briefing.mjs` |
| Inbox sample fallback | `dashboard/server.mjs` (`generateSampleMessages`, inbox handler) |

---

## Revision

- **2026-03-28** — Initial audit from repository static analysis.
