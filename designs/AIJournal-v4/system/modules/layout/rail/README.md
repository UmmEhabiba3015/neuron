# rail

The spiral binding down the paper's left edge (inventory A3). Decorative: `aria-hidden`, no tap
area, never navigation, on every screen. It is absolutely positioned in the shell and welded to
the page: at tablet it follows the centred page, at desktop it sits at the title block's edge
(`--title-w`), on iOS it stops at the tab bar.

## Why

The spiral binds the paper, not the furniture around it (direction-lock section 6 A, revisions 19,
22, 33, 44). The binding holes are circles by geometry, not radius (direction-lock section 5).

## Do and don't

- Do: render it as a direct child of the shell (or of a surface that is its containing block).
- Don't: give it content, a role or a tap area.
- Don't: place it by a number; its left comes from `--rail`, `--page-w` and `--title-w`.

## Legacy debt

- Legacy classes kept: every `.rail` element still carries `rail` (`aj-l-rail rail`).
  Read by: `scripts/verify-compact-merge.mjs` and `scripts/verify-website-preview.mjs`
  (`.rail` queries), and the runtime test page `design system/components/tests/runtime.html`
  (its own copy of the rules, scoped under `.journal-app`).
- Legacy contexts in `rail.css` (listed by the checker): `.app.ios`, `.auth-paper`,
  `.device:is(.t,.d) .compact-recorder-app`, and the website preview's `.device.t` / `.device.d` /
  `.auth-paper` rules behind `:where(#journal)`.
- Declarations left in legacy CSS: none. `--rail` itself stays in `lock.css` `:root`.
