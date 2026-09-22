# Journal — the design, and what is binding about it

**This is the design of record for an AI journalling product, handed over for build.**
It carries every decision that is settled, the handful that are still open, and the
reasoning behind anything a developer might otherwise reasonably undo.

**The session log is not in this folder.** Fourteen sessions of it lived in the working
copy and none of it is binding. What survives is the decisions, and they are here.

---

## 0. Read this first

**Three documents bind, in this order. Where they disagree, the earlier one wins.**

| | |
|---|---|
| `ai-journal-brief-v2.md` | **The source of truth.** The product, the audience, the non-negotiables. |
| `00-flow.md` | **Stage 0, Revision 5, approved.** Routes, navigation, five traced paths, the five riskiest decisions. Everything visual rests on it. |
| `direction-lock.md` + `lock.css` | **One deliverable in two files.** The prose is binding and the stylesheet is its implementation. Binding on every file, on all five platforms. |
| This file | The decisions around them: engagement rules, content rules, commercial model, what is still open. |
| `flow-review.md` | The Stage 3 flow walk. Six findings, five fixed, one watch-item. |

**`lock.css` is at revision 49.** The motion system merged into the base at that revision
and there are no temporary sections left in it.

---

## 0.1 What is in this folder

```
lock.css                        THE stylesheet. Every file links it. Revision 49.
direction-lock.md               The binding prose half of the same deliverable.
00-flow.md                      Stage 0. The application flow.
ai-journal-brief-v2.md          The brief.
flow-review.md                  The Stage 3 flow walk.
PROJECT.md                      This file.
CLAUDE.md                       How to work in this folder.

mobile-web/     390    12 screens + 00-prototype.html      THE BASE DESIGN
tablet-web/     834    12 screens + 00-prototype.html
desktop-web/    1440   12 screens + 00-prototype.html
mobile-app/     390x844 iOS      01-today.html only        1 of 12. Stage 5 is open.

journal-prototype.html          Self-contained share builds. GENERATED, never hand
journal-prototype-tablet.html   edited. Each is its platform's 00-prototype plus
journal-prototype-desktop.html  lock.css, inlined, for sending to someone.
```

**40 screens and 3 share builds.** Every screen links `../lock.css`. No file in this
folder makes a network request of any kind.

**The numbered screens are the design of record.** The prototypes are walkthroughs and
say so on themselves: where a prototype disagrees with a numbered screen, the numbered
screen wins.

---

## 0.2 The nine things a build is most likely to get wrong

Everything here is argued somewhere in `direction-lock.md`. This is the short list.

1. **The user's words are the highest-status content on every screen, and AI output is
   visually subordinate and distinguishable at a glance.** The distinction survives
   greyscale. It is not decoration; it is rule 1.
2. **No colour literal outside `lock.css`.** Eight roles, no ninth. This is what keeps the
   deferred dark mode a one-file change instead of a retrofit.
3. **The component inventory in `direction-lock.md` §6 is closed at thirty seven.**
   Anything not on it is a conversation before it is a file. Tabs, badges, avatars,
   tooltips, toasts, skeletons, spinners, carousels, shadows and gradients are all named
   as explicitly excluded so they cannot arrive by drift.
4. **Four things move and nothing else does.** `direction-lock.md` §7.7. Every duration is
   derived from its own object's distance against a stated speed. Changing one without its
   derivation turns a speed limit back into a set of numbers somebody typed.
5. **Six build obligations.** `direction-lock.md` §7.4. Each one is right in a static file
   and wrong in a running product, so no comp can show them to you.
6. **`.gline` and `.lblbox` look like wrappers and are load bearing.** `.gline` marks a
   printed line as the product speaking. Ask's restated question sits in the same slot
   without it and therefore does not type. Deleting it makes the product type the user's
   own words.
7. **There is no disabled state anywhere in this product.** If something cannot be done
   yet, the screen says so in a sentence.
8. **The crisis path is never paywalled and never animated**, in any tier or usage state.
9. **Two engine behaviours are Chromium only, by design.** The composer's scroll tuck and
   the note's height growth. Neither has a fallback and neither is a bug: where the
   capability is missing the screen is complete rather than approximated.

