# Product Brief v2 — a journal you can talk to

> **Current scope:** [V3-REVISION.md](V3-REVISION.md) supersedes the older guest, tier, offline, account and route decisions below. Historical reasoning and the locked visual, accessibility and motion rules remain useful.


*Revised from the original brief after review. The changes are substantive: the product is
now conversational at its core, the tracking surface is much smaller, and several features
from v1 have been cut for specific reasons recorded below.*

---

## What it is

A private space to talk about your day — out loud or in writing — with something that
listens, remembers, and occasionally offers a second perspective.

Everything you say is kept. Over time it becomes a record of what you went through, and
the thing you're talking to is the only listener that has read all of it.

## Who it's for

People who don't have someone to talk to about their daily life. Not people in crisis, not
people seeking treatment — people whose days go unwitnessed. The product's job is to be
easy to open, calm to be in, and worth coming back to.

This means the bar is **approachability before capability.** It does not need to be smart.
It needs to feel safe to open at 1am.

## The one thing that makes it different

Conversation is the interface. **Memory is the moat.**

A general assistant can hold a good conversation. It cannot say *"you said something
similar in March, and it sounded different then."* That single move — grounded, specific,
drawn from the user's own record — is what separates this from a chat window, and it is the
only thing here that gets stronger the longer someone stays.

Every design decision should be checked against this: does it make the memory more
valuable, or is it decoration?

## The primary loop

**Talk → it's kept → it's remembered → you notice something.**

Critically: **the conversation is the journal.** There is no separate "now write an entry"
step. The user does one thing — talk about their day — and the record, the mood history,
the timeline and the weekly reflection are all derived from that. Removing the second step
is the main reason this can succeed where journaling apps fail.

A plain writing mode exists for days when someone would rather type into silence, but
talking is the default path.

---

## What the AI is, and isn't

This is a behavioural contract, not a tone guideline. It governs every AI surface.

**It is:** a listener that remembers. It reflects, asks, and occasionally notices.

**It is not:** a therapist, a coach, or an advisor. It does not diagnose. It does not tell
the user what to do about a life it sees one slice of.

| Instead of | It does |
|---|---|
| Advice | Asks the question the user hadn't asked themselves |
| A verdict on a pattern | An observation the user is invited to interpret |
| Enthusiasm | A calm, unexcited register |
| "I'm here for you" | Simply being there |

**Register:** unexcited. No exclamation marks, no "that's so interesting", no performed
warmth. Calm is what makes something feel safe to talk to; enthusiasm makes it feel like a
product.

**On improvement.** The original brief asked for suggestions on "where they need to
improve." Unsolicited critique aimed at someone with no one else to talk to is the fastest
way to lose them. Improvement surfaces **only on request**, or as a neutral observation the
user draws their own conclusion from. Keep the noticing; drop the prescribing.

**Confidence tiers.** Any statement the AI makes about the user's history falls into one of
three kinds, and it may not exceed them:

1. **Counts** — "you've mentioned work in 7 of 12 entries this month." Always true.
2. **Juxtapositions** — "your quietest days this month were Sundays." Descriptive only.
3. **Questions** — "sleep comes up most on the harder days. Worth paying attention to?"

Never a causal claim. Never a number that implies precision it doesn't have. Below a
minimum entry count, no pattern language at all — and say so plainly: *"a few more and I
can start looking at your month."*

**Being wrong.** Every observation carries a lightweight way to say *that's not right*,
which visibly removes the claim. Without this, trust degrades silently and you never
find out.

---

## Scope — v1

### Talk
- Voice as the primary input, transcribed immediately. Audio is kept; the text is the
  record, so it feeds search and memory.
- Text conversation as an equal alternative.
- A plain, silent writing mode.
- Never an empty box on open — the blank-page problem applies to chat too.

### Remember
- Ask questions of your own history, answered from real past entries, **with those entries
  cited and openable.**
