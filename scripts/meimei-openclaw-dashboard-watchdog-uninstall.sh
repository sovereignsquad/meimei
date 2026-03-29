#!/usr/bin/env bash
set -euo pipefail

watchdog_label="com.agent.meimei.dashboard-health"
watchdog_plist="$HOME/Library/LaunchAgents/${watchdog_label}.plist"

launchctl bootout "gui/$(id -u)" "$watchdog_plist" 2>/dev/null || true
rm -f "$watchdog_plist"

echo "Removed MeiMei dashboard health watcher: $watchdog_label"
