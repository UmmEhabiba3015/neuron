# stage

A1 in the closed inventory (direction-lock.md §6). The presentation stage: the device frame a
comp is drawn in, its browser bar (or the iOS status bar), the caption under it and the iOS
home indicator. It is not product and is never shipped; it is the one place a colour literal
is allowed.

```js
use('stage', { platform: 'desktop', chromeLabel: 'journal.app', captionTitle: '…', captionText: '…' }, { children: '…' })
```

React: `<Stage platform="desktop" chromeLabel="journal.app" captionTitle="…" captionText="…">{shell}</Stage>`.

## Why

- **Fixed widths per platform, not fluid.** A comp is drawn at its device's real width:
  390, 834 or 1440. Tablet and desktop never shrink (revisions 19, 30 and 33): the window
  scrolls sideways instead of showing the wrong platform.
- **Left-anchored with an auto inline margin** (revision 30), so an over-wide device is
  reachable rather than half off the left edge.
- **The iOS status bar goes through the palette** (revision 47): `--paper`, not a browser grey.
- **The caption takes its device's platform** so it matches the device's width.

## Do and don't

- Do put the whole shell inside it as `children`.
- Do give the caption the same `platform` as its device.
- Don't use it in anything that ships; it is furniture.
- Don't add colour literals anywhere but here.

## Legacy debt

`homebar` and `sig` were dropped on 2026-10-10: nothing read them. `check-modules` lists the rest
(contract `legacyClasses`) with who still reads each, and warns when one is no longer read.

Legacy classes the element keeps, and who reads them (rules file, rule 1; none may be removed yet):

- `.device`, `.device.t`, `.device.d`, `.device.ios`: lock.css (about 80 rules use them as
  context, e.g. `.device.d .app>.title`, `.device:not(.d) .page>.mast`,
  `.device:is(.t,.d) .compact-recorder-app>.rail`), `scripts/journal-navbar.js`
  (`.device:not(.d) .page`), `scripts/build-website-preview.mjs` (`.device.t .page` and others),
  `scripts/build-v3-prototypes.mjs`
  (`elementsByClass(html,'device')`), the verify scripts and the browser tests.
- `.chrome`, `.chrome.ios`, `.caption`, `.caption.t`, `.caption.d`: no CSS
  reads them any more; they are kept by the same rule and read by `siteCss`
  (`.chrome,.caption,.motion-review-status{display:none!important}`), `scripts/build-website-preview.mjs`
  (`<p class="caption motion-review-status">`) and the verify scripts.

Legacy contexts in the module's CSS:

- `:where(#journal) .screen > .aj-l-stage` (and the tablet and desktop forms): the website
  preview's wrapper and screen container, from `siteCss`.

Declarations left in legacy CSS:

- lock.css §2.1 `body{background:#6F6A60; font-family; display:flex; flex-direction:column;
  align-items:flex-start; padding; min-height}`: stage furniture, but a module cannot style `body`.
- `siteCss`: `.chrome,.caption,.motion-review-status{display:none!important}`: `!important`, and
  hides the stage furniture in the website preview.
- lock.css `.motion-review-status{display:none}` and its reduced-motion rule: they set only
  `display`, which the module never sets.
