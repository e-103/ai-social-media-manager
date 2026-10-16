#!/usr/bin/env python3
"""Timed YouTube captions for building cut sheets.

Run with the project venv:  .venv/bin/python .claude/skills/post/scripts/timestamps.py <command> <url> ...
  calls  <url>                 caption length + likely segment/caller boundaries
  search <url> <regex> [...]   every caption line matching each regex, with timestamps
  window <url> <start> <end>   full caption text between two times (m:ss or h:mm:ss)
Captions are cached in .cache/transcripts/<video id>.json.
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
CACHE = os.path.join(ROOT, ".cache", "transcripts")
BOUNDARY = r"next call|call from|let'?s hear it|what do you got|last call|you'?re (live|on the air)"


def video_id(url):
    m = re.search(r"(?:v=|youtu\.be/|shorts/|live/)([\w-]{11})", url)
    if not m:
        sys.exit(f"Not a YouTube video link: {url}")
    return m.group(1)


def captions(url):
    vid = video_id(url)
    path = os.path.join(CACHE, vid + ".json")
    if os.path.exists(path):
        return json.load(open(path))
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        sys.exit("Missing package. Run: python3 -m venv .venv && .venv/bin/pip install youtube-transcript-api")
    try:
        fetched = YouTubeTranscriptApi().fetch(vid, languages=["en", "en-US", "en-GB"])
    except Exception as e:  # no captions, private video, region block...
        sys.exit(f"No captions available for {vid}: {type(e).__name__}: {str(e)[:200]}")
    rows = [{"start": s.start, "text": s.text} for s in fetched]
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rows, open(path, "w"))
    return rows


def ts(sec):
    s = int(sec)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"


def secs(text):
    parts = [int(p) for p in text.split(":")]
    return sum(p * 60 ** i for i, p in enumerate(reversed(parts)))


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, url, *args = sys.argv[1:]
    rows = captions(url)
    if cmd == "calls":
        print(f"{len(rows)} caption lines, {ts(rows[-1]['start'])} long")
        for r in rows:
            if re.search(BOUNDARY, r["text"], re.I):
                print(f"{ts(r['start'])}  {r['text']}")
    elif cmd == "search":
        for pattern in args:
            hits = [r for r in rows if re.search(pattern, r["text"], re.I)]
            print(f"== {pattern}  ({len(hits)} hits)")
            for r in hits:
                print(f"  {ts(r['start'])}  {r['text']}")
    elif cmd == "window":
        start, end = secs(args[0]), secs(args[1])
        last = -99
        for r in rows:
            if start <= r["start"] < end:
                prefix = f"\n[{ts(r['start'])}] " if r["start"] - last >= 15 else " "
                last = r["start"] if prefix != " " else last
                print(prefix + r["text"], end="")
        print()
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
