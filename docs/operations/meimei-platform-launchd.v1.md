# MeiMei platform LaunchAgents — LLSD v1

**Status:** canonical contract for Milestone A (MeiMei-owned daemons).  
**Namespace:** `com.agent.meimei.*` only for dashboard UI, HTTPS proxy, and MeiMei health probe.  
**Out of scope:** OpenClaw gateway and any `ai.openclaw.*` jobs except migration cleanup of *retired* `ai.openclaw.meimei.dashboard-*` plists.

## Jurisdiction

| Owner | Labels | Notes |
|-------|--------|--------|
| MeiMei | `com.agent.meimei.dashboard-ui`, `com.agent.meimei.dashboard-proxy`, `com.agent.meimei.dashboard-health` | Installed by `./scripts/meimei-domain` and `./scripts/meimei-openclaw-dashboard-watchdog-install.sh` (health). |
| OpenClaw (upstream) | e.g. `ai.openclaw.gateway` | MeiMei probes port; does not rename OpenClaw installers. |

## Launchd topology

| Label | Purpose | Restart model | Log files (`~/.meimei/logs/`) |
|-------|---------|---------------|-------------------------------|
| `com.agent.meimei.dashboard-ui` | Node `dashboard/server.mjs` | `KeepAlive` true | `dashboard-ui.log`, `dashboard-ui.err` |
| `com.agent.meimei.dashboard-proxy` | Node `scripts/meimei-domain.mjs` (HTTPS proxy) | `KeepAlive` true | `dashboard-proxy.log`, `dashboard-proxy.err` |
| `com.agent.meimei.dashboard-health` | Runs `scripts/meimei-dashboard-watchdog-probe` on `StartInterval` | Interval job; **only** this job may `kickstart` the UI label on probe failure | `dashboard-health.log`, `dashboard-health.err` |

### Supervision rules

1. **`dashboard-ui` and `dashboard-proxy`** rely on `launchd` `KeepAlive` for process exit (crash) recovery.
2. **`dashboard-health`** catches “listening but dead” cases by HTTP GET to **`/api/health`** on the dashboard port; on failure it `launchctl kickstart -k` **`com.agent.meimei.dashboard-ui`** only.
3. **No second auto-restart owner:** the macOS menu bar app must not poll and restart these jobs (manual `start`/`stop`/`restart` via scripts only).

## Plist template rules

- **`ProgramArguments`:** Direct `node` + absolute repo paths to `server.mjs` / `meimei-domain.mjs` — no `bash -lc` wrapper for UI/proxy so `launchd` tracks the Node PID.
- **`WorkingDirectory`:** Repository root (`agent.meimei` checkout).
- **`RunAtLoad`:** `true`.
- **`EnvironmentVariables`:** Minimal; UI plist sets `PORT` from `config/print-dashboard-default-port.mjs` at install time.

## HTTP health contract

- **Route:** `GET /api/health` (also in `config/dashboard-surface.v1.json` → `api.health`).
- **SLO:** Trivial work only (uptime + RSS); target **&lt; 50ms**; no disk/DB/LLM.
- **Example body:** `{ "ok": true, "uptime": 12045, "memory": "45MB", "status": "listening" }`

## Migration from retired labels

Legacy MeiMei plists used **`ai.openclaw.meimei.dashboard-*`**. Remove them with **`./scripts/meimei-platform-migrate.sh`** (dry-run by default; `--force` applies). Then run **`./scripts/meimei-domain install`** and the health installer if desired.

**Sanctuary:** Migration **never** deletes or edits `~/.openclaw/config`, secrets, or non-target plists.

## Related

- **Unattended reboot / closet Mac:** **`docs/operations/mac-headless-server.md`** (auto-login, `pmset`, Ollama at login).
