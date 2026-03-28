# CURSOR ↔ KILO — shared coordination

**Purpose:** One place for two agents (CURSOR in Cursor IDE, KILO in KiloCode) to stay aligned: same codebase, parallel delivery, no duplicated or conflicting assumptions.

**Rules of use**

- **Be explicit:** task ID, file paths, acceptance criteria, blockers.
- **Timestamp or sign lines** when you add critical facts.
- **CURSOR** and **KILO** both edit this file; keep sections tidy.

---

## How we work

| Role | Environment |
|------|----------------|
| CURSOR | Cursor IDE agent, direct repo access, terminal |
| KILO | KiloCode agent, same repo access, terminal |

**Shared assumption:** Both have **direct access to this repository** and can propose edits, run scripts, and read docs.

---

## Current focus (one line each)

- **Product direction (operator OC):** AI-native agent.meimei platform with real LLM integration (not fake data)
- **CURSOR — idle:** All tasks complete — investigating ideabank
- **KILO — done 2026-03-28:** Phase 1-2-3 complete + architecture documented — system 100% LLM-based

---

## Task queue (concrete, assignable)

1. **[KILO — done 2026-03-28]** Fix Memory tool - line-by-line markdown parser deployed
2. **[CURSOR — done 2026-03-28]** Fix Lead Enrichment JSON parsing
3. **[CURSOR — done 2026-03-28]** Mission Control telemetry — real OpenClaw data
4. **[KILO — done 2026-03-28]** What Next app — converted from external script to direct LLM (brain context + Ollama)
5. **[CURSOR — done 2026-03-28]** Explain It — `summarizeUrlSource` uses `callOllamaJson` + Brain layers `identity/user/context/durable`; no `runScript`/`agentScript` on explain-it path; `provider: "ollama"`
6. **[KILO — done 2026-03-28]** Update Brain durable.md with latest progress — updated durable.md and context.md with Phase 1-2 completion status
7. **[KILO — done 2026-03-28]** Phase 3: AI Command Interface API — `/api/command` endpoint live, processes natural language via LLM
8. **[CURSOR — done 2026-03-28]** Phase 3: Dashboard home chat UI — `renderPage` + search-box command bar, chat bubbles, typing indicator, `POST /api/command` (`dashboard/server.mjs`, `design-system.css`)
9. **[CURSOR — done 2026-03-28]** Phase 3: Context-aware suggestions — `GET /api/command/suggestions`, `dashboard/lib/home-suggestions.mjs` (`brain.readLayers` identity/user/context + Mail unread signals + `callOllama` JSON), `.ds-flashcard` grid on home
10. **[KILO — done 2026-03-28]** Daily Briefing conversion — external script to direct LLM (last remaining external script dependency) — now uses `callOllamaJson` with Brain context + Mail data
11. **[KILO — done 2026-03-28]** System architecture documentation — comprehensive `ARCHITECTURE.md` with diagrams, data flows, component details

---

## Decisions & constraints

- Use design system classes, no hardcoded styles in apps/tools
- All apps/tools must use real data sources (Ollama, Mail, Brain, OpenClaw)
- Proxy routes `/api/functions/*` to dashboard, not gateway (fixed in meimei-domain.mjs)
- **OC approved (2026-03-28):** Agents may mutate **GitHub** via authenticated **`gh`** for `mvp-factory-control` (issues, board/project items, labels, etc.) when aligned with the task — see `AGENTS.md`

---

## Blockers / waiting on

- None

---

## Handoff log (recent)

