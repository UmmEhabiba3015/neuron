// Copy from the screens (the pushed pages go back to "You" and "Today"). The long and non-Latin
// fixtures are stress tests, not product copy.
export default [
  { name: 'Default', note: 'As on the pushed pages.', props: { label: 'You', href: '00-prototype.html#today' } },
  { name: 'Hover', state: 'hover', note: 'The text and chevron turn --block.', props: { label: 'Today', href: '00-prototype.html#today' } },
  { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base).', props: { label: 'Today', href: '00-prototype.html#today' } },
  { name: 'Active', state: 'active', note: 'Pressed 1px down.', props: { label: 'Today', href: '00-prototype.html#today' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { label: 'Back to your journal entries from last month', href: '#' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { label: 'Назад к записям · 戻る', href: '#' } },
];
