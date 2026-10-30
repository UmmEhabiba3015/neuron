// Copy from the screens (01-today, 02-timeline, 18-entry-system-states) and the walkthrough
// runtime, which adds a mark with no glyph. The long and non-Latin fixtures are stress tests,
// not product copy.
export default [
  { name: 'Lock', note: 'As on the designed screens (01-today, 02-timeline, 18-entry-system-states).', props: { glyph: 'lock', label: 'Private, out of memory' } },
  { name: 'No glyph', note: 'As the walkthrough runtime adds it.', props: { glyph: 'none', label: 'Out of memory' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { label: 'Private, out of memory, and not read by the assistant in any answer or reflection' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { label: 'Личное, вне памяти · 非公開、記憶の外' } },
];
