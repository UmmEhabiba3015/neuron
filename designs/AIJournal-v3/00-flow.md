# Stage 0 — Application flow

> **Current scope:** [V3-REVISION.md](V3-REVISION.md) supersedes the older guest, tier, offline, account and route decisions below. Historical reasoning and the locked visual, accessibility and motion rules remain useful.


**Journal.** Mobile web is the base design. Everything below describes the browser product
at 390; native deltas are marked `⌁` and deferred to stages 4–5.

Nothing here is visual. Where I name copy it is to make a decision judgeable, not to fix
wording — the canonical sample content set gets written once, at the direction lock.

Working date for all examples: **Sunday 9 August 2026.**

> **Revision 5 — final until funding.** **Free spends nothing.** No model runs for a free
> user, ever — no conversation, no reflections, no synthesis, no free read, and no
> classifier. Free gets writing and **voice memos kept as audio and never transcribed**. Pro
> carries the whole product and transcribes everything, including the entire free backlog on
> upgrade. **$9.99/month, $99/year.**
>
> Two consequences are load-bearing and are documented rather than smoothed over: **nobody
> experiences the AI before paying** (§4.4), and **the crisis path on free is now keyword
> matching with no model behind it** (§4.3).

---

## The tier split

| | **Free** | **Pro** |
|---|---|---|
| Writing | ✓ | ✓ |
| **Voice** | **✓ — recorded, kept, played back. Never transcribed.** | ✓ transcribed live |
| **Transcription of the free backlog** | — | **✓ all of it, on upgrade** |
| Conversation | — | ✓ |
| Ask — synthesis across history | — | ✓ |
| Weekly & long-range reflections | — | ✓ |
| Mood + 3 trackers · Timeline | ✓ | ✓ |
| Keyword search | ✓ typed entries only | ✓ everything, incl. transcribed audio |
| Import | ✓ | ✓ |
| Export (markdown, JSON, audio files) | ✓ forever, incl. after cancelling | ✓ |
| Crisis resource | ✓ **keyword-triggered + always-present. No model.** §4.3 | ✓ in-conversation |
| Notifications | — | ✓ (two, both optional) |

**Free is a journal you can talk into. Pro is the thing that reads it.**

**The mechanic:** a free user accumulates hours of their own voice they can play but cannot
search, scan, or read. Upgrading transcribes all of it at once. Nothing is withheld that we
have — transcription is simply work nobody has paid for — and the argument gets stronger
every week they stay.

### Economics

| | |
|---|---|
| Free — **AI spend** | **$0.00. No model runs.** |
| Free — storage (audio), blended | ~$0.003/user/month, growing |
| **Free at 10,000 signups** | **~$30/month, all of it storage** |
| Pro — Claude | $1.31 |
| Pro — live transcription (200 min) | $0.86 *(→ ~$0.10 on a cheap provider or on-device)* |
| Pro — back-transcription of the backlog, amortized | $0.12 |
| **Pro basis** | **~$2.30/month** |
| **Price** | **$9.99/mo · $99/yr** — **4.3×** (annual 3.6×) |

Comfortably above the 3× rule, and still above it for a heavy user. Once the transcription
benchmark lands the basis drops to ~$1.54 and the margin goes to 6.5× — **take that as
margin, not a price cut.**

**Storage is the only free cost, and the only one that never stops growing**, even for a
dormant account. Audio at 24kbps Opus is ~14MB per active user per month, ~170MB after a
year. **Use an object store with zero egress fees** — playback is bandwidth, and metered
egress turns "listen back to last March" into a line item. Cold-tier accounts after twelve
months of inactivity.

**Exposure control is now trivial:** free cannot generate a variable AI bill, so the only
budget to watch is Pro's, which is covered by revenue by construction.

---

## 0. Four structural decisions the rest of the document rests on

**A day is a document, and the day ends at 4am.** On free it holds typed entries and voice
memos; on Pro it holds a conversation. Either way it has a date, a URL, a mood and a boundary
— which is what makes citations, export granularity, timeline rows and "open the original"
possible at all. The boundary is **4am, not midnight**, because this product's stated hour is
1am and cutting a person's Tuesday night in half at 00:00 is a database decision leaking into
a life.

