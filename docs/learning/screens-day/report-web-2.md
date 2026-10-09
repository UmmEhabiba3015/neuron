# Screens Day, part 2 — Worker report, web: every remaining screen of the prototype

**Date:** 2026-10-09. Prompt: `docs/workers/screens-day-web-screens-2.md`.
Built on part 1 (`report-web.md`), which is in the working tree and not
committed. Binding: `docs/requirements.md`.

---

## Read this first

- **All nine checks pass**, as one chain, after the work and again after the
  mutation was undone. See *Checks*.
- **The mutation was caught** by two named tests, and by nothing else. See
  *Mutation*.
- **Every new unbuilt control was pressed in a real browser** against a real
  API. Each one showed "This is not built yet." and sent **no request** to
  the API. On Talk, the browser's microphone was asked for **0 times**; no
  file in the web app mentions the microphone at all. See *The walk*.
- **What already worked still works**, in the same walk: creating an
  account, writing, delete (still asks), mood, the Timeline, a past day,
  every part 1 screen and control, signing out and signing in.
- **Five controls have no day.** They are listed in their own table for the
  owner to place. See *Unscheduled*.
- **Seven choices are the owner's**, each a line or two to change. See
  *Choices for the owner*.
- **Reflection is not built.** Nothing in any main state of the prototype
  links to it, and its address needs a week that has a reflection. See
  *Screens not built*.

`apps/api`, `packages/contracts` and git were not touched (`git status`
shows nothing under either folder; `pnpm lint` runs the API's
`eslint --fix` and changed nothing). No dependency was added.
`app/styles/lock.css` is the designer's file byte for byte (`cmp` exits 0).
None of the designer's scripts was run, and his recorder script was not
copied. The owner's database was not used: its SHA-256 began `b8b8abb0`
before and after. My API ran on 3100 and my web app on 3101, with a
throwaway database in my scratch folder. Both are stopped.

---

## Objective

Build every screen in the designer's prototype that part 1 did not build, in
its main state, the way part 1 did: a control that does not work yet says
the one sentence and does nothing else, data that does not exist yet is
replaced by the same sentence, real data is shown, and links between screens
work.

## Implementation summary

- **Ask is a destination.** The four destinations are Today, Timeline, Ask
  and You, as the prototype draws them. **Ask** (`/ask`) has the query field
  and an Ask button.
- **Talk** (`/talk`), the voice memo page in its ready state. The
  composer's microphone leads to it. "Start recording" says the sentence.
- **Today's composer** has the microphone in Save's place while the field is
  empty, and under the field, "Keep this out of memory" and "More options".
- **Every entry** has the memory menu ("In memory") under its edit and
  delete icons, as `#entry-options` draws it, on Today and on a past day.
- **Composer options** (`/options`): Today's page with the designer's panel
  in the composer's place. Its one row leads to the support resource.
- **Support resource** (`/support`): its heading and the sentence. The
  designer's helpline text is not used.
- **You** gains "What is private": **What the model can see**
  (`/you/visible`) and **Privacy** (`/you/privacy`). Its date box,
  "Keeping", holds the sentence.
- **The list** (`lib/unbuilt.ts`) gains 13 controls. A control can now be
  `NOT_SCHEDULED`. The Day 36 test checks every scheduled control, and its
  failure message names every unscheduled one.

## Files

**New**

| File | What it is |
|---|---|
| `app/screens/Ask.tsx` | Ask |
| `app/screens/Talk.tsx` | Talk, the ready state |
| `app/screens/Support.tsx` | The support resource |
| `app/components/useTodayDate.ts` | Today's date from `GET /days/today`, for the date box of Ask and Talk |
| `app/ask/page.tsx`, `app/talk/page.tsx`, `app/options/page.tsx`, `app/support/page.tsx`, `app/you/privacy/page.tsx`, `app/you/visible/page.tsx` | Their addresses |
| `docs/learning/screens-day/report-web-2.md` | This report |

**Changed**

