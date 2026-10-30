# shell

A2 in the closed inventory (direction-lock.md §6 A). The product shell: the unruled paper ground
every screen sits on, the container every responsive rule queries, and the positioning context
for the rail. It holds the rail, the page and, at desktop, the title block.

```js
use('shell', { surface: 'notebook', layout: 'single', clip: false }, { children: '…' })
```

React: `<Shell surface="auth" layout="sidebar" clip>{children}</Shell>`.

## Why

- **The container is the shell, not the viewport.** `container-type: inline-size` lives here, so
  every rule inside queries the shell's width (700 tablet, 1200 desktop) and a screen looks the
  same in a comp, the website and the app. The shell's own box never changes with width.
- **`overflow: clip`, never `hidden`.** Hidden would make the shell a scroll container and take
  the sticky composer's scrollport away from it. Clip does not, so the composer still sticks.
- **Auth is a surface, not a screen.** `data-surface="auth"` is the approved plain-paper sign-in
  spread: full window height, text in `--rule`.
- **Sidebar is a layout.** `data-layout="sidebar"` is the desktop shell with a title block as its
  first column (a grid of `--title-w` and the page). Set it on every shell that has a title block
  child; the grid only applies inside the desktop stage.
- **`clip` is presentation only** (revision 6): the states packs show many states of one screen
  without a full viewport each. No shipped screen uses it.

## Do and don't

- Do put the rail first, then the title block (desktop), then the page.
- Do set `data-layout="sidebar"` whenever a `.title` is a direct child.
- Don't set `overflow: hidden` on it, or give it a height other than the paper's minimum.
- Don't style the shell from inside: it is the query container, and an element cannot query itself.

## Placement

- Places: `main` the compact recorder: takes the shell's room; `tabbar` the native tab bar on iOS: runs under the binding rail.

## Legacy debt

Legacy classes the element keeps (markup carries `aj-l-shell app …`):

- `app`: read by about 50 legacy context rules in `lock.css` (`.app .said …`, `.app .dest a`,
  `.app.ios …`, `.app:not(.ios) …`, `.app:has(.keybox …) …`), by
  `tokens.json` `$scope: ".app"` (the C3 motion tokens), by the website preview's
  `.device.d .app{--title-w:…}` and by the runtime scripts and tests.
- `clip`: the legacy `.app.clip` context rule in `lock.css` (`.app.clip .page{min-height:0}`)
  (and the other clip-aware rules); `auth-paper` and `auth-surface`: the `.auth-paper>…` and
  `.auth-surface …` rules for the rail, page, mast and buttons; `ios`: the native-app rules.

Legacy contexts in `shell.css` (listed by `check-modules`):

- `.auth-surface .aj-l-shell` (sign-in page class on the legacy device wrapper).
- (v4 D1) the sidebar grid is no longer keyed on the stage's desktop class: `.aj-l-shell[data-layout="sidebar"]`.
  Pages ask for sidebar only from 1200; the shell is the container and cannot query its own width.
- `:where(#journal) …` rules (the website preview's mount point) and
  `:where(#journal) .device.d .aj-l-shell`.
- `.ds-motion-viewport .aj-l-shell` (the design-system guide's motion viewport).

Declarations left in legacy CSS:

- `--title-w:clamp(360px,25vw,396px)` on `.device.d .app` in the website preview's `siteCss`
  (a custom property; modules set only `--aj-l-…` properties). The shell reads `--title-w`,
  declared for the desktop by `tokens.json`.
- The `.app .dest a, …` transition rules, the `.app .said …` rules and every other rule where
  `.app` is only context.
- `.compact-recorder-app{container-type:inline-size}` in `lock.css` sets the same value the
  shell now sets; it is redundant and can go when the recorder screen is converted.
