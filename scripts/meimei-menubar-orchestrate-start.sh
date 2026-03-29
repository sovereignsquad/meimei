#!/usr/bin/env bash
# Start MeiMei local HTTPS proxy + dashboard UI; ensure OpenClaw-pattern health watcher is loaded.
set -euo pipefail

REPO="${1:?Usage: $0 <agent.meimei repository root>}"
cd "$REPO"

"$REPO/scripts/meimei-domain" install

uid="$(id -u)"
health_label="com.agent.meimei.dashboard-health"
if ! launchctl print "gui/${uid}/${health_label}" &>/dev/null; then
  "$REPO/scripts/meimei-openclaw-dashboard-watchdog-install.sh"
else
  launchctl kickstart -k "gui/${uid}/${health_label}" 2>/dev/null || true
fi
