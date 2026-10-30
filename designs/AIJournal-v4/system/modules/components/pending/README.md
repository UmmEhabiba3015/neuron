# pending

v4 C5 in the closed inventory (explore drafts a-quiet-line, decided 2026-10-29). One line of the
system's quiet print for something not done yet, where it is. Nothing around it changes shape.

```js
use('pending', { text: 'Not uploaded yet. Trying again.', action: 'Try again', place: 'span' })
use('pending', { form: 'draft', text: 'Voice memo draft', length: '0:47', action: 'Continue', label: 'Continue your voice memo draft, 0:47', place: 'span', hook: 'draft' })
```

React: `<Pending text action sub />`, `<Pending form="draft" text length action label />`.

## Why

- **An unsent entry is in the list, not in the composer** (C5 ruling 2): it is drawn as any row, with its standard
  tools, at the time Save or Stop and keep was pressed. Only this line under its words says it hasn't reached the
  server. Entries and voice memos share it (one look).
- **Three states, one line.** Retrying (`--rule-2`, "Not uploaded yet. Trying again.", Try again); stopped, when
  retries have given up (`--rule`, the words say why); sending, after Try again ("Uploading…", no button, the arrow
  lifts and settles on `--g-lift`). Uploaded, the line goes and the row is ordinary.
- **No warning colour.** The system has none and the line needs none: the words carry it, as the notice's do.
- **The memo draft is one line under the composer's field,** never above it (the head is the overview's). The whole
  line is the button; its length is `--block`, the colour of audio that exists. It shows with or without words in
  the field (with words, Save stands where the mic was, so the line is the way back to the memo).
- **44px targets in a line of text height.** Try again overhangs the line above and below (`action` place); the draft
  line's hit area reaches past it the same way.

## Do and don't

- Do let the parent place it: a row's `span` place, the composer's `span` place (both `--s4` above).
- Do give the draft line a hook where a runtime opens the recorder from it.
- Don't add a second action, a colour or an icon of state; the words say it.
- Don't use it for a written draft: under C5 ruling 1 that is a local save with no state of its own.

## Placement

- Places: `action` Try again, overhanging the line so it keeps its 44px target; never wraps its label.
- Placed by: srow and recrow (`span`, under the words and tools), composer (`span`, under the row).

## Motion

The sending lift: the arrow up 2px and back, `--g-lift` 900ms on `--gc`, looping while it sends. Reduced motion:
still (the review switch `data-motion-review="play"` plays it).
