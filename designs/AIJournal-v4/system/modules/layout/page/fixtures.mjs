// Children are the legacy masthead and the screens' own copy (01-today, 02-timeline); they render
// without their component styling on the catalogue page because those are not modules yet. The
// page paints the graph, so every fixture shows ruled paper. The split layout only applies from
// a desktop-width shell (1200), so it reads as a single column here.
const mast = '<header class="mast"><h1 class="wordmark">Journal</h1></header>';
const record = '<section class="sheet"><p>Today</p></section>';
const index = '<aside class="cal"><p>Timeline</p></aside>';
export default [
  { name: 'Default', note: 'The graph page every screen is written on (01-today).', props: {}, slots: { children: mast + record } },
  { name: 'Pushed', note: 'A pushed page: the back control and the title head it, so the lead at 1200 includes both (10-settings-privacy).', props: { head: 'pushed' }, slots: { children: mast + record } },
  { name: 'Untitled', note: 'A pushed page headed by the back control alone (17-account-data).', props: { head: 'untitled' }, slots: { children: record } },
  { name: 'Bare', note: 'No masthead: the first object starts at the top (the walkthrough index).', props: { head: 'bare' }, slots: { children: record } },
  { name: 'Scrolled', note: 'iOS only: the screen scrolled, its large title gone; the record moves up by the overflow its comp sets (mobile-app 01-today, second device). Drawn as the default page here.', props: { scrolled: true }, slots: { children: mast + record } },
  { name: 'Split', note: 'From 1200: the record and a 340px second column, here the Timeline index (02-timeline). A single column below that width.', props: { layout: 'split' }, slots: { children: mast + record + index } },
];
