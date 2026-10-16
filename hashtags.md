# Hashtag Playbook (TikTok + YouTube Shorts)

Source of truth for hashtags. `/clip` and `/post` pick every post's hashtags from this file. Researched Oct 4, 2026. Re-check during `/clip report` if this date is more than 30 days old.

## How the algorithms use hashtags (2026)
- Hashtags are a **categorization** signal, not a reach button. Watch time, completion, and rewatches decide distribution. A wrong tag sends the video to the wrong viewers, they swipe, and the video dies. That's why every tag must match what is said or shown.
- **TikTok** reads the caption, on-screen text, and the spoken audio, and checks that the hashtags match them. Keywords in the caption's first line now outrank hashtags. Name the creator and the topic in the first line, then reinforce with tags.
- **YouTube Shorts** shows the first 3 description hashtags as links above the title. Returns drop after 5. Over 60 and YouTube ignores all of them. `#shorts` is optional (YouTube detects Shorts on its own), so it doesn't get one of the 3 visible slots.
- `#fyp`, `#foryou`, `#foryoupage`, `#viral`, `#trending`, `#xyzbca` do nothing for distribution and waste a slot. Never use them.

## The formula
| Platform | Count | Order | Placement |
|---|---|---|---|
| TikTok | 4 to 5 | creator tag(s) → 1 to 2 topic tags → format tag → broad tag | Last line of the caption |
| YouTube Shorts | 3 to 4 | creator → topic → format or broad (these first 3 show above the title) | Last line of the description, never in the title |

Slots, in priority order:
1. **Campaign-required tags** (from `campaigns.md`). Always included, exactly as written, and they count toward the total.
2. **Creator tag:** the person on screen (table below). Every real clip gets one. TikTok also gets the creator's second tag if a slot is free.
3. **Topic tags (1 to 2):** match what the clip is about, from the video type's topic pool. Pick by what is said in the clip, not by what is popular.
4. **Format tag:** describes the type of footage. Only use it when it's true: `#podcastclips` only on real podcast footage, `#streamerclips` only on real stream footage. AI-generated or template videos get no format tag.
5. **Broad tag:** the video type's category tag.

## Relevance rules (never break these)
- Every tag must describe something said, shown, or written in that video. If you can't point to the moment that justifies a tag, drop it.
- Never put a creator tag on a clip they don't appear in or aren't the subject of.
- Never mix video types: no streamer tags on a business clip, no trading tags on a podcast clip unless the clip is about trading.
- No crypto tags unless crypto is discussed. No `#gaming` unless a game is on screen.
- All lowercase, no spaces or punctuation inside a tag.
- Never reuse the exact same tag set on two posts in a row. Rotate the topic tags.

