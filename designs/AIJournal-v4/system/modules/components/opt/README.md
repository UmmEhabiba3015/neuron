# opt

E6 in the closed inventory (direction-lock.md §6). A checkable option: a small keyline tick
and a label, pressed or not. The composer's and the recorder's "Keep this out of memory", and Use in memory in the memory
dropdown of an entry kept out of memory (compact).

```js
use('opt', { label: 'Keep this out of memory', pressed: false })
```

React: `<Opt label="…" pressed onChange />` (see `dist/types/Opt.props.d.ts`).

## Why

- **It is a button with `aria-pressed`,** so the state is spoken and keyboard operable (Tab, Space, Enter).
- **The tick is decorative** (`aria-hidden`); the label names the control.
- **The tick fills `--rule` when pressed;** hover turns the label `--rule`.
- **Press is a state, not a transition:** 1px down; under the shell it also scales .97.

## Do and don't

- Do write the label as final copy, in sentence case.
- Do let the parent place it: the composer sets its margin-top by role (`option`).
- Don't use it for a choice among several; that is a segmented control.
- Don't add a colour or a second state.

## Placement

- Placed by: the composer (`option`).

## Legacy debt

- Legacy contexts in `opt.css`: the shell's motion (`.app .aj-c-opt`, the hover and
  reduced-motion blocks) and the entry memory menu's compact form (`.entry-memory-menu>.aj-c-opt`
  and its tick and label). The menu becomes the entry-actions module next round.
- No placement is left in `lock.css` on `.aj-c-opt`. The composer places it by role (`option`); the
  entry memory menu's compact form is in `opt.css`.
- The `opt` and `tick` legacy classes are still on the elements; the composer's tuck motion
  (`.app .composer:has(.opt)`) reads `opt`.
