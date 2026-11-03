// Copy from 02-timeline (system/modules/pages/timeline/data.mjs), the first days of August, with each day's mood
// from the approved design (explore timeline-jump-arrival). The long and non-Latin fixtures are stress tests.
const MOODS = { '2026-08-09': 'even', '2026-08-08': 'good', '2026-08-06': 'low', '2026-08-05': 'low', '2026-08-03': 'even', '2026-08-01': 'light' };
const rec = (date, datetime, play, duration, extra = {}) => ({ kind: 'recording', date, datetime, play, duration, transcript: 'Voice memo', excluded: false, ...extra });
const ITEMS = [
  { kind: 'month', text: 'August 2026' },
  { kind: 'day', date: 'Sun 9', datetime: '2026-08-09', text: "The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday.", id: 'd-2026-08-09' },
  rec('', '', 'Play recording from Sunday 9 August, 2 minutes 41 seconds', '2:41'),
  { kind: 'day', date: '', datetime: '', text: "Priya rang. We talked for an hour about nothing. I'd forgotten that's a thing you can do.", mark: 'Private, out of memory' },
  rec('Sat 8', '2026-08-08', 'Play recording from Saturday 8 August, 5 minutes 8 seconds', '5:08', { id: 'd-2026-08-08' }),
  { kind: 'day', date: 'Thu 6', datetime: '2026-08-06', text: "Slept badly again. I've stopped counting which night this is.", id: 'd-2026-08-06' },
  rec('Wed 5', '2026-08-05', 'Play recording from Wednesday 5 August, 11 minutes 47 seconds', '11:47', { id: 'd-2026-08-05' }),
  { kind: 'day', date: 'Mon 3', datetime: '2026-08-03', text: 'Went in early to avoid the heat. Nobody else in the office until ten.', id: 'd-2026-08-03' },
  { kind: 'day', date: 'Sat 1', datetime: '2026-08-01', text: 'Bank holiday. Did nothing on purpose and it took most of the day to stop feeling odd about it.', id: 'd-2026-08-01' },
  rec('', '', 'Play recording from Saturday 1 August, 3 minutes 26 seconds', '3:26', { excluded: true }),
];
const base = { items: ITEMS, moods: MOODS };
// A keyword search for "slept": the one day that matches, its word marked.
const found = { ...base, items: [ITEMS[0], ITEMS[5]], marks: ['slept'] };

export default [
  { name: 'Record', state: 'default', note: 'The list as the old design draws it: the month, a day\'s writing, a recording and its transcript row with its tools, the private mark.', props: base },
  { name: 'Arrived', state: 'selected', note: 'A jump to Saturday 1 August (data-jump): the list scrolls to it, the wash passes through both rows, the frame is drawn and held with the date in Light. Drawn by record.js, so only where a script runs.', props: { ...base, arrive: '2026-08-01' } },
  { name: 'Search results', note: 'The page passes the days that match and the words found: "slept", marked.', props: found },
  { name: 'No matches', state: 'empty', note: 'A keyword search that matched nothing: Ask\'s own explanation in place of the rows.', props: { ...base, message: { heading: 'No entries match those words', text: 'Search looks for the words you type. Nothing you have written uses these ones.' } } },
  { name: 'No matches, by meaning', note: 'A search by meaning that matched nothing.', props: { ...base, message: { heading: 'No entries are about that', text: 'By meaning, search looks for what an entry is about, in any words. Nothing you have written comes close.' } } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { ...base, items: [ITEMS[0], { ...ITEMS[1], text: 'Have I felt like this before? The week the flat people said Tuesday, and the week before that, and the long one in June when nothing would settle and every evening went the same way, slowly, into the small hours.' }] } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese.', props: { ...base, items: [{ kind: 'month', text: 'Август 2026 · 2026年8月' }, { ...ITEMS[1], date: 'Вс 9', text: 'Лебеди снова у моста. 白鳥がまた橋のそばにいた。' }] } },
];
