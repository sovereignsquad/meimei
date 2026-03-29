# Handoff: Headless server epic (developer / operator message)

**Use:** Copy to your developer backlog after **Milestone G** is in motion or merged. **Does not** block Milestone G coding.

---

**Subject / heading:** Re: Phase 3 execution & new roadmap epic (headless server)

We are aligned on Phase 3. We are in a holding pattern for the **Milestone G** pull request. The audit stays strict: **zero peer `fetch`** between apps, **bounded** SQLite polling, strict JSON intents, and **§5 correlation** threading for Standup Digest.

While you execute that, we are officially adding an **operational epic** to the roadmap: **headless server configuration**.

### Product requirement

Deploy MeiMei on a dedicated Mac (e.g. Mac mini), leave it in a closet, and have it behave as a **highly available, self-healing** local server. After **power loss + hardware reboot**, MeiMei should return online and **resume the queue** without a human typing a password or clicking a UI—within the limits of macOS user LaunchAgents and the **FileVault / auto-login** trade-off.

### Roadmap deliverable (already started in-repo)

The definitive operator guide lives at **`docs/operations/mac-headless-server.md`**. Extend or correct it as you learn from real hardware.

It must remain accurate for:

- **Auto-boot & power recovery** — e.g. `sudo pmset -a autorestart 1`, Energy / sleep settings.  
- **The FileVault / login trap** — LaunchAgents under `~/Library/LaunchAgents` require a **logged-in** session; document **auto-login vs encryption** trade-offs.  
- **Dependency bootstrapping** — Ollama (or chosen runner) starting on login; MeiMei **`com.agent.meimei.*`** jobs via `./scripts/meimei-domain install` and optional health watchdog.

Optional follow-ups (separate tasks): small **verify-headless.sh** script, LaunchDaemon spike, or checklist integration with **`mac-mini-go-live-checklist.md`**.

### Milestone G first

Ping when the **ping/pong** PR is ready for review. After the bus is proven, we harden the **OS** it runs on using the runbook above.
