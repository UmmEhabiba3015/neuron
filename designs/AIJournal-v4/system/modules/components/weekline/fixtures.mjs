// The earlier weeks of the approved design (explore booklet-feel f-mix, the copy of DESIGN.md 2026-10-28), as
// 02-timeline records them. Every week opens the one week fixture, as every day opens #day. The long and
// non-Latin fixtures are stress tests, not product copy.
const href = '00-prototype.html#reflection';
const weeks = [
  { month: 'July', dates: '27 Jul to 2 Aug', line: 'A bank holiday, done on purpose.', href },
  { month: 'July', dates: '20 to 26 Jul', line: 'The flat viewing.', href },
  { month: 'July', dates: '13 to 19 Jul', line: 'The last day before the shutdown.', href },
];
const base = { heading: 'Earlier weeks', since: 'Since March 2026' };
export default [
  { name: 'Default', note: 'Under the booklet: the line, a ring for the month, a dot per week; each row opens that week.', props: { ...base, weeks } },
  { name: 'Two months', note: 'A week sits under the month it starts in; each month is drawn once. The two further lines are the explorations\' proposals.', props: { ...base, weeks: [...weeks, { month: 'July', dates: '6 to 12 Jul', line: 'A low Wednesday, then the canal walk.', href }, { month: 'June', dates: '29 Jun to 5 Jul', line: 'The dentist, and the long way home.', href }] } },
  { name: 'Hover', state: 'hover', note: 'With a mouse, a week\'s line underlines.', props: { ...base, weeks } },
  { name: 'Focus', state: 'focus-visible', note: 'A week\'s row takes the product\'s ring.', props: { ...base, weeks } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { ...base, weeks: [{ month: 'September', dates: '28 Sep to 4 Oct', line: 'A very long line for one week, which wraps under its dates and keeps the dot on the line beside the first of them.', href }] } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { heading: 'Прошлые недели', since: '2026年3月から', weeks: [{ month: 'Июль', dates: '27 июл – 2 авг', line: '休日を、わざと何もせずに。', href }] } },
];
