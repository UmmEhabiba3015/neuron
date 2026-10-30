# button

E2 in the closed inventory (direction-lock.md §6). Three grades and no fourth (solid, keyline,
quiet), the citation (cite), and three forms of the quiet button: the entry tools'
icon, the password toggle and the forgot line.

```js
use('button', { grade: 'solid', label: 'Sign in' })
use('button', { grade: 'quiet', form: 'icon', label: 'Edit entry', href: '…' }, { icon: '<svg>…</svg>' })
```

React: `<Button grade form href label>{icon}</Button>` (see `dist/types/Button.props.d.ts`).

## Why

- **Three grades and no fourth.** Solid is the one committing action of a view; keyline a secondary
  action; quiet the least weight, a dotted-underlined word.
- **Cite never carries the base button box** (it was `.cite`, not `.btn`). The CSS writes the base
  as `:where(:not(cite))` at the specificity `.btn` had. Its partner, wrong (That's not right), was
  retired in v4 round 10: what the journal wrote is rated with the thumbs component.
- **Quiet is `--rule`, not `--rule-2`,** so it stays legible on the open graph ground.
- **Icon and toggle forms need `aria-label`;** the glyph carries no text. The toggle carries
  `aria-pressed`, and the password-shown state hides the eye's slash.
- **The hover ramp is transform only** (the shell's motion), so hover never flashes the browser's
  default link colour.

## The switch form

- **An on/off setting written as a word with a track and knob after it** (Timeline search's "By meaning"):
  `use('button', { form: 'switch', label: 'By meaning', checked: false })`. A button element with
  `role="switch"` and `aria-checked`, never a link (`href` is ignored); the word is the accessible name.
- **The grade does not apply.** The render writes no `data-grade`, so no box, fill or border of the grade
  rules reaches it. Hover changes nothing but the cursor.
- **It has no script.** Its parent flips `aria-checked` and acts on it (the Timeline search section, v4
  round 5); the button only draws both states.
- **`--aj-c-button-switch-h`** sets its height (default `--tap`); a parent stretches it to its own line.
- **Reduced motion:** the track and knob transitions are off, except under the review switch
  (`data-motion-review="play"`).

## The pill form (v4 C2)

- **Ask's round pills** (History, Bookmarks, New, Today, Close): `use('button', { form: 'pill', label: 'Bookmarks', count: 3, expanded: false }, { icon: BOOKMARK_SOLID })`.
  An optional icon, then the word, then an optional count badge. A link when `href` is given.
- **The grade does not apply.** No `data-grade` is written and no grade rule reaches it. The word is the accessible name.
- **`count`** draws a badge; 0 draws the empty badge (`data-zero`: no fill, a 40% ring). **`expanded`** writes `aria-expanded`;
  true draws the hover look at any pointer (a zero badge inverted too).
- **Below the container's 1200** a pill with an icon shows only its icon (the word is visually hidden, still read): a round
  `--tap` square, or the icon and the count. A pill without an icon keeps its word at every width.
- **No script:** the parent opens and closes its drawer.

## The tool option (v4 C2)

- **Ask's message tools** on the icon form: `use('button', { grade: 'quiet', form: 'icon', tool: 'up', label: 'Helpful', pressed: false }, { icon: THUMB_UP })`.
  `tool` is bookmark, copy, up or down. Always a button element. bookmark, up and down write `aria-pressed`; copy none; down also
  writes `aria-expanded="false"` (its parent opens its form).
- **Colours:** `--rule-2` at rest; hover `--rule` on an 8% ground; the thumbs mix `--rate-up` / `--rate-down` into it. Pressed fills
  the glyph in the tool's colour. An open down keeps its hover look.
- **`--aj-c-button-rest`** is the tool's opacity at rest (default 1). A message sets it to 0 with a fine pointer and back to 1 on its
  hover or focus; a pressed, expanded or focused tool ignores it. The button never sets it.
- **Copied:** the parent writes `data-copied="<the word>"` on copy for a moment; the tool shows it in a small tag above it.
- **Reduced motion:** the tools' ramps are off, except under the review switch (`data-motion-review="play"`).
- The entry tools (no `tool`) are unchanged.

## Do and don't

- Do give a link an `href` and a button element none; both render identically.
- Do put a cite with the thumbs (thumbs, form pair) under a note.
- Don't add a fourth grade or colour; hover is the only change besides pressing.
- Don't show the disabled state outside the compact recorder's transport.

## Placement

- Placed by: the composer (`fixed`, the tools' quiet button), the auth form (`fill` the submit, `start` the forgot link), the recorder (`grow`, the transport's main button).

## Legacy debt

- Legacy contexts in `button.css`: `.app` (the press ramp and its reduced-motion), `.auth-surface`
  (label wraps), `.auth-paper` (the forgot line's box), `.password-control` (the toggle's position
  inside the field), `:is(.srow, .recrow)` (the icon glyph centred at 1000px), `.compact-recorder`
  (gap, glyph and disabled).
- No placement is left in `lock.css` on `.aj-c-button`. The tap widths are the module's own
  (`min-width` of quiet and cite; `width` and `min-width` of the icon and toggle forms), and so
  is the forgot line's `align-self` when the auth form gives it `start`. The composer, the auth form
  and the recorder place the button by role.
- Left in `lock.css` on purpose: `.auth-paper .password-note, .auth-paper .field-error` (the forgot
  button still matches it through `password-note`; the module's rule sets the same values and
  wins) and `.password-toggle[aria-pressed=true] .eye-slash` (its subject is a piece of the glyph).
- The elements still carry `btn`, `quiet`, `solid`, `entry-icon`, `password-toggle` and `forgot`
  as legacy classes for these rules.
