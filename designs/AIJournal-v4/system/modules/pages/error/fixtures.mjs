// The error pages (18-entry-system-states).
export default [
  { name: 'Not found', state: 'error', note: '#not-found, mobile.', props: { platform: 'mobile', state: 'not-found' } },
  { name: 'Server error, tablet', state: 'error', note: '#server-error, tablet.', props: { platform: 'tablet', state: 'server-error' } },
  { name: 'Not found, desktop', note: '#not-found, desktop: the title block.', props: { platform: 'desktop', state: 'not-found' } },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'not-found', context: 'walkthrough' } },
];
