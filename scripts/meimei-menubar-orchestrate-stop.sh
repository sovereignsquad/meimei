#!/usr/bin/env bash
# Stop MeiMei-managed LaunchAgents: dashboard UI, HTTPS proxy, MeiMei health watcher.
set -euo pipefail

REPO="${1:-}"
uid="$(id -u)"
LA="${HOME}/Library/LaunchAgents"

if [[ -n "$REPO" ]] && [[ -f "$REPO/scripts/meimei-domain" ]]; then
  "$REPO/scripts/meimei-domain" stop
else
  for f in \
    "${LA}/com.agent.meimei.dashboard-ui.plist" \
    "${LA}/com.agent.meimei.dashboard-proxy.plist" \
    "${LA}/ai.openclaw.meimei.dashboard-ui.plist" \
    "${LA}/ai.openclaw.meimei.dashboard-proxy.plist"; do
    launchctl bootout "gui/${uid}" "$f" 2>/dev/null || true
  done
fi

for f in \
  "${LA}/com.agent.meimei.dashboard-health.plist" \
  "${LA}/ai.openclaw.meimei.dashboard-health.plist"; do
  launchctl bootout "gui/${uid}" "$f" 2>/dev/null || true
done
