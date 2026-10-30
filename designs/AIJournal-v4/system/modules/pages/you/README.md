# you (page)

You: the settings page. Settings rows in three groups, each a link to its own screen, under the
masthead and destinations, with a foot line. Approved design: journal-website.html `#you`.

## Why

The settings page is a list of rows (`srowlink`) under group headings, on the same page shape as
Today. One page module writes it for all three platforms.

## Do and don't

- Do compose modules only (`use()`), with roles; the page has no CSS and writes no markup of its own.
- Do keep content in `data.mjs`, once for every platform; a platform difference is a named rule in the
  render, never a second copy.
- Don't add a state journal-website.html doesn't show: the website is the approved design.

## Usage

```js
render('you', { platform: 'desktop', state: 'default' })
```

## Platform rules

- **Desktop**: the masthead (wordmark, the keybox) and the destinations are the title block beside the
  page (`mast` form `title`, shell layout `sidebar`).
- **Mobile and tablet**: the header section (`header` form `static`: the masthead row and the
  destinations, roles `head` and `nav`) inside the page.

## Composition

The settings (`sheet`, roles `block record`): for each group a heading (`shead`) and its rows
(`srowlink`: label, why, value, link). Below the sheet, the foot line.

## Comp

`system/comps/07-you.json`; the build writes `*/07-you.html` from it.
