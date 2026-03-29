# Runbook

## Daily start

1. Read `agent.md`.
2. Read `skills/catalog.md`.
3. Check `tasks.md` for active work.
4. Confirm whether any OC approval is required before execution.
5. Run `./scripts/oc-status` before beginning a session.

## Adding a skill

1. Copy `skills/_template/SKILL.md`.
2. Create a new skill folder.
3. Write a focused `SKILL.md`.
4. Add the skill to `skills/catalog.md`.
5. Verify the skill does not duplicate an existing capability.

## Updating a skill

1. Check whether the change is scope-preserving.
2. Update the skill body and metadata together.
3. Keep the skill description one-line and precise.
4. Re-read the catalog entry to ensure naming still fits.

## Handling large work

If a request is too broad:

- split it into capability clusters
- define the one best next step
- keep the rest in `roadmap.md` or `tasks.md`

## Escalation

Escalate to OC when:

- scope changes
- safety boundaries are unclear
- a skill would need privileged behavior
- execution is blocked by missing product decisions

## Continuous integration

- Every push to **`main`** and every **pull request** runs **`npm run ci`** on GitHub Actions (registry, policy, audit, telemetry, handoff sample, WhatsApp/iMessage adapter parity, release-gates sample).
- Local check before pushing: `npm ci && npm run ci`.
- **Not** in CI: OpenClaw runtime probes (`npm run readiness`), macOS menu bar build (`npm run menubar:build`) — run those on a machine with the gateway / Xcode tools when relevant.

## Launching OpenClaw

- Use `./scripts/oc-launch` to start the gateway from this repo-local config.
- Use `./scripts/oc-agent --message "..."` for direct agent turns through the repo-local wrapper.
- Add `--channel`, `--task-type`, and `--cost-target` when you want deterministic routing.
- Add `--route-report` to print the selected route and reason.
- Use `./scripts/oc-doctor --non-interactive` when checking the runtime state.
- Use `./scripts/oc-readiness` for a single PASS/FAIL go-live readiness decision.
- Use `npm run adapter:whatsapp:validate` before WhatsApp-facing release changes.
- Use `npm run release:gates -- <artifact.json>` before release decisions to enforce DoD/testing gates.
- Use `npm run policy:validate` before external-channel policy or risk-tier changes.
- Use `npm run audit:validate` to verify audit trail chain integrity after policy/routing work.
- Use `npm run telemetry:seed` and `npm run telemetry:validate` when validating reliability telemetry and SLO outputs.
- Use `npm run imessage:validate` before iMessage bridge changes and before live reply testing.
- Use `npm run always-on:install` to keep gateway running across restarts with auto-restart on crash.
- Use `npm run always-on:status` to inspect launchd service and gateway health.
- Use `npm run always-on:uninstall` if you need to disable always-on mode.
- Use `npm run dashboard:watchdog:install` to auto-start dashboard at login and restart it on crash/healthcheck failure.
- Use `npm run dashboard:watchdog:status` to inspect dashboard watcher service and health probe.
- Use `npm run dashboard:watchdog:uninstall` to disable dashboard always-on watcher mode.
- Use `npm run config:seed` when you need to render or refresh the live OpenClaw config from the repo seed.
- Use `npm run bootstrap` when you are bringing up a fresh Mac mini or validating the migration path.

## Local Dashboard

MeiMei is an **operator-local** stack (Node upstream + optional TLS proxy + LaunchAgents). **Do not** treat third-party “deploy to cloud” flows as the product runtime; ship updates with **`git pull`** on the Mac and **`npm run dashboard:reload`** (or equivalent LaunchAgent refresh).

### Operator chrome (nav + themes)

- **Admin → Operator chrome** edits nav **icon paths** (under `/images/…`) and **colours** for menu chips and `data-theme` shells.
- **Persistence:** `data/operator-chrome.v1.json` (gitignored) — only stores **diffs** from [`chrome-theme-defaults.mjs`](../../dashboard/lib/chrome-theme-defaults.mjs) / `design-system.css` defaults.
- **API:** `GET` / `POST` **`/api/operator/chrome`** (configurable as `surface.api.operatorChrome` in [`config/dashboard-surface.v1.json`](../../config/dashboard-surface.v1.json)). `POST` `{ reset: true }` removes overrides.
- **Dynamic CSS:** **`GET /styles/operator-chrome.css`** — `no-store`; linked **after** `design-system.css` on all platform shells.
- **Canonical audit:** [`docs/planning/meimei-docs-code-sync-audit.v1.md`](../planning/meimei-docs-code-sync-audit.v1.md).

