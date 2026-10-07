# Stage 2. Direction lock

> **October auth revision, approved by the user:** Main sign-in and sign-up use
> the selected plain-paper open spread. Their opaque form containers have two
> soft offset shadows for separation from the unruled facing-page background.
> This exception is scoped to `.auth-paper`; other product sheets retain the
> flat treatment. Existing palette, type, rail, control and motion rules apply.

> **October entry controls, approved by the user:** Written entries and saved voice memo rows use
> first-line-aligned right-edge SVG controls (written: edit/delete; voice: delete only)
> that fade in on hover (160ms) and out on
> exit (120ms). This requested opacity fade is an exception to the previous
> four-object motion inventory. Focus reveals controls immediately; touch keeps
> them visible. The memory-state disclosure uses the existing downward arrow,
> a compact, single-row Use in memory checkbox. Out of memory stays visible at
> rest. Existing quiet controls, fields, options and details are reused. The
> open panel stays in the row's flow, avoiding clipping at every width.
> At container widths up to 1000px, text has its full width and visible controls
> sit below it: memory left, action icons right. No invisible text-wrap spacer.
> The user-approved hover feedback fades edit to the existing green and delete
> to a scoped red (`--action-delete`); neither shows a background box.
> Memory labels use the approved compact 10px size; their 12px arrow is
> centered with the label. The dropdown shows only its checkbox and text, with
> 44px targets and no box border, background, padding or explanatory paragraph.

> **Current scope:** [V3-REVISION.md](V3-REVISION.md) supersedes the older guest, tier, offline, account and route decisions below. Historical reasoning and the locked visual, accessibility and motion rules remain useful.


**Journal.** D4 Field record, taste. This document and `lock.css` are one deliverable in two
files. The CSS holds the values; this holds the rules the values obey and the things a
stylesheet cannot say.

**Status: approved, at revision 48. `lock.css` CARRIES ONE TEMPORARY SECTION, AND IT IS §7:
the motion system. C3 GLIDE WAS SIGNED OFF AT SESSION 14 AND EXTENDED TO ALL 36 WEB SCREENS;
A5 and the other four candidates and their CSS are DELETED. IT IS STILL TEMPORARY, because the
client SPLIT ITS EXIT CONDITION: the deletions were taken at the sign-off and THE MERGE IS
DEFERRED until every screen carrying motion is signed off. Nothing in it binds anything and the
lock does not move for it. §15, and §15.12 is the current state.** An earlier §7
held the session 10 polish pass for one session and left by its own stated exit condition, its
accepted rules merging into the BASE. Revision 48 is that merge, and it CLOSES §9.14 and §9.17. Stage 3 is built and approved against it. Revisions made
while building are listed in §6 under *Revisions made during the Stage 3 build*; the twelve
made at the Stage 4 tablet pass are listed under it, then 27 to 29 from client review,
30 to 32 from the tablet review walk, **33 and 34 from the desktop pass**, **35 to 37 from the
desktop sign-off and screen 2**, **38 from the session 6 decisions**, **39 to 46 from
building the ten remaining desktop screens and from the client's two changes to them**, and
**47 from the first native screen**.
**The tablet reflow is §12. The desktop reflow is §13. THE NATIVE REFLOW IS §14.**

**§14 IS OPEN AND IS ARGUED RATHER THAN ASSUMED.** It covers the mobile app at 390x844 only.
The tablet app at 834x1194 is not covered by it and gets its own pass. **The native block is a
VARIANT CLASS, `.app.ios`, and not a fourth container query**, and the reason is §14.1: the
mobile app is 390 wide and so is mobile web, so no width query can tell them apart.

**THE DESKTOP SHELL IS SIGNED OFF.** `lock.css` §5d lost its `.f` class and merged into §5 at
revision 35; **§5b, §5c, §5e and §5f are deleted**, along with the ten selection comps and the
two review variants that depended on them. There are no temporary sections left in the
stylesheet. §13.11 is what was built and §13.12 is the first screen built on it.

**Binding on every file from Stage 3 onward, on all five platforms.** If a screen needs
something this document does not allow, the answer is a revision to this document, not a
local exception. A revision does not advance the queue.

Reference: `retro-field-notes-photo-grid-on-graph-paper`.
Systems: `editorial-minimal` + `maximalist`.
Working date for all content: **Sunday 9 August 2026.**

---

## 0. What was decided at this lock

Four decisions were open coming into this session. All four are now closed.

| | Decision | Note |
|---|---|---|
| **Palette** | **Original.** Cream, rust, forest. | The reference's own print palette. Recorded risk stands: it is the palette warm-craft products reach for, so distinctiveness has to come from the structure rather than the hue. It does. |
| **Mood row** | **Words.** Five text chips, as built in Stage 1. | Nothing new to draw. The row reads as five buttons rather than as a scale, which is the accepted cost. |
| **Dark mode** | **Deferred.** Light only. Revisited at the native passes. | Diverges from the engagement rule that dark is settled here with both grounds as tokens. Taken as a client decision with the cost stated. See §9. |
| **Name** | **`Journal`, placeholder. Unresolved.** | Not a settled name. Stage 3 builds the masthead as a single text node so a rename is one edit per file. `Daybook` remains the standing recommendation. |

### One defect fixed here rather than carried forward

`--rule-2` was `#9A7268` in all seven live Stage 1 files. Measured against `--paper` it is
**3.63:1**, and it was carrying text in six places: the time column, the `From your record`
label, the note's summary row, `That's not right`, the composer option, and the composer
placeholder. All at 10px to 16px, none of which is large text. That is below the 4.5:1 body
floor, which is binding on every file and is not waivable by expression.

It appears the Original scheme's secondary tint was never checked as text, only as a keyline,
where 3.63:1 clears the 3:1 non-text floor. PROJECT.md §9 says contrast is computed per scheme
and never carried over. This one was.

**Corrected to `#8A6156`.** Measures 4.61:1 on `--paper` and 4.97:1 on `--paper-2`, and stays
1.49x lighter than `--rule`, so the two-tier printed hierarchy survives intact. Stage 3 picks
this up automatically. The seven Stage 1 files are not being retrofitted, because they are
comps that have served their purpose, but **Home and Timeline are rebuilt in Stage 3 against
this lock** and will carry the corrected value.

---

## 1. The rules the direction runs on

Nine rules. They are the direction. Everything in §2 to §8 is these rules expressed as
numbers.

1. **The user writes in ink. The product only ever speaks in rust.** `--ink` is the user's
   words and nothing else in the product. `--rule` is every hairline, every printed label,
   and everything the product itself says. The product's voice is never the ink colour, never
   the same size as the ink, and always inside a labelled row. **The distinction survives
   greyscale**, because it is carried by size and position as well as hue.
2. **`--block` marks audio, and only audio.** One exception, inherited: it also fills the
   current destination in the nav. That double duty is quiet in this palette and is accepted.
   If it ever becomes visible, the fix is one line: draw the current destination in `--rule`.
3. **One radius, `2px`, on everything**, including the record control and the play control.
   Paper does not round.
4. **The day is one ruled form inside a single rust rectangle**, times in a fixed 58px left
   column. On Timeline the same column carries the date instead.
5. **The spiral binding and the page edge run down the left of every screen.** Decorative,
   `aria-hidden`, no tap area, never a navigation affordance.
6. **Graph rule is the ground**, 14px module, with generous margins.
7. **Printed label plus written value.** Every date the product shows sits in a keyline box
   with a small printed caps key and the value in the hand.
8. **The hand appears at most twice per screen**, never below 20px, and never carries
   information that is not also available in printed form nearby.
9. **The product's note is shut until you open it.** `<details>` and `<summary>`, no script.
   A day you never open a note on is a day the product said nothing at all.

---

## 2. Colour

Eight roles. **There is no ninth.** Carbon was the only candidate that needed one, and Carbon
lost.

| Token | Value | Role. This and nothing else. |
|---|---|---|
| `--paper` | `#F5EDE1` | The page. |
| `--paper-2` | `#FBF6EE` | The sheet, and every flat fill laid over the graph ground. |
| `--grid` | `#E4D8C7` | The graph rule, the binding holes, the dotted rule inside a note. |
| `--rule` | `#6E4740` | Every hairline. Every printed label. The product's own voice. The record control. |
| `--rule-2` | `#8A6156` | Secondary printed text, and subdivisions inside a row. |
| `--block` | `#364434` | Audio. And the current destination. Nothing else. |
| `--block-2` | `#B7BBA2` | **The recording's ground**, and text sitting on `--block`. |
| `--ink` | `#2E2A25` | The user's words, and nothing else in the product. |

### 2.1 Measured contrast

Recomputed for this scheme. Not carried from any other.

| Pair | Ratio | Floor | |
|---|---|---|---|
| `--ink` on `--paper` | **12.27** | 4.5 | prose on the page |
| `--ink` on `--paper-2` | **13.24** | 4.5 | prose on the sheet |
| `--rule` on `--paper` | **6.85** | 4.5 | printed label, the note |
| `--rule` on `--paper-2` | **7.40** | 4.5 | |
| `--rule-2` on `--paper` | **4.61** | 4.5 | secondary printed. was 3.63 and failing |
| `--rule-2` on `--paper-2` | **4.97** | 4.5 | |
| `--paper` on `--rule` | **6.85** | 4.5 | the key in a keyline box, the mic glyph |
| `--paper` on `--block` | **8.89** | 4.5 | current destination, play glyph ground |
| `--block` on `--block-2` | **5.23** | 4.5 | **waveform, duration, the play keyline.** Reversed at revision 29 |
| `--ink` on `--block-2` | **7.22** | 4.5 | the calendar's audio day |
| `--block` on `--paper-2` | **9.60** | 4.5 | the play glyph, the divider inside a recording |
| `--block` on `--paper` | **8.89** | 3.0 | keyline, focus ring |
| `--grid` on `--paper` | **1.21** | none | decorative. never carries text or meaning |

### 2.2 The graph ground, and what may sit on it

Text can land on a graph rule. The worst case is the rule colour, not the paper colour, so
the worst case is what gets checked.

| On `--grid` | Ratio | |
|---|---|---|
| `--ink` | 10.14 | allowed |
| `--rule` | 5.66 | allowed |
| `--block` | 7.35 | allowed |
| `--rule-2` | **3.81** | **forbidden** |

**`--rule-2` may never sit on the graph ground.** Any surface carrying `--rule-2` text lays
down a flat `--paper` or `--paper-2` fill first.

Rather than leave that as a rule someone has to remember, it is enforced in `lock.css`.
**Every component that can be placed on the open page and carries `--rule-2` text now brings
its own fill:** `.sheet`, `.composer`, `.said`, `.mark`, `.dest a`, `.notice`, `.card`,
`.srowlink`, `.cal`. Three components that could not reasonably carry a fill were moved to
`--rule` instead: `.foot`, `.progress .cap` and `.btn.quiet`. `.btn.quiet` is the better
change on its own merits anyway, because a control the user is meant to press should not be
the least legible thing on the page.

`--rule-2` therefore survives only inside filled objects, where it measures 4.61:1 or better.

### 2.3 Forbidden pairs, stated so they cannot be reached by accident

| Pair | Ratio | |
|---|---|---|
| `--ink` on `--block` | 1.38 | never |
| `--rule` on `--block` | 1.30 | never |

**Text on `--block` is `--paper` or `--block-2`. There is no third option.**

### 2.4 Colour never carries information alone

Binding, and checkable by rendering greyscale.

- A recording is told from a typed entry by **a toned row, a waveform, a duration and a play
  control**, not by being green. **Revision 29 inverted the tone**: `--block-2` ground with
  `--block` marks, rather than a `--block` slab with `--block-2` marks. All four signals
  survive and so does greyscale, where the row reads at 0.482 relative luminance against the
  sheet's 0.926. The reason is the brief's first content rule: **the user's own words are the
  highest-status content on every screen**, and a memo nobody had played was outshouting the
  writing around it. At 834, where the same row is 504px wide, it simply took the page.
- The current destination is marked by `aria-current="page"` **and** a filled ground **and**
  an inverted label.
- An item held out of memory carries **a keyline, a glyph and the word**, not a tint.
- An imported item names its source in words: `Day One`.
- The mood row is words, so the question does not arise.
- **Nothing in this product is ever red**, and nothing is ever coloured to mean absence,
  lateness, failure or urgency. There is no error colour, because there is no state in this
  product that is the user's fault.

---

## 3. Type

Three families. Locally installed, no network request from any file, ever.

| Family | Face used | **Production substitute** |
|---|---|---|
| `--f-prose` | Constantia | **Recoleta**, or **Freight Text Pro** |
| `--f-label` | Segoe UI | **a grotesk with real small caps** |
| `--f-hand` | Ink Free | **Caveat** |

The substitute is not a fallback, it is the intended face. Constantia, Segoe UI and Ink Free
are stand-ins that happen to be on this machine and are close enough in colour and width to
judge the design by. **Every comp states its substitutes in its header comment.**

### 3.1 The scale

Role-named, not step-numbered, because a step number invites picking the next one up.

**Printed, in `--f-label`.** The product's printed layer.

| Token | Size | Tracking | Used for |
|---|---|---|---|
| `--t-key` | 10px | .18em, caps | the key in a keyline box, item marks, card headings |
| `--t-col` | 10px | .08em | the time column, and the date column on Timeline |
| `--t-print` | 11px | .07em, caps | destinations, mood chips, duration, the note's summary |
| `--t-quiet` | 11px | .04em | citation, `That's not right`, the composer option |

**Prose, in `--f-prose`.**

| Token | Size | Leading | Used for |
|---|---|---|---|
| `--t-mast` | 34px | 1 | the wordmark. once per screen. |
| `--t-body` | 16.5px | 1.58 | **the user's words.** the only 16.5 in the product. |
| `--t-field` | 16px | 1.3 | the composer, placeholder and value |
| `--t-note` | 14px | 1.5 | the product's note. **always smaller than `--t-body`.** |
| `--t-glance` | 13.5px | 1.45 | the glance line, the total |

**The hand, in `--f-hand`.**

| Token | Size | Used for |
|---|---|---|
| `--t-hand-l` | 29px | the value in a keyline box |
| `--t-hand-s` | 22px | the mood question |

**Floor of 20px on the hand, no exceptions.** Below that it stops being legible and starts
being texture. If a screen has already spent both of its two hand appearances, the keyline
box uses `.v.printed`, which is `--t-field` in `--f-prose`.

### 3.2 Measure

> **REWRITTEN AT SESSION 8, IN CHARACTERS PER LINE, BY CLIENT DECISION. §9.13.** This section
> used to state the rule partly in `ch`, and `ch` is not the instrument. It is a font-relative
> unit tied to the advance of the digit zero, and in this project's prose face the zero is
> much wider than the average letter, so **every `ch` figure written here was optimistic**.
> The band below is now in the unit the band was defined in. **Nothing shipped changes**: the
> caps this replaces are released above the tablet threshold on every platform, and the one
> `ch` value left in `lock.css` is a functional bound rather than a measure. What changes is
> how the next two widths get chosen, which is why it was worth doing before a native pass
> rather than after it.

**THE RULE IS A CEILING, AND IT IS IN CHARACTERS PER LINE.**

1. **The comfortable band for continuous prose is 45 to 75 characters a line.** It exists
   because return-sweep error compounds over many lines, so **the band prices in a cost that
   is only paid by a long block.**
2. **Subordinate content never runs wider than the writing above it.** The product's note, an
   empty state, card copy and a settings explanation all sit in the same column the user's
   words sit in, so this holds by construction rather than by a cap.
3. **A block of two to four lines is not continuous prose and the band does not bind it.**
   This is the documented exception, it was taken deliberately at the desktop shell, and it is
   §13.11 fix 2b: the longest entry in the whole of §8 is 175 characters, which is two lines
   at the desktop measure. The cost the band prices in is not being paid, and holding the
   writing to 45 to 75 there put it at 47% of the column it sits in, which read as a fault.
   **A rule whose reason is absent is not a rule here.** Where the exception applies is stated
   per platform and never assumed: §12.4 for 834, §13.11 for 1440.

**MEASURED, AT EVERY WIDTH THE PRODUCT HAS.** Read off the rendered files with a Range over
each line's own ink, so the advance is the face's real average on this project's own copy
rather than a conversion. `.prose` is Constantia 16.5px, the note is Constantia 14px.

| | column | lines it sets in | longest line | real advance | column capacity |
|---|---|---|---|---|---|
| **the writing, 390** | 250.0 | 33, 35, 34, 28, 33, 9 | **35 chars** | 6.644px | **37.6** |
| **the writing, 834** | 416.0 | 55, 56, 58, 6 | **58 chars** | 6.972px | **59.7** |
| **the writing, 1440** | 884.0 | 128, 48 | **128 chars** | 6.814px | **129.7** |
| **the note, 390** | 241.3 | 36, 33, 35, 9 | **36 chars** | 6.033px | **40.0** |
| **the note, 834** | 416.0 | 63, 51 | **63 chars** | 6.046px | **68.8** |
| **the note, 1440** | 884.0 | 115 | **115 chars** | 5.974px | **148.0** |

390 and 834 sit inside the band on both objects. **1440 is outside it on both, deliberately,
under rule 3 above**, and it is the only place in the product that is.

**WHAT `ch` WOULD HAVE SAID, AND WHY IT IS WORSE THAN A FIXED ERROR.** `1ch` is **8.875px** at
16.5px and **7.531px** at 14px, against real advances of 5.97 to 6.97. The overstatement is
**not one factor**: it is **x1.336 at 390, x1.273 at 834 and x1.303 at 1440** on the writing,
and **x1.246 to x1.283** on the note, because it depends on the letter mix of whatever sample
is set. §13.1 recorded x1.303 from one sample and that figure is real, but **it is not a
conversion anyone can rely on**. A unit that is wrong by a varying amount cannot be corrected
by dividing. **So the instrument is the measurement, and the harness that takes it is in the
working practices**: capacity is the column width over the measured advance, and the count per
line is read from the rendered line boxes.

**THE `ch` VALUES THAT ARE STILL IN `lock.css`, AND WHAT THEY ARE.** Stated so nobody reads
them as measures.

| Where | Value | What it actually is |
|---|---|---|
| `.said p` | `32ch` | The mobile-only rail. **Released above 700** by revision 25. At 390 it computes 241.3px, which is 40 characters, and the writing beside it is 37.6, so it is a ceiling that happens to hold. |
| `.card p`, `.srowlink .why` | `38ch` | Same: mobile-only, released above 700. |
| `.empty` | `34ch` | Same. |
| `.dialog .card p` | `38ch` | **A FUNCTIONAL BOUND AND NOT A MEASURE.** Revision 26. It keeps `Export instead` and `Delete everything` near each other on the only irreversible screen in the product. 317px at every width. It is not up for re-derivation in characters, because characters are not what it is for. |

**One correction this measurement forced, and it is in a binding document.** §13.11 and
`lock.css` §5 both recorded the desktop writing as **156 or 157 characters on its first line**.
**It is 128.** Measured on all three entries on the built screen: 128, 124 and 89 characters on
their longest lines, at a capacity of 126 to 130. The conclusion those numbers were supporting
is unaffected — 175 characters is still two lines at this width, which is the whole of fix 2b's
argument — but the figure was 22% high and it was carried rather than measured. Corrected in
both places at session 8.

> **The rule is the ceiling. The `ch` values are a proxy for it, and the proxy is only
> correct at 390.** Amended at the Stage 4 tablet pass, `lock.css` revision 25, after the
> proxy was mistaken for the rule and shipped as a visible fault.
>
> | | the note | the writing | note as % of the ceiling |
> |---|---|---|---|
> | 390 | 241.3px | 250px | **96%** |
> | 834, as first built | 241.3px | 416px | **58%** |
>
> At 390 the cap sits almost exactly on the ceiling and behaves as a safety rail. At 834 it
> becomes a hard constraint doing something it was never measured for, and the note stops
> less than three fifths of the way across a row whose fill and rules run the full width.
> **That is an information-hierarchy change between platforms, which the engagement rules
> forbid outright**, and it reads as a fault rather than as a measure.
>
> **Above the tablet threshold the caps are released** and subordinate prose fills its
> column, exactly as it does at 390. The released measures are about 55ch for the note,
> 57ch for an empty state and 63ch for card copy, all inside the comfortable band. The
> ceiling still holds, and now holds for the reason it was written rather than by
> coincidence, because every one of these sits in the same column the user's words sit in.
>
> **One exception, and it is not a measure rule: `.dialog .card p` keeps its 38ch.** Every
> other `.card` is a block that fills its container; the one inside `.dialog` is a grid item
> sized to its own content, and released it set on a single line and grew past the page's
> edges. The bound there is **functional**: a confirmation stays compact so `Export instead`
> and `Delete everything` stay near each other, and a long throw between the safe button and
> the destructive one is what produces a mis-tap on the only irreversible screen in the
> product. The card measures **317px at both widths**.

### 3.3 Enlarged type

Every layout must survive text scaled to 200%. Three consequences, binding:

- **No fixed heights on anything carrying text.** `min-height` only.
- **The 58px time column is a `flex-basis`, not a width**, and its content is 10px with
  tabular numerals, so it holds. If it ever wraps, the row stacks rather than clipping.
- **`--tap: 44px` is a floor and never a height to design to.** Controls grow.

The tightest place in the product is the calendar zoom, where seven columns have to clear
44px inside 390. The arithmetic: `390 - 24 rail - 28 gutter = 338`, less 16px of padding and
six 2px gaps, gives **44.3px per cell**. It clears, but with nothing to spare, so `.cal`
padding and gap are fixed values and not free choices. `.cal .day` also carries an explicit
`min-height: var(--tap)` so the floor holds under enlarged type.

---

## 4. Space

Nine steps, tied to the 14px graph module.

| Token | Value | |
|---|---|---|
| `--s1` | 2px | hairline inset, tick mark |
| `--s2` | 4px | |
| `--s3` | 6px | gaps inside a control cluster |
| `--s4` | 8px | |
| `--s5` | 10px | tight inner padding |
| `--s6` | **14px** | **the module.** the page gutter, and the standard inner padding |
| `--s7` | 20px | masthead top, composer bottom |
| `--s8` | 28px | two modules |
| `--s9` | 42px | three modules |

**Fixed dimensions.** Not part of the scale and not interchangeable with it.

| Token | Value | |
|---|---|---|
| `--mod` | 14px | the graph module. the same number as `--s6`, deliberately. |
| `--rail` | 24px | the binding rail |
| `--tcol` | 58px | the time column, and the date column on Timeline |
| `--tap` | 44px | the minimum tap target |
| `--ctl` | 50px | the record control, and the composer field |

### 4.1 What Stage 3 normalises

The Stage 1 comps predate this scale and use six off-scale values. Home and Timeline are
rebuilt against the lock, so these change. Listing them so it is not a surprise:

| Was | Becomes | Where |
|---|---|---|
| `gap: 5px` | `--s3` (6px) | destination row, mood chips |
| `padding-top: 12px` | `--s5` (10px) | content column of a ruled row |
| `padding-top: 13px` | `--s6` (14px) | the time column |
| `padding: 12px 14px 16px` | `--s6 --s6 --s7` | the composer |
| `padding: 3px 14px 4px` | `--s1 --s6 --s2` | the note's content column |
| `font-size: 11.5px` | `--t-quiet` (11px) | citation, `That's not right` |

---

## 5. Radius, rules, elevation

### Radius

**`--r: 2px`. One value, everything.** Controls included. The record control, the play
control, the chips, the field, the sheet, the keyline box, the marks. Paper does not round,
and a rounded control on a printed form is the single fastest way to make this direction
look like a wellness app.

The binding holes are circles by geometry, not by radius. That is the only curve in the
product that is not 2px.

### Rules

**`--w: 1px`. One weight. There is no second weight.** Rules are told apart by colour and
style, never by thickness.

| Rule | Where |
|---|---|
| `--rule`, solid | the form's outer edge, and every division between rows |
| `--rule-2`, solid | subdivisions inside a row: the time column's right edge, the binding rail's edge |
| `--block`, solid | the division inside a recording, between the head and the transcript |
| `--grid`, dotted | inside an opened note, and nowhere else |
| `--grid`, solid | the graph ground, at `--mod` |

The one non-1px line in the product is the **2px left rule on `.excerpt`**, which marks the
user's own words inside an answer. It is 2px because it is a quotation mark, not a rule.

### Elevation

**There is none. `--elev: none`.**

No `box-shadow` on any product surface, in any state, on any platform. Hierarchy comes from
rules, flat fills and leading. **Paper does not float.**

Two exceptions, neither of which ships:

- `.device` in the presentation stage, which is the comp's own furniture.
- `.dialog`'s scrim, which is a translucent ground rather than a shadow, and exists once in
  the product.

---

## 6. Component inventory

**This list is closed. Anything not on it does not get built.** **Thirty seven components**
across twelve screens: the inventory opened at thirty two and the Stage 3 build found five
more, which is normal and is why a closed inventory is a starting point rather than a
finished census. If a screen appears to need a thirty eighth, that is a conversation
before it is a file.

### A. Shell

| | Component | Rules |
|---|---|---|
| A1 | `.stage` `.device` `.chrome` `.caption` | **Not product.** The only place a colour literal is allowed. Does not ship. |
| A2 | `.app` `.page` | The paper ground and the graph page. Every screen. |
| A3 | `.rail` | The spiral binding. Decorative, `aria-hidden`, **no tap area**, never navigation. Every screen. |
| A4 | `.mast` `.wordmark` | The masthead. The wordmark is one text node so a rename is one edit. |

### B. Navigation

| | Component | Rules |
|---|---|---|
| B1 | `.dest` | Four destinations. **Always four**, always in the order Today, Timeline, Ask, You. A compact header row, never a bottom bar on mobile web. |
| B2 | `.seg` | The segmented control. **Timeline zoom only.** Never used for anything else, and must never look like navigation. Does not push history. |
| B3 | `.back` | Pushed pages only. Never appears on a destination. |

### C. The form

| | Component | Rules |
|---|---|---|
| C1 | `.sheet` | One rectangle, hairline-ruled into rows. One per screen. |
| C2 | `.srow` | A ruled row. 58px column, then content. |
| C3 | `.recrow` | The recording. **The only row that carries a tone.** `--block-2` ground, `--block` marks. **The head always carries the 58px column**, holding the time on a day's screen and the date on Timeline, on both tiers, which is rule 4 and closes §9.12; the transcript body's column is then present and empty. Inside it: play, waveform, duration. The transcript body is present on Pro and absent on Free. **Inverted at revision 29: it was a `--block` slab and it outshouted the writing above it.** **Revision 31 adds the 58px date column, `.head.dated`**, because `00-flow.md` §1 defines a memo row as date, duration, waveform, play control and Free has no body to carry the date. The column is present and empty where the row continues the day above; **empty is not the same as absent.** **Settled at session 7 by client decision: it is not optional and there is no exemption. Every memo row carries the column, including the kept and transcribing states on `/talk`, which §9.12 had left out as a capture state rather than a row in the record.** The one row that does not is the capture surface itself, `.head.col`, because a recording in progress has no timestamp yet. |
| C4 | `.said` | The product's note. **Shut until opened.** `<details>`/`<summary>`, no script. |
| C5 | `.moodrow` | Five word chips. The last row of the form. |

### D. Printed objects

| | Component | Rules |
|---|---|---|
| D1 | `.keybox` | Printed caps key, then the value. Every date the product shows. Also the price. |
| D2 | `.glance` | One line of the current reflection, between two rules. **Pro only.** |
| D3 | `.total` | **The only number in the product.** Timeline only. It only rises. No badge, no colour, no countdown, no urgency, no offer language. |
| D4 | `.mark` | An item mark. `Private`, `Day One`, `Saved on this device`. Keyline, glyph and word. Never a tint. |
| D5 | `.foot` | The footer line. `Since March 2026`. |

### E. Controls

| | Component | Rules |
|---|---|---|
| E1 | `.composer` `.crow` | Sticky, at the foot of Today. **Never on any other screen.** Carries exactly one filled control: `.mic` when the field is empty, `.send` when it is not. |
| E2 | `.btn` in three grades: `.solid`, `.keyline`, `.quiet` | Three and no fourth. Plus `.cite` and `.wrong`, which are a pair and always appear together. |
| E3 | `.field` | Single line. Never autofocused. |
| E4 | `.play` | The play control. `--tap` square, `--r` radius. |
| E10 | `.send` | The commit control. The composer's filled control while the field holds content. **A word, `Save`, not a glyph.** Same height and fill as `.mic`. |
| E5 | `.wave` | Authored SVG, `aria-hidden`. **The duration beside it carries the information.** |
| E6 | `.srowlink` `.opt` | A settings row, and a checkable option. |

### F. Notices

| | Component | Rules |
|---|---|---|
| F1 | `.notice` | Inline. Offline, guest, allowance. **Never touches history.** |
| F2 | `.card` | A static card. The crisis resource and the capability ladder. **Human-written, never generated.** Carries a way to say it was wrong. Never colour-coded, never alarming. |
| F3 | `.empty` | One line of prose. **No illustration, ever.** No blank box. |
| F4 | `.progress` | Back-transcription only. A native `<progress>`, so the value is data rather than a hardcoded width and assistive tech announces it. No colour, no motion. |

### G. Overlays

| | Component | Rules |
|---|---|---|
| G1 | `.panel` | Slides over, pushes history, Back closes it. Keep-this, mood edit, install, citation, crisis resource. |
| G2 | `.dialog` | **Exactly one exists in the product: delete everything.** If a second appears in Stage 3, something has gone wrong. |

### H. Timeline and answer

| | Component | Rules |
|---|---|---|
| H1 | `.dayrow` | A timeline day. The 58px column carries the date. **An empty day is not a row.** |
| H2 | `.cal` | The calendar zoom. A day with nothing in it is a number and nothing else: no box, no dot, no dimming that reads as failure, no tap target. |
| H3 | `.excerpt` | The user's own words, dated and openable. **Always above the synthesis, never inside it.** |

### Revisions made during the Stage 3 build

