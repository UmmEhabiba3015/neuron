// Copy from the screens (02-timeline). The long and non-Latin fixtures are stress tests, not
// product copy.
export default ({ html }) => [
  { name: 'Default', note: 'A day with its lede (02-timeline).', props: { date: 'Sun 9', datetime: '2026-08-09' }, slots: { children: html`<p class="lede">The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday.</p>` } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long lede.', props: { date: 'Sun 9', datetime: '2026-08-09' }, slots: { children: html`<p class="lede">The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday. The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday, and then to think about it a great deal more than I meant to.</p>` } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { date: 'Вс 9 · 日', datetime: '2026-08-09' }, slots: { children: html`<p class="lede">Соседи сказали «во вторник», а сегодня воскресенье. 火曜日まで考えないことにしました。</p>` } },
];
