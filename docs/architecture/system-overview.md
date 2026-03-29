# Architecture

## System Overview

`agent.meimei` is a **100% LLM-based AI-native agent platform** that serves as OC's daily productivity system. The architecture combines:

- **AI Command Interface:** Natural language processing with real LLM (Ollama)
- **6 Miniapps:** All use real data sources (no fake Math.random())
- **Brain System:** Persistent learning memory in markdown
- **Local Runtime:** Dashboard server with macOS integration
- **Machine-checkable validation gates** (readiness, registry, release, policy)

**Key Principle:** Every AI feature uses actual LLM calls — no hardcoded responses, no sample data fallbacks.

---

## Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │   Dashboard  │  │  4 Apps      │  │    AI Command Interface      │  │
│  │    (Home)    │  │  4 Tools     │  │  • Natural language input    │  │
│  │              │  │              │  │  • Context-aware suggestions │  │
│  │ Chat + Suggs │  │ • What Next  │  │  • Intent routing            │  │
│  └──────────────┘  │ • Explain It │  └──────────────────────────────┘  │
│                    │ • Lead Enrich│                                      │
│                    │ • Inbox      │                                      │
│                    │ • Memory     │                                      │
│                    │ • Mission Ctrl                                      │
│                    │ • AI Routing │                                      │
│                    │ • API Access │                                      │
│                    └──────────────┘                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                   DASHBOARD SERVER (Node.js :defaults.port)              │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Route Handlers │  │ API Endpoints│  │   LLM Integration Layer  │   │
│  │  • /649         │  │ • /api/func/*│  │  • callOllama()          │   │
│  │  • /563         │  │ • /api/cmd   │  │  • callOllamaJson()      │   │
│  │  • /601 etc     │  │ • /api/suggs │  │  • parseJsonResponse()   │   │
│  └─────────────────┘  └──────────────┘  └──────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                         LIBRARY MODULES                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │    LLM      │  │    Brain    │  │    Mail     │  │   Telemetry    │ │
│  │ (llm.mjs)   │  │ (brain/*.mjs)│  │(mail-adapter│  │ (openclaw)     │ │
│  │             │  │             │  │   .mjs)     │  │                │ │
│  │ • Ollama    │  │ • identity  │  │ • AppleScript│  │ • Gateway      │ │
│  │ • JSON parse│  │ • user      │  │ • macOS Mail │  │ • Agents       │ │
│  │ • Retry     │  │ • context   │  │             │  │ • Logs         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │    Ollama    │  │   OpenClaw   │  │        macOS System          │  │
│  │  (:11434)    │  │  (:18789)    │  │   • Mail (AppleScript)       │  │
│  │              │  │              │  │   • Notes (optional)         │  │
│  │ Models:      │  │ Agents:      │  │   • Calendar (future)        │  │
│  │ • llama3     │  │ • main       │  │                              │  │
│  │ • gemma3     │  │ • judge      │  │                              │  │
│  │ • qwen3.5    │  │ • drafter    │  │                              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. LLM Layer (`dashboard/lib/llm.mjs`)

**Purpose:** Unified interface to Ollama with production-grade reliability.

### Key Functions

| Function | Purpose |
|----------|---------|
| `callOllama(prompt, opts)` | Direct Ollama API with retry, timeout, streaming |
| `callOllamaJson(prompt, opts)` | Structured JSON responses with schema validation |
| `parseJsonResponse(text)` | Extract JSON from markdown/code blocks/inline |
| `extractFirstJsonObject(text)` | Balanced brace extraction (nested-safe) |
| `checkOllamaHealth()` | Verify Ollama availability |

### Model Selection Strategy

| Model | Task Type | Speed | Notes |
|-------|-----------|-------|-------|
| `qwen3.5:0.8b` | Fast tasks, classification, intent parsing | Fast | Supports `format: "json"`, puts JSON in `thinking` field |
| `gemma3:1b` | General purpose, daily briefing | Medium | Good balance of speed/quality |
| `llama3:latest` | Reasoning, summarization, analysis | Slower | Best quality for complex tasks |

### Robustness Features

- **Retry logic:** Exponential backoff (3 attempts default)
- **Timeout handling:** 120s default, configurable per call
- **JSON extraction:** 4 fallback strategies (direct, code block, balanced, regex)
- **Error recovery:** Returns partial results on parse failure

---

## 2. Brain System (`dashboard/lib/brain/`)

**Purpose:** Persistent learning memory — human-readable, git-tracked, LLM-augmented.

### Memory Layers

| Layer | File | Purpose | Access |
|-------|------|---------|--------|
| Identity | `brain/identity.md` | Who is MeiMei (agent persona) | Read + LLM context |
| User | `brain/user.md` | OC's preferences, goals, constraints | Read + LLM context |
| Context | `brain/context.md` | Current project, active tasks | Read + LLM context |
| Skills | `brain/skills.md` | Available skills catalog | Read + LLM context |
| Durable | `brain/durable.md` | Learned facts and decisions | Append (learn) |
| Log | `brain/log.md` | Activity log (append-only) | Append (log) |

### API Methods

```javascript
// Reasoning with context
await brain.think(repoRoot, "What should OC prioritize?", { depth: "medium" });

// Learn a new fact
await brain.learn(repoRoot, "OC prefers concise responses", "observation");

// Log activity
await brain.log(repoRoot, "Generated daily briefing");

// Build context for prompts
const context = await brain.buildContext(repoRoot, { includeLog: true, logLimit: 20 });
```

### Design Principles

1. **Human-readable:** All layers are markdown
2. **Git-tracked:** Changes visible in version control
3. **LLM-context:** Build context strings for prompts
4. **Append-only logs:** Activity tracking for audit

---

## 3. Apps & Tools (8 Total)

All use **real data sources** — no `Math.random()`, no sample data.

### Apps (4)

| App | Issue | Route | Data Source | LLM Usage |
|-----|-------|-------|-------------|-----------|
| What Next | #724 | `/724` | Brain + Mail | Recommendations |
| Explain It | #516 | `/516` | Web + Ollama | URL summarization |
| Lead Enrichment | #649 | `/649` | Ollama | Profile generation |
| Inbox | #563 | `/563` | macOS Mail | AI priority sorting |

### Tools (4)

| Tool | Issue | Route | Data Source | LLM Usage |
|------|-------|-------|-------------|-----------|
| AI Routing | #517 | `/517` | Config | Model selection |
| API Access | #700 | `/700` | Telemetry | Policy check |
| Memory | #601 | `/601` | Brain (markdown) | Context queries |
| Mission Control | #635 | `/635` | OpenClaw telemetry | Status analysis |

### Common Features

- **Settings cogwheel (⚙️):** Every app/tool has configurable settings
- **Design system CSS:** Uses `public/styles/design-system.css` — no hardcoded styles
- **API endpoints:** `/api/functions/{id}`
- **Registry-driven:** Defined in `functions/registry.v1.json`

---

## 4. AI Command Interface

**Purpose:** Natural language interaction with the system.

### Endpoints

```
POST /api/command              # Process natural language query
GET  /api/command/suggestions  # Get proactive suggestions
```

### Intent Processing Flow

```
User Query
    ↓
parseIntent() via LLM (qwen3.5)
    ↓
Intent Classification + Entity Extraction
    ↓
executeCommand()
    ↓
├── Navigate to app/tool
├── Query Brain
├── Call LLM for response
└── Log activity
```

### Supported Intents

| Intent | Action | Example Query |
|--------|--------|---------------|
| `enrich_lead` | Navigate to Lead Enrichment | "enrich john@example.com" |
| `check_inbox` | Navigate to Inbox | "check my emails" |
| `view_memory` | Navigate to Memory | "what do I know about X" |
| `check_status` | Navigate to Mission Control | "system status" |
| `get_recommendations` | Navigate to What Next | "what should I do" |
| `summarize_url` | Navigate to Explain It | "summarize https://..." |
| `learn_fact` | Add to Brain durable | "remember that OC likes..." |
| `query_context` | General LLM response | "what's my current focus" |

---

## 5. Mail Adapter (`dashboard/lib/mail-adapter.mjs`)

**Purpose:** Real macOS Mail integration via AppleScript.

### Capabilities

| Function | Description |
|----------|-------------|
| `getInboxMessages(opts)` | Fetch emails with filtering |
| `getMessageById(id)` | Get full message content |
| `markAsRead(id)` | Mark email as read |
| `flagMessage(id, bool)` | Flag or unflag email |
| `getUnreadCount()` | Get unread count |
| `isMailAvailable()` | Check if Mail app is running |

### Security

- Requires macOS Mail permissions
- Runs locally only (no cloud)
- AppleScript execution via `osascript`

---

## 6. Telemetry (`dashboard/lib/telemetry.mjs`)

**Purpose:** OpenClaw system monitoring with real data.

### Data Sources

```
openclaw gateway status    → Gateway health
openclaw agents list       → Active agents (main, judge, drafter)
openclaw skills check      → Skill eligibility
~/.openclaw/workspace/logs → Agent execution logs
```

### No Fake Data

- `recentRuns` from real workspace logs
- `agentStatus` from `openclaw agents list`
- `overview.activeAgents` real count
- All timestamps real

---

## Data Flow Examples

### Example 1: Lead Enrichment (Email)

```
User enters "john@example.com"
    ↓ POST /api/functions/lead-enrichment
enrichLead() builds prompt with email
    ↓
callOllamaJson() → Ollama (qwen3.5)
    ↓
LLM generates: { name, title, company, location }
    ↓
Parse JSON response
    ↓
Return to user + brain.log()
```

### Example 2: Natural Language → Action

```
User types "check my inbox"
    ↓ POST /api/command
parseIntent() via LLM
    ↓
{ intent: "check_inbox", confidence: 0.95 }
    ↓
executeCommand() → { action: "navigate", target: "/563/Inbox" }
    ↓
Browser navigates to Inbox
    ↓
Inbox loads real Mail data via AppleScript
```

### Example 3: Daily Briefing Generation

```
User requests briefing
    ↓ POST /api/functions/daily-briefing
Gather context:
  - Brain.buildContext() → identity, user, context layers
  - isMailAvailable() → true/false
  - getUnreadCount() → 5
    ↓
Build LLM prompt with all context
    ↓
callOllamaJson() → Ollama (gemma3)
    ↓
LLM generates structured briefing JSON
    ↓
Format as Markdown
    ↓
Save to briefing.md (if sink=markdown)
    ↓
Return JSON + markdown to user
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                            │
│              https://meimei.localhost:8443                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           meimei-domain.mjs (HTTPS Proxy)                    │
│                                                              │
│  Routing Logic:                                              │
│  • /api/functions/*  → Dashboard (defaults.port)            │
│  • /api/command/*    → Dashboard (defaults.port)            │
│  • /api/*            → OpenClaw Gateway (:18789)            │
│  • /*                → Dashboard (defaults.port)            │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ↓                       ↓
┌─────────────────┐    ┌─────────────────┐
│  DASHBOARD      │    │  OPENCLAW       │
│  (dashboard)    │    │  (:18789)       │
│  Node.js        │    │  Gateway        │
│  server.mjs     │    │  Agent runtime  │
└────────┬────────┘    └─────────────────┘
         │
         ↓ Calls
┌─────────────────┐
│   OLLAMA        │
│   (:11434)      │
│   LLM inference │
└─────────────────┘
```

---

## Configuration Files

| File | Purpose | Loaded By |
|------|---------|-----------|
| `functions/registry.v1.json` | App/tool definitions | `miniapp-registry.mjs` |
| `config/dashboard-surface.v1.json` | Routes, API paths, operator scripts | `dashboard-surface.mjs` |
| `config/page-layout.v1.json` | Page layout (order, spans) | `page-layout.mjs` |
| `brain/*.md` | Memory layers | `brain/memory.mjs` |
| `cursor-kilo.md` | Agent coordination | Manual |

---

## Security & Privacy

### Local-First Architecture

- **LLM:** Local Ollama only (localhost:11434)
- **Mail:** Local macOS Mail (AppleScript)
- **Data:** No cloud services for core functions
- **Memory:** Git-tracked markdown (transparent)

### No External AI Services

- No OpenAI API calls
- No cloud LLM providers
- No telemetry to third parties

---

## Key Design Principles

1. **Real AI:** Every AI feature uses actual LLM calls
2. **Real Data:** No fake data, no `Math.random()`, no samples
3. **Transparent:** All memory human-readable (markdown)
4. **Local:** Core functions run on local machine
5. **Extensible:** Modular app/tool + adapter architecture

---

## Development Workflow

1. **Coordination:** `cursor-kilo.md` for KILO + CURSOR task assignment
2. **Implementation:** Edit → Test → Log activity
3. **Testing:** `curl` commands for API verification
4. **Documentation:** Brain files + ARCHITECTURE.md

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-28 | Phase 3 Complete — 100% LLM-based, all 8 apps/tools real data, AI Command Interface, Daily Briefing direct LLM |

---

**Maintained by:** KILO + CURSOR  
**For:** OC (Operator)  
**License:** Private
