# moodrow

C5 in the closed inventory (direction-lock.md §6). Five words in a row, the last row of the
form: how the day felt. The plain form is a handwritten heading over five keyline chips; the
ruled form (the writing companion) sets the label in the ruled time column and tints the chosen
word in its mood colour.

```js
use('moodrow', { form: 'ruled', label: 'Today felt', selected: 'good' })
```

React: `<MoodRow form="ruled" label="Today felt" selected="good" onChange />` (see
`dist/types/MoodRow.props.d.ts`).

## Why

- **Words, not faces.** Five words: Light, Good, Even, Low, Hard.
- **One pressed at most.** `aria-pressed="true"` marks the saved mood; the state message under
  the row (legacy `.state-message`) reports a failure.
- **The ruled head matches the entry times.** Its width is the `--tcol` column.
- **Reduced motion ends the fades.** The shell's motion lines and the ruled fades stop under it.

## Do and don't

- Do write the label in the form's own voice ("Today felt", "Day felt").
- Do keep the group label "How was this day?".
- Don't add a sixth word or a colour; the five tones are tokens.

## Placement

- Places: `span` a state message under the mood, the full grid, `--s4` above.

## Legacy debt

- `moodrow.css` carries legacy contexts: `.app .aj-c-moodrow__chips button` (the shell's glide,
  press and reduced-motion lines) and `.app:not(.ios) .sheet .aj-c-moodrow__head` (the time
  column in the website's sheet).
- No placement is set on the root, and none is left in `lock.css`. A state message under the mood is
  placed by role (`span`).
- The legacy classes `moodrow`, `ruled-mood`, `chips`, `tcol` and `ccol` stay on the markup for
  scripts and the legacy rules above.
