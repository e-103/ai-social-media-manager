---
name: post
description: AI social media manager that drafts and queues short-form video posts for TikTok and YouTube Shorts through the Blotato API. Use when the user runs /post or asks to create, write, adapt, repurpose, or schedule a social media post from a topic, an existing post, a URL (YouTube, TikTok, article, PDF, audio, website, blog), or their own image/video URLs.
---

# /post — Social Media Manager

Turn whatever the user gives you into platform-native short-form videos for **TikTok and YouTube Shorts**, show the draft for approval, then queue it in Blotato's content calendar and log it.

Supported platforms are ONLY `tiktok` and `youtube`, the two platforms that pay creators for short-form views. Instagram and X are no longer posted to. If the user asks for another platform, say it isn't supported by this skill and only proceed if they explicitly override.

## Real clips only (no AI media, ever)
This page posts real clips only. Never generate AI videos, slideshows, images, or voiceovers for any post, on any topic. Do not call `/videos/from-templates` or `blotato_create_visual`, with ONE exception: the "Combine Clips and Apply Basic Edits" template (`/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1`) may be used on the user's real clip to burn in auto-captions and a hook title (see `/clip` step 4b). It edits real footage and adds no AI media. Every post needs a real video file or URL from the user. If the user gives only a topic or a source link with no video, don't generate anything: tell them to cut a real clip and run `/clip` with it.

## Episode link mode (the usual workflow)
When the user runs `/post <YouTube/podcast/stream link>` with no video file, this is step 1 of the clipping workflow. The page posts mainly streamers and rotates creators. If the user hasn't named the streamer this session, ask "Which streamer are we clipping this time?" first. Don't write posts yet. Instead:
1. Extract the episode (step 3), with custom instructions asking for the speaker/show, format, and every distinct moment with its most quotable line.
1b. **Get real timestamps from the YouTube captions** (YouTube links only) with `.venv/bin/python .claude/skills/post/scripts/timestamps.py`:
   - `calls <url>`: length and caller/segment boundaries.
   - `search <url> "<regex>" ...`: find each moment's key lines with their times.
   - `window <url> <start> <end>`: read the full captions of a segment to pick a clean start and end.
   For each clip pick Start and End so it runs 61 to 90 seconds, opens on the setup, and includes the key line. Read the window before picking: skip any start or end that lands on sexual, drug, or slur lines (move the cut point), and swap out a moment entirely if the explicit part is the core of it. If `.venv` is missing, run `python3 -m venv .venv && .venv/bin/pip install youtube-transcript-api`. If the video has no captions, say so and fall back to quotes only.
2. Confirm the creator is in `campaigns.md` (active or fan-clips OK). If not, stop and offer `/clip add-campaign`.
3. Pick the best moments, at least 7 and as many as the episode gives (the page posts 3 a day). Include sexual moments when they're strong; note them so the post text stays clean. Skip drug content and anything that promotes violence. Apply the `/clip` growth playbook: for each clip pick a **Cold open** (the strongest 3 to 6 second line, with exact times from `search`), a **YT window** (35 to 50s inside Start to End that contains the key line), and split any call too long for one clip into **Part 1 / 2 / 3**, each 61 to 90s and each ending on a cliffhanger. For each, classify the video type and topic and build the hashtag lines from `hashtags.md`: TikTok 4 to 5, YouTube 3 to 4.
4. Write `clip-plan.md` (move any old one to `plans/clip-plan-<date>.md` first):
   `# <Show> <episode>` + source link, then a table: `| # | File name | Part | Start | End | Cold open | YT window | Moment to cut | Key line (caption time) | Video type / topic | TikTok hashtags | YouTube hashtags |`, then a short Notes list for anything odd found in the captions with file names `<slug>-NN.mp4` continuing after the highest number already in `clips/inbox` and `clips/posted`.