**The inventory closed at 32 before any screen but Today existed. Building the other ten
found nine gaps.** That is a normal outcome and the lock anticipated it, but it means the
Stage 2 inventory was optimistic and should be read as a starting point rather than as a
finished census. **The inventory is now 37.**

| # | Change | Found building |
|---|---|---|
| 1 | `.prose + .mark`, `.lede + .mark` adjacency | Today. A mark following the user's words collided with them. |
| 2 | **D6 `.shead`**, a section heading inside the form | Timeline. Also needed by Ask, You, Plan and the states pack. |
| 3 | `.cal .day` gets `text-decoration:none` | Timeline. A day with content is a link; both linked and unlinked days render as a bare number, so it must not underline. |
| 4 | **E7 `.readout`**, **E8 `.stack`**, `.wave.big` | Talk. A full-screen page with one job had no container, and the elapsed time had no size. |
| 5 | `.said .ccol.open` | Ask, reflection, conversation. The note is shut when unsolicited and open when the user asked. |
| 6 | `.app.clip` | The states pack. Presentation only; no shipped screen uses it. |
| 7 | `.lede` and `.card-foot` unscoped | Plan and the guest panel. Both were scoped to parents they are legitimately used outside of. |
| 8 | **E9 `.actions`**, a page action bar | Plan. It ends in two buttons and `.composer` is not allowed to leave Today. |
| 12 | **E10 `.send`**, the commit control | The flow walk. The typed path could not be completed: there was no way to save. The one blocking defect of Stage 3, and the fix is one control with two states. |
| 17 | The masthead second row pinned to `--ctl` on every destination | Client review. The destination row sat at 186, 184 or 188 depending on the destination, so switching nudged the page. See §7.6. |
| 16 | `.card p + p` gets a top margin | The permission cards are the first with more than one paragraph. Two paragraphs must not run together. |
| 15 | `.stack .card` resets `text-align` | A stack centres its own short lines; a card inside one holds real prose, and centred multi-line prose is bad typography. |
| 14 | `.progress .bar` becomes a native `<progress>` | A fill width is data, and expressing data as an inline style was the last inline style left in Stage 3. The native element also announces 19 of 31 without an `aria-label`. |
| 13 | `.send` becomes a word, `Save`, instead of a glyph | Client review. The arrow-onto-a-baseline glyph read as **download**. An icon that has to be decoded is worse than a word that cannot be, and the product already speaks in printed labels. |
| 10 | Widened font fallbacks | Sharing the prototype off Windows. |
| 11 | `.field` gets `text-decoration:none` | The prototype makes the field a link, and a text field is never underlined. |
| 9 | `min-width: var(--tap)` on `.cite`, `.wrong`, `.back`, `.btn.quiet`; `.excerpt .when` given `min-height` | Measured, not eyeballed. Five controls had 44px height and 31px to 42px width. |

### Revisions made at the Stage 4 tablet pass

**The inventory does not move. Three revisions, none of which adds a component.** Tablet is
a reflow, and everything below either moves an existing object or names a value that was
already implied.

| # | Change | Found building |
|---|---|---|
| 18 | **`--gut`, the page gutter, becomes a token** | Tablet. Fifteen rules took `--s6` directly as the margin against the page edge. On mobile the gutter and the module are both 14px, so it read as correct; they agree by coincidence, and tablet is where they stop. `--gut` is `var(--s6)` at mobile, so **every Stage 3 file renders byte-identically. Verified by pixel diff on four screens, not by reading.** |
| 19 | **§4 of `lock.css`: the tablet block.** `--page-w: 560px`, `.app{container-type:inline-size}`, and one `@container (min-width:700px)` block | Tablet. The whole reflow. See §12 below. |
| 20 | **`width:100%` on `.page` at tablet** | Measured. `.page` is a flex item that was relying on `stretch` to fill `.app`, and **an auto margin in the cross axis cancels stretch**, so `margin-inline:auto` silently turned it into a shrink-to-fit box. Today holds content wider than 560 so it landed on the cap and looked right; a sparse screen does not. A `/talk` stack measured a **430px page with the binding stranded 65px from it**. |
| 21 | **`.mast` wraps, and `.back` takes a full-width line** | The pushed pages. The masthead is a flex row at tablet, and a pushed page puts three things in it. Left alone, `space-between` stranded the wordmark between the back control and the date. |
| 22 | **`.panel` follows the page** | The states pack, state 8. `.panel` is absolutely positioned and its containing block is `.app`, because `.page` is not positioned. At 390 `left:--rail; right:0` lands exactly on the page and the bug does not exist. At 834 it spanned the full width and floated over the cream margins. |
| 23 | **`.app.clip .page{min-height:0}`** | The states pack. `clip` sets `.app`'s min-height to 0 so ten states fit in one file, and the height had moved to `.page`, so `clip` was being silently overridden and every state rendered 1120px tall. |
| 24 | **`.dialog` centres on the page** | `/you/data`. The scrim covers everything, which is right, but the card was centring on `.app`'s padding box and landing **12px left of the page's axis**. Invisible at 390, where the two are the same line. |
| 25 | **The subordinate prose caps are released above the tablet threshold** | **Client review, and the one Stage 4 defect a reader found before I did.** `.said p`, `.card p`, `.empty` and `.srowlink .why` were frozen at their `ch` caps, so the product's note stopped at 58% of a row whose fill runs the full width. §3.2 states the rule as a ceiling and the `ch` values are a proxy for it; the proxy was measured at 390, where it sits at 96% of the ceiling, and I mistook it for the rule. See §3.2 and §12.4. |

| 26 | **`.dialog .card p` keeps its 38ch. The one exception to 25** | Caused by 25 and caught by re-rendering it. Every `.card` is a block that fills its container except the one inside `.dialog`, which is a grid item sized to its own content; released, it set on a single line and **grew to 706px, past the page's own edges**. The bound is **functional, not typographic**: `Export instead` and `Delete everything` must stay near each other on the only irreversible screen in the product. **317px at both widths.** |

### Revisions 27 to 29, from client review of the tablet pass

**All three are cross-platform and land on mobile as well as tablet**, because every one of
them is a change to information hierarchy or component identity, and those are held identical
across all five platforms. None adds a component.

| # | Change | Why |
|---|---|---|
| 27 | **The search row leaves the masthead.** Ask carries the same date box as Today and You; the field moves below the destinations as `.crow.find` and fills the page | Client review. At 834 the one-row masthead squeezed the field to a capped 360, and a search box deliberately prevented from being the width of its own results is an odd object. The better argument is the one underneath: on every other destination the masthead's second row is a **printed object the product is telling you about**; on Ask it was the only interactive text input in any masthead in the product. **All four destinations now compose their masthead identically**, so §7.6 holds for a reason rather than a coincidence. |
| 28 | **`You` is set apart from the other three** by an auto left margin, and the three take their own width | Client review. Four equal tabs said all four are the same kind of place. Today, Timeline and Ask are the journal; **You is the only one that is about the software rather than about the writing.** Order unchanged, still always four. |
| 29 | **The recording row is inverted.** `--block-2` ground with `--block` marks | Client review: the memos were taking all the attention. See §2.4. A straight swap between two roles that already exist, so **no ninth colour**. |

### Revisions 30 to 32, from the tablet review walk

**Three revisions, no new component.** 31 changes component identity and therefore lands on
mobile as well as tablet; 30 is stage furniture; 32 is reflow only and stays inside the
container block.

| # | Change | Why |
|---|---|---|
| 30 | **The stage left-anchors and scrolls instead of centring, and `.device.t` drops `max-width`** | `.device.t` inherited `max-width:100%`, so `.app` was really `min(834, window - 32)`. **Below a 732px window every tablet comp quietly rendered the mobile layout** under a caption stating the page is 560 with 125 of cream each side, and between 732 and 866 it rendered a tablet with margins narrower than the caption claimed. `journal-prototype-tablet.html` already carried the fix; the thirteen source files did not. `align-items:center` on a flex column overflows an oversized item both ways and the left half cannot be scrolled to, so the stage now left-anchors and every child centres itself with an auto inline margin. **Proved neutral by pixel diff on all 26 files.** |
| 31 | **A recording row can carry the 58px date column** | `00-flow.md` §1 specifies a memo row as **date, duration, waveform, play control**. As built the date existed only when a Pro transcript body was there to hold it. Timeline is drawn at Free, so **Sat 8's recording sat under Sun 9 and Wed 5's under Thu 6**, contradicting the calendar zoom on the same screen. The `aria-label` was correct throughout, so a screen reader was told the truth and a sighted reader was not. The column takes `--paper-2`, so `--rule-2` measures the existing 4.97 and no new contrast figure is needed, and **it restores rule 4**, which the recording head was the only row in the product to break. |
| 32 | **`.srowlink .val` stops shrinking above the tablet threshold** | Releasing `.srowlink .why` at revision 25 raised the label's flex base to its full max-content, so the label claimed the slack and the value was squeezed to 32px, setting `Read it` as two lines on a row with 50px going spare. At 390 the shrink is correct and stays. Layout only. |

### Revisions 33 and 34, from the desktop pass

**Two revisions, no new component, and the second one is a single declaration.** Both are
desktop-only and both are inert below the 1200px container threshold. **Verified by pixel diff
on all 26 numbered files and both share builds: 0 differing pixels, byte-identical renders.**

| # | Change | Why |
|---|---|---|
| 33 | **`.device.d,.caption.d{width:1440px;max-width:none}`**, in §2.1, built on the first desktop file rather than the tenth | The tablet lesson applied forward. `.device` carries `max-width:100%`, so without this `.app` is `min(1440, window - 32)`. A 1440 comp needs a **1472px window** and most laptops are 1366 or 1440, so **at desktop the wrong platform is the default outcome rather than an edge case.** Revision 30 already made the stage left-anchor and scroll, so an over-wide device is reachable. |
| 34 | **§5 of `lock.css`, the desktop block. `@container (min-width:1200px){ .page{min-height:784px} }`** | The whole reflow. See §13. It is one declaration because **the page does not change at 1440**: `--page-w`, `--gut`, the rail formula, the panel formula, the dialog centring, the masthead row and the released caps are all already correct at this width, and the desktop block sits after the tablet block and is additive over it. The height is the one thing that genuinely moves, and it moves **down**: 1120 to 784, because desktop is the first platform whose window is shorter than the one before it. |

### Revisions 35 to 37, from the desktop sign-off and screen 2

**Three revisions, no new component. The inventory stays at 37.** 35 is the merge and is
desktop-only by construction; 36 and 37 were found building the second desktop screen and both
sit inside the 1200 container. **Verified by pixel diff on all 26 numbered files and both share
builds after each: 0 differing pixels, byte-identical renders, 28 of 28.**

| # | Change | Why |
|---|---|---|
| 35 | **§5d loses its `.f` class and merges into §5. §5b, §5c, §5e and §5f are deleted.** | The client signed the shell off. The exit condition every one of those five sections carried was taken in one edit. **Taking it found a real defect**, below. Three things came in with the merge and none of them is the shell: fix 3 moved out of §5f where it had been mis-scoped; the `white-space:nowrap` on the date came out, which is the 200% clip; and two of the four §9.14 defects were fixed **desktop only**, by client decision. |
| 36 | **The title block takes Timeline's two objects.** `.title .keybox,.title .seg` share the bottom margin; `.title .glance,.title .total` share `margin:0`; `.seg` fills the column and its buttons divide it | Screen 2, and it is **rule 7.6 rather than tidiness**. The title block has two slots under the wordmark, and both had only ever held Today's occupant, so the zoom control arrived with no space beneath it and the number still carrying the page gutter. 7.6 is now a claim about this block, and it holds only if both second-row objects are `--ctl` tall **and** carry the same margin. **Measured on both destinations that exist: every object in the block is at an identical top and height on Today and Timeline.** |
| 37 | **`.page.split`: Timeline puts its record and its index side by side** | **Client decision at session 6**, and a change to what the calendar IS rather than to where it sits. At 390 and 834 the two zooms are alternatives behind `.seg` because only one fits; at 1440 both fit, so the list is the record and the calendar is an index into it. See §13.12. |

### Revision 38, and one change that needed no revision at all

| # | Change | Why |
|---|---|---|
| 38 | **A pressed state, product-wide.** 1px downward translate on every control | Adopted from the taste review, which found it before the sign-off deleted the block it was parked in. **Component behaviour, so all five platforms.** It changes no comp, because comps are drawn at rest. §7.5. |
| — | **§9.12 closes with no CSS at all.** The recording head always carries its 58px column, on both tiers | `.head.dated` already existed as revision 31, so this is **markup on seven files and a change to §6 C3 and §7.2**. It is a component identity change and therefore lands on all three built platforms. **The signed-off files move**, deliberately, and which ones is stated in the engagement record. |

### Revisions 39 to 45, from building the ten remaining desktop screens

**Seven revisions, no new component. The inventory stays at 37.** Five are desktop-only and
inert below the 1200 container; **43 is a component rule and lands on all five platforms**;
45 is desktop-only and **deliberately moves the two approved desktop screens**. Verified by
pixel diff on all 26 numbered files and both share builds after each: **24 of 24 mobile and
tablet files byte-identical, both share builds byte-identical, and exactly the two desktop
screens moved.**

| # | Change | Why |
|---|---|---|
| 39 | **The title block's lead becomes a token, and it moves from `.sheet` to the page's first child** | Seven of the ten screens are pushed pages, and a pushed page puts a back control above the object the page is aligned to, so a fixed 68 aligned the sheet to the wordmark instead of to the date on seven of twelve screens. **The rule is now stated once: the page's first object starts on the line of the title block's second object**, and the four cases are summed from tokens rather than typed. It moved off `.sheet` because the sheet is not always first: Ask puts its search row there, first run its opening line, the upgrade screen its progress bar. |
| 40 | **`.stack` is capped at 700 and centred, and its trailing notice with it** | `/talk`. A stack is width:100% of the page, which is 972 here, so the capture surface became a 972 by 96 letterbox and the permission cards set at about 138 characters a line. **700 is fix 3's composer, for fix 3's reason**, and both centre on 912. `width:100%` is not optional and is **revision 20 in a third costume**: an auto margin in the cross axis cancels stretch. |
| 41 | **`.page.split` takes a `.panel` in its second column, and every item start-aligns** | `04-ask`, and it is **§13.2 arriving at the screen that was told to build it**. No new component: G1 `.panel` is the citation footnote already; here it stops sliding over and sits beside. It gives up its absolute positioning, its fill and its top hairline, because beside the page a block of page colour with one edge reads as an erased patch. `align-self:start` came from looking at the render: a grid item stretches to its row, so the answer's sheet grew 90px of empty ruled box under the note when the source column was taller. |
| 42 | **The weight is declared on the objects that can become the h1**, not only on `.wordmark` | Three of the ten screens have no wordmark, so the object that names the page becomes the h1 there. `.keybox .v` and `.glance` already compute 400; saying so is what stops them computing 700 the moment either is a heading, which is defect 2's fault exactly. |
| 43 | **`min-width: var(--tap)` on `.excerpt .when`** | **The one control revision 9 missed**, because every `.when` in the product was a date and a date is wide. The citation column dates an excerpt by its time, `22:10`, which measures **28.31 x 44**. A component rule, so all five platforms; every existing instance is already wider, and the pixel diff proves nothing moved. |
| 44 | **The panel follows the page at desktop too** | The states pack, which is the only screen that renders a panel. `.panel` is positioned against `.app`, and revision 22's tablet arithmetic is written in `--page-w`, which no longer describes anything here: it computed left 452 and right 428 for a page that runs 384 to 1440. **Third platform, same object.** |
| 45 | **The title block's second-row slot is sized to the widest date box in the product** | **Rule 7.6, and the fourth destination is what found it.** You is keyed `Keeping` and valued `Since March '26`: 298.33px of a 290px column, so it wrapped, stood 77 tall against 50, and pushed the destination row from 138 to 165. **This is §13.10's defect 1 at a different scale** — a box sized to the date it happened to contain. The right padding goes `--s8` to `--s5`, which leaves 9.67px of slack. It moves `01-today` and `02-timeline`, stated rather than found in a diff. |

### Revision 46, and one more change that needed no CSS at all

| # | Change | Why |
|---|---|---|
| 46 | **The index gives its spare width back to the record.** `.page.split` inverts to `1fr 340px` | **Client**: make the calendar about 80% of its size so the timeline has more space. **80% cannot be built.** A calendar is seven columns, so its cell is `(W - 2 border - 16 padding - 12 gap) / 7`, and 80% of 370 is 296, which puts the cell at **38.0px against a 44px floor**. The floor is binding on every file and H2 and §13.12 hold this component to it for a reason that got stronger at this platform: a day cell used to be a link to a day page and is now the control that drives the screen. **340 is the smallest the index can be**, and it puts the cell at **44.29**, which is the same 44.3 §3.3 tuned the mobile calendar to. That is **92% rather than 80%**, and it hands the record **30px**: the list goes 560 to 590. It applies to the answer's source column too, deliberately, because two different second-column widths on one pattern is the inconsistency this project keeps catching. |
| — | **Every memo row carries its time, on all three platforms.** No CSS: `.head.dated` has existed since revision 31 | **Client**, and it closes the carve-out §9.12 left behind. That decision moved the time into the recording head at session 6 and exempted `/talk`, on the argument that a capture state is not a row in the record. A memo is a memo: it now takes the same 58px left column a typed entry takes, on `/talk`'s kept and transcribing states and on the prototypes' Today. **The listening state is untouched**, because a recording in progress has no timestamp yet — it has an elapsed time, which is what `0:47` is. **A Timeline row that continues the day above still shows an empty column**, exactly as a typed entry in the same position does. |

### Revision 47, from the first native screen

**One revision, no new component, and the inventory stays at 37.** `.app.ios`, `.dest.tab`,
`.mast.collapsed` and `.page.scrolled` are all variant classes on existing components, which is
the `.app.clip`, `.crow.find` and `.page.split` precedent. **Verified by pixel diff on all 42
approved files: 42 of 42 byte-identical**, so the block is inert on all three web platforms.

| # | Change | Why |
|---|---|---|
| 47 | **§6 of `lock.css`, the native block, plus four native dimensions in §1.3 and two pieces of stage furniture in §2.1** | The whole native reflow. See §14. **It is a variant class rather than a fourth container query**, because the mobile app and mobile web are both 390 wide and no width query can separate them. The four dimensions are Apple's own numbers, not this project's: `--safe-t` 47, `--safe-b` 34, `--tabh` 49, `--navh` 44. **`--tap` was already iOS's number**, chosen off WCAG at the Stage 2 lock, so the accessibility floor needed nothing to meet the platform. |

**Five defects were found building it, and the order they were found in is the argument for
rendering, then measuring, then checking the parse.**

1. **A comment asserted a rule whose selector did not exist.** The block said the current tab
   keeps its `--block` fill; the selector was never written, so `background:none` from the
   four-class rule above it won while the base's `color:var(--paper)` did not lose. The current
   tab drew **paper on paper, 1.08:1**, on the one item in the bar that has to be legible.
   **Found by looking at the render.** This is revision 35's fault exactly.
2. **The sheet was shrinking instead of overflowing.** `.page` has a real height at native and
   `.sheet` is a flex item at the default `flex:0 1 auto`, so a day taller than the screen was
   resolved by compressing the sheet to **389.44 against a natural 813.13**, with its own rows
   spilling out of it. The render looked almost right because the page clips at the same line
   either way. **What gave it away was a hairline**: a shrunk sheet draws its bottom border just
   above the composer, so the screen said the day **ended** there, 400px early. A cut-off day and
   a finished day are different claims about the record. **Found by measuring.**
3. **A decorative element broke a structural selector.** The home indicator was the tab bar's
   last child, so `a:last-child` matched nothing: the You divider silently never drew, and the
   base's own `.dest a:last-child{margin-left:auto}` was disabled by the same span. **Two rules
   failed and the failure of one hid the failure of the other** — the four items divided equally,
   which is what the divider version wants anyway, so the bar looked correct. Now `:last-of-type`,
   and the span is the bar's first child.
4. **Ten lines of prose outside a comment discarded a rule.** Left in the middle of §6 with a
   stray `*/`. The parser threw away exactly one rule and changed nothing else, so every render
   looked right and all four mechanical checks passed. **The only symptom was a 1px border that
   measured 0.** This is why there is now a fifth check; see §10.
5. **`TIMELINE` clipped at 200% type.** One word needing 101px of a 97.25px column, and it is one
   word so it cannot wrap. **It was the equal division that broke, not the width**: the four
   labels come to about 301 of 390 at 200%. `min-width:min-content` keeps the columns equal while
   there is room and never narrower than their own label. **`.dest a` is `overflow:visible`, so
   it was spilling over its neighbour rather than clipping, and a clipping check could not see
   it.** Only asking each tab for its `scrollWidth` against its `clientWidth` found it.

**Two more that were not in a comp at all, both in the share-build generator.**

**The second run duplicated §6.** The generator cut the inlined lock at §5's closing brace, which
marked the end of the lock only while the lock ended there. Once §6 existed, re-running inserted a
fresh copy of the whole lock and left the previous §6 after it, so all three builds carried §6
twice with the stale copy winning on source order. **A boundary defined by "the last thing that
currently exists" stops being a boundary the moment something is added after it.** It now cuts at
the share-only banner, which is independent of how many sections the lock has.

**The first run broke the seam.** Regenerating the desktop share build put the
banner's `*/` immediately against the lock's own `/*` and ate one character, leaving `*///*`.
Two stray slashes at the top level make the parser discard the whole `:root` block, and the
build rendered **completely unstyled** — the session 6 BOM's exact signature, with no BOM.
**Caught by the pixel diff, which is what it is for**, and by re-rendering a suspected mover
rather than believing the first result: it produced a stable new hash five times, which is what
told it apart from the two states packs that flap.

### Revision 48, from the polish pass. It closes §9.14 and §9.17, and it is a MERGE

**§7 held the pass for one session and is gone.** It was a temporary section on exactly the terms
§5b to §5f were: nothing in it bound anything, it was scoped behind `.app.ip`, and it carried a
stated exit condition. **The client accepted the pass in full, so the exit was taken**: every
accepted rule moved into the base, `.ip` disappeared from the stylesheet and the markup, and the
37 copies were deleted. **Six temporary sections have now existed in this file and all six left by
their own stated exit condition rather than by being noticed later.**

| # | Change | Why |
|---|---|---|
| 48 | **The four §9.14 declarations and §9.17's two move into the BASE.** `.moodrow h2`, `.wordmark`, `.keybox .v` and `.glance` take `font-weight:400`; `.said .tcol` takes a bottom padding and `.said .ccol:not(.open)` centres; `.shead` and `.card h3,.card h2` take `font-weight:400`; `.card`'s heading selector takes `h2` as well as `h3` | **Client decision at session 10, reversing the session 6 decision to fix them at 1440 only.** It moves 24 signed deliverables on purpose. **Three of these were declared TWICE before it**, once in §5 for desktop and once in §6 for native, because each platform fixed them locally while the others were frozen; **both copies are deleted**. A defect fixed in three platform blocks was never a platform defect. |

**THE SHAPE OF THIS REVISION IS THE LESSON AND IT IS §12.6 ARRIVING FROM THE OTHER DIRECTION.**
The standing warning is about rules written against `.app` when they meant the page. This is the
same mistake in the other axis: **component rules written inside a container query when they
meant the component.** They rendered correctly on the platform they were written for and were
simply absent on the other two, which is why no check ever saw them and why the record had to
carry a table of which platform had which defect. **Ask which object a rule is about before
asking which platform found it.**

**While it existed it was a variant class, for §14.1's reason one section later.** The copies were
390, 834, 1440 and 390x844, which are the four widths the product already has, so no query could
have told a copy from its original. **A platform, or a pass, is a fact about the file rather than
about its measurements.**

**Most of the pass was never CSS at all, and that is worth keeping.** §7 only ever held the
declarations. **The `h1`, the `aria-pressed`, `<time datetime>`, the heading levels and the
missing landmark are all markup**, and a pass that had needed a declaration for any of them would
have been a pass that had misunderstood them. **Five of the seven changes touched no stylesheet.**

**The merge verified by control rather than by assertion.** All 43 files were rendered and hashed
before and after: 36 moved and **7 did not**, and the 7 are `08-first-run` on all three web
platforms and the three Todays at desktop and native, which are exactly the files whose only
changes were markup. **Their being byte-identical is what proves `<time datetime>`, the `h1`,
`aria-pressed` and `<main>` are visually inert.**

**And one apparent non-mover was a measuring artifact.** `tablet-web/03-talk` reported unmoved
because its permission cards sit **below the render crop** at that platform's height; probed
directly, its card headings are `h2` at 400. **A cropped render is not a whole file.**

**§9.17 IS THE FINDING WORTH KEEPING, BECAUSE IT IS §3.1 BEING TESTED RATHER THAN QUOTED.**
`.shead` and `.card h3` compute **700** while `.keybox .k`, `.mark` and `.dur` compute **400** on
the same tokens. §3.1 has no weight axis, so **the scale is not deciding this and the element is**.
The session 5 audit found the identical fault at `.moodrow h2` and never asked the question of the
other two, which is the same shape as rule 7.6 being measured on two destinations of four and
holding until You broke it. **A claim about a scale cannot be tested on one of its objects.**

### Session 8 made no revision, and that is worth one line

**The lock stays at 46.** Session 8 closed §9.15 and §9.13 and signed desktop off, and not one of
those needed a declaration: item 1 was markup on two comps, item 2 was one selector in each of two
share builds, item 3 was prose, and §9.13 was a rewrite of §3.2. **The only edit to `lock.css` was
a comment** — the 128-character correction — which is why all three share builds still render
byte-identically after it. **A session that changes the record without changing the stylesheet is
the shape a documentation pass should have**, and the pixel diff is what proves it was one.

**The memo timestamp is markup on nine files and it moved four renders**, which is the whole
cost: `03-talk` at 390 and 834, both of which are signed, plus the three prototypes and the
three share builds, whose changed screen is not the one a default render shows.
**Six waveforms were re-authored because of it and four more because of revision 46**, which
is §12.7 doing exactly what it was written for: taking 58px out of a row is a change to its
tick weight, and so is giving 30px back. Measured after: **1.7661 to 1.7727 across the
product** against the canonical 1.769, and 2.62 to 2.66 on the prototypes' own coarser pitch.

**Revision 45 is the one to read, because it is the only fault in this batch that could not
have been found any other way.** Rule 7.6 was measured on two destinations at session 6 and
held; it was still false. A claim about four screens cannot be tested on two, and the handoff
said so before the session started. **It is now measured on all four**, plus the four
destination screens inside the states pack and every destination in the prototype: wordmark
top 20 and 34 tall, second-row object top 68 and 50 tall, destination row top 138 and 234
tall, printed line top 372, and the page's first object top 68.

**Revision 39's specificity bug is worth keeping, because the pixel diff is what caught it.**
The lead was first written as a margin on `.page > :first-child` with a reset inside the split
block, and the reset lost: `.page.split > *` is three tens against the other selector's four.
Every number on Timeline stayed correct except the sheet, which dropped 68px. **The fix states
the rule once — `.page:not(.split)` — instead of undoing it later**, and does not depend on
source order.

**Revision 37 replaced an earlier 37 that was drawn and superseded inside the same session.**
The first one capped the calendar's columns so a single full-width calendar zoom kept the
tablet's 67.7 cell. It was built, rendered, measured and correct, and the client then asked for
the two views to sit together, which deletes the screen it was written for. **No file ever
shipped against it and `.cal` appears on no other screen**, so it is recorded here rather than
carried. The finding underneath it survives and is why the index is sized the way it is: a day
cell has a 44px floor, and a cell that follows the page width breaks either the floor or the
window's height depending on which way the width moves.

**Revision 35's defect is the one to keep, because no render could have shown it.** Fix 3, the
composer centring, had been written at the bottom of **§5f**, the impeccable review block, scoped
`.app.f` rather than `.app.f.ia`. It styled the signed copy correctly the whole time and probed
at the right number, **so every check passed over it**. It would have vanished the moment §5f was
deleted, which the sign-off procedure required, taking the composer off the sheet's axis on every
desktop screen. **Found by reading a section's stated exit condition against its selectors**,
which is not something the screen can be asked.

**Revision 35 also carries a working-practice note that cost two renders.** `Set-Content
-Encoding utf8` in Windows PowerShell writes a **UTF-8 BOM**. Harmless at the head of a linked
stylesheet, and destructive when that file is inlined into the middle of a share build: a stray
`U+FEFF` before the first rule makes the CSS parser consume `:root` as part of a bogus selector,
so **every token in the product disappears and both share builds rendered unstyled.** Caught by
the pixel diff, which is exactly what it is for. **Write CSS with a BOM-free encoding, and never
take a share build's render on trust after regenerating it.**

**Revision 34 is the one to read for what it did NOT do.** Two obvious moves were drawn at a
true 1440 and rejected on what the screen showed: **a wider page**, which puts the writing at
74 characters a line against 54, and **a wider gutter**, which would have made the writing
narrower at desktop than at tablet. Both are inside every tolerance the mechanical checks
measure. See §13.1.

**Revision 34 also produced a finding about the checks themselves.** `ch` overstates Constantia
by a factor of **1.303**: 1ch is 8.887px against a real average character of 6.821px. A page
that `ch` calls comfortable can be past the readable band. **Characters per line is the
instrument.** §13.1.

**Revision 31 is the one that says something about the checks.** It was not a rendering fault,
a contrast failure or a tap-target miss; **every mechanical check passed over it for two whole
stages.** It was a screen telling the reader something untrue about their own record, and the
only way it surfaced was reading the list zoom and the calendar zoom of one screen against each
other and against §8. **Content has to be checked against content, not only against the
stylesheet.** The same class of error was caught twice in Stage 3 and it has now been caught a
third time.

**Revision 31 also carries the §12.7 obligation with it.** `.wave` is
`preserveAspectRatio="none"`, so taking 59px out of a row rescales every tick in it. Every
waveform in a dated row is re-authored; ticks measure **1.766 to 1.774px against the canonical
1.769** on both platforms. A geometry change that silently changes tick weight is the same
defect §12.7 was written for.

