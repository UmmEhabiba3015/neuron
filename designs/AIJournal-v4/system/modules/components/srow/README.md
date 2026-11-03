# srow

C2 in the closed inventory (direction-lock.md §6). A ruled row of the record: the 58px time
column, then the content. When the content holds the entry actions, the body lays them out in a
gutter at the right of the text; below 1000px of container the tools drop under the text, which
takes the full width. Index pages (the motion index) use it without the time column.

```js
use('srow', { time: '09:20' }, { children: [prose, entryActions, mark] })
```

## Why

- **The time is the column.** Rows share the ruled column, so times line up down the page.
- **The text never moves when actions appear.** The gutter is reserved (the approved revision
  in lock.css, "an action gutter"); the entry actions only fade in.

## Do and don't

- Do put the entry's prose first in the body, then the entry actions, then the mark.
- Do leave `time` out on index pages: no `time`, no column.
- Don't make the row interactive; its controls carry their own focus.
- Don't add variants; one row serves every screen.

## Placement

- Places: `after` a mark after the words, `--s4` above; `span` the entry editor, the delete confirmation, a state message, the full grid, `--s4` above.

## Legacy debt

- Legacy context in `srow.css`: `.app:not(.ios) .sheet` (the website's sheet narrows the time column).
- Legacy context in the gutter: `:has(>.entry-actions)`, the entry actions' legacy class (a module never names another module's class). Their render does not emit it, so the fixtures add it as the screens carry it. The body sets the entry actions' exposed `--aj-c-entry-actions-tools-width` and the mark's `--aj-c-mark-display`.
- Placement left in `lock.css`: none. The sheet's border between rows and its scroll margin on a row
  reached by its id are in the sheet module; the icon glyph's centring is in the button module.
- The render's `time` has no `datetime` attribute (the contract declares only the text).
