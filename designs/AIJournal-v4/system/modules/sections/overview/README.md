# overview

A section: the latest weekly reflection's line at the top of the writing companion on Today, and the way into that
reflection (v4 C4, explore `2026-10-29-overview-single-line` c-fade-chevron). One row, ruled off below, no title: the
line and a chevron after it, together one link. It must not look like the person's writing.

```js
use('overview', { line, dates: '3 to 9 Aug', href: '#reflections', reflection: '2026-08-03', place: 'head' })
use('overview', { first: true, line: 'Your first reflection comes on Sunday.', href: '#reflections-empty', place: 'head' })
```

## Why

- **The product's voice, set apart**: the line is the reflection's, in the glance's size, with the journal's link mark
  (a dotted underline) and a chevron; nothing a person writes carries either.
- **One line at any length**: a line longer than its row fades into the chevron, as if it runs on in the booklet,
  which it does. The accessible name always carries the whole line.
- **The link is the line and the chevron only**, never the blank row beside a short line.
- **The chevron moves only to say "this opens"**: it leans on hover and focus, and nudges once the first time a
  reflection is shown, the only motion a phone sees. Reduced motion: still, darker on hover and focus.

## Do and don't

- Do give it the latest weekly reflection's line and its dates, and the reflection's id for the seen record.
- Do write the week's line as one sentence of about 50 characters at most: a phone's row holds about 50 at 13.5px
  (390; about 35 at 320). A longer line fades on a phone; it never wraps.
- Don't give it an empty line: it renders nothing, and the composer is the plain form.
- Don't place it anywhere but the head of the writing companion.

## Placement

- Placed by: the composer (`head`).

## Live

overview.js marks a line that runs over (`data-over`: the fade replaces the ellipsis) and sets `data-new` on a
reflection's first showing. The seen record is one value, the last reflection id shown: the account keeps it in the
product (the developer's), the browser's storage in the prototype; the motion-review switch ignores it.
