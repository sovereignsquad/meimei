# MeiMei Mac Mini Migration Audit

This is the strongest operational audit for moving `agent.meimei` to a second Mac mini and keeping it usable all day, every day.

## Goal

Move the product to another Mac mini with:

- no repo-relative path assumptions
- clear install order
- explicit service wiring
- documented fallbacks
- visible watchers and health checks
- stable launch and recovery behavior

## What Must Exist

### Operating system

- macOS
- `launchctl`
- `osascript`
- local browser access

### Package and runtime tools

- `git`
- `node`
- `npm`
- `gh`
- `jq`
- `openssl`
- `docker`
- `ollama`
- `brew`
- `curl`

### OpenClaw runtime

- `openclaw` binary in `PATH`
- `openclaw.config.json` seed template in the repo
- `~/.openclaw/openclaw.json`
- `~/.openclaw/.env`
- `~/.openclaw/workspace`
- `~/.openclaw/certs`
- `~/.openclaw/briefings`
- `~/.openclaw/agents/main/sessions`

### Repo dependencies

- `pdf-parse` from `npm install`

### Browser and notes automation

- Apple Notes app
- Apple automation permissions for Notes
- browser access to `https://meimei.localhost:8443/dashboard/`

### Optional but currently configured channel support

- WhatsApp integration in OpenClaw config
- local allowlist behavior for group messages

## Current Live Tooling

These were verified on the current machine:

- `node v25.8.2`
- `npm 11.11.1`
- `openclaw 2026.3.13 (61d171a)`
- `docker 29.3.1`
- `gh 2.88.1`
- `jq 1.8.1`
- `openssl 3.6.1`
- `ollama binary from Homebrew 0.18.2, but the client still reports 0.17.7 with a 0.18.2 client warning`
- `brew 5.1.1`

## Cleanup State

On this machine, the session store and transcript folder have been cleaned up safely:

- session store reduced to 4 active entries
- orphan transcript artifacts quarantined into `~/.openclaw/agents/main/sessions/orphan-archive`
- gateway remained on the canonical loopback service at `18789`

## Current Model Topology

### Local Ollama models already present

These are the local text models currently available:

- `granite4:350m`
- `gemma3:1b`
- `qwen3.5:0.8b`

Other local models are also installed in Ollama, but the OpenClaw config currently depends on the three above as the local fallback set.

### OpenRouter models currently configured

The live config exposes the free OpenRouter catalog and uses:

- primary: `openrouter/free`
- image primary: `openrouter/nvidia/nemotron-nano-12b-v2-vl:free`

Configured free OpenRouter fallbacks currently include:

- `openrouter/arcee-ai/trinity-large-preview:free`
- `openrouter/arcee-ai/trinity-mini:free`
- `openrouter/cognitivecomputations/dolphin-mistral-24b-venice-edition:free`
- `openrouter/google/gemma-3-12b-it:free`
- `openrouter/google/gemma-3-27b-it:free`
- `openrouter/google/gemma-3-4b-it:free`
- `openrouter/google/gemma-3n-e2b-it:free`
- `openrouter/google/gemma-3n-e4b-it:free`
- `openrouter/liquid/lfm-2.5-1.2b-instruct:free`
- `openrouter/liquid/lfm-2.5-1.2b-thinking:free`
- `openrouter/meta-llama/llama-3.2-3b-instruct:free`
- `openrouter/meta-llama/llama-3.3-70b-instruct:free`
- `openrouter/minimax/minimax-m2.5:free`
- `openrouter/mistralai/mistral-small-3.1-24b-instruct:free`
- `openrouter/nousresearch/hermes-3-llama-3.1-405b:free`
- `openrouter/nvidia/nemotron-3-nano-30b-a3b:free`
- `openrouter/nvidia/nemotron-3-super-120b-a12b:free`
- `openrouter/nvidia/nemotron-nano-12b-v2-vl:free`
- `openrouter/nvidia/nemotron-nano-9b-v2:free`
- `openrouter/openai/gpt-oss-120b:free`
- `openrouter/openai/gpt-oss-20b:free`
- `openrouter/qwen/qwen3-4b:free`
- `openrouter/qwen/qwen3-coder:free`
- `openrouter/qwen/qwen3-next-80b-a3b-instruct:free`
- `openrouter/stepfun/step-3.5-flash:free`
- `openrouter/z-ai/glm-4.5-air:free`

