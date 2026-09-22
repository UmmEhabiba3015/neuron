# CLAUDE.md — working in this folder

**This is a finished design handover, not a codebase.** Forty static HTML screens and one
stylesheet describe a product called Journal. Nothing here is a build: there is no
JavaScript, no framework, no data, no backend. Your job is either to **build from it** or to
**extend it**, and the two have different rules.

---

## Read these before touching anything

| | |
|---|---|
| `PROJECT.md` | Start here. §0.2 is the nine things a build is most likely to get wrong. |
| `ai-journal-brief-v2.md` | **The source of truth.** Where anything disagrees with it, it wins. |
| `00-flow.md` | Routes, navigation, back-button behaviour, the five traced paths. |
| `direction-lock.md` | **Binding.** Colour, type, space, components, behaviour, content. |
| `lock.css` | The same deliverable in CSS. **Revision 49.** |

**Do not skim `direction-lock.md`.** Almost every rule in it has a measured argument
underneath, and the arguments are there because the obvious alternative was tried and
failed. §15 in particular is long and is history — read the banner at its head, then
§15.12a onward if you are touching motion.

---

## The three things most likely to make you break something

**1. Every number in the motion system is derived, not chosen.**
`--g-date` is 500ms because the widest date in the product is 225.2px over 15 characters and
440ms crossed 1.12 characters a frame against a ceiling of one. `--g-hide` is 64px because
that is the measured distance from the out-of-memory option's top to the composer's bottom
edge. **Change a duration and you have to redo its derivation**, or the system stops being a
speed limit and becomes a set of numbers someone typed. `direction-lock.md` §7.7 has the
four rates and what bounds each.

**2. `.gline` and `.lblbox` look like redundant wrappers and are load bearing.**
`.gline` is the mark that says a printed line is *the product speaking*. Ask's screen puts
the user's own restated question in the same visual slot; it does not carry `.gline` and so
does not type. **Delete the span and the product types the user's own words**, which
§7.7 forbids outright. `.lblbox` gives the note's two labels one clipped slot to roll
through; without it they swap between two paints.

**3. Two behaviours are Chromium-only on purpose and are not bugs.**
The composer's scroll tuck (`animation-timeline: scroll()`) and the note's opening height
growth (`interpolate-size`). **Neither declares a fallback, deliberately**: where the
capability is missing the screen is complete rather than approximated. Four mechanisms were
built to make the height growth cross-engine and all four were backed out for measured
reasons — the table is `direction-lock.md` §15.11i. **Do not pay for them again.**

---

## If you are building the product

**Six build obligations are in `direction-lock.md` §7.4.** Every one of them is a thing that
is correct in a static file and wrong in a running product, so no comp can show them to you.
The short version:

1. The composer's placeholder is its only accessible name. In a comp the field is a `div`;
   in your build it is an `input`, and a placeholder is not a reliable accessible name.
2. Timeline's index must scroll without pushing a history entry.
3. The composer's fourth movement — *interacted with while tucked* — is unreviewable in 36
   of the 39 comps, because the field is a `div` and cannot take focus. **Build it and check
   it against the rule**: tucked and touched, it rises; already up and touched, it does
   nothing.
4. A back navigation must not replay a load. The prototypes replay because a screen is
   `display:none` until its hash targets it; that is the only mechanism a no-script
   prototype has, and it is not the behaviour.
5. A second state of one screen is not an arrival. Typing into the composer and pressing
   Save both stay on Today, so nothing should re-enter.
6. Nothing that exists to make a comp reviewable may ship: `overflow:clip` on `.app`,
   `.restate`, and the duplicated `#f-today-saved` screen in the prototypes.

**Then read `00-flow.md` §2 on the back button.** It is the part of the flow most worth
getting right and the part no static file can demonstrate.

---

## If you are extending the design

**The component inventory is closed at thirty seven** (`direction-lock.md` §6). Anything not
on it is a conversation before it is a file. Tabs, badges, avatars, tooltips, toasts,
skeletons, spinners, carousels, shadows and gradients are named as excluded so they cannot
arrive by drift.

**Stage 5 is open: the mobile app has 1 screen of 12 and the tablet app does not exist.**
The queue and the two things to carry into it are in `PROJECT.md` §8. The native pass is
**not a wrapper** — `00-flow.md` marks every native delta with `⌁`.

**Rules that are not negotiable without a decision:**

- **No colour literal outside `lock.css`.** Eight roles, no ninth. This is what keeps the
  deferred dark mode a one-file change.
- **No CDN, no external request, ever.** Every file is self-contained or links `../lock.css`
  relatively. Never `@import`.
