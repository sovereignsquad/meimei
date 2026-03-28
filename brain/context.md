# Project Context

## Current Project

- **Name**: AI-Native Agent Platform Transformation
- **Goal**: Make agent.meimei a true AI-powered platform with real LLM integration
- **Phase**: Phase 2 Complete - All miniapps use real data

## Active Issues

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| #649 | Lead Enrichment | high | ✅ Real Ollama |
| #563 | Inbox | high | ✅ Real Mail + AI |
| #601 | Memory | high | ✅ Brain system |
| #635 | Mission Control | high | ✅ OpenClaw telemetry |
| #724 | What Next | high | ✅ Direct LLM |
| #516 | Explain It | high | 🔄 CURSOR assigned |

## Miniapps Status

| Miniapp | Status | Data Source |
|---------|--------|-------------|
| Lead Enrichment | ✅ Working | Ollama LLM |
| Inbox | ✅ Working | macOS Mail + Ollama |
| Memory | ✅ Working | Brain (markdown) |
| Mission Control | ✅ Working | OpenClaw telemetry |
| What Next | ✅ Working | Brain + Ollama |
| Explain It | 🔄 CURSOR | External script → LLM |

## Transformation Plan

### Phase 1: LLM Foundation Layer (COMPLETE)
- [x] LLM abstraction layer (dashboard/lib/llm.mjs)
- [x] Brain system (dashboard/lib/brain/)
- [x] Proxy routing fixed

### Phase 2: Real Data Integration (COMPLETE)
- [x] Lead Enrichment - Ollama LLM
- [x] Inbox - macOS Mail + AI prioritization
- [x] Memory - Brain system
- [x] Mission Control - OpenClaw telemetry
- [x] What Next - Direct LLM
- [ ] Explain It - CURSOR converting

### Phase 3: AI Command Interface (NEXT)
- Natural language input
- Context-aware suggestions
- Skill execution (not just docs)
- Learning indicators

## Technical Stack

- **Runtime**: Node.js dashboard/server.mjs
- **LLM**: Ollama (localhost:11434)
- **Models**: llama3:latest, gemma3:1b, qwen3.5:0.8b
- **Orchestration**: OpenClaw
- **Platform**: macOS
- **Coordination**: cursor-kilo.md

## Team

- **OC**: Human operator, product direction
- **CURSOR**: Cursor IDE agent - Explain It conversion
- **KILO**: KiloCode agent - Documentation, coordination