## Creator tags
| Creator | Primary | Secondary | Video type |
|---|---|---|---|
| Alex Hormozi | `#alexhormozi` | `#hormozi` | Business / podcast |
| Joe Rogan | `#joerogan` | `#jre` | Business / podcast (or match the guest's topic) |
| MrBeast | `#mrbeast` | none | Business / podcast. Only business, money, or empire clips (no challenge clips). |
| TJR | `#tjrtrades` | `#tjr` | Trading / finance |
| Kai Cenat | `#kaicenat` | `#kaicenatclips` | Streamer / IRL |
| IShowSpeed | `#ishowspeed` | `#ishowspeedclips` | Streamer / IRL |
| N3on | `#n3on` | `#n3onclips` | Streamer / IRL |
| Dr. Kavi Simpson | `#drkavi` | `#drkavisimpson` | Relationship / dating podcast |

New creator: primary = full name or handle, lowercase, no spaces (check that it's the tag their fans use on TikTok). Add the row here.

## Video type sets

### Business / podcast talks
Broad: `#entrepreneur` · `#business`
Format (real podcast/interview footage only): `#podcastclips` · `#podcast`

| Clip is about | Topic tags |
|---|---|
| Sales, offers, pricing, marketing | `#sales` `#salestips` `#marketing` `#businesstips` |
| Starting or growing a business | `#entrepreneurship` `#smallbusiness` `#startup` `#businesstips` |
| Money, wealth, investing | `#money` `#wealth` `#financialfreedom` |
| Mindset, discipline, consistency | `#mindset` `#discipline` `#consistency` `#selfimprovement` |
| Motivation, no excuses, hard work | `#motivation` `#workethic` `#noexcuses` |
| Career, skills, passion | `#careeradvice` `#skills` `#mindset` |
| Focus, priorities, saying no | `#focus` `#productivity` `#businesstips` |
| Decisions, speed, productivity | `#decisionmaking` `#productivity` |
| Failure, risk, fear | `#failure` `#mindset` `#selfimprovement` |

### Streamer / IRL
Broad: `#streamer` · `#livestream`
Format (real stream footage only): `#streamerclips` · `#twitchclips` (Twitch streams) · `#kickclips` (Kick streams)

| Clip is about | Topic tags |
|---|---|
| Funny moment, chat interaction | `#funnymoments` `#comedy` |
| Reaction to a video, song, or person | `#reaction` |
| IRL stream, out in public, travel | `#irl` `#irlstream` |
| Collab with another streamer | the other streamer's creator tag + `#collab` |
| Gaming on screen | `#gaming` + the game's name tag (e.g. `#fortnite`) |
| Fight, beef, drama | `#drama` (only if the clip is the drama itself) |

### Relationship / dating podcast
Call-in and advice shows (Dr. Kavi Simpson). Broad: `#relationshipadvice` · `#datingadvice`
Format (real podcast/call-in footage only): `#podcastclips` · `#podcast`

| Clip is about | Topic tags |
|---|---|
| Breakup, getting over an ex | `#breakup` `#movingon` |
| Cheating, loyalty | `#cheating` `#loyalty` |
| Red flags, manipulation, mixed signals | `#redflags` |
| Blocking, social media in relationships | `#redflags` `#datingtips` |
| Boundaries, living situations, cutting ties | `#boundaries` |
| Work on yourself, focus on goals | `#selfimprovement` `#mindset` |
| Friend zone, men and women as friends | `#friendzone` |
| Co-parenting, baby mama/daddy | `#coparenting` |

Never tag drug, sexual, or explicit topics even when the clip mentions them. Keep those segments out of the posting plan.

### Trading / finance
Broad: `#trading` · `#daytrading`
Format (real stream/course/podcast footage only): `#tradingclips`

| Clip is about | Topic tags |
|---|---|
| Futures, indices (ES, NQ) | `#futurestrading` `#nasdaq` |
| Forex pairs | `#forextrading` `#forex` |
| ICT / smart money concepts | `#ict` `#smartmoneyconcepts` |
| Psychology, discipline, losses | `#tradingpsychology` `#tradingmindset` |
| Risk management, position sizing | `#riskmanagement` |
| Stocks, options | `#stockmarket` `#optionstrading` |
| Lifestyle, wealth, story | `#trader` `#money` |
| Crypto (only if discussed) | `#crypto` `#bitcoin` |

## Examples
Hormozi podcast clip about pricing:
- TikTok: `#alexhormozi #hormozi #salestips #podcastclips #entrepreneur`
- YouTube: `#alexhormozi #salestips #podcastclips #entrepreneur`

Kai Cenat IRL stream, funny moment with a fan:
- TikTok: `#kaicenat #kaicenatclips #funnymoments #streamerclips #irlstream`
- YouTube: `#kaicenat #funnymoments #streamerclips`

TJR on taking losses:
- TikTok: `#tjrtrades #tjr #tradingpsychology #tradingclips #daytrading`
- YouTube: `#tjrtrades #tradingpsychology #daytrading`

## Sources
- [Sprout Social: TikTok hashtags 2026](https://sproutsocial.com/insights/tiktok-hashtags/)
- [Postlink: TikTok hashtag strategy 2026](https://postlinkapp.com/blog/tiktok-hashtag-strategy-2026)
- [Akselera: TikTok hashtag strategy guide](https://akselera.tech/en/insights/guides/tiktok-hashtag-strategy-guide)
- [HashtagTools: YouTube Shorts hashtags by niche](https://hashtagtools.io/blog/best-hashtags-youtube-shorts-2026)
- [HashtagTools: Shorts title vs description](https://hashtagtools.io/blog/youtube-shorts-hashtags-title-vs-description-2026)
- [Postlink: YouTube Shorts hashtags](https://postlinkapp.com/blog/youtube-shorts-hashtags)
- [Opus: best TikTok hashtags](https://www.opus.pro/research/best-hashtags-tiktok)
- [Contentworks: finance hashtags 2026](https://contentworks.agency/top-finance-hashtags-for-2026/)
