---
name: Journal Quiet navbar
description: Approved mobile and tablet navigation in the main Journal website and portable walkthroughs.
colors:
  paper: "#F5EDE1"
  paper-2: "#FBF6EE"
  rule: "#6E4740"
  rule-2: "#8A6156"
  block: "#364434"
typography:
  brand:
    fontFamily: 'Constantia, "Journal Portable Prose", "Palatino Linotype", Palatino, "Iowan Old Style", "Hoefler Text", "Times New Roman", Georgia, serif'
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-.015em"
  date:
    fontFamily: '"Ink Free", "Journal Portable Hand", "Segoe Script", "Bradley Hand", "Snell Roundhand", "Brush Script MT", cursive'
    fontSize: "29px"
    fontWeight: 400
    lineHeight: 1
  label:
    fontFamily: '"Segoe UI", "Journal Portable Labels", system-ui, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "11px"
    lineHeight: 1.3
    letterSpacing: ".07em"
rounded:
  control: "2px"
spacing:
  navigation-gap: "4px"
  compact-top: "8px"
components:
  destination:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.rule}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 4px"
  destination-current:
    backgroundColor: "{colors.block}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 4px"
  destination-compact-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.rule}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 4px"
---

# Design System: Journal Quiet navbar

## Overview

**Creative North Star: "Field record, taste."** This is the existing direction in [direction-lock.md](../../direction-lock.md), applied to the user-approved Quiet navbar. The paper ground, printed destinations, forest current destination and handwritten date preserve Journal's visual hierarchy while returning space to reading.

This document captures the implemented navbar, dated 7 October 2026. [V3-REVISION.md](../../V3-REVISION.md) governs current product scope; the Quiet navbar integration at the end of the direction lock governs this revision's motion. The numbered screens remain the design of record, with the shared runtime supplying interactive compaction. This component document introduces no new product scope, palette, type family or visual direction.

**Key characteristics:**

- Five persistent destinations, ordered Today, Reflections, Timeline, Ask and You (v4 B7, 2026-10-20; four before it).
- A compact date between Ask and You (full on tablets, 9 Aug on phones, none below about 355px); quieter inactive journal links.
- Native content scrolling, with different home edges for journal and other pages.
- Constant destination geometry through expansion and compaction.

The standalone website and all three walkthroughs include the shared controller. It prepares mobile/tablet routes lazily when a page has the existing wordmark and five-link destination row. Authentication, pushed pages with Back headers and desktop binding-column navigation retain their own treatment. Native work remains paused after the existing Today specimen.

## Colors

The navbar uses the existing cream, rust and forest roles from [lock.css](../../lock.css).

| Role | Applied to |
| --- | --- |
| `paper` | Opaque header ground; current destination text. |
| `paper-2` | Expanded inactive buttons and the retained You button. |
| `rule` | Brand, date, destination text, inactive hover border. |
| `rule-2` | Inactive button borders. |
| `block` | Current destination fill and border; existing keyboard focus outline. |

In compact state, inactive Today, Timeline and Ask have transparent backgrounds and borders. Their padding and border widths still occupy the same space. The current destination and You remain buttons; when You is current, it receives the same forest fill as every other current destination. Quiet inactive links gain an underline on hover. Selection remains visible through fill, border and `aria-current="page"`.

Color literals belong in the shared stylesheet. The extracted frontmatter records those values for documentation; it is not a second implementation theme.

## Typography

Brand, date and labels reuse the three existing family stacks recorded above. Embedded Lora, Source Sans 3 and Caveat provide the portable fallback faces; the navbar adds no font dependency.

The real brand uses the 34px masthead role and the real date uses the 29px handwritten role. Their transforms fit available space. In compact state the date scales to at most an 18px visual size, with additional fitting to its slot when needed. This is the approved compact-date treatment, superseding the older general handwritten-size rule for this component.

Destination labels retain uppercase styling and `.07em` tracking. They are 11px with a 1.3 line height, or 10px at viewport widths of 360px and below. Every label stays whole on one line. Enlarged text changes the arrangement of whole controls rather than splitting their words.

