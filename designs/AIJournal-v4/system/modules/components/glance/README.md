# glance

D2 in the closed inventory (direction-lock.md §6). One line of the current reflection,
between two rules. Pro only.

```js
use('glance', { line: 'Sleep has come up on four of the last six days.' })
```

React: `<Glance line="…" />` (see `dist/types/Glance.props.d.ts`).

## Why

- **The line is the product speaking,** so it types itself in on arrival (clip-path only, the
  text is in the DOM from the start). The user's own words never do.
- **It must be true of the record on the same screen** (AGENTS.md, content against content).
- **Absent rather than wrong:** with no reflection there is no glance.
- **Own animation:** `aj-c-glance-draw` is a copy of the legacy `g-draw` frames; the legacy
  keyframes stay for the total, the waveform and the auth copy.

## Do and don't

- Do let the parent place it: the page and the masthead give it its margin by role (`block`); the
  masthead leaves it flush in the title block.
- Do keep it to one line, written by the product.
- Don't put the user's words in it; they are never printed in.
- Don't make it interactive.

## Placement

- Placed by: the page (`block`), the masthead (`block`).
- Since v4 C4 (2026-10-29) no page module renders it: Today's overview is its own section. Its one user is the native
  app's static Today (`mobile-app/01-today.html`), which is out of scope and kept as it is.

## Legacy debt

- Contexts still written as legacy classes: `.app` (arrival motion, reduced motion),
  `.app.restate`, `.app:has(.keybox .v:not(.printed))` (waits for the handwritten date) and
  `.journal-overview` (padding, border and font reset).
- No placement is left in lock.css on `.aj-c-glance`; its margin is the parent's, by role (`block`).
- `.journal-overview .gline{animation:none!important;clip-path:none!important}` stays in
  lock.css (`!important`).
- The legacy classes `glance` and `gline` stay on the markup until those contexts migrate.
