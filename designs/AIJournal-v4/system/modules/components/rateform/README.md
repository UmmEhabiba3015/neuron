# rateform

The thumbs-down form, on Ask's answers and the journal's notes (v4 C2; one line everywhere since v4 round 10,
DESIGN.md 2026-10-29). One row as tall as the thumb's box: the field, "What was wrong?" as its placeholder, and Send.

```js
use('rateform', { id: 'a1-why', place: 'rate', attrs: { hidden: true } })
```

React: `<RateForm id question send onSend onCancel />`.

## Behaviour

- `rateform:send` (detail `{ why }`) on submit: Send or Enter.
- `rateform:cancel` on Escape (it stops there, so it never closes a dialog around it).
- Its parent (the thumbs) shows it (`hidden` off) in its row after the thumbs down, focuses the field (hook
  `input`), and hides and clears it; pressing the thumb again or anywhere else closes it too.

## Why

- **One line, beside the thumb** (v4 round 10, the user). The first form was a floating card (the hand's question,
  a two-line field, Cancel and Send); on a note it fell behind the next entry in Today's list. The line is as tall as
  the thumb's box (--tap), sits after the thumbs down in their row and never covers anything; the user then asked
  for it everywhere, Ask included.
- **No question line and no Cancel.** The question is the placeholder and the name; the thumb again, Escape or a
  press elsewhere close it.

## Do and don't

- Do give each form a field id unique on the page (the answer's id with `-why`).
- Do let the parent place it by role; the form never positions itself.
- Don't show it on an answer the journal could not give (no thumbs there), or on your own messages.
- Don't float it over the thread or the list: it belongs in the thumbs' row.
