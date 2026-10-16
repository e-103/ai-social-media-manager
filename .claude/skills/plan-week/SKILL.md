---
name: plan-week
description: Plans a week of social posts (2 per day for 7 days) for X, Instagram, and YouTube, writes the full drafts to content-plan.md for review, then schedules everything in Blotato with parallel subagents after approval. Use when the user runs /plan-week or asks to plan, batch, or schedule a week (or several days) of social media content from topics, draft posts, URLs, or their own media.
---

# /plan-week — Weekly Content Planner

> **DISABLED. This page posts real clips only, never AI-generated media.** This skill generates AI videos, so do not run it. If the user runs `/plan-week`, tell them to use `/clip` with real clips instead.
>
> (History:) **RETIRED after Oct 11, 2026.** The page switched to business clips on TikTok and YouTube only. Instagram and X are no longer posted to. Do NOT schedule any new `/plan-week` posts on these accounts with a time after 2026-10-11. The 23 posts already scheduled for Oct 4 to 11 stay as they are. If the user runs `/plan-week`, remind them of this and point them to `/clip`. Only proceed if they explicitly say to override.

Turn whatever the user gives you into a 7-day content plan, write every post in full to `content-plan.md`, get approval, then schedule it all in Blotato.

This skill builds on the `/post` skill. Read `.claude/skills/post/SKILL.md` before starting and reuse its:
- **API config and setup check** (`Setup check`)
- **Source extraction** (step 3) and **media handling** (step 4)
- **Platform rules, writing style, and brand voice samples** (step 5): these apply to every draft here
- **Account selection** (step 7), **post payloads and targets** (step 8), and **log format** (step 9)

## Defaults
| Setting | Value |
|---|---|
| Window | Today plus the next 6 days (7 days). Skip any slot already past when the plan is made. |
| Cadence | 2 posts per day: **9:00 AM** and **6:00 PM**, time zone `America/Chicago` |
| Platforms | Every post goes to X (`twitter`), Instagram, and YouTube, each adapted to that platform |
| Visual | ONE vertical 9:16 video per day, shared by both posts that day: YouTube Short, Instagram reel (`mediaType: "reel"`), attached video on X |
| Scheduling | `scheduledTime` (ISO 8601 with the Chicago UTC offset) on every post. Never `useNextFreeSlot`, never publish immediately. |

If the user asks for something different in their request (other times, fewer days, specific platforms), follow the request for that run.

Get the correct UTC offset for each date (it changes with daylight saving time):
```bash
TZ=America/Chicago date -j -f "%Y-%m-%d %H:%M:%S" "2026-10-04 09:00:00" "+%Y-%m-%dT%H:%M:%S%z" | sed -E 's/([0-9]{2})([0-9]{2})$/\1:\2/'
```

## Workflow

### 1. Setup and log refresh
Run the `/post` setup check and step 1 (refresh `posts-log.md`).

### 2. Figure out the intent
The user gives any combination of: topics, existing draft posts, URLs (YouTube, TikTok, article, PDF, audio, website, blog), and image/video URLs. Classify each input with the `/post` step 2 table. If the user gives nothing to plan from, ask what the week should be about. Otherwise proceed.

### 3. Research and extract
- **URLs:** extract each one with the Blotato Create Source API (`/post` step 3).
- **Topics:** if a topic needs current facts, stats, or examples, research it with source type `perplexity-query`. Run independent sources in parallel and poll each with `bash .claude/skills/post/scripts/poll.sh source <id>`.
- **Own media:** validate it through `POST /media` (`/post` step 4). Days with user-supplied video skip generation.

### 4. Pick accounts
One account per platform (`/post` step 7). If a platform has several accounts, ask which one. If one has none, tell the user and plan without it.

### 5. Build the plan
Spread the material across the slots (up to 14). With fewer inputs than slots, split each topic into distinct, specific angles (a how-to, a mistake to avoid, a quick list, a story, a myth, a question for the audience...). Never repeat an angle. Existing drafts keep their core message.