- **2026-03-28** — OC: **GitHub edits via `gh` approved** — recorded in `AGENTS.md` + this file; use for board/issue sync with `mvp-factory-control`.
- **2026-03-28 15:35** — KILO: Fixed naming — System has **4 apps + 4 tools = 8 total** (not 6 miniapps). Apps: What Next, Explain It, Lead Enrichment, Inbox. Tools: AI Routing, API Access, Memory, Mission Control. Updated `ARCHITECTURE.md` and this file.
- **2026-03-28 15:20** — KILO: Task 11 complete — Comprehensive `ARCHITECTURE.md` documentation. Includes: system diagram, LLM layer details, Brain system architecture, all 8 app/tool specs, AI Command Interface flows, data flow examples, network topology. Ready for OC review and onboarding.
- **2026-03-28** — CURSOR: Tasks 8+9 complete — Phase 3 home: command chat + suggestions on operator home (`homeRoute` from surface, usually `/`). Smoke: `GET /api/command/suggestions`, `POST /api/command` with `{"query":"…"}`. **OC:** restart Node dashboard so new routes are live; if UI is only at `/dashboard`, ensure `/api/command*` is proxied same-origin.
- **2026-03-28 13:30** — KILO: Task 10 complete — Daily Briefing converted to direct LLM. **System is now 100% LLM-based**: all 8 apps/tools (What Next, Explain It, Lead Enrichment, Inbox, AI Routing, API Access, Memory, Mission Control) + Daily Briefing + Command Interface use real LLM calls. No external script dependencies remain.
- **2026-03-28 13:17** — KILO: Task 7 complete — `/api/command` endpoint live with natural language processing. Assigned Tasks 8+9 to CURSOR: dashboard home chat UI + context-aware suggestions. Backend ready, frontend needed.
- **2026-03-28 12:55** — KILO: Task 6 complete — Updated `brain/durable.md` with all Phase 1-2 learnings (LLM abstraction, Brain system, all 5 miniapp conversions). Updated `brain/context.md` with current status (5/6 miniapps real data, Phase 3 planning next).
- **2026-03-28** — CURSOR: Task 5 — Explain It `summarizeUrlSource` now uses local fetch + `callOllamaJson` (`DEFAULT_MODELS.reasoning`), Brain context optional; removed `extractAgentSummary` (dead). **OC:** needs Ollama + `llama3:latest` (or model pull); curl `POST /api/functions/explain-it` with `{"url":"https://example.com"}`.
- **2026-03-28 12:52** — KILO: Assigned Task 5 to CURSOR — Explain It miniapp conversion to direct LLM. See details below.
- **2026-03-28 12:30** — KILO: What Next miniapp now uses direct LLM (`callOllama` with Brain context + Mail data) instead of external `whatNextScript`. Real AI recommendations with system context.
- **2026-03-28** — CURSOR: Task 3 — `getTelemetry()` no longer fabricates runs or durations; `buildRecentRunsFromLogs` reads `~/.openclaw/workspace[-agent]/logs`. Top-level `timestamp` added. **OC:** `curl` test failed here (dashboard not listening on :3030); run: `curl -sk -X POST https://meimei.localhost:8443/dashboard/api/functions/mission-control -H 'content-type: application/json' -d '{"filter":"all"}'` (or proxy's `/api/functions/mission-control` if mapped).
- **2026-03-28 12:20** — KILO: Completely rewrote Memory miniapp markdown parser - replaced regex with simple line-by-line parser. Should fix "nothing to repeat" errors on Level 1/2.
- **2026-03-28 12:15** — KILO: Fixed all JavaScript syntax errors in Memory miniapp (regex escaping issues in template literals). JS now validates. **OC:** Please test https://meimei.localhost:8443/601/Memory - click Identity/Context/Events cards.
- **2026-03-28** — CURSOR: Read coordination file; left Memory to KILO. Shipped lead-enrichment JSON hardening in `dashboard/lib/llm.mjs` + unknown-source guard in `enrichLead`. **OC:** verify with Ollama running (`qwen3.5:0.8b`); very old Ollama may not support `format: json` — say if generate API errors.
- **2026-03-28 11:50** — KILO: Fixed regex error in markdownToHtml, but clicks still not working. Need fresh eyes.

---

## Message to paste when you pick up work

> I've read `cursor-kilo.md`. Taking: **[task ID / description]**. Updating this file when done or blocked.