**An empty day does not exist.** Days with no content are not rendered as rows, are not
counted, and are never shown as a blank waiting to be filled. They are unmarked space in the
calendar zoom and nothing at all in the list zoom. A day you can see but haven't written in is
a blank page with your name on it, which is the failure this product exists to avoid.

**The paywall hides the reading, never the recording.** Every entry, every audio file, the
full timeline, keyword search over everything we hold as text, and export all stay free and
complete forever — at every tier, before and after cancelling. Nothing the user made is
blurred, locked, greyed or held. An untranscribed memo is not withheld; it is work nobody has
paid for, and the copy must say exactly that.

**Pro is sold on a fact, not a claim.** With no demonstration available, the upgrade
proposition is not "our AI notices things" — it is *"you have 4 hours 12 minutes of your own
voice that has never been read; this turns it into text you can search."* Transcription is a
service people can accurately imagine, which is why this tier line survives having no demo.
Everything else Pro does is a surprise delivered after payment. See §4.4.

---

## 1. Screen inventory — mobile web

### Routes

| Route | Screen | Kind | Tier |
|---|---|---|---|
| `/` | **Today** — home | destination | both (different screens) |
| `/talk` | Voice capture, full screen | pushed page | **both** (different outcomes) |
| `/timeline` | Timeline (list / calendar zoom) | destination | both |
| `/d/2026-08-04` | A day | page | both |
| `/e/{id}#p{n}` | An entry, memo, or past conversation | page | both |
| `/ask` | Ask + search — the single query field | destination | both |
| `/ask/{id}` | An answered question | page | **Pro** |
| `/reflection/2026-w32` | A reflection | page | Pro |
| `/you` | Account & settings root | destination | both |
| `/you/plan` | **Plan and upgrade — the only place Pro is ever explained** | page | both |
| `/you/privacy` · `/you/visible` | Privacy in plain sentences · what the AI can see | page | both |
| `/you/data` · `/you/trackers` · `/you/notifications` | Import/export/delete · mood + 3 trackers · notifications | page | both · both · Pro |
| `/in` · `/new` · `/restore` | Sign in · create · restore on a new device | page | both |

Four destinations: **Today · Timeline · Ask · You.** Both tiers, same four.

### Today — `/`

**Free — a composer, a mic, and the day's items.**

| State | Notes |
|---|---|
| **Logged-out cold** | Three sentences: a private journal; write it or say it; Pro reads it back. Composer and mic both live. Import third. No sign-in wall, no badges, no scroll. |
| **Guest, active** | Thin strip: kept in this browser until a stated date, and *Keep this*. Memos included in what carries over. |
| **Empty today** | **Never a bare box.** One line from a fixed, human-written prompt set — "What's today been like?" — rotating by day. Written once by a person, costs nothing, honours the brief's no-blank-page rule without a model. |
| **Items today** | Typed entries and memos in one list, newest last. A memo row is date, duration, waveform, play control — **visibly a different object from a typed entry.** |
| **Settled** | Mood row is the last object. Nothing pushes for more. |
| **Return after a gap** | A verbatim echo of the last typed entry with its date, or, if the last item was a memo, its date and duration with a play control. A database read. See §3.4. |
| **Crisis resource present** | A static card beneath a typed entry, keyword-triggered, in the product's voice, with *that isn't what this was*. **Typed entries only, no model** — §4.3. |
| **Offline** | Composer and recorder fully functional; items marked *saved on this device*; audio uploads when the connection returns. No error. |
| **Excluded item present** | Marked out of memory, visibly marked in place. |

**Pro — the conversation**, as the brief describes: alternating turns, the user's words the
high-status object, AI output visibly subordinate. All the above plus **in conversation**,
**AI opening line drawn from the record**, **reflection ready**, and **voice allowance near
its fair-use ceiling**.

### Voice capture — `/talk` — both tiers, different outcomes

Full screen, one job: a centred waveform and nothing competing.

**Free:** record → stop → **saved as a memo.** No transcript, no reply, no processing. One
line at the foot, stated once and never nagging: *"Kept as audio. Pro turns your recordings
into text you can read and search."*

**Pro:** record → stop → transcribed → transcript lands in the thread, reply follows.

States: **listening** · **paused** · **kept (free)** · **transcribing (Pro)** · **permission
not yet granted** · **permission denied** · **no microphone** · **offline (records locally,
uploads later)** · **Pro, near the fair-use ceiling**.