For each post, write the **full post content** for each platform, not a summary. Write it like a real post: line breaks, short sentences, lists where they help. Follow the `/post` step 5 platform rules, writing style, and brand voice exactly. Before writing the file, review every draft against the pre-publish hook rules: no em dashes, no banned words, within the character limits, no hashtags.

For each day, pick ONE vertical video template (`GET /videos/templates`, `/post` step 4) and write a visual prompt that fits both posts that day. Do not generate visuals yet.

### 6. Write `content-plan.md`
If `content-plan.md` already exists in the project root, move it to `plans/content-plan-<its first date>.md` first. Then write the new plan in this format so the user can read and edit it:

```markdown
# Content Plan: Oct 4 – Oct 10, 2026
Accounts: X @<handle> · Instagram @<handle> · YouTube <channel>
Times: 9:00 AM and 6:00 PM (America/Chicago)

## Day 1 · Sun, Oct 4
**Visual:** yes · **Template:** <template name> (`<templateId>`)
**Visual prompt:** <what the day's video shows>
**Media URL:** <filled in after generation>

### Post 1 · 9:00 AM
**Topic:** <angle>

#### X
<full post; thread posts separated by a line with --->

#### Instagram
<full caption>

#### YouTube
**Title:** <≤100 chars>
<full description>

**Status:** draft

### Post 2 · 6:00 PM
...
```

Fields per post: day, post number, topic, draft text per platform, visual (yes/no), template name. Use `Visual: no` only on a day with no YouTube post. YouTube always needs a video.

### 7. Approval 1: the plan
Show a short overview (day, time, topic per post) and point the user to `content-plan.md` for the full drafts. Ask them to approve or request edits. They can edit the file directly. If they do, re-read it before continuing. **Generate nothing and schedule nothing until they explicitly approve.**

### 8. Generate visuals (once per day)
After approval, start every day's video generation with `POST /videos/from-templates` (`/post` step 4, `"render": true`). Start them all first, then poll each with `poll.sh visual <id>`. Write each `mediaUrl` into the day's **Media URL** field. A template that returns only `imageUrls` and no `mediaUrl` is not a video, so regenerate that day with a video template. If generation fails or credits run out, report it and mark the affected posts `blocked: no video`.

### 9. Approval 2: the visuals
Show the 7 video links and ask for a final OK to schedule. **Never schedule anything without an explicit OK.** Regenerate a day's video if the user asks.

### 10. Schedule with parallel subagents
Build the exact `POST /posts` body (`/post` step 8) for every platform post: `scheduledTime` at the root, the day's `mediaUrl` in `mediaUrls`, Instagram `mediaType: "reel"`, YouTube `containsSyntheticMedia: true` for generated video.

Spawn one `general-purpose` subagent **per day**, all in a single message so they run in parallel. Give each one its day's JSON bodies (up to 6) and these instructions:
- Send each body with the `/post` step 8 `curl` command (`"$B/posts"` with the `-d @- <<'JSON'` heredoc), exactly as given. Do not change the copy.
- If the pre-publish hook blocks a command, do not reword the post. Record the hook's message as the error and continue with the next post.
- Check each submission once with `GET /posts/{id}`.
- Return a JSON array with `{ day, post, platform, account, status, scheduledTime, publicUrl, postSubmissionId, error }` for every body.

### 11. Log and report
Only the main agent writes files. Append one `posts-log.md` row per platform post (`/post` step 9), failures included. Update each post's **Status** in `content-plan.md` (`scheduled`, `failed: <reason>`, or `blocked: <reason>`). Then report: how many posts were scheduled, the first and last scheduled times, and every failure with its reason. Do not retry failures automatically. Ask first.

## Error handling
- 401/403: the API key is wrong or there's a subscription issue. Show `message` / `action` from the response.
- One failed day or platform never blocks the others.
- If a slot's time has passed by the time scheduling runs, skip it and report it rather than publishing immediately.