- **No JavaScript.** States are drawn, not behaved. `<details>`/`<summary>` is markup and is
  allowed.
- **Accessibility floor on every file**, including 44px targets and survival at 200% type.
  Three documented exceptions and no others: `PROJECT.md` §0.3.
- **The header comment and the caption at the foot of each file are part of the
  deliverable.** A caption is copy someone reads. A file that contradicts itself is worse
  than one that is merely out of date.

---

## Rendering it

```
msedge --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir=<ABSOLUTE PATH> --window-size=470,1600 \
  --screenshot=out.png "file:///.../mobile-web/01-today.html"
```

Window widths: **470** for mobile (the 390 device plus its stage padding), **920** for
tablet, **1520** for desktop. `--user-data-dir` must be an **absolute** path.

**A default render shows every screen finished and still, and that is correct.** Headless
reports `prefers-reduced-motion: reduce`, and `direction-lock.md` §7.7 says remove motion
entirely rather than shorten it. **Add `--force-prefers-no-reduced-motion` to see the
motion** — and remember that a render taken with a flag that changes what the design does is
a render of a different design, so look at both.

**Anything touching motion gets run in Gecko too.** Firefox headless needs the URL *before*
the `-screenshot` flag and needs `-no-remote -profile`.

**A negative `transition-delay` is how you look at a transition.** It starts the transition
part way through so one screenshot lands at a percentage you choose, in both engines.
Slowing, freezing and seeking a transition all fail differently; this does not.

**`--virtual-time-budget` hangs on Windows** and produces no file at all.

---

## Instruments that lie, all of them measured

This project spent five sessions learning that **the instrument is wrong more often than the
design**. Check any measuring instrument against a known value before believing its output.

- **A tag-balance count cannot see nesting.** A line-based edit once put a `<span>` outside a
  `<summary>` on three files and the counts balanced perfectly, because one span opened and
  one closed. The note rendered as the browser's own `▶ Details` marker. **Assert nesting,
  not just counts.**
- **A probe aimed at a file that cannot exhibit the reported behaviour is not evidence.**
- **`getAnimations()` does not enumerate `::details-content` transitions in Chromium.** They
  run but cannot be listed, seized or seeked. A probe reporting the note as having no
  transition is reporting its own blind spot.
- **A transition does not fire when an animation is removed.** What works for scaling a
  running animation is a registered custom property the keyframe multiplies by.
- **A freeze probe that seeks every animation also seizes the transitions**, and a transition
  at time 0 holds its pre-transition value — which renders the destinations as unstyled blue
  links and looks exactly like a broken stylesheet.
- **Scroll-timeline values do not update on a forced layout**, so a scroll-driven animation
  cannot be read from a DOM dump at all. It needs a rendered frame.
- **A substitution on a fragment cannot see the sentence it is inside.** Snapshot before any
  scripted markup edit, and diff after.

**The known values to calibrate against**, all reproducible on `mobile-web/01-today.html`:
page **366**, sheet **813.13**, wave row **154.30**, keybox value **206.03** over 13
characters, glance **47** characters, the composer's option top **64.00px** above its bottom
edge, the voice **1.7898:1** against the ink, the recording's band **1.8339:1** against the
sheet at luminance **0.4822**.

---

## Checks to run before calling anything done

`direction-lock.md` §10 has all five in full. Mechanically:

```
grep -c "http://\|https://\|@import\|—\|–" */*.html | grep -v ":0"
grep -nEi "#[0-9a-f]{3,8}\b|rgb\(|hsl\(|color-mix\(" */*.html
```

Then **render it and look at it**, then **greyscale it** — rule 1 says the ink and rust
distinction survives greyscale and rule 2.4 says colour never carries information alone, and
both are checkable by desaturating a screenshot and reading it. Then assert that `lock.css`
parses: no BOM, no CRLF, `/*` and `*/` balanced, brace depth returning to zero.

**And read content against content.** Five faults in this project were screens making false
statements about the user's own record — a reflection that miscounted the week, a Saturday
recording on a Sunday sheet, a total counting a row that was not drawn. **Not one was
visible to any mechanical check.**

---

## The generated files

`journal-prototype.html`, `journal-prototype-tablet.html` and `journal-prototype-desktop.html`
are **generated** — each is its platform's `00-prototype.html` plus `lock.css`, inlined, for
sending to someone who does not have this folder. **Never hand edit them.** Edit the two
sources and regenerate. Editing them directly guarantees drift, and the generator has two
recorded seam defects in its history: a bad comment join that discarded the whole `:root`
block, and a BOM that made the parser swallow it. Both render as a completely unstyled page.
Assert against both after any regeneration.