Back from `/talk` **stops and keeps**. It never discards. On free this is load-bearing —
there is no transcript to recover a lost recording from.

`⌁` Native replaces the browser's per-origin mic prompt with the system permission sheet,
can use free on-device recognition on the Pro path, gains background audio, and needs a
"recording continued while you were in another app" state the web build cannot have.

### Timeline — `/timeline`

One timeline. Calendar is a zoom level of it. Both tiers, except Pro interleaves reflection
rows.

**Memo rows read differently from entry rows** — a duration and a waveform where an entry
shows its opening line. That difference is honest, and it is the product's quietest,
most persistent upgrade argument: a column of unread recordings.

Carries the only number in the product, and it only rises: **"148 entries · 31 recordings ·
4h 12m not yet read."** That last clause is the conversion mechanism — a fact about their own
record in their own units, tappable through to `/you/plan`. It is not a pitch, is never
coloured, never counted down, and never styled as urgency. On Pro the clause simply isn't
there, because nothing is unread.

States: **empty (day 1)** · **thin (day 7, already with a gap)** · **dense (month 6)** ·
**list zoom** · **calendar zoom** · **a month with a three-week gap** · **memos and entries
interleaved** · **a month of memos only** · **excluded items marked** · **imported entries
marked with their source** · **cached / offline** · **guest**.

### A day · An item — `/d/2026-08-04` · `/e/{id}`

The day read back. Mood editable here — the only place it changes after the fact. A day may
hold entries, memos, a conversation, or a mix, including across an upgrade. An item page is
the entry text, the memo player, or the conversation, with **a play-along transcript once
transcribed on Pro.**

### Ask — `/ask`

One field, both tiers, because keyword search is an index and costs nothing.

**Free:** keyword search over typed entries across all time, each result openable. Beneath
the results, two plain sentences: reading across them is Pro, and *"31 recordings aren't
searchable — Pro turns them into text."* No blur, no lock, no grey, no teaser.

**Pro:** the same field over everything including transcribed audio, plus seeded questions
drawn from the corpus, plus synthesis on every answer.

States: **empty** · **free, results** · **free, no matches** · **free, matches exist but the
recordings aren't searchable** (says so plainly, with the count) · **Pro, seeded** ·
**below the minimum entry count** · **offline**.

### An answer — `/ask/{id}` — Pro only

Question restated small → **the user's own words**, two to four dated excerpts, each openable
→ then the synthesis, one to three sentences, held to the confidence tiers (counts,
juxtapositions, questions — never a cause) → then *that's not right*, which visibly removes
the claim and leaves the excerpts, which were never a claim. If entries were held out of
memory, it says how many were not read.

States: **answered** · **synthesis dismissed as wrong** · **no matches** · **thinking**, which
is a plain line of text and never animated dots.

### You — `/you` and children

**`/you/plan` is now the most important screen in the product** — the only place Pro is ever
explained, to a user who has never seen it work. It leads with the backlog and the user's real
number: *"You have 4 hours 12 minutes of recordings. Pro reads all of it."* Then the price,
the fair-use ceilings stated plainly, the regional tier, and the hardship rate as something
you take rather than apply for. Feature bullets come last or not at all.

`/you/privacy` — plain sentences. `/you/visible` — lists what the model can read; **on free it
says "nothing," which is the most reassuring thing this screen will ever say.** `/you/data` —
import, export (markdown, JSON, and audio as files; one tap; no email gate; **works for guests
and after cancelling**), delete. `/you/trackers` — mood always on, up to three more, off by
default. `/you/notifications` — Pro only.

**Free ships with no notifications.** The brief's daily notification carries an opening line,
which is AI. Stripped of that it becomes a bare "time to write" nudge — closer to the pressure
mechanic the brief bans than anything else in the product.

### Panels and dialogs

Panels slide over, push a history entry, dismissed by Back: *keep this* (guest), mood edit,
install instructions, citation footnote, tracker quick-config, crisis resource.

**There is exactly one blocking dialog in the product, and it is the one that deletes
everything.**

---

## 2. Navigation model

**Home is where you record or write.** `/` is not a dashboard, not a feed, not a launcher, and
on neither tier is it a landing page.

**Four destinations**, one tap from anywhere: **Today · Timeline · Ask · You.** A compact
header row on mobile web, not a bottom bar — the bottom of Today belongs to the composer and
the mic, and stacking a nav bar under them inside a browser that has already taken 100px of
vertical space is how a mobile web app ends up with a 45%-tall content area.

