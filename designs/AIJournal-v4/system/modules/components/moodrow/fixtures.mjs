// Copy from the screens (01-today: "Today felt"; the conversation: "Day felt"). The long and
// non-Latin fixtures are stress tests, not product copy.
export default [
  { name: 'Plain', note: 'The plain form: a handwritten heading over five keyline chips.', props: { form: 'plain', label: 'Day felt', selected: 'none' } },
  { name: 'Ruled', note: 'The writing companion: the label in the time column.', props: { form: 'ruled', label: 'Today felt', selected: 'none' } },
  { name: 'Light', note: 'Light is saved.', props: { form: 'ruled', label: 'Today felt', selected: 'light' } },
  { name: 'Good', note: 'Good is saved.', props: { form: 'ruled', label: 'Today felt', selected: 'good' } },
  { name: 'Even', note: 'Even is saved.', props: { form: 'ruled', label: 'Today felt', selected: 'even' } },
  { name: 'Low', note: 'Low is saved.', props: { form: 'ruled', label: 'Today felt', selected: 'low' } },
  { name: 'Hard', note: 'Hard is saved.', props: { form: 'ruled', label: 'Today felt', selected: 'hard' } },
  { name: 'None', note: 'No mood chosen, all five unpressed.', state: 'empty', props: { form: 'ruled', label: 'Today felt', selected: 'none' } },
  { name: 'Plain, saved', note: 'The plain form with a saved mood: filled --rule.', state: 'selected', props: { form: 'plain', label: 'Day felt', selected: 'good' } },
  { name: 'Hover', note: 'Ruled: the word takes its mood tone and surface.', state: 'hover', props: { form: 'ruled', label: 'Today felt', selected: 'none' } },
  { name: 'Focus', note: 'Ruled: as pressed, plus the product focus ring (base).', state: 'focus-visible', props: { form: 'ruled', label: 'Today felt', selected: 'none' } },
  { name: 'Pressing', note: 'Plain: 1px down and .97; ruled: tone and surface at once.', state: 'active', props: { form: 'plain', label: 'Day felt', selected: 'none' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { form: 'ruled', label: 'How the whole of this long and tiring day felt to me', selected: 'good' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { form: 'ruled', label: 'Сегодня было · 今日は', selected: 'even' } },
];