**Revision 26 carries its own small lesson: a fix is a change, and a change gets the same
render-and-look pass as the thing it fixed.** Revision 25 was correct and shipped a new defect
in the same edit, on the one screen where looseness matters most.

**Revision 25 is the one to be embarrassed about, and it is worth saying why.** It was not
found by any of the four mechanical checks, by the geometry probe, by the greyscale pass or by
the tap-target measurement, because **nothing about it is out of tolerance**. Every number was
inside its floor and every rule in this document was technically obeyed. It was found by a
person looking at the screen and saying it felt inconsistent, which is the only instrument
that catches this class of fault. **A proxy value measured at one platform is not a rule, and
the way to tell the difference is to check what the proxy is a proxy FOR at every new width.**

**Revision 20 is the one worth remembering.** It was invisible on the screen that introduced
it and would have shipped as a layout bug on `/talk`, first run, the permission states and
every empty state. It was found by measuring four mastheads in a throwaway harness, not by
looking at the deliverable.

**Revisions 22, 23 and 24 share one cause and it is worth naming.** All three are objects
that were positioned or sized against **`.app`** when what they meant was **the page**. At 390
those are the same rectangle, so three latent bugs sat in the lock through all of Stage 3
without being wrong. The moment the page stopped being the app they all surfaced at once.
**Anything positioned against `.app` should be read as suspect at every new platform**, and
that is a check to run at desktop rather than a lesson already learned.

**Every one of the seven Stage 4 revisions lives inside the container query or is inert at
390. Verified by pixel diff on five mobile screens including the states pack: 0 differing
pixels of 1,974,000 on each.**

### The one deliberate tap-target exception

`.total a`, the unread clause on Timeline, is a link inside a body sentence and is covered
by the inline exception. It cannot be enlarged without breaking the rule that matters more:
the flow requires the number to be body text at the same weight as everything around it,
never a badge and never a button.

**It is one component drawn twice, at two widths, and both are under the floor.** Measured:
**116.69 x 17** on `02-timeline`, and **114.25 x 17** on `11-states`, where the day seven
account has its own smaller total. At 200% type they grow to 33px high and are still under
44. **These are the only interactive elements in the twelve screens under 44px, and they
are intentional.** Everything else measures clear at 390.

**One further exception, and it is furniture rather than product.** The three prototypes
carry an index of **21 chips** at **24px** high, in each file's own `<style>` block. They are
how a reader gets around a walkthrough; they are not part of any screen and they do not
ship. Recorded here so that a floor check on those files has an answer rather than a
finding.

### Explicitly not in the inventory

Named so they cannot arrive by drift: tabs, accordions other than `.said`, badges, avatars,
tooltips, toasts, skeletons, spinners, carousels, chips that are not the mood row, cards that
are not `.card`, icon-only buttons other than `.play` and `.mic`, any second dialog, any
progress indicator that is not `.progress`, any illustration, any gradient, any shadow.

---

## 7. Component behaviour

States are **drawn, not behaved.** No JavaScript in any comp beyond what a compare page
needs. `<details>`/`<summary>` is markup and is allowed.

### 7.1 The product's note

Collapsed by default, on every screen, always.

- Shut: the row reads **`Read the note`** with a chevron. **The claim is not on the page.**
- Open: the label swaps to **`Hide the note`**, the chevron flips, and the note text, its
  citation and `That's not right` appear below a dotted `--grid` rule.
- Keyboard operation, focus and expanded state come from the browser, not from anything
  reimplemented.
- The label avoids the word AI. **`Note` is the product's own word for the object.**
- Every note carries **its evidence and a way to mark it wrong.** No exceptions. A note with
  no citation is not shipped.
- `That's not right` **visibly removes the claim** and leaves the excerpt, which was never a
  claim.

### 7.2 The recording

- Head is always in this order: play control, waveform, duration.
- The waveform is `aria-hidden`. The duration is the accessible information.
- The play control's `aria-label` states the duration in words: `Play recording, 2 minutes 41
  seconds`.
- **The head always carries the 58px column, on both tiers, on every screen.** Settled at
  session 6, closing §9.12, and **the last exemption was removed at session 7 by client
  decision**: `/talk`'s kept and transcribing states carry it too, so a memo is a memo
  wherever it is drawn. The capture surface, `.head.col`, is the only recording head without
  one, because a recording in progress has no timestamp yet. It holds the **time** on a day's screen and the **date** on Timeline, which is rule 4
  exactly. Before this the column existed only when a Pro transcript body was there to hold it,
  so **a Free recording row carried no time at all** while every entry around it did, and
  `00-flow.md` §1 defines a memo row as *date, duration, waveform, play control*. **No content
  was invented to close it**: the times already existed, one row lower.
- **Free has no transcript body.** The row is the head alone, now with its time. This is not a
  locked or blurred state and must never be drawn as one. It is a recording that has not been read.
- **Pro has the transcript body**, divided from the head by a `--block` rule, in `--paper-2`.
  **Its 58px column is present and empty**, because the time is a property of the recording and
  the head states it. Empty is not the same as absent: it keeps the transcript in the same
  column every other body of text on the sheet sits in.

### 7.3 The mood row

- Five chips: `Hard` `Low` `Even` `Good` `Light`. Words.
- Offered at the end of the day, **never required**, never nagged, no reminder.
- Selected state is `aria-pressed="true"` plus a `--rule` fill plus an inverted label. Three
  signals, one of which is not colour.
- Editable later, on the day page, which is the only place it changes after the fact.

### 7.4 The composer

**One filled control, two states.** Settled after the Stage 3 flow walk found that the typed
path could not be completed at all: the composer was a field, a record control and the
out-of-memory option, with **no way to commit what you had typed.**

| Field state | The control is | Reads |
|---|---|---|
| Empty, showing the prompt | `.mic`, the record control | a microphone glyph |
| Holding anything at all | `.send`, the commit control | the word **`Save`** |

Same height, same `--rule` fill, same radius. **The commit control is a word, not a glyph.**

It was drawn first as an arrow down onto a baseline, and the first person to look at it read
it as **download**, which is the one thing it must not mean. That is the whole argument: an
icon that has to be decoded is worse than a word that cannot be. This product already speaks
in printed labels everywhere else, `Upgrade`, `Export`, `Not now`, and `Save` belongs with
those rather than in an icon vocabulary invented for one control.

It also gives the control a real accessible name instead of one bolted on with `aria-label`,
and it survives a user who has never seen the icon before, which is every user once.

The mic stays a glyph because a microphone has no short word, and because it is the one
control in this product whose meaning is genuinely universal.

Measured at 390: **56x50**, against a 44px floor, leaving the field 278px.

- **Never a third permanent button.** The empty state is most of the life of this screen, and
  a send control sitting dead in it is wrong more often than it is right.
> **BUILD OBLIGATIONS. Recorded here because a comp cannot carry them, and every one of
> them is a thing that is right in a static file and wrong in a running product.** Six.
> Two came from review; four arrived with the motion system at revision 49.
>
> 1. **The composer's placeholder is its only label.** Correct in a comp, where the field is a
>    `div`; **an accessibility failure in the build**, where it is an `input`, because a
>    placeholder disappears on focus and is not a reliable accessible name.
> 2. **Timeline's index must scroll without pushing a history entry.** §13.12. The comp draws
>    `href="#id"` because that is the only mechanism a static file has, and `00-flow.md` §2 is
>    explicit that moving around inside one screen must not fill the back stack.
> 3. **The composer's fourth movement can only be built, never drawn.** §7.7 says the composer
>    moves on four occasions and no others, and the fourth is *interacted with while tucked*.
>    It is implemented as `:focus-within` scaling `--g-tuckable` from 1 to 0. **In every
>    numbered comp the field is a `div` and cannot take focus**, so the fourth occasion is
>    unreviewable in 36 of the 39 files that were signed off, and only reachable by keyboard
>    in the three prototypes. **Build it and check it against the rule**: tucked and
>    interacted with, it rises; already up and interacted with, it does nothing.
> 4. **A back navigation must not replay a load.** The prototypes replay on back, because a
>    screen is `display:none` until its hash targets it and an element going from `none` to
>    `block` starts its animations. **That is the only mechanism a no-script prototype has and
>    it is not the behaviour.** A back navigation returns to a screen that is already drawn.
> 5. **A second state of one screen is not an arrival.** Typing into the composer and pressing
>    Save both stay on Today, so the composer must not re-enter. The prototypes model this
>    with `.restate` and a duplicated screen, both of which are prototype furniture. **The
>    current handover fixtures suppress all four arrival effects on `.restate`, including
>    their signed-in copies. A production router must preserve the actual screen instance.**
> 6. **Nothing that exists to make a comp reviewable may ship.** `overflow:clip` on `.app`
>    exists because a comp's document is as long as the day and nothing else clips the tucked
>    composer; in the product the viewport does it. `.restate` is derived from prototype hash
>    navigation. **Both review hatches are already deleted and must not come back.**
>
> **And one thing that must NOT be tidied.** `.gline` and `.lblbox` look like wrappers and are
> load bearing. `.gline` is the mark that says a printed line is the product speaking; Ask's
> restated question sits in the same slot without it and therefore does not type. **Deleting
> it makes the product type the user's own words**, which §7.7 forbids outright.

- **The cost, accepted and recorded:** the mic is unreachable mid-draft, so someone who starts
  typing and then wants to record has to clear the field. Rare, recoverable, and it buys the
  two-tap typed path §3.3 requires.
- The field stops being `.placeholder` once it holds content, so the text is `--ink` rather
  than the quieter printed grey. That is the same rule as everywhere else: **the user's words
  are ink.**
- **Never autofocused.** An unrequested keyboard on open is an ambush.
- Both controls are `--rule`, not `--block`, because `--block` marks audio that exists rather
  than the act of making it.
- `Keep this out of memory` is present in the composer on every tier.
- The draft persists on every keystroke, so **Back never raises a confirmation.**

### 7.5 Hover, active, disabled

- **Hover is `--block`.** One hover colour, product-wide. Comps are drawn at rest.
- **Pressed uses `scale(.97)`**, with a 160ms press and 280ms release on `--gc`, matching the completed C3 implementation. Transform only; layout is unchanged. This supersedes revision 38's 1px downward translate. Reduced motion in production makes the state change immediate.
- **There is no disabled state anywhere in this product.** Nothing the user might reach for
  is greyed out. If something cannot be done yet, the screen says so in a sentence.
- Focus is `2px solid --block` at `2px` offset, product-wide, one treatment.

### 7.6 The masthead is the same height on every destination

**The destination row sits at exactly 124px from the top of the app, on every screen that
has one.** Nothing above it may vary.

The masthead has two rows. The wordmark is 34px on all of them. The second row is a
different object on each destination, and each had its own natural height:

| Destination | Second row | Was | Now |
|---|---|---|---|
| Today, You, first run, **Ask** | `.keybox` | 48px | **50px** |
| Timeline | `.seg` | 46px | **50px** |

**Revision 27 removed the only exception.** Ask used to carry `.crow` holding `.field` here,
which was the one interactive text input in any masthead in the product. It now carries the
same date box as Today and You, and its search field sits below the destinations. Three of the
four destinations are a `.keybox`, the fourth is a `.seg`, and both are printed objects.

That put the destination row at 186, 184 and 188. **Switching destinations nudged the whole
page by up to 4px**, which reads as the interface twitching rather than as anything meant.
All three are pinned to `--ctl`, the height the composer control already uses, so nothing had
to shrink to agree.

Two subtleties worth keeping, because both cost a measuring pass to find:
- The height lives on the **container**, never on its children. Putting `--ctl` on `.seg`'s
  buttons pushed the control to 52px, because a child's min-height sits inside the parent's
  1px borders. `align-items: stretch` fills them instead.
- `.keybox .v.printed` has **no vertical padding** and centres. With padding its content came
  to 50.8px, which is invisible on one screen and a visible twitch between two.

**This applies to destinations.** A pushed page carries a back control above the wordmark and
is legitimately taller, because you arrived there rather than switched to it.

### 7.7 Motion

> **This used to be the second section numbered 7.6 in this document.** The masthead
> height rule above carried the same number and §7.5 sat between them, reported across
> four sessions and never fixed because three documents cited "7.6" for both. **It is
> renumbered here.** Anything you find elsewhere citing §7.6 about motion means this
> section; anything citing §7.6 about the masthead means the section above.

**The motion system is C3 glide and it is MERGED INTO THE BASE at `lock.css` revision 49,
section 3.9.** It is component behaviour, so it lands on all five platforms from one
declaration, exactly as the pressed state did at revision 38. The argument that produced
it is §15; the rules are `lock.css` §3.10; the reduced-motion behaviour is §3.13.

#### What may move

**Four objects move anywhere in this product, and every one of them is the product doing
something rather than the record being disturbed.**

| | object | rate, and what bounds it |
|---|---|---|
| 1 | **the date, written by hand** | one character a frame at peak. `--g-date` **500ms**, derived from the widest date in the product, `07-you`'s `Since March '26` at 225.2px over 15 characters |
| 2 | **the printed line, typing** | 17.08ms a character. `--g-type` **820ms** at `steps(48)`, derived from the longest printed line, Timeline's total at 48 characters |
| 3 | **the waveform, drawing** | 45px a frame at peak. `--g-wave` **360ms**, and **520ms at desktop**, where the widest row is 788.3px |
| 4 | **the composer, rising** | **64px** over `--g-comp` **240ms**, bounded from both sides: 45px a frame below, the sub-pixel rule above |

**THE RECORD NEVER MOVES AND THE HEADER NEVER ARRIVES.** Every word the user wrote, the
wordmark, the destinations and every printed object that is not one of the four above is
at full opacity and unmoved at the first paint, on every screen.

**Today's load ends at 1320ms** and is the only screen carrying all four objects.
**`10-settings-privacy` carries none of them and has no load motion at all**, which was
measured rather than designed.

#### What may not move, and these are the binding clauses

- **Nothing the user wrote.** Not an entry, not a transcript, not a restated question.
  This is why `.gline` exists: it marks the product's own voice, and Ask's restated
  question deliberately does not carry it.
- **No motion on the crisis path**, in any state, at any tier.
- **No motion on `.progress`.** The transcription bar is still, which the component
  inventory requires in F4.
- **No ambient loop, and specifically no breathing record control.** A control that moves
  while nobody is touching it is a control that is asking, and this product does not ask.
- **No curve that draws attention to itself.** `--gc` is symmetric, peaks at **1.72x** its
  own average, and does not overshoot.
- **Nothing that is not one of the four objects above.** A fifth moving object is a
  revision to this section, not a screen decision.

#### The ceilings, rewritten

**This section used to say nothing longer than 160ms and nothing that moves more than
`--s7`.** Both were written before anything moved and neither survived contact with a
measured system. They are replaced rather than relaxed:

- ~~**Nothing longer than 160ms.**~~ **Every duration is derived from its own object's
  distance against a stated speed, and the speed is the rule rather than the clock.** The
  four rates are in the table above. 160ms was a number nobody had measured; a speed limit
  is checkable on a screen that did not exist when the rule was written. **The longest
  single move is the printed line at 820ms** and it is longer *because* it is slower.
- ~~**Nothing that moves more than `--s7`.**~~ **A move may travel as far as its own
  object's reason, and no further.** The composer's **64px** is the measured distance from
  the out-of-memory option's top to the composer's bottom edge; it hides exactly that
  option and nothing else. The note's content lifts **20px**, which is `--s7` exactly. **A
  distance that is not derived from something on the screen is not allowed**, which is the
  clause that actually does the work the 20px was reaching for.
- **The overshoot clause is unchanged and is satisfied.**
- **The clause forbidding motion on anything the user wrote is unchanged and is
  satisfied.**
- **The clause forbidding motion on the note is DELETED.** The note now opens by moving:
  its content lifts 20px opaque over `--g-note` 420ms, and the two labels roll through one
  clipped slot on the same clock. **The reason the original clause existed was that a
  disclosure travels by its own content height**, about 122px, which no rule could bound.
  That is still true and is still not animated as a distance: the height growth is
  `interpolate-size`, it is **Chromium only**, and where it is missing the row simply steps
  open. What is animated everywhere is the 20px lift and the label roll.

#### Reduced motion, and it is this product's rule rather than the industry's

**Remove the motion entirely rather than shortening it.** The usual advice is that reduced
motion means gentler motion; this lock says remove it, and the lock wins. Under
`prefers-reduced-motion: reduce` every screen draws finished and still, with no fade.

**The pressed state is deliberately kept**, on §7.5's own reasoning: a press is a *state*
rather than a transition, so with the transition gone it becomes instant, which is right
for a reader who asked for no motion and still needs to know they hit the control.

**There is no hatch and there must never be one.** While this was temporary, `:target` and
`.mo` could suspend the reduce block so the work could be reviewed on a machine with
Windows animation effects off. **Both died at the merge.** A shipped product does not
overrule the reader's own setting. **Animation effects being off is an ordinary system
state**, chosen for battery, for older hardware or for motion sensitivity, so a real share
of users will get none of this — which is the correct behaviour and is also the argument
for a system whose character does not depend on motion.

#### Two engine facts the build inherits

1. **The composer's scroll tuck is Chromium only.** Gecko has no scroll-driven animation.
   **No fallback is declared, deliberately:** where the timeline is missing the composer
   simply stays open, which is the screen complete rather than approximated.
2. **The note's opening height growth is Chromium only**, `interpolate-size`. Four
   mechanisms were built for it and all four were backed out, each for a measured reason;
   the table is §15.11i. **Do not pay for them again.**

**Neither is a bug to fix.** A build that "fixes" either one is reversing a decision.


---

## 8. The sample content set

**Written once, reused verbatim.** Promoted from direction-lock.md §8 without rewriting. Do not
paraphrase, do not improve, do not regenerate. If a screen needs new content, **add to this
list rather than inventing in place**, and record the addition here.

**Working date: Sunday 9 August 2026.**
**Recurring threads:** waiting to hear about a flat; sleep; a friend, Priya; a canal walk and
two swans.

### Today

- **Wordmark:** `Journal`
- **Destinations:** `Today` · `Timeline` · `Ask` · `You`
- **Date box:** label `Day`, value `Sun 9 Aug '26`
- **Glance line:** `Sleep has come up on four of the last six days.`

**09:20, written**
> The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until
> Tuesday. That lasted about an hour. I keep opening the email to check I read it right.

**Note, from your record** (cite `12 March`, action `That's not right`)
> You wrote something close to this in March, about the job. That you'd decided not to think
> about it until Thursday.

**14:05, spoken, 2:41** (waveform, play control)
> Walked the canal as far as the second bridge and back. Didn't listen to anything. There were
> two swans that have been there all summer and I've never once seen them move.

**Note, from your record** (cite `3 July`, action `That's not right`)
> That stretch of canal is in your entry from 3 July too. What keeps taking you there?

**21:40, written** — marked **Private / out of memory** in every file that renders that state
> Priya rang. We talked for an hour about nothing. I'd forgotten that's a thing you can do.

- **Mood:** heading `How was today?`, options `Hard` `Low` `Even` `Good` `Light`
- **Composer:** placeholder `Add to today`, secondary `Keep this out of memory`, primary is
  the record control

### Timeline

- **The only number in the product**, between two rules, in body text:
  `148 entries, 31 recordings, 4h 12m not yet read.` The last clause is a link to `/you/plan`.
  It only rises. No badge, no colour, no countdown, no offer language. **On Pro the clause is
  absent**, because nothing is unread.
- **Footer:** `Since March 2026`

**August 2026** (newest first)

| Day | Items |
|---|---|
| Sun 9 | written (the flat), spoken 2:41, written (Priya, Private) |
| Sat 8 | spoken 5:08 |
| Thu 6 | written: `Slept badly again. I've stopped counting which night this is.` |
| Wed 5 | spoken 11:47 |
| Mon 3 | written: `Went in early to avoid the heat. Nobody else in the office until ten.` |
| Sat 1 | written: `Bank holiday. Did nothing on purpose and it took most of the day to stop feeling odd about it.`, spoken 3:26 |

**July 2026**

| Day | Items |
|---|---|
| Thu 30 | spoken 6:33 |
| Sat 25 | spoken 14:02 |
| Tue 21 | written: `The flat viewing. Smaller than the photos, better light.` marked `Day One` (imported) |
| Fri 17 | written: `Last day before the shutdown. Everyone left early and the building went quiet by three.`, spoken 9:15 |

**Durations are deliberately long.** 31 recordings totalling 4h 12m means an ~8 minute
average, so short memo durations would contradict the tally. Keep this in mind when adding
recordings.

> **This table is the record, not the row list.** Clarified at session 6. Timeline draws a
> window onto 148 entries and cannot draw all of them, so the comps render **August in full and
> July from the 21st**: Tue 21 and Fri 17. `Thu 30`, `Sat 25` and Fri 17's `9:15` are part of
> the record and are not drawn, which is what a scrolling list does. **All three platforms draw
> the same window**, so no screen contradicts another. Anything that cites a July date may use
> the whole table; anything that draws Timeline draws the window.

### 8.0 Additions made during Stage 3

Added under the rule above: **add to the list rather than inventing in place.** Same threads,
same date, same register. Verbatim from here onward.

**Voice capture, `/talk`**
- Elapsed `0:47`. Controls `Stop and keep`, `Pause`.
- Free foot line, said once and never repeated:
  `Kept as audio. Pro turns your recordings into text you can read and search.`
- Pro state line, plain text and never animated: `Transcribing.`
- Permission not yet granted: `Your browser will ask before anything is recorded.`

**Ask, `/ask`, free**
- Query `swans`. Count line: `3 entries match.`
- Second line: `31 recordings are not searchable. Pro turns them into text.`
- Third line: `Reading across your entries is Pro.`
- **The three results, in the order they are drawn.** `Sun 9 Aug` is Today's canal entry,
  verbatim. `Fri 3 Jul`: `Walked to the canal after work. The swans were exactly where they
  always are, which I found more reassuring than it probably is.` `Sun 14 Jun`: `Took the
  long way round past the water. Two swans and a heron that left before I got close.`

> **The third result was invented in place during Stage 3 and is recorded here at session 7,
> under the decision session 6 already took on this exact class of item: correct the content
> set to match the comps rather than the other way.** The count line says three entries match
> and this list gave one, so a reader checking the screen against §8 would have found the
> screen right and the list short. It is identical on all three platforms, so no screen ever
> contradicted another and nothing stated anything untrue. Same gap, same cause and same
> remedy as `06-conversation`'s fourth turn.

**An answer, `/ask/{id}`, Pro**
- Question: `What do I write about when I can't sleep?`
- Excerpts: `Thu 6 Aug` (`Slept badly again. I've stopped counting which night this is.`) and
  `Wed 24 Jun`: `Awake again at three. I've started reading rather than pretending.`
- Synthesis, held to counts and a question:
  `Sleep is in eleven of your entries since June. Nine of the eleven were written after ten
  at night. Is it the sleep you're writing about, or the hour?`
- `That's not right`

**Weekly reflection, `/reflection/2026-w32`, Pro**

> **Corrected during the Stage 3 build.** The first draft of this entry said `five of the
> seven days, and recorded on two`, and cited the flat coming up `on Sunday and on Tuesday`.
> Neither survives a check against the timeline above: week 32 is Mon 3 to Sun 9, which holds
> writing on Mon 3, Thu 6 and Sun 9, and recordings on Wed 5, Sat 8 and Sun 9, and there is no
> Tuesday entry at all. **A reflection that miscounts the record is the single worst thing
> this product can ship**, because counts are the confidence tier it leans on hardest. Every
> figure below is now verifiable from the set.

- Key `Week 32`, value `3 to 9 Aug`
- `You wrote on three of the seven days, and recorded on three.` (no citation: it is a count
  of the record itself, not a claim about anything in it)
- `Sleep came up on Thursday. It has come up on four of the last six days.` cite `6 August`.
  The second clause is the same count the glance line on Today carries, deliberately, so the
  two screens cannot contradict each other.
- `Your longest recording this week was Wednesday, at 11 minutes 47. Is it the sleep you're
  writing about, or the hour you're writing at?` cite `5 August`. Against 5:08 and 2:41.
- `That's not right`, once, at the foot. A reflection is one object, so it gets one
  correction control rather than three.
- Consent restated at the foot: `You asked for this once a week, on Sunday evenings.` action
  `Change that`

**A past conversation, `/e/{id}`, Pro**
- Key `Day`, value `Thu 6 Aug '26`
- 22:10, written: `Slept badly again. I've stopped counting which night this is.`
- The product, cite `2 August`: `You said something like this on the second. That week you
  put it down to the heat.`
- 22:14, written: `Maybe. It was cooler last night and I was still awake at three.`
- The product, no cite: `What were you awake about?`
- 22:21, written: `The flat, mostly. And whether I'd have said yes to it if the light had been
  worse.`
- **Mood: `Low`, selected.**

> **The last two lines were invented in place during Stage 3 and recorded here at session 6.**
> They are identical on all three platforms, so no screen ever contradicted another and nothing
> stated anything untrue; it was a documentation gap rather than a content error. **§8's rule is
> add to the list rather than invent in place**, and this is the list catching up. Recorded
> rather than removed, because three built platforms already carry them and the day reads better
> for having an ending.

**Account, `/you`**
- Rows: `Plan` / `Free` · `Privacy` / `Plain sentences` · `What the model can see` / `Nothing`
  · `Your data` / `Import, export, delete` · `Trackers` / `Mood only` · `Notifications` /
  `Pro` · `Account` / `mubeen@example.com`
- Footer `Since March 2026`

**First run, `/` logged out and cold**
- `A private journal.`
- `Write it, or say it out loud.`
- `Pro reads it back to you.`
- Prompt in the composer: `What's today been like?`
- Third: `Bringing a journal with you? Import it.`

**Plan and upgrade, `/you/plan`**
- Key `Not yet read`, value `4h 12m`
- `You have 4 hours 12 minutes of recordings that have never been read.`
- `Pro turns all of it into text you can search, including everything you recorded before
  you upgraded.`
- Key `Pro`, value `$9.99 a month, or $99 a year`
- `Pro also holds a conversation, reads across your whole record, and writes one reflection
  a week. None of that can be shown to you before you pay for it, so it is listed here
  rather than demonstrated.`
- `Prices are lower where incomes are lower. If money is the reason you cannot, take the
  reduced rate. There is no form and nobody is told.`
- `Export stays free forever, including after you cancel.`

**Privacy, `/you/privacy`, and what is visible, `/you/visible`**
- `What leaves this device` / `On free, nothing.`
- `Who processes it` / `On Pro, Anthropic, to answer you. Nobody else.`
- `Training` / `Your writing is never used to train anything.`
- `Retention` / `Until you delete it. Then it is gone, not hidden.`
- `/you/visible`, free: `Nothing. No model runs on your account.`
- `/you/visible`, Pro: `Everything except the 4 entries you kept out of memory.`

**States pack**
- Empty today: `What's today been like?`
- Day seven, thin: **four rows and three unmarked days**, footer `Since 3 August 2026`.
  **This account is seven days old, so it is not the 148-entry record**; its own total is
  `3 entries, 1 recording, 5m 08s not yet read`, and the four rows are what that total counts:
  - Sun 9, written: `Tried again with the flat people. No answer, which I have decided is not
    an answer.`
  - **Sat 8, spoken, `5:08`** — the same recording this set gives that date everywhere else,
    and the row the total's one recording and five minutes refers to.
  - Wed 5, written: `Nothing much. Wrote this so there would be something here.`
  - Mon 3, written: `First proper go at this. Felt strange talking to a page.`

  > **Two corrections here, both made at session 8, and both are this list catching up rather
  > than the comps being wrong.** The footer read **`Since March 2026`** in this section and
  > `Since 3 August 2026` in all three comps: an account on **day seven** cannot have been kept
  > since March, so the comps were right and the entry had been copied off the main record's
  > footer. And **the four rows were invented in place during Stage 3 and never recorded here**,
  > which is the same gap as `06-conversation`'s last two lines and Ask's third result, closed
  > the same way — **correct the content set to match the comps rather than the other way** —
  > because three built platforms already carry them and nothing in them states anything untrue.
  > **What was untrue was the count**: 390 and 834 drew three rows against a total saying four
  > objects, and §9.15 item 1 is that defect. Fixed on both at session 8 by client decision.
- Free recording, no transcript: the head alone, `5:08`.
- Guest strip: `Kept in this browser until 16 August.` action `Keep this`
- Offline: `Saved on this device. It will upload when you are back online.`
- Below the minimum entry count: `A few more and I can start looking at your month.`

> **`Free recording, no transcript: the head alone, 5:08` was wrong and was corrected at session
> 6.** That state is drawn under the heading **Today, on free**, and `5:08` is **Saturday the
> 8th's** recording: §8's own timeline gives Sunday the 9th exactly one recording, the `2:41` at
> `14:05`. **A screen was putting a Saturday recording on Today's sheet**, which is the same
> class of fault as the Timeline misattribution revision 31 fixed and as the reflection that
> miscounted the week. It could not be closed by editing this list, because no wording here can
> put a Saturday recording on a Sunday. **The state now draws today's recording, `14:05`, `2:41`,
> the head alone**, and it is the fourth time reading content against content has caught
> something no mechanical check can see.
- Crisis card: heading `If you want to talk to someone`, body `Samaritans are open all night,
  every night, on 116 123. Calling is free and they will not ask your name.`, action
  `That isn't what this was`
- Delete dialog: `Delete everything?`, body `This removes 148 entries and 31 recordings from
  every device. It cannot be undone. Export first if you want a copy.`, actions
  `Export instead` and `Delete everything`

### 8.0b Additions for the four screens added after the flow review

**Microphone permission, `/talk`**
- Not yet granted. Key `Microphone`, value `Not yet allowed`.
  `Your browser will ask before anything is recorded.`
  `Nothing is sent anywhere. Recordings are kept on your account and, on free, are never read
  by anything.` Action `Allow the microphone`, secondary `Write instead`.
- Denied. Key `Microphone`, value `Blocked`.
  `Your browser is blocking the microphone for this site.`
  `We cannot turn it back on from here. It is in your browser's settings for this site,
  usually behind the icon next to the address.`
  `You can still write, and nothing about your account needs a microphone.`
  Action `Write instead`.
