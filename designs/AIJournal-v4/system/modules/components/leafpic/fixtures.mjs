// The week of the approved design (explore booklet-feel f-mix, shared/week.js), as 02-timeline records it:
// 3 to 9 Aug, written on Mon 3, Thu 6 and Sun 9, recorded on Wed 5, Sat 8 and Sun 9. The long and non-Latin
// fixtures are stress tests, not product copy.
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOODS = ['even', null, 'low', 'low', null, 'good', 'even'];
const NAMES = ['Mon 3', 'Tue 4', 'Wed 5', 'Thu 6', 'Fri 7', 'Sat 8', 'Sun 9'];
const WORD = { even: 'Even', low: 'Low', good: 'Good' };
const week = DOW.map((dow, i) => ({ dow, ...(MOODS[i] ? { mood: MOODS[i], title: `${NAMES[i]}: ${WORD[MOODS[i]]}` } : {}) }));
const sleep = [5, 6, 8, 9];
const kept = DOW.map((dow, i) => ({ dow, written: [0, 3, 6].includes(i), recorded: [2, 5, 6].includes(i), title: NAMES[i] }));
const sofar = DOW.map((dow, i) => i < 3 ? { dow, day: 'before' } : i === 3 ? { dow, mood: 'low', today: true, title: 'Thu 6: Low' } : { dow, day: 'ahead' });
export default [
  { name: 'Week', note: 'The week leaf: the day letters over seven dots, a kept day in its mood.', props: { kind: 'week', days: week, say: 'Monday even, Wednesday low, Thursday low, Saturday good, Sunday even.', caption: 'Mon even · Wed low · Thu low · Sat good · Sun even' } },
  { name: 'Sleep days', note: 'What came up: the days it came up on, lit in their mood; the rest empty rings.', props: { kind: 'week', days: week.map((d, i) => sleep.includes(i + 3) ? d : { dow: d.dow }), say: 'Sleep on Wednesday, Thursday, Saturday, Sunday.', caption: 'Wed, Thu, Sat, Sun' } },
  { name: 'Week so far', note: 'A new account, opened on Thursday: before joining dashed, today ringed, still ahead dotted.', props: { kind: 'week', days: sofar, say: 'So far: Thursday low. Friday to Sunday are still ahead.' } },
  { name: 'Kept', note: 'What you kept: a pen and a microphone under each day, filled where kept.', props: { kind: 'kept', days: kept, say: 'Written on 3 days, recorded on 3.' } },
  { name: 'Recordings', note: 'Your recordings: a bar each, drawn to the longest, which is in full ink.', props: { kind: 'recordings', recs: [{ day: 'Wed', len: '11:47' }, { day: 'Sat', len: '5:08' }, { day: 'Sun', len: '2:41' }], say: '3 recordings: Wednesday 11:47, Saturday 5:08, Sunday 2:41.' } },
  { name: 'Weeks', note: 'Over the weeks: the three weeks before, then this one, labelled by date.', props: { kind: 'weeks', weeks: [{ label: '13 Jul', n: 1 }, { label: '20 Jul', n: 1 }, { label: '27 Jul', n: 1 }, { label: 'This week', n: 5, current: true }], say: '13 Jul: 1 day, 20 Jul: 1 day, 27 Jul: 1 day, This week: 5 days.' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long caption wraps under the picture.', props: { kind: 'week', days: week, say: 'A long sentence saying the whole week aloud, every day by name and by mood, for a screen reader.', caption: 'Monday even, Wednesday low and tired, Thursday low again, Saturday good after the walk, Sunday even' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese labels, not product copy.', props: { kind: 'weeks', weeks: [{ label: '13 июл', n: 1 }, { label: '20 июл', n: 2 }, { label: '7月27日', n: 1 }, { label: '今週', n: 5, current: true }], say: 'Четыре недели · 四週間' } },
  { name: 'Loading, week', state: 'loading', note: 'The week\'s dots in bone under the real letters, the caption a bone.', props: { kind: 'week', loading: true, caption: 'x', days: 'MTWTFSS'.split('').map(dow => ({ dow })) } },
  { name: 'Loading, kept', state: 'loading', note: 'The kept squares in bone.', props: { kind: 'kept', loading: true, days: 'MTWTFSS'.split('').map(dow => ({ dow })) } },
  { name: 'Loading, recordings', state: 'loading', note: 'A bar each in bone, at set shares.', props: { kind: 'recordings', loading: true, recs: [{}, {}, {}] } },
  { name: 'Loading, weeks', state: 'loading', note: 'The four columns in bone.', props: { kind: 'weeks', loading: true, weeks: [{}, {}, {}, {}] } },
];
