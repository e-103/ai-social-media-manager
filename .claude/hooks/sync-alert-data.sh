#!/bin/bash
# Copy the empty-slot alert script and the schedule files somewhere launchd can
# read (macOS blocks background jobs from ~/Desktop). Runs at session start and
# after every Claude turn (Stop hook).
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
SUP="$HOME/Library/Application Support/ClipManager"
mkdir -p "$SUP"
cp -f .claude/hooks/slot-alert.py clips-log.md "$SUP/" 2>/dev/null
[ -f clip-plan.md ] && cp -f clip-plan.md "$SUP/"
exit 0