### Local model fallback chain

The current local fallback chain is:

1. `ollama/granite4:350m`
2. `ollama/gemma3:1b`
3. `ollama/qwen3.5:0.8b`

## Required Secrets And Environment

The current environment uses these secrets or env vars:

- `OPENROUTER_API_KEY`
- `OLLAMA_API_KEY`

`OPENROUTER_API_KEY` is a hard dependency for the current remote free-model setup.

`OLLAMA_API_KEY` is present in the local env file, but the local Ollama service itself does not require an API key. Treat it as optional unless a future wrapper consumes it.

Cloud secrets should live in Vercel and be pulled into the target machine during bootstrap. See [vercel-env-inventory.md](./vercel-env-inventory.md) for the split between Vercel-managed secrets and local-only settings.

Path and service env vars used by the repo:

- `OPENCLAW_CONFIG_PATH`
- `OPENCLAW_BIN`
- `OPENCLAW_GATEWAY_PORT`
- `MEIMEI_PUBLIC_URL`
- `MEIMEI_PUBLIC_HOST`
- `MEIMEI_PUBLIC_PREFIX`
- `MEIMEI_DASHBOARD_PORT`
- `MEIMEI_LAUNCHD_SOCKET`
- `MEIMEI_SETUP_COMMAND`
- `MEIMEI_BRIEFING_DIR`
- `MEIMEI_BRIEFING_FOLDER`
- `MEIMEI_BRIEFING_SINK`
- `OPENCLAW_CHANNEL`
- `OPENCLAW_TASK_TYPE`
- `OPENCLAW_COST_TARGET`
- `OPENCLAW_ROUTE_REPORT`
- `OPENCLAW_ROUTE_ONLY`
- `OPENCLAW_AGENT`

## Install Order

### 1. Install base tooling

Use Homebrew on the target Mac mini, then install:

- `git`
- `node`
- `npm`
- `jq`
- `gh`
- `openssl`
- `docker`
- `ollama`

Example:

```bash
brew install git node jq gh openssl docker ollama
```

### 2. Install OpenClaw

Install the `openclaw` binary so it is available in `PATH`.

The repo wrappers look for:

- `openclaw` in `PATH`
- `/opt/homebrew/bin/openclaw`
- `/usr/local/bin/openclaw`

### 3. Clone the repo

Clone `agent.meimei` to any directory. The runtime should not depend on a fixed user path.

### 4. Install JavaScript dependencies

Run:

```bash
npm install
```

This installs `pdf-parse`, which the dashboard uses for PDF summarization.

### 5. Provision local model files

Pull the required Ollama models:

```bash
ollama pull granite4:350m
ollama pull gemma3:1b
ollama pull qwen3.5:0.8b
```

If you want the broader local fallback pool used by this workspace, also keep the additional Ollama models already present on the current machine.

### 6. Provision OpenRouter access

Add `OPENROUTER_API_KEY` to `~/.openclaw/.env`.

This enables the remote free-model catalog in the live OpenClaw config.

### 7. Provision OpenClaw config

Render the live config from the repo seed:

- `npm run config:seed`

This generates:

- `~/.openclaw/openclaw.json`

Make sure the second machine gets the same logical settings:

- gateway bound to loopback
- local control origins only
- Ollama as memory provider
- WhatsApp allowlist enabled
- Apple Notes workflow enabled
- OpenRouter model catalog and fallbacks present

### 8. Install the local domain services

Run:

```bash
./scripts/meimei-domain install
```

This installs:

- dashboard service on `127.0.0.1:3030`
- HTTPS local domain proxy on `https://meimei.localhost:8443/dashboard/`

### 9. Start the product

Run:

```bash
./scripts/meimei-setup
```

This restarts the local domain services and opens the dashboard.

## Connectivity Matrix

### Core runtime

- `scripts/oc` points `openclaw` at the live config
- `scripts/oc-status` validates config, skills, and gateway state
- `scripts/oc-doctor` runs the OpenClaw doctor in non-interactive mode
- `scripts/oc-launch` starts the gateway bound to loopback
- `scripts/oc-agent` routes agent turns deterministically

### Dashboard

- `dashboard/server.mjs` serves the localhost control panel
- `scripts/meimei-domain.mjs` proxies the dashboard under `meimei.localhost`
- `scripts/meimei-setup` restarts the services and opens the domain

