# day (page)

A past day: its record as it was written (entries and the product's notes), its
mood, which stays changeable, and a line at the foot. Approved design: journal-website.html `#day`.

## Why

A past day is Today's sheet without the composer: the same entry rows and tools, the same notes, the
same mood row, reached from Timeline. One page module writes it for all three platforms.

## Do and don't

- Do compose modules only (`use()`), with roles; the page has no CSS and writes no markup of its own.
- Do keep content in `data.mjs`, once for every platform; a platform difference is a named rule in the
  render, never a second copy.
- Don't add a state journal-website.html doesn't show: the website is the approved design.

## Usage

```js
render('day', { platform: 'desktop', state: 'default' })
```

## Platform rules

- **Desktop**: the masthead (back to Timeline, the day's keybox) is the title block beside the page
  (`mast` form `title`, shell layout `sidebar`, page headed `untitled`).
- **Mobile and tablet**: the masthead row inside the page (role `head`).

## Composition

The record (`sheet`, roles `block record`): written entries (`srow`: `text`, `entry-actions` with the
edit and delete icon buttons and the memory menu), the product's notes (`said`, open, with a citation
and its thumbs, Ask's mechanic) and its question, then the ruled mood row. Below the sheet, the foot line.

## Comp

`system/comps/06-conversation.json`; the build writes `*/06-conversation.html` from it.