`⌁` The cleanest native derivation in the document: the top row becomes a real `UITabBar`, the
header becomes a large title that collapses on scroll, and pushed pages get a navigation stack
with interactive swipe-back.

| Kind | What qualifies | Back does |
|---|---|---|
| **Destination** | The four | Returns to the previous destination |
| **Page** | A day, an item, an answer, a reflection, plan, settings children, account | Returns to what pushed it, at scroll position |
| **Panel** | Keep-this, mood edit, install, citation, crisis resource | Closes the panel, stays on the page |
| **Dialog** | Delete everything. Nothing else. | Cancels |
| **Inline state** | Offline marker, allowance notice, mood row, "not right" | Nothing — never touches history |

### The browser back button, explicitly

- **From `/talk`:** stops the capture and keeps the audio. Never discards. On free there is no
  transcript to recover from, so this rule is load-bearing.
- **From a panel:** closes the panel only.
- **From `/ask/{id}`:** returns to `/ask` with the question still in the field.
- **From an item reached by citation:** returns to the answer at its scroll position, not to
  `/ask`. Same route, different provenance, different back target.
- **From an item reached by Timeline:** returns to Timeline at its scroll position.
- **Mid-typing on Today:** Back leaves; the draft was persisted on every keystroke and is
  there on return. No "are you sure" — that dialog is a confession that you didn't save it.
- **Timeline zoom (list ↔ calendar):** does **not** push. A persisted view preference, not a
  place. Pressing back four times to escape a screen you zoomed around in is worse than losing
  the ability to undo a zoom.
- **After signup or upgrade completes:** `replaceState`, so Back never returns to a form for a
  thing that now exists.
- **`/` is the root.** Back from `/` exits. Correct and unavoidable.

Every page-kind route is bookmarkable, survives a cold load, and is **private and never
shareable** — no share affordance exists anywhere, and no route resolves for anyone but its
owner.

---

## 3. Five traced paths

### 3.1 First run — cold, logged out, no install

| # | Where | What happens |
|---|---|---|
| 1 | `/` cold | Three sentences: a private journal; write it or say it; Pro reads it back. Composer and mic both live. **Import third.** No sign-in wall, no badges, no scroll. |
| 2 | tap mic | Browser mic permission — which requires this user gesture, so the mic must be a first-class control and not buried. Guest session created locally. |
| 3 | `/talk` | They talk. Stop. The memo appears on `/` with its duration and a play control. One line: kept as audio; Pro turns it into text. Said once. |
| 4 | `/` settled | Mood row appears inline. One tap or ignore it. |
| 5 | `/` settled | **The keep-this moment**, and only now: an inline block at the end. "This is kept in this browser only — it'll go if you clear it or switch devices. *Keep it*." Not a modal, not on arrival. |
| 6 | `/new` | Email + code, or passkey. One field at a time. Guest audio uploads with the text. |
| 7 | `/` | **Nothing on screen changes** but the strip, replaced by one line: "Kept." Nothing re-rendered, nothing celebrated. |

**Nothing sells Pro during first run** beyond the one factual line on `/talk`.

**Guest lifetime is honestly capped**, and audio makes it worse — browser storage quotas bite
far sooner for audio than for text. Warn on quota, not only on the seven-day clock.

### 3.2 The conversion moment — a number, then a page

There is no demonstration. The entire funnel is: **a fact accumulates on Timeline, and one
page explains what to do about it.**

| # | Where | What happens |
|---|---|---|
| 1 | `/timeline` | The record's own total: **"148 entries · 31 recordings · 4h 12m not yet read."** Body text, same weight as the rest of the header. No badge, no colour, no countdown, no offer language. It has been there since recording one; it just grew. |
| 2 | tap | `/you/plan`. A real route — Back returns to Timeline at scroll position. |
| 3 | `/you/plan` | Leads with their number and what happens to it: every recording becomes text, searchable, readable. Then the price. Then, briefly, what else Pro does — conversation, reading across time, a weekly reflection — stated plainly and without demonstration, because there is none. |
| 4 | upgrade | **The whole backlog transcribes.** ~$1.20 one-time, most-recent-first, batched across the first billing period if the archive is large. A progress state, then the timeline fills in: every memo row that showed a duration now shows its opening line, and search reaches all of it. |
| 5 | first Pro session | **The demo happens here, after payment.** Once the backlog lands, the first thing Pro does unprompted is read across the newly-transcribed archive. This is the only demonstration in the product and it has to be the best screen in it. |

