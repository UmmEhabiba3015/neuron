// Copy from Timeline's card (02-timeline). The long and non-Latin fixtures are stress tests, not product copy.
// June 14 to August 9 2026, from the journal of Timeline (explore timeline-jump-arrival, DAYS).
const MOODS = {
  '2026-08-09': 'even', '2026-08-08': 'good', '2026-08-06': 'low', '2026-08-05': 'low', '2026-08-03': 'even', '2026-08-01': 'light',
  '2026-07-21': 'good', '2026-07-17': 'even', '2026-07-12': 'good', '2026-07-08': 'low', '2026-07-03': 'even',
  '2026-06-28': 'light', '2026-06-21': 'hard', '2026-06-14': 'even',
};
const EN = { weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], moods: { light: 'Light', good: 'Good', even: 'Even', low: 'Low', hard: 'Hard' }, label: (wd, d, mo, mood) => `${wd} ${d} ${mo}, ${mood}. Go to this day` };
EN.inflected = EN.months;
const RU = { weekdays: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'], months: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'], inflected: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'], moods: { light: 'легко', good: 'хорошо', even: 'ровно', low: 'тяжело', hard: 'очень тяжело' }, label: (wd, d, mo, mood) => `${wd}, ${d} ${mo}, ${mood}. Перейти к этому дню` };
const pad2 = (n) => String(n).padStart(2, '0');
// one month of the wheel: Monday first, whole weeks, out-of-month cells blank
function month(year, m, { current = '', lang = EN, longLabel = '', empty = false } = {}) {
  const value = `${year}-${pad2(m + 1)}`;
  const lead = (new Date(Date.UTC(year, m, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => ({ n: i, out: true }));
  for (let n = 1; n <= count; n++) {
    const iso = `${value}-${pad2(n)}`;
    const mood = MOODS[iso];
    const wd = lang.weekdays[new Date(Date.UTC(year, m, n)).getUTCDay()];
    cells[lead + n - 1] = mood && !empty
      ? { n, href: `#d-${iso}`, mood, current: iso === current, label: lang.label(wd, n, lang.inflected[m], lang.moods[mood]) + longLabel }
      : { n };
  }
  const name = lang.months[m];
  return { value, short: name.slice(0, 3), year: String(year), name: `${name[0].toUpperCase()}${name.slice(1)} ${year}`, days: cells, ...(empty ? { empty: true } : {}) };
}
const wheelMonths = (opts) => [5, 6, 7].map((m) => month(2026, m, opts));
const wheelProps = (months, selected, extra = {}) => ({ month: 'Month and year', months, selected, ...extra });
export default [
  { name: 'Wheel', note: "Timeline's date and mood card: months in a wheel, one month's days beside it, the day in view ringed (Sun 9 Aug).", props: wheelProps(wheelMonths({ current: '2026-08-09' }), '2026-08') },
  { name: 'Wheel, July', state: 'selected', note: 'July chosen: its days show, no day in view in this month.', props: wheelProps(wheelMonths({ current: '2026-08-09' }), '2026-07') },
  { name: 'Wheel, empty month', state: 'empty', note: 'May has nothing written: plain numbers and the note under the grid.', props: wheelProps([month(2026, 4, { empty: true }), ...wheelMonths({ current: '2026-08-09' })], '2026-05') },
  { name: 'Wheel, pressed', state: 'active', note: 'A day written pressed: it moves 1px down; press a day to see it.', props: wheelProps(wheelMonths({ current: '2026-08-09' }), '2026-08') },
  { name: 'Wheel focus', state: 'focus-visible', note: 'The product focus ring (base) on a month or a day; tab into the wheel to see it.', props: wheelProps(wheelMonths({ current: '2026-08-09' }), '2026-08') },
  { name: 'Wheel, long', tags: ['long'], note: 'Stress test only: a long listbox name and long day labels.', props: wheelProps(wheelMonths({ current: '2026-08-09', longLabel: ', with a very long title that goes on and on' }), '2026-08', { month: 'Month and year of everything kept in the journal, long recordings and short notes alike' }) },
  { name: 'Wheel, non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian, not product copy.', props: wheelProps(wheelMonths({ current: '2026-08-09', lang: RU }), '2026-08', { month: 'Месяц и год' }) },
];
