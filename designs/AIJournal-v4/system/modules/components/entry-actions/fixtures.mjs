// Copy from the screens (Today and the entry states: Edit entry, Delete entry, Out of memory, Use in
// memory). The icon buttons are button modules (use), as on the screen. The long and
// non-Latin fixtures are stress tests, not product copy.
const LINE = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const PENCIL = `<svg ${LINE}><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>`;
const BIN = `<svg ${LINE}><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>`;
export default ({ html, raw, use }) => {
  const edit = use('button', { grade: 'quiet', form: 'icon', href: '00-prototype.html#entry-edit', label: 'Edit entry' }, { icon: raw(PENCIL) });
  const del = (label, href) => use('button', { grade: 'quiet', form: 'icon', href, label }, { icon: raw(BIN) });
  const written = html`${edit}${del('Delete entry', '00-prototype.html#entry-delete-confirm')}`;
  const recording = html`${del('Delete voice memo', '00-prototype.html#recording-delete-confirm')}`;
  const editorBody = (value, label = 'Entry text') => html`<label>${label}${use('field', { tag: 'textarea', form: 'editor', label, value, place: 'fill' })}</label>${use('cluster', { place: 'actions' }, { children: html`${use('button', { grade: 'solid', label: 'Save changes' })}${use('button', { grade: 'quiet', href: '00-prototype.html#today', label: 'Leave as it was' })}` })}`;
  const confirmButtons = (go, keep) => html`${use('button', { grade: 'quiet', href: '00-prototype.html#entry-deleted', label: go })}${use('button', { grade: 'solid', href: '00-prototype.html#today', label: keep })}`;
  const q = 'Delete this entry? This cannot be undone.';
  return [
    { name: 'Tools', note: 'An entry in memory: edit and delete only (revealed here; on the screen they fade in with the row). Memory is one way, so nothing says In memory.', props: { form: 'tools', excluded: false, kind: 'written' }, slots: { children: written } },
    { name: 'Out of memory', note: 'An entry kept out of memory: the quiet dropdown, always shown (not faded with the tools).', props: { form: 'tools', excluded: true, kind: 'written' }, slots: { children: written } },
    { name: 'Recording', note: 'A voice memo: no edit tool.', props: { form: 'tools', excluded: false, kind: 'recording' }, slots: { children: recording } },
    { name: 'Recording out of memory', note: 'A voice memo kept out of memory.', props: { form: 'tools', excluded: true, kind: 'recording' }, slots: { children: recording } },
    { name: 'Hover', state: 'hover', note: 'On pointer devices the tools fade in while the row is hovered (the row sets it); the dropdown stays.', props: { form: 'tools', excluded: true, kind: 'written' }, slots: { children: written } },
    { name: 'Open', state: 'selected', note: 'The dropdown open (details[open]): the chevron turns; its menu holds Use in memory.', props: { form: 'tools', excluded: true, kind: 'written' }, slots: { children: written } },
    { name: 'Focus', state: 'focus-visible', note: 'Focus inside the row shows them at once; the product focus ring (base).', props: { form: 'tools', excluded: false, kind: 'written' }, slots: { children: written } },
    { name: 'Editor', note: 'The inline editing form.', props: { form: 'editor' }, slots: { children: editorBody('Walked to the market before work, and the light was good.') } },
    { name: 'Confirm', note: 'The delete confirmation.', props: { form: 'confirm', text: q }, slots: { children: confirmButtons('Delete entry', 'Keep entry') } },
    { name: 'Confirm memory', note: 'Use in memory asks once: it cannot be undone.', props: { form: 'confirm', text: 'Use this entry in memory? Once it is in, it cannot be taken out.' }, slots: { children: html`${use('button', { grade: 'quiet', href: '00-prototype.html#entry-memory-return', label: 'Use in memory' })}${use('button', { grade: 'solid', href: '00-prototype.html#today', label: 'Keep it out' })}` } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long editor text and a long confirmation.', props: { form: 'confirm', text: q + ' Everything written in it, including the notes you added afterwards and the memory it feeds, goes with it.' }, slots: { children: confirmButtons('Delete entry', 'Keep entry') } },
    { name: 'Long label', tags: ['long'], note: 'Stress test only: a long memory label wraps in the trigger.', props: { form: 'tools', excluded: true, kind: 'written', memoryLabel: 'Out of memory, kept out of everything the journal remembers and answers from' }, slots: { children: written } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { form: 'tools', excluded: true, kind: 'written', memoryLabel: 'Вне памяти · 記憶の外' }, slots: { children: written } },
  ];
};
