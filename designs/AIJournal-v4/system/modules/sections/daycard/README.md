# daycard

The Timeline's date and mood card (v4 C1). Approved design: explore `2026-10-23-timeline-jump-arrival`
f-wash-and-frame (timeline-collapse c-dot-strip revised, timeline-calendar C, timeline-desktop-space B, the
common revision). Below 1200 it sits above the search; from the container's 1200 it is the sticky column right
of the list.

```js
import { weeksOf, monthsOf, keyDate, longDate } from '../../../content/journal-days.mjs';
use('daycard', { day: '2026-08-09', date: keyDate('2026-08-09'), dateName: longDate('2026-08-09'),
  weeks: weeksOf(written, today), calendar: { months: monthsOf(written, today), selected: '2026-08' } })
```

## Why

- **The mood is the visual priority.** The date row is small and light (16px, `--rule-2`) above the mood row
  ("Mood" in the hand at `--t-hand-s`, `--rule`).
- **Both parts start closed.** Collapsed, the mood row shows the week as seven dots, each in its day's mood
  colour and a button to that day; an empty day is a ring, a day still to come nothing.
- **The mood panel** opens under the rows by its height (the C1 curve, 420ms), its contents fading in a beat
  later. It holds one moodgraph per week; the arrows replace the strip while it is open and step through the
  weeks rendered, which are the weeks with something written and this week (history skips empty weeks).
- **The calendar** (cal, wheel form) unrolls from the date over whatever is under the card, the card's own
  width, over the calendar's 520ms (it travels about 1.55 times the panel's distance). Escape, a press
  outside, the date again, or picking a day closes it.
- **One jump.** A strip dot, a graph point or a calendar day all dispatch `daycard:jump`; the record scrolls,
  waits for the scroll to end and draws the arrival (DESIGN.md 2026-10-23, the jump arrival).

## How it talks

It dispatches `daycard:jump` `{ date }`; the app sets `data-jump` on the record. The record dispatches
`record:day` as the list scrolls; the app sets `data-day` on the card, which writes the date row and moves the
rings in its graphs and calendar (their `data-current`).

## Do and don't

- Do render every week with something written and this week, and no others: the arrows step through what is
  rendered.
- Do derive the weeks and months with `system/content/journal-days.mjs`, so the card and the page agree.
- Don't open both parts by default; don't make the calendar narrower than the card.

## Its own parts

The week arrows and the strip's dots are the card's own: the button's icon form is the entry tools' 20px
glyph. The date is written by daycard.js in the masthead's form ("Sun 9 Aug '26"), in English, as the masthead
is.

## The hand at 16px

- The date row is the hand at 16px, a deliberate exception to the type rules (never below 20px, at most twice
  a screen): the user kept it (DESIGN.md 2026-10-23). The Timeline has the hand three times.

## Placement

- Placed by: the page (`block` below 1200; `aside` from 1200, where the card makes itself sticky on a split
  page). Its margin is the page's.