| File | Change |
|---|---|
| `lib/unbuilt.ts` | `NOT_SCHEDULED`; 13 new controls; `unscheduled()` |
| `lib/unbuilt.test.ts` | The Day 36 test checks scheduled controls only and names the unscheduled ones when it fails; one new test; the list of days grows |
| `app/components/Chrome.tsx` | Ask joins the destinations |
| `app/components/Journal.tsx` | `LiveEntry`: the memory menu. `LiveComposer`: the microphone, the composer's tools |
| `app/components/NotBuilt.tsx` | `NotBuiltInPlace` can draw a `span`, for a place inside a settings row |
| `app/screens/LiveToday.tsx` | `options`: the panel in the composer's place |
| `app/screens/You.tsx` | You's private rows and date box; `Privacy`; `WhatItSees` |

`live.css` was not changed. Every new screen is drawn by `lock.css` alone.

---

## The screens and their addresses

The prototype has 108 screens and states. This table lists every screen
with a main state of its own, and where it is now.

| Screen (prototype id) | Address | What is drawn | Unbuilt controls on it |
|---|---|---|---|
| Today (`today`) | `/` | Entries, mood, composer: as before. **New:** the microphone (to Talk) while the field is empty; "Keep this out of memory"; "More options"; each entry's memory menu | `editEntry`, `entryMemory`, `composerMemory` |
| Timeline (`timeline`) | `/timeline` | As Day 17c. Ask in the destinations | — |
| A day (`day`) | `/d/{date}` | As Day 17c. **New:** each entry's memory menu | `editEntry`, `entryMemory` |
| **Ask** (`ask`) | **`/ask`** | Date box (today, from the API), the field, Ask | `ask` |
| **Talk** (`talk`) | **`/talk`** | Date box (today, from the API), way back, "Voice memo", the clock at 0:00, the resting waveform, Start recording, Cancel | `startRecording` |
| You (`you`) | `/you` | **New:** "What is private" with two rows; the date box "Keeping" | `keepingSince` (in place) |
| **Privacy** (`settings-privacy`) | **`/you/privacy`** | Five rows and the support row. Three rows have the sentence in place of what they say | `whatLeaves`, `whoProcesses`, `training` (in place) |
| **What it sees** (`settings-visible`) | **`/you/visible`** | "It can read" and "It cannot read", each with the sentence | `modelCanRead`, `modelCannotRead` (in place) |
| Your data (`settings-data`) | `/you/data` | Part 1 | `exportEverything`, `deleteAccount` |
| Account (`account-devices`) | `/you/account` | Part 1 | `signedInDevices`, `signOutEverywhere` |
| Timezone (`timezone-choose`) | `/you/account/timezone` | Part 1 | `chooseTimezone` |
| **Composer options** (`composer-options`) | **`/options`** | Today's entries, and the panel: "Composer options", the support row, "Back to Today" | — |
| **Support resource** (`support-resource`) | **`/support`** | The heading and the sentence; "Back to options", "Back to settings" | `supportResource` (in place) |
| Entry options (`entry-options`) | none of its own | Its content, the memory menu beside edit and delete, is drawn on every entry row. As a page it is reached only from `entry-memory`, which is not a main state | `entryMemory` |
| Sign in, Create account (`auth-login`, `auth-register`) | `/in`, `/new` | Before Screens Day | — |
| Forgot password, Choose a new password (`auth-forgot`, `auth-reset`) | `/forgot`, `/reset` | Part 1 | `sendResetLink`, `saveNewPassword` |
| Not found (`not-found`) | any unknown address | Before Screens Day | — |

**The addresses.** `/ask`, `/talk`, `/you/privacy` and `/you/visible` are the
designer's (`00-flow.md`, Routes). `/options` and `/support` are mine: the
flow names no address for either. Each is one short word at the top level,
like `/timeline`. `/options` has its own address because `lock.css` G1 says
"a panel … pushes a history entry, Back closes it". The walk checked that
Back does.

### Screens not built

| Screen | Why |
|---|---|
| Reflection (`reflection`) | **Nothing links to it** in the main state of any screen: only the designer's index does. Its address, `/reflection/2026-w32`, names a week that has a reflection, and none exists. Day 28 makes reflections; the way to reach one is that day's |
| An answer (`ask-answer`, `ask-answer-source`) | `/ask/{id}` needs an answered question |
| A recording's options (`recording-options`) | Needs a recording |
| A draft (`draft`) | A draft is data; Day 18 |
| The designer's index (`start`) | A review page, not a screen of the product |

