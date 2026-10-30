// Copy from the screens (the composer's commit control reads "Save"). The long and non-Latin
// fixtures are stress tests, not product copy.
export default [
  { name: 'Default', note: 'As in the composer while the field holds content.', props: { label: 'Save' } },
  { name: 'Unlabelled', note: "11-states' draft: no aria-label, the word names it.", props: { label: 'Save', aria: false } },
  { name: 'Hover', state: 'hover', note: 'Fills --block.', props: { label: 'Save' } },
  { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base).', props: { label: 'Save' } },
  { name: 'Active', state: 'active', note: 'Pressed 1px down, and scaled .97 under the shell.', props: { label: 'Save' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { label: 'Save this entry to your journal' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { label: 'Сохранить · 保存' } },
];
