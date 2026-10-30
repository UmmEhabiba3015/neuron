# sheet

C1 in the closed inventory (direction-lock.md §6). The form of a screen: one rectangle,
hairline-ruled into rows. One per screen.

```js
use('sheet', { tag: 'main' }, { children: '…rows…' })
```

React: `<Sheet tag="main">{children}</Sheet>`.

## Why

- **One rectangle, not cards.** The record reads as one ruled page; rows are divided by a
  hairline, never boxed separately.
- **The sheet rules its rows, the rows don't.** Every child after the first is ruled off above
  (`> * + *`), so a row never carries its own top edge (the recording's tone fills up to the rule).

## Do and don't

- Do put the record's rows, section heads and settings rows straight in it.
- Do let the parent place it: the page sets its margins by role (`block`, `record`), and the panel
  by `block`.
- Don't nest a sheet in a sheet, or add a second one to a screen.
- Don't give a row its own top border: the sheet draws it.

## Placement

- Places: `span` a state message, the full grid; `form` the account content, a 440 column, centred (the full column in the website preview at tablet and desktop).
- Placed by: the page (`block`, `record`), the panel (`block`).

## Legacy debt

- No placement is left in `lock.css` on `.aj-c-sheet`. The margin, the 1200px bottom margin, the iOS
  page's `flex-shrink` and scrolled offset, and the journal reader's `margin-bottom:0` are the page's,
  by role (`block`, `record`); the panel places it by `block`. The guide's `.ds-example-sheet` stays
  outside the module.
- Legacy contexts in `sheet.css`: `.auth-preview` (draws its own dotted rule, so the divider skips it), `.auth-paper` (the auth spread's sheet leaves its two sections
  unruled), `.page.split` and `.page:has(>.journal-header)` (where a row reached by its id lands).
- The rows read `.sheet` as their legacy context (the website sheet's ruled column), so the sheet
  keeps its legacy class.
