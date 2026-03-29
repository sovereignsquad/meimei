# macOS headless server — MeiMei operator runbook

**Audience:** Operators deploying MeiMei on a dedicated Mac (e.g. Mac mini) that should survive reboot and run **without** someone at the keyboard.  
**Prerequisites:** MeiMei LaunchAgents installed per **`docs/operations/meimei-platform-launchd.v1.md`** (`./scripts/meimei-domain install`, health watchdog as needed).  
**Status:** operational epic (post–Milestone G friendly); code does not replace OS configuration.

## What you already get for free

| Failure | Behavior |
|---------|----------|
| Node dashboard or proxy **process exits** | `launchd` **`KeepAlive`** restarts `com.agent.meimei.dashboard-ui` and `com.agent.meimei.dashboard-proxy`. |
| Process **hangs** but port dead | **`com.agent.meimei.dashboard-health`** probes **`GET /api/health`** and **`kickstart`**s the UI job. |
| Power loss mid-write | SQLite **`meimei_jobs`** uses **WAL**; see adapter contract for recovery semantics. |

The **Swift menubar app** is a **control plane convenience**; it does **not** supervise launchd (by design). A closet Mac can omit the menubar entirely once launchd is correct.

## The login-session trap (brutal reality)

MeiMei plists live under **`~/Library/LaunchAgents/`**. Those agents run in the **logged-in user’s** GUI session context.

**If the Mac reboots to the login window and nobody signs in, MeiMei does not start.**

To run unattended after **cold boot**, you must either:

- **A)** Enable **automatic login** for the macOS user that owns the repo and LaunchAgents (see below), **or**  
- **B)** Move supervision to **LaunchDaemons** (`/Library/LaunchDaemons/`) with a dedicated service user — **not** shipped by this repo today; would be a separate hardening project.

This document covers **A**, which matches most single-user Mac mini setups.

## Security trade-off: FileVault vs auto-login

**Automatic login** (System Settings → Users & Groups) typically **cannot** be used together with **FileVault** full-disk encryption for that user in the “unlock disk at boot without password” sense. Common patterns:

- **Headless server:** FileVault **off** (or separate volume strategy) + auto-login + physical access control.  
- **Laptop with secrets:** Keep FileVault on; accept that **you** must unlock after reboot — MeiMei starts **after** login.

Document your org’s choice; there is no magic third option on stock macOS for “encrypted at rest” and “no password after power cycle” without additional infrastructure.

## Checklist: autonomous Mac (closet server)

### 1. Power recovery

- **Auto power-on after AC restore** (useful when UPS or building power returns):

  ```bash
  sudo pmset -a autorestart 1
  ```

  Verify: `pmset -g | grep autorestart`

- **Wake / sleep:** For a server, disable idle sleep so timers and network listeners stay reliable:
  - System Settings → **Energy** (or **Battery**) → prevent sleep when possible; on many desktops use **`caffeinate`** only as a temporary debug tool, not the primary fix.
  - Example CLI (adjust for your hardware/OS version):

    ```bash
    sudo pmset -a sleep 0
    sudo pmset -a disablesleep 1
    ```

  Revisit after macOS upgrades; Apple renames panes occasionally.

### 2. Login so LaunchAgents actually run

- Enable **automatic login** for the user that owns `~/Library/LaunchAgents/com.agent.meimei.*` and the repo checkout.
- Confirm **MeiMei installers** have been run **as that same user** so plists and paths resolve.

### 3. MeiMei services

- From repo root (as that user):

  ```bash
  ./scripts/meimei-domain install
  ```

- Optional health watchdog (zombie recovery): follow **`npm run dashboard:watchdog:install`** / runbook entries.
- Confirm labels load after reboot:

  ```bash
  launchctl list | grep com.agent.meimei
  ```

### 4. Ollama (or your inference runner)

MeiMei’s router expects a reachable Ollama (or configured host). **launchd does not start Ollama for you** unless **you** add it:

- Add **Ollama.app** (or your launcher) to **System Settings → General → Login Items** for the same auto-login user, **or**  
- Run Ollama via **`brew services`** / a **user** LaunchAgent you maintain — document the command in your internal sheet.

Order matters only loosely: if the dashboard starts before Ollama, inference jobs **fail and retry** per job policy until Ollama is up.

### 5. Post-reboot verification

1. Reboot cold (`sudo reboot` or power cycle).
2. Wait for auto-login (no manual step in the closet scenario).
3. `curl -sk https://meimei.localhost:8443/api/health` (or your configured URL) → **200** JSON.
4. Tail `~/.meimei/logs/dashboard-ui.log` for errors.
5. Optional: enqueue a trivial **`inference_v1`** or open Reference App 1 once.

## What this runbook does **not** solve

- **Remote access** (Tailscale, SSH) — add separately.  
- **Secrets at rest** on an auto-login Mac — treat the machine as a **trusted zone** or use external secret storage.  
- **LaunchDaemons** as root — future epic if you outgrow user LaunchAgents.  
- **Menubar auto-restart** — not required; nothing in-repo watches the Swift app (see architect note: avoid nested watchdogs).

## Related docs

- **`docs/operations/meimei-platform-launchd.v1.md`** — plist labels, health probe, migration.  
- **`docs/operations/runbook.md`** — dashboard reload, CI, watchdog npm scripts.  
- **`docs/operations/mac-mini-go-live-checklist.md`** — broader go-live (if present in tree).  
- **Roadmap handoff for PO/developer:** **`docs/operations/handoff-roadmap-headless-server.v1.md`**

## Versioning

Update this file when Apple changes settings names, when MeiMei adds LaunchDaemons, or when the recommended Ollama install path changes.
