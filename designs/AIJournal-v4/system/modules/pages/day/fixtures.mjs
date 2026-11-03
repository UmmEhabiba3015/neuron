// A past day on each platform (06-conversation). The catalogue draws a page at its own width.
export default [
  { name: 'Mobile', note: 'The masthead row inside the page (06-conversation, mobile-web).', props: { platform: 'mobile', state: 'default' } },
  { name: 'Tablet', note: 'As mobile, at tablet width (06-conversation, tablet-web).', props: { platform: 'tablet', state: 'default' } },
  { name: 'Desktop', note: 'The masthead in the title block beside the page (06-conversation, desktop-web).', props: { platform: 'desktop', state: 'default' } },
  { name: 'Could not open this day', state: 'error', note: '#day-fetch-failed, mobile: the sheet holds a notice and a retry.', props: { platform: 'mobile', state: 'fetch-failed' } },
  { name: 'Nothing on this day, tablet', note: '#day-last-deleted, tablet: the generic state page.', props: { platform: 'tablet', state: 'last-deleted' } },
  { name: 'Could not open this day, desktop', note: '#day-fetch-failed, desktop: the title block.', props: { platform: 'desktop', state: 'fetch-failed' } },
  { name: 'loading', state: 'loading', note: '18-entry-system-states: #day-loading, the skeleton (v4 round 10).', props: { platform: 'mobile', state: 'loading' } },
  { name: 'without-note', note: '18-entry-system-states: #without-note.', props: { platform: 'mobile', state: 'without-note' } },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
