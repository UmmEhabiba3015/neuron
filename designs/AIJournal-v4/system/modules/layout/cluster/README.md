# cluster

L2, a layout primitive. A wrapping row with a gap. The owner sets the gap, alignment and wrap; a child can grow or stay fixed.

```html
<div class="aj-s-… aj-l-cluster">…</div>
```

```css
.aj-s-…{--aj-l-cluster-gap:var(--s6)}   /* the owner sets the gap on its own element */
```

## Why

- **Placement lives in layout primitives** (DESIGN.md, 2026-10-12). Lock.css will be empty, pages have
  no CSS and a module never names another module, so a parent's arrangement of its children needs a
  home that knows nothing about the children: this one.
- **It goes on an element that already exists** where it can, so adopting it adds no wrapper and the
  screens stay pixel-identical.

## Do and don't

- Do set the gap, alignment and wrap through the exposed properties, from the owner's own rule on the same element.
- Do give a child a placement role with `data-place` (`grow`, `fixed`) instead of a rule about it.
- Don't put anything visual on it: no colour, no border, no type.
- Don't write a rule that names a child module to place it.

## Placement

- Places: `grow` takes the room left; `fixed` keeps its own size.

## Legacy debt

None: a new module.
