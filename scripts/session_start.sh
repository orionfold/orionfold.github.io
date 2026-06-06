#!/bin/bash
# SessionStart hook (v2 — ../agency/_SPECS/2026-06-06-sessionstart-dashboard-hook-v2.md):
# ensure the M7 dashboard server is running on :8789 and visibly open it in
# Chrome without duplicating tabs.

URL="http://127.0.0.1:8789/"
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

# 1. Server — idempotent: only spawn if the port is not answering.
#    ⚠ Launch form per the spec's 2026-06-06 AMENDMENT: NO `( … & )` subshell —
#    on macOS bash 3.2 the forked subshell blocks in wait4() holding the hook's
#    stdout fd, so the harness never sees EOF and the SESSION HANGS (hook
#    `timeout` does not rescue it). All three stdio fds detached + disown; log
#    to a file (not /dev/null) so a failed launch leaves a trace.
if curl -s -o /dev/null --max-time 1 "$URL"; then
  server_msg="Dashboard already running at $URL"
else
  cd "$ROOT" && { nohup node scripts/dashboard-server.mjs >/tmp/website-dashboard.log 2>&1 </dev/null & disown; }
  server_msg="Dashboard was not running — started it at $URL"
fi

# 2. Browser — idempotent: scan Chrome tabs, open only if no :8789 tab exists.
tab_msg=$(osascript 2>/dev/null <<'EOF'
tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t starts with "http://127.0.0.1:8789" then return "dashboard tab already open in Chrome"
    end repeat
  end repeat
  if (count of windows) = 0 then make new window
  tell front window to make new tab with properties {URL:"http://127.0.0.1:8789/"}
  activate
  return "opened dashboard tab in Chrome"
end tell
EOF
)
if [ -z "$tab_msg" ]; then
  if open "$URL" 2>/dev/null; then
    tab_msg="opened dashboard in default browser (Chrome AppleScript unavailable)"
  else
    tab_msg="could not open a browser automatically — open $URL manually"
  fi
fi

echo "$server_msg — $tab_msg"
