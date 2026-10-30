// Copy from the screens (01-today, the entry memory menu). The long and non-Latin fixtures are
// stress tests, not product copy.
const LABEL = 'Keep this out of memory';
export default [
  { name: 'Compact', note: 'The entry memory menu\'s option (the user-requested compact memory control): --t-memory, a 12px tick.', props: { label: 'Use in memory', pressed: true, form: 'compact' } },
  { name: 'Default', note: 'Not pressed, as in the composer.', props: { label: LABEL, pressed: false } },
  { name: 'Pressed', state: 'selected', note: 'The tick is filled --rule.', props: { label: LABEL, pressed: true } },
  { name: 'Hover', state: 'hover', note: 'The label turns --rule.', props: { label: LABEL, pressed: false } },
  { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base).', props: { label: LABEL, pressed: false } },
  { name: 'Active', state: 'active', note: 'Pressed 1px down, and scaled .97 under the shell.', props: { label: LABEL, pressed: false } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { label: 'Keep this entry out of everything the journal remembers and answers from, including the weekly look back', pressed: false } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { label: 'Не сохранять в памяти · 記憶に残さない', pressed: false } },
];