---

## 0.3 Accessibility floor, binding on every file

Body text 4.5:1 against its ground, large text 3:1, **44px minimum tap targets**, no
information carried by colour alone, and layouts that survive text at 200%. Expressive is
not a contrast waiver.

**Two relationships a contrast table cannot see, and both are checked by desaturating a
screenshot rather than by a tool.** The product's voice sits **1.790:1** against the user's
ink, and the recording's band sits **1.834:1** against the sheet at a relative luminance of
**0.482**. Both are relationships between two inks rather than between an ink and its
ground. Measured on every platform: 1.7898, 1.8339, 0.4822.

**Three documented exceptions, and there are no others.**

- `.total a`, Timeline's unread clause, at **116.69 x 17**, and its day-seven twin in the
  states pack at **114.25 x 17**. A link inside a body sentence, covered by the inline
  exception. It cannot be enlarged without making the number a badge, which the flow
  forbids. `direction-lock.md` §6.
- The three prototypes' **21 index chips at 24px**. Walkthrough furniture in each file's
  own `<style>` block; not part of any screen and not shipped.
- **Two 200%-type overflows on tablet**, both inherited and both recorded below in §7.5.

---

## 0.4 One thing about rendering this product that will otherwise waste a day

**Headless browsers report `prefers-reduced-motion: reduce` by default, and so does any
Windows machine with animation effects turned off.** `direction-lock.md` §7.7 says remove
motion entirely rather than shorten it, so under that setting **every screen draws finished
and still.** That is correct rather than broken.

To see the motion, add `--force-prefers-no-reduced-motion` to a headless render, or turn
Windows animation effects on. **A render taken with a flag that changes what the design
does is a render of a different design**, so report both.

**Anything touching motion gets run in both engines.** Firefox headless needs the URL
before the `-screenshot` flag and needs `-no-remote -profile`.

---

## 1. Binding engagement rules, still in force

These came from the opening prompt and have not been relaxed.

- **Design only.** Static HTML and CSS. No backend, no framework, no build step, no real data.
- **One deliverable at a time, then stop and wait.** Do not batch. Do not get ahead. If you
  are about to produce a second screen in one turn, stop.
  **Suspended nine times across the engagement, every time by the client and every time
  recorded.** See §10. It is not a rule that was quietly abandoned.
- **Platform priority order is fixed.** 1. Mobile web (390, browser) is the base design.
  2. Tablet web (834). 3. Desktop web (1440). 4. Mobile app (390x844, iOS furniture).
  5. Tablet app (834x1194, iOS). Never design a later platform before an earlier one is
  signed off.
- **The web app is the whole product, not a shopfront.** `/` is a working application, not
  a landing page. Someone who never installs anything must be able to use the product
  completely and indefinitely.
- **One product in five layouts, not five products.** Identical across all five: palette,
  type scale, spacing, radii, rule weights, component identity, information hierarchy, and
  the actual content. Allowed to change: layout and reflow, navigation chrome, platform
  furniture, entry and permission moments.
- **The native pass is not a wrapper.** Stages 4 and 5 must genuinely adopt iOS convention.
- **Revisions do not advance the queue.**
- **Fonts.** Files are self-contained. **No CDN links, no external requests, ever.** Use
  faces genuinely available locally, or embed a webfont as a data URI. State the production
  substitute for every face used.
- **Fidelity.** Static comps. **No JavaScript beyond what a compare page needs.** States are
  drawn, not behaved. (Native `<details>`/`<summary>` is allowed and used, because it is
  markup rather than script.)
- **Accessibility floor, binding equally on every file.** Body text 4.5:1 against its ground,
  large text 3:1, 44px minimum tap targets, no information carried by colour alone, layouts
  that survive enlarged type. Expressive is not a contrast waiver.
- **Product name is a placeholder.** Use "Journal" or a neutral wordmark. Do not invent
  branding.
