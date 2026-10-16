---
name: clip
description: Faceless clipping manager. Captions, schedules, and tracks creator clips (already cut by the user) on TikTok and YouTube Shorts through Blotato, tied to paid clipping campaigns (Whop Content Rewards, Vyro, ContentRewards, etc.). Use when the user runs /clip, drops clip files or clip URLs to post, adds a clipping campaign, or asks for a clipping earnings/submission report.
---

# /clip — Faceless Clipping Manager

The user cuts clips themselves (OpusClip, CapCut, etc.). This skill turns each finished clip into platform-native posts for **TikTok and YouTube Shorts**, queues them in Blotato, and tracks which campaign each clip belongs to so every live link gets submitted for payment.

This skill builds on `/post`. Read `.claude/skills/post/SKILL.md` first and reuse its:
- **Setup check** (API key, `$B`, `H`)
- **Media handling** (step 4: `POST /media` for URLs, `POST /media/uploads` + PUT for local files). Never generate visuals in `/clip`. The clip IS the media.
- **Platform rules and writing style** (step 5). Every rule there applies, including the banned words and no em dashes. The pre-publish hook enforces them.
- **Account selection** (step 7) and **post payloads/targets** (step 8)

Supported platforms: `tiktok` and `youtube` only. These are the two platforms that pay creators directly for short-form views (TikTok Creator Rewards, YouTube Partner Program) and the two every major clipping campaign pays on. Instagram and X are not posted to. If the user asks for them, remind them of this and only proceed if they explicitly override.

## Page identity
Brand: **<YOUR BRAND>**, faceless business and creator-economy clips (Hormozi, MrBeast, money/trading creators).

| Platform | Handle (for CTAs) | Blotato accountId |
|---|---|---|
| TikTok | @your_tiktok | <TIKTOK_ACCOUNT_ID> |
| YouTube | Your Channel | <YOUTUBE_ACCOUNT_ID> |

Fill in your own handles and Blotato account IDs above, then use them directly (no need to ask which account). CTA examples: "Follow @your_tiktok for daily Hormozi clips", "Subscribe for daily business clips". Never use the owner's real name anywhere.

## Monetization targets
Every clip works toward two income streams at once: campaign pay per 1K views, and the platforms' own creator funds.

| Platform | Program | Requirements to qualify | What this means for clips |
|---|---|---|---|
| TikTok | Creator Rewards Program | 18+, 10K followers, 100K views in the last 30 days, eligible country | Only videos **over 1 minute** earn. Prefer clips of 61 to 90 seconds for TikTok. Flag any clip under 60s as "won't earn Creator Rewards, campaign pay only". |
| YouTube | Partner Program (Shorts) | 500 subs + 3M Shorts views in 90 days (fan funding tier), or 1K subs + 10M Shorts views in 90 days (ad revenue share) | Shorts up to 3 minutes count. Volume and consistency matter more than length. |

Requirements change. Re-check them during `/clip report` if the numbers look stale. When reporting, show progress toward each threshold if the user shares follower/view counts.

## Files
| File | Purpose |
|---|---|
| `hashtags.md` | Hashtag playbook: creator tags, video type sets, topic pools, count and order per platform. Every caption's hashtags come from here. |
| `campaigns.md` | Every campaign/creator the user is allowed to clip, with rate, platforms paid, rules, link. The source of truth. |
| `creators.md` | Research list of creators who pay clippers or allow fan clips. Reference only. |
| `clips-log.md` | One row per platform post of a clip: campaign, status, live URL, submitted yes/no. |
| `clips/inbox/` | Finished clip files. The user adds them with the Clip Inbox app (`npm run clips`, drag and drop) or by copying files in. Each clip may have a `<name>.json` sidecar. After queueing, move the clip AND its sidecar to `clips/posted/`. |

