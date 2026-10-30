# ask (page)

Ask (v4 C2, DESIGN.md 2026-10-25): a chatbot that answers from the person's own entries. Approved design:
explore `2026-10-22-ask-readable/a-mirror-bubble` (as revised); the states from `2026-10-25-ask-states` (D) and
`2026-10-25-ask-cant-loading` (f-mix). Search left Ask for the Timeline (C1).

## Why

The answers are about the person's own words, so each points to the days it read (a reference opens that Day
page), and the person can keep, copy and rate them. The day stays the unit of the journal: a day's chats are its
sessions, the history folds the days, and the date box in the masthead names the day open.

## Do and don't

- Do take the journal from `system/content/ask-journal.mjs`, so the page, the chat and the drawers never drift.
- Do give each chat on one screen file its own ids (the page adds the state to them past `today`).
- Don't draw a past day's composer: a past day is read only, with Today to return.

## Usage

```js
render('ask', { platform: 'desktop', state: 'drawers' })
```

## Platform rules

- **Mobile and tablet**: the header section (the masthead row with the date box, the destinations), the chat
  below it.
- **Desktop**: the title block (wordmark, the date box, destinations); the chat in the page's column, on a bare
  page (no lead), so the chat's head row stands at the top level with the wordmark and never moves. History
  opens to the rail; the pills show their words (icons only below 1200, the chat's container).

## Composition

`chat`, placed `block fill` (the page's whole view: nothing below it, so the composer rests on the bottom edge) (the head row, the thread of sessions and `bubble`s, the `composer`'s chat form), with `drawers` in its
`tools` slot. The states are in `states.mjs`.

## The live page

The walkthroughs and the website run `scripts/journal-ask.js`, a stand-in for the app: it answers from the sample
journal (reading, then the words written in), opens at the newest end (the navbar places its reader on mobile and tablet; the window scrolls to the
bottom on desktop), starts a new session on today whenever Ask opens (the earlier sessions are Today's History entry), starts a
session in a clear window on New, opens a day from History (loading, then
the day), keeps the bookmarks and their count, and jumps to a bookmark. Its markup comes from build-time templates
(`scripts/templates/5-ask.mjs`), rendered by the modules.

## Comp

`system/comps/04-ask.json`: today and a past day on every platform; desktop adds both drawers open. Ask opening is
18's `#ask-loading`.