- **No marketing landing page**, no testimonial wall, no feature grid, no App Store badges.
- **`compare.html` must degrade** so labels and direct links still work if iframes are blocked.
- A direction may be declared dead, with an honest attempt and a named failure.
- iOS only for native. No Android.
- Screens are drawn light. ~~Dark mode is decided at the direction lock, with both grounds as
  tokens in `lock.css`.~~ **Amended at the Stage 2 lock by client decision: dark mode is
  deferred to the native passes and `lock.css` carries light roles only.** The rule that
  replaces it, and the reason the deferral is affordable, is: **no Stage 3 file may contain a
  colour literal.** See `direction-lock.md` §9 and §10.

---

## 2. Content rules binding every screen

From the brief. These are not style preferences.

- The user's own words are the **highest-status content** on every screen.
- AI output is **visually subordinate and always distinguishable at a glance**.
- **No streaks, no chains, no counter that can reset, no red for absence.** One monotonic
  total, which only rises.
- The AI's register is **unexcited**. An exclamation mark in sample copy is wrong.
- Any observation about the user **carries its evidence and a way to mark it wrong**.
- **Nothing may read as an AI product.** No sparkles, no gradient-purple assistant chrome, no
  typing dots, no persona avatar. The product never calls itself AI in the interface.
- Confidence tiers, never exceeded: **counts**, **juxtapositions**, **questions**. Never a
  causal claim.
- Routes are **private and never shareable**. No share affordance exists anywhere.
- **Export is free forever**, including after cancelling.
- **The crisis path is never paywalled**, in any tier or usage state.
- The paywall **never appears mid-conversation** or after someone has said something painful.

---

## 3. Commercial decisions, settled

Set by the client over the course of session 1. Do not reopen without instruction.

| | |
|---|---|
| **Free AI spend** | **$0.00. No model runs for a free user, ever.** No conversation, no reflections, no synthesis, no classifier. |
| **Free gets** | Writing, and **voice memos kept as audio and never transcribed**. Mood, timeline, keyword search over typed entries, import, export. |
| **Pro gets** | Everything, and **transcribes the entire free backlog on upgrade**. |
| **Price** | **$9.99/month, $99/year.** |
| **Pricing rule** | Price Pro at **3x the average AI cost estimate**. Pro basis is ~$2.30/month, so $9.99 is 4.3x. |
| **Free cost at 10,000 signups** | ~$30/month, all of it audio storage. |

**The mechanic.** A free user accumulates hours of their own voice they can play but cannot
read, search or scan. Upgrading resolves it in one action. Nothing is withheld that we hold;
transcription is work nobody has paid for.

**Two documented shortfalls, accepted and recorded, not solved.** Both are in `00-flow.md`.

- **§4.3 Crisis on free is keyword matching with no model behind it.** Voice memos are not
  covered at all. This does not meet the brief's stated non-negotiable and cannot be closed
  inside a zero-spend constraint. On-device transcription on the native passes closes it at
  zero marginal cost, which is a reason to reach stages 4 and 5 sooner. Belongs in a risk
  register.
- **§4.4 Nobody experiences the AI before paying.** The product is sold on its most commodity
  feature and retained on its most differentiated one. Expect churn concentrated in month
  one; budget for refunds.

---

## 4. Design direction, settled

**The direction is D4 Field record, taste.** File: `_selection/01-home/d4-field-taste.html`.
The other four directions (D1 Paper, D2 Editorial voice, D3 Bone voice-first, D5 Composed
tiles) and the three structural alternatives within D4 (D4b Colour block, D4c Contact sheet,
D4d Ledger) are **dead**. They are kept on disk for comparison only and should not be
maintained.

**Reference:** `retro-field-notes-photo-grid-on-graph-paper`
**Systems:** `editorial-minimal` + `maximalist`

### The rules the direction runs on

1. **The user writes in ink. The product only ever speaks in rust**, the colour of every
   hairline and every printed label on the page. Never the ink colour, never the same size,
   always inside a labelled row. The distinction survives greyscale.
2. **Forest marks audio and only audio.**
3. **One radius, `2px`, on everything**, including the record control. Paper does not round.
4. The day is **one ruled form inside a single rust rectangle**, times in a fixed 58px left
   column. On Timeline the same column carries the date.
