# Durable Memory

## Learned Facts

### Phase 1: LLM Foundation Layer (COMPLETE)

- [2026-03-28] LLM abstraction layer created in `dashboard/lib/llm.mjs` with:
  - `callOllama()` - direct Ollama API with retry, timeout, streaming support
  - `callOllamaJson()` - JSON-structured responses with schema validation
  - `parseJsonResponse()` - robust extraction from markdown/code blocks
  - Model selection by task: fast (qwen3.5), medium (gemma3), reasoning (llama3)
  - Handles `format: "json"` and `thinking` field for qwen3.5

- [2026-03-28] Brain system created in `dashboard/lib/brain/`:
  - 6 layers: identity, user, context, skills, durable, log
  - `think()` - LLM-powered reasoning with context
  - `learn()` - append durable facts
  - `log()` - activity logging
  - Markdown-based, human-readable, git-tracked

- [2026-03-28] Proxy routing fixed in `scripts/meimei-domain.mjs`:
  - `/api/functions/*` routes to dashboard (port 3030)
  - `/api/*` routes to OpenClaw gateway (port 18789)

### Phase 2: Real Data Integration (COMPLETE)

- [2026-03-28] Lead Enrichment (#649): Real Ollama LLM integration
  - Email, LinkedIn, company, phone enrichment
  - `format: "json"` with fallback parsing
  - Guard against unknown sources

- [2026-03-28] Inbox (#563): Real macOS Mail integration
  - AppleScript adapter in `dashboard/lib/mail-adapter.mjs`
  - AI priority sorting with LLM
  - Mark read, flag, delete operations

- [2026-03-28] Memory (#601): Real Brain system integration
  - Identity, Context, Events (Log) layers
  - Line-by-line markdown parser (no regex)
  - `think`, `learn`, `query` actions

- [2026-03-28] Mission Control (#635): Real OpenClaw telemetry
  - `dashboard/lib/telemetry.mjs` - gateway status, agents, logs
  - No more `Math.random()` fake data
  - Real agent list: main, judge, drafter

- [2026-03-28] What Next (#724): Converted to direct LLM
  - Brain context + Mail data fed to prompt
  - Direct `callOllama()` instead of external script
  - Real AI recommendations

### System Architecture Learned

- [2026-03-28] Ollama at localhost:11434 with models:
  - llama3:latest (reasoning)
  - gemma3:1b (medium speed)
  - qwen3.5:0.8b (fast, supports format:json)

- [2026-03-28] OpenClaw gateway at port 18789:
  - Agents: main, judge, drafter
  - Skills: 16 eligible, 34 missing requirements
  - Workspace logs for telemetry

- [2026-03-28] Design system in `public/styles/design-system.css`:
  - Components: flashcards, nav chips, panels, modals
  - Themes: green, blue, orange, red
  - Markdown rendering: `.ds-markdown` class

## Key Decisions

- [2026-03-28] All miniapps must use REAL data sources (no fake Math.random())
- [2026-03-28] External scripts phased out in favor of direct LLM calls
- [2026-03-28] Brain system is the single source of truth for memory
- [2026-03-28] CURSOR + KILO parallel coordination via `cursor-kilo.md`

## User Preferences Learned

- OC prefers concise, direct responses
- No conversational filler or unnecessary preamble
- Proactive suggestions based on context
- Real AI integration, not hardcoded data
- System should learn and improve over time
- macOS system integration (Mail, Calendar, Notes)

## Technical Insights

- Template literal regex escaping is fragile - use `new RegExp()` with strings
- Ollama `format: "json"` puts output in `thinking` field for some models
- Port 3030 requires `pkill -9 node` when stuck
- AppleScript requires Mail app permissions
- Proxy path stripping: `/dashboard/api/*` → `/api/*`

## Coordination

- [2026-03-28] CURSOR (Cursor IDE) and KILO (KiloCode) working in parallel
- Shared coordination file: `cursor-kilo.md`
- Task queue with explicit ownership
- OC feedback loop for testing
- [2026-03-28] remember that OC likes dark mode *(source: user_command)*

## MVP Factory Structure

- [2026-03-28] MVP Factory is a multi-product organization managed from one unified board
- **Project repo**: `moldovancsaba/mvp-factory-control`
- **Project board**: https://github.com/users/moldovancsaba/projects/1
- **Products on board**: {reply} (13 items), {sovereign} (10), {hatori} (5), mvp-factory-control (2)
- **agent.meimei is NOT on the board yet** — issues tracked in agent.meimei repo only
- Product issues are not the same as project board items — each product has its own repo, but development is coordinated on the unified board
- Board statuses: IDEA BANK (20), Backlog SOONER (4), Roadmap LATER (3), Done (2), Review (1)