- No microphone. Key `Microphone`, value `None found`.
  `No microphone found on this device.`
  `You can still write, and everything else works.` Action `Write instead`.

**Transcribing the backlog, after upgrade**
- Key `Transcribing`, value `19 of 31`
- `Reading your recordings. 19 of 31 done.`
- `Most recent first. You can leave this and come back, and it keeps going.`

**The first Pro session.** The only demonstration in the product. It leads with the user's own
words, never with the observation.
- Key `Transcribed`, value `31 recordings`
- Heading `From your recordings, now readable`
- The passage, recorded 12 March and never read back:
  `I keep saying I'll ring Priya and then not doing it. I think I'm frightened she's moved on
  and will be polite about it.`
- The note beneath it, cite `12 March`, action `That's not right`:
  `You recorded that in March and have never read it back. Priya is in nine entries since.`
- The proof the archive changed: the memo of `Sat 8 Aug, 5:08` now carries its opening line,
  `Got the tram out to the end of the line for no reason and walked back along the water.`

> **Integrity note, and it nearly went wrong.** The obvious next sentence for that note is
> that the user rang Priya today. **It must not be written**, because the 21:40 entry on
> 9 August is marked out of memory, so the model cannot have read it. A synthesis that cites
> an excluded entry would break the one promise `/you/visible` makes, on the first screen the
> user sees after paying. **Every observation must be checked against what the model is
> allowed to have seen, not only against what is in the record.**

### 8.1 Register, binding on every word written into a comp

- The AI's register is **unexcited**. **An exclamation mark in sample copy is wrong.**
- Confidence tiers, never exceeded: **counts**, **juxtapositions**, **questions**. **Never a
  causal claim.**
- **Nothing may read as an AI product.** No sparkles, no gradient assistant chrome, no typing
  dots, no persona avatar. **The product never calls itself AI in the interface.**
- **No streaks, no chains, no counter that can reset, no red for absence.** One monotonic
  total.
- Nothing anywhere says `it's been a while`, `welcome back`, or counts days missed.
- **No em dashes and no en dashes in visible copy**, in any file. Mechanical check in §10.
- **The Free line on `/talk` is shown on the FIRST recording only.** The flow says stated once
  and never nagging. Comps draw it present because a comp draws one state; the build must
  condition it. Drawn on every capture, it stops being a fact and becomes a nag.
- **Ask carries one notice, not two.** Two stacked blocks about Pro under a working search read
  as a pitch; one block stating two facts reads as a fact.

---

## 9. Dark mode, and what deferring it costs

The engagement rule said dark would be settled here with both grounds as tokens in
`lock.css`. **The client chose light only, with dark revisited at the native passes.**
Honoured, and recorded as a decision rather than an oversight.

The cost is real: eleven mobile web screens, then tablet and desktop, all get built before
anything checks whether the direction survives a dark ground. The likely failure is not the
text. It is **the graph ground and `--block`**, both of which invert badly. A dark graph rule
on a dark paper either disappears or becomes noise, and a dark green block on a dark ground
stops being the most present object on the page, which is the whole reason it is filled.

**One rule makes the retrofit a one-file change, and it is now the most important rule in
`lock.css`:**

> **No Stage 3 file may contain a colour literal.** Every colour goes through one of the
> eight roles. No hex, no `rgb()`, no named colour, no `color-mix()`, anywhere outside
> `lock.css`. Two exceptions, both outside the product: the `.stage` furniture and the
> browser chrome mock.

When dark arrives it is one added block in `lock.css` and zero edits elsewhere. **Verified by
grep, in §10.**

---

## 10. Checks that run before any Stage 3 file is reported done

All five are mechanical, and all five run from the folder this file sits in.

**1. No external references, and no dashes in copy.** PROJECT.md §9.

```
grep -c "http://\|https://\|@import\|—\|–" *.html | grep -v ":0"
```

**2. No colour literal outside `lock.css`.** New at this lock, and the thing that makes §9
survivable.

```
grep -nEi "#[0-9a-f]{3,8}\b|rgb\(|hsl\(|color-mix\(" *.html
```
Expected output: only matches inside a `.stage`, `.device`, `.chrome` or `.caption` rule.
Anything else is a defect.

**3. Render it and look at it.** Headless Edge, at 470 wide so the 390 device plus its stage
padding fits.

```
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new \
  --disable-gpu --hide-scrollbars --window-size=470,1500 \
  --screenshot=OUT.png "file:///.../mobile-web/01-today.html"
```

**Headless reports `prefers-reduced-motion: reduce` by default**, so a default render is the
reduced-motion rendering and draws every screen finished and still. That is the honest
default and it is what a machine with animation effects turned off actually shows. **To see
the motion, add `--force-prefers-no-reduced-motion`** — and a render taken with a flag that
changes what the design does is a render of a different design, so report both.

**Anything touching motion gets run in Gecko as well.** Two behaviours are Chromium only,
by design: the composer's scroll tuck and the note's height growth. Firefox headless needs
the URL BEFORE the `-screenshot` flag and needs `-no-remote -profile`.

**4. Greyscale it.** Rule 1 says the ink and rust distinction survives greyscale, and rule
2.4 says colour never carries information alone. Both are checkable by desaturating the
screenshot and reading it.

**Two numbers this check protects that a contrast table cannot see**, measured off the signed
files at session 8 and re-measured on every new platform: **the product's voice sits 1.790:1
against the user's ink**, and **the recording's band sits 1.834:1 against the sheet** at a
relative luminance of **0.482**. Both are relationships between two inks rather than between an
ink and its ground. Measured on the mobile app at session 9: **1.78983, 1.8339 and 0.4821.**

**5. Check that `lock.css` actually parses. NEW AT SESSION 9, AND IT EXISTS BECAUSE OF A REAL
DEFECT.** Ten lines of prose were left outside a comment in §6, with a stray `*/`. The parser
discarded **exactly one rule** and changed nothing else, so every render looked right, checks 1
to 4 all passed, and the only symptom was a 1px border that measured 0. The same class of fault
at a larger scale is the session 6 BOM, which made the parser swallow `:root` and rendered two
share builds completely unstyled, and it recurred at session 9 in a regenerated share build with
no BOM at all: a seam of `*///*` discarded the whole token block.

Three things to assert, none of which a screenshot can show:

- **No BOM**, at the head of `lock.css` and at the head of every share build.
- **`/*` and `*/` balance**, and brace depth returns to 0 and never goes negative.
- **Every line outside a comment is CSS.** A line with words in it and no `{`, `}`, `:` or `;`
  is prose that escaped.

**And the in-page half of it: assert a computed value that only the new rules can produce.** A
discarded rule is invisible except by its absence, so the render is asked for the thing the rule
was supposed to do. The CSSOM cannot be used for this from a `file://` comp: a stylesheet loaded
from a different file URL is an opaque origin and `cssRules` throws.

---

## 11. What this lock does not cover

Stated so it is not mistaken for settled.

- **Dark mode values.** §9.
- **The name.** `Journal` is a placeholder and is recorded as unresolved, not chosen.
- **Native reflow.** Stage 5. What is fixed across all five
  platforms is this document: palette, type scale, spacing, radii, rule weights, component
  identity, information hierarchy, and the content in §8. What is allowed to change is
  layout, reflow, navigation chrome, platform furniture, and entry and permission moments.
  **Tablet is covered by §12 and is signed off. Desktop is covered by §13**, which rebuilt
  the two-pane argument from `00-flow.md` §3.5 rather than inheriting it, and landed on one
  page in a margin wide enough to hold a sheet. **The mobile app at 390x844 is covered by §14**,
  which is argued rather than assumed and is open at screen 1 of 12. **The tablet app at
  834x1194 is not covered by anything yet** and gets its own pass; what it inherits from §14 is
  the variant-class mechanism and §14.7's list, not its numbers.
- ~~**Motion.**~~ **COVERED. §7.7 is the rule and `lock.css` §3.9 is the implementation.**
  C3 glide is **merged into the base at revision 49** and lands on all five platforms. §15 is
  the argument that produced it and is worth reading before changing any duration, because
  every number in the system is derived rather than chosen. **What §7.7 does not settle, and
  what a build has to:** the four build obligations in §7.4 that arrived with it.
- **The mood row as marks.** Words are locked. Authored SVG marks remain the better long-term
  answer and are not being built.
- **Any component not in §6.**

---

## 12. Tablet web, 834. The reflow, and the argument for it

**Binding on every tablet screen.** Added at Stage 4. Nothing here overrides §1 to §8; it
says only what moves.

### 12.1 What tablet is not

**Not a big phone.** A 390 column centred in 834 is a phone emulator and leaves the reason
the width exists unanswered.

**Not a small desktop.** The flow gives no screen a second pane. The only place it argues
for one is `00-flow.md` §3.5, where a citation opens its source while the answer holds its
scroll position, and the brief assigns that depth to **desktop**. Three things resist a pane
at 834:

- Timeline's two zooms are **one screen behind a segmented control**. Drawing both deletes
  the control and the reason it exists.
- A Timeline standing permanently beside Today makes the word **destination** meaningless
  and breaks the Back rules in `00-flow.md` §2.
- 834 in portrait split down the middle is two 400px columns, which is two phones.

### 12.2 The one thing the width actually changes, and it is measurable

A single column run full width puts the user's words at **about 80 characters**. That is
past readable, on the highest-status content in the product. So the column is capped, and
the real question is what the rest of the width is for.

### 12.3 The answer, taken from the direction rather than from the width

**Tablet is the first platform where the whole page fits on the screen.** At 390 the graph
bleeds off every edge and you are looking at part of a page. At 834 the page has a width, a
binding down its left, a right edge where the graph stops, and the **generous cream margins
rule 6 has asked for since Stage 1**.

- **The page is 560px, exactly 40 graph modules**, so the ruling lands on its own edge
  instead of being cut mid-square.
- **The binding stays welded to the page**, not to the viewport. `.rail` is absolutely
  positioned in `.app`, so centring the page without moving the rail would strand the spiral
  125px from the paper it binds.
- **125px of unruled `--paper` each side.** The graph stopping is the page edge.
- **No right-hand rule.** Tried and rejected: it turns the page into a framed card and boxes
  the composer. A spiral notebook has one bound edge and one open one, and rule 5 puts the
  binding and the page edge on the left.
- **The page runs the full height**, with no top or bottom margin. A page longer than the
  window is what a notebook is, and a bottom margin under a sticky composer reads as a fault.

### 12.4 What the width does to the measure

|  | 390 | 834 |
|---|---|---|
| page | 366 | **560** = 40 modules |
| paper margin `--gut` | 14 | **28**. the module stays 14 |
| sheet | 338 | 504 |
| the time column | 58 | **58**, a fixed dimension, never reflows |
| the user's words | 250px, 28.1ch | **416px, 46.8ch** |
| its first line | 33 characters | **54 characters** |
| the product's note | 241.3px | **416px**, the same column as the writing |
| masthead | 124 | **80** |
| destination row top | 124 | **80**, equal on all four |

**The note tracks the writing. It was first built frozen at 241.3px and that was wrong.**
The argument for freezing it was that the hierarchy would get stronger at this width for
free. It does not: it produces a note that stops less than three fifths of the way across a
row whose fill and rules run the full width, which reads as text that failed to load rather
than as a measure. Worse, it makes the relationship between the two voices **different at
834 from what it is at 390**, and information hierarchy is one of the seven things the
engagement rules hold identical across all five platforms.

At 390 the note and the writing are the same width to within nine pixels. **At 834 they are
now the same width exactly**, which is the same relationship rather than a new one. The
hierarchy is carried where it has always been carried: 14px against 16.5px, `--rule` against
`--ink`, inside a labelled row with its own printed key, and shut until asked for. Four
signals, none of them measure. See §3.2 and `lock.css` revision 25.

### 12.5 The masthead is one row, and §7.6 still holds

The wordmark and the second-row object sit side by side, which buys back **44px of vertical
space** in a browser that has already taken its own. Rule 7.6 holds **by construction**: all
three second-row objects are `min-height: var(--ctl)` and the row centres on the tallest, so
the destination row sits at **80px on Today, Timeline, Ask and You alike**. Measured on all
four in a harness, not assumed.

Destinations take their own width instead of dividing the page. Four items stretched across
504px would be 126px of box around an 11px word.

### 12.6 It is a container query, and that is not a detail

**A media query compares the window.** Every Stage 3 comp is a 390px `.device` inside
whatever window the reader happened to open, so a media query would restyle the approved
mobile files into tablet layout the moment anyone opened one maximised. `journal-prototype.html`
is a file that gets sent to people.

**A container query compares `.app`**, which is 390 in a mobile comp and 834 in a tablet one
no matter how wide the window is. It is also the more honest statement of the rule: this
layout depends on how wide the **app** is, which in production is the viewport and in a comp
is the device. Pure CSS, no script, and it keeps the no-JavaScript rule intact.

**Consequence, and it constrains every future platform block:** an element cannot query
itself, so `.app` carries the container and **nothing in §4 of `lock.css` may style `.app`**.
Everything the tablet needs is expressed on descendants. Where that was awkward it was worth
it: see revision 20, where relying on flex `stretch` under an auto margin cost a measuring
pass.

### 12.7 The waveform is authored longer at tablet, and has to be

`.wave` is `preserveAspectRatio="none"`, so the viewBox stretches to the row. The row is
378.3px at tablet against 212.3px at 390. Reusing the mobile 240-unit wave scales every tick
by **1.78**, and the recording reads as a coarser object than the same recording on a phone.
**Component identity is binding across platforms and tick weight is part of it.**

Tablet authors **428 units and 61 ticks**, which holds the scale at 0.884 against mobile's
0.885: ticks land at **1.768px against 1.769px**, pitch 6.19px on both. Same recording,
sampled finer. Every tablet screen carrying a recording inherits this obligation.

**Amended at revision 31, and the amendment generalises the rule.** The obligation is not
"tablet authors a longer viewBox"; it is **any change to the width of a waveform's row is a
change to its tick weight, and the viewBox has to follow it.** Adding the 58px date column to
Timeline's recording rows took 59px out of four rows on each platform, which would have
rescaled every tick by about 0.83 had the viewBoxes been left alone. They were re-authored.
The measured set across the whole product now reads:

> **THIS TABLE WAS STALE AND IS NOW MEASURED. CORRECTED AT SESSION 8, ALONGSIDE §13.11's
> AND THE FOUR FILE HEADERS OF §9.15 ITEM 3.** It carried the figures as they stood before
> session 6 gave every recording head its own 58px column and before session 7 took that
> column into `/talk` and gave the desktop record 30px back. Nine of its twelve cells had
> moved. It also had **no desktop column at all**, on a document whose §13 is desktop.
> **Every cell below is read off the file rather than carried**, with the bar width read out
> of the markup rather than assumed: `.wave.big` is 3 units wide and every row wave is 2, and
> assuming 2 everywhere is a mistake this session's first harness made and the second caught.

| | mobile | tablet | **desktop** |
|---|---|---|---|
| Today, 2:41 | **1.7735** | **1.7696** | **1.7695** |
| Timeline, 2:41 · 5:08 · 3:26 | **1.7735** | **1.7696** | **1.7704** |
| Timeline, 11:47 | **1.7663** | **1.7711** | **1.7676** |
| States pack, 5:08 (day seven) | **1.7735** | **1.7696** | **1.7704** |
| States pack, 2:41 (free recording) | **1.7735** | **1.7696** | **1.7695** |
| Upgrade, 5:08 | **1.7735** was 2.654 | **1.7696** was 2.627 | **1.7695** |
| `/talk`, 1:12, kept and transcribing | **1.7661** | **1.7709** | **1.7726** |
| `/talk` capture, `.wave.big`, 3-unit bars | **3.1000** | **3.0909** | **3.0947** |

**Product-wide the row waves run 1.7661 to 1.7735 against the canonical 1.769**, which is
inside the 1.766 to 1.774 band this section holds them to, and the pitch is 6.18 to 6.21px on
every row on every platform. **The 11:47 is the low or the odd one on all three platforms for
the reason §13.9's corollary 3 gives**: its duration string is wider, so its row is narrower,
and a waveform sharing a row with a variable-length label has to be measured per row.
**One correction to the record while measuring**: session 7 reported the product-wide range as
1.7661 to 1.7727, and the true top is **1.7736** on mobile, which §9.12 had already stated.
The band still holds; the summary figure was 0.0009 short.

**The upgrade screen was the outlier and it was one on both platforms**, so the tablet pass
carried it faithfully rather than introducing it. It authored the Sat 8 memo at pitch 11 with
3-unit bars against pitch 7 and 2-unit bars everywhere else, which drew the same recording at
two different weights on the one screen whose whole job is to show that the archive changed.
It is now the Timeline pattern verbatim, because it is the Timeline recording. **Tick weight
is part of component identity across screens, not only across platforms.**

### 12.8 What tablet does not get

No new colour, no new content, no new component. The hand still appears **at most twice**.
The sample content set in §8 is unchanged and unextended.

---

## 13. Desktop web, 1440. The reflow, and the argument for it

> **DESKTOP IS SIGNED OFF AS A PLATFORM, AT SESSION 8, AND STAGE 4 IS COMPLETE.** All twelve
> screens, a 21 screen prototype and a share build, walked by the client. **§13 is now history in
> the same way §12 is**: binding on every desktop screen, and closed to new argument. What is
> still open on this platform is **§9.14**, which is a cross-platform item rather than a desktop
> one. **Session 8 made no CSS revision at all** — the lock stays at **46** — because everything
> it changed was markup, prose or a measurement. **Stage 5 is native and will need a §14**; it is
> deliberately not opened until a native reflow has been argued rather than assumed, which is the
> same discipline §13.2 followed when it refused to declare the margin sheet ahead of the screen
> that rendered it.

**Binding on every desktop screen.** Added at the second half of Stage 4. Nothing here
overrides §1 to §8; it says only what moves. §12 is the tablet reflow and was **not** treated
as a licence to assume it scales: the argument below was rebuilt from `00-flow.md`, four
candidate shells were drawn at a true 1440 and looked at, and two of the four were rejected
on measurements taken from the screen.

### 13.0 The conclusion, first, because it is short

**The page does not change at 1440. The margin does.**

The page keeps every dimension it has at 834: 560px wide, 40 graph modules, `--gut` at 28,
the sheet at 504, the writing at 416. What changes is the cream either side, which goes from
125px to **428px** and becomes the first margin in the product wide enough to hold a sheet.
That is where the flow's one desktop relationship lands.

### 13.1 What 1440 is not

**Not a wider page.** `--page-w` is a **proxy for a reading measure**, and the measure is the
rule. Re-derived at 1440 rather than carried:

| | the writing | first line, actual characters |
|---|---|---|
| page 560 | 416px | **54** |
| page 700, drawn and looked at | 528px | **74** |

54 is the middle of the readable band. 74 is past it, and it is past it on the highest-status
content in the product. **560 stands, and it stands for a measured reason rather than for
inertia.**

**`ch` disagrees with that, and `ch` is the one that is wrong.** In this document's own unit
those two are 46.8ch and 59.4ch, and **both** sit inside the 45 to 75 band §3.2 quotes.
Measured: Constantia at 16.5px gives **1ch = 8.887px** against a real average character of
**6.821px**, so `ch` overstates this face by a factor of **1.303**. Every `ch` figure in this
project is 30% optimistic, which is why a page `ch` calls comfortable reads as too wide.
**Characters per line is the instrument; `ch` is a convenience that has drifted from it.**
This is the same class of fault as revision 25 and it is recorded rather than quietly
corrected. It does not invalidate any shipped value: 32ch, 38ch and 34ch were all released
above the tablet threshold, and `.dialog .card p`'s surviving 38ch is a functional bound
rather than a measure.

**Not a wider gutter, and this is the trap in the pass.** `--gut` went 14 at mobile and 28 at
tablet, so 42 looks like the series continuing. It is wrong. **The gutter is inside the page
and the page is not getting wider**, so raising it takes the width straight out of the sheet:
the writing would fall to 388px and about 50 characters, **narrower at desktop than at
tablet**. That is an information-hierarchy change between platforms, which the engagement
rules forbid outright. `--gut` stays `--s8`. **A series is not a rule.**

**Not a permanent second pane.** Drawn and rejected. The candidate held the page at a fixed
left position with a 560px desk beside it, on the arithmetic that
`1440 - 24 = 560 + 42 + 560 + 2 x 127`, which is the tablet's own cream margin either side of
two pages. The arithmetic is real and it is what genuinely changes at this width; two panes at
834 are 250px each and narrower than the mobile column. It still fails, for a reason that only
appears when you draw it: **eight of the twelve screens have nothing to put on the desk**, and
the page cannot be centred on those eight and left on the other four, because **a page that
moves when you open a citation defeats the one thing the citation pane exists to do.** Rendered
with the desk empty, it reads as a page clinging to the left of a broken window.

**Not one row of chrome.** Also drawn and rejected, and this one is arithmetic. Moving the
destinations up beside the wordmark buys **58px** of the scarce vertical on every screen,
which is worth having. It does not fit: wordmark, four destinations and the date box need
**717px** of a **504px** row, so the date box overflows the page. It cannot be bought back by
widening the page, because 13.1's first table already forbids that.

### 13.2 What the width is actually for, and it comes from the flow

**The margin.** At 390 there is none. At 834 it is 125px and can only ever be a margin. At
1440 it is 428px each side, which is wide enough to hold a sheet at a comfortable measure.

`00-flow.md` §3.5 is the one place the flow argues for two things on screen at once: *tap an
excerpt, the source opens, and Back returns to the answer at its scroll position.* The same
relationship appears three more times as a Back rule in §2: Timeline to a day, Ask's results to
a result, a reflection's citation to the day it cites. On mobile and tablet the flow expresses
it as a history mechanic, because a page push is the only mechanism available. **The brief
assigns that depth to desktop by name:** *"Desktop earns its place through depth: longer
history, better search, the reading experience for going back through a year."*

At 1440 the relationship can be literal. **The citation opens into the right-hand margin, and
the page does not move by one pixel** — which is a stricter reading of the flow's own rule than
a history entry can give, not a looser one. `00-flow.md` §1 already files the citation footnote
as a **panel**, and G1 already says a panel slides over and Back closes it. At desktop it stops
sliding over and sits beside. That is layout and navigation chrome, both of which the
engagement rules allow to change per platform.

> **SUPERSEDED AT SESSION 6. THE GEOMETRY BELOW IS DEAD AND THE RELATIONSHIP IS NOT.**
> This section assumed 428px of cream margin either side of a 560px page. **The signed shell has
> no cream margin**: the graph bleeds to the right edge of the window, the sheet fills the page,
> and the chrome is a title block down the left. There is nowhere for a margin sheet to open.
>
> **What replaces it, decided by the client at session 6: the citation opens as a right-hand
> column, the same `.page.split` Timeline now uses for its index.** The answer holds the left
> column and the cited source opens beside it. **13.2's intent survives exactly** — the source
> opens beside the page and the page does not move by one pixel, which is a stricter reading of
> `00-flow.md` §3.5 than a history entry can give — and the product now has the pattern already
> rather than inventing one for a single screen. `.panel` is still the component; at desktop it
> stops sliding over and sits beside, which is layout and navigation chrome, both of which the
> engagement rules allow to change per platform.
>
> **BUILT AT SESSION 7, AND THIS ITEM IS CLOSED.** `04-ask` renders it and `lock.css` revision
> 41 declares it: `.page.split` takes a `.panel` in its second column, the panel gives up its
> absolute positioning and its fill, and the answer holds a 560 column whether anything is open
> or not. **Measured across both states: sheet x=426 w=560, every excerpt at an identical top,
> so the answer does not move when the source opens.** The delay was right twice over: the
> object first specified here was a margin sheet, `.progress` had already sat declared and
> unverified for a whole stage, and the shell moved out from under this one before it was
> built. See §13.13.

**The margin sheet is specified here and built by the first screen that needs one, which is
Ask.** It is deliberately **not** declared in `lock.css` ahead of a deliverable that renders
it: `.progress` was declared at the Stage 2 lock and sat unused and unverified for a whole
stage, and revision 20 was a rule that looked right and was wrong until something measured it.

Its shape, so the screen that builds it is not improvising:

- It occupies the right-hand cream, from the page's right edge to the app's right edge.
- It is a `.keybox` naming what opened, a way to close it, and a `.sheet`. **No new component.**
  It is `.panel` in a different place, so the inventory stays at **37**.
- Its content column comes out at about **372px, 54 characters**, the same line length as the
  page. Subordinate in position, not in measure, exactly as §12.4 settled for the note.
- **The left margin stays cream.** The asymmetry exists only while something is open, which is
  correct, because something is open.

### 13.3 Desktop is the first platform whose window is shorter than the last one

This is the fact that decides the pass and it is the opposite of what a bigger number
suggests. **Vertical is the scarce axis at desktop and horizontal is the plentiful one.**

| | window | browser furniture | the page gets |
|---|---|---|---|
| mobile | 390 x 844 | ~80 | `.app` **764** |
| tablet | 834 x 1194 | ~74 | `.page` **1120**, 80 modules |
| **desktop** | **1440 x 900** | **~116** tab strip, toolbar, bookmarks | `.page` **784**, 56 modules |

**The page loses 336px of height and gains none.** 784 is a whole number of graph modules, the
same reasoning the tablet's 1120 obeys.

**The consequence is measured and recorded rather than smoothed over.** The settled Pro Today
is **928px** tall, so at desktop the mood row sits below the fold and the sticky composer
covers the space it would occupy. That is **flow-review finding 6**, which got materially
better at 834 and gets materially worse here, for a reason that belongs to the platform rather
than to the design. It stays a watch-item.

### 13.4 The numbers the argument produces

|  | 390 | 834 | **1440** |
|---|---|---|---|
| page | 366 | 560 | **560**, unchanged, 40 modules |
| binding rail | 24 | 24 | **24**, welded to the page edge |
| paper margin `--gut` | 14 | 28 | **28**, unchanged. See 13.1 |
| sheet | 338 | 504 | **504** |
| the time column | 58 | 58 | **58**, a fixed dimension |
| the user's words | 250px | 416px | **416px** |
| its first line | 33 chars | 54 chars | **54 chars** |
| the product's note | 241.3 | 416 | **416**, the same column |
| the recording row | 212.3 | 378.3 | **378.3**, so no re-authoring |
| waveform tick | 1.769 | 1.768 | **1.7677** |
| cream each side | 0 | 125 | **428** |
| masthead | 124 | 80 | **80** |
| destination row top | 124 | 80 | **80**, equal on all four |
| page min-height | 764 | 1120 | **784** |

**Everything in that column except the last row is inherited from §12 without a change**, which
is why `lock.css` §5 is a single declaration. That is the finding, not a gap.

### 13.5 The waveform obligation costs nothing here, and that is a consequence rather than luck

§12.7 generalises to: **any change to the width of a row holding a waveform is a change to its
tick weight.** The recording row is 378.3px at desktop exactly as it is at 834, because the
page held, so the 428-unit viewBox is carried verbatim and the tick measures **1.7677px**
against the canonical 1.769. **Measured on the file, not assumed**, because §12.7 exists
because of a pass that assumed it.

### 13.6 It is a third container query, and the constraint is unchanged

`lock.css` §5 is `@container (min-width:1200px)`, keyed on `.app`, and **nothing in it styles
`.app`**, because an element cannot query itself. The reason is the same as §12.6's and it has
got stronger, not weaker: all three share builds are files that get sent to people, and a media
query would restyle the approved mobile and tablet comps the moment anyone opened one at a
different window size. The desktop block sits **after** the tablet block and is additive over
it, which is why it needs so little.

`.device.d,.caption.d{width:1440px;max-width:none}` is revision 33 and was built on the **first**
desktop file. At tablet the equivalent was an edge case; at 1440 it is the default outcome,
because a desktop comp needs a 1472px window and most laptops are 1366 or 1440.

### 13.7 §9.11 is materially softer at 1440, and is still not being fixed

The page reads about 12px right of true centre because the rail is filled `--paper-2`, lighter
than the margin it sits against, so the eye takes the ruled area's left edge as the page's
edge. Against 125px of cream at 834 that is a visible offset. Against **428px** it is 2.8% of
the margin rather than 9.6%, and looking at the render it no longer reads as an offset at all.
**Not corrected**, for the reason it was not corrected before: an optical nudge makes the
geometry lie and has to be re-derived on both native passes.

### 13.9 §13 IS ON HOLD. A SELECTION SET IS RUNNING.

**Client verdict on the shell above: it reframes the tablet rather than designing for the
platform.** That is accepted. The argument in 13.1 to 13.5 is sound on its own terms and every
measurement in it still holds, **but it answered the wrong question**: it asked what 1440 does
to the page, when the question was what a landscape window driven by a mouse and a keyboard
does to a design that is currently a vertical, thumb-shaped stack.

Three complaints, all of them fair, and none of them addressed by widening a margin:

1. **The layout is vertical and the platform is landscape.**
2. **The primary input becomes a mouse and a keyboard**, and nothing in the design reflects it.
3. **The destination row and the sticky bottom composer are mobile furniture**, carried
   forward on inertia. A horizontal row of four boxes is a tab bar moved to the top of the
   screen, and a sticky bar at the foot is a thumb pattern.

**Five candidate shells are drawn in `desktop-web/_selection/`**, with a compare page. Their
CSS is in `lock.css` **§5b**, which is a selection set rather than a revision: nothing in it
binds anything, and **when a direction is chosen the survivor merges into §5, its class
disappears, and the other four blocks are deleted from the file.** That is why the lock is
still at revision 34.

| | Shell | What it changes | What it costs |
|---|---|---|---|
| **V1** | **Tabs** | Navigation goes vertical in the left margin. Nothing else moves. | Answers the furniture, not the layout. The floor of the set. |
| **V2** | **Spread** | The page goes landscape: 1064px, 76 modules, two ruled columns, chrome on one row. | Reading order. A day is chronological and down-then-across is harder. Column two empties first even on a full day. |
| **V3** | **Study** | The composer leaves the foot and becomes a permanent writing column on the right. | A writing box that is always open is always asking. Mood and the composer end up on opposite sides. |
| **V4** | **Record** | The record is permanently on screen in a left sidebar that also carries navigation. | **A change to `00-flow.md` §2.** Stage 0, not the lock. |
| **V5** | **Field** | No page card. The graph fills the window; the chrome becomes a title block down the left. | Whether open graph beside the sheet reads as the rest of the page or as a screen that failed to fill. |

