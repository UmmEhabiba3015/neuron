// Copy from 16-flow-states and 11-states. The help and copy lines keep the shared legacy classes,
// as on the screens. The long and non-Latin fixtures are stress tests.
export default ({ html, use }) => [
  { name: 'Failure', state: 'default', note: 'A failure with its action (16-flow-states).', props: { tag: 'div', text: 'We could not reach the server.' }, slots: { children: html`<p class="auth-help">We could not reach the server. Try loading this day again.</p>${use('cluster', { place: 'actions' }, { children: html`${use('button', { grade: 'solid', href: '#day', label: 'Try again' })}` })}` } },
  { name: 'Line', note: 'A single line (11-states).', props: { tag: 'p', text: 'No entries match those words.' }, slots: {} },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { tag: 'p', text: 'A very long state line that explains at length why nothing could be loaded and what the person can do about it next.' }, slots: {} },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { tag: 'p', text: 'Ничего не найдено. 見つかりません。' }, slots: {} },
  { name: 'Line', note: 'The text module’s help line with this section’s class mixed in, announced (18-entry-system-states: entry-edit-failed).', props: { tag: 'line', text: 'Changes were not saved. We could not reach the server.' } },
];