- Answers lead with the user's own words; the AI's synthesis comes second.
- Full-text search.
- **Import** — Day One, Apple Notes, plain text, a folder of files. See *Cold start*.

### Track
- Mood: one tap, five states, no numeric scale. Numbers invite false precision about a
  feeling.
- Up to **three** further trackers, opt-in, user-chosen, changeable.
- Tracking lives inside the conversation flow. Never a separate logging screen.

### Look back
- **One** timeline. Calendar is a zoom level of it, not a second screen.
- A weekly reflection — the only thing the AI initiates, on a cadence the user consented
  to, so it is never a surprise.

### Settings
- Privacy, in plain sentences (below).
- Export: markdown and JSON, one tap, no email gate.
- Notification control.

### Notifications — two, total
One daily at a user-chosen time, carrying an opening line so tapping it lands you
mid-thought rather than on a blank page. One weekly reflection. Both disable-able without
guilt copy.

---

## Cut from v1, and why

| Cut | Reason |
|---|---|
| **Streaks** | The highest-pressure mechanic in consumer software. Someone returning after three silent weeks is the most important user in this product; a broken chain tells them they failed. Replaced by marks on a calendar and a total that only rises — **no metric that can go down.** |
| **Correlations** | Statistically meaningless on 30 days of self-reported data, and actively harmful when someone acts on it. Replaced by the three confidence tiers. |
| **Per-entry AI summaries** | Summarising a paragraph the user just wrote is an AI feature that exists to look like AI. |
| **AI tag suggestions** | Builds a taxonomy nobody asked for. Search and memory make it redundant. |
| **Full habit tracking** | Sleep + exercise + nicotine + caffeine + work + custom is a second product. Every tracked variable is a daily tax. |
| **Separate timeline and calendar** | The same object at two zoom levels. |
| **Photo attachments** | A content type nothing else in the product can read. Voice does more for less. |
| **Markdown** | Journal writing is prose. |
| **Two of the four notification types** | Four streams is how you get notifications disabled in week one and uninstalled in week two. |

---

## Non-negotiables

### Crisis
This product is explicitly for people without a support network. It will encounter distress
regularly, and the AI is *in* the conversation when it happens.

- It does not counsel and does not panic.
- It **does not stop sounding like the thing the person was talking to.** A warm
  conversation that abruptly becomes a legal notice with a hotline number is abandonment at
  the exact moment it matters most.
- It stays present, stays in voice, and surfaces a resource without ending the conversation.
- This never fires as a push notification. Ever.
- There is a way to say *that isn't what you thought* — false positives on grief, venting
  and fiction are guaranteed, and each uncorrectable one costs real trust.

### Dependency
A product for lonely people has to decide whether it relieves the pressure to build human
connection or bridges toward it. Replika is the case study, and that outcome was a design
decision.

Three lines that don't move:
- It acknowledges and encourages the user's real relationships whenever they come up.
- It never positions itself as sufficient.
- **It never simulates needing the user.** No "I missed you." No sadness when they leave.

### Privacy
"Private" plus "sent to an LLM" is a contradiction users will notice. Specificity is the
feature; a padlock icon is not.

- A readable page in plain sentences: what leaves the device, who processes it, no training
  on user data, retention window, hard delete.
- Per-entry AI opt-out, visible in the composer — and a visible mark on excluded entries so
  users can *see* their private ones staying private.
- A screen that literally lists what the AI can see.

---

## Cold start

The product is empty on day one and the memory — its whole differentiator — is worthless
for two months. This is the retention battle.

- **Import is the highest-leverage feature in the brief.** It makes memory work on day one
  and converts users off competitors.
- Onboarding produces a first conversation, not a tour. Two or three short questions; the
  user leaves with something in the app.
- An explicit capability ladder, shown honestly: a few conversations in, it can reflect a
  little; a week in, the first weekly reflection; a month in, the memory is genuinely good.
  Framed as *it's learning you* — which is true — never as compliance.
