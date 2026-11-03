# drawers

Ask's History and Bookmarks (v4 C2, DESIGN.md 2026-10-25, sessions and history). Their pills, and one dimmed modal
layer holding both drawers. Approved design: explore `2026-10-22-ask-readable/a-mirror-bubble` (as revised).

```js
use('drawers', { today: TODAY, current: TODAY, days: historyDays(), bookmarks: { day: 'Today, Sunday 9 August', items: bookmarksOf(TODAY) } })
```

React: `<Drawers today current days bookmarks count open onDay onJump />`. The chat takes it in its `tools` slot.
The fold is `system/content/ask-history.mjs` (`historyOf`, `groupsOf`); the sample journal `ask-journal.mjs`.

## Behaviour

- The pills open their drawer: History from the left (on the desktop exactly the title block and the binding rail,
  its edge on the rail's rule), Bookmarks from the right. Both can be open: one dim, each pill lit above it (a copy
  the script lays exactly over the pill) wherever no open drawer covers it; an open drawer's pill shows pressed and
  closes it. Escape closes the latest; a press on the dim closes both; focus returns to the pill.
- Motion: in over `--g-drawer-in` on `--gc-drawer-in`, out over `--g-drawer-out` on `--gc-drawer-out`, the dim with
  them; instant under reduced motion (the review switch plays it).
- History: today, this week's past days, then earlier weeks, months and years; a group opens its own level with a
  way back. `drawers:day` `{ date }` when a day is picked (History closes, Bookmarks stays).
- Bookmarks: the open day's; `drawers:jump` `{ id }` once both drawers have closed (the app sets the chat's
  `data-jump`). The app keeps the count (hook `bookmarks`), the day line (`day`) and the list (`marks`) current.

## Why

- **History reaches the rail** on the desktop: the drawer is the title block it covers, so its edge lands on a line
  that is already there.
- **Both together, one dim.** Picking a day in History while Bookmarks shows that day's bookmarks was the user's ask;
  lit pills let the second drawer open without closing the first.
- **The layer clips and cannot scroll.** Focus moving into a panel still off to the right scrolled the dialog, and
  Bookmarks appeared at its end at once.
- **Layers kept at rest** (`will-change`): the text was drawn again when the motion ended and blurred, then snapped.

## Do and don't

- Do place it at the start of the chat's head row (the chat's `tools` slot).
- Do render the bookmarks list from this module when the day changes; never build it in the app.
- Don't open it on a page without the chat: the bookmarks jump into the chat's thread.
- Don't animate it under reduced motion.
