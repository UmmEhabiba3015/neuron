// Copy from the screens (01-today, 05-reflection). The long and non-Latin fixtures are stress
// tests, not product copy.
export default ({ html, use }) => {
  const note = 'You wrote something close to this in March, about the job.';
  let n = 0;
  const cite = () => html`${use('button', { grade: 'cite', href: '#', label: 'March 2026' })}${use('thumbs', { id: `said-${++n}`, form: 'pair' })}`;
  const label = 'From your record';
  return [
    { name: 'Default', note: 'Shut: the label column and the summary (01-today).', props: { label, note, open: false }, slots: { foot: cite() } },
    { name: 'Expanded', note: 'Shut form, its details open (11-states: the note, opened).', props: { label, note, open: false, expanded: true }, slots: { foot: cite() } },
    { name: 'Open', note: 'The static comps\' open state, with the citation and the thumbs (05-reflection).', props: { label, note, open: true }, slots: { foot: cite() } },
    { name: 'Open, no foot', note: 'A note without evidence to cite (05-reflection).', props: { label, note: 'You wrote on three of the seven days, and recorded on three.', open: true }, slots: {} },
    { name: 'Hover', state: 'hover', note: 'The summary turns --block.', props: { label, note, open: false }, slots: { foot: cite() } },
    { name: 'Focus', state: 'focus-visible', note: 'The product focus ring on the summary.', props: { label, note, open: false }, slots: { foot: cite() } },
    { name: 'Active', state: 'active', note: 'The summary presses 1px down.', props: { label, note, open: false }, slots: { foot: cite() } },
    { name: 'Selected', state: 'selected', note: 'Open: the label rolls, the chevron turns, the note shows.', props: { label, note, open: true }, slots: { foot: cite() } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long note.', props: { label, note: note + ' ' + note + ' ' + note + ' Is it the sleep you are writing about, or the hour you are writing at?', open: true }, slots: { foot: cite() } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { label: 'Из вашей записи · 記録より', note: 'Вы писали нечто похожее в марте. 三月にも似たことを書いていました。', open: true }, slots: { foot: cite() } },
  ];
};
