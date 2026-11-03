// The week of the approved design (explore overview-single-line c-fade-chevron): 3 to 9 Aug, its line from the
// reflection (C3), and the new account's first-week line for Today. Links point into the prototype, as the screens'
// do. The long, names and non-Latin fixtures are stress tests, not product copy.
const week = { dates: '3 to 9 Aug', href: '00-prototype.html#reflections', reflection: '2026-08-03' };
export default [
  { name: 'Default', state: 'default', note: 'The week\'s line and the chevron after it, ruled off below (01-today).', props: { ...week, line: 'Five days here, and sleep on your mind.' } },
  { name: 'First week', note: 'A new account before its first reflection: Today\'s first-week line, opening the week so far.', props: { first: true, href: '00-prototype.html#reflections-empty', line: 'Your first reflection comes on Sunday.' } },
  { name: 'One word', tags: ['long'], note: 'Stress test only: the chevron right after a one-word line.', props: { ...week, line: 'Quiet.' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a line longer than a phone\'s row fades into the chevron (with the script; an ellipsis without).', props: { ...week, line: 'Five days here, sleep on your mind for most of them, and the flat viewing on Tuesday never far from it.' } },
  { name: 'Names', tags: ['long'], note: 'Stress test only: long names with diacritics, as a reflection can name people.', props: { ...week, line: 'Aleksandra Wiśniewska-Kowalczyk’s birthday, and Bartholomew’s news.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { ...week, line: 'Сон упоминался четыре раза. 睡眠が四回。' } },
  { name: 'Hover', state: 'hover', note: 'The chevron leans 4px and the underline turns solid under a mouse; drawn at rest here, hover it to see.', props: { ...week, line: 'Five days here, and sleep on your mind.' } },
  { name: 'Focus', state: 'focus-visible', note: 'Keyboard focus: the product\'s ring, the lean and the solid underline; tab to it to see.', props: { ...week, line: 'Five days here, and sleep on your mind.' } },
  { name: 'New reflection', state: 'active', note: 'The first showing of a reflection nudges the chevron once (live, with the script; once per reflection).', props: { ...week, line: 'Five days here, and sleep on your mind.' } },
];