## Growth playbook (applies to every post, from Oct 5, 2026)
Researched Oct 5, 2026 from the account's own numbers: TikTok clips got about 650 views each with 6 to 8% likes but 0 follows and 0 comments, and YouTube Shorts got 2 to 4 views. Every `/clip` and `/post` run applies these automatically:
1. **Cold open.** Every clip opens on its strongest line (3 to 6 seconds), then plays the story from Start. `clip-plan.md` gives each clip's Cold open timestamps, and the user puts that line at the front in CapCut. In captions, the first line echoes the cold open line.
2. **3 posts a day** per platform at 9:00 AM, 3:00 PM, and 9:00 PM CT.
3. **Series.** A call too long for one clip becomes Part 1 / Part 2 / Part 3, posted the same day in order (9 AM, 3 PM, 9 PM). Put "Part N" in the on-screen hook, the TikTok caption's first line, and the YouTube title. Part 1 and 2 captions end with "Part 2 is on the page, follow so you don't miss it" (or Part 3). Every Part after 1 starts with a one-line recap in the caption.
4. **Short YouTube cut.** TikTok gets the full 61 to 90s clip (Creator Rewards needs over 60s). YouTube gets a 35 to 50s cut (cold open + the plan's YT window) because Shorts reach depends on percent watched. Step 4a makes it.
5. **Search keywords first.** TikTok caption first line = creator name + the topic people search ("cheating", "my ex", "relationship advice", "breakup"). Captions run 150 to 300 characters. YouTube titles lead with the searchable topic.
6. **Comment question.** Every post ends on a question. In the report, give one ready-to-paste pinned comment per post, and remind the user to pin it and reply to every comment in the first hour.
7. **Winning format (kavi-10, posted Oct 6: 4,028 TikTok views, 5.3% likes, 14 shares; every other clip got 850 to 1,350).** The user set this as the standard for every post from Oct 14, 2026:
   - **Full-screen face crop.** Kavi fills the 9:16 frame (auto-reframe in OpusClip or CapCut). Never the small 16:9 band over a blurred fill, and never the stream overlay bar. When a clip arrives letterboxed (a small video band inside a blurred frame), warn the user once that it breaks the format and say to re-export with auto-reframe.
   - **Big burned-in captions** from OpusClip/CapCut: bold uppercase, white with the key word highlighted in green, lower third. These clips come in with `captions: "has"`, so skip the Blotato caption render (step 4b) so captions don't stack. Only use Blotato captions when the clip has none.
   - **Hook box** at the top for the first few seconds: black bold text on a white box, 5 to 7 words, stating the verdict ("Stop Waiting, This Relationship Is Over").
   - **Opens on Kavi's verdict line**, with no setup first. About 65s for TikTok.
   - **Caption template** (one short paragraph, about 250 characters): `<Topic>: <verdict> <1 emoji> Dr. Kavi Simpson <what he does to the caller>. "<the caller's or Kavi's line>." <question to the viewer>? 👇 Follow for daily Dr. Kavi clips. <hashtags>`. Example: `Breakup advice: accept it's over and move on 💔 Dr. Kavi Simpson makes a caller say it out loud. "She's not going to be with me." Would you say it about your ex? 👇 Follow for daily Dr. Kavi clips. #drkavi #drkavisimpson #breakup #movingon #relationshipadvice`
   - **Topic first:** universal verdicts (it's over, move on, cheating, red flags) beat niche stories. Pick these first when planning moments.

## Hard rules (never break these)
1. **Authorized clips only.** A clip must belong to a row in `campaigns.md` whose Status is `active`, or a creator marked `fan-clips OK`. If the clip's creator/campaign isn't there, stop and say so. Offer `/clip add-campaign <link>`.
2. **Platforms.** Post every clip to BOTH TikTok and YouTube, even when the campaign pays on only one of them. The unpaid side still builds toward platform monetization (see "Monetization targets"). Only submit links to the campaign for platforms it pays on. If a campaign's rules forbid posting elsewhere, follow the campaign.
3. **Faceless.** Never add the user's name, face, voice, location, or personal details to captions or media. Captions speak as the page, not as a person.
3b. **Real clips only.** Every streamer and podcaster clip uses real footage from their stream, podcast, or show. Never AI-generated video, images, or voiceover.
3c. **Explicit audio: warn once, then the user decides.** If a clip's captions show sexual or explicit lines, show the user the exact lines with timestamps and offer the nearest clean cut. If the user still says to post their clip, post it, and keep the caption, title, and hashtags clean with nothing sexual in the text, to keep the reach risk as low as possible. Never add sexual words, slang, or emojis to the text of such a post.
4. **Transformation.** Each caption adds context: who is in the clip, what happened, why it matters. Never post a bare repost caption. Before queueing, confirm the clip itself has an on-screen hook and captions burned in (ask once per batch: "Do these clips have on-screen hook text and subtitles?"). If not, offer step 4b auto-captions. If the user declines, warn that YouTube rejects reused content from the Partner Program and TikTok excludes unoriginal reposts from Creator Rewards.
5. **Hashtags from `hashtags.md` only.** Every TikTok caption and YouTube description ends with a hashtag line built with the `hashtags.md` formula (TikTok 4 to 5, YouTube 3 to 4). Classify each clip's video type (business/podcast, streamer/IRL, trading/finance, relationship/dating podcast) and topic from what is said and shown, then pick tags. Never use a tag that doesn't match the clip. Campaign-required tags, mentions, or `#ad` disclosures come first, exactly as required, and count toward the total.
6. **Approval first.** Show every draft and wait for an explicit OK. Never queue without it.
7. **Never publish immediately.** Always `scheduledTime`. Never `useNextFreeSlot`.
8. **Different copy per platform**, and different copy per clip. Never reuse a caption.
9. **Never spend money.** Never buy credits, upgrade a plan, or start anything that needs a purchase. Before any credit-using step (4b auto-captions), check `blotato_get_credits`. If the balance is too low or Blotato returns `insufficient-credits`, stop that step, do nothing further for it, and tell the user. Never retry, never work around it with a paid alternative. The user decides whether to buy.

## Modes

### `/clip <files or URLs> [campaign]` — post clips
1. **Setup + refresh.** Run the `/post` setup check. Refresh `clips-log.md`: for every row with status `scheduled` or `in-progress`, `GET /posts/{id}` and update status, time, live URL, or error.
   Also read the slot tables in `clips-log.md` and put those clips in their listed slots.
2. **Collect clips.** Inputs: local paths, `clips/inbox/` (if the user says "inbox" or gives nothing, use every video in it), or public video URLs (`.mp4/.mov`). Google Drive/Dropbox share pages are not direct files; ask the user to download them into `clips/inbox/`.
2b. **Read each clip's sidecar** (`clips/inbox/<name>.json`, written by the Clip Inbox app) when it exists:
   - `creator` → the campaign/creator for step 3 (overrides the file name).
   - `captions`: `"add"` → run step 4b auto-captions without asking. `"has"` → skip 4b.
   - `hook` → the step 4b on-screen title text (keep ≤8 words, apply the writing style).
   - If `clip-plan.md` has a row for this file name, start from its video type, topic, and hashtag lines (they were generated in `/post` episode link mode). Adjust only if the sidecar notes show the clip is about something else.
   - If `clip-plan.md` has a "Pre-written drafts" entry for this file, use that hook and those captions as the drafts (the user already shaped them). Still show them for approval.
   - `notes` → what happens in the clip. Use it to classify the video type and topic for `hashtags.md` and to write the caption. If notes are empty, ask the user what happens in the clip before writing.
   - `slot` → post on that date (America/Chicago) in the first open slot that day. Empty → next open slot.
2c. **9:16 check.** Every clip must be vertical 1080x1920 before upload. The Clip Inbox app converts anything else automatically (whole frame centered over a blurred fill) and keeps the untouched original in `clips/originals/`. Check each file with `node_modules/ffprobe-static/bin/darwin/arm64/ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 <file>`. If a clip isn't 9:16, or a hidden `.<name>.*.converting.mp4` file is in the inbox, it's still converting: wait, or tell the user to start `npm run clips` so it converts. Never post a horizontal clip.
2d. **Plan timing for this clip.** Look up the clip's row in `clip-plan.md`: Start, Cold open (start to end), YT window (start to end), Part. Cold length C = cold end minus cold start, in seconds.
3. **Match each clip to a campaign** from `campaigns.md` (by name the user gives, or by file name like `kai-irl-01.mp4`). Unmatched → hard rule 1.
4. **Upload media** (`/post` step 4). Record each clip's `publicUrl`.
4a. **YouTube cut (playbook rule 4).** Before upload, make the short YouTube file with `.claude/skills/clip/scripts/yt-cut.sh <clip> clips/inbox/<name>-yt.mp4 <C> <from> <to>`, where from = C + (YT start minus Start) and to = C + (YT end minus Start), all in seconds. If the clip's length isn't about C + (End minus Start) give or take 4s, the user cut it differently: ask them for the second where the YouTube cut should start and end instead of guessing. Check the result is 35 to 50s and 1080x1920 with ffprobe. Upload both files; TikTok uses the full clip, YouTube uses the `-yt` file. Run 4b on each (two renders; renders have cost 0 credits so far, check the balance anyway). Move the `-yt` file to `clips/posted/` with the clip.
4b. **Auto-captions (default for every upload).** The user's standard is to export clips from CapCut WITHOUT subtitles and let Blotato add them. When the sidecar says `captions: "add"` (the Clip Inbox default), run this automatically without asking. Skip only when it says `"has"` (subtitles already burned in, so captions don't stack). Use the card's hook as the on-screen title; if it's over 8 words, trim it to its strongest 8 or fewer and show the trimmed version in the approval. Run the Blotato template `/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1` on the uploaded clip with `blotato_create_visual`:
   `inputs: { videoClips: [{ url: <publicUrl> }], captionsConfig: { enabled: true, style: "tiktok", position: "bottom" }, titleConfig: { enabled: true, text: <hook, ≤8 words>, position: "top", duration: 4, style: "bold" }, trimSilence: true, aspectRatio: "9:16" }`.
   Poll `blotato_get_visual_status` (15s+ apart) until `done`, then use the returned `mediaUrl` as the clip's media. Show the captioned video link in the approval table. This is the only template allowed: it edits real footage and adds no AI media. It costs credits, so check `blotato_get_credits` first and report the balance. It can't cut a moment out of a long video, so the user still sends clips already cut.
5. **Write captions.** For each clip × each platform the campaign pays on:
   - **TikTok:** caption ≤2,200 chars, but keep it to 1 to 3 short lines: a hook naming the creator, one line of context, then a follow CTA ("Follow for daily Hormozi clips"). TikTok is search-driven, so put the creator's name and the topic keywords in the first line. Target: `privacyLevel: "PUBLIC_TO_EVERYONE"`, `disabledComments/disabledDuet/disabledStitch: false`, `isYourBrand: false`, `isAiGenerated: false` (real footage), `isBrandedContent: true` only when the campaign requires a paid-promotion disclosure, otherwise `false`.
   - **YouTube Short:** `title` ≤100 chars, curiosity hook naming the creator (e.g. "Hormozi Explains Why Most Offers Fail"). Description: 1 to 3 short lines of context + campaign-required tags. `containsSyntheticMedia: false` (real footage).
   - Name the creator in every caption (campaigns track by it and viewers search it).
   - **Hashtags:** add the hashtag line last (hard rule 5). In the approval table, show the video type and topic you classified each clip as, so the user can correct a wrong pick.
   - Run every draft past the `/post` step 5 writing style before showing it.
6. **Schedule.** Default slots, America/Chicago: **9:00 AM, 3:00 PM, 9:00 PM** on both TikTok and YouTube (playbook rule 2). Max 3 clips per platform per day. Series parts go in order on the same day. Fill the next open slots starting today; skip past times. Check `clips-log.md` and `posts-log.md` so no two posts share a slot on one platform. Spread one campaign's clips across days rather than stacking them. Get the UTC offset with the `/plan-week` date command.
7. **Show the batch** as a table: clip, campaign, platform, scheduled time, caption/title. Wait for explicit approval. Apply edits and re-show.
8. **Queue** (`/post` step 8). For 3+ posts, use one `general-purpose` subagent per clip, all in one message, each given its exact approved JSON bodies, told not to change copy, and to return `{ clip, platform, status, scheduledTime, publicUrl, postSubmissionId, error }`. If the hook blocks a body, return the hook message; don't reword.
9. **Log** (main agent only). Append to `clips-log.md`:
   `| <date queued> | <campaign> | <clip file> | <platform> | <status> | <scheduled time> | <live URL or —> | <submitted: no, or n/a if the campaign does not pay on that platform> | <postSubmissionId> |`
   Move posted files and their `.json` sidecars from `clips/inbox/` to `clips/posted/`.
   If the clip has a row in a slot table in `clips-log.md` (e.g. "Kavi EP.64 slots"), set its Status to `scheduled` (or `missed` if its slot passed). The session-start reminder reads that table to tell the user which clip is next, so keep it accurate.
10a. **Next clip.** After reporting, name the next `open` clip in the slot table as a one-row table: `| Slot | Clip | Cut from | To | Moment | Key line |` (timestamps from `clip-plan.md`), plus the source link and remind the user to cut and submit that one next. Clips go one at a time, in table order.
10. **Report:** what's scheduled and when, plus each post's pinned comment question to paste (playbook rule 6). Remind them to pin it and reply to every comment within the first hour after it goes live. Then remind: "Submit each live link to its campaign right after it goes live. Views only count once the post is trackable. Run `/clip report` after the posts go out to get the links."

### `/clip report` — submissions and earnings
1. Refresh `clips-log.md` (step 1 above).
2. List every **published** row with `submitted: no`, grouped by campaign, with the campaign's submit link from `campaigns.md`. These are money on the table.
3. When the user says links are submitted, set those rows to `submitted: yes`.
4. Summarize per campaign: clips posted, platforms, published vs failed. If the user pastes view counts or payouts from Whop/Vyro, record them in the campaign's Notes in `campaigns.md` and compute effective $/1K.
5. Flag any campaign with no payout after 14 days of posting, or effective rate under $0.50/1K, as a candidate to drop.

### `/clip add-campaign <link or details>`
1. Fetch the campaign page (WebFetch) or use the details given.
2. Extract: creator/brand, marketplace, rate per 1K views, platforms paid, budget left, rules (length, tags, disclosure, banned edits), submit link.
3. Reject or flag it if: platforms paid include neither TikTok nor YouTube, the host has bad payout reports (check ClipRadar), or rules require showing a face/voice.
4. Add the row to `campaigns.md` with Status `active` and show it to the user.

### `/clip find` — new campaigns
Search ClipRadar, Whop Content Rewards, and Vyro (WebSearch/WebFetch) for active campaigns in the niche (streamers, IRL, creator-economy, business creators) that pay on TikTok or YouTube Shorts. Rank campaigns that pay on both above ones that pay on one. Return the top 5 by rate with platforms and rules. Add only the ones the user picks.

## Error handling
- 401/403: show `message` / `action` from Blotato.
- Upload or one platform failing never blocks the rest. Report every failure. Never retry automatically.
