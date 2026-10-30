# back

B3 in the closed inventory (direction-lock.md §6). A chevron and the name of the page it
returns to, in printed caps. Pushed pages only; never on a destination.

```js
use('back', { label: 'You', href: '00-prototype.html#today' })
```

React: `<Back label="You" href="…" />` (see `dist/types/Back.props.d.ts`).

## Why

- **It names where it goes.** The label is the page it returns to, never "Back".
- **Caps come from the CSS.** Write the label in sentence case.
- **The chevron is decorative** (`aria-hidden`); the visible label names the link.
- **The chevron is drawn at 14px,** below every sizing token, so the size is marked as exempt.

## Do and don't

- Do let the parent place it: the masthead holds it on its own line and sets the gap below it in the
  title block, by role (`line`).
- Do keep the label to the name of one page.
- Don't put it on a destination; only pushed pages have somewhere to go back to.
- Don't add a variant or colour; hover is the only change.

## Placement

- Placed by: the masthead (`line`).

## Legacy debt

- `back.css` carries one legacy context: `.title .aj-c-back` (display and justify-content at
  1200px, in the title block).
- No placement is left in `lock.css` on `.aj-c-back`. Its `min-width:var(--tap)` is the module's own;
  the masthead places it by role.
