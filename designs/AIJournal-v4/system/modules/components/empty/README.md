# empty

F3 in the closed inventory (direction-lock.md §6). An empty or not-enough state: one line of
prose in the reading face. No illustration, ever; no blank box.

```js
use('empty', { text: "What's today been like?" })
```

React: `<Empty text="…" />` (see `dist/types/Empty.props.d.ts`).

## Why

- **One sentence of final copy.** The line is the whole state.
- **It is a paragraph,** so it needs no role and no keyboard behaviour.

## Do and don't

- Do let it hold its own measure: the 34ch limit (and its removal at 700px and 1200px) is in the module.
- Don't add an illustration, an icon or a box around it.

## Legacy debt

- `empty.css` has no legacy contexts.
- No placement is left in `lock.css` on `.aj-c-empty`: `max-width:34ch`, and `max-width:none` in the 700
  and 1200 containers, are the module's own.
- `34ch` has no recorded reason.
