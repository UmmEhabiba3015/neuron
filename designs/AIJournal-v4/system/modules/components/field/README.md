# field

E3 in the closed inventory (direction-lock.md §6). A text field. Single line by default; a
textarea in the auth forms and the entry editor, a select in the auth forms. Never autofocused.
In the no-script comps a div stands in for it, its hint shown as a placeholder.

```js
use('field', { tag: 'input', label: 'Email', value: 'mira@example.com' })
```

React: `<Field label="…" value="…" />` (see `dist/types/Field.props.d.ts`).

## Why

- **One look for every text control.** Input, textarea and select share the same paper, keyline
  and prose type; only height and padding differ by context.
- **Never underlined.** The prototype once made the field a link to be tappable (revision 11).
- **The label is required.** A visible label in the forms, `aria-label` in the composer.

## Do and don't

- Do let the parent set its width, by role (`fill`: the auth form, the entry editor). Its `flex` is its own.
- Do write errors under the field (the auth help line), not on it.
- Don't autofocus it, and don't disable it; an unavailable action is not shown.
- Don't add a variant or colour; the placeholder hint is the only colour change.

## Placement

- Placed by: the auth form (`fill`), the entry actions (`fill`, the editor).

## Legacy debt

- `field.css` carries five legacy contexts: `.auth-field .aj-c-field` (box-sizing),
  `.auth-field textarea.aj-c-field`, `.auth-field select.aj-c-field`,
  `.password-control>.aj-c-field` and `.entry-editor textarea.aj-c-field`.
- No placement is left in `lock.css` on `.aj-c-field`. Its `flex:1 1 auto` is the module's own; the
  auth form and the entry editor give the width by role (`fill`).
- The guide's `.ds-form .field{width:100%;appearance:none}` stays outside the module.
