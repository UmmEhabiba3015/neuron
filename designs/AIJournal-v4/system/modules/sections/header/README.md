# header

A section: the website's pinned header on mobile and tablet (the quiet navbar). The masthead above
the destinations, pinned over the page's reader. Reading away from the journal's end it compacts:
the masthead clears, the destinations rise to the top and the date settles into their slot; back at
the end it expands. Desktop never has it.

```js
use('header', {}, { children: use('mast', { wordmark: 'Journal' }, { children: keybox }) + use('dest', { slot: true }) })
```

## Why

- **One object, rendered once.** The compact wordmark and date are its own parts, written at build
  time, so nothing is built, moved or cloned at runtime.
- **The script is the header's alone** (`header.js`): it measures, lays out and tweens its own parts and
  writes `data-state`, `data-type`, `data-date` and `data-tween`. The app only sets `data-reading` (home or away), and may write another date into the masthead's date box: the compact date follows it.
- **Five destinations, and a date that shortens** (v4 B7). The compact date is written in three parts:
  the weekday and the year (its edges) around the core, `9 Aug`. Where the full date does not fit at
  its compact size (18px; it does on tablets), the edges fade and the core alone is laid in the slot;
  where even the core cannot reach the destinations' size (at most 12px; a phone under about 355px),
  the date fades out. Phones under 414 take the
  360px comp's tightening so the date fits at 375 and 390. Enlarged type wraps to three rows: Today and
  Reflections, Timeline and Ask, then the date's row before You.

## Do and don't

- Do give it the masthead and the destinations; it adds the parts from the masthead's wordmark and date.
- Don't set `data-state`, `data-type`, `data-date` or `data-tween` from outside; set `data-reading`.
- Don't render it on desktop.

## Placement

- Places: `head` the masthead, `nav` the destinations. Placed by: the page (it is its first child; the
  page's reader follows).

## Legacy debt

- The legacy class `journal-header` stays on the element.
- The masthead's wordmark and date are found inside it by `aria-hidden` (their placeholders) and the
  links by `a`; the phone rule (the 360px comp's values, under 414 since v4 B7) is a viewport query marked as a legacy context.
- The sheet reads the header by its class (`.aj-s-header`) for the scroll margin under it.