5. The **spiral binding and page edge** run down the left of every screen. Decorative,
   `aria-hidden`, no tap area.
6. **Graph rule as the ground**, 14px module, with generous cream margins.
7. **Printed label plus written value**: every date the product shows sits in a keylined box
   with a small printed caps label and the value in the handwriting face.
8. **The hand appears at most twice per screen**, never below 20px, and never carries
   information not also available in printed form nearby.
9. **The product's note is shut until you open it.** See §6.

### Palette — settled at the Stage 2 lock. Original.

Role names adopted. **`lock.css` §1.1 is canonical; this table is a summary.**

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F5EDE1` | the page |
| `--paper-2` | `#FBF6EE` | the sheet, and every flat fill laid over the graph |
| `--grid` | `#E4D8C7` | graph rule, binding holes, the dotted rule in a note |
| `--rule` | `#6E4740` | every rule, every printed label, the product's voice, the record control |
| `--rule-2` | **`#8A6156`** | secondary printed text. **Changed at the lock.** See below. |
| `--block` | `#364434` | audio, and the current destination |
| `--block-2` | `#B7BBA2` | waveform, and text on `--block` |
| `--ink` | `#2E2A25` | the user's words, and nothing else |

**`--rule-2` changed from `#9A7268` to `#8A6156` at the lock.** The old value is **3.63:1**
against `--paper`, below the 4.5:1 body floor, and it was carrying text at 10px to 16px in
six places across all seven Stage 1 files. The new value measures **4.61:1** on `--paper` and
**4.97:1** on `--paper-2`. **The seven Stage 1 comps that carried the failing value are not in this
folder**; every screen here carries the corrected value.

**`--rule-2` may never sit on the open graph ground**, where it falls to 3.81:1. Enforced in
`lock.css` by giving every component that carries it its own flat fill. `direction-lock.md`
§2.2.

### Type

| | Face used | Production substitute |
|---|---|---|
| Masthead and prose | Constantia | Recoleta, or Freight Text Pro |
| Printed labels | Segoe UI | a grotesk small caps |
| The hand | Ink Free | Caveat |

All locally installed. **No file makes a network request.**

---

## 5. The AI note is collapsed

Added at the end of session 1, to the seven live D4-taste files.

- Collapsed by default. The row shows only **Read the note** with a chevron; the claim is not
  on the page until asked for. Open, the label swaps to **Hide the note**, the chevron flips,
  and the note text plus its citation and *That's not right* appear below a dotted rule.
- Built with `<details>`/`<summary>`. **No script.** Keyboard operation, focus and expanded
  state come from the browser.
- The label deliberately avoids the word AI. "Note" is the product's own word for the object.
- Consequence worth keeping: a day you never open a note on is a day the product said nothing
  at all, and the whole day now fits above the composer.
- Applied to: `d4-field-taste.html` and its six derivatives (3 colour, 3 mood). **Not**
  back-ported to the eight structural alternatives, which is noted on `compare-d4.html`.

---

## 6. What has been drawn, and the tier each screen shows

| Screen | State drawn | Tier | Why |
|---|---|---|---|
| **Today** | Settled day holding all three object types: a typed entry, a recording with its transcript, and the product's own turns | **Pro** | Richest state the flow allows. Free Today is a strict subset of it. |
| **Timeline, list zoom** | Dense, month six, entries and recordings interleaved | **Free** | The unread clause only exists on Free, and it is the conversion mechanism. |
| **Timeline, calendar zoom** | August 2026 on the ninth | **Free** | Same route, same header, same number. Not a second screen. |

**Timeline is one screen at two zoom levels.** Switching does not push a history entry,
because a zoom level is a view preference and not a place. The control is a segmented box in
the masthead, never anything that looks like navigation.

**An empty day does not exist.** In the list zoom it is not a row. In the calendar zoom it is
a number and nothing else: no box, no dot, no dimming that reads as failure, no tap target.
A long silence is fewer rows and more unmarked space, with no language attached anywhere.