**What every candidate holds constant, because these were not up for a vote.** Palette, type
scale, spacing, radii, rule weights, component identity, information hierarchy and §8. **All
five keep the writing at 416px and 54 characters**, which is 13.1's one durable result: the
measure is the rule, and no shell is allowed to buy width from it.

**Three findings came out of drawing them rather than arguing them.**

1. **V2 proves the one-row masthead is a width problem, not a layout problem.** 13.1 rejected
   it because three objects need 717px of a 504px row. At 1064 it fits with room to spare.
   The rejection was correct at 560 and is not a general result.
2. **V5's title block wrapped its own date** at 300px wide: `Sun 9 Aug '26` at 29px in the hand
   broke to two lines and broke the keybox's fixed height. Found by rendering it. 360px.
3. **§12.7 has a corollary nobody had written down: the duration string is part of the row
   geometry.** In V4's sidebar the `11:47` recording renders 6.8px narrower than the `2:41`,
   `5:08` and `3:26` rows beside it, purely because its `.dur` is a wider string. Carried at
   the same viewBox it drew at **1.732** against their 1.770. It is authored at 259 units and
   37 ticks where they are 267 and 38. **A row's width depends on its content, not only on its
   container**, and any waveform sharing a row with a variable-length label has to be measured
   per row rather than per screen.

### 13.10 ROUND TWO. V5 IS CHOSEN AND IS BEING REFINED.

**Client verdict on the round one set: V5 Field is the direction, and it is not yet right.**
Two faults, both about space rather than about structure, and both fair:

1. **The open graph on the right reads as unfilled rather than as margin.** 510px of ruled
   paper with nothing on it is not the same object as 510px of cream. **Cream is ground;
   graph is a page you did not write on.**
2. **Nothing has any air above it.** The sheet starts flush against the top of the window.
   At 390 and 834 the masthead did that work, and V5 moved the masthead out into a title
   block without replacing the space it had been occupying.

Under both: **this is a desktop design, there is real estate, and it should breathe.**

**Five refinements of V5**, in `desktop-web/_selection/`, CSS in `lock.css` **§5c** on the
same exit condition as 5b. Round one's five stay on disk for comparison and are not
maintained, the way the Stage 1 comps do.

| | Shell | What it does about the right | What it costs |
|---|---|---|---|
| **W1** | **Margin** | Centres the sheet in the graph: **288px of open page either side** instead of 42 and 510. | Adds nothing. It argues the fault was proportion rather than vacancy. |
| **W2** | **Crown** | Puts the chrome back on top as a 1008px band so the column sits on the window's own axis. | **The title block goes.** A centred column under a top bar is what every desktop reader looks like. |
| **W3** | **Workbench** | Fills it with the composer. The sticky bottom bar is a thumb pattern that no desktop argument supports. | A writing box that is always open is always asking. Mood and the composer end up on opposite sides. |
| **W4** | **Galley** | **Stops ruling it.** The graph gets a right edge at 728px, 52 modules, and the space beyond becomes cream. | **It is a page card again**, which is what V5 was chosen for not being. |
| **W5** | **Two up** | Writes on it. The ruled form spans the graph, the day sets in two columns of 416px each. | Reading order, and a second column that empties well before the first even on a full day. |

**What all five share.** 84px of air above and below the sheet, six graph modules, with the
**wordmark's cap aligned to the sheet's top edge** so the two regions start on one line. The
writing at 416px and 54 characters. No new colour, no new content, no new component.

**One thing that was tempting, tried on paper and ruled out, recorded so it is not
rediscovered.** The obvious way to fill a wide right-hand margin in a direction literally
named *field record* is to move the product's note into it as marginalia. **It is
forbidden.** §12.4 settled that the note is the same width as the writing in the same
column, and it settled it as an **information hierarchy** question rather than a typographic
one. A note that is a ruled row at 390 and a margin object at 1440 is two components, not
one, and hierarchy is held identical across all five platforms.

**Three defects found by measuring and rendering, all recorded rather than quietly fixed.**

1. **The round two title blocks clipped the date mid glyph.** The keybox needs **251.5px** of
   natural width: 43.5 for the `DAY` key and 206 for `Sun 9 Aug '26` at 29px in the hand.
   They were drawn at 300 and 280, giving 230 and 210 of inner width. **Fixing V5's wrap with
   `white-space:nowrap` without carrying its width across turned a visible two-line date into
   a silent truncation, which is strictly worse.** 336 now, 24 modules, with 14px of slack.
   **A fix is a change, and a change has to be re-measured everywhere it lands.**
2. **W2's band was shrinking to fit.** A flex item with `margin-inline:auto` and no `width`
   does not take its `max-width`, so the 1008px band rendered at its 717px content width and
   `space-between` had nothing to distribute. It looked almost right. **This is revision 20's
   lesson in a second costume: auto margins on flex items do not behave like auto margins on
   blocks.**
3. **A scripted markup transform mangled a composer** while deriving W3 from V5: a non-greedy
   regex closed on the wrong `</div>` and left the out-of-memory option orphaned. Caught by a
   tag-balance count against a snapshot taken first, and the file was rewritten by hand
   instead. **Second time a scripted markup edit has damaged a file in this project.**

### 13.11 THE SHELL IS SETTLED. V5 FIELD, WITH FIVE FIXES.

> **Note on the order of this section.** 13.0 to 13.8 are the original desktop argument.
> 13.9, 13.10 and 13.11 were appended as the work went, so **13.8 sits at the very end of the
> section rather than in numeric order.** Numbering is left alone because other documents
> reference these numbers. Read 13.11 for what was actually built.

**Round two was rejected in full, and the verdict was right: all five arranged the empty
space rather than removing it.** The direction is V5, and it takes three fixes, given
directly. `lock.css` **§5d**, built as `desktop-web/01-today.html`, which replaces the
rejected first shell.

**The shell does not change.** No page card. The graph bleeds to the right edge of the
window, the binding sits at the far left where a notebook on a desk sits, and the masthead,
destinations, date and glance line are a **title block down the left**. No tab bar, no row
of boxes, no chrome above the content.

**Fix 1. The journal's first entry starts on the date's line.** The sheet takes a top margin
equal to everything above the date box in the title block: `--s7` of padding, the wordmark
at `--t-mast` on a flat line height, and the `--s6` beneath it. 68px, **derived rather than
typed**, so it follows if any of the three ever move. **Probed: date box top 68.0, first
entry top 68.0, delta 0.0.**

**Fix 2. The ruled form fills the page and the blank graph is gone.** The sheet was a 504px
column standing on a 1056px field with 510px of ruled paper beside it. It now runs
**426 to 1398, 972 wide**, with the page's own 42px gutter either side.

**Fix 2b, from client review of the built shell: the entries fill the row, and the first
build had it wrong.** This screen first shipped with prose held at **416px**, on the argument
that the measure must not follow the width. Measured on the built page that is **47% of the
column the writing sits in**: every entry stopped just under halfway across a row whose fill
and rules run the full width, which is revision 25's fault at a bigger scale.

> **The arithmetic defending 416 was right about long-form and wrong about this.** The 45 to
> 75 character band exists because **return-sweep error compounds over many lines**. These
> entries are two to four lines, and the longest in the whole of §8 is 175 characters, which
> is **two lines at full width**. The cost the band prices in is not being paid here.
> **A rule was applied without checking whether its reason was present**, which is the same
> class of mistake as revision 25 and as §13.1's `ch` finding.
>
> **The note and its summary are released with the prose.** §3.2 is a **ceiling**, and a note
> narrower than the writing above it is exactly what revision 25 was written to stop. All
> three fill the same column, which is the relationship they hold at 390 and 834 rather than
> a new one. Measured: **884 of 884, and the first line holds 128 characters over 2 lines.**
>
> **The character count here read 156 from session 6 to session 8 and it was wrong.** Corrected
> when §3.2 was rewritten in characters per line: re-measured on all three entries of the built
> screen with a Range over each line's ink, the longest lines are **128, 124 and 89** characters
> at a column capacity of **126 to 130**. **The argument is untouched** — 175 characters is two
> lines at this width, which is the whole of fix 2b — but the figure was 22% high, and a number
> carried rather than measured in a binding document is what §9.13 was opened about. §3.2.

**Fix 2c: the collapsed note row was off centre in both columns.** Measured on the shut row
at 54px tall: the printed key sat **14 above and 0.0 below**, so it was 7px high and touching
the hairline under it, and the summary sat 3 above and 7 below. `.said .tcol` carries
`padding-top: --s6` against `padding-bottom: 0`, which is right for an open note where the key
labels from the top of a long block and wrong for a shut one where the row is only as tall as
the key. Symmetric padding on the key, and the shut column centres its own summary: now
**14 and 14**, and **12.5 and 11.5**, in a row of 68. **Scoped to `:not(.open)`; the expanded
state is not touched.**

**The same off-centring exists at 390 and 834**, same rule and same markup. Both are signed
off, so it is **reported rather than fixed**, alongside the other cross-platform items in
the engagement record's session log.

**Fix 3. The input box centres on the journal.** The composer's rule still spans the page,
which is what a foot does, and its content sits on the sheet's own axis rather than against
its left edge. **Measured: composer centre 912, sheet centre 912.** 700px wide, because a
504 box centred under a 972 sheet reads as adrift rather than as the place you write.

**One optical fault found by rendering the fix, not by reading it.** `.said summary` is a
flex row with `space-between`, so on a 972px sheet it threw its chevron about 800px from the
words it belongs to and the note row read as two unrelated objects at opposite ends of a
rule. **Capped to the same 416 measure.** Revision 26's lesson again: a fix is a change, and
a change gets the same render-and-look pass as the thing it fixed.

**The waveform is re-authored and it was not optional.** The row went from **378.3px to
846.3px**. Carried unchanged, the 428-unit viewBox would have drawn this recording at
**3.95px ticks against the canonical 1.769**, more than twice the weight of the same
recording on every other screen. Same pitch of 7, same 2-unit bars, the pattern extended by
mirroring about its own end.

> **The figures this section used to give were 957 units and 1.7687, and they were stale
> from session 6 to session 8. §9.15 item 3.** Closing §9.12 gave every recording head its
> own 58px time column, which took this row from **846.3 to 788.3** and the viewBox from
> **957 to 891**. The markup was re-authored; this table, and four file headers, were not.
> **Nothing rendered wrong and the documentation was false**, which is the whole of the
> defect and the reason it is worth a paragraph: the numbers table in a binding document is
> what the next platform reads instead of measuring. **Re-measured on the file at session 8:
> row 788.30, viewBox 891, tick 1.7695.**

**Numbers, measured at a true 1440**

| | |
|---|---|
| title block | 0 to 360, cream, unruled |
| binding | 360 to 384, gap to page 0.0 |
| graph | 384 to 1440, full bleed |
| sheet | **426 to 1398, 972 wide** |
| date box top / first entry top | **68.0 / 68.0** |
| the writing | **884px, the full column. 128 characters on the first line, 2 lines.** Was recorded as 156 until session 8; see fix 2b and §3.2 |
| the note, and its summary | **884px**, the same as the writing |
| shut note row | 68 tall. key **14 / 14**, summary **12.5 / 11.5** |
| recording | **788.3px** of waveform, viewBox **891**, **tick 1.7695**. Was 846.3 and 957 until the head took its 58px time column at session 6; the figures were corrected here at session 8 |
| mood chip | 183.6 each, five sharing the row |
| composer | 700px, **centre 912 against the sheet's 912** |
| page height | 784, 56 graph modules |

**SIGNED OFF at session 6, and `.f` is gone.** §5d merged into §5 as revision 35, §5b, §5c, §5e
and §5f were deleted with the ten selection comps and the two review variants, and two things
that had been sitting in the review blocks came in with it: **the `white-space:nowrap` on the
date came out**, which was clipping it mid glyph at 200% type, and **fix 3 was rescued from
§5f**, where it had been mis-scoped and would have been deleted by the sign-off itself. See §6,
revisions 35 to 37.

### 13.12 Screen 2, and what the first non-Today screen changed

**Timeline, both zoom levels, `desktop-web/02-timeline.html`.** Two lock revisions, no new
component, and both were found by building rather than by arguing.

**Rule 7.6 is now a claim about the title block, and it is measured rather than asserted on the
two destinations that exist.** The block has two slots under the wordmark: a **second-row
object**, a `.keybox` on Today, You, Ask and first run and a `.seg` on Timeline, and a **printed
line** under the destinations, `.glance` on Today and `.total` on Timeline. Both had only ever
held Today's occupant. Measured after revision 36:

| | Today | Timeline |
|---|---|---|
| wordmark | top 20, 34 tall | top 20, 34 tall |
| second-row object | top 68, 50 tall | top 68, 50 tall |
| **destination row** | **top 138**, 234 tall | **top 138**, 234 tall |
| the printed line | top 372 | top 372 |
| sheet top | 68 | 68 |

**Still two of four.** It cannot be called proved until Ask and You exist, and it will be
measured again then.

**Timeline stops being one screen at two zooms and becomes one screen with an index. Client
decision, and it is a change to what the calendar IS rather than to where it sits.** At 390 and
834 the list and the calendar are alternatives behind `.seg`, because only one of them fits. At
1440 both fit, so both are drawn: **the list is the record and the calendar is an index into
it**, and every day the calendar marks is a link to that day's rows in the list.

**Three consequences, none of them cosmetic, all of them recorded rather than absorbed.**

1. **`.seg` is not on this screen.** It exists to switch between two views and there is nothing
   left to switch. B2 is unchanged and is still Timeline's control at 390 and 834. **The desktop
   states pack has to follow this**, because `11-states` draws a Timeline and currently carries
   a `.seg` on both other platforms.
2. **H2 changes meaning at this platform.** The calendar was a zoom level of the timeline and is
   now a way into it. **The part of H2 that carries the brief's rule about absence is untouched**
   and was always the load-bearing half: an empty day is still a number and nothing else, with no
   box, no dot, no dimming that reads as failure and no tap target. A day you did not write on is
   not a link, because there is nothing to go to.
3. **A fragment link pushes a history entry, and `00-flow.md` §2 deliberately keeps zoom out of
   history:** *"pressing back four times to escape a screen you zoomed around in is worse than
   losing the ability to undo a zoom."* Clicking three dates in the index does exactly that. A
   static comp has no other mechanism for a link that scrolls, so **the comp draws the link and
   the build must scroll without pushing.** This is a build obligation of the same kind as the
   composer's placeholder label, and it belongs in §7.4 with it.

**The title block's second-row slot takes the same date box the other three destinations carry**,
which is revision 27's argument arriving at its conclusion. When Ask's search field left the
masthead the note was that *"all four destinations now compose their masthead identically"*, with
Timeline the one exception because it held `.seg`. It no longer does, so all four now genuinely
do. **No new content:** the date box is §8's, verbatim, the same object Today carries.

**The list gets the larger share by construction rather than by eye.** Its column is `--page-w`,
**560**, which is not a new number: it is the width the record has been read at since tablet. The
index takes what is left, **370**, with the page's own 42px gutter between them. **The day cells
come out at 48.58 square**, clear of the 44px floor §3.3 and H2 hold them to, and that floor
matters more here than it ever has: at 390 and 834 a cell was a link to a day page, and here it
is the control that drives the whole screen.

**The gutter and the top margin move from the children to the page, and fix 1 still holds.**
Every object in a flex page carries `margin:0 var(--gut)` to hold itself off the page edge; in a
grid that would inset each object inside its own track and the two columns would stop adding up.
The page takes the gutter as padding and the children give up their inline margins. The sheet's
68px top margin becomes the grid's `padding-top`, derived from the same three tokens, so **both
columns start on the date box's line.** Measured: sheet top 68.0, index top 68.0, delta 0.00.

**The index is sticky inside its own grid area**, so it travels with the record and stops at the
end of it. An index that scrolls away from what it indexes is not an index. **It cannot be
demonstrated in a static comp**, which is the same honest limitation the sticky composer has had
since Stage 3.

**The waveforms were re-authored twice in one session, which is the clearest demonstration of
§12.7 this project has produced.** The same four recordings sat in a **320.3px** row at tablet, a
**788.3px** row when the sheet filled the whole desktop page, and a **376.3px** row now that the
list is one column of two. Authored at **425 units, and 418 for the `11:47`**. The tablet's own
two-group pattern is long enough again, because base plus mirror runs to 471 and the widest row
needs 425; the full-page version had needed four groups and 891 units. **The constraint on the
viewBox is that it must not fall inside a bar**: bars sit at a pitch of 7 and are 2 wide, so in
the mirrored half they occupy residues 0 to 2, and any viewBox at residue 1 slices one down its
length. **Measured: 1.7708 and 1.7679.**

### 13.13 The remaining ten screens, and the three title block compositions

**Screens 3 to 12, built in one batch at session 7 with the one-deliverable rule suspended
for the fourth time.** Seven lock revisions, no new component, and the inventory stays at 37.

**THE TITLE BLOCK COMPOSES THREE WAYS AND THE PAGE FOLLOWS IT.** The shell was signed off on
Today, which is a destination, so until this batch the block had only ever held a wordmark, a
second-row object, four destinations and a printed line. Seven of the ten screens are pushed
pages. The rule that emerged is one sentence, and `lock.css` revision 39 is it:

> **The page's first object starts on the line of the title block's second object.**

| | Title block | Lead | Screens |
|---|---|---|---|
| destination | wordmark, second-row object, destinations, printed line | **68** | Today, Timeline, Ask, You, first run, upgrade |
| pushed, with a page title | back, wordmark, second-row object | **126** | reflection, plan, all four settings pages |
| pushed, no page title | back, second-row object | **78** | `/talk`, an answer, a past day |

**The third case is not an omission.** On a day, on an answer and on `/talk` the object that
names the page IS the date box or the question, which is exactly what 7.6 calls the
masthead's second row. Those three screens carry no wordmark at 390 or 834 either, and adding
one here would be a hierarchy change at a single platform.

**RULE 7.6 IS MEASURED ON ALL FOUR DESTINATIONS AND IT WAS FALSE UNTIL THIS BATCH.** See
revision 45. The claim now holds on Today, Timeline, Ask and You, on the four destination
screens inside the states pack, and on every destination in the prototype.

**THE CITATION COLUMN IS BUILT, WHICH CLOSES §13.2.** `04-ask` renders it, `lock.css`
revision 41 declares it, and the deliberate delay was right twice over: the object §13.2
originally specified was a margin sheet, and the shell moved out from under it.
**The answer holds a 560 column whether anything is open or not**, so the source opens beside
it and the answer does not move by one pixel — measured across both states, sheet x=426
w=560, every excerpt at an identical top. **The cost is stated rather than discovered**: on an
answer with nothing open the second column is empty. It is the one screen in the product that
reserves space for something that is not always there, and reserving it is exactly what stops
the answer moving under the reader. The alternative, letting the answer run 972 and reflow to
560 when a citation opens, moves every line of the user's own words at the moment they asked
to see the source of one of them.

**WHAT THE WIDTH DOES TO THE PRODUCT'S OWN PROSE, MEASURED RATHER THAN ASSUMED.** Fix 2b
released the subordinate caps on the argument that the 45 to 75 band prices in return-sweep
error over many lines, and these entries are two to four. That argument had only ever been
tested on Today. Measured across the ten:

| | width | first line |
|---|---|---|
| settings explanations, `/you` | 869 to 910 | 39 to 95 characters, one line each |
| privacy answers | 886 | up to 94, one line each |
| the reflection's notes | 884 | 60 to 134, one line each |
| the plan's admission paragraph | 886 | 153, two lines |
| first run's opening statement | 972 | 73, one line |
| permission cards, inside the capped stack | 586 | 35 to 112 |

**One of those numbers is why `.stack` is capped.** At the full page width the permission
cards would have set their explanation at about 138 characters a line, which is past the band
on the product's own explanatory prose rather than on two lines of the user's.

**§9.14 IS EXTENDED ONE STEP, ON THE SAME CLIENT DECISION.** Defect 3 is an h1 in every
document, fixed on desktop only. Three of these screens have no wordmark, so the object that
names the page becomes the h1 there, and revision 42 declares the weight on the object rather
than on the element. 390 and 834 keep the defect and stay byte-identical.

### 13.8 What desktop does not get

No new colour, no new content, no new component. The hand still appears **at most twice**. The
sample content set in §8 is unchanged and unextended. **`--gut` is not scaled and the page is
not widened**, and both of those are conclusions rather than omissions.

---

## 14. Mobile app, 390x844, iOS. The reflow, and the argument for it

**Binding on every mobile app screen.** Added at Stage 5, screen 1. Nothing here overrides §1 to
§8; it says only what the platform changes. **§12 and §13 are the tablet and desktop reflows and
neither is a licence to assume anything scales**, which at native is not even a temptation: the
app is the same width as mobile web, so the question was never what the width does.

**This section covers the mobile app only.** The tablet app at 834x1194 is a separate pass and
gets its own argument. What it inherits from here is §14.1's mechanism and §14.7's list.

### 14.0 The conclusion, first

**The width does not change at all. The furniture does, and the furniture is the whole pass.**

390 is 390. The page is 366, the sheet 338, the writing 250px at 35 characters, the recording row
154.3 and its waveform's viewBox 174 — every one of them the mobile web number, carried and then
**measured** rather than assumed. What changes is that the four destinations leave the page and
become a tab bar, the masthead becomes a large title that collapses, and the page stops being a
document and becomes a screen with a fixed height between two bars.

### 14.1 It is a VARIANT CLASS and not a fourth container query

**PROJECT.md's Stage 5 note and §13.6 both said the native pass adds "a fourth container query". It
cannot.** §4 and §5 are keyed on how wide `.app` is. **The mobile app is 390 wide and so is
mobile web.** There is no width at which one is true and the other false, so no width query can
tell them apart. What separates them is not a size, it is a platform, and a platform is a fact
about the file rather than about its measurements.

So the block is `.app.ios`, and the precedent is already in `lock.css` three times: **`.app.clip`,
`.crow.find` and `.page.split` are variant classes on existing components rather than new
components.** Nothing is added to the inventory, which stays at **37**.

**The pattern that held three times was not the rule.** Mobile web, tablet and desktop are three
widths of one product, so a width query was the right instrument for all three. Native is a
different product surface at a width that is already taken. **Same class of mistake as the gutter
series in §13.1, where 14 and 28 looked like they implied 42.**

**One consequence, and it is the good kind.** §4 and §5 are container queries on `.app`, and
`.app` here is 390, so **neither fires**. The native block sits on top of the base, which is the
mobile design, and only has to say what the platform changes. That is the same additive
relationship §5 has with §4, arrived at by a different mechanism.

**A constraint this block does NOT inherit, and it will matter at the tablet app.** §4 and §5 may
not style `.app` itself, because an element cannot query itself. PROJECT.md carries that forward onto
the native block as though it were general. **It is not**: a variant class has no self-reference
to create. It did not need to be tested here, because holding `.page` to the screen gives `.app`
its height by construction and the block came out all descendants anyway. **Recorded so the tablet
app does not obey a rule whose reason is absent.**

### 14.2 The problem the pass exists to solve, and it is the only one

`00-flow.md` §2 put the four destinations at the **top** on mobile web and gave two reasons: *"the
bottom of Today belongs to the composer and the mic"*, and stacking a nav bar under them *"inside
a browser that has already taken 100px of vertical space"* is how you get a 45%-tall content area.
The native delta in the same paragraph then makes that row a real `UITabBar`, **which is at the
bottom**. The composer and the tab bar want the same edge.

**The second reason is void at native and the first is not.** There is no browser chrome to pay
for. The composer still wants the foot. **That collision is the real design problem of native
Today**, and it had to be answered rather than inherited.

### 14.3 It resolves by arithmetic, and the arithmetic is measured

The destination row is **58px** and it is **inside the scrolling page** on mobile web. Natively it
stops being page content and becomes the tab bar, so the page gets those 58px back.

| at rest, top of the same day | mobile web | mobile app |
|---|---|---|
| window | 844 | 844 |
| furniture above the app | ~80 browser | **47 status bar** |
| the app | **764** | 797 |
| the page | 764 | **714** |
| masthead | 124 | 124, unchanged |
| destination row | 58 | **0, it is the tab bar** |
| glance line, and its margin | 37.56 + 14 | 37.56 + 14 |
| composer | 135 | 135 |
| tab bar | — | **83** = 49 + 34 |
| **sheet visible** | **395.44** | **403.44** |

**The native screen shows eight more pixels of the day than the web one, while carrying a
permanent tab bar the web one does not have.** The tab bar costs 83; the destination row it
replaces cost 58 in the page, and the browser furniture it does not have cost 80 against the 47
of status bar native still pays. 58 plus 33 is 91, against 83.

**And the honest other half, which is a cost.** Once you scroll, mobile web pays nothing at the
top because its masthead and destinations scroll away, while native pays a 44px collapsed bar and
an 83px tab bar forever:

| scrolled | mobile web | mobile app |
|---|---|---|
| fixed at the top | 0 | **44** |
| fixed at the foot | 135 composer | 135 composer + **83 tab bar** |
| **reading area** | **629** | **535** |

**Native is better at the top of the day and 94px worse down it.** The trade belongs to the
platform rather than to this design, and what the 94px buys is stated in §14.4.

### 14.4 What the tab bar buys, and it is a sentence rather than a pixel

`00-flow.md` §2 says the four destinations are **"one tap from anywhere"**. On mobile web, on the
settled day this screen draws, that is **false**: the day is **1168 tall in a 764 window**, so
from its foot the destination row is a **404px scroll and then a tap**. **The tab bar is what makes the flow's own
sentence literally true for the first time in the product.** That is the argument for paying 94px
of reading area, and it is a flow argument rather than a taste one.

### 14.5 What the tab bar is, and the one convention it declines

**B1 is unchanged: four destinations, always four, always Today, Timeline, Ask, You.** `.dest.tab`
is a variant class, so it is the same component the other three platforms draw. What changes is
chrome and layout, both of which the engagement rules allow to move per platform.

- **It spans the full 390.** `.app` carries `padding-left:--rail`, so a child stops at the paper's
  left edge and a tab bar does not. The negative margin is exactly `--rail`, so it cannot drift.
- **83 tall: 49 of items over 34 of home indicator**, with the hairline inside the 83. The bar
  carries the height and the items stretch to 48. Giving the items `--tabh` put the bar at 84 and
  the binding overshot by exactly that pixel, **which is §7.6's `.seg` lesson in a third place.**
- **The current destination keeps its `--block` fill and inverted label.** iOS marks the current
  tab by **tinting it**, which is colour alone, and **rule 2.4 forbids that outright**. Measured:
  `--paper` on `--block` at **8.89:1**, and in greyscale the current fill sits at **0.052 relative
  luminance against the bar's 0.926**, so it is unmistakable with the hue removed. **This is the
  one place the native pass declines a platform convention, and it declines it on a binding rule
  rather than on taste.**
- **No icons.** An iOS tab bar is normally an icon over a label. The standing rule is to reach for
  a printed word before inventing an icon; the product has exactly two glyphs and both are
  universal; four invented marks for four destinations is four chances to be decoded wrongly.
- **Revision 28 survives in a different mechanism.** `You` is set apart because it is the only
  destination about the software rather than about the writing. That is **hierarchy** and is held
  identical across platforms; the auto left margin that says it at 390 and 834 cannot be said in a
  bar whose four items divide it equally, and equal division is what a tab bar is. **A `--rule`
  hairline says the same thing in the product's own vocabulary**, one weight, one colour, and it
  survives greyscale. **Rejected:** keeping the auto margin, which leaves a 107px hole in a 390px
  bar and reads as a layout fault rather than as a statement.
- **`min-width:min-content` on the items**, which is the 200% type fix. See §6, revision 47.

### 14.6 The large title, and the half of it that needed nothing

**At rest the mobile web masthead is already a large title, and that is the finding rather than a
gap.** The wordmark is `--t-mast`, **34px**, set flush left with the date box beneath it, and 34px
is iOS's own large-title size. The masthead needed **no declaration at all**: it is 124 tall here
exactly as at 390 web, so **§7.6 still binds and the date box does not move when you change tab.**

**The whole of the delta is the collapsed state.** Scrolled, the large title leaves and the
wordmark returns as an inline title in a **44px** bar that stays, with a `--rule` hairline under
it and the date box, the glance line and the sheet scrolling **under** it. `--t-field` is the
size, because the type scale has no 17px and does not need one: this is the printed treatment
`.keybox .v.printed` already uses, so **no token is added**.

**Nothing on a web page in this product is fixed except the composer**, so this is behaviour the
web build genuinely cannot have, and it is why the deliverable draws two devices.

### 14.7 The page is the screen, not the document, and the comp has to say so

Every web comp in this project draws the whole day, because a web page is a document and a
document is as long as it is. **A phone is not.** The screen is 844, the nav bar is fixed and the
tab bar is fixed. Drawing this day at its full **1138**, measured on the built file rather than
estimated, would put the tab bar 1138px down the page, which is nowhere it ever is, and would
hide the whole vertical argument above.

So `.page` takes a real height, summed from the four native dimensions rather than typed:
`844 - 47 - 49 - 34 = 714`.

**`height` rather than `min-height` looks like it breaks §3.3 and does not.** §3.3 forbids fixed
heights on anything **carrying text**, because text that grows under enlarged type must be able to
push its box. This box carries no text: natively it **is** the scroll view, its height is the
screen, and the sheet inside it is the thing that grows and scrolls. **`min-height` would be the
wrong description of a native scroll view, not a safer one.** Ask what the number is a proxy for:
§3.3's reason is absent here and present on every box inside, all of which still grow. Verified at
200% type: **140 elements checked, none wider than its own box, no horizontal overflow, the date
box grows 50 to 135 and wraps.**

