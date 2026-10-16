#!/bin/bash
# SessionStart hook: start the Clip Inbox server (if it isn't running) and give
# Claude the clipping workflow to walk the user through. Stdout becomes context.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
LOG=.claude/clip-inbox.log
bash .claude/hooks/sync-alert-data.sh

if ! lsof -ti tcp:5180 >/dev/null 2>&1; then
  umask 077
  ( BROWSER=none nohup npm run clips >"$LOG" 2>&1 </dev/null & ) >/dev/null 2>&1
  for _ in $(seq 1 20); do grep -q 'key=' "$LOG" 2>/dev/null && break; sleep 0.25; done
  SERVER="started just now"
else
  SERVER="already running"
fi

shopt -s nullglob nocaseglob
CLIPS=(clips/inbox/*.mp4 clips/inbox/*.mov clips/inbox/*.m4v clips/inbox/*.webm)
PLAN="none"
[ -f clip-plan.md ] && PLAN="clip-plan.md exists (last episode planned: $(grep -m1 '^# ' clip-plan.md | sed 's/^# //'))"

cat <<EOF
[Clipping workflow reminder. The user asked to be walked through this EVERY session because they forget.]
At the start of your FIRST reply this session (whatever the user says), show this checklist briefly and ask which step they're on:

0. FIRST ask: "Which streamer are we clipping this time?" The user posts mainly streamers and rotates creators every so often. Don't assume the last creator. Once they name one, check campaigns.md (offer to add them if missing), then continue with step 1 for that streamer.
1. Run /post <that streamer's stream/episode link>. Claude extracts the episode, pulls the YouTube captions, and shows each moment's exact Start and End timestamps to cut, plus its hashtags from hashtags.md. Saved to clip-plan.md.
2. Cut those moments in CapCut or OpusClip, 61 to 90 seconds each.
3. Open the secure Clip Inbox and drop the clips in (auto-converted to 9:16). To open it, run: open "\$(grep -o 'http://127.0.0.1:5180/?key=[a-f0-9]*' $LOG | tail -1)"  Never paste the key into chat.
4. Claude asks: "Post these new clips to TikTok and YouTube?" Then asks the scheduling questions (dates/slots, caption approval) and runs /clip inbox: uploads each clip to Blotato, uses the Blotato link as the media, and applies the clip-plan.md hashtags.

$(python3 .claude/hooks/next-clip.py 2>/dev/null)

Current state: Clip Inbox server ${SERVER}. Clips waiting in clips/inbox: ${#CLIPS[@]}. Plan: ${PLAN}.
If clips are waiting, say so and offer step 4.
EOF
