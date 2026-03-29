#!/usr/bin/env bash
# Retire ai.openclaw.meimei.dashboard-* LaunchAgents → com.agent.meimei.* (see docs/operations/meimei-platform-launchd.v1.md).
# Default: DRY RUN (no bootout, no file deletion). Pass --force to apply.
set -euo pipefail

uid="$(id -u)"
PLIST_DIR="${HOME}/Library/LaunchAgents"
LEGACY=(
  "${PLIST_DIR}/ai.openclaw.meimei.dashboard-ui.plist"
  "${PLIST_DIR}/ai.openclaw.meimei.dashboard-proxy.plist"
  "${PLIST_DIR}/ai.openclaw.meimei.dashboard-health.plist"
)

FORCE=0
if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

warn() { printf '%s\n' "$*" >&2; }

plist_arg1() {
  local f="$1"
  /usr/libexec/PlistBuddy -c "Print :ProgramArguments:1" "$f" 2>/dev/null || true
}

check_legacy_shape() {
  local f="$1"
  local base
  base="$(basename "$f")"
  case "$base" in
    ai.openclaw.meimei.dashboard-ui.plist)
      if ! grep -q "dashboard/server.mjs" "$f" 2>/dev/null; then
        warn "Warning: Custom modifications suspected in $f (expected dashboard/server.mjs in ProgramArguments)."
        warn "  Review the plist. Re-run with --force only if you accept replacing MeiMei-managed jobs."
        return 1
      fi
      ;;
    ai.openclaw.meimei.dashboard-proxy.plist)
      if ! grep -q "meimei-domain.mjs" "$f" 2>/dev/null; then
        warn "Warning: Custom modifications suspected in $f (expected meimei-domain.mjs in ProgramArguments)."
        warn "  Review the plist. Re-run with --force only if you accept replacing MeiMei-managed jobs."
        return 1
      fi
      ;;
    ai.openclaw.meimei.dashboard-health.plist)
      if ! grep -qE "meimei-dashboard-watchdog-probe|dashboard-watchdog-probe" "$f" 2>/dev/null; then
        warn "Warning: Custom modifications suspected in $f (expected meimei-dashboard-watchdog-probe in ProgramArguments)."
        warn "  Review the plist. Re-run with --force only if you accept replacing MeiMei-managed jobs."
        return 1
      fi
      ;;
  esac
  return 0
}

if [[ -f "${PLIST_DIR}/com.agent.meimei.dashboard.plist" ]]; then
  warn "Notice: ${PLIST_DIR}/com.agent.meimei.dashboard.plist exists (legacy npm dashboard:watchdog stack)."
  warn "  Uninstall with: npm run dashboard:watchdog:uninstall"
  warn "  This migrate script does not remove that plist."
fi

HAS_ANY=0
for f in "${LEGACY[@]}"; do
  [[ -f "$f" ]] || continue
  HAS_ANY=1
done

if [[ "$HAS_ANY" -eq 0 ]]; then
  echo "meimei-platform-migrate: no legacy ai.openclaw.meimei.dashboard-* plists found. Nothing to do."
  echo "Sanctuary: ~/.openclaw config and secrets are never touched by this script."
  exit 0
fi

mode="DRY RUN"
[[ "$FORCE" -eq 1 ]] && mode="APPLY"
echo "meimei-platform-migrate: $mode (legacy MeiMei dashboard/proxy/health only)"
echo "Sanctuary: ~/.openclaw config and secrets are NOT modified."
echo

WARNED=0
for f in "${LEGACY[@]}"; do
  [[ -f "$f" ]] || continue
  echo "Target: $f"
  echo "  ProgramArguments:1 → $(plist_arg1 "$f")"
  if ! check_legacy_shape "$f"; then
    WARNED=1
  fi
  if [[ "$FORCE" -eq 1 ]]; then
    launchctl bootout "gui/${uid}" "$f" 2>/dev/null || true
    rm -f "$f"
    echo "  Applied: bootout + removed plist file."
  else
    echo "  Would: launchctl bootout gui/${uid} \"$f\" && rm -f \"$f\""
  fi
  echo
done

if [[ "$FORCE" -ne 1 ]]; then
  echo "Dry run complete. To apply: $0 --force"
  echo "Then install canonical jobs: ./scripts/meimei-domain install && ./scripts/meimei-openclaw-dashboard-watchdog-install.sh"
  if [[ "$WARNED" -ne 0 ]]; then
    exit 2
  fi
  exit 0
fi

echo "Done. Install canonical stack:"
echo "  ./scripts/meimei-domain install"
echo "  ./scripts/meimei-openclaw-dashboard-watchdog-install.sh"