Every other id is a state of a screen above (loading, failed, empty,
permission, confirm, saved, deleted, a recording or a note on the page), and
arrives on the day its feature is wired. Some are already built:
`empty-today`, `entry-delete-confirm`, `entry-delete-failed`,
`save-failed`, `mood-failed`, `today-loading`, `day-fetch-failed`,
`not-found`, `today-without-note` and `day-without-note` (Today and a day
have no notes).

---

## The unbuilt controls, both parts

| Name in the list | On screen | Screen | What a press does today | Day |
|---|---|---|---|---|
| `editEntry` | Edit entry (icon) | Today, a past day | The sentence, in the entry's row | 18 |
| `sendResetLink` | Send reset link | Forgot password | The sentence, under the button | 20 |
| `saveNewPassword` | Save new password | Choose a new password | The sentence, under the button | 20 |
| `whatLeaves` | What leaves this device | Privacy | Not a control: the sentence stands in place of its explanation | 22 |
| `whoProcesses` | Who processes it | Privacy | Not a control: the same | 22 |
| `modelCanRead` | It can read | What it sees | Not a control: the sentence under the heading | 22 |
| `modelCannotRead` | It cannot read | What it sees | Not a control: the same | 22 |
| `ask` | Ask (and Enter in the field) | Ask | The sentence, under the field. What was typed stays | 25 |
| `signedInDevices` | Signed-in devices | Account | Not a control: the sentence in place of the rows | 34 |
| `signOutEverywhere` | Sign out everywhere | Account | The sentence, above the buttons | 34 |
| `chooseTimezone` | Timezone | Timezone | Not a control: the sentence in place of the list | 34 |
| `exportEverything` | Export everything | Your data | The sentence, under the row | 34 |
| `deleteAccount` | Delete account | Your data | The sentence, under the row | 34 |
| `keepingSince` | Keeping | You | Not a control: the sentence in the date box | 34 |
| `training` | Training | Privacy | Not a control: the sentence in place of its explanation | **not scheduled** |
| `startRecording` | Start recording | Talk | The sentence, where the comp says what the microphone did | **not scheduled** |
| `entryMemory` | Use in memory | Today, a past day | The menu opens (plain HTML). The option gives the sentence, in the entry's row | **not scheduled** |
| `composerMemory` | Keep this out of memory | Today, under the composer | The sentence, where the composer's messages go | **not scheduled** |
| `supportResource` | If you want to talk to someone | Support resource | Not a control: the sentence in place of the page's words | **not scheduled** |

**Why each new day.** 22: the first day entries are sent to a model
(embeddings), so the first day that what leaves, who processes it, and what
the model can read have answers. 25: the prompt's example for Ask. 34: the
timezone setting, which puts the timezone on the account the screen can read.

### Unscheduled

The owner gives each one a day.

| Control | Feature | Source |
|---|---|---|
| `startRecording` | Voice memos | requirements 3.6.1 and 8.1 |
| `entryMemory` | "Keep this out of memory", on an entry | requirements 3.3.7 and 8.2: must exist before Day 22 |
| `composerMemory` | "Keep this out of memory", on what is being written | the same |
| `supportResource` | The support resource's words | requirements 3.9.2 |
| `training` | What Privacy says about training | **Not in the requirements at all.** A decision, then words |

The test **the controls with no day are the ones the owner has not placed**
lists these five. When one is given a day, the test and the list change
together.

---

## Every sentence the owner has not seen

**Mine.**

| Sentence | Where | Note |
|---|---|---|
| "Ask your journal" | Ask: the field's placeholder, and its name for a screen reader | The comp's field holds a query and has no prompt |
| "Ask" | Ask: the button | The comp draws no button. See *Choices* |
| "Start when you are ready." | Talk, under "Voice memo" | The first half of his sentence. The second half, "Stop and keep returns to today.", is dropped: it describes a recording that cannot be made |
| "Ask · Journal", "Voice memo · Journal", "Composer options · Journal", "If you want to talk to someone · Journal", "Privacy · Journal", "What it sees · Journal" | Browser tab titles | |

