# dayrow

H1 in the closed inventory (direction-lock.md §6). A Timeline day: the 58px ruled column carries
the date, the row beside it the day's lede. An empty day is not a row; it does not exist.

```js
use('dayrow', { date: 'Sun 9', datetime: '2026-08-09' }, { children: lede })
```

## Why

- **The date is the column.** The Timeline's day rows share the ruled column with entry times
  and record notes, so the dates line up down the page.
- **An empty day is not rendered.** Never pass it empty.

## Do and don't

- Do put the day's lede in the slot, as prose.
- Do keep the date in a `time` element with its ISO `datetime`.
- Don't make it interactive or add a variant; it is a static row.

## Placement

- Places: `after` a mark after the day's lede, `--s4` above.

## Legacy debt

- One legacy context in `dayrow.css`: `.app:not(.ios) .sheet` (the website's sheet narrows the
  date column's padding and lets it wrap).
- Placement left in `lock.css`: none. The sheet's border between rows and its scroll margin on a row
  reached by its id are in the sheet module.