## Layout

The transformed page is a bounded flex layout containing the header, a native `.journal-reader`, and the composer when present. `.navbar-page` resets `--lead:0px`: the legacy desktop container rule adds `margin-top:var(--lead)` to the page's first child, so this reset keeps the tablet header at the top near the upper profile boundary when the document scrollbar disappears. The standalone website uses `100dvh`; framed walkthroughs derive their bounded height from the visible page position and viewport.

All direct page content other than the header and composer moves into the reader: sheets, search, notices, settings and supporting content. The reader has a 44px minimum height, `overflow:auto`, contained vertical overscroll, a stable scrollbar gutter and disabled browser scroll anchoring. The composer remains outside that reader and limits its own height so reading space remains available.

The destination grid is `Today | Timeline | Ask | date slot | You`. Button columns take their intrinsic widths; the date slot receives the remaining space. Normal gaps are 4px, with 4px horizontal button padding. At widths of 360px and below, gaps and button padding are 3px and the row has 8px horizontal padding. Every destination has a minimum target of 44px in both dimensions.

When the page is narrower than 600px and any computed destination label exceeds 16px, the controller applies the enlarged-text layout. Today and Timeline occupy the first row; Ask, the date slot and You occupy the second. Both rows have a 44px minimum. This arrangement applies in both header states, preserving whole labels and stable button geometry.

The standalone website selects profiles using `innerWidth`: mobile below 739px, tablet from 739px to below 1239px, desktop from 1239px. These boundaries are independent of document-scrollbar width. Changing to inner scrolling therefore cannot repeatedly switch the responsive profile.

## Elevation & Depth

The navbar has an opaque paper background with no shadow or gradient. Existing borders and the filled current destination provide hierarchy. The header sits above content at the existing header stacking level; the writing companion remains below it. Authentication's separately approved shadows are outside this component's scope.

## Shapes

Buttons retain the shared 2px corner radius and existing border width. Compaction fades border color and background color; it does not remove borders or alter button padding. The masthead, reader and paper ground add no new rounded surface.

## Components

### Scroll behavior and restoration

| Page type | Opening position and home edge | Compaction |
| --- | --- | --- |
| Journal page with a composer | Newest end, at the bottom | Reading older content compacts the masthead; returning to the bottom expands it. |
| Other page with four destinations | Top | Scrolling away from the top compacts the masthead; returning to the top expands it. |

The controller treats positions within 24px of the appropriate edge as home. Ordinary reader scroll, wheel, touch and keyboard intent support this behavior. Native scroll input remains passive. The reader is a focusable region with a content label; Home/End, Page Up/Down and arrow keys retain native reading behavior.

Per-route snapshots retain compact state, scroll position and whether the reader was at home. Core journal restoration additionally records an entry key and its position relative to the reader. Across reflow it preserves the same part of the entry, or follows the newest end when already there. The shared `isPositioning` callback suppresses navbar changes caused by restoration geometry. Memory-control focus uses `preventScroll`, avoiding an unintended jump while changing memory inclusion. These snapshots are in-memory review state, not account persistence.

### Brand, date and page controls

The original brand element becomes `.navbar-brand`; one real `<time>` element supplies the visible date. Hidden clones occupy the original masthead positions for measurement and are `aria-hidden`. The date-slot spacer is also `aria-hidden`. They are measurement furniture, not duplicate spoken content.

For a dated masthead, the date comes from its own `.keybox .v` and is parsed into `datetime`. Headers without a date, including Timeline and You, never create a compact date. Their original context clears with the masthead. The spacer between Ask and You remains empty on those pages.

Timeline's `.seg` selector moves from the masthead to the top of the reader, where it remains operable. Ask's search area remains inside the same reader. Compact masthead content becomes inert so hidden controls cannot retain keyboard interaction.

### Motion and accessibility