**Two devices, and the second one is a real scroll position rather than a plausible one.** The
offset is **measured, and it is honest that it is**: a scroll position is content-dependent by
nature and cannot be summed from tokens the way §13.11's lead can. It was 263 until the sheet was
measured on this file rather than carried from 390 web. **Carrying a height from the platform
next door is the same fault as carrying a `ch` value**, and it clipped the mood chips by 14.12
until it was measured instead.

> **The difference that caused it closed at revision 48, and 292 is still right.** At the time the
> shut note row was 68 here and **54 at 390 web**, because §9.14 defect 4 was fixed on native and
> not there, so the native sheet was 28 taller and the day scrolled 29 further. **Defect 4 is now
> fixed everywhere**, so the row is 68 on all four platforms and both sheets measure 813.13. The
> offset does not move, because it was read off this file rather than carried across.

### 14.8 §9.14: the native platform drew on the fixed side, and then everything did

> **SUPERSEDED AT SESSION 10, AND THE SPLIT THIS SECTION EXISTED TO MANAGE IS GONE.** The client
> accepted the polish pass, so all four defects are fixed on all four platforms and **the mood
> question renders at weight 400 everywhere.** The four declarations moved into the base and the
> native copies of them were deleted; `lock.css` revision 48. **`<time datetime>` is also built
> now**, which the last paragraph below deliberately declined to do on native alone, and the
> reason it could be built is exactly the one given there: it finally had a decision behind it.
> The argument below is kept because **it is still the right way to have decided it at the time**,
> and because the rule it rests on has not changed.

The four cross-platform defects are fixed at 1440 only, by client decision, and 390 and 834 web
keep them. **A native comp cannot be both, so this pass picks fixed**, and not as a preference:
the client's decision was about **retrofitting two signed platforms**, which is a change to
approved deliverables. **Building a new file is not a retrofit**, and three of the four are
accessibility failures against a floor the engagement rules make binding on **every** file —
`aria-pressed` is WCAG 4.1.2 level A and the missing `h1` is 1.3.1.

**The visible consequence, stated so it is not discovered later: the mood question renders at
weight 400 at 1440 and on the native app, and at 700 at 390 and 834 web.** Two platforms against
two rather than one against two. It stays that way until §9.14 closes everywhere.

**Deliberately not done: `<time datetime>` on the time column.** It is the other item from the same
review, it is cross-platform, it costs nothing, and **it has no decision behind it on any
platform.** Fixing it on native alone would be taking a decision rather than following one.

### 14.9 What the mobile app does not get

No new colour, no new content, no new component, and the inventory stays at **37**. The hand still
appears **at most twice**. §8 is unchanged and unextended: the screen states exactly what mobile
web's Today states, checked string by string. **The waveform is carried rather than re-authored,
and that was measured rather than assumed** — the row is 154.3 here and 154.3 at 390 web, so the
174-unit viewBox is the mobile file's verbatim and the tick measures **1.7735** against the
canonical 1.769, identical to the same recording at 390 web. §12.7 is satisfied by the page not
moving, which is a consequence rather than luck.

**`.stack` did not arise and did not need re-deriving.** PROJECT.md asks for it, because it is capped
at 700 at desktop and native is the first platform since 390 where the page is the app again. It
is used by `/talk` and first run, **not by Today**, and the 700 cap lives inside the 1200 container
which does not fire at 390. So at the mobile app `.stack` has no cap at all, exactly as at mobile
web. **It gets re-derived at screen 3, which is the screen that renders one.**


---

## 15. Motion. The selection set, and the argument for running one

> **READ THIS FIRST. THIS WHOLE SECTION IS THE ARGUMENT, NOT THE RULE.** The rule is **§7.7**
> and the implementation is **`lock.css` §3.9 and §3.10**. C3 glide is **MERGED INTO THE BASE
> AT REVISION 49** and lands on all five platforms. `.glide`, the 39 `_motion/` comps, the
> motion index and both review hatches are **deleted**, which is §7's own exit condition taken
> in full.
>
> **What is worth reading here and what is history.** §15.12a to §15.12m are the *system*:
> the four speeds, where every duration comes from, the three selector faults the extension
> found, and the four rounds of client review that shaped the note and the composer. **Read
> those before changing any number, because every number is derived and changing one without
> its derivation turns a speed limit back into a set of numbers somebody typed.** §15.1 to
> §15.11d are the selection set that produced C3 — five escalating levels, then five refined
> candidates — and they are **history**. The candidates and their CSS no longer exist.

**Added at session 11, on the client's instruction: five escalating levels on one screen, so a
direction can be chosen by looking.** The screen is **mobile web Today**, chosen because
**motion is component behaviour rather than a platform fact**, so whatever is chosen lands on
all five platforms exactly as the pressed state did at revision 38, and the base is where a
component decision belongs. The comps are `mobile-web/_motion/`, the CSS is `lock.css` §7, and
the lock stays at **revision 48** because nothing in §7 binds anything.

### 15.1 The constraint that shaped every level, and it is not taste

**There is no JavaScript.** That is the first engagement rule and it is not relaxed for motion.
Everything in the set is CSS: `::details-content` with `allow-discrete` and `interpolate-size`
for the disclosure, `@keyframes` with a cascade for the arrival, and `animation-timeline: view()`
for the scroll level. **The one thing this rules out is the thing Emil Kowalski's own guidance
reaches for first**, which is springs and interruptible, velocity-preserving gestures: those
need a runtime. What CSS gives instead is that **every level runs off the main thread**, which
is the same guidance arriving from the other end.

### 15.2 The five, and each one is a superset of the one below it

The classes are cumulative, `app anim press disclose arrive record print`, so **the ramp is a
dial rather than five ideas** and a comp's `class` attribute states what it is running.

| | Level | What it adds | Longest single move |
|---|---|---|---|
| **A1** | **Press** | Pointer feedback only. Nothing moves unless you touch it. | 120ms, about 1.5px |
| **A2** | **Disclosure** | The note opening, instead of appearing between two paints. | 160ms, 90px of growth |
| **A3** | **Arrival** | The printed layer arrives on load. The record does not move. | 160ms each, 4px, cascade 295ms |
| **A4** | **The record** | Rows materialise as you scroll to them. | **no duration. scroll driven** |
| **A5** | **Print** | The sheet prints top down, the wave draws, the chips overshoot. | 420ms, the sheet's height |

### 15.3 A3 is the level with an argument rather than a dial setting

Every conventional load animation animates the content. **A3 refuses to.** On arrival the paper,
the binding, the ruled form and **every word the user wrote are already there at full opacity
and do not move**; what fades up 4px is only the layer the product itself printed: the wordmark,
the date box, the four destinations, the glance line and the composer.

**That is rule 1 expressed in time.** The user writes in ink and the product only ever speaks in
rust, so the rust is the only thing that has to arrive. It is also what keeps the level inside
§7.7's last sentence without having to argue about it, and it means **the writing is legible at
the first paint rather than at 295ms**, on the screen someone opens at 1am to write one
sentence.

### 15.4 What each level costs against §7.7, which is the whole decision

| | §7.7 status | The sentence at stake |
|---|---|---|
| **A1** | **inside it, on every clause** | none. It needs no revision to any binding document. |
| **A2** | one clarification | §7.7 names **the note**, and a disclosure travels by **its own content height**, about 90px, against a 20px clause. The counter-argument is that the note moves only because the reader asked it to. |
| **A3** | **inside it on one reading** | each object moves 4px for 160ms; **the cascade totals 295ms**. If the 160ms clause governs a sequence rather than an object, this needs the same clarification A2 does. |
| **A4** | outside it | it **animates the user's own words**, which §7.7 forbids outright. The duration clause is not breached so much as voided: a scroll timeline has no duration. |
| **A5** | outside it on every clause | 420ms against 160ms, a clip travelling the sheet's height against 20px, an **overshoot** against the clause that forbids a curve drawing attention, and it animates the writing and the note. |

### 15.5 What no level does, at any height of the ramp

- **No ambient loop, and specifically no breathing record control.** A control that moves while
  nobody is touching it is a control that is **asking**, and this product does not ask.
- **No motion on the crisis card.** §7.7 names it and no level touches it.
- **No motion on a keyboard action**, and none of the five animates anything a keyboard reaches.
- **No new colour, no new component, no new content, no layout change.** The five comps and the
  signed screen **measure identically at rest**: page 366, sheet 813.13, writing 250 at 35
  characters, no horizontal overflow, nothing under the 44px floor. **A motion study that also
  moves something is two studies.**

### 15.6 Reduced motion is this product's rule and not the industry's

The usual advice is that reduced motion means gentler motion, keeping opacity. **§7.7 says
remove it entirely, and the lock wins**, so every level collapses to the finished screen with no
fade at all. **The pressed state is deliberately kept**, on §7.5's own recorded reasoning that a
press is a **state** rather than a transition: with the transition gone it becomes instant.

**One accident of the tooling turned out to be worth keeping.** Headless Edge reports
`prefers-reduced-motion: reduce` **by default**, so every render this project has ever taken has
been the reduced-motion rendering. It has never mattered, because nothing moved. It means the
accessibility path is now the **default** thing a render verifies, and seeing the motion at all
requires `--force-prefers-no-reduced-motion`.

### 15.7 On merging, whenever a level is chosen

**The survivor loses its variant classes and moves into the BASE**, not into a platform block:
motion is component behaviour, so this is revision 38's shape rather than §5's, and revision 48
is the standing warning about what happens when a component rule is written inside a platform
block. **That merge is a real revision and it moves every approved file**, deliberately, because
a pressed state and a transition are the same class of change. The other four levels, their
comps and §7 are deleted in the same edit.

**The tablet app and the mobile app inherit whatever is chosen**, and neither needs its own
argument for it, with **one exception to look at when it arrives**: at native, iOS has its own
motion conventions and §14.5 has already established the precedent for declining one on a
binding rule rather than on taste.

### 15.8 The set did not run in Gecko, and two of the five levels are engine dependent

**Found by the client rather than by any check here, and the reason is that every check this
project runs is one engine.** Headless Edge is the instrument PROJECT.md §9 names, and it has been
sufficient for eleven sessions because nothing in the product depended on anything newer than a
container query. **Motion does.** The five were reviewed in Firefox 153, where two of them did
not behave as written.

| Capability | Chromium 151 | Gecko 153 | Which level needs it |
|---|---|---|---|
| `::details-content` | yes | **yes** | A2 |
| `transition-behavior: allow-discrete` | yes | **yes** | A2 |
| `interpolate-size: allow-keywords` | yes | **no** | A2's height growth |
| `animation-timeline: view()` | yes | **no** | **A4 entirely** |

**WHAT CHANGED IN THE CSS, AND THE RULE UNDERNEATH IT.** §7.2 is now two layers: a fade and a
lift that every engine can run, with the height growth behind `@supports`. §7.4 gains a load
stagger behind `@supports not`, labelled an approximation wherever it appears. **A capability
that only one engine has belongs behind `@supports` rather than in the base layer**, and the
first version had it the other way round, so Gecko snapped the row open and simply skipped A4.

**IT CHANGES THE DECISION, WHICH IS WHY IT IS HERE AND NOT ONLY IN THE SESSION LOG.**

- **A1, A3 and A5 run identically in both engines.** Nothing about them is contingent.
- **A2 degrades honestly**: the note still arrives over 160ms everywhere, it just does not grow
  outside Chromium.
- **A4 is Chromium only.** Everywhere else it is an approximation with the wrong properties, or
  nothing. A level whose whole argument is *it has no duration and is driven by the reader*
  cannot be delivered by a load stagger.

**So if cross engine parity is a requirement, the ramp stops at A3**, and that is a better
argument for A3 than any of the ones made when the set was drawn. The brief's platform section
makes the web product the whole product, and the web product is not one browser.

### 15.9 Reduced motion is not a hypothetical, and the set had to be reviewable under it

**The client could not see any of the five, in either browser, and the cause was their own
machine: Windows animation effects are off**, `SPI_GETCLIENTAREAANIMATION` returns false, and
every browser therefore reports `prefers-reduced-motion: reduce`. §7.7 says remove motion
entirely, so the whole set correctly showed nothing.

**THIS IS A FINDING ABOUT THE PRODUCT AND NOT ONLY ABOUT THE REVIEW.** The audience for this
product is people opening it at 1am, and **animation effects being off is an ordinary Windows
state**, chosen for battery, for older hardware, or for motion sensitivity. Whatever level is
chosen, **a real share of users will get none of it**, which is the correct behaviour and is
also an argument for the ramp's lower rungs: **a design whose character depends on motion has
no character for those users, and A1 and A3 lose the least.**

**The review affordance, and its exit.** Every reduce rule in `lock.css` §3.13 is scoped
`:not(:target)` and each comp's `.app` carries `id="motion"`, so `#motion` suspends the reduce
block for one visit and the compare page offers it as a button. **Without the hash the honest
behaviour is unchanged, and the hatch dies with §7 at the merge**, because a shipped product
does not overrule the reader's own setting. It exists so a decision can be taken by looking.

### 15.10 A5 IS THE DIRECTION. IT IS NOT REFINED, AND THE SET IS CLOSED

**Client verdict at the end of session 11: A5, and it is nowhere near refined enough.** A1 to
A4 and the compare page are deleted; `mobile-web/_motion/a5-print.html` and the phone export
survive. **The queue does not advance**: no other screen gets motion until A5 is settled.

**This section is now on the same footing §13.10 was**, where V5 Field was chosen and then took
three fixes before it became §13.11. **Nothing here is binding yet.** §7.7 still says what it
has always said, and A5 still contradicts it.

**WHAT A5 IS, STATED ONCE, BECAUSE THE RAMP FRAMING IS GONE.** Its class list is cumulative, so
A5 carries five layers at once and none of §7's rules could be deleted with the four rejected
comps:

| layer | what it does | measured |
|---|---|---|
| **press** | every control takes a scale on press, every hover tint a ramp | 120ms, about 1.5px |
| **disclosure** | the note arrives instead of appearing between two paints | 160ms |
| **arrival** | the printed layer fades up while the record stays still | 160ms each, 4px, cascade 295ms |
| **record** | rows materialise as the reader scrolls to them | no duration. scroll driven |
| **print** | the sheet clips open top down, the wave draws, the chips overshoot | 420ms, 320ms, 260ms |

**WHAT REFINEMENT HAS TO SETTLE, LISTED AS FACTS RATHER THAN AS A PLAN.**
1. **§7.7 has to be rewritten, not clarified.** A5 breaks four of its clauses: the 160ms
   ceiling, the 20px ceiling, the curve that may not draw attention, and the sentence forbidding
   motion on the user's words and on the note.
2. **Two layers are engine dependent.** The record layer is Chromium only and falls back to a
   load stagger elsewhere; the disclosure layer only grows the row in Chromium. §15.8.
3. **Reduced motion removes all of it**, and animation effects being off is an ordinary system
   state. §15.9.
4. **Nothing in §7 has ever changed a box**, and the comp still measures identically to the
   signed screen at rest. That is worth keeping true through the refinement.
5. **The merge is still the exit**: when A5 is signed off it loses its variant classes and lands
   in the base on all five platforms, as revision 38 did, and every approved file moves at that
   point, on purpose.

### 15.11 A5 IS REFINED INTO FIVE CANDIDATES, AND THEY ARE FIVE SOLUTIONS RATHER THAN FIVE SETTINGS

**Client verdict at session 12: the idea works and the execution is jittery. It happens
suddenly, with no sense of comfort, and being quick is not the answer.** So A5 is refined
rather than replaced, on one screen only, and **the Stage 5 queue still does not advance.**
`mobile-web/_motion/` now holds A5 unchanged plus five candidates and a compare page. The CSS
is `lock.css` **§7.7 to §7.13**, temporary, on the same exit condition §7 has carried since
session 11, and **nothing in it binds anything, so the lock stayed at revision 48 until the merge.**

**THE ONE-DELIVERABLE RULE IS SUSPENDED FOR THIS BATCH BY THE CLIENT'S OWN INSTRUCTION, WHICH
ASKED FOR FIVE. SEVENTH TIME**, and recorded as theirs exactly as the six before it.

**SESSION 11 DREW A RAMP, WHICH IS A DIAL, AND THE COMPLAINT IS NOT THAT THE DIAL WAS SET TOO
HIGH.** So the five below each name a **different cause** and fix that one, and they disagree
with each other about what the fault actually is. Three keep the printing idea, two argue it is
where the jitter lives. A comp's `class` attribute states which one it is running.

### 15.11a The diagnosis, and it had to be turned into numbers before it could be fixed

**"Jittery" is not actionable and "sudden" is not a measurement.** Every figure below is
computed from A5's own declared curves, at 60fps, on the measured geometry of the signed
screen. `--virtual-time-budget` was tried first as the instrument and **hangs on this machine
without producing a file**, so the curves were evaluated numerically instead and corroborated
against a mid-flight render.

| | The cause | Measured |
|---|---|---|
| **1** | **Nothing in A5 eases in.** `cubic-bezier(.23,1,.32,1)` has its **maximum** velocity at t=0 | **4.35x its own average**, and **40% of every move is done in the first 10% of its duration**, 68% in the first fifth |
| **2** | **The sheet's clip edge jumps, then crawls** | **first frame moves it 137px**; the last **28px** take the final **210ms** |
| **3** | **The waveform's ticks arrive in clumps** | **first frame reveals 5.4 ticks**, second 4.8 more, last tick takes 160ms, against a **6.19px pitch**. Aliasing, not taste |
| **4** | **The arrival is over in 50ms and then shimmers for 110** | of 4px, **3.43 travel in the first 50ms**; the last **0.57px** spreads over the rest, which is sub-pixel translation under live text |
| **5** | **The cascade gap is 1.5 to 1.8 frames** | delays 0, 30, 60, **60**, 85, 110, 135, 165. Two objects collide at 60ms |
| **6** | **Four clocks, three curves, twelve start times** | nothing governs anything else |
| **7** | **The two largest objects animate `clip-path`, which is not a composited property** | **§15.1's claim that every level runs off the main thread is false for §7.5.** REASONED FROM THE PROPERTY, NOT MEASURED with a frame profiler; what would settle it is a trace, and no instrument in this project takes one |
| **8** | **The scroll layer moves the words against the finger moving them** | a 6px translate added to the reader's own scroll |

**Cause 4 is the one worth keeping, because it is invisible in a still and it is literally what
the word jitter means.** A curve that front-loads its travel does not finish early; it spends
its remaining time moving text through **fractional pixel offsets**, and glyphs re-rasterise
every frame while it does. A5 does that for 110ms of every 160ms move, on the user's own words.

### 15.11b The five, and what each one refuses to fix

| | Candidate | Names | The fix | Load ends | The cost it accepts |
|---|---|---|---|---|---|
| **C1** | **clock** | 5 and 6, **rhythm** | one beat of **90ms**, one curve that starts at rest, **three** start times instead of twelve, and the sheet, wave, glance and composer all finish on one downbeat | **360ms** | keeps the hard clip edge. Does not answer the strobe |
| **C2** | **vellum** | 2 and 3, **the edge** | every reveal is a **feathered mask** rather than a clip. **101.6px** of feather on the sheet, **19.3px** on the wave, which is 3.1 ticks | **620ms** | a mask repaints exactly as a clip does, and it is the slowest of the five |
| **C3** | **glide** | 1, **peak speed** | one symmetric curve, **peak 1.72x** against A5's 4.35, and **every duration derived** so nothing exceeds **45px a frame** | ~~560ms~~ **1520ms** | ~~the user's words are legible later here than anywhere else~~ **REVISED AT SESSION 13. That cost is gone: the journal is static on load, so the writing is legible at the first paint. The new cost is length.** §15.11e |
| **C4** | **settle** | 6 and 7, **the number of moving parts** | **two** objects, one clock, **transform and opacity only**. The paper settles from 12px and the print is simply there | **560ms** | **the printing idea is gone.** The largest cost in the set |
| **C5** | **still** | **the premise** | almost nothing on load. The whole budget goes to the **press** and the **note**, which the reader causes | **420ms** | there is no arrival to admire |

**C1 IS FASTER THAN THE THING IT REFINES AND CALMER ANYWAY**, 360ms against A5's 420, which is
the single clearest demonstration that the client's sentence was right: being quick was never
the problem. **C3 is the opposite demonstration**, deliberately slower and calmer for the same
reason, because peak velocity rather than elapsed time is what the eye objects to.

**C4 AND C5 ARE THE TWO THAT ARGUE WITH THE BRIEF OF THE PASS RATHER THAN EXECUTING IT.** C4
says an 813px edge cannot be made comfortable by any curve, and deletes the reveal. C5 says
motion the reader did not ask for cannot be made comfortable at all, and deletes the load
sequence. **Both are worth having in the set precisely because they might be right**, and both
state that cost in their own caption rather than leaving it to be found.

### 15.11c What the set fixes about §15.8 without being asked to

**A5 had two engine-dependent layers of five. The refinement set has one, in one candidate.**
Measured by asking `document.getAnimations()` in Chromium 151 and Gecko 153 rather than by
reading the stylesheet.

| | Chromium | Gecko | |
|---|---|---|---|
| **C1 clock** | 10 | **10** | identical |
| **C2 vellum** | 16 | **10** | the six scroll-driven rows are Chromium only |
| **C3 glide** | 10 | **10** | identical |
| **C4 settle** | 9 | **9** | identical |
| **C5 still** | 8 | **8** | identical |

**Four of the five drop the scroll layer, each for its own reason, and that agreement was not
planned.** C1 drops it because a clock and a thumb cannot share a rhythm; C3 because a speed
limit cannot govern a reader's finger; C4 because it animates two things and a row is not one
of them; C5 because the reader did not ask for it. **C2 keeps it in the only form that does not
fight the finger**, opacity with no translate.

**AND C2 DECLARES NO FALLBACK, DELIBERATELY.** A5's fallback was a load stagger labelled as an
approximation. Here the sheet's own feathered reveal already brings every row, so where the
timeline is missing the screen is **complete rather than approximated**. **A candidate that
degrades to something honest beats one that degrades to something labelled.**

### 15.11d What is still true, and what is still not decided

**NOTHING IN §7 HAS EVER CHANGED A BOX AND THAT IS STILL TRUE, MEASURED ON ALL FIVE.** Each comp
was pixel-diffed against `mobile-web/01-today.html` over the whole device region: **0 differing
bytes on all five**, including the mask candidate, so the feather leaves no antialiasing trace
at rest. Page 366, sheet 813.13, writing 250 at 35 characters, no horizontal overflow, nothing
under the 44px floor.

**§7.7 IS UNCHANGED AND STILL HAS TO BE REWRITTEN BY WHICHEVER CANDIDATE WINS.** None of the
five is inside it: C1, C2 and C3 all exceed the 160ms ceiling and all three still move a clip or
a mask the height of the sheet, and C4 and C5 animate the note. **The overshoot clause is the
one every candidate now satisfies**, because none of them overshoots. §15.10 item 1 stands, with
one fewer clause to argue about.

**EVERY CANDIDATE USES `animation-fill-mode: backwards` WHERE A5 USES `both`**, so no clip, no
mask and no transform survives its own animation and the element is handed back to its own
stylesheet at the end. It renders identically and it is the difference between a comp that
**returns** to the signed screen and one that only looks like it.

**THE REVIEW HATCHES ARE UNCHANGED AND STILL DIE AT THE MERGE.** `:target` and `.mo` both work
on all five, verified in both engines: with the hash the animations run, without it there are
**zero**, which is the honest behaviour on a machine with animation effects off and is what this
project's machine actually does.

**ONE NAMING COLLISION WAS FOUND BY THE INERTNESS GREP AND FIXED BEFORE IT REACHED ANYTHING.**
C5 was called **quiet**, and the grep that proves a temporary section cannot match an approved
file returned **nineteen hits across three platforms and all three share builds** — every one of
them `class="btn quiet"`, because **`.quiet` is already E2's third button grade**, 39 instances.
Nothing was mis-styled, because every rule was `.app.quiet` and a button is not the app, and the
pixel diff was clean. **It is a latent trap rather than a live bug**: the exit condition deletes
the class and moves the rules into the base, and a maintainer writing that merge against a name
the product already uses is how a real defect gets made. Renamed to **still**, which is a better
name for it anyway. **The check that proves inertness found a fault that inertness would have
hidden.**

---
### 15.11e C3 IS REVISED AT SESSION 13, AND IT IS THE ONLY CANDIDATE THAT HAS MOVED

**Client instruction, four changes, taken as their decision.** The date is written by hand,
the glance line types, **the journal is static on load**, and the composer comes up from below
with no fade on a curve that starts fast and ends slow. **A5 and the other four candidates are
untouched and still measure exactly as §15.11c records: 16, 10, 16, 9 and 8 animations.
Nothing is chosen.** `lock.css` §3.10 only, still temporary, still on §7's exit condition, and
**the lock stays at revision 48.**

**THE TYPING OVERRIDE IS SCOPED AND IT IS THE CLIENT'S.** Typing is a machine composing text,
and the brief forbids anything that reads as an AI product, naming typing dots. The client
admitted it **on the header region only**, and it does not reach the journal. **The object it
lands on is `.glance`, which is the product's own voice rather than the user's words**, so
§7.7's last sentence is not breached: nothing the user wrote moves, and after change 3 nothing
in the sheet moves at all except a waveform that is `aria-hidden`.

**CHANGE 3 DELETES THIS CANDIDATE'S OWN RECORDED COST, WHICH IS THE LARGEST THING THE REVISION
DID THAT WAS NOT ASKED FOR DIRECTLY.** §15.11b recorded C3's weakness as *the user's words are
legible later here than anywhere else*, and §15.3's argument cut against it specifically. With
the sheet's reveal deleted, **every word the user wrote is at full opacity in the first paint.**
That objection is gone. **The new cost is length**, and it is stated below.

**THE DURATIONS ARE STILL DERIVED RATHER THAN CHOSEN, WHICH IS THE CANDIDATE'S IDENTITY.** The
ceiling for the two new objects is **one character per frame**, which is cause 3's argument
moved from waveform ticks to letters: an edge crossing glyphs faster than the frame rate
delivers them in clumps. 45px a frame does not bind on either, so the legibility of the gesture
binds first. Measured on the rendered comp with a probe calibrated against page 366.00, sheet
813.13, writing 250.00 and wave row 154.30, all four reproduced exactly.

| | distance | derived | at the ceiling | one step faster |
|---|---|---|---|---|
| **the date**, `.keybox .v` | box 206.03px, 13 characters at a 13.69px pitch | **440ms** | peak 13.46 px/frame = **0.98 characters a frame** | 420ms is 1.03, over |
| **the glance**, `.glance .gline` | 47 characters | **800ms** | 17.02ms a step = **1.021 frames a character** | 780ms is 0.996, clumps |
| **the composer** | **16px**, up from 4 | **280ms** | peak 1.794 px/frame | inside the 45px ceiling by 25x |

**THE DATE IS A FEATHERED MASK AND NOT A STROKE, AND IT IS LABELLED AS SUCH RATHER THAN
OVERSOLD.** A hand cannot be stroked on here. The hand is a **font rendered as live text**, and
`stroke-dashoffset` needs authored outline paths, which would cost the accessible name, break
§3.3 at 200% type, and break A4's rule that the date is one text node so a rename is one edit.
Ink Free's glyphs are also **closed filled contours**, so dashing them traces the perimeter of
each letter rather than its skeleton. What it does instead is sweep a **25.75px feather, 1.88
characters**, across the value in the writing direction, so about two letters are inked at any
instant and there is never a hard line. **It is the hand becoming present in the order it would
have been written, which is a weaker and more honest claim than being written.** The geometry
is §7.9's verbatim; the keyframe is C3's own, so deleting C2 at the merge cannot reach into it.

**THE COMPOSER IS THE ONE PLACE THE CLIENT ASKED FOR THE SHAPE THAT WAS DIAGNOSED AS CAUSE 1,
AND REMOVING THE FADE MADE CAUSE 4 WORSE BEFORE IT WAS FIXED.** A front-loaded curve is only
dangerous where the distance is large, which is §7.11's argument already. At a **short**
distance the danger is cause 4 instead, the sub-pixel tail, and **the fade was hiding it.**
Measured at the 4px travel this object used to have: **19 frames of 19 are under 1px a frame**,
so the whole move is sub-pixel, and opaque text creeping through fractional offsets for 317ms is
cause 4 exactly. **The fix was the distance, not the curve.** At 16px the last-1px tail falls
from 167ms to 83ms and the sub-pixel frames from 19 to 11, and it also makes coming up from
below read as an arrival rather than as a twitch. **16px is inside §7.7's 20px clause**, so this
object needs no part of that rewrite. The curve is the gentlest ease-out that still starts fast:
**peak 1.88x** and 18.7% done at a tenth, against A5's **4.35x** and 39.8%, and `--gc`'s 1.72x
and 2.0%.

**C3 NOW RUNS TWO CURVES AND ONE STEP FUNCTION, IN A CANDIDATE WHOSE NAME WAS ONE CURVE.** Stated
rather than hidden. It is still fewer clocks than A5's three curves and four clocks, and the
second curve exists on one object because the client asked for a shape the first cannot make.

**THE NEW COST IS LENGTH. THE LOAD ENDS AT 1520ms, LONGER THAN ANY CANDIDATE IN THE SET** (revised to 1240ms at the second round; see 15.11f), against
A5's 420, C1's 360, C2's 620 and C3's own previous 560. **The typing sets it and cannot go below
783ms without characters arriving in clumps**, so the only two levers are a shorter line or
accepting more than one character a frame. The two written objects run in sequence rather than
together because they are the two pens on this screen and running them together is cause 6.

**WHAT WAS VERIFIED RATHER THAN ASSERTED.**
- **All 43 approved files rendered and hashed before and after.** One reported mover,
  `tablet-web/11-states`, proved to be **the documented flap** by re-rendering the untouched file
  eight times: it produced **both hashes**, six and two. **No approved file moved.**
- **No approved file carries any §7 class token**, the new `.gline` included, by grep over every
  `class` attribute on all 43. The grep was calibrated first against `.quiet`, which returned
  **exactly the recorded 39**.
