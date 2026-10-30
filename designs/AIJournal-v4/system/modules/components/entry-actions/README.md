# entry-actions

The entry action gutter at the right of each entry bar (approved revision): edit and delete as
icon buttons and, only on an entry kept out of memory, the quiet memory dropdown: **Out of memory**
and a chevron, its menu holding the **Use in memory** checkbox. While an entry is edited, its deletion confirmed or its use in
memory confirmed, the gutter is replaced by its other two forms, the inline editor and the
confirmation.

```js
use('entry-actions', { form: 'tools', excluded: true, kind: 'written' }, { children: '…icon buttons…' })
```

React: `<EntryActions form excluded kind memoryLabel text>{children}</EntryActions>`.

## Why

- **Memory is one way** (decision 2026-10-28). An entry goes to memory by default, and once in it
  can't be taken out (it has been processed). So an entry in memory says nothing (no In memory
  line, no empty row), and only an entry kept out carries the dropdown, always shown (not faded with
  the tools) and as quiet as the In memory line was. Its checkbox asks once (the confirmation form,
  "Once it is in, it cannot be taken out."), then the dropdown is gone.

- **Opacity alone reveals it** on pointer devices; the text never moves. Keyboard focus shows it at
  once and touch controls stay visible (direction-lock.md §6, row entry-actions).
- **The root is `display:contents`:** its parts sit in the entry row's grid (`grid-column`,
  `grid-row`, `align-self` on the parts). The editor and the confirmation span the row.
- **A voice memo has no edit tool** (`kind: 'recording'`); the children carry only delete.
- **The dropdown opens with motion** (the user, 2026-10-28), after the note's fold: the row grows, the
  checkbox fades in and settles 4px down, the chevron turns, 200ms on `--gc-drawer-out` (an ease-out:
  it arrives at once and settles). Closing is instant. With reduced motion only the fade stays.
- **The compact memory control** (`--t-memory`, 12px chevron) is a user-requested size.

## Do and don't

- Do give the tools form its icon buttons as `children` (button modules, `grade: 'quiet'`,
  `form: 'icon'`, each with an `aria-label`).
- Do set `excluded` for an entry kept out of memory; `memoryLabel` is the dropdown's line ("Out of memory").
- Don't offer a way to take an entry out of memory: keeping out is chosen when it is written or
  recorded (the composer's and the recorder's Keep this out of memory).
- Don't move the text to reveal the actions; fade only.
- Don't show an action that is unavailable.

## Placement

- Places: `span` a state message in the editor, the full grid; `fill` the editor's field, its label's full width.
- Placed by: the saved-entry row (`span`), the recording row (`span`).

## Legacy debt

- `entry-actions.css` carries legacy contexts: the entry row (`:is(.srow,.recrow)`) reveals the
  tools and trigger (hover, focus-within, open menu), drops them under the text and shows them
  below 1000px of container; and `.app` holds the reduced-motion rule.
- Placement left in `lock.css`: the `.auth-actions` margins in the editor and confirmation
  (`.entry-editor .auth-actions`, `.entry-confirm .auth-actions`). The editor's and confirmation's
  grid column and margin are the row's, by role (`span`); the field's width is this module's `fill`;
  the row's grid and the option's place in the menu are no longer in `lock.css`.
- `.entry-item[hidden]` and `.entry-item .prose[hidden]` stay in `lock.css` with the row.
- `--entry-tools-width` is set by the entry row and read by the module; it is not a token.