Header height, destination-row translation, and real brand/date transforms use **280ms** with the established C3 curve, `cubic-bezier(.42,0,.58,1)`. Masthead and brand/date opacity, plus destination background and border color, use **180ms ease-out**. The brand clears through opacity; the real date travels into the slot between Ask and You. There is no crossfade between two visible dates.

The bounded height transition returns actual space to the reader. A transform alone would leave unused header height. Destination widths and spacing remain constant in both states, so horizontal FLIP animations are absent. Reversing scroll intent uses the existing transitions from their current visual position.

Preparation, restoration, resize and font settling lay out immediately. Production with `prefers-reduced-motion:reduce` also switches immediately. Review files keep the user-requested `data-motion-review="play"` override so motion remains reviewable with Windows animations disabled; no OS preference is changed. Production integration must omit that review attribute.

Links retain their semantic anchors and current-page state. Existing `:focus-visible` treatment supplies a 2px forest outline with 2px offset. Measurement markers stay hidden and noninteractive; visible brand and date are not navigation targets.

### Source pipeline, delivery and evidence

Edit [journal-navbar.js](../../scripts/journal-navbar.js), [prototype-runtime.js](../../scripts/prototype-runtime.js), the Quiet navbar section of [lock.css](../../lock.css), and the numbered source screens when their markup changes. `createJournalNavbar` is instantiated once by the preview runtime; a single ResizeObserver per prepared view updates composer clearance. Route views and entry nodes are reused, and observers are disconnected on teardown.

Run `node scripts/build.mjs` from the project root. Shared markup normalization and state generation precede walkthrough assembly. `build-v3-prototypes.mjs` includes the navbar with the existing audio and preview runtime; `build-prototypes.mjs` embeds CSS into the three portable walkthroughs and invokes `build-website-preview.mjs`. The ordered build also regenerates the motion and design-system guide exports and runs the design audit. Numbered screen comps remain script-free. Generated website, walkthrough and guide HTML must be rebuilt from their sources.

`journal-website.html` is the standalone responsive review file, with bundled styles, fonts, licenses and runtime. The three portable walkthroughs retain their platform review shells. No backend is implemented: new entries, drafts, recording and account interactions remain local review behavior and newly added content disappears on reload or close.

The main runtime contains the selected Quiet implementation. Alternate navbar branches, study generators and repeated demo content are archived under `D:/Codex/backup/AIJournal-v3-navbar-studies-2026-10-07`; the study archive manifest verified 41 files. Archived studies are excluded from delivery. Existing `.gline`, `.lblbox` and audio modules remain active dependencies.

Use `node scripts/verify-navbar.mjs` and `node scripts/verify-navbar.mjs --firefox` for navbar behavior, `node scripts/verify-website-preview.mjs` for integrated interactions and reading restoration, and `node scripts/verify-portability.mjs` for the portable exports and embedded fonts. Current reports live in [verification](../../verification/); the delivery record is [NAVBAR-DELIVERY-2026-10-07.md](../NAVBAR-DELIVERY-2026-10-07.md). Report timestamps must be checked against the source/build revision before quoting final results. Browser fixtures added by navbar verification exist only in its temporary copy and do not belong in the delivered HTML.

## Do's and Don'ts

- **Do** preserve the four destinations, their order, current-page semantics and 44px targets.
- **Do** keep the compact date between Ask and You, including the second row at enlarged text sizes.
- **Do** keep every page control and content block reachable through the native reader.
- **Do** preserve relative reading position and the positioning guard during restoration.
- **Do** regenerate exports and verify motion in Chromium and Firefox after source changes.
- **Don't** introduce destination icons, alternate study branches, duplicated visible dates or horizontal FLIP machinery into this implementation.
- **Don't** compact authentication, pushed Back headers or desktop binding navigation through this controller.
- **Don't** replace native scrolling, split destination words, or remove button borders in a way that changes geometry.
- **Don't** ship the review motion override as a production reduced-motion policy.
- **Don't** edit generated delivery HTML directly or describe prototype interactions as connected account persistence.
