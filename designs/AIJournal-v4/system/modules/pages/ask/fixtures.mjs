// Ask on each platform and state (04-ask; 18's loading). The journal is the approved one (system/content/ask-journal.mjs).
export default [
  { name: 'Mobile, today', note: '04-ask, mobile-web: today’s two sessions, the second open.', props: { platform: 'mobile', state: 'today' } },
  { name: 'Tablet, past day', note: '04-ask, tablet-web: Thursday 6 August, read only; Today in the head row.', props: { platform: 'tablet', state: 'past' } },
  { name: 'Desktop, today', note: '04-ask, desktop-web: the title block with the day’s date box; the chat in the column.', props: { platform: 'desktop', state: 'today' } },
  { name: 'History', note: 'History open from the left: today marked, this week’s days, then weeks and months.', props: { platform: 'mobile', state: 'history' } },
  { name: 'Bookmarks', note: 'Bookmarks open from the right: the open day’s.', props: { platform: 'tablet', state: 'bookmarks' } },
  { name: 'Desktop, both drawers', note: '04-ask, desktop-web: History to the rail and Bookmarks together over one dim.', props: { platform: 'desktop', state: 'drawers' } },
  { name: 'Thumbs down', note: 'The thumbs down pressed: “What was wrong?” under the answer’s tools.', props: { platform: 'mobile', state: 'rate' } },
  { name: 'Writing', state: 'loading', note: 'The answer being written in, word by word.', props: { platform: 'mobile', state: 'writing' } },
  { name: 'Empty session', state: 'empty', note: 'New pressed, nothing asked yet: the composer’s lead asks what to ask.', props: { platform: 'tablet', state: 'empty' } },
  { name: 'Can’t answer', state: 'error', note: 'The dashed answer, “Not in your journal”; the lead offers what it can answer.', props: { platform: 'mobile', state: 'cant' } },
  { name: 'Not sent', state: 'error', note: 'The question dimmed and marked, its words back in the box.', props: { platform: 'desktop', state: 'failed' } },
  { name: 'Loading', state: 'loading', note: '18-entry-system-states #ask-loading: Ask opening, a whole page of skeleton resting on the composer.', props: { platform: 'mobile', state: 'loading' } },
  // As the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'today', context: 'walkthrough' } },
];