**The owner's.** "This is not built yet."

**The designer's, word for word.** "Ask", "Voice memo", "No recording has
started.", "0:00", "Time recorded", "Start", "Not started", "Nothing is
being recorded yet.", "Start recording", "Cancel", "← Today", "Record" (the
microphone, for a screen reader), "Keep this out of memory", "More options",
"In memory", "Use in memory", "Entry memory settings: in memory", "Composer
options", "If you want to talk to someone", "A support resource is available
whenever you need it.", "Read", "Back to Today", "Back to options", "Back to
settings", "Keeping", "What is private", "What the model can see", "The
entries, transcripts and moods it may read, and what stays out of memory.",
"Review", "Privacy", "What is sent, who processes it, and how long it is
kept.", "Read it", "What leaves this device", "Who processes it",
"Training", "How long it is kept", "A deleted item leaves the product at
once and stays hidden in storage until you delete your account. Deleting
your account removes everything permanently.", "Who else can read it",
"Nobody. There is no sharing anywhere in this product and no link that works
for anyone but you.", "Support resource", "If you want to talk to someone,
this is always available.", "What it sees", "It can read", "It cannot read".

The two Privacy sentences that are kept were checked against the
requirements; see *Conflicts*.

---

## Choices for the owner

Each is a line or two to change.

| Choice | What I built | The other option |
|---|---|---|
| **Ask's day** | 25, the prompt's example | The same field searches, and search by keyword is **already built in the API** (requirements 3.7.1) and is replaced on Day 21. Ask could be Day 21, or search could be wired sooner |
| **"Keeping since" is data that exists** | The sentence in the box, as the prompt says. `WireUser` has `createdAt`; the month it falls in depends on the timezone, which `WireUser` does not carry until Day 34 | Show the month now, in the browser's timezone. It would be wrong only for an account made on the first or last day of a month |
| **An entry's menu says "In memory"** | "In memory", and its option is pressed: an entry not kept out is in memory, by requirements 3.3.7 | Since no model reads anything yet, say nothing about memory until the feature is built: a neutral word such as "Memory", and the option not pressed |
| **Ask has a button** | A button, drawn as the composer's Save is, so a person with no keyboard can send | The comp: a field only, sent with Enter |
| **Composer options draws Today's real entries** | Today's entries with their controls, behind the panel. Pressing them works | The comp draws the entry bare. That needs a read-only version of the day's rows |
| **Words typed before "More options" are lost** | Lost, as they are when a person leaves Today by any link today | Keeping them is a draft, which is Day 18's |
| **Privacy has three undecided rows** | The rows' names, with the sentence. "Training" has no day | Leave the three rows out until they are decided |

---

## Decisions and assumptions

- **The microphone is a link**, not a button: it goes to another page. It
  is drawn in Save's place while the field is empty, as the prototype's
  script swaps them; Save still appears as soon as the field holds words.
- **The memory menu opens.** It is the designer's `<details>`, so opening it
  is the browser's own and sends nothing. Only the option inside is unbuilt.
- **One sentence per entry row.** Edit and the memory option share it. A
  second press of either changes nothing.
- **Talk keeps two empty places**, where the comp has "Ready" and the time,
  so that the clock stays where the comp puts it. Today's date box is kept
  empty for the same reason until its date arrives.
- **The date on Ask and Talk** comes from `GET /days/today`, once, when the
  page opens. Until it answers the box is empty. If it fails, the box stays
  empty: these screens' failed states are drawn on their feature's day.
- **What it sees** is two headings and two sentences. Its rows are counts,
  and which things a model may read is a rule decided with Day 22 and
  "keep this out of memory".
- **The support resource** has the composer's options as its first way back
  and Privacy as its second, as the comp does. Today is marked as the
  current destination, as the comp draws it.
- **Composer options** uses the comp's plain sheet and the "Journal / Your
  journal" date box, as `#composer-options` draws them.

## Limitations

- **The React rule is still not tested**: that a press shows the sentence
  and sends nothing. As in part 1, only the walk below counts requests. It
  belongs on the Day 19 list of things a browser test would hold.
- **No test covers the new links**: the microphone to Talk, "More options",
  Ask in the destinations, the You rows. The walk followed each one.
