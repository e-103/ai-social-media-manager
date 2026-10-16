#!/usr/bin/env python3
"""PreToolUse hook: lint Blotato post payloads before they are published.

Fires on Bash commands that curl Blotato's /v2/posts endpoint with a JSON body.
Checks em dashes, platform character limits, required media, and the banned
words listed in the /post skill's writing style. Exit 2 blocks the command and
sends the problems back to Claude.
"""
import json
import os
import re
import sys

SKILL = os.path.join(
    os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()), ".claude/skills/post/SKILL.md"
)
LIMITS = {"twitter": 280, "instagram": 2200, "youtube": 5000, "tiktok": 2200}
NEEDS_MEDIA = {"instagram", "youtube", "tiktok"}
URL_RE = re.compile(r"https?://\S+")
HASHTAG_RE = re.compile(r"#(\w+)")
# Max hashtags per post (see hashtags.md), and tags that do nothing for reach.
HASHTAG_MAX = {"tiktok": 5, "youtube": 4}
DEAD_TAGS = {"fyp", "foryou", "foryoupage", "fy", "viral", "trending", "xyzbca", "explorepage"}


def banned_words():
    try:
        with open(SKILL, encoding="utf-8") as f:
            for line in f:
                if "AVOID these words:" in line:
                    quoted = line.split('"', 1)[1].rsplit('"', 1)[0]
                    return [w.strip() for w in quoted.split(",") if w.strip()]
    except (OSError, IndexError):
        pass
    return []


def find_payload(command):
    """Return the first JSON object in the command that has a "post" key."""
    decoder = json.JSONDecoder()
    for i, ch in enumerate(command):
        if ch != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(command[i:])
        except ValueError:
            continue
        if isinstance(obj, dict) and "post" in obj:
            return obj
    return None


def x_length(text):
    # X counts every link as 23 characters.
    return len(URL_RE.sub("x" * 23, text))


def check(payload, words):
    post = payload.get("post", {})
    content = post.get("content", {})
    target = post.get("target", {})
    platform = content.get("platform") or target.get("targetType", "")
    problems = []

    # Every piece of copy that will go public, labelled for the error message.
    pieces = [("text", content.get("text", ""))]
    for n, extra in enumerate(content.get("additionalPosts") or [], start=2):
        pieces.append((f"thread post {n}", extra.get("text", "")))
    if target.get("title"):
        pieces.append(("YouTube title", target["title"]))

    for label, text in pieces:
        if "—" in text:
            problems.append(f'{label}: contains an em dash (—). Replace it with "..." or a comma/period.')
        hits = sorted(
            {w for w in words if re.search(rf"(?<![\w-]){re.escape(w)}(?![\w-])", text, re.I)}
        )
        if hits:
            problems.append(f"{label}: uses banned words: {', '.join(hits)}")

    limit = LIMITS.get(platform)
    if limit:
        for label, text in pieces:
            if label == "YouTube title":
                continue
            length = x_length(text) if platform == "twitter" else len(text)
            if length > limit:
                problems.append(f"{label}: {length} chars, over the {platform} limit of {limit}.")
    title = target.get("title", "")
    if platform == "youtube" and len(title) > 100:
        problems.append(f"YouTube title: {len(title)} chars, over the limit of 100.")

    if platform in HASHTAG_MAX:
        tags = [t.lower() for t in HASHTAG_RE.findall(content.get("text", ""))]
        if len(tags) > HASHTAG_MAX[platform]:
            problems.append(f"text: {len(tags)} hashtags, over the {platform} max of {HASHTAG_MAX[platform]} (hashtags.md).")
        dead = sorted(set(tags) & DEAD_TAGS)
        if dead:
            problems.append(f"text: remove dead hashtags {', '.join('#' + t for t in dead)} (hashtags.md).")
        if "#" in target.get("title", ""):
            problems.append("YouTube title: hashtags go in the description, not the title.")

    if platform in NEEDS_MEDIA and not content.get("mediaUrls"):
        problems.append(f"{platform} requires at least one media URL, but mediaUrls is empty.")

    return platform, problems


def main():
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return 0
    command = event.get("tool_input", {}).get("command", "")
    if "curl" not in command or not re.search(r"(backend\.blotato\.com/v2|\$\{?B\}?)/posts\b", command):
        return 0
    payload = find_payload(command)
    if payload is None:
        return 0  # status checks (GET /posts/{id}) carry no post body

    platform, problems = check(payload, banned_words())
    if not problems:
        return 0
    print(f"Blocked: the {platform or 'unknown'} post failed the pre-publish check. Fix these and retry:", file=sys.stderr)
    for p in problems:
        print(f"- {p}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
