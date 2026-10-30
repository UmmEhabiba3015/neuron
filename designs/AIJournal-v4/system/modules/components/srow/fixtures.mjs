// Copy from the screens (01-today and the motion index). The entry actions are built as the
// entry-actions fixtures build them. The long and non-Latin fixtures are stress tests, not
// product copy.
const LINE = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const PENCIL = `<svg ${LINE}><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>`;
const BIN = `<svg ${LINE}><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>`;
export default ({ html, raw, use }) => {
  // the screens' entry actions carry their legacy class (.entry-actions), which the gutter reads
  const withClass = (x) => raw(x.text.replace('class="aj-c-entry-actions"', 'class="aj-c-entry-actions entry-actions"'));
  const icons = () => html`${use('button', { grade: 'quiet', form: 'icon', href: '00-prototype.html#entry-edit', label: 'Edit entry' }, { icon: raw(PENCIL) })}${use('button', { grade: 'quiet', form: 'icon', href: '00-prototype.html#entry-delete-confirm', label: 'Delete entry' }, { icon: raw(BIN) })}`;
  const tools = withClass(use('entry-actions', { place: 'tools', form: 'tools', excluded: false, kind: 'written', memoryLabel: 'In memory' }, { children: icons() }));
  const toolsOut = withClass(use('entry-actions', { place: 'tools', form: 'tools', excluded: true, kind: 'written', memoryLabel: 'Out of memory' }, { children: icons() }));
  const entry = (text) => html`<p class="prose">${text}</p>${tools}`;
  const flat = "The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday. That lasted about an hour.";
  return [
    { name: 'Entry', note: 'A row with its time and entry actions (01-today).', props: { time: '09:20', datetime: '2026-08-09T09:20' }, slots: { children: entry(flat) } },
    { name: 'Out of memory', note: 'The entry kept out of memory, with its mark (01-today).', props: { time: '21:40' }, slots: { children: html`<p class="prose">Priya rang. We talked for an hour about nothing.</p>${toolsOut}${use('mark', { glyph: 'lock', label: 'Private, out of memory' })}` } },
    { name: 'Index', note: 'Without the time column (the motion index): a section head and a link.', props: {}, slots: { children: html`${use('shead', { level: 2, text: 'Start here' })}<p>${use('button', { grade: 'cite', label: 'Interactive motion design system', href: 'design%20system/index.html#motion' })}</p>` } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long entry.', props: { time: '09:20', datetime: '2026-08-09T09:20' }, slots: { children: entry(flat + ' ' + flat + ' Unbreakablewordunbreakablewordunbreakablewordunbreakablewordunbreakablewordunbreakableword') } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { time: '09:20', datetime: '2026-08-09T09:20' }, slots: { children: entry('Соседи сказали «во вторник», а сегодня воскресенье. 火曜日まで考えないことにしました。') } },
  { name: 'Bare time', note: 'The time as text in its column (18-entry-system-states: the generic state pages’ entry rows).', props: { time: '09:20', bareTime: true }, slots: { children: '<p class="prose">The flat people said Tuesday.</p>' } },
];
};
