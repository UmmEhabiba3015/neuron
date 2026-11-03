# thumbs

Helpful and Not helpful on something the journal wrote (v4 round 10, DESIGN.md 2026-10-29): an answer in Ask, and
a note on Today, the Day page and a Reflections leaf, where it replaces That's not right. The mechanic is Ask's (C2,
DESIGN.md 2026-10-25), moved out of bubble unchanged.

```js
use('thumbs', { id: 'a1' })                          // Ask: inside the answer's tools
use('thumbs', { id: 'note-today', form: 'pair' })    // a note's foot, after its source
```

React: `<Thumbs id form rating asking labels onRate />`.

## Behaviour

- `thumbs:rate` `{ rating, why? }`. One at a time: up toggles and clears down. Down empty opens the thumbs-down form
  (rateform, one line) in the row after the thumbs down, scrolled clear of the floor (the nearest `data-floor`, Ask's
  composer) when it opens under it. It sends to filled red, cancels or Escape back to the thumb; a press outside closes it. A filled
  down pressed returns to none, and the next press asks again.
- `asking` draws the form open without the script (comps); live, the thumbs open it themselves.

## Why

- **One mechanic for everything the journal wrote.** That's not right was a second way to say the same thing, with
  its own words and (on Reflections) its own strike-through and Undo; the user replaced it with Ask's thumbs
  (2026-10-29, round 10).
- **Two forms.** In Ask (`tools`) it draws no box (`display:contents`): the thumbs are tools among bookmark and copy,
  spaced and faded by the bubble's row exactly as before. In a note's foot (`pair`) it is a small row of its own, the
  thumbs as close as in Ask, so they read as one control after the source link.
- **The form is a line, beside the thumb** (v4 round 10, the user; on notes first, then everywhere). Floating, it fell behind the next entry in
  Today's list. The line form is as tall as the thumb's box and sits right of it; where the foot leaves under 180px
  (a phone) it drops under the thumbs, from their start, and the source keeps to the thumbs' row.

## Do and don't

- Do let the row that holds Ask's thumbs (`tools`) wrap: the form drops under where it has under 180px.
- Do place the `pair` yourself (a note's foot puts it after its source).
- Don't put it on the person's own words, or on an answer the journal could not give.