**Never mid-writing, never after a hard entry, never on open, never as an interstitial, never
a push.** The Timeline number is the whole of it, and Settings is the other route in.

### 3.3 Daily

**Free — two taps either way.** Open (0) → mic (1) → talk → stop (2). Or: open (0) → tap the
field (1; **not** autofocused — an unrequested keyboard on open is an ambush, and iOS blocks
it without a gesture anyway) → type → save (2). Mood optional (3).

**Pro — the same two taps**, and a reply follows.

No "new entry" button, no title field, no save step for audio, no confirmation. If a fourth
required tap appears in any of these paths, something has gone wrong.

### 3.4 Return after three silent weeks

The most important user in the product. They last wrote on 17 July; it is 9 August.

- `/` opens exactly as always. No interstitial, no re-onboarding, no "welcome back", no day
  count, no reset counter, no red.
- **On Pro:** the continuity line — *"Last time you were here you were waiting to hear about
  the flat."* Suppressed entirely if the last session was distressing.
- **On free:** no generated line, because no model runs. Instead a **verbatim echo** — the date
  of the last typed entry and its opening line, or, if the last item was a memo, its date and
  duration with a play control. A database read, costing nothing, and arguably more honest
  than a synthesis: it is exactly what they said, not an interpretation of it.
- Timeline shows the three weeks as **fewer marks** — not gaps, not misses, not red, with no
  language for them. The total, being monotonic, is unchanged and still true.
- Nothing anywhere says "it's been a while."

### 3.5 Ask my history

**Free:** `/ask` → type → dated excerpts of their own typed words, every one openable, across
all time. Beneath them, two plain sentences: reading across them is Pro, and *"31 recordings
aren't searchable — Pro turns them into text."* **Nothing is blurred, locked or greyed.**
Keyword matching against *"have I felt like this before"* returns visibly poor results, and
that poverty is the honest demonstration of what a search box is.

**Pro:** `/ask` with seeded questions from the real corpus → `/ask/{id}` → excerpts first,
synthesis second, *that's not right* on the synthesis → tap an excerpt → `/e/{id}#p3`,
scrolled to and highlighting that passage → Back returns to the answer at scroll position.

---

## 4. The five riskiest decisions

### 4.1 Voice memos are deliberately unreadable, and that is the conversion engine

**Rejected (a):** no voice on free — leaves free as a typing product and cuts the brief's
primary input mode out of the majority experience.
**Rejected (b):** a small free transcription allowance. Re-introduces a countdown-shaped
mechanic the product refuses everywhere else, and meters the most expensive line.

**Why this works:** recording and storing audio costs fractions of a cent; transcribing it
doesn't. Free gets the input mode the product was designed around, and what accumulates is a
body of the user's own voice they can play but cannot read, search or scan. Upgrading resolves
that in one action.

**Where it's weak:** the brief cut photo attachments for being "a content type nothing else in
the product can read," and this deliberately creates exactly that. A free user with 40 memos
has an archive that gets *less* useful as it grows — scrubbing four hours of audio to find one
thing is genuinely bad, and some people will read that as the product failing rather than as
an argument to pay. One line at the moment of recording is the only mitigation and I am not
certain it is enough.

### 4.2 The entire backlog transcribes on upgrade

**Rejected:** transcribe from the upgrade date forward. Simpler, free, and what most products
do.

**Why rejected:** the backlog *is* the purchase. Someone paying $9.99 because they have four
hours of unread voice, then discovering only future recordings get read, has been baited. At
~$1.20 one-time it is the cheapest possible way to make day one of Pro feel like the product
changing state.

**Where it's weak:** an unbounded liability at signup. Two years of recordings costs ~$14 to
back-transcribe on day one of a $9.99 subscription; cancel in month one and you are down. Cap
the immediate batch, transcribe most-recent-first, queue the rest across the first billing
period. There is also an unclosable abuse path — subscribe, transcribe, export, cancel —
because export is free forever by design. Bound it; you cannot close it.

### 4.3 Crisis on free is keyword matching with no model behind it

**Rejected:** a Haiku classifier on typed entries — ~$3/month per 10,000 users, and the rev 4
design. Cut because free must spend nothing.