### Miniapps

- `Any-URL summarization in seconds`
- `Per-channel model routing by task type and cost`
- `Daily briefing`

### Daily briefing path

- Source adapters: tasks, ICE list, learnings, git status
- Default sink: Apple Notes
- Fallback sink: markdown

## Watchers And Failsafes

### Existing operational watchers

- `launchd` keeps the dashboard proxy and dashboard UI alive
- `scripts/oc-status` is the repeatable health check
- `scripts/oc-doctor --non-interactive` is the deeper diagnostic
- `scripts/oc-skills` reports skill availability and missing requirements

### Existing product failsafes

- `scripts/oc-agent` has deterministic routing and route previews
- `scripts/web-search` provides a no-key DuckDuckGo fallback
- `scripts/daily-briefing.mjs` falls back to markdown when Apple Notes fails
- the dashboard uses `cache-control: no-store`
- the gateway is bound to loopback
- WhatsApp group behavior is allowlisted and DM delivery is disabled
- OpenClaw compaction mode is set to safeguard

### Current doctor findings

The current machine is healthy enough to run the product. The remaining doctor notes are non-blocking and expected on this setup:

- the gateway LaunchAgent is loaded on `18789`
- the RPC probe can time out even while the service is active

The old session-store warnings were resolved by maintenance, and the active gateway remains the canonical loopback service.

## Portability Risks

### 1. Gateway port alignment

The canonical gateway port is now `18789` in both the live config and the launcher default.

Keep it that way on the second Mac mini:

- config gateway port: `18789`
- `scripts/oc-launch` default port: `18789`
- `openclaw status` should see the live LaunchAgent on `18789`

This removes the old port split and makes startup behavior reproducible.

### 2. Apple Notes is macOS-specific

The daily briefing can fall back to markdown, but Apple Notes itself requires:

- a Mac
- the Notes app
- Apple automation permissions

### 3. Docker sandbox image is required for doctor stability

`openclaw doctor` currently expects:

- `openclaw-sandbox:bookworm-slim`

If that image is missing, the doctor fails.

### 4. Live config lives under `HOME`

This is good for portability, but only if the second machine inherits the same `HOME`-relative layout and the config is rendered from the repo seed:

- `openclaw.config.json`
- `~/.openclaw/openclaw.json`
- `~/.openclaw/.env`
- `~/.openclaw/certs`
- `~/.openclaw/briefings`

## Day-1 Bootstrap Checklist

- [ ] Install base tools
- [ ] Install OpenClaw
- [ ] Clone the repo
- [ ] Run `npm install`
- [ ] Run `npm run config:seed`
- [ ] Pull the Ollama models
- [ ] Add `OPENROUTER_API_KEY` to `~/.openclaw/.env`
- [ ] Install the OpenClaw sandbox image
- [ ] Install the local domain services
- [ ] Run `./scripts/oc-status`
- [ ] Run `./scripts/oc-doctor --non-interactive`
- [ ] Open the dashboard and verify the three miniapps
- [ ] Verify `Daily briefing` writes to Apple Notes
- [ ] Verify URL summarization returns a real result
- [ ] Verify model routing preview returns a route

## Strong Recommendation

Before cloning to the second Mac mini, make one cleanup pass:

1. Keep the gateway port canonical at `18789`.
2. Clean the orphan transcript and missing session entries.
3. Confirm Apple Notes automation permission.
4. Confirm Docker can see `openclaw-sandbox:bookworm-slim`.
5. Confirm Ollama has the required fallback models.
6. Confirm `OPENROUTER_API_KEY` is present.

That gives you the best chance of a smooth, all-day launch on the new machine.

## Bootstrap Command

Use the repo bootstrap command for the main setup pass:

```bash
npm run bootstrap
```

That command currently:

- renders the live OpenClaw config from the repo seed
- installs the base Homebrew tools
- installs repo dependencies
- pulls the local Ollama models
- installs the local dashboard services
- starts or reuses the OpenClaw gateway
- runs `oc-status`
- runs `oc-doctor`
- prints the dashboard URL when done

## Go-Live Checklist

Before cutover, also review:

- [mac-mini-go-live-checklist.md](./mac-mini-go-live-checklist.md)

The checklist is the final pass/fail gate for declaring the machine ready.