---

## 7. What is still open

**Nothing here blocks a build.** Everything that was a defect has been fixed; what is left
is a deferral, three carried items, one watch-item and two inherited flaws that are
recorded rather than hidden.

### 7.1 Dark mode. DEFERRED, and not drawn. DO NOT INVENT IT.

Deferred at the Stage 2 lock by client decision and never lifted. **Every screen in this
folder is drawn light.**

**The one thing that stops this being a debt** is the no-colour-literal rule, which has
held for every file across five platforms. Whenever dark arrives it is **an added block in
`lock.css` and zero edits anywhere else.**

**Where it will fail when it is finally drawn, so the eventual pass does not start from
zero.** `--ink` on `--paper` is 12.27:1 and inverts comfortably; the text was never the
risk. The two that are: **the graph ground and `--block`.** A dark graph rule on a dark
paper either disappears or becomes noise, and a dark green block on a dark ground stops
being the most present object on the page, which is the whole reason it is filled.
**`--block-2` is the harder half**, because it is both the recording's ground and the text
sitting on `--block`, so it cannot be re-tinted freely in either direction. **And the two
relationships in §0.3 have to be preserved, not just the two floors.**

### 7.2 The name. `Journal` is a placeholder recorded as unresolved.

Not a decision. `Daybook` is the standing recommendation, `Kept` the runner-up. Both are
common words and need clearance before launch. **The masthead is a single text node on
every screen, so a rename is one edit per file.**

### 7.3 The mood row as marks. Words are locked and are what gets built.

Authored SVG marks in the direction's own weight remain the better long-term answer and are
not being built. **Emoji are not an option**: they are drawn by the operating system, they
redraw on OS updates, and Windows flips the lit side between crescent phases.

### 7.4 The page reads about 12px right of true centre, and it is not corrected.

The rail plus page block is centred exactly — 125px of `--paper` each side, measured — but
the rail is filled `--paper-2`, lighter than the margin it sits against, so it reads as part
of the margin and the eye takes the ruled area's left edge to be the rail's right-hand
hairline. **Not corrected**, because an optical nudge makes the geometry lie and has to be
re-derived on every platform. At 1440 it is the same 12px and reads as much less: 2.8% of a
428px margin instead of 9.6% of a 125px one.

### 7.5 Two inherited flaws, both measured at the handover audit, both left as they are.

1. **`07-you` and the prototype overflow the page by 15px and 11px at 200% type, at tablet
   only.** Cause: `.mast > .keybox{flex:0 0 auto}` in the tablet block, so the widest date
   in the product cannot shrink and breaks the page's right edge. **§3.3 is binding and
   this fails it.** Mobile wraps and desktop is a column, so tablet is the only platform
   affected. It is a real fix, it moves a signed file, and it was found too late to take
   without a decision.
2. **Chromium can paint the destinations as unstyled blue links on a slow first paint.**
   The colour transitions that caused it were removed at revision 49 and it has not
   reproduced since. **Recorded so that if it is ever seen in a real Chrome, the cause is
   known** rather than hunted.

### Finding 6, from the flow review: mood is a scroll away on a busy day.

Not a defect and not being fixed. It is measured, and the platform makes it better or worse
rather than the design:

| | the settled Pro Today | the window | is the mood row on screen |
|---|---|---|---|
| 390 | taller than the viewport | 764 | no. where the finding was raised |
| 834 | sheet ends 844, composer 985, page 1120 | 1120 | **yes, the whole day fits** |
| **1440** | **928 tall** | **784** | **no. it sits below the fold and the sticky composer covers it** |

**Desktop is the first platform whose window is shorter than the one before it**, 784
against 1120. That is a fact about the platform rather than a defect in the design.
**The recommendation is not to move it up or add a prompt** — both trade the product's calm
for a metric — but to make mood settable from the day page, which already exists.

---

## 8. Stage plan, and where the design stopped