- **Ask and Talk ask for today's date with no way to try again.**
- **Chromium only.** Hover was not measured: on a desktop with a mouse,
  `lock.css` shows an entry's tools and its memory menu only on hover or
  focus.

---

## Conflicts between the designs and the requirements

| In the design | In `docs/requirements.md` | What I did |
|---|---|---|
| Privacy: "sent only when you use a model feature" | 3.8.1: the weekly reflection runs on a schedule, without the person asking | The sentence in place |
| Privacy: "Anthropic processes the material …" | 6.6: the AI provider is not chosen | The sentence in place |
| Privacy: "Your writing is never used to train anything" | Nothing | The sentence in place; not scheduled |
| Privacy: "A deleted item … stays hidden in storage until you delete your account. Deleting your account removes everything permanently." | 3.3.3: soft delete, kept until the account is deleted. 3.1.10: a hard delete | **Agrees.** Kept |
| Privacy: "Nobody. There is no sharing …" | 2: no shared journals. 4.2: another person's journal is "not found" | **Agrees.** Kept |
| Privacy: "Last changed 2 March 2026" | No privacy text has been written | Not drawn |
| What it sees: counts, and "changing it applies to everything already written" | Nothing counts; the rule is not decided | Not drawn |
| The support resource: a UK and Ireland helpline | 3.9.2: the owner writes this page | Heading and the sentence |
| Ask: "Recordings without transcripts do not appear in search results." | 3.6.3: transcription; nothing about search | Not drawn |
| Talk: "Stop and keep returns to today." | Voice memos are not scheduled | Not drawn |
| `docs/roadmap.md`, "Where the design's features land": voice memos on Days 18–19 | 8.1: voice memos have no day | Followed the requirements and the prompt: not scheduled. **The roadmap's table should be corrected** |

---

## Tests

`lib/unbuilt.test.ts`, six tests, no React:

1. the sentence is the one the owner chose;
2. **every scheduled unbuilt control is wired before a real person tests the
   product** (changed). An unscheduled control is skipped, and every failure
   message ends "Not scheduled yet: training, startRecording, entryMemory,
   composerMemory, supportResource." I checked this by making Ask's day 40
   for one run: *ask is wired on day 40. Not scheduled yet: training,
   startRecording, entryMemory, composerMemory, supportResource.*;
3. **the controls with no day are the ones the owner has not placed**
   (new);
4. every unbuilt control has a name on screen and a screen it is on;
5. no two unbuilt controls on one screen share a name;
6. the list is the one the owner decided, each on its day (13 more entries).

The type still guards the list: `day` is required, and is a number or
`NOT_SCHEDULED` and nothing else, so `day: 'soon'` is a type error.

## Checks