4b. Add a slot table for this batch to `clips-log.md`: a `## <Creator> <episode> slots` heading, one line saying real clips only and that empty slots post nothing, then `| Slot | Clip | Status |` with one row per clip, 3 a day at 9 AM, 3 PM, 9 PM CT, starting at the next open slot after the last one in any slot table (format `Oct 12 9 AM`, status `open`). Series parts share a day, in order. The session reminder and empty-slot alert read these tables.
5. Show the cut sheet WITH the Start, End, and Cold open timestamps for every clip, and tell the user: cut Start to End in CapCut or OpusClip (61 to 90s), and copy the Cold open line to the very front, then drop them in the Clip Inbox. Open the private link for them with `open "$(grep -o 'http://127.0.0.1:5180/?key=[a-f0-9]*' .claude/clip-inbox.log | tail -1)"` (start `npm run clips` in the background first if port 5180 isn't listening). Never paste the key into chat.
6. When they say the clips are in, ask: "Post these new clips to TikTok and YouTube?" Then ask the scheduling questions (dates/slots, any changes) and run the `/clip inbox` flow.

## Never spend money
Never buy credits, upgrade a plan, or start anything that needs a purchase. If a step would require buying more (low credits, `insufficient-credits`, a paid feature), stop that step, do nothing further for it, and tell the user. They decide.

## Setup check

All calls go to `https://backend.blotato.com/v2` with the header `blotato-api-key: $BLOTATO_API_KEY` (set in `.claude/settings.local.json` → `env`).

If `$BLOTATO_API_KEY` is empty or still `PASTE_YOUR_KEY_HERE`, stop and ask the user to paste their key (Blotato → Settings → API), write it into `.claude/settings.local.json`, and tell them to restart the session so the env var loads.

```bash
B="https://backend.blotato.com/v2"
H=(-H "blotato-api-key: $BLOTATO_API_KEY" -H "Content-Type: application/json")
curl -s "${H[@]}" "$B/users/me/accounts" | jq
```

## Workflow

### 1. Refresh the log
Before anything else, update `posts-log.md` (project root): for every row whose status is `scheduled` or `in-progress`, run `GET /posts/{postSubmissionId}` and update the status, scheduled time, and `publicUrl` (live URL) or `errorMessage`.

### 2. Figure out the intent
Parse the user's input. They give a platform (TikTok, YouTube, or both; "all" means both, see "Posting to all platforms at once") plus any combination of:

| Input | How to recognize it | What to do |
|---|---|---|
| Topic | Plain idea/phrase, no URL | Write from it. If it needs current facts/stats, research it with source type `perplexity-query` |
| Existing post to adapt | Pasted post text | Rewrite it for each target platform; keep the core message |
| Content URL | youtube.com / youtu.be → `youtube`; tiktok.com → `tiktok`; x.com / twitter.com → `twitter`; `.pdf` → `pdf`; `.mp3/.wav/.m4a` → `audio`; any other web page/blog → `article` | Extract it (step 3), then write from the extracted content |
| Own media | Image URL (`.jpg/.jpeg/.png/.webp`) or video URL (`.mp4/.mov`), or a local file path | Use as the post's media (step 4); don't extract |

If the platform is missing, or the intent is genuinely ambiguous (e.g. unclear whether a URL is media or a source), ask ONE short question. Otherwise proceed.

### 3. Extract sources (if any)
```bash
curl -s "${H[@]}" -X POST "$B/source-resolutions-v3" \
  -d '{"source":{"sourceType":"youtube","url":"https://youtu.be/..."}}'
# text / perplexity-query use "text" instead of "url"
```
Returns `{ "id": ... }`. Poll with the helper until done:
```bash
bash .claude/skills/post/scripts/poll.sh source <id>
```
Terminal: `completed` (use `content` + `title`) or `failed` (tell the user and stop for that source).

### 4. Media
- **User gave image/video URLs** → use them; do NOT generate visuals. Validate each through Blotato first (limit 10/min):
  `curl -s "${H[@]}" -X POST "$B/media" -d '{"url":"<public url>"}'` → use returned `url`.
- **Local file** → `POST /media/uploads` with `{"filename":"name.ext"}` → `PUT` the file to `presignedUrl` (`curl -X PUT --upload-file <path> "<presignedUrl>"`) → use `publicUrl`.
- **No media given:** stop. Never generate visuals (see "Real clips only"). Ask the user for a real clip, or point them to `/clip`.

### 5. Write the copy
Write natively for each platform — never paste the same text everywhere. Hook in the first line, specific over generic, no "In today's fast-paced world". End every post with a hashtag line built from `hashtags.md` (TikTok 4 to 5, YouTube 3 to 4), matched to the video type and topic. No hashtags anywhere else in the copy.

| Platform | Rules |
|---|---|
| TikTok | Video required. Caption ≤2,200 chars, but keep it to 1 to 3 short lines: a hook with the topic keywords first (TikTok is search-driven), one line of context, a follow CTA, then the hashtag line. Creator Rewards only pays on videos over 1 minute. |
| YouTube | Video required. `title` ≤100 chars, no `<` or `>`, curiosity-driven. Description = `content.text` (keywords early, hashtag line at the end, never in the title; vertical videos under 3 min are classified as Shorts automatically). |

#### Writing style (apply to all platforms)
- Use clear, simple language.
- Use short, impactful sentences.
- Use active voice; avoid passive voice.
- Focus on practical, actionable insights.
- Use "you" and "your" to directly address the reader.
- AVOID em dashes. Use commas, periods, or ellipsis "..." instead.
- AVOID constructions like "...not just this, but also this".
- AVOID metaphors and cliches.
- AVOID generalizations.
- AVOID unnecessary adjectives and adverbs.
- Emojis: TikTok captions get 2 to 3 emojis that match the content (🏠 for living together, 📝 for a notice, 😳 for a shock moment, 👇 to point to the comment question). YouTube titles get at most 1, at the end. YouTube descriptions at most 2. Never strings of emojis, never emojis inside hashtags, never emojis that don't relate to the clip.
- AVOID semicolons, markdown, asterisks. Hashtags only in the final hashtag line (see `hashtags.md`).
- AVOID these words: "can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, however, harness, exciting, groundbreaking, cutting-edge, remarkable, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, powerful, inquiries, ever-evolving"
- IMPORTANT: Review every post and ensure no em dashes!

#### Brand voice samples (per platform)
Match the tone, rhythm, and format of these real posts.

TikTok voice:
<PASTE TIKTOK EXAMPLES>

YouTube voice:
<PASTE YOUTUBE EXAMPLES>

### 6. Show the draft and wait for approval
For each platform show: account (see step 7), copy, media URLs/preview links, and the schedule ("next free slot in your Blotato calendar"). Ask the user to approve or request edits. **Never queue anything without an explicit OK.** Apply edits and re-show until approved.

### 7. Pick the account
`GET /users/me/accounts?platform=<tiktok|youtube>`. If exactly one account, use it. If several, list them (`fullname` / `username`) and ask which one — every time. If none, tell the user to connect that platform in Blotato.

### 8. Queue it
Default to `useNextFreeSlot: true` (queue to the content calendar). Only use `scheduledTime` (ISO 8601, root level) if the user gives a specific date/time, and only publish immediately (omit both) if they explicitly say "now".

```bash
curl -s "${H[@]}" -X POST "$B/posts" -d @- <<'JSON'
{
  "useNextFreeSlot": true,
  "post": {
    "accountId": "<id>",
    "content": { "text": "...", "mediaUrls": ["<video url>"], "platform": "tiktok" },
    "target": { "targetType": "tiktok", "privacyLevel": "PUBLIC_TO_EVERYONE", "disabledComments": false, "disabledDuet": false, "disabledStitch": false, "isBrandedContent": false, "isYourBrand": false, "isAiGenerated": false }
  }
}
JSON
```
Targets:
- TikTok: `{ "targetType": "tiktok", "privacyLevel": "PUBLIC_TO_EVERYONE", "disabledComments": false, "disabledDuet": false, "disabledStitch": false, "isBrandedContent": <true only for paid promotion>, "isYourBrand": false, "isAiGenerated": false }`
- YouTube: `{ "targetType": "youtube", "title": "...", "privacyStatus": "public", "shouldNotifySubscribers": true, "isMadeForKids": false, "containsSyntheticMedia": false }`

Returns `{ "postSubmissionId" }`. Check once with `GET /posts/{id}` → `scheduled` (with `scheduledTime`), `published` (with `publicUrl`), `in-progress`, or `failed` (`errorMessage`).

### 9. Log it
Append one row per platform to `posts-log.md`:

`| <date queued> | <platform> | <account> | <first ~60 chars of copy> | <status> | <scheduled time> | <live URL or —> | <postSubmissionId> |`

Then tell the user what was queued, when it goes out, and that live URLs get filled in the next time `/post` runs.

## Posting to all platforms at once (`all`)
Example: `/post "How to ski in icy conditions" all`. When the platform is `all` (or the user names more than one platform), run steps 4–9 with one subagent per platform instead of doing each platform yourself. "All" means `tiktok` and `youtube`, the only platforms this skill supports.

1. **Do the shared work once, yourself:** steps 1–3 (refresh log, intent, extraction) and step 7 (pick one account per platform, asking the user if a platform has several).
2. **Use the user's clip.** Validate the real video the user gave (step 4) and share it with both platforms. If there's no video, stop and ask for one. Never generate one.
3. **Draft in parallel.** Spawn one `general-purpose` subagent per platform with the Agent tool, all in a single message so they run in parallel. Give each one: the platform, the source content/topic, the shared media URL(s), the account ID, and the full text of step 5 (platform rules, writing style, and that platform's brand voice samples). Each subagent adapts the post to its platform's format, character limits, and brand voice, then returns ONLY the draft as JSON: the exact `POST /posts` body from step 8. Subagents must NOT publish in this phase.
4. **Show all drafts together** (step 6) and wait for an explicit OK. Apply any edits to the affected platform's draft.
5. **Publish in parallel.** After approval, spawn one subagent per approved platform, all in a single message. Give each one the exact approved JSON body and tell it to: send it with the step 8 `curl` command, check the status once with `GET /posts/{id}`, and return `{ platform, account, status, scheduledTime, publicUrl, postSubmissionId, error }`. It must not change the copy. If the pre-publish hook blocks the command, it returns the hook's message instead of rewording the post itself.
6. **Log every result yourself** (step 9), one row per platform, including failures. Only the main agent writes `posts-log.md`, so parallel subagents never edit it at the same time. Report what was queued, what failed, and why.

## Error handling
- 401/403 → API key wrong or subscription issue; show `message` / `action` from the response.
- Any failed step for one platform shouldn't block the others; report it clearly.
- Don't retry a failed publish automatically — show the error and ask.