### Canonical operator URL (HTTPS)

- **Browser and operator tooling** should use **`https://meimei.localhost:8443/dashboard/`** when the TLS proxy is running (**`./scripts/meimei-domain`** / LaunchAgent stack). This is the **product** surface ([ADR-003](../architecture/adr/ADR-003-tls-termination-v1.md), [topology](../architecture/meimei-https-topology.v1.md)).
- **One-time certs:** `npm run cert:install` (or `scripts/meimei-cert install`) — material under **`~/.openclaw/certs/meimei.localhost.{crt,key}`**; installs trust on macOS where supported.
- **Optional HTTP→HTTPS redirect:** `MEIMEI_DOMAIN_HTTP_REDIRECT=1` when starting `meimei-domain` listens on **`127.0.0.1:8080`** (override with **`MEIMEI_DOMAIN_HTTP_REDIRECT_PORT`**) and **301**s to the **`https://meimei.localhost:8443`** equivalent.

### Upstream Node (HTTP on loopback)

- `npm run dashboard` starts **Node `http.createServer`** on **`127.0.0.1:<defaults.port>`** (commonly **45285**) — **upstream HTTP** on loopback only, not the canonical URL. Boot logs print both upstream and **public HTTPS** hint.
- **`MEIMEI_PUBLIC_PREFIX`** (default **`/dashboard`**): browser-visible paths for HTML **stylesheet and image URLs** are prefixed so `/images/…` and `/styles/…` resolve correctly behind the same mount (see `browserPathForNormalized` in `dashboard/server.mjs`).
- **Hardening (optional):** `MEIMEI_DASHBOARD_LOOPBACK_ONLY=1` forces bind **`127.0.0.1`**. `MEIMEI_DASHBOARD_DISALLOW_LAN_BIND=1` coerces **`0.0.0.0`/`::`** to **`127.0.0.1`** unless **`MEIMEI_DASHBOARD_ALLOW_LAN_BIND=1`**.

### Operations

- Run `npm run dashboard` from the repo root (or rely on LaunchAgents after `meimei-domain install`).
- After `git pull`, reload launchd services so new code runs: `npm run dashboard:reload` (or `./scripts/meimei-domain restart` when using `meimei.localhost:8443`).
- **LaunchAgent namespace:** MeiMei-owned jobs use `com.agent.meimei.dashboard-*` (see `docs/operations/meimei-platform-launchd.v1.md`). To retire old `ai.openclaw.meimei.dashboard-*` plists: `./scripts/meimei-platform-migrate.sh` (dry run), then `./scripts/meimei-platform-migrate.sh --force` and `./scripts/meimei-domain install`.
- **Headless Mac mini / closet server:** Auto-login, power recovery, sleep, Ollama at login — **`docs/operations/mac-headless-server.md`**. Backlog handoff: **`docs/operations/handoff-roadmap-headless-server.v1.md`**.
- **CLI / Node smoke against HTTPS:** set **`NODE_EXTRA_CA_CERTS=$HOME/.openclaw/certs/meimei.localhost.crt`** (or trust via keychain) so **`fetch`** accepts the local cert. Examples: **`MEIMEI_SMOKE_HTTPS=1 npm run dashboard:smoke:https`**; **`MEIMEI_PROBE_TLS=1 npm run dashboard:probe:tls`**.
- Use the settings form to update the repo-local OpenClaw config.
- Use the operations panel to run status, skills, doctor, and launch checks.
- **Page layout** (grid columns, block order, row breaks): **Admin → Page layout**; spec and CSS classes in `design-system-v1.md` (**Global layout system**); data in `config/page-layout.v1.json`.
- Optional **menu bar control** app **MeiMei Control**: `npm run menubar:build` → `macos/MeiMei/build/MeiMei Control.app`. For **Spotlight**, run `npm run menubar:install` (installs `~/Applications/MeiMei Control.app`; removes legacy `MeiMei.app` / `MeiMeiMenuBar.app` if present). Add **MeiMei Control** under **Login Items** if you want it at login (see `macos/MeiMei/README.md`).
- Use `npm run setup` for the one-step local domain start/open flow.
