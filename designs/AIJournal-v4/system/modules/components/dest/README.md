# dest

B1 in the closed inventory (direction-lock.md §6). The five destinations: Today, Reflections,
Timeline, Ask, You. Always five, always in that order: Reflections next to Today (v4 B7), You set
apart from the journal four (revision 28). A compact header row on the web, a column in the desktop
title block; never a bottom bar on mobile web. The native app's tab bar keeps its own four until app
development starts.

```js
use('dest', { links: DESTINATIONS, current: 'reflections' }) // system/content/destinations.mjs
use('dest', { current: 'timeline' })
use('dest', { form: 'tab', current: 'today' })
```

React: `<Destinations links current form />` (see `dist/types/Dest.props.d.ts`).

## Why

- **You is the account, not the journal.** Today, Reflections, Timeline and Ask are the journal;
  You is about the software. An auto left margin says so in the layout (revision 28); the tab bar
  says it with a hairline instead (revision 47), because equal cells cannot leave a gap.
- **Always five, always this order.** Reflections sits next to Today (v4 B7). There is no empty or
  loading state; navigation is drawn before content. Pages pass the one shared list,
  `system/content/destinations.mjs`, never a copy.
- **Words, not icons.** The labels are final copy; the CSS sets them in printed caps.
- **The current destination is filled `--block`** and carries `aria-current="page"`. On a pushed
  page that sits under no destination, pass `current: 'none'`.
- **Hover is the keyline darkening only.** The ramp is transform-only: a colour transition once
  flashed the browser's default blue link on a slow first paint.

## Do and don't

- Do let the parent place it: the shell places the tab bar by role (`tabbar`); the quiet navbar's margin
  stays with the navbar.
- Do keep the destinations a `nav` labelled "Destinations".
- Don't add a sixth destination, reorder them, or colour one to say more.
- Don't show it as a bottom bar on mobile web.

## Placement

- Placed by: the shell (`tabbar`).

## Legacy debt

- Contexts still written with legacy classes (`legacy-context` in `dest.css`): `.app` (motion and
  reduced motion), `.app.ios` (the tab bar), `.title` (the desktop column), `.journal-header`
  (wrapping) and `.quiet-navbar` (grid over the brand, compact, large type, the 360px block).
- Placement left in lock.css on `.aj-c-dest`: `.quiet-navbar>.aj-c-dest{margin:0}`. The tab bar's
  negative margin is the shell's, by role (`tabbar`).
- `!important` lines left in lock.css, still written with the legacy `.dest` class:
  `.quiet-navbar>.dest a{margin:0!important}` and the no-tween and reduced-motion transition lists.
- `.quiet-navbar.large-type>.dest>.navbar-date-slot` stays: its subject is a span the navbar
  script adds.
- The legacy classes `dest` and `tab` stay on the markup.
