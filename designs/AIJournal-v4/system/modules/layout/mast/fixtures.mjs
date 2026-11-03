// Copy from the screens (01-today, 02-timeline, 10-settings-privacy, mobile-app 01-today). The
// children are the legacy .keybox, .back and .dest markup of those screens; they render
// unstyled on the catalogue page because those components are not modules yet. The long and
// non-Latin fixtures are stress tests, not product copy.
const keybox = '<div class="keybox" data-place="tool"><span class="k">Day</span><span class="v">Sun 9 Aug \'26</span></div>';
const back = '<a class="back" data-place="line" href="#">Today</a>';
const dest = '<nav class="dest" aria-label="Destinations"><a href="#" aria-current="page">Today</a><a href="#">Timeline</a><a href="#">Ask</a><a href="#">You</a></nav>';
export default [
  { name: 'Row', note: 'A destination at 390 and 834: the wordmark and the date box (01-today).', props: { wordmark: 'Journal' }, slots: { children: keybox } },
  { name: 'Pushed page', note: 'A pushed page: the back control on its own line above the wordmark (10-settings-privacy).', props: { wordmark: 'Privacy' }, slots: { back: back.replace('Today', 'You') } },
  { name: 'Title', note: 'The desktop title block: the wordmark, the date box and the destinations (desktop 01-today).', props: { form: 'title', wordmark: 'Journal' }, slots: { children: keybox + dest } },
  { name: 'Collapsed', note: 'iOS once the large title has scrolled away (mobile-app 01-today).', props: { collapsed: true, wordmark: 'Journal' }, slots: {} },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long page name on a pushed page.', props: { wordmark: 'Everything this journal keeps about you and your recordings', }, slots: { back, children: keybox } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { wordmark: 'Журнал 日記' }, slots: { children: keybox } },
];