- **The revised comp is byte-identical to the signed screen at rest** over the whole device
  region, **and so are A5 and the other four**, measured in the same pass. **The added span
  changed no box.**
- **Frozen at 1520ms the comp is byte-identical to the signed screen**, which is `backwards`
  fill handing every element back to its own stylesheet, proved rather than reasoned.
- **Timings measured in both engines by asking `document.getAnimations()`, and the probe was
  calibrated against A5 first**, reproducing its 16 animations, `m-sheet` 420, `m-wipe` 320 at
  120 and the 0/30/60/60/85/110/135/165 cascade. C3 then reads **10 animations and LOAD ENDS
  1520 in Chromium and Gecko alike**, item for item. **C3 is still engine-identical** and still
  declares no `@supports` fallback.
- **Check 5 passes**: no BOM, no CRLF, **226 comment opens against 226 closes**, depth 0, no
  prose escape. The checker was calibrated against the pre-session file, which gave the same 226.
- **Checks 1 and 2 pass on all six comps**: no external reference, no dash, no colour literal, no
  script, no style block, no inline style, and every comp links `../../lock.css`.

**TWO THINGS ARE REPORTED RATHER THAN FIXED.**
1. **The comp carries one span the signed markup does not, and that is a fourth difference.**
   The folder's stated property was that the markup is `01-today.html` verbatim apart from the
   class list, the id and the stylesheet path. `.glance` carries its two rules as its own
   borders, so clipping the element sweeps the **ruling** in with the words and reads as a
   progress bar being drawn. The span holds the text alone, is unstyled, and is inert in every
   other file. **It changed no box**, which is measured above.
2. **The glance line's two rules sit on the page with nothing between them for 720ms.** On a
   ruled form that reads as a line waiting to be filled, which is this direction's own
   vocabulary, but it is still a blank waiting to be filled and this product is careful about
   those. **Worth a look before this is judged.**

**§7.7 IS STILL UNCHANGED AND STILL HAS TO BE REWRITTEN BY WHICHEVER CANDIDATE WINS.** C3 exceeds
the 160ms ceiling and still moves a mask and a clip further than 20px, on the date, the wave and
the glance. **The overshoot clause is still satisfied by every candidate.** What changed is that
the clause forbidding motion on the user's words is now satisfied by C3 as well, because after
change 3 nothing in the sheet moves.

### 15.11f C3, SECOND ROUND AT SESSION 13. THE HEADER STOPS ARRIVING AND THE COMPOSER MOVES BY A MEASURED DISTANCE

**Client instruction, four more changes, taken as their decision.** The header's fade and
lift are deleted; the composer rises by the height of its own checkbox and runs the same
move backwards on scroll; the note opens and closes by moving rather than jumping.
**A5 and the other four candidates are still untouched and still measure 16, 10, 16, 9 and
8 animations. Nothing is chosen. The lock stays at revision 48.**

**THE LOAD IS NOW FOUR THINGS AND ENDS AT 1240ms**, against 1520 in the first round and
420 for A5.

| ms | object |
|---|---|
| 0 to 240 | the composer rises 64px |
| 0 to 440 | the date is written |
| 110 to 470 | the waveform draws, still untouched |
| 440 to 1240 | the glance line types |

**DELETING `g-arrive` REMOVES SIX ANIMATED OBJECTS**, which is the largest single reduction
any candidate has made. C3 now runs **5 keyframe animations in Chromium and 4 in Gecko**,
against A5's 16. §15.3's argument is satisfied twice over: the record and the printed layer
are both simply there at the first paint.

**THE COMPOSER'S 64px IS MEASURED, NOT CHOSEN.** The out-of-memory option's top sits exactly
**64.00px** above the composer's bottom edge, so 64 is the only translate that puts the
whole option out of sight and leaves the field and the record control visible.

**AND ITS DURATION IS BOUNDED FROM BOTH SIDES, WHICH IS NEW IN THIS CANDIDATE.** The 45px a
frame ceiling gives 45ms and does not bind; **the sub-pixel rule gives 240ms and does**. So
240ms is the **slowest** this move can be without creeping, which is the calmest option
inside the rule rather than the quickest. **The bigger distance retired cause 4 outright**:
at the 4px this object first carried, 19 frames of 19 were under a pixel a frame; at 16px it
was 11 of 17; at 64px it is **1 of 14**. The distance was always the fix.

**64px IS OUTSIDE §7.7's 20px CLAUSE**, which the 16px version was inside. That is one more
clause this candidate has to argue rather than satisfy.

**THE SCROLL BEHAVIOUR COSTS C3 THE ONE PROPERTY §15.11c PRAISED IT FOR.** §15.11c records
that C3 dropped the scroll layer on its own thesis, that you cannot put a speed limit on a
thumb, and that dropping it is **what made C3 identical in both engines**. Gecko has no
scroll driven animation, measured: `CSS.supports('animation-timeline','scroll()')` is **NO**
in Firefox 153. **So the composer tucks in Chromium and does not in Firefox.** No fallback is
declared, on §7.9's argument: where the timeline is missing the composer simply stays open,
which is **complete rather than approximated**. The load sequence itself is still identical
in both engines, item for item, so what is engine dependent is one behaviour rather than the
character of the screen.

**THE NOTE IS THE ONE THAT DID NOT FULLY CLOSE, AND THE CLIENT'S COMPLAINT TURNED OUT TO BE A
MEASURED ENGINE FAULT.** They said it moves position instantly and feels jittery. The height
growth has always been behind `@supports (interpolate-size)`, which is **Chromium only**:
measured **NO** in Firefox 153, which is their default browser. **What they have been
watching is the row snapping 68px to 190px in one frame** while only a fade and a 4px
transform moved. §15.8 recorded that degradation in 2 sessions ago without anyone noticing it
would be the thing being judged.

**What was delivered:** the fade is gone, the note travels **20px upward** into place instead
of 4px downward into it, the duration is **420ms**, and **closing animates the same way**
because it is a transition rather than an animation. In Gecko all of that is true and the row
still opens in one step.

**TWO CROSS ENGINE MECHANISMS WERE BUILT AND BOTH WERE BACKED OUT, AND BOTH FAILURES ARE
WORTH KEEPING** because each looked correct in the stylesheet.

1. **`grid-template-rows` 0fr to 1fr on `::details-content` does not interpolate.** Proved by
   slowing the transition to five seconds and taking one screenshot: the note still opened in
   one frame. **The same five second test on A5 caught A5's note clipped mid sentence**, so
   the instrument was sound and the mechanism was not.
2. **Moving the grid onto a real child fails on arithmetic.** A transition cannot run on an
   element that was never rendered, so the pseudo element has to be held
   `content-visibility:visible`; and then the collapsed row cannot reach zero, because
   box-sizing is border-box and **a grid item cannot be shorter than its own padding plus
   border**. The note carries 4px and 2px of padding and a 1px rule, so the collapsed row
   floored at a measured **9px against A5's 0**, the shut column centres its content, and the
   summary label sat **7.00px** from the column top against **11.50**. **That is a changed box
   at rest**, which §7 has never had, and it was caught by the pixel diff rather than by
   reading. Backed out.

**What would actually close it** is 4px of padding moving off the note, or the note's padding
going to zero while it is shut. Both are box changes to a signed component, so both are the
client's call.

**WHAT WAS VERIFIED.** All 43 approved files rendered and hashed against the pre-session
baseline: **43 of 43 byte-identical**, after one reported mover, `desktop-web/11-states`, was
proved to be **the documented flap** by rendering the untouched file eight times and getting
both hashes. **No approved file carries any §7 class token**, grep calibrated against
`.quiet` returning exactly 39. **All six comps are byte-identical to the signed screen at
rest**, including the revised C3. **Check 5 passes** at 227 opens against 227 closes, no BOM,
no CRLF, depth 0. Checks 1 and 2 pass on all six comps. Timings measured in both engines with
a probe calibrated against A5 first.

**ONE INSTRUMENT FAULT WORTH RECORDING, AND IT IS THE FOURTH THIS SESSION.** A freeze probe
that seeks **every** animation to a given time also seizes the **transitions**, and a
transition seeked to time 0 holds its pre-transition value, which is the browser default. The
destinations rendered as unstyled blue links and the mic as a grey button, in a frame that
otherwise looked correct. **A probe that pauses more than it means to reports a design fault
that does not exist.** Fixed by filtering to keyframe animations and disabling transitions in
the probe, after which every frame is stable across repeats.

### 15.11g C3, THIRD ROUND AT SESSION 13. THE LABEL MOVES, AND THE CLOSE IS DELIBERATELY ASYMMETRIC

**Client instruction, two changes, taken as theirs.** *Read the note* and *Hide the note*
were still swapping between two paints; make them move, on the body's clock. And on close,
**the body should shrink instantly and only the label travel down.**

**THE LABEL WAS THE ONE PART OF THAT ROW NOBODY HAD ANIMATED**, and it is the part the
reader is actually looking at. The base swaps the two spans with `display:none`. Both words
now share **one clipped grid cell** and slide through it: the outgoing word leaves upward,
the incoming word arrives from below, both on `--g-note` and `--gc`, and both reverse on
close. **Measured on frozen transitions: 0, -7.5, -15 against +15, +7.5, 0**, 15px apart
throughout, which is one label height.

**IT NEEDS A WRAPPER, AND THAT IS THE SECOND MARKUP DIFFERENCE THIS CANDIDATE CARRIES**,
after `.gline`. The summary is a `space-between` flex row, so stacking the two labels means
taking one out of flow, and absolute positioning would leave the chevron as the only flex
item, which `space-between` then pins to the **left**. A grid cell keeps both in flow and
leaves the chevron where it is. **The row does not change height**: `summary` carries
`min-height:--tap`, 44px, against a label box of 15, so the grid is nowhere near what sizes
the row. **Verified by pixel diff, not by that argument.**

**THE CLOSE IS INSTANT FOR THE BODY AND ANIMATED FOR THE LABEL**, and the mechanism is
**where the transition is declared** rather than a second rule: a transition runs from the
destination state's own declaration, so the `[open]` rule carries the real durations and the
base rule carries `0s`. The label keeps its transition on both states, so it still travels
while the body is already gone. **Verified in both engines**: the body is absent and the
recording row has already closed up while the label is still mid-slide.

**AND IT REMOVES HALF OF THIS CANDIDATE'S ENGINE PROBLEM AS A SIDE EFFECT.** The height
growth is `interpolate-size` and Chromium only, so **the close was the half Firefox could
never animate.** Now neither engine animates it, and the close is identical everywhere by
design rather than by accident. §15.11f's report stands for the opening only.

**TWO FINDINGS THAT COST A BUILD EACH, RECORDED SO THEY ARE NOT PAID FOR TWICE.**

1. **Neither end of a transform transition may be `none`.** The first version used
   `transform:none` for whichever label was in place. The label travelling **to a length**
   transitioned; **the one travelling to `none` jumped**. Measured: shut ran 0, −1.94, −7.5,
   −15 while open reported `none` at every moment, so the outgoing word slid while the
   incoming word was already sitting there and the two overlapped for the whole move. Both
   ends are now an explicit `translateY`, the body's included.
2. **`getAnimations()` does not enumerate `::details-content` transitions in Chromium.** They
   run, but they cannot be listed, seized or seeked. A probe that reports the note as having
   no transition is reporting its own blind spot, and this one did, twice. **The only
   instrument that answers a question about the body is a rendered frame with the duration
   slowed.**

**AND ONE INSTRUMENT FAULT OF THE SAME FAMILY, WHICH IS THE FIFTH THIS SESSION.** The
slowed-transition probe was slowing **both** the base rule and the `[open]` rule, so it
forced the close to take three seconds, **which is exactly the behaviour the change existed
to remove.** It reported the fix as not working when it was working. A probe must not slow
the rule under test.

**VERIFIED.** 43 approved files **byte-identical** to the pre-session baseline. All six comps
**byte-identical to the signed screen at rest**, the added wrapper included. Check 5 passes
at 228 opens against 228 closes, no BOM, no CRLF, depth 0. Checks 1 and 2 pass on all six.
No approved file carries any §7 class token, grep calibrated on `.quiet` returning 39.

### 15.11h C3, FOURTH ROUND AT SESSION 13. THE LABEL SWAP BECOMES ONE ANIMATION INSTEAD OF TWO

**Client's report, and it is the clearest description of a motion fault this project has
had:** *the label moving is animation A, the word being replaced is animation B, both are
fine individually, but A happens first and then B. I want both to start and end together.*

**THEY WERE RIGHT, AND THE CAUSE WAS THAT THERE REALLY WERE TWO ANIMATIONS.** §15.11g gave
each label its own transform transition, which meant the two had to **agree**. Measured on
frozen transitions: the outgoing word ran 0, −1.94, −7.5, −15 while **the incoming word sat
at 0 from the first frame and never travelled at all.** So the word did not arrive, it was
**revealed** , the travel finished and then the text changed, which is exactly A then B.
Rendered as a frame strip, the two words were superimposed from 0ms.

**THE FIX IS TO REMOVE THE SECOND ANIMATION RATHER THAN TO SYNCHRONISE IT.** A single
registered custom property, `--g-roll`, carries the roll on the label box, and **both words
derive their position from it**: the outgoing at `var(--g-roll)` and the incoming at
`var(--g-roll) + 1`, in hundredths of their own height. There is now **one transition on one
element**. The two cannot desynchronise because there is nothing left to desynchronise from.

| t | outgoing | incoming | gap |
|---|---|---|---|
| 0 | 0.00 | 15.00 | 15 |
| 105 | −1.94 | 13.06 | 15 |
| 210 | −7.50 | 7.50 | 15 |
| 315 | −13.06 | 1.94 | 15 |
| 420 | −15.00 | 0.00 | 15 |

**Exactly one label height apart at every moment**, starting together and ending together.
The strip reads as a clean roll: one word only at each end, one crossing in the middle.

**IT IS A NUMBER AND NOT A LENGTH, ON PURPOSE.** The travel stays in percentages of each
label's own height, so it remains correct at 200% type where the label box grows. `0` is
shut, `−1` is open.

**IT NEEDS `@property`, AND THE DEGRADATION IS THE HONEST ONE.** An unregistered custom
property does not interpolate. Both engines have `@property`; verified in Firefox 153, where
a slowed roll is caught showing only the outgoing word, which is only possible if the value
is travelling. Where it is missing the value flips between 0 and −1 with no travel, which is
the old display swap: the behaviour this replaced, rather than a broken one.

**THE CLIENT OFFERED A SLOWER ANIMATION TO ALIGN THEM AND IT WAS NOT NEEDED.** The duration
stays at `--g-note`, 420ms, the same clock the body opens on, because alignment came from
removing a clock rather than from stretching one.

**VERIFIED.** 43 approved files **byte-identical** to the pre-session baseline. All six comps
**byte-identical to the signed screen at rest**. Check 5 passes at 229 opens against 229
closes, no BOM, no CRLF, depth 0. Checks 1 and 2 pass on all six comps.

**ONE INSTRUMENT NOTE, THE SIXTH THIS SESSION.** The freeze probe filtered transition targets
on the class `lbl` with a word boundary, which does not match `lblbox`. Once the roll moved
onto the box, the probe silently stopped seizing it and reported the labels as stationary at
every moment, which reads exactly like a design that does not animate. **A filter that stops
matching does not announce itself.**

### 15.11i THE "A THEN B" REPORT IS GECKO'S MISSING HEIGHT ANIMATION, AND A FOURTH ATTEMPT AT FIXING IT WAS BACKED OUT

**The client reported that the label swap still runs only after the movement finishes, after
§15.11h made the swap a single animation.** It does, on their machine, and the cause is not
the swap.

**IN CHROMIUM THE TWO ARE SIMULTANEOUS, AND THAT IS NOW PROVED RATHER THAN ASSERTED.** Sampled
at known progress with a negative transition delay, which starts a transition already part
way through and lets a screenshot land at a chosen percentage:

| progress | the note body | the label |
|---|---|---|
| 10% | not yet growing | READ THE NOTE |
| 30% | growing | READ THE NOTE |
| 50% | growing | mid roll |
| 70% | growing | HIDE THE NOTE |
| 90% | nearly full | HIDE THE NOTE |

Both run continuously, from the same moment, on the same clock.

**IN GECKO THE BODY HAS NO HEIGHT ANIMATION AT ALL**, because the growth is `interpolate-size`
and that is Chromium only. The note therefore arrives at full height in one step and the label
then rolls over 420ms. **That is exactly A then B**, and it is the limitation §15.11f and
§15.11g both reported and neither closed.

**A FOURTH MECHANISM WAS BUILT FOR IT AND BACKED OUT, AND THIS ONE GOT FURTHEST.** A `.grow`
wrapper carrying a grid row from `0fr` to `1fr`, with the pseudo element held
`content-visibility:visible` so the child has a before-state, and **the note's own padding,
border and margin animated from zero** so the collapsed row reaches a true zero. That last
part is what defeated the §15.11g attempt, where the row floored at a measured 9px and moved
the summary; **this time the rest state was byte-identical**, which was the hard part.

**It still failed, and it failed worse than doing nothing.** Sampled in Gecko at 20%, 50%,
80% and **100%**, the row never grew at any of them: at full progress the label read HIDE THE
NOTE and **the note body was not on the screen at all.** The grid row does not interpolate
there either, and with `content-visibility` no longer hiding the content the note simply never
appeared. **A change that removes an animation is a cost; a change that removes the content is
a defect**, so it was reverted whole, both the stylesheet and the two wrappers, and Gecko was
re-checked showing the note open and correct.

**WHERE THIS LEAVES IT.** The label roll is one animation and works in both engines. The
close is instant in both. **The opening height animates in Chromium and not in Gecko**, and
four mechanisms have now been tried against that:

| | mechanism | why it failed |
|---|---|---|
| 1 | `grid-template-rows` on `::details-content` | does not interpolate there |
| 2 | grid on a real child, `content-visibility` left alone | a transition cannot run on a child that was never rendered |
| 3 | as 2, with `content-visibility:visible` | the collapsed row floors at the child's padding plus border, 9px, and moves the rest state |
| 4 | as 3, with the child's box animated from zero | rest state preserved, but the row never grows in Gecko and the note never appears |

**THE REMAINING OPTIONS ARE THE CLIENT'S, AND THEY ARE NOT TECHNICAL.**
1. **Accept it.** The height animates where the engine allows and steps where it does not. The
   label, the lift and the close are identical everywhere.
2. **Review in Chromium.** Everything asked for is already true there, proved above.
3. **Let the note's height be a known number** rather than `auto`, which both engines can
   interpolate. It costs the note a fixed height, which breaks at 200% type unless the cap is
   generous, and a generous cap makes the visible growth finish early. That is a real trade
   and it is a change to a signed component.

**ONE INSTRUMENT THAT EARNED ITS PLACE, AND IT SHOULD HAVE BEEN REACHED FOR SOONER.** A
**negative transition delay** starts a transition already part way through, so a single
screenshot lands at a chosen percentage. Every other attempt to see a transition in this
session, slowing it, freezing it, seeking it, either sampled only the first frame or could not
see pseudo element transitions at all. **This is the instrument for looking at a transition,
and it works in both engines.**

### 15.11j THE CLOSE READ AS INSTANT BECAUSE THE LABEL JUMPED 8px, NOT BECAUSE THE ROLL DID NOT RUN

**Client: on close the label should travel back rather than snap.** It was already travelling.
**The roll animates in both directions in both engines**, measured at 0, 105, 210, 315 and
420ms on the close: 15.00/0.00, 13.06/1.94, 7.50/7.50, 1.94/13.06, 0.00/15.00. What snapped
was something else.

**IT WAS THE LABEL'S POSITION, AND IT IS A CONSEQUENCE OF §7.3 MEETING AN INSTANT COLLAPSE.**
The shut note row centres its content, so with only the summary in the column the label sits
**7.5px below the padding**; the moment the note opens the column fills and the label rises to
sit on it. **Measured off the render: the label's ink starts at y=510 shut and y=502 open.**
Opening grows the row, so the label drifts those 8px. Closing collapses the row in one frame,
on the client's own earlier instruction, so **the label arrives in one frame.** Animating the
roll harder could never have fixed it.

**AND IT COULD NOT BE FIXED BY ANIMATING THE COLLAPSE EITHER.** The height growth is
`interpolate-size` and Chromium only, §15.11i, so in Gecko there is no row animation to hang a
positional drift on in either direction. Any fix built on the row's height would have worked
only in the engine that was not complaining.

**SO THE DIFFERENCE IS REMOVED RATHER THAN ANIMATED.** The open state takes the same top
offset the shut state gets from centring, so the label does not change position between the
two states and **the only thing that happens, in both directions and in both engines, is the
roll.** Measured after: **y=510 shut and y=510 open, in Chromium and in Gecko alike.**

**IT IS SCOPED TO THE OPEN STATE WITH `:has()`**, so the shut state, which is the state every
signed render measures, is not touched by a single declaration. **All 43 approved files are
byte-identical and all six comps still match the signed screen at rest.** No approved file
carries an open `<details>`, so the selector cannot match anything outside this comp.

**The 11.5px is measured rather than chosen** and is written as its derivation, `--s2` plus
half of the 15px of slack the shut column distributes.

---

### 15.12 C3 IS SIGNED OFF, THE OTHER FIVE ARE DELETED, AND THE SYSTEM IS EXTENDED TO EVERY WEB SCREEN

**Client decision at session 14, in one instruction: sign C3 off, remove the other
iterations, apply its motion system to every remaining screen on the three web platforms,
and keep the motion files separate because the merge happens when all of them are signed
off.** All four parts were done. `a5-print`, `c1-clock`, `c2-vellum`, `c4-settle`,
`c5-still` and `compare.html` are gone.
**AND THE SECOND HALF OF THE EXIT CONDITION HAS SINCE BEEN TAKEN: THE SYSTEM IS MERGED,
AT REVISION 49.** `.glide` is gone, the rules are in the base at `lock.css` §3.9, the 39
comps and the motion index are gone, and both review hatches are gone with them. Nothing §7 does moves an approved file, proved by
grep and by pixel diff throughout. **Twelve approved files did move at the end of the session,
on the client's instruction and for a separate reason: §15.12l, a content defect that had
slipped through and was fixed rather than reported.**

**THE EXIT CONDITION IS SPLIT IN HALF, AND THAT IS THE PART TO READ.** Every version of §7
since session 11 has said that on sign-off the survivor loses its variant class and merges
into the base **in the same edit** that deletes the rest. The client has separated those:
the deletions are taken now, **the merge is deferred until every screen carrying motion is
signed off.** So `.glide` stays a variant class, §7 stays temporary, and the comps stay in
`_motion/` beside the screens they copy. **It is the first time an exit condition in this
project has been taken in two parts**, and it is recorded as theirs. The reason it is safe
is unchanged: no approved file carries the token `glide` or `mo`, verified by grep over
every class attribute on all 43, calibrated first on `.quiet` returning its recorded 39.

**THE ONE-DELIVERABLE RULE IS SUSPENDED FOR THE EIGHTH TIME**, by an instruction that asked
for every screen. Recorded as theirs, exactly as the seven before it.

#### 15.12a The system, stated as speeds, because that is what made it extensible

**C3's name is the rule: a speed limit, not a stopwatch.** Nothing in it has a duration that
was chosen, so extending it to 35 more screens is a **measurement rather than a decision**.
Four objects move anywhere in the product, and each has one rate:

| object | rate | what bounds it |
|---|---|---|
| the date, written by hand | one character a frame at peak | cause 3, moved from ticks to letters |
| **the printed line**, typing | **17.08ms a character**, the glance and the total alike | the same. §15.12i |
| the waveform, drawing | 45px a frame at peak | §15.11b's own stated ceiling |
| the composer, rising | 64px, bounded **both** ways | 45px a frame below, sub-pixel above |

**THE RECORD NEVER MOVES AND THE HEADER NEVER ARRIVES, ON EVERY SCREEN.** Every word the
user wrote, the wordmark, the destinations and every printed object that is not one of the
four above is at full opacity and unmoved at the first paint. §15.3's argument is now
satisfied by construction across 36 files rather than by care on one.

**THE CONSEQUENCE IS THAT MOST SCREENS ARE MUCH QUIETER THAN TODAY, AND ONE IS SILENT.**
Today is the only screen carrying all four objects. **`10-settings-privacy` carries none of
them and has no load motion at all**, on all three platforms. That was measured rather than
designed, and it is the honest output of a rule that only lets the product's own acts move.

#### 15.12b The extension forced three selector faults into the open, and Today could not have shown any of them

Every one is the same shape: **a selector that names the right object on the screen it was
written against and the wrong object somewhere else.** It is revision 48's warning and
`.quiet`'s naming collision arriving a third time, and all three were found by measuring all
36 web screens rather than by reading §7.10.

| | The fault | Measured | Now |
|---|---|---|---|
| 1 | **`.keybox .v` swept printed prose as though it were the hand.** Today has one date box and it is in the hand, so the selector never met the other kind | **9 printed values** across the three platforms would have been swept: six on `03-talk`, two on `12-upgrade`, one on `09-plan` | `.keybox .v:not(.printed)` |
| 2 | **The typing would have typed the user's own question.** §15.11e admits the override on the header region *only*, and justifies it in one sentence: the object is `.glance`, "the product's own voice rather than the user's words" | **That is true on Today and false on Ask.** `04-ask`'s `.glance` carries `What do I write about when I can't sleep?`, 41 characters, which is §8's question restated small | already safe, and the reason matters: see below |
| 3 | **The composer would have hidden itself where there was nothing to reveal.** The 64px is derived from the out-of-memory option's top | The composer is drawn **twice with no option at all**, an 85px box on `11-states` and `12-upgrade` against the 135px one. Rising 64px there hides the **field** | `.composer:has(.opt)` |

**FAULT 2 IS THE SERIOUS ONE AND IT WAS ALREADY SAFE, BY A SPAN THAT TURNS OUT TO HAVE A
SECOND JOB.** The rule is `.glance .gline`, not `.glance`. §15.11e records `.gline` as a
clipping wrapper, added so the typing could sweep the words without sweeping the two rules
that are the row's own borders. **It is also the mark that says this glance is the product
speaking.** Ask's question does not carry it and therefore does not type, by construction
rather than by a rule anyone has to remember. **Recorded here so the next person to touch
this does not tidy the span away**, which would breach §7.7's last sentence outright on the
one screen where the flow puts the user's own question at the top.

**FAULT 3 IS THE PROJECT'S MOST REPEATED LESSON IN A FOURTH COSTUME.** The motion's reason
is absent, so the motion is absent. §3.2's rule 3, §13.11's fix 2b and §14.1's constraint
are the same sentence.

#### 15.12c Two durations moved, and both are proxies being re-derived rather than numbers being nudged

**`--g-date` goes 440ms to 500ms, and it is revision 45's rule applied to time.** 440 was
derived from **Today's own date**, `Sun 9 Aug '26`: box 206.03px, ink 178.03 after its 28 of
padding, 13 characters at a 13.69px pitch. **The widest date in the product is not Today's.**
`07-you` is keyed `Keeping` and valued `Since March '26`: box **225.2px**, 15 characters at a
13.15px pitch, and it measures identically at 390, 834 and 1440 because the keybox does not
reflow. At 440ms that value crosses **1.12 characters a frame**, over the stated ceiling.

> D >= peak x width x 16.667 / pitch, peak **1.724** for `--gc`
> `07-you`: 1.724 x 225.2 x 16.667 / 13.15 = **492.2ms**, so 500ms.

**This deliberately slows the screen the candidate was signed off on**, from 0.982 to 0.865
characters a frame, and Today's load now ends at **1320ms** rather than 1240, with the printed line's 820ms after it. It is exactly
the fault revision 45 fixed in the other axis: **a box sized to the date it happened to
contain rather than to the widest one it has to hold.**

**`--g-wave` gains a desktop value of 520ms, and it is the only duration that needed
re-deriving per platform.** The row is 154.3px at 390 and 320.3 at 834, both a long way
inside the ceiling at 360ms. **At 1440 Today's row is 788.3px**, and 360ms puts it at
**63.4px a frame, over §15.11b's stated 45.** Derived: 1.724 x 788.3 x 16.667 / 45 =
**503.4ms**, so 520, which puts the widest desktop row at 43.6 and `/talk`'s capture wave at
32.5. **It is written as a descendant rule and not as a token on `.app.glide`**, because §4
and §5 are container queries keyed on `.app` and **an element cannot query itself**. §12.6
and §13.6 both state that and this is the first time §7 has met it.

**One number did not need re-deriving and that is worth stating.** The composer's **64.00px**
holds at 390, 834 and 1440 alike, measured, so the rise is one distance everywhere. And the
tick pitch is **6.1814 to 6.2075** across the whole product, because §12.7 holds it there by
re-authoring viewBoxes, **so a ceiling written in pixels a frame is also a ceiling in ticks a
frame** and one number covers all three widths.

#### 15.12d The review hatch had to split, and the cost is stated rather than buried

> **BOTH HATCHES ARE GONE AT REVISION 49. This is kept because the count in it was wrong
> and the correction is the reusable part.**

A fragment points at one element, so a single-device comp could carry `id="motion"` and be
honest by default, while a multi-device comp had to carry `.mo` and force the motion on.
**This section used to state that split as seven and five per platform. Measured at the
audit, it was seven and five on DESKTOP ONLY: mobile and tablet were six and six**, because
their `02-timeline` draws two devices where desktop's draws one. So **17 numbered comps
forced motion rather than 15**, and 20 files including the prototypes had no reviewable
reduced-motion state — which is precisely the state §15.9 says a real share of users will
be in. **A count stated once for a set and true of one member of it is the same fault as a
selector written against one screen.**

#### 15.12e What was verified, and the one property that no longer holds exactly

- **All 43 approved files rendered and hashed before and after every edit: 43 of 43
  unmoved.** One reported mover, `desktop-web/11-states`, was proved to be **the documented
  flap** by rendering the untouched file eight times and getting both hashes, six and two.
