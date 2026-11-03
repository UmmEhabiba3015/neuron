# find

A section in two forms. **row**: Ask's search row, the field the person types into at the top of the page (it
retires with C2). **pill** (v4 C1): the Timeline's search, sticky as the list's running head.

```js
use('find', {}, { children: use('field', { tag: 'input', label: 'Search' }) })
use('find', { form: 'pill', query: 'sleep', mode: 'keyword', status: 'idle', found: '3 days with “sleep”.', place: 'block' })
```

## Why

- **One row, the field filling it** (row): Ask starts from a question, so the field is the page's first
  object (REVISION 27 moved it out of the masthead).
- **The pill is the list's running head** (explore timeline-jump-arrival f-wash-and-frame; DESIGN.md
  2026-10-23). It rests where the page places it and sticks once the list scrolls under it: stuck, it rounds to
  half its height and floats on its lift with its own soft glow (no band); the type keeps its size, because a
  changing font size shimmered. From the container's 1200 it never leaves its own line: it pins one line below
  the page top, level with the side card, and narrows from both sides to 480px and the date row's 44px. Below
  1200 it keeps its size and only rounds. The morph is the C1 curve over 420ms (`--gc-c1`, `--g-panel`).
- **One height whatever the found line does,** so the list under it never jumps; its empty parts let clicks
  through to the list. The one exception: a failure that takes two lines (a phone's width) grows it once,
  rather than lay the line over the list.
- **Whole pixels.** Try again's dotted underline is repainted a fraction apart when it starts partway through
  a pixel, so the found line rounds its widths up to whole pixels (the tag to an even pixel). Try again never
  breaks; the message wraps beside it.
- **Keyword or by meaning, one switch** (the button's switch form). The placeholder says which: "Search your
  journal" or "What was it about?".
- **The found line** says how many days ("3 days with “sleep”.", "3 days about “sleep”, in any words."), that
  it is searching ("Searching your journal."), or that it failed, with Try again. It is `--rule`, not the
  exploration's `--rule-2`: it sits on the graph paper (tokens, rule 2.3). Stuck, it rides under the pill as a
  small tag of its own. No matches is the record's state.

## How it talks

find.js dispatches `find:search` `{ query, mode }` for every change and for Try again. The app runs the
search, sets `data-status` (idle, searching, failed), writes the found line (hook `found`) and hides the days
that don't match in the record. Under a pinned header (mobile and tablet) the app sets `--aj-s-find-top` to the
header's height, as it does for the composer.

## Do and don't

- Do put the search field in the row; the pill writes its own (the bare field).
- Don't add buttons to the row; Ask answers as the person types.
- Don't animate the pill's type size.

## Its own parts

The pill's clear control and its divider are the section's own: the button's icon form is the entry tools'
20px glyph, and the divider belongs to the bar (the switch has no keyline of its own).

## Placement

- Placed by: the page (`block`). The pill's top margin takes back the --s4 of glow room above its bar.

## Legacy debt

- No placement is left in lock.css: the page places it by role (`block`), and the field's `flex` is
  the field's own.
- The markup keeps `crow` (the composer's runtime and `.mast > .crow{min-height}` read it) and `find`.
