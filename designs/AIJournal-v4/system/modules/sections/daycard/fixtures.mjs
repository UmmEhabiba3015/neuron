// The journal of the approved design (explore timeline-jump-arrival, shared/timeline.js): today Sunday 9 August
// 2026, the days written from 14 June. The long and non-Latin fixtures are stress tests, not product copy.
import { weeksOf, monthsOf, keyDate, longDate } from '../../../content/journal-days.mjs';

const TODAY = '2026-08-09';
const DAYS = [
  ['2026-08-09', 'even'], ['2026-08-08', 'good'], ['2026-08-06', 'low'], ['2026-08-05', 'low'], ['2026-08-03', 'even'],
  ['2026-08-01', 'light'], ['2026-07-21', 'good'], ['2026-07-17', 'even'], ['2026-07-12', 'good'], ['2026-07-08', 'low'],
  ['2026-07-03', 'even'], ['2026-06-28', 'light'], ['2026-06-21', 'hard'], ['2026-06-14', 'even'],
].map(([date, mood]) => ({ date, mood }));
const card = (written, day = TODAY, extra = {}) => ({
  day, date: keyDate(day), dateName: longDate(day),
  weeks: weeksOf(written, TODAY),
  calendar: { months: monthsOf(written, TODAY, day), selected: day.slice(0, 7) },
  ...extra,
});
const base = card(DAYS);

export default [
  { name: 'Closed', state: 'default', note: 'At rest: the date row above the mood row, the week as a strip of seven dots; both parts closed.', props: base },
  { name: 'Mood open', state: 'selected', note: 'The mood panel open: the week\'s graph (Even), the arrows instead of the strip.', props: { ...base, open: { mood: true } } },
  { name: 'Hover', state: 'hover', note: 'Hover the date or the mood name: the underline and the arrow\'s tint; a strip dot takes a wash.', props: base },
  { name: 'Calendar open', note: 'The calendar unrolled from the date over what is under the card: August, the day in view ringed.', props: { ...base, open: { calendar: true } } },
  { name: 'Both open', note: 'The calendar over the open panel: the two are independent.', props: { ...base, open: { mood: true, calendar: true } } },
  { name: 'Earlier week', note: 'An earlier week shown (27 Jul to 2 Aug, one day written: a straight line); the later arrow on.', props: { ...base, shown: '2026-07-27', open: { mood: true } } },
  { name: 'Earliest week', state: 'disabled', note: 'The first week written: no earlier week, its arrow off.', props: { ...base, shown: '2026-06-08', open: { mood: true } } },
  { name: 'Day in view', note: 'The list scrolled to Wednesday 5 August: the date follows it, and the rings in the graph and the calendar.', props: { ...card(DAYS, '2026-08-05'), open: { mood: true } } },
  { name: 'This week empty', state: 'empty', note: 'Nothing written this week (today Sunday 9): the empty strip and the empty graph; history still steps back to 1 August.', props: { ...card(DAYS.filter(d => d.date < '2026-08-03')), open: { mood: true } } },
  { name: 'First week', note: 'A new journal: two days this week, no history, both arrows off.', props: { ...card(DAYS.filter(d => d.date >= '2026-08-05' && d.date !== '2026-08-08' && d.date !== '2026-08-06')), open: { mood: true } } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: long copy in every label.', props: { ...base, open: { mood: true }, copy: { mood: 'How the days have felt', thisWeek: 'This week, from Monday to today', where: 'Where you are in the journal' } } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese.', props: { ...base, date: 'Вс 9 авг · 8月9日', open: { mood: true }, copy: { mood: 'Настроение 気分', thisWeek: 'Эта неделя 今週' } } },
];
