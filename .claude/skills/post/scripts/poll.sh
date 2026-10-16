#!/usr/bin/env bash
# Poll a Blotato async job until it reaches a terminal state.
# Usage: poll.sh source <id> | poll.sh visual <id>
set -euo pipefail

kind="$1"; id="$2"
B="https://backend.blotato.com/v2"

case "$kind" in
  source) url="$B/source-resolutions-v3/$id"; done_re='^(completed|failed)$' ;;
  visual) url="$B/videos/creations/$id";       done_re='^(done|creation-from-template-failed|insufficient-credits|draft)$' ;;
  *) echo "usage: poll.sh source|visual <id>" >&2; exit 2 ;;
esac

for _ in $(seq 1 60); do   # up to ~15 minutes
  resp=$(curl -s -H "blotato-api-key: $BLOTATO_API_KEY" "$url")
  status=$(echo "$resp" | jq -r '.status // .item.status // empty')
  err=$(echo "$resp" | jq -r '.item.error // empty')
  if [[ -n "$err" || "$status" =~ $done_re ]]; then
    echo "$resp"
    exit 0
  fi
  sleep 15   # Blotato asks for >=15s between polls
done

echo "timed out; last response: $resp" >&2
exit 1
