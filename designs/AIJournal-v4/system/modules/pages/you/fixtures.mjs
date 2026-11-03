// The You page on each platform (07-you). The catalogue draws a page at its own width.
export default [
  { name: 'Mobile', note: 'The header section inside the page (07-you, mobile-web).', props: { platform: 'mobile', state: 'default' } },
  { name: 'Tablet', note: 'As mobile, at tablet width (07-you, tablet-web).', props: { platform: 'tablet', state: 'default' } },
  { name: 'Desktop', note: 'The masthead and destinations in the title block beside the page (07-you, desktop-web).', props: { platform: 'desktop', state: 'default' } },
  { name: 'loading', state: 'loading', note: '18-entry-system-states: #you-loading, the skeleton (v4 round 10).', props: { platform: 'mobile', state: 'loading' } },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