- Design the **empty** and **not-enough-data** states before the populated ones.

---

## Design direction

**Peaceful and approachable, above premium or minimal.** If a decision makes it more
impressive but less easy to open, it loses.

Paper, not glass. Warm off-white ground rather than pure white; hierarchy from hairline
rules, tone and generous leading rather than borders and shadow. Editorial typography — a
real display face at genuine scale against a quiet sans UI, body text at a comfortable
measure. Colour rationed to state and data, never decoration.

**Avoid:** frosted-gradient wellness aesthetics, 3D emoji, meditation-app softness,
clinical healthcare UI, cluttered dashboards, anything that reads as an AI product.

Reference direction lives in `InspirationLibrary/`. Primary:
`bold-editorial-mood-journal-with-highlighter-acc` and
`quiet-paper-toned-note-journal-with-photo-stacks`. Mobile furniture:
`warm-cream-audio-journaling-app-screens`. Explicitly excluded:
`frosted-pastel-journal-with-3d-mood-props`, `high-haven-purple-gradient-property-landing`.

## Platforms

Mobile is the product, but **web ships before native.** Design order:
mobile web → tablet web → desktop web → mobile app → tablet app.

Mobile opens directly into the conversation, with one quiet line of the current reflection
glanceable from that screen. Desktop earns its place through depth — longer history, better
search, the reading experience for going back through a year. The native apps come last and
must feel genuinely native, not like the web build in a shell.

## Money

AI costs money to run, so there is a paid tier. The line is drawn to match the product's
own thesis rather than to hold features hostage.

**Free gets the present. Pro gets the past.**

| | |
|---|---|
| **Guest** | No account. First visit opens a temporary session held in the browser. Everything written carries over intact when they sign up. Say plainly that it's temporary and warn before it's lost. |
| **Free** | Unlimited writing and talking. Mood, timeline, search, export. Conversation about what you wrote today. A modest monthly voice allowance. A complete product on its own. |
| **Pro** | Memory across time — Ask your history, weekly reflections, patterns, recall of anything older than the free window. Unlimited voice. |

This cut works because cost tracks it (long-context retrieval over a large corpus is the
expensive call, a single-session conversation is not) and because **value grows with
tenure**: the longer someone stays on free, the more history there is for Pro to reach into.
Free users are building their own reason to upgrade.

**Offer the Pro trial around day 30, not on signup.** A new account has no history, so memory
has nothing to impress with. Offer it when the corpus is finally big enough to land.

### Rules the paywall obeys

- **Never mid-conversation.** Never immediately after someone has said something painful.
  Never as an interstitial on open. For this audience a wall that appears right after
  emotional disclosure is cruel and will be remembered that way.
- It lives in Settings, on the Ask screen when a question reaches past the free window, and
  at natural boundaries between sessions.
- **The crisis path is never paywalled**, in any tier or usage state.
- **Export is free forever, including after cancelling.** Downgrading never deletes, locks
  or hides an entry. Holding someone's journal hostage destroys the exact thing being sold.
- Price at the low end of the category, with regional pricing and a no-questions hardship
  rate. For a product about people who are struggling, that is consistency, not charity.

## What success looks like

Measure these, not DAU:

- **Return rate after a 7+ day gap.** The defining metric for a product that refuses to
  punish absence.
- Conversations per active user per week.
- Share of month-2 users who ask a question of their own history — the moat, actually
  being used.
- Import completion rate.

## Open questions

- Voice-first or text-first by default — needs real user input, not a guess.
- How far back the free window reaches — today only, this week, or this month. Wide enough
  to be useful, narrow enough that Pro is obvious.
- The exact price, and whether voice minutes or memory depth is the better metered axis.
- Whether any processing happens on-device in v1, or whether honest disclosure is enough.
- **The name.** "AI Therapy Journal" claims the one thing the product explicitly is not,
  and "therapy" is a regulated word in several markets. Worth changing before it sticks.
