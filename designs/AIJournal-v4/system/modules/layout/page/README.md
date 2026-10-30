# page

A2 in the closed inventory (direction-lock.md §6 A). The graph page: the ruled paper everything on
a screen is written on. Full width at 390; from 700 an object of its own, exactly 40 graph modules
wide (`--page-w`) and centred, running the full height; at 1200 it starts at the title block's
edge. A split page lays its content in two columns at desktop.

```js
use('page', { layout: 'single' }, { children: '…' })
```

React: `<Page layout="split">{children}</Page>`.

## Why

- **The page is an object from 700.** Outside it is the shell's unruled paper; the graph stopping
  is the page edge. It runs the full height because a page longer than the window is what a
  notebook is, and the composer is sticky to the foot.
- **`width:100%` is not optional.** An auto margin in the cross axis cancels stretch; without
  `width:100%` a sparse screen shrinks to fit and strands the rail.
- **Split is a layout** (revision 39 and after): from 1200 a grid of the record and a 340px second
  column, every item start-aligned. The gutter moves from the children to the page.

## Do and don't

- Do put the masthead first, then the screen's content in reading order.
- Do set `data-layout="split"` wherever the page carries the legacy `split` class.
- Don't give it a top or bottom margin, or a height other than the paper's minimum.

## Placement

- Places: `block` an object in the page column: the page gutter, `--s6` below; `record` the day's record (the sheet): more space below it at desktop, and on iOS it never shrinks; `foot` the composer: pushed to the foot of the page; `main` the single-purpose object (the stack): grows, capped at 700 and centred at desktop; `aside` the split page's second column (the calendar, the panel), with `column` running the whole height of the record's column (the Timeline's sticky date and mood card); `grow` takes the room left (the auth spread).

## Legacy debt

Legacy classes the element keeps (markup carries `aj-l-page page …`):

- `page`: read by the legacy rules in `lock.css` that set `--gut`, `--lead`, `--screen-h` and
  `--overflow`, and by `.page > .journal-header` (the sticky header); by `scripts/journal-navbar.js`
  (`.device:not(.d) .page`) and by the browser tests. Its children's placement is no longer there:
  the page places them by role.
- `split`, `pushed`, `untitled`, `bare`, `scrolled`: read by the legacy rules that set `--lead`,
  `--overflow` and the split children. Only `split` has a module attribute; the others set only
  custom properties.
- `navbar-page`: added at runtime by `journal-navbar.js`.

v4 D1: the desktop rules that were keyed on the stage's platform (the sidebar page's margins, the pinned
head below desktop) key on the container's 1200 instead; the class is repeated to keep their old weight.

Legacy contexts in `page.css` (listed by `check-modules`): `.app.clip`, `.app.ios`,
`.auth-surface`, `.auth-paper`, and the `:where(#journal)` website
preview rules (`.device.t`, `.device.d`, `.device:is(.t,.d) .auth-paper`).

Declarations left in legacy CSS:

- `--gut` (`.page`, 700 and 1200 in `lock.css`; the three `--gut` values in the website preview's
  `siteCss`), `--lead` (`.page`, `.page.pushed`, `.page.pushed.untitled`, `.page.bare`,
  `.navbar-page`), `--screen-h` and `height:calc(…)` on `.app.ios .page`, `--overflow` on
  `.app.ios .page.scrolled`: custom properties read by components that are not modules yet.
- `.page.split{padding-top:var(--lead)}` at 1200: reads the legacy `--lead`; the module never sets
  `padding-top` on a split page (the auth spread's `padding` is on a non-split page).
- `.navbar-page{height:…!important;min-height:0!important;overflow:hidden}`: important
  declarations in legacy beat every layer. Its `overflow:hidden` is a normal declaration on the
  page element; the module sets `overflow` only under `.app.ios`, which the website never is.
- Every rule where `.page` is only context.
