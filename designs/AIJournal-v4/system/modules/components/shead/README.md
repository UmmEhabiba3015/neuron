# shead

D6 in the closed inventory (direction-lock.md §6). A section heading inside the form: printed
caps on the page ground, between the ruled rows. An h2, or an h3 where it sits inside a section
that already has an h2.

```js
use('shead', { text: 'Your plan', level: 2 })
```

## Why

- **One weight.** It sets 400, like every other object on `--t-key`; an h2 would otherwise compute
  700 (revision 48).
- **Caps come from the CSS.** Write the text in sentence case.
- **It carries its own fill** (`--paper`), so it is safe anywhere.

## Do and don't

- Do use `level: 3` only where a section already has an h2.
- Do let the parent place it: the auth form sets the gap above it by role (`head`).
- Don't make it interactive or add a variant; it is static text.

## Placement

- Placed by: the auth form (`head`).

## Legacy debt

- No legacy context in `shead.css`.
- No placement is left in `lock.css` on `.aj-c-shead`; the auth form places it by role (`head`).
