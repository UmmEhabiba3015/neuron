# stack

E8 in the closed inventory (direction-lock.md §6). A full-screen column for a page with one job
(/talk, the kept recording, the permission card): its contents centred, one above another.
Rows of controls go in a `.aj-c-stack__row` part.

```js
use('stack', {}, { children: '…' })
```

React: `<Stack>{children}</Stack>`.

## Why

- **One job per page.** /talk and first run have no form to sit in, so the contents are centred
  in the page (REVISION 4c).
- **Centred short lines, start-aligned prose.** A card inside the stack resets the alignment
  (REVISION 15): centred multi-line prose is bad typography.

## Do and don't

- Do put the page's single purpose in it, and rows of controls in the `__row` part.
- Do let the page place it: it grows and takes its desktop cap by role (`main`).
- Don't use it for a page with a form or several sections.
- Don't restyle its children from here: the stack places its children by role (`block`, `fill`), never by naming them.

## Placement

- Places: `block` a card or notice, the full column, no margin; `fill` the recording row, the full width.
- Placed by: the page (`main`).

## Legacy debt

- No placement is left in `lock.css` on `.aj-c-stack`; the page places it by role (`main`).
- No rule about its children is left in `lock.css`: the stack places the card, the notice and the
  recording row by role.
- The module has no legacy-context rules of its own.