**What replaces it:** a **conservative, curated phrase list** run without a model — zero cost —
matching only unambiguous statements, plus a **static, always-present resource** in Settings
and the composer overflow on both tiers. The card that appears is human-written, never
generated, appears only after an entry is complete, and carries *that isn't what this was*.

**Where it's weak, and this is the most serious thing in the document.** Three failures stack:

- **Voice memos are not covered at all.** A memo at 1am is precisely what someone in distress
  would make — lowest effort, highest emotional load — and nothing reads it.
- **A phrase list tuned for precision misses almost everything.** Distress rarely announces
  itself in matchable language. Tuned for recall instead, it fires on grief, venting and
  fiction, and the brief is explicit that each uncorrectable false positive costs real trust.
  There is no setting of this dial that is good.
- **An always-present link is a poster on a wall**, and the brief is explicit that a resource
  arriving at the right moment is a different object from one permanently available.

The brief calls the crisis path a non-negotiable — "never paywalled, in any tier or usage
state" — and this does not meet it. I cannot close the gap inside a zero-spend constraint.
**On-device transcription on the native passes closes it at zero marginal cost**, and I'd
treat that as a reason to get to stages 4–5 sooner rather than later. Until then this is a
known, accepted, documented shortfall against a stated non-negotiable, and it should be a
line in whatever risk register this project keeps.

### 4.4 Nobody experiences the AI before paying

**Rejected:** the one-time free read at 15 entries — $0.24, the rev 4 design. Cut because free
must spend nothing.

**Why the tier survives it:** the pitch is mechanical, not qualitative. "This turns your
recordings into text you can search" is a service people can accurately imagine and evaluate
before buying — unlike "our AI notices patterns," which is a claim that genuinely needs
demonstrating. Selling on transcription is the reason no demo is fatal.

**Where it's weak:** everything *after* transcription is bought sight-unseen. The conversation,
the memory, the weekly reflection — the actual product, and the actual reason someone would
stay past month one — are all delivered after payment. That means **churn concentrates in
month one** and the refund rate is a live risk. It also means the product is sold on its least
differentiated feature (transcription is a commodity) and retained on its most (memory), which
is the wrong way round commercially.

The mitigation is entirely in the first Pro session, and it is the reason §3.2 step 5 exists:
the backlog lands, and the product immediately reads across it unprompted. That single screen
is doing the job a free trial would have done, and it happens after the money. It has to be
extraordinary, and there is no second chance at it.

### 4.5 A day holds entries, memos, or a conversation — and the timeline renders them as one record

**The problem:** a user who writes and records on free for months and then upgrades has a
corpus of three object types, one of which changes shape retroactively when its transcript
arrives. The timeline must show them as one record without implying the free half is lesser;
retrieval must read across them without treating a conversation turn as more authoritative
than a transcribed memo; and a single day can straddle the upgrade.

**Rejected:** separate timelines and separate retrieval per type. Simpler to build, and it
makes upgrading feel like starting over — which destroys the one thing the free tier was for.

**Where it's weak:** these genuinely are different objects — one composed, one spoken, one
conversational with a reply attached. Flattening them into one row type and one retrieval unit
is a compromise and the seam will show somewhere. Better it shows in the visual design, where
I can control it, than in the retrieval, where I cannot.

### Also weak; watched, not decided

- **Free retention** is the biggest non-cost risk in the product. A plain journal with no
  notifications, no AI and nothing that improves with use has no mechanism to bring anyone back
  on day 7. Import is the only real fix and it only helps people who arrive with something.
- **Storage on dormant accounts** — the one cost that grows forever and generates no possibility
  of revenue. The brief says audio is kept, so the policy can't be deletion; cold-tier it.
- **Mood capture rate.** Offered at the end, never required. The timeline is built on it, and at
  20% capture the derived layer stops being worth deriving.
- **The seven-day guest ceiling**, made worse by audio, which hits browser storage quotas long
  before the clock runs out.

---

## 5. Validation pass

**Does opening the app put the user one action from talking?**
Yes, on both tiers — the biggest thing this revision keeps. Free can talk from the first
screen; what it can't do is have the talking read. The only friction is the browser's mic
permission on first use, which requires a gesture and can't be pre-cleared.