| Stage | What | Status |
|---|---|---|
| **0** | The flow document | **Done.** Revision 5, approved. |
| **1** | Selection set: Home, then Timeline | **Done.** Narrowed to D4 Field record, taste. |
| **2** | Direction lock | **Done and approved.** `direction-lock.md` + `lock.css`. |
| **3** | Mobile web, one design per screen | **Done and approved.** 12 screens, a prototype, a share build. |
| **4** | Tablet web 834, then desktop web 1440 | **Done and approved.** 12 screens, a prototype and a share build on each. |
| **5** | Mobile app, then tablet app, iOS | **OPEN. 1 of 12 built.** `mobile-app/01-today.html`. |
| **Motion** | C3 glide | **Signed off and MERGED at revision 49**, on all five platforms. |

### Stage 5 is open, and this is what it is not

**Mobile app at 390x844, then tablet app at 834x1194.** The engagement rule is that **the
native pass is not a wrapper**, and `00-flow.md` marks every native delta with `⌁`. The
three that are real work rather than furniture:

- **The destination row becomes a real tab bar**, the header becomes a large title that
  collapses on scroll, and pushed pages get a navigation stack with interactive swipe-back.
  `00-flow.md` calls this "the cleanest native derivation in the document".
- **`/talk`'s permission moment changes object**: the system permission sheet replaces the
  browser's per-origin prompt, which also deletes the recovery problem behind flow-review
  finding 3 — on iOS a denied microphone is recoverable in Settings, and on mobile web it
  was not.
- **Two states the web build cannot have**: background audio, and *"recording continued
  while you were in another app"*.

**The queue from here:** `02-timeline`, `03-talk`, `04-ask`, `05-reflection`,
`06-conversation`, `07-you`, `08-first-run`, `09-plan`, `10-settings-privacy`,
`11-states`, `12-upgrade`, then a prototype and a fourth share build.

**Two things to carry into it, both learned the hard way.**

- **`.stack` is capped at 700 at desktop and has no cap at native. It gets re-derived at
  screen 3**, `/talk`, which is the screen that renders one.
- **Anything positioned against `.app` is suspect at every new platform.** It has been
  wrong at 834, at 1440 and at native, always for the same reason: at 390 `.app` and the
  page are the same rectangle, so the bug is latent until they stop being.

---

## 9. Working practices that earned their place

Kept because every one of them was learned by getting something wrong.

- **Every file carries a header comment** explaining its load-bearing idea, its trade-offs
  and its contrast figures. **The comment is part of the deliverable.** So is the caption at
  the foot of the render: a caption is copy someone reads, and a file that contradicts
  itself is worse than one that is merely out of date.
- **Render it and look at it.** Not the markup — the render. It has caught a display face
  leaking into AI text, a clipped waveform, invisible day numbers, and a span nested outside
  a `<summary>` that made a note render as the browser's own `▶ Details` marker.
- **Measure, do not eyeball.** And **check any measuring instrument against a known value
  before believing its output.** In this project the instrument has been wrong more often
  than the design, in five consecutive sessions.
- **A tag-balance count cannot see nesting.** One span opened and one closed while the
  opening tag sat outside the element it was meant to wrap, on three files, and the count
  passed the whole time. **Assert nesting, not just counts.**
- **A probe aimed at a file that cannot exhibit the reported behaviour is not evidence.**
- **Content against content.** Five faults in this project were screens making false
  statements about the user's own record — a reflection that miscounted the week, a
  Saturday recording on a Sunday sheet, a total counting a row that was not drawn — and
  **not one was visible to any mechanical check.**
- **Mechanical checks before reporting done.** The full set is `direction-lock.md` §10.
  Five of them: no external reference or dash, no colour literal, render it, greyscale it,
  and assert that `lock.css` actually parses.

---

## 10. Suspended, and by whom

**One deliverable at a time, then stop and wait** was the standing engagement rule. It was
suspended nine times across the engagement, every time by the client and every time
recorded: for the Stage 3 review batch, the polish pass, three motion batches, the motion
extension to every screen, and finally for this handover package. **It is not a rule that
was quietly abandoned**; it is a rule with nine recorded exceptions, which is worth knowing
before assuming any batch of work was unilateral.
