# chat

Ask's conversation (v4 C2, DESIGN.md 2026-10-25). The head row, the thread of the open day's sessions, the chat
composer at the foot. Approved design: explore `2026-10-22-ask-readable/a-mirror-bubble` (as revised); the empty
session and the failure from `2026-10-25-ask-states/d-composer-led`; the skeleton from
`2026-10-25-ask-cant-loading/f-mix`.

```js
use('chat', { day: dayOf(TODAY), sessions: sessionsOf(TODAY) }, { tools: use('drawers', { … }) })
```

React: `<Chat day sessions state composer lead todayHref onNew onToday onAsk>{drawers}</Chat>`.
The sample journal and its helpers are `system/content/ask-journal.mjs` (`sessionsOf`, `bubbles`, `dayOf`).

## Behaviour

- `chat:ask` `{ text, suggested? }` when a question is sent (Enter, the Ask button, or one of the lead's
  questions); the field clears. `chat:new`, `chat:today`.
- New starts the session in a clear window (DESIGN.md 2026-10-26): the app takes the day's sessions so far out of
  the thread, leaving only the new one. They stay the day's: picking the day in History opens it whole (every
  session with its line, the open one last), and Bookmarks lists them. New on today opened whole clears the window
  back to the open session, even before anything is asked in it. Ask opening (the page loading, or coming back to
  Ask) starts a new session the same way, on today (DESIGN.md 2026-10-28).
- The app answers: it appends the bubbles (rendered from the bubble module) to the thread (hook `thread`), sets the
  answer's `data-status` (reading, then writing as words arrive), and removes it when done. The chat follows the
  writing while the reader is at the end, and writes `data-floor` on every bubble so a thumbs-down form opening
  under the composer is scrolled clear of it.
- A bookmark chosen in the drawers: the app sets `data-jump="<message id>"` on the chat; the message comes into view,
  takes focus and arrives as the Timeline's day does (C1's f-wash-and-frame, DESIGN.md 2026-10-26):
  once the scroll ends, a `--rule` wash passes through it and a frame is drawn round it in the bubble's shape, held
  until the next jump or the message leaves the thread. Reduced motion: the wash fades in place, the frame is there
  at once.
- A failed question: the app marks its bubble `unsent`, puts its words back in the field and the lead `failed`;
  sending it again retries in place (the app's).
- A day opening: the app may replace the thread's and the composer's contents (and the head's New or Today) from a
  render of the chat for that day; the script finds the field again when it needs it.

## Why

- **The composer leads the states** (ask-states D): the next step sits where the hands are, and a failure never
  leaves a broken answer in the record.
- **The skeleton is a whole page** (f-mix): the newest exchange rests on the composer as the day will open, cut off
  at the top as a long chat scrolled to its end; answer bones at the answer's real width, so nothing jumps.
- **The head row** sticks where it stands (the page above it adds no lead on desktop), its pills in the middle of its
  paper and, on desktop, level with the wordmark; the paper fades at its foot and out to each side, so it keeps the
  pills readable over the thread without a hard band.

## Do and don't

- Do give the section the screen's height less the page's head (`--aj-s-chat-min`, `--aj-s-chat-screen`).
- Do put the drawers section in `tools`; the chat puts New or Today at the row's end itself.
- Don't draw a session without its line, or a past day with the composer.
- Don't animate the skeleton under reduced motion (the shimmer stops; the review switch plays it).