Run from the repository root, as one chain, exit 0, after the work; and
again, exit 0, after the mutation was undone.

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm build` | clean |
| `pnpm test` | contracts 7 of 7; API 16 suites, 246 of 246 |
| `pnpm test:e2e` | 25 suites, 365 of 365 |
| `pnpm lint:web` | clean |
| `pnpm typecheck:web` | clean |
| `pnpm build:web` | clean. Lists `/ask`, `/options`, `/support`, `/talk`, `/you/privacy`, `/you/visible` |
| `pnpm test:web` | contracts 7 of 7; web **160 of 160** (159 before, and the new one) |

## Mutation

**The line**: `day: NOT_SCHEDULED,` in the `entryMemory` entry of
`lib/unbuilt.ts`, changed to `day: 22,`. Giving a feature with no day an
invented one is exactly what the prompt forbids, and this part made that
line load-bearing. All nine checks were run one by one.

| Check | Result |
|---|---|
| `pnpm lint`, `typecheck`, `build`, `test`, `test:e2e` | pass (they do not read the web app) |
| `pnpm lint:web`, `typecheck:web`, `build:web` | **pass.** 22 is a valid day to the type |
| `pnpm test:web` | **fails**: 158 of 160. *the controls with no day are the ones the owner has not placed* (`'entryMemory'` missing from the list) and *the list is the one the owner decided, each on its day* (`entryMemory: 22` against `'not scheduled'`) |

The line was put back, and all nine were run again: the table above.

---

## The walk

Headless Chromium at 1440, against the real API and the built web app.
"API requests" counts the requests the page had sent to the API just before
and just after the press. On Talk, the browser's `getUserMedia` (how a page
asks for the microphone) was replaced with a counter before the press.

| Step | Result |
|---|---|
| Create an account; write two entries | On `/`, 2 entries |
| An entry's tools, in order | Edit entry, Delete entry |
| Today: press Edit entry | Sentence, in the row, `role="status"`. Requests 11 → 11 |
| Today: Delete entry | Still asks. Focus on "Keep entry" |
| Today: press Good | Pressed |
| Composer, empty field | The microphone: a link to `/talk`, named "Record". No Save |
| Composer, with words | Save drawn; no microphone |
| Composer tools, in order | Keep this out of memory, More options |
| Press Keep this out of memory | Sentence. Requests 12 → 12. Still `aria-pressed=false` |
| Open the second entry's memory menu | Open. Says "In memory" |
| Press Use in memory | Sentence, in that row. Requests 12 → 12 |
| Press Edit on the same row | Still one sentence in the row |
| More options | `/options`: Composer options / If you want to talk to someone / … / Read / Back to Today. 2 entries behind; no composer |
| The support row | `/support`: If you want to talk to someone / This is not built yet. / Back to options / Back to settings |
| Back to options; then the browser's Back, twice | `/options`; then `/support`, then `/options`: each Back closes one page |
| Back to Today | `/` |
| The microphone | `/talk`: ← Today / No recording has started. / Voice memo / Start when you are ready. / 0:00 / Time recorded / Start / Not started / Nothing is being recorded yet. / Start recording / Cancel |
| Talk: the date box | Today, Fri 9 Oct '26 (from the API) |
| Press Start recording | Sentence, inside `.microphone-feedback`, `role="status"`. Requests 21 → 21. **Microphone asked for 0 times** |
| Cancel; ← Today | Both go to `/` |
| Destinations | Today `/`, Timeline `/timeline`, Ask `/ask`, You `/you` |
| Ask | Current is Ask. Date box Fri 9 Oct '26 |
| Type "swans", press Ask | Sentence. Requests 27 → 27. The field still says "swans" |
| Enter in the field | Requests 27 → 27. Still one sentence |
| A past day (one entry moved to 6 August in the throwaway database) | 1 entry, no composer |
| Past day: press Use in memory | Sentence. Requests 4 → 4 |
| Past day: press Edit entry | Requests 4 → 4. No second sentence: the row already holds it |
| Timeline | October 2026 Fri 9 Written today. August 2026 Thu 6 This one goes to a past day. |
| You | What is private / What the model can see / Privacy / What is yours / Your data / Your account / Account |
| You: the date box | "Keeping" / "This is not built yet.", marked `keepingSince` |
| What the model can see | `/you/visible`: It can read / This is not built yet. / It cannot read / This is not built yet. Back goes to `/you` |
| Privacy | `/you/privacy`: the three undecided rows with the sentence, the two kept rows, Support resource |
| Support resource, then Back to settings | `/support`, then `/you/privacy` |
| Your data: Export everything, Delete account | Sentence each. Requests 3 → 3 |
| Account, Timezone, Leave as it is | As part 1 |
| Sign out everywhere | Sentence. Requests 3 → 3 |
| Sign out of this device | `/in` |
| Forgot your password?; Send reset link | `/forgot`; sentence, requests 4 → 4; the email kept |
| `/reset`: show password; Save new password | Field becomes `text`; sentence, requests 1 → 1 |
| Sign in with the old password | `/` with its entry |
| `/forgot` while signed in | Sent to `/` |

---

## Measured against the comps

As part 1: each comp and the running app in headless Chromium, 764 tall, at
390, 834 and 1440. Every visible element inside `.app` is recorded with its
position, size and 29 computed style values, and paired by class names and
place in the tree. "Same" means within 0.6px and all 29 values equal. The
comp is lifted out of its stage and given `live.css`, in the browser's
memory only. From Today's comp, the recording, the notes, "Recent overview"
and the "Private, out of memory" mark were removed in memory; the composer's
tools, the microphone and the memory menus are now measured.

Each cell is "elements the same, of elements paired".

| Screen | Comp | 390 | 834 | 1440 |
|---|---|---|---|---|
| Today, two entries | `01-today.html` | 52 of 61 | 50 of 61 | 51 of 60 |
| Ask | `04-ask.html` | 13 of 15 | 11 of 15 | 12 of 14 |
| Talk | `03-talk.html`, ready | 29 of 33 | 29 of 33 | 29 of 33 |
| You | `00-prototype` `#you` | 20 of 31 | 20 of 31 | 25 of 30 |
| Privacy | `00-prototype` `#settings-privacy` | 3 of 25 | 3 of 25 | 23 of 25 |
| What it sees | `00-prototype` `#settings-visible` | 4 of 8 | 4 of 8 | 4 of 8 |
| Composer options | `18` `#composer-options` | 21 of 26 | 21 of 26 | 20 of 25 |
| Support resource | `18` `#support-resource` | 14 of 20 | 14 of 20 | 13 of 19 |

