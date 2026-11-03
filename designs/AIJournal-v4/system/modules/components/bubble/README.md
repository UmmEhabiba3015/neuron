# bubble

A message in Ask (v4 C2, DESIGN.md 2026-10-25). Yours on the right, the answer on the left and wider, mirroring
it. Approved design: explore `2026-10-22-ask-readable/a-mirror-bubble` (as revised); its states from
`2026-10-25-ask-states/d-composer-led` (not sent) and `2026-10-25-ask-cant-loading/f-mix` (can't answer).

```js
use('bubble', { voice: 'you', id: 'q1', paras: ['What do I write about when I can’t sleep?'] })
use('bubble', { voice: 'answer', id: 'a1', paras, refs, used: '2 entries used', rating: 'up' })
```

React: `<Bubble voice id paras refs used status cant unsent bookmarked rating asking onBookmark onCopy onRate />`.

In an answer's paragraphs `{n}` marks where reference `n` (1-based) is used: it draws `(6 Aug)`, a link to that
day's Day page. `refs` are `{ short, long, text, href }`. `asking` draws the thumbs-down form open without the script
(the Ask page's comps); live, the bubble opens it itself.

## Behaviour

- `bubble:bookmark` `{ id, on }`, `bubble:copy` `{ id }` (the words go to the clipboard and the tool says Copied
  for 1.4s), `bubble:rate` `{ id, rating, why? }`.
- Thumbs, one at a time: up toggles and clears down. Down empty opens the thumbs-down form (rateform, one line)
  in the tools row after the thumbs down, scrolled clear of the floor (`data-floor`, the composer's height in px, set by
  the chat) when it opens under it (v4 round 10); it sends to filled red, cancels or Escape back to the thumb; a press outside closes it. A filled down
  pressed returns to none, and the next press asks again.
- The chat sets `data-status` (reading, writing) while an answer arrives and writes the words into hook `text`.

## Why

- **The answer has a ground of its own.** Straight on the grid it was hard to read; of five grounds the user
  chose the familiar mirror: the bubble's side and tail say who speaks, so the answer carries no name.
- **Can't answer is told apart at a glance:** unfilled paper, a dashed edge (`--w-dash`), "Not in your journal".
  Drawn as a normal answer it could be mistaken for one (the user, 2026-10-25).
- **Hover darkens to `--block`, not `--ink`.** The exploration's links turned `--ink`; `--ink` is the person's
  words and nothing else, and every other link and quiet control in the product turns `--block`.
- **The entries used are quoted with `--w-quote` in `--rule`,** as the token states (the exploration drew it in
  `--ink`).

## Do and don't

- Do give every message an id unique on the page: bookmarks jump to it and the form's field derives its id.
- Do leave the space between messages, session lines and scroll margins to the chat.
- Don't draw thumbs on your own messages, a can't-answer, or an answer still arriving.
- Don't use it outside Ask.
