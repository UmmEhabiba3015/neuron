# foot

D5 in the closed inventory (direction-lock.md §6). The footer line at the foot of a page: one
quiet fact about the record, such as "Since March 2026" or "Mood can be changed here, and only
here." While earlier entries load it is also the status line, worded: "Fetching earlier entries."

```js
use('foot', { text: 'Since March 2026' })
```

React: `<Foot text="…" />` (see `dist/types/Foot.props.d.ts`).

## Why

- **--rule, not --rule-2.** It sits on the open graph ground, where --rule-2 falls to 3.81:1
  (rule 2.3).
- **A paragraph, one line.** No role, no interaction; loading is a sentence, never a spinner.

## Do and don't

- Do write one short line of final copy.
- Do let the page place it; the module sets only its padding, type and colour.
- Don't make it interactive or add a variant.
- Don't show loading with a spinner; say what is happening in words.

## Legacy debt

- Legacy context `.page.split > .aj-c-foot` (padding-inline:0 from 1200px) stays until the
  split page is a module in its own right.
- No placement is left in lock.css for this component.
- Three screens still carry the footer without the module class (00-prototype,
  18-entry-system-states, journal-prototype-desktop: "Fetching earlier entries.").
