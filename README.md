# AI Social Media Manager

An AI-driven workflow for running a faceless short-form video page on **TikTok and YouTube Shorts**. It's built as a set of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills and hooks on top of the [Blotato](https://blotato.com) publishing API, plus a small local web app for managing clips.

You cut a clip. The system captions it for each platform, checks the post against platform rules, schedules it in the posting calendar, and tracks every live link so you can submit it to a paid clipping campaign.

## What it does

| Piece | What it does |
|---|---|
| `/post` skill | Turns a topic, a URL or a video into platform-native TikTok and Shorts posts, shows a draft for approval, then queues it in Blotato. In "episode mode" it pulls a podcast or stream's YouTube captions and builds a cut sheet of the best moments with real timestamps. |
| `/clip` skill | The main workflow. Captions finished clips, picks the next open posting slot, uploads the media, schedules both platforms, and logs each post against its clipping campaign. |
| `/plan-week` skill | Plans and batch-schedules a week of posts (retired in favor of `/clip`). |
| Clip Inbox (`npm run clips`) | Local React app for dropping in video files. Anything that isn't 9:16 is converted to 1080×1920 with ffmpeg: the whole frame is centered over a blurred fill, and the original is kept. |
| `check-post.py` hook | Runs before every publish call and blocks the post if it breaks a rule: character limits, missing media, too many hashtags, useless tags like `#fyp`, banned words or em dashes. The problems go back to the AI to fix. |
| `session-start.sh` hook | Starts the Clip Inbox server and shows today's open slots and queued clips. |
| `slot-alert.py` | A daily check (macOS launchd) that emails you when tomorrow has an open posting slot. |
| `timestamps.py` | Pulls timed YouTube captions to find each moment's key lines (`calls`, `search`, `window`). |

## Security notes

The Clip Inbox accepts uploads and runs ffmpeg, so it's locked down even though it only runs on your own machine:

- **New secret key each start.** Every time the server starts, it generates a random 256-bit key and prints a private link. Opening that link sets an `HttpOnly`, `SameSite=Strict` cookie and removes the key from the URL.
- **Every API request is checked.** Each request must carry that cookie (compared in constant time with `crypto.timingSafeEqual`). It must also come from the allowed `Host` and `Origin`, with a `Sec-Fetch-Site` of `same-origin`. This blocks DNS-rebinding and cross-site requests.
- **Inputs are restricted.** Filenames must match a strict pattern, which blocks path traversal. Uploads are capped in size, and ffmpeg runs through `execFile` with argument arrays rather than a shell.
- **Secrets stay out of git.** The Blotato API key lives in `.claude/settings.local.json`, which is gitignored.

## Stack

TypeScript · React 18 · Vite · Node (ffmpeg-static / ffprobe-static) · Python 3 · Bash · Claude Code skills and hooks · Blotato REST API

## Setup

```bash
npm install
cp .claude/settings.local.example.json .claude/settings.local.json   # add your Blotato API key
npm run clips                                                       # opens the Clip Inbox private link
```

Then open the project in Claude Code and run `/clip` or `/post`.

Before posting, fill in your own brand, handles and Blotato account IDs in `.claude/skills/clip/SKILL.md`. The skills keep their run data in local files (`campaigns.md`, `clips-log.md`, `clip-plan.md`). Those files and your `clips/` folder are gitignored, so your media and account data never get committed.

## Rules the page follows

- **Real clips only.** No AI-generated video, images or voiceovers.
- **Only creators who allow it.** Clips come from creators who allow fan clips or run a paid clipping program, and their rules are followed.

---

Built by Emiliano Luna · B.S. Computer Science (Cybersecurity), St. Edward's University
