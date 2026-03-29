#!/usr/bin/env bash
# Periodic HTTP health probe for com.agent.meimei.dashboard-ui (does not install a second dashboard).
# See docs/operations/meimei-platform-launchd.v1.md
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plist_dir="$HOME/Library/LaunchAgents"
logs_dir="${HOME}/.meimei/logs"
watchdog_label="com.agent.meimei.dashboard-health"
watchdog_plist="$plist_dir/${watchdog_label}.plist"
dashboard_label="com.agent.meimei.dashboard-ui"

if [[ -n "${PORT:-}" ]]; then
  dashboard_port="$PORT"
else
  dashboard_port="$(node "${repo_root}/config/print-dashboard-default-port.mjs")"
fi
health_interval="${MEIMEI_DASHBOARD_HEALTH_INTERVAL:-60}"

mkdir -p "$plist_dir" "$logs_dir"

cat >"$watchdog_plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$watchdog_label</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>$health_interval</integer>
  <key>WorkingDirectory</key>
  <string>$repo_root</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>MEIMEI_DASHBOARD_LABEL=$dashboard_label PORT=$dashboard_port ./scripts/meimei-dashboard-watchdog-probe</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>$dashboard_port</string>
    <key>MEIMEI_DASHBOARD_LABEL</key>
    <string>$dashboard_label</string>
  </dict>
  <key>StandardOutPath</key>
  <string>$logs_dir/dashboard-health.log</string>
  <key>StandardErrorPath</key>
  <string>$logs_dir/dashboard-health.err</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)" "$watchdog_plist" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$watchdog_plist"
launchctl kickstart -k "gui/$(id -u)/$watchdog_label"

echo "Installed MeiMei dashboard health watcher: $watchdog_label"
echo "Logs: $logs_dir/dashboard-health.{log,err}"