Today went from part 1's 35 of 41 to 52 of 61 at 390: the composer's tools,
the microphone and the memory menus now pair with the comp's.

### Every difference I could not close, and why

| # | Difference | Where | Why |
|---|---|---|---|
| 1 | The date, and so the date box's width | Today, Ask, Talk | Data |
| 2 | The second entry's menu says "In memory", the comp's "Out of memory", in a lighter colour | Today | The comp's entry is kept out; ours are not. Data |
| 3 | The microphone's font and text alignment | Today | It is a link, and the comp's is a button. It holds no text, so nothing visible moves; its box is identical |
| 4 | The edit and delete icons' `text-align` | Today | Part 1's difference 5: buttons, not links. Nothing moves |
| 5 | The field is a textarea | Today | `live.css` 5.1 |
| 6 | The Ask button; the field is narrower by its width | Ask | The comp draws no button. See *Choices* |
| 7 | No results, count, note or "Since" line | Ask | No question has been answered |
| 8 | No "Ready" and no time; their places are kept, empty, so the clock does not move | Talk | Neither is true yet. The empty status is 8px tall, not 15.4px |
| 9 | The date box holds the sentence; no count on Your data; no foot line | You | No timezone on the account; nothing counts |
| 10 | The sentences in Your data's and Account's rows are mine, so their rows' heights differ, and at 390 and 834 everything below moves | You | Part 1's sentences |
| 11 | The three undecided rows are one line each, so at 390 and 834 every row below rises; no "Last changed" foot | Privacy | Undecided. At 1440 the column is wide enough that nothing moves |
| 12 | Two headings and two sentences, no rows, no note | What it sees | Counts, and an undecided rule |
| 13 | The entries behind the panel are Today's real rows, with their tools and the mood | Composer options | See *Choices*. **The panel itself is identical at all three widths** |
| 14 | One line of sentence instead of four lines of helpline; the buttons rise 66px | Support resource | The owner's words are not written |

**Not measured.** Hover. Firefox and Safari. A past day's page against
`06-conversation.html` (it draws the same entry row as Today, which is
measured, and it was walked). The measuring script is in my scratch folder,
not the repository.

---

## Concepts a learner may not know

- **`<details>` and `<summary>`**: HTML's own open-and-close box. The
  browser opens it on a press with no script, which is why opening the
  memory menu sends nothing.
- **A union of a number and one string** (`number | typeof NOT_SCHEDULED`):
  a value that is either a day or exactly the words "not scheduled", and
  nothing else.
- **`typeof` on a constant in a type**: the type of a `const` string is that
  string itself, so `typeof NOT_SCHEDULED` is the type `'not scheduled'`.
- **`role="search"`**: tells a screen reader that a form is the page's
  search.
- **`getUserMedia`**: how a web page asks the browser for the microphone or
  camera. Nothing in the app calls it.
- **A history entry**: each address the browser has been to in a tab. A
  panel with its own address can be closed with Back.
- **An effect's clean-up flag** (`let current = true` in `useTodayDate`): an
  answer that arrives after the person has left the page is ignored.
- **`requestSubmit()`**: sends a form the way pressing Enter does, which is
  how the walk tested Enter in the Ask field.
