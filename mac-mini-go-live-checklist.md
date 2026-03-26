# MeiMei Mac Mini Go-Live Checklist

Use this before declaring the second Mac mini ready for daily operation.

## Pass/Fail Gates

### 1. Base machine readiness

- [ ] macOS is installed and updated
- [ ] Homebrew is installed
- [ ] `git`, `node`, `npm`, `jq`, `gh`, `openssl`, `docker`, `ollama`, `openclaw`, `osascript`, and `curl` are available

### 2. Repo and dependencies

- [ ] `agent.meimei` is cloned on the target machine
- [ ] `npm install` succeeds
- [ ] `pdf-parse` is installed
- [ ] `~/.openclaw/.env` exists
- [ ] `OPENROUTER_API_KEY` is present in `~/.openclaw/.env`

### 3. OpenClaw runtime

- [ ] `~/.openclaw/openclaw.json` exists
- [ ] `npm run config:seed` succeeds on the target machine
- [ ] Gateway bind is loopback
- [ ] Gateway port is canonical and matches the launcher
- [ ] `./scripts/oc-status` passes
- [ ] `./scripts/oc-doctor --non-interactive` passes or the remaining findings are explicitly accepted

### 4. Local models

- [ ] Ollama is installed and running
- [ ] `granite4:350m` is available
- [ ] `gemma3:1b` is available
- [ ] `qwen3.5:0.8b` is available
- [ ] The image model fallback is present or the dashboard is configured to degrade gracefully

### 5. Dashboard and proxy

- [ ] `./scripts/meimei-domain install` succeeds
- [ ] `http://127.0.0.1:3030/` returns `200`
- [ ] `https://meimei.localhost:8443/dashboard/` returns `200`
- [ ] The dashboard root loads the miniapp catalog

### 6. Function checks

- [ ] `Any-URL summarization in seconds` loads
- [ ] `Daily briefing` loads
- [ ] `Per-channel model routing by task type and cost` loads
- [ ] URL summarization returns a real result
- [ ] Daily briefing writes to Apple Notes and falls back to markdown if needed
- [ ] Routing preview returns a deterministic route

### 7. Watchers and recovery

- [ ] `launchd` keeps the proxy and dashboard UI alive
- [ ] Gateway recovery behavior is documented
- [ ] Session/transcript cleanup is documented
- [ ] The sandbox image used by `openclaw doctor` exists
- [ ] There is a documented manual recovery path if the gateway does not connect immediately

### 8. Operational safety

- [ ] WhatsApp group allowlist is intentional and documented
- [ ] DM behavior is intentional and documented
- [ ] Apple Notes automation permissions are granted
- [ ] Markdown fallback exists for briefing persistence
- [ ] `scripts/web-search` works as a no-key fallback

## Go-Live Decision

Declare the machine ready only if:

- all required base tools are installed
- the dashboard and proxy open correctly
- the gateway is on the canonical port
- the three shipped miniapps work
- the remaining doctor findings are either fixed or explicitly accepted

If any gate fails, do not call the machine production-ready.
