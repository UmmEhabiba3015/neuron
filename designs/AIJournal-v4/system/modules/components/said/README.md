# said

C4 in the closed inventory (direction-lock.md §6). The product's note beside an entry: a ruled
label column ("From your record") and a body that is shut until opened (native details/summary,
no script). Opening rolls the label from "Read the note" to "Hide the note", turns the chevron and
lets the note down. The note ends in the citation pair.

```js
use('said', { label: 'From your record', note: '…', open: false }, { foot: citePair })
```

## Why

- **Shut until asked for.** The product speaks only when the reader opens the note; on an answer the
  reader asked for (`open`), the note is shown, since collapsing it would be perverse.
- **One roll, one clock.** The two labels derive their position from one registered property, so
  they cannot drift apart; closing is instant for the body, by instruction.
- **Evidence and a rating.** The foot carries the citation and the thumbs (Ask's mechanic; That's not right was
  retired in v4 round 10).

## Do and don't

- Do put the citation (button cite) and the thumbs (thumbs, form pair) in the `foot` slot.
- Do keep the note short, in the product's voice.
- Don't add a script to open it; the details element does that.
- Don't set `open` on a note the reader should choose to open.

## Legacy debt

- Legacy contexts in `said.css`: `.app` (the shell's motion and its reduced-motion block) and
  `.app:not(.ios) .sheet` (the website's sheet narrows the label column and its tracking). The runtime
  hides a deleted entry's note itself.
- Legacy classes still on the markup: `said`, `tcol`, `ccol`, `said-foot` (and `lblbox`, `lbl`,
  `chev`, `note`, to be taken off after the merge). `.tcol` and `.ccol` are still read by the entry
  rows; the sheet's row border reaches the note.
- `letter-spacing:.11em` (label) and `.1em` (summary) and the `14px` chevron have no recorded reason.
