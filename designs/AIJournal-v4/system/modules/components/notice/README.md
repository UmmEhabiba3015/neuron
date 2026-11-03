# notice

F1 in the closed inventory (direction-lock.md §6). An inline notice: offline, guest,
allowance, or the outcome of something the user just did, in one short paragraph.

```js
use('notice', { text: 'We could not save this entry. Your words are still in the composer.', announce: true })
```

React: `<Notice text="…" announce />` (see `dist/types/Notice.props.d.ts`).

## Why

- **Inline, never a toast or a banner.** It sits in the page where the thing happened and
  never touches history (direction-lock.md §6 F1; toasts are excluded from the inventory).
- **Never colour-coded.** An error notice looks like every other notice; the words carry the
  meaning (rule 2.4). That is why there is no error variant.
- **--rule on --paper-2, 4.97:1 and up.** The notice carries its own flat fill so it can sit on
  the graph ground.
- **Start-aligned everywhere,** including inside a centred `.stack`: it holds sentences.

## Do and don't

- Do set `announce` when the notice reports the result of an action (save failed, upload
  stopped), so it is read out once.
- Do let the parent place it: the page, the stack, the auth form and the state message give it its
  margin and width by role (`block`), never the notice.
- Don't put links, buttons or emphasis in it; a notice that needs an action is a card.
- Don't use it for progress or for anything the product generated about the
  user's record.

## Placement

- Placed by: the page (`block`), the stack (`block`), the auth form (`block`), the state message (`block`).
