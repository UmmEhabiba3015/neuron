# reflection (page)

Reflections, a destination (v4 C3): the week read back as a small booklet, one leaf at a time, with Earlier
weeks on a line below it. Approved design: explore `2026-10-27-paper-story-cards/d-booklet` with its feel
from `2026-10-27-booklet-feel/f-mix` (DESIGN.md 2026-10-28); journal-website.html `#reflections` and its states.

## Why

- **The week as pages you turn**, not a ledger to scan: the user found the old page of grey note rows
  "unintuitive and boring". Each note has its leaf: a number, a picture, then the words.
- **The record stays the source.** A note's foot opens Timeline on the days behind it; the leaves quote
  no entries.

## Do and don't

- Do compose modules only (`use()`), with roles; the page has no CSS and writes no markup of its own.
- Do keep content in `data.mjs`, once for every platform, and read counts from the days there, never type them.
- Do give every note's leaf an `id`: Timeline's way back reopens it (`#leaf-<id>`).
- Don't number the weeks anywhere in Reflections (DESIGN.md 2026-10-28, the copy).

## Usage

```js
render('reflection', { platform: 'desktop', state: 'list', context: 'screen' })
```

- `platform`: mobile, tablet or desktop. One render for all three.
- `state`: `list` (the destination), `week` (an earlier week, pushed), `first` (the first reflection),
  `empty` (the week so far), `rated` (a note's thumbs down pressed, its form open).
- `context`: `screen` (the numbered comps) or `walkthrough` (the prototypes and the website).

The page composes the shell (rail, page), the masthead (header below desktop, the title block on desktop),
the `booklet` section (its leaves are `leaf` components, each picture a `leafpic`) and `weekline`.

## States

- **list**: the week (3 to 9 Aug), What you kept, What came up, Your recordings, Over the weeks, the signed
  leaf; Earlier weeks (eight weeks, July and June). Opens on leaf 1 (1 and 2 on desktop).
- **week**: 27 Jul to 2 Aug on a pushed page (back to Reflections, date box "Week"): the week, What you kept,
  The day off, Over the weeks, the signed leaf; then the weeks before it.
- **first**: the list's week without the trend, a Next week leaf, the signed leaf without a way to earlier
  weeks; no Earlier weeks.
- **empty**: This week so far (opened on Thursday), one leaf; no pager.
- **rated**: the list, What came up with its thumbs down pressed (the form open, as the script leaves it); the booklet
  opens on its leaf. That's not right and its marked state were retired in v4 round 10 (the user, 2026-10-29).

## Behaviour (walkthroughs and the website)

The booklet turns (booklet.js). A note's "N entries" carries its days (`data-days`): the coordinator
(scripts/journal-reflection.js) opens Timeline and sets the record's jump to them, so it lands with the wash
and frame; Timeline's Reflections destination wears the back chevron (dest 0.4.0) and leads back to the leaf's
screen while it stays.
Any way back (that destination, another one, the browser's back) finds the booklet still on the leaf it left. An in-screen link (Earlier weeks) scrolls within the screen.

## Platform rules

- **Desktop**: the masthead is the title block beside the page (`mast` form `title`, shell layout
  `sidebar`; the week's page headed `pushed`).
- **Mobile and tablet**: the header section (navbar form in a walkthrough, blocks in the page's reader);
  the week's masthead row is inside its page (role `head`).

## Content

`data.mjs`: the copy and links, written once, the days from 02-timeline's record. Links point into the
prototype (`00-prototype.html#…`), as the screens' do.

## Comp

`system/comps/05-reflection.json` lists the devices `mobile-web/05-reflection.html` and its tablet and
desktop copies show. The build writes those files from it.
