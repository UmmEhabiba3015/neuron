# mast

A4 in the closed inventory (direction-lock.md §6), a layout primitive. The masthead: the
wordmark and the second-row object (the date box or the zoom control). It is a row at the top
of the page at 390 and 834 (`form: row`), and the desktop title block (`form: title`) at 1440,
the column left of the page that also holds the destinations.

```js
use('mast', { wordmark: 'Journal' }, { children: '<div class="keybox">…</div>' })
use('mast', { form: 'title', wordmark: 'Journal' }, { children: '…' })
use('mast', { collapsed: true, wordmark: 'Journal' })
```

React: `<Mast form wordmark collapsed>{back}{children}</Mast>` (see `dist/types/Mast.props.d.ts`).

## Why

- **The same height on every destination** (rule 7.6, revision 17). The second-row objects are
  pinned to `--ctl` by legacy rules until those components migrate, so nothing below the
  masthead moves when you switch destinations.
- **One text node for the wordmark** (§6 A4), so a rename is one edit. "Journal" on a
  destination, the page's name on a pushed page.
- **One row from 700, with the back control on its own line** (revision 21).
- **The title form is the same module** (revisions 33, 36, 39, 45). It is `--title-w` wide and
  sticky in the comps. The `:not([data-form="title"])` on the row form's rules keeps the row's
  padding and flex row off it.
- **The wordmark's weight is declared here** (revision 48), not in a platform block.

## Do and don't

- Do put the back control in the `back` slot on a pushed page, never beside the wordmark.
- Do let the page place it: the title block's position in the shell comes from the shell.
- Don't put anything but the second-row object (and, in the title form, the destinations and
  the printed line) in `children`.
- Don't set `collapsed` outside the iOS shell, or on the title form.

## Placement

- Places: `block` a printed line under the masthead (the glance, the sync line): the page gutter, flush in the title block; `tool` the date box or the zoom: keeps its size in the row, `--s7` below in the title block; `line` the back control: holds the first line in the row, `--s6` below in the title block.

## Legacy debt

Everything below is migration debt, listed so it can be paid when the shell, the page and the
other components become modules.

**Legacy classes the element keeps, and who reads them.** Every legacy class stays beside the
module class (`aj-l-mast mast`, `aj-l-mast title`, `aj-l-mast__wordmark wordmark`,
`aj-l-mast mast` with `data-collapsed`). `collapsed` was dropped on 2026-10-10: nothing read it.
- `.mast`: `lock.css` (`.mast > .crow{min-height}` and the quiet navbar's two
  `!important` rules); `scripts/journal-navbar.js` (`querySelector('.mast')`).
- `.title`: the legacy contexts in other modules' CSS (`.title .aj-c-dest` and the like), the
  scripts/verify-* checks. `lock.css` no longer has a rule on it.
- `.wordmark`: `scripts/journal-navbar.js` (it clones the wordmark, hides the clone with
  `navbar-marker`, and renames the original `navbar-brand`); the scripts/verify-* checks.

**Legacy contexts in `mast.css`** (each has a `legacy-context` comment on its rule):
`.app.ios`, `.auth-paper`, `.page` (inside `.auth-paper` and `.device:not(.d)`), `.device`,
`.app`, `.quiet-navbar`, `.recorder-mast`, `#journal` (the website preview, through `:where()`).
`.page` is the page module's class once that module lands; those selectors then need the page
to expose what they need.

**Declarations left in legacy CSS** (`lock.css`):
- the Ask search row's pin: `.mast > .crow{min-height:var(--ctl)}`. The keybox, the zoom and the back
  control keep their size and flex themselves; the masthead places them by role (`tool`, `line`);
- the quiet navbar's `.quiet-navbar.no-tween>.mast{transition:none!important}` and the
  reduced-motion `…>.mast{transition:none!important}`;
- `--title-w` and `--gut` custom properties on the shell and the page.