- **Check 5 passes**: no BOM, no CRLF, **213 comment opens against 213 closes**, brace depth
  returning to 0 and never negative, no prose outside a comment.
- **Checks 1 and 2 pass on all 36 comps and on the index**: no external reference, no dash,
  no colour literal, no script, no style block, no inline style, and every comp links
  `../../lock.css`. **Tag balance checked on all 36** against their sources on div, span, p,
  details, summary and svg.
- **The measuring harness was calibrated before its output was believed**, per session 8's
  rule. It reproduced page **366**, sheet **813.13**, wave row **154.3**, viewBox **174**,
  tick **1.7736**, the date box at **206.03px over 13 characters**, the glance at **47
  characters** and the composer's **64.00px** before it was pointed at anything new.

**AND THE PROPERTY THAT NO LONGER HOLDS EXACTLY, STATED PLAINLY.** §15.11d's claim is that
nothing in §7 has ever changed a box. **Tested properly for the first time, against a control
that is each comp with the class and the two spans removed: 33 of 36 are byte-identical.**
The three that are not are the three states packs.

- **Mobile and tablet `11-states` differ by exactly seven pixels each, every one a single
  channel step, all of them on the sheet's 2px rounded corners.** No box moved; the
  rasterisation of a corner rounds differently under `overflow:clip`. Measured: max channel
  delta **1**.
- **Desktop `11-states` differs substantially, and the cause is a defect in the signed file
  rather than in the motion.** See §15.12f.

**The control was validated before any of that was believed**: rendered against the signed
screen it produced **0 differing rows**, so it is a faithful stand-in.

#### 15.12f Two defects found and reported rather than fixed, and one of them is in an approved file

**1. `desktop-web/11-states.html`, which is signed off, lets its title block overflow the
clipped device and cover its own caption.** `.app.clip` sets `min-height:0` so ten states fit
in one file; the desktop title block is `position:absolute` with `top:0;bottom:0`, so on a
shortened app its destination list escapes the device. **Measured on the signed render: the
`ASK` and `YOU` boxes sit on the stage below the device and obscure the caption**, which
reads `1 . Empt[y today]` and hides most of the sentence under it. It is presentation only,
because `.app.clip` is presentation and no shipped screen uses it, **but a caption is copy
the client reads**, which is §9.15 item 3's whole lesson. **Not fixed: it moves an approved
file and that is a decision.** The motion comp happens to hide it, because `.app.glide`
carries `overflow:clip`, and that is a side effect rather than a fix.

**2. A colour flash on first paint in Chromium, intermittently.** The controls carry
transitions on `background-color`, `border-color` and `color` inside
`@media (hover:hover) and (pointer:fine)`, inherited unchanged from A5 and present in all
five candidates. On some loads Chromium resolves the first paint before the authored style
and then **transitions the destinations from the browser's default blue link over 280ms**, so
the header briefly draws as unstyled boxes. **Measured: 2 of 6 renders in Chromium headless,
0 of 1 in Gecko**, and the client's default browser is Firefox. **Reported rather than fixed**,
because the one-line fix is to drop the colour transitions, which changes hover on a
just-signed-off candidate. If it is ever seen in a real Chrome, that is the cause.

**And three pieces of stale prose were corrected while editing the sections they were in.**
§7.10's heading said `REVISED AT SESSION 13, TWICE` against four rounds; `lock.css`'s
contents list said the comp gains `ONE span` against two; and `c3-glide.html`'s header
carried round one's whole timing table, `1520ms`, while its own visible caption said 1240.
**A file that contradicts itself is worse than one that is merely out of date.**

#### 15.12g What this does not cover

- **The three prototypes are built**, on the client's instruction, after being deferred once.
  See §15.12h. **The three share builds are not**, and they are a separate artifact: a share
  build is a generated self-contained export rather than a source file, and regenerating one
  is a generator run with two recorded defects in its history.
- **The share builds were not regenerated.** Same deliberate exception recorded at sessions
  10, 11, 12 and 13: §7 is inert for them, proved by grep, and all three re-render
  byte-identical.
- **The two native platforms get nothing**, because the instruction was the web platforms.
  `mobile-app/01-today.html` is untouched and `tablet-app` does not exist.
- ~~**§7.7 is still unrewritten.**~~ **DONE at the merge. It is §7.7 now**, the two sections
  numbered 7.6 having finally been renumbered. The 160ms ceiling is replaced by the four
  derived speeds, the 20px clause by the rule that a distance must be derived from something
  on the screen, and the clause forbidding motion on the note is deleted. The overshoot
  clause and the clause forbidding motion on the user's own words are unchanged and are
  satisfied.

### 15.12h THE THREE PROTOTYPES CARRY THE MOTION TOO, AND THEY ARE THE ONLY PLACE IT IS A SEQUENCE

**Deferred once with a stated reason, then asked for directly and built.** The reason for
deferring was that a prototype reveals a screen with `display`, and **an element going from
`display:none` to `display:block` starts its animations**, so every navigation replays a load.
**On the client's instruction that is taken as a feature rather than a fault**, and it is the
right reading: *arriving at a screen plays that screen's arrival*, which is what the built
product does and what twelve separate stills cannot show.

**THE HONEST OTHER HALF IS THAT GOING BACK ALSO REPLAYS**, and the built product must not do
that: a back navigation returns to a screen that is already drawn. It is stated on each file
and in its caption. **It is the same class of limitation as the sticky composer and the sticky
calendar index**, neither of which a static comp has ever been able to demonstrate.

**THEY ARE FORCED WITH `.mo`, FOR A STRONGER VERSION OF §15.12d's REASON.** A single-screen
comp can spend its fragment on the hatch. **A prototype spends its fragment on navigation** and
has none left, so `.mo` is not a preference here, it is the only mechanism. All 21 screens in
each file carry it.

**Verified**: 21 glide screens per file; **every internal link resolves**, 21 on mobile and
tablet and **26 on desktop**; checks 1 and 2 pass; no script and no inline style; the one
`<style>` block per file is the pre-existing `:target` navigation, which carries no colour,
type or spacing. **Only the product's own glance line takes `.gline`**: the prototypes carry
the user's restated question one more time on mobile and tablet and **twice on desktop**, where
it is an `h1`, and every one of those is left bare.

**AND ONE SCRIPTED MARKUP EDIT DAMAGED ALL THREE FILES BEFORE IT WAS CAUGHT, WHICH IS THE
FOURTH TIME IN THIS PROJECT AND THE FIRST THAT THE TAG COUNT MISSED.**
The `.lblbox` wrapper was line-based. **The numbered screens put `<summary>` on its own line
and the prototypes put it on the same line as the first label**, so on the prototypes the
opening span landed **outside** the `<summary>` and its close landed inside. Malformed, so the
browser discarded the summary's content and fell back to its own default marker: the note
rendered as **`▶ Details`** instead of `READ THE NOTE`.

> **THE TAG-BALANCE CHECK PASSED THE WHOLE TIME, AND THAT IS THE LESSON.** One span opened and
> one span closed, so the counts balanced exactly. **A count cannot see nesting.** It was found
> by rendering the file and looking at it, which is the instrument that has caught the last
> three of these too. The wrapper now anchors on the span rather than on the line, which is
> correct for both layouts, and **a nesting assertion was added to the checks**: every
> `.lblbox` must be found inside a `<summary>`. Re-run across all 39 motion files: **39 of 39
> balanced and correctly nested.**

### 15.12i TWO CHANGES FROM CLIENT REVIEW OF THE SET

**Both taken as their decision. The lock is still at revision 48 and no approved file moved.**

#### 1. THE PRINTED LINE TYPES, AND IT IS BOTH OBJECTS RATHER THAN ONE

**Client: everything between the two rules in the header types, D3's total included.**
§13.12 already established that `.glance` and `.total` are **the same slot** — the printed
line under the destinations, `.glance` on Today and `.total` on Timeline — so giving one a
behaviour the other did not have was the inconsistency rather than the fix.

**Both take `.gline`, for the same reason the glance needed it**: each carries its two rules
as its own borders, so clipping the element sweeps the ruling in with the words.

**ONE RATE, DERIVED FROM THE LONGEST PRINTED LINE IN THE PRODUCT**, which is `--g-date`'s rule
again rather than a new one. Measured:

| | characters |
|---|---|
| the glance | 47 |
| **the total** | **48** |
| the day seven total | 44 |

`--g-type` goes **800ms to 820ms** at **steps(48)**. 48 x 16.667 = 800.0ms is the floor at one
character a frame, so 800 sat exactly on it and 820 clears it at 1.025. **steps(48) over a 47
or 44 character line reveals in finer steps than one character**, which is inside the ceiling.

**AND THE DELAY IS CONDITIONAL, WHICH IS THE RULE'S OWN REASON APPLIED.** §15.11e runs the two
written objects in sequence because they are **the two pens on that screen**, and running them
together is cause 6. **On Timeline at 390 and 834 there is no date box at all**, so there is no
second pen and nothing to wait for: the line starts at 0. Where a hand-written date is present
it waits for it. Scoped with `:has()` on `.app`, so each device in a states pack is judged on
its own contents. **Verified by rendering both: desktop Timeline, which has a date box, holds
its total until 500ms; mobile Timeline starts typing at once.**

> **THE CLAUSE TO LOOK AT WHEN JUDGING THIS, AND IT IS THE CLIENT'S TO CONFIRM.** D3 says the
> only number in the product is never coloured, never badged and never counted down, and §8.1
> says it only rises. A sweep that reveals it left to right in the order it is read is the same
> gesture the glance already has, and it is not a countdown. **But a number that assembles
> itself in front of the reader is closer to being styled as an event than a number that is
> simply printed**, and that is a judgement rather than a measurement. Recorded rather than
> assumed.

#### 2. THE COMPOSER MOVES ON FOUR OCCASIONS AND ON NO OTHERS

**Client: it should not animate every time it is interacted with.** The four:

| | |
|---|---|
| 1 | the app opens, and it rises 64px |
| 2 | the journal is scrolled up, and it goes down until the option is hidden |
| 3 | the journal is scrolled back down, and it comes up |
| 4 | **it is interacted with while down**, and it comes up |

2 and 3 already worked and are one mechanism: a scroll timeline has no direction of its own.
**4 is new, and the first mechanism built for it was measured and thrown away.**

**THE FAILED ONE: DROP `g-tuck` ON `:focus-within` AND LET A TRANSITION CARRY THE VALUE BACK.**
An animation outranks a declaration, so the tuck has to be removed rather than overridden. It
was built. **It does not animate.** Measured in an isolated calibration page with a negative
transition-delay, sampling an element whose animation is removed: **0px at -10ms, at -120ms and
at 0s alike.** **A TRANSITION DOES NOT FIRE WHEN AN ANIMATION IS REMOVED.** It had a second
fault too: on blur the animation re-applies and wins outright, so the composer would have
snapped back down.

**WHAT WORKS IS SCALING THE ANIMATION'S OWN DISTANCE.** `--g-tuckable` is a registered number,
**1** at rest and **0** while the composer holds focus, and `g-tuck`'s end value is
`--g-hide * --g-tuckable`. The keyframe re-resolves its `var()` as the number transitions, so
the tuck's magnitude walks to zero and the composer rises. **Calibrated the same way: 200, 164,
59, 0 across the sampled percentages, which is a value walking rather than a value jumping.**

**THREE THINGS FALL OUT OF IT AND ALL THREE ARE THE INSTRUCTION.** Focus while tucked rises.
**Blur tucks back over the same duration**, which the failed mechanism could not do at all. And
**focus while already up does nothing**, which is what the instruction is really about: below
24px of scroll `g-tuck` is out of range and is not applying, so the number it is scaled by has
nothing to scale. **The composer cannot twitch when it is already where it belongs.** Verified
on the built comp: after a real focus the engine registers `CSSTransition:--g-tuckable` and
`translate` stays `none`.

**INSTANCES 2, 3 AND 4 ARE CHROMIUM ONLY, AND THAT IS NEW ONLY IN THAT IT NOW COVERS 4.**
All three depend on the scroll timeline, which Gecko does not implement, so in Firefox the
composer never tucks and therefore never needs to rise. **Instance 1 runs in both.** Measured:
Gecko reports `animationName: g-lift` where Chromium reports `g-lift, g-tuck`.

### 15.12j THE COMPOSER OPENED ALREADY TUCKED, AND THE CAUSE WAS THE REVIEW HATCH RATHER THAN THE MOTION

**Client: the journal opens with the composer already down at the point the checkbox is
hidden, and it moves again whenever the composer is interacted with.** Both are one cause and
it is not the animation.

**THE HATCH IS A FRAGMENT, AND A FRAGMENT SCROLLS.** Opening a comp at `#motion` makes the
browser scroll `.app` to the top of the window, and **in a comp `.app` is not at the top of the
document**: the stage sits above it, 24px of padding and the 40px browser chrome mock.
**Measured: `mobile-web/_motion/01-today.html#motion` landed at `scrollY 64`**, and 64 is
**inside `g-tuck`'s 24px to 120px range**, so the journal opened about 42% tucked and any
interaction that nudged the scroll moved the composer again. **Without the hash the same file
landed at 0 and was correct**, which is exactly why it only ever showed under review.

**THE FIX IS `scroll-margin-top:100vh` ON `.app.glide`.** A scroll margin taller than the
window makes the target position negative, which clamps to zero, so the journal lands at its
own top whatever the stage above it happens to be. **100vh rather than 64px on purpose**: the
number would be a measurement of presentation furniture carried into a product rule, and it
would need maintenance if the device frame ever changed. **It changes no box**, because
scroll-margin is not layout. **Measured after: `scrollY 0`, `translate: none`, and `g-lift` at
its start about to run**, which is the opening state the client described as correct.

**AND THE SECOND SYMPTOM IS A REAL FULL REPLAY, IN THE PROTOTYPE, AND I MEASURED THE WRONG
FILE FIRST.** The first probe gave `g-lift` a negative delay so it was already finished at load,
then focused, and it did not reappear in `getAnimations()`. **That was a true result about a
file where the interaction is impossible**: on a numbered comp the composer's field is a `div`
and cannot be tapped. **In a prototype it is `<a href="#f-typing">`.** Tapping it NAVIGATES; the
destination screen goes `display:none` to `display:flex`; **an element going from none to block
starts its animations**, so the composer of the screen you land on rises from below again. That
is the replay, and it is §15.12h's own recorded property arriving somewhere it is not wanted.

> **THE INSTRUMENT FAULT IS MINE AND IT IS THE SAME FAMILY AS THE REST.** I pointed the probe
> at `01-today`, where the field is a `div`, and reported "it does not restart" about a screen
> on which the reported interaction cannot happen. **A probe aimed at a file that cannot
> reproduce the report is not evidence.** The client's answer to a direct question is what
> found it.

**THE FIRST FIX WAS TOO BLUNT AND THE CLIENT CAUGHT IT.** It dropped the rise across the whole
walk, which stopped the replay and **also removed instance 1 from the prototype altogether**.
*Why is it no longer visible in the prototype. I need it there.* They are right, and the reason
is not preference: **instance 1 is the one instance that is about the app opening, and a walk is
where you open the app.** Recorded because the correction is the useful part: **a fix scoped to
the whole file when the fault belonged to one screen is the same class of error as a selector
that names the right object on the screen it was written against.**

**THE REAL SCOPE IS THE SCREEN YOU ARRIVE AT BY TOUCHING THE COMPOSER**, because that is **the
same screen one state later**. Today with something typed into it is not a new screen, so its
composer is already in place and must not enter. **Every other arrival in the walk is a real
arrival and still rises.**

**`.restate` IS DERIVED FROM THE MARKUP RATHER THAN NAMED.** The generator collects every
composer field's link target, **drops the search rows**, because a search field is a different
object, and **drops self links**, because they change no hash and therefore restart nothing.
`p-today`'s field links to `#p-today` and was excluded on exactly that ground. **On all three
platforms it resolves to exactly one screen, `f-typing`.** It is not the prototype's own
`.screen` class: keying a rule in `lock.css` on presentation furniture defined in another
file's style block is the coupling this project keeps catching.

**MEASURED AFTER, PER SCREEN.** `#f-today` and `#f-first` read `animation-name: g-lift, g-tuck`
with `transform: matrix(1,0,0,1,0,64)`, so **the composer rises**. `#f-typing` reads
`none, g-tuck` with `transform: none`, so **it does not re-enter** and the scroll tuck survives.

**ONE COST REMAINS AND IT IS REPORTED RATHER THAN GUESSED AT.** The date, the printed line and
the waveform **do** still re-run on that one transition, because CSS cannot tell a second state
of one screen from a real change of screen. **Only the composer is treated as continuous,
because only the composer was reported.** Extending it to the other three is one more selector
and is the client's call.

**AND THE INTERACTION RULE IS CONFIRMED RATHER THAN ASSUMED.** Asked directly: **tucked and
interacted with, it comes up; already open and interacted with, it does nothing.** That is what
`--g-tuckable` already does, because below 24px of scroll `g-tuck` is out of range and the
number it scales has nothing to scale. §15.12i.

### 15.12k SAVE REPLAYED IT TOO, AND THE PRO COMPOSER IS NOT A MOTION FAULT AT ALL

**Two more client reports, and they have nothing to do with each other.**

#### 1. Save replayed the entrance, because Save is also a link

`.restate` was derived from **composer field** targets only. **The commit control is a link too**:
on `f-typing`, Save points at `#f-today`, so tapping it navigated back to Today and Today's
composer entered from below again. **The field takes you into the typing state and Save takes
you back out of it, and both ends of that round trip are the same screen one state later.**
The derivation now collects both. **The mic is deliberately excluded**: it leads to `/talk`,
which is a real change of screen and has no composer at all. On all three platforms `.restate`
now resolves to **`f-today` and `f-typing`**.

**AND THE OPENING RISE SURVIVES WHERE IT MEANS SOMETHING, WHICH IS WHY THIS SCOPE IS RIGHT
RATHER THAN A COMPROMISE.** It looked like a straight conflict — Today is both where Save lands
and where you would want to see the app open — and it is not, because **`f-today` is not an
index chip.** The walk's entry points are first run, timeline, return, transcribing, Pro today
and ask. **Today is only ever reached by navigating inside an app that is already open**, and
**the app opens at first run**, which is the first chip on the index and keeps its entrance.
Measured: `#f-first` reads `g-lift, g-tuck` with `transform: matrix(1,0,0,1,0,64)`, while
`#f-today` and `#f-typing` read `none, g-tuck` with `transform: none`.

#### 2. The Pro composer is not tucked. It has no checkbox.

**Client: in the Pro version of the prototype the composer is permanently in the tucked away
state.** It is not tucked and nothing is animating it. **Measured on the signed prototype: four
of its seven composers carry no `.opt` at all** — `p-today`, `p-first`, `p-progress` and
`f-return`. With no `.opt`, `.composer:has(.opt)` never matches, so **there is no `g-lift` and
no `g-tuck` on those screens**: measured `animationName: none`. And with no checkbox in the
markup the composer draws as a field and a record control, **which is exactly what the tucked
state looks like.**

> **IT IS A CONTENT DEFECT IN AN APPROVED FILE, AND IT CONTRADICTS THIS DOCUMENT.** §7.4 says
> **`Keep this out of memory` is present in the composer on every tier**, and §8 gives it as the
> composer's secondary. The numbered `mobile-web/01-today.html`, which is Pro, carries it. **The
> prototype's Pro Today does not.** So the walk disagrees with the numbered screens and with the
> binding document on four composers. **Reported at first, then fixed on the client's
> instruction: §15.12l.**

---

### 15.12l THE MISSING OPTION IS FIXED, AND IT WAS WIDER THAN THE PRO SCREENS

**Client instruction: fix it, and adjust the motion for Pro.** Both done. **This is the only
work in session 14 that moves an approved file, and it moves TWELVE.** Recorded as theirs.

**IT WAS NEVER ONLY A PRO PROBLEM, WHICH IS WHY THE AUDIT CAME BEFORE THE FIX.** Scanning every
composer in every approved file rather than the ones that had been reported found **27 instances
across 9 files**, and only twelve of them were the Pro screens the client saw:

| file, on each of the three web platforms | composers missing the option |
|---|---|
| `00-prototype` | **4** — `f-return`, `p-progress`, `p-first`, `p-today` |
| `11-states` | **3** |
| `12-upgrade` | **2** |

**`f-return` is a Free screen**, so the fault was never about the tier at all: **every one of
them is a composer drawn AT REST with the placeholder in it**, and the ones that had the option
are the mid-draft states. The rule it breaks is §7.4, which says the option is present **on
every tier**, and §8, which gives it as the composer's secondary. **`mobile-app/01-today.html`
is clean and was not touched**, which matters because the native comp's scroll offset is a
measured 292px that a taller composer would have invalidated.

**THE SHARE BUILDS CARRIED IT TOO, AND THEY WERE PATCHED RATHER THAN REGENERATED.** They inline
the prototypes, so all three had the same four. The standing rule is to edit the sources and
regenerate, **and regenerating means reconstructing a generator with two recorded seam defects
in its history**, against a fix that is the same nine lines of markup in all four places.
**Session 8's `:not(#start)` patch is the precedent for a targeted direct edit**, so that is
what was done, with the generator's own seam assertions run afterwards: **no BOM, no `*///*`,
`:root` surviving exactly once, one style block, and every div balanced.**

**THE MOTION FOLLOWED WITHOUT A RULE CHANGE, WHICH IS THE PART WORTH KEEPING.** `g-lift` and
`g-tuck` are keyed on `.composer:has(.opt)`, precisely because §15.12b fault 3 established that
**a composer with nothing to reveal has nothing to reveal by moving**. So restoring the option
restored the motion by construction: **measured on the walk, `p-today`, `p-first` and
`p-progress` went from `animationName: none` at 85px tall to `g-lift, g-tuck` at 135px, with the
rise running.** Nothing in §7 was edited to achieve it. **A rule written against the reason
rather than against the symptom did the right thing when the content was corrected.**

**VERIFICATION.**
- **Snapshot taken before the scripted markup edit**, per the standing rule, and the edit was
  line based with a depth counter rather than a regex over nesting.
- **All 27 inserted; 0 composers now missing the option anywhere in the product.**
- **Tag balance on all 12 edited files**, against the snapshot: balanced on div, span, p and
  button, with the button count up by exactly the number inserted in each file.
- **All 43 approved files re-rendered: 6 move in a default render** — `11-states` and
  `12-upgrade` on all three platforms. **The three prototypes and the three share builds changed
  on screens a default render does not show**, which is session 7's recorded limitation, so each
  was verified separately at `#p-today`: changed, as intended.
- **The tap floor needed nothing.** `.opt` carries `min-height:var(--tap)`, so the inserted
  control is 44px by the component rule rather than by a new measurement.
- Check 5 passes; checks 1 and 2 pass on all 12 edited files and all 39 comps.

### 15.12m SAVE IS GIVEN SOMEWHERE ELSE TO BE, BECAUSE ONE SCREEN ID CARRIED TWO MEANINGS

**Client: after making an entry the composer stops animating when you switch back from another
screen.** It does, and it is my scoping rather than the motion.

**`#f-today` IS BOTH THE SAVE DESTINATION AND THE DESTINATION ROW'S TODAY TAB.** Marking it
`.restate` to stop Save replaying the entrance also suppressed it for **every** arrival, so
switching from Timeline back to Today no longer rose either. **CSS cannot know where you came
from; it can only know where you are.** Ten links point at `#f-today` in the walk: one is the
commit control and nine are the TODAY tab on other screens, and a rule on the destination
cannot tell them apart.

**SO SAVE IS GIVEN SOMEWHERE ELSE TO BE.** The generator duplicates the Today screen as
`#f-today-saved`, points **only the commit control** at it, and leaves the other nine links on
the original. The `.restate` derivation then marks the duplicate automatically, because it is
still just "the target of a link that is the composer". **Nothing in `lock.css` changed for
this**; the rule was already right, it was the markup that was overloaded.

**MEASURED, PER SCREEN.**

| arriving at | by | composer |
|---|---|---|
| `#f-first` | the index, the app opening | **rises**, `g-lift, g-tuck` |
| `#f-today` | the TODAY tab, switching back | **rises**, `g-lift, g-tuck` |
| `#p-today` | the Pro index chip | **rises**, `g-lift, g-tuck` |
| `#f-typing` | tapping the field | still, `none, g-tuck` |
| `#f-today-saved` | tapping Save | still, `none, g-tuck` |

**THE COST IS A STATED DIVERGENCE AND IT IS THE FIRST OF ITS KIND IN THIS FOLDER.** The motion
prototypes now draw **22 screens against the signed 21**. Every other comp in `_motion/` differs
from its source only by the class list, the id, the stylesheet path, the prose and two spans;
**this one also carries a duplicated screen.** It adds no index chip and is reachable only from
Save, so the walk reads the same. **Recorded rather than absorbed**, because the folder's stated
property is what makes these files usable as proxies for the signed ones.

**THE ALTERNATIVE WAS TO KEEP GUESSING AT WHICH HALF TO LOSE.** Without the duplicate the choice
is: Today rises and Save replays, or Save is still and Today never rises. **Both were built and
both were rejected by the client in turn**, which is what established that the two meanings had
to be separated rather than traded off.

**Verified**: 22 distinct internal links on mobile and tablet and 27 at desktop, **0 broken**;
**no duplicate ids**; all 39 comps balanced; checks 1 and 2 clean; **the signed prototypes are
untouched and still draw 21 screens**; and the only approved files that have moved this session
remain the six from §15.12l.

**Stopping here.** No Stage 3 screens until this is approved or revised.


## September 2026 account and state extension

See [AUTH-HANDOVER.md](AUTH-HANDOVER.md) for the added login, registration, recovery and state routes, canonical files, assumptions and verification. The user requested You in every web navbar to open login. This extends the established design and supersedes the earlier direct-to-account prototype route. All three web prototypes now have 91 screen fixtures; each platform adds numbered files 13 through 16. Account forms compose the existing field, button, sheet and notice components. No new palette, dialog or motion primitive; existing C3 behavior is integrated into the added pages. New sample copy is recorded verbatim in those four numbered files on each platform; these copies must agree. The original native-stage scope remains unchanged.


### Follow-up: background account progress

Login and registration now open account settings immediately. Keeping the journal is an inline text bar with native progress below navigation, carried across all 35 signed-in prototype views on each web platform. Signed-in You opens settings. Prior full-page pending hash targets now show settings as well. The existing progress component is also permitted for this account task. The 60% value is a review fixture; real progress and completion must come from the background operation. See AUTH-HANDOVER.md for updated routes and static limitations. This supersedes the earlier pending-screen flow.


## Completed motion integration into the current handover

The reference is AIJournal-v2's three platform `_motion` folders. Original numbered motion behavior is retained. The newer account and flow pages now reuse C3 product-line typing on their first introductory sentence, at 820ms / 48 per character; fields, errors, notices and progress remain immediate. Controls reuse the existing 160ms press and 280ms release. The 91 current states per platform, account routing and signed-in progress are preserved. The composer remains tucked beyond 120px and the typing/saved fixtures suppress all arrival effects, including in signed-in copies. Reduced-motion covers those fixtures explicitly. See [MOTION-HANDOVER.md](MOTION-HANDOVER.md) for the integration contract.
## Approved main recorder extension, 7 October 2026

The user selected Compact Transport from the recording studies and authorized
its merge into the main design. The common capture shell keeps the punched rail
at the left edge and the graph across the remaining width. Content determines
height; the measured waveform is 80px tall. Ready and recording share one sheet.
Native browser permission appears on opening the recorder, while capture begins
only after Start. Disabled grey Start plus inline recovery is the user-approved
microphone exception to the historical disabled-control rule.

Measured audio replaces the decorative C3 loop for newly captured memos. An RMS
sample every 40ms feeds 128 recent bars (5.12 seconds); saved geometry uses 128
peak bins covering the whole memo. Saved bar rects are explicitly centered so
SVG instances keep their origin. Playback advances a clipping transform over
that unchanged geometry. Its 60ms linear interpolation bridges native audio
clock updates of roughly 40ms observed in Firefox. Two opacity layers settle
over 180ms with `cubic-bezier(.16,1,.3,1)`, the approved study's finish behavior.
The timer occupies at least eight character widths before playback, stacked
elapsed and total; digits do not shorten the waveform. Natural finish retains
the full waveform; manual Stop settles from the currently rendered position.

These motion values carry over the approved study, rather than changing the
existing C3 timings. Review HTML keeps `data-motion-review="play"`; without that
attribute reduced motion freezes waveform drawing/reveal while audio remains
usable. Canonical sources and proof are listed in `docs/recording/DESIGN.md` and
`verification/compact-merge/`.
## Persistent web navigation, 7 October 2026

The user requested that the whole header stay in place while scrolling on mobile
and tablet. Their masthead and destination row stay together in one opaque paper
header; pushed pages keep their Back header. Desktop uses its binding column as a sticky
sidebar. A two-column grid preserves its original width, rail and page alignment.
Short viewports allow the sidebar to scroll independently. This supersedes the
historical rule that only the composer stays fixed in web previews. Destinations
retain their original labels, order, targets and colors.

## Writing companion integration, 7 October 2026

The user approved merging Writing companion into the main web design. Recent
overview is immediately readable above the writing input; its footer remains
fully visible, superseding the C3 tuck/arrival for this composer variant only.
Other C3 objects retain their approved motion. The footer height limit reserves
the measured full header and at least 44px of reading space.

Today felt shares the entries' --tcol column and 1px divider. All web journal
gutter labels align left with 8px horizontal inset; min-width:0 prevents label
text from moving a divider, and record-note tracking is .04em. Past-day mood
reads Day felt. Mood choices run Light, Good, Even, Low, Hard left to right.
The user approved five green/olive/amber/rust/red tone tokens and pale paper
tints, scoped to mood feedback; each tone exceeds 4.5:1 against its tint.
Selection is also underlined. Hover enters in 160ms and exits in 120ms, matching
entry feedback; pointer press and keyboard focus are immediate. Touch retains
selection. Production reduced motion removes these fades; review preserves the
explicit Windows-animation override. These are approved extensions to the
earlier palette and motion inventory. Native work remains deferred.
