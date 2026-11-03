# Journal design, v4

The v4 design handover for Journal, 30 October 2026. It answers the v4 design request and
replaces `../AIJournal-v3` as the design to build from. Everything opens by double-clicking, offline,
with nothing installed. To open it on another computer, or rebuild it, see
[EXPORT-HANDOFF.md](EXPORT-HANDOFF.md).

## Start here

| Open | What it is |
|---|---|
| [journal-website.html](journal-website.html) | **The design to build.** The full website in one file. It opens at Log in and switches between the phone, tablet and desktop layouts as the window changes width. Sign in is a design interaction, not a real account; text and recordings stay until the page is reloaded. |
| [journal-skeletons.html](journal-skeletons.html) | The same website with every loading page showing its skeleton for 1.8 seconds first. **Hold** (H) keeps a skeleton on screen; **Replay** (R) shows it again. This panel is review-only. |
| [journal-prototype.html](journal-prototype.html), [tablet](journal-prototype-tablet.html), [desktop](journal-prototype-desktop.html) | Walkthroughs: every screen and state on one page per platform, with an index of routes. |
| [dist/catalogue/index.html](dist/catalogue/index.html) | **The component library**: every module in every variant and state. |
| [design system/index.html](design%20system/index.html) | The design-system guide: tokens, type, motion and a component test (`design system/components/tests/runtime.html` should say **Passed**). |
| `mobile-web/`, `tablet-web/`, `desktop-web/` | One static comp per screen and state pack, numbered `01-today` to `18-entry-system-states`. Generated from the page modules; open them beside `lock.css`. |
| [motion-index.html](motion-index.html) | Every screen, for checking motion. |

## What changed since v3

- **Reflections** is its own destination beside Today: a weekly booklet of reflections, the newest
  week first, with earlier weeks below and links to the entries each note used.
- **Timeline** has a new calendar, mood graph and search (search moved here from Ask). A jump to a
  day lands with a wash and a frame round its entries; today's new entries join today's day.
- **Ask** is only a conversation: each visit opens a new session, earlier sessions are in History,
  and every answer and note carries thumbs up and down (down asks "What was wrong?" in one line).
  "That's not right" is gone everywhere.
- **Today** opens with one line from the latest weekly reflection, which leads to it.
- **Drafts:** a written draft stays in the composer; an entry that fails to save stays in Today's
  list marked unsent, with automatic retry and **Try again**; leaving the recorder pauses and keeps
  a memo draft, which can be played back or discarded.
- Every memo draws the same waveform at a fixed pitch; it never follows the sound.
- Every loading page has a **skeleton**.
- A focused input thickens its own border instead of drawing a ring outside it. Sign-in and
  register errors sit on the field's label row.

Every decision, with its reason, is in DESIGN.md's **Decisions** log.

## The component library

The design is built from 70 modules: 6 layout, 39 components, 12 sections, 13 pages.

| Folder | Use it for |
|---|---|
| `dist/catalogue/` | One page per module, every variant and state. Links inside the specimens (a navigation bar's `00-prototype.html#today`) are sample markup and don't go anywhere from the catalogue. |
| `dist/contracts/` | Each module's API as JSON: variants become props, slots become children or named props, events become callbacks (`card:select` → `onSelect`). |
| `dist/types/` | Generated TypeScript props for each module. |
| `dist/css/`, `dist/system.css`, `dist/system.js` | Each module's CSS, all of it in one file, and the small runtime. |
| `dist/modules.json` | The inventory: every module, its layer, version and who uses it. |
| `system/` | The source: `tokens.json`, `base.css`, `modules/` (each with its README and contract), `comps/` (what each screen contains), `content/` (sample data). |

Tokens are in `system/tokens.json` and as CSS custom properties in `dist/system.css`. `lock.css`
is the whole stylesheet the screens use.

## Documents

| Read | For |
|---|---|
| [DESIGN.md](DESIGN.md) | The design system, module rules and the Decisions log. |
| [direction-lock.md](direction-lock.md) | The binding visual, accessibility and motion rules, with their measurements. |
| [PROJECT.md](PROJECT.md) | The product as designed: what is settled and what is open. |
| [AUTH-HANDOVER.md](AUTH-HANDOVER.md) | Sign in, register and the account states. |
| [MOTION-HANDOVER.md](MOTION-HANDOVER.md) | Motion rules, lifecycle and reduced motion. |
| [docs/navbar/DESIGN.md](docs/navbar/DESIGN.md), [docs/recording/DESIGN.md](docs/recording/DESIGN.md) | The navigation bar and the recorder in detail. |
| [ASSETS.md](ASSETS.md) | Every font and icon, its source and licence. |
| [reset-email.txt](reset-email.txt) | The password-reset email copy. |

Where documents disagree, the newer wins: the Decisions log and the modules' READMEs over the
older narrative documents.

**References to files not included.** Some documents mention earlier records: `V3-REVISION.md`,
`00-flow.md`, `ai-journal-brief-v2.md`, `flow-review.md`, `RecommendedChanges.md`, `AGENTS.md`.
Their v3 versions are in `../AIJournal-v3/`; where they disagree with this folder, this folder
wins. Paths under `explore/` (design explorations), `verification/` (check evidence) and the
cleanup archive are the designer's working records and are not part of the handover.

## Motion and reduced motion

Every file here follows the device's reduced-motion setting. With reduced motion on (on Windows,
"Animation effects" off), screens appear without animation, as the product should. Turn it off to
see the motion. The designer's own review copies carry a switch, `data-motion-review="play"`, that
plays motion regardless; the handover package removes it, and it must never ship in the product.

## Open, and not in scope

- What is still open is listed in PROJECT.md §7 and in DESIGN.md wherever a row says "the
  developer's" (for example where the account keeps a reflection's seen record).
- The native app is not in scope. `mobile-app/01-today.html` is the only native screen and is kept
  because the motion index links to it.
- Dark mode is not designed.

## Rebuild

Node.js 22 or later, nothing to install:

```sh
node scripts/build.mjs
```

It writes the modules into `dist/`, every numbered screen from its page module, the walkthroughs,
the website, the skeleton review, the motion index and the guide. Edit `system/` (and
`design system/index.source.html` for the guide's prose); never edit generated files by hand.
Checks and packaging are in [EXPORT-HANDOFF.md](EXPORT-HANDOFF.md).