**Does anything create pressure, judgement, or a sense of falling behind?**
No mechanism does: no streak, no chain, no percentage, no resettable counter, no red, no
absence language, one monotonic total, no notifications on free. Two residual weights. The
day-document is structurally close to a slot to fill and stays safe only because empty days
are never rendered. And the unread-duration clause on Timeline is, by design, a small permanent
tug — that tug is the business model, and the discipline is that it must never be coloured,
counted down, badged, or styled as urgency. It is a number about their life, stated flatly,
that happens to be tappable.

**Is the memory feature reachable and legible, or buried?**
Reachable on both tiers — one of four destinations, one tap from anywhere, and on free a
working search rather than a locked door. **Legible: no, not on free, and there is no longer
any screen that makes it so.** A free user's Ask is a keyword box over their typed entries, and
`/you/plan` describes memory in words to someone who has never seen it. This is the cost of
zero spend and it is the honest answer.

**Does the flow work on day 1, day 7, and month 6?**
Day 1: the mic is a first-class control, the composer carries a written prompt rather than a
blank box, and an importer skips straight to a corpus. Day 7: nothing has happened and free has
no way to make anything happen — the weakest week in the product and the one most likely to
lose people. Month 6: the recordings have accumulated into a real argument, and the user either
converted or is using a decent free journal with a growing pile of audio they can't read.

**Where does the crisis path enter, and does it interrupt writing?**
On typed entries it enters after the entry is complete, keyword-triggered — never
mid-composition, never blocking the composer, never on open, never as a push, never in the
timeline, never paywalled at any tier including guest, and always correctable. **On voice memos
it does not enter at all, and the typed path is now a phrase list rather than a classifier.**
This is a documented shortfall against a stated non-negotiable — §4.3 — not a solved problem.

**Can a user leave without a fight?**
Yes. Export is one tap at `/you/data`: markdown, JSON, and audio as files, no email gate,
available to a guest with no account, to a free user, to a Pro user, and after cancelling —
including every transcript Pro generated. Delete is on the same screen, offers export in the
same view, is the one blocking dialog in the product, tells you exactly what goes, and is a hard
delete. Downgrading removes, hides or locks nothing; a cancelled Pro user keeps every transcript
already made.

**Does the browser back button do the obvious thing everywhere?**
Rules are in §2. The four that matter: out of a sheet closes the sheet only; out of `/talk`
stops and keeps, never discards — load-bearing on free, where there's no transcript to recover
from; out of an item reached by citation returns to the answer at scroll position rather than to
the search field; and mid-writing Back leaves without a confirmation dialog because the draft was
persisted on every keystroke. The one judgement call against the obvious: Timeline zoom does not
push.

**Is the web product complete on its own?**
Pro on the web is complete — writing, talking, transcription, history, Ask, reflections, mood,
trackers, search, import, export, delete, plan, privacy, account, device restore, offline
drafting, add-to-home-screen, nothing withheld to push an install. **Free is not a complete
product and the design must not imply it is.** It is a good private journal you can talk into,
and a place to build a record worth reading. The logged-out root should say roughly that.
Standing asterisk: on iOS, web push needs the site added to the home screen, so an uninstalled
Pro user can't receive the two notifications — a delivery-channel limit the browser imposes,
stated plainly on `/you/notifications`.

---

**Stopping here.** No screens, no HTML, no visual direction until this is approved or revised.


## September 2026 account and state extension

See [AUTH-HANDOVER.md](AUTH-HANDOVER.md) for the added login, registration, recovery and state routes, canonical files, assumptions and verification. The user requested You in every web navbar to open login. This extends the established design and supersedes the earlier direct-to-account prototype route. All three web prototypes now have 52 screens; each platform adds numbered files 13 through 16. Account forms compose the existing field, button, sheet and notice components. No new palette, dialog or motion. New sample copy is recorded verbatim in those four numbered files on each platform; these copies must agree. The original native-stage scope remains unchanged.


### Follow-up: background account progress

Login and registration now open account settings immediately. Keeping the journal is an inline text bar with native progress below navigation, carried across all 35 signed-in prototype views on each web platform. Signed-in You opens settings. Prior full-page pending hash targets now show settings as well. The existing progress component is also permitted for this account task. The 60% value is a review fixture; real progress and completion must come from the background operation. See AUTH-HANDOVER.md for updated routes and static limitations. This supersedes the earlier pending-screen flow.
