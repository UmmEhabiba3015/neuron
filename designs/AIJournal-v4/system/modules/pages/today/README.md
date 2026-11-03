# today (page)

Today: the day's record as it is written (entries, a recording, the product's notes), its mood, and the
writing companion at its foot. Approved design: journal-website.html `#today`.

## Why

Today is the key screen and the first instance of a page with behaviour: the header section, the entry
tools, the recording row and the companion. Every other page follows its pattern: content once in
data, platform differences as named rules, modules composed with roles.

## Do and don't

- Do compose modules only (`use()`), with roles; the page has no CSS and writes no markup of its own.
- Do keep content in `data.mjs` (a recording's waveform is the wave's own (v4 round 10)); shared icons in
  `system/content/icons.mjs`.
- Don't add a state journal-website.html doesn't show. Today's states (draft, empty, loading, the
  entry actions' outcomes) arrive with the state packs in pages round 4.

## Usage

```js
render('today', { platform: 'mobile', state: 'default' })
```

## Platform rules

- **Desktop**: the masthead (wordmark, the day's keybox) and the destinations are the title block
  beside the page (`mast` form `title`, shell layout `sidebar`).
- **Mobile and tablet**: the header section (`header` form `static`: the masthead row and the
  destinations, roles `head` and `nav`) inside the page.
- **Every platform** draws the 14:05 recording's waveform as the wave draws every memo: the phrase at one pitch,
  as much of it as the row is wide (v4 round 10; it was a viewBox per row width, which stretched in between).

## Composition

The record (`sheet`, roles `block record`): written entries (`srow`: `text`, `entry-actions` with the
edit and delete icon buttons and the memory menu, `mark` when private), the recording (`recrow`: `play`,
`wave`, its transcript and tools) and the product's notes (`said`, shut, with a citation and "That's not
right"), then the ruled mood row. At the foot (role `foot`), the composer as the writing companion: the
overview (role `head`: the latest weekly reflection's line, linking to it), the field, the mic, and its tools (`opt` role
`option`, More options role `fixed`).

## Comp

`system/comps/01-today.json`; the build writes `*/01-today.html` from it.
