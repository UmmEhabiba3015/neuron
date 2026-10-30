// The journal of the approved design (explore timeline-jump-arrival, shared/timeline.js): the week of 3 to 9
// August 2026, Sunday 9 in view. The long and non-Latin fixtures are stress tests, not product copy.
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const week = (monday, moods, month = 'August', mon = 'Aug', future = 0) => moods.map((mood, i) => {
  const n = Number(monday.slice(8)) + i, date = `${monday.slice(0, 8)}${String(n).padStart(2, '0')}`;
  return { date, ...(mood ? { mood, has: true } : {}), ...(i >= 7 - future ? { future: true } : {}), name: `${NAMES[i]} ${n} ${month}`, short: `${SHORT[i]} ${n} ${mon}` };
});
// Mon 3 Even, Wed 5 Low, Thu 6 Low, Sat 8 Good, Sun 9 Even; carried in from Sat 1 August (Light), nothing after.
const aug = week('2026-08-03', ['even', null, 'low', 'low', null, 'good', 'even']);
const base = { week: '2026-08-03', label: '3 to 9 Aug', days: aug, before: { date: '2026-08-01', mood: 'light' }, current: '2026-08-09' };
export default [
  { name: 'Week', note: 'This week on the Timeline: the curve, carried in from Saturday 1 August; the ground Even (Even, Low, Low, Good, Even averages 2.8).', props: base },
  { name: 'Day in view', state: 'selected', note: 'The day in view (Wednesday 5) ringed --ink.', props: { ...base, current: '2026-08-05' } },
  { name: 'Point focus', state: 'focus-visible', note: 'Tab to a point: the product focus ring and the day and mood above it.', props: base },
  { name: 'Point hover', state: 'hover', note: 'Hover a point: the ring on the dot and the day and mood above it.', props: base },
  { name: 'Tie, more days above', note: 'Rule demonstration, not the journal: Good, Good, Hard, Light averages 3.5; three days above and one below: Good.', props: { week: '2026-06-22', label: '22 to 28 Jun', days: week('2026-06-22', ['good', null, 'good', null, 'hard', null, 'light'], 'June', 'Jun') } },
  { name: 'Tie, the latest day', note: 'Rule demonstration, not the journal: Good then Even averages 3.5, one day each side; the latest is Even: Even.', props: { week: '2026-07-13', label: '13 to 19 Jul', days: week('2026-07-13', [null, 'good', null, null, 'even', null, null], 'July', 'Jul') } },
  { name: 'One day', note: 'One day written: a straight line at its mood across the week (Sunday 14 June, Even).', props: { week: '2026-06-08', label: '8 to 14 Jun', days: week('2026-06-08', [null, null, null, null, null, null, 'even'], 'June', 'Jun'), after: { date: '2026-06-21', mood: 'hard' } } },
  { name: 'Empty week', state: 'empty', note: 'Nothing written this week: the scale and the days, no curve and no ground. This week is always shown.', props: { week: '2026-08-10', label: '10 to 16 Aug', days: week('2026-08-10', [null, null, null, null, null, null, null], 'August', 'Aug', 6) } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long week name and long day names.', props: { ...base, label: '3 to 9 August 2026, the week of the flat viewing and the bank holiday', days: aug.map(d => ({ ...d, name: d.name + ', a day with a very long name that goes on', short: d.short + ', a long tip' })) } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian day names, not product copy.', props: { ...base, label: '3–9 августа', days: aug.map((d, i) => ({ ...d, name: `${3 + i} августа`, short: `${3 + i} авг` })) } },
];
