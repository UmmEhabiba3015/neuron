# panel

G1 in the closed inventory (direction-lock.md §6). A panel that slides over the page, pushes
a history entry and closes with Back: keep-this, mood edit, install, the crisis
resource. On desktop split pages it sits in the second column.

```js
use('panel', { title: 'Composer options' }, { children: use('card', { … }) })
```

React: `<Panel title="…">…</Panel>` (see `dist/types/Panel.props.d.ts`).

## Why

- **It follows the page, not the viewport.** It is absolutely positioned against the app, so from
  700px its left and right are worked out from `--page-w`, and from 1200px it starts beside the
  title block (`--title-w`) (revisions 22 and 44).
- **Named by its heading.** The h2 is the panel's title and its accessible name.

## Do and don't

- Do let the parent place it on split pages: the page puts it in the second column by role (`aside`).
- Do give it content (a card, buttons, a sheet); a panel always has something to show.
- Don't add a variant; it has none.

## Placement

- Places: `block` an object in the panel, the page gutter; between the rules on a split page.
- Placed by: the page (`aside`).

## Legacy debt

- `panel.css` carries legacy contexts: `.page.split > .aj-c-panel` (sticky position, no fill, no
  keyline, no padding) and `.page.split > .aj-c-panel > *` (children's inline margins), all at 1200px.
- No placement is left in `lock.css` on `.aj-c-panel`; the page places it by role (`aside`). The
  sheet's margins inside the panel are the panel's, by role (`block`).
