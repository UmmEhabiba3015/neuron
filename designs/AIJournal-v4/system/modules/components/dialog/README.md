# dialog

G2 in the closed inventory (direction-lock.md §6). The one dialog in the product: delete
everything. A scrim over the screen with a card centred on the page.

```js
use('dialog', { labelledBy: 'delete-account-heading' }, { children: use('card', { title: 'Delete everything?', titleId: 'delete-account-heading', paragraphs: [...] }, { actions }) })
```

React: `<Dialog labelledBy="…"><Card …/></Dialog>` (see `dist/types/Dialog.props.d.ts`).

## Why

- **Exactly one.** If a second dialog appears, something has gone wrong (direction-lock.md §6 G2).
- **The scrim is --ink at 55%,** derived, so it follows a dark retrofit; it is not a ninth colour (§2).
- **The card keeps a compact measure (revision 26).** The dialog sets the card's exposed
  `--aj-c-card-measure-wide` to 38ch so Export instead and Delete everything stay near each
  other on the one irreversible screen.
- **Centred on the page, not the app (revision 24).** From 700px the scrim's left padding
  includes the rail.

## Build obligation for the developers

In the comps the dialog is `position:absolute; inset:0` and covers the app. In production use
the top layer (`<dialog>` with `showModal()`), which also gives focus trapping and Escape.
Until the composite wave, the comps' behaviour lives in `createDialog` in
`design system/components/journal-components.js`: focus moves into the card on open, Tab is
trapped, Escape closes and focus returns to the trigger.

## Do and don't

- Do give `labelledBy` the id of the card's heading.
- Do put the card directly inside, with no wrapper.
- Don't add a second dialog, or put anything but a card in it.
- Don't change the card from outside other than through its exposed custom property.

## Placement

- Places: `block` the dialog's card, the page gutter.
