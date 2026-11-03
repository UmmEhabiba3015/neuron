# cal

H2 in the closed inventory (direction-lock.md §6). The calendar inside Timeline's date and mood card (v4 C1):
a wheel of months (short month over its year) beside one month's days, Monday first, the days marked by mood.
Opening and closing it is the card's.

```js
use('cal', { month: 'Month and year', selected: '2026-08', months: [{ value: '2026-08', short: 'Aug', year: '2026', name: 'August 2026', days: [{ n: 9, href: '#d-2026-08-09', mood: 'even', current: true, label: 'Sunday 9 August, Even. Go to this day' }] }] })
```

React: `<Calendar month months selected />` (see `dist/types/Cal.props.d.ts`).

## Why

- **No fill, keyline or radius:** it sits on the card's ground. The month column is 76px at every width.
- **A day written is its number, semibold, with a dot in its mood colour;** the day in view is ringed `--ink`;
  an empty day is a plain `--rule-2` number, not a link; out-of-month cells are blank.
- **A month with nothing written** says so under its grid (`empty`).
- **Each day link names the date and its mood** (`label`); each month option names month and year.
- **One form.** The month grid (Timeline's old calendar zoom) and the nav form (the desktop index into the
  record) went with the List/Calendar switch (v4 C1).

## Do and don't

- Do give it the months from `system/content/journal-days.mjs` (`monthsOf`), from the first month written to
  this month.
- Don't make an empty day a link, or mark it with a dot.
- The wheel's literals are token-exempt, each with its reason (the approved design's drawing).

## Behaviour

`cal.js` pads the list so the first and last months centre, centres the selected month, and selects by press,
Up/Down, or scroll settling (120ms). Smooth scrolling only without reduced motion (or with
`<html data-motion-review="play">`). It follows the parent's `data-current`: the ring and the selected month
move with the day in view. Events, both bubbling: `cal:month` `{ value }` and `cal:pick`
`{ date: "YYYY-MM-DD" }` (the day link's default is prevented, so the page can jump instead).

## Placement

- Placed by: the daycard (inside its calendar part). Nothing else places it.
