// Reflections on each platform and in each state (05-reflection). The catalogue draws a page at the
// catalogue's width, so the desktop fixture shows the title block's markup, not the desktop stage.
export default [
  { name: 'Mobile', note: 'The destination: the week\'s booklet on its first leaf, then Earlier weeks (05-reflection, mobile-web).', props: { platform: 'mobile', state: 'list' } },
  { name: 'Tablet', note: 'As mobile, at tablet width (05-reflection, tablet-web).', props: { platform: 'tablet', state: 'list' } },
  { name: 'Desktop', note: 'The masthead in the title block beside the page (05-reflection, desktop-web).', props: { platform: 'desktop', state: 'list' } },
  { name: 'Week', note: 'An earlier week on its pushed page, back to Reflections; the weeks before it below.', props: { platform: 'mobile', state: 'week' } },
  { name: 'First', note: 'The first reflection: no trend, a Next week leaf, no earlier weeks.', props: { platform: 'mobile', state: 'first' } },
  { name: 'Empty', state: 'empty', note: 'A new account on Thursday: the week so far, one leaf.', props: { platform: 'mobile', state: 'empty' } },
  { name: 'Rated', note: 'What came up, its thumbs down pressed: the booklet opens on its leaf, the form open from the thumbs.', props: { platform: 'mobile', state: 'rated' } },
  { name: 'Loading', state: 'loading', note: '18-entry-system-states: #reflections-loading, the booklet and earlier weeks in bones (v4 round 10).', props: { platform: 'desktop', state: 'loading' } },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'list', context: 'walkthrough' } },
];
