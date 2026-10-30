// Reflections' content (05-reflection, journal-website.html #reflections and its states), v4 C3: the week's
// booklet and Earlier weeks, with the copy of DESIGN.md 2026-10-28. Written once for every platform. Links point
// into the prototype, as the screens' do; every earlier week opens the one week fixture (#reflection).
// The days are 02-timeline's record (moods, what was written and recorded, the recordings' lengths), so the
// counts below are read from it, never typed: week 32 has writing on Mon 3, Thu 6 and Sun 9 and recordings on
// Wed 5, Sat 8 and Sun 9 (Priya's call on Sun 9 is out of memory: not here at all, never used); the week before
// has 1 Aug alone. Sleep comes up on Wed 5, Thu 6, Sat 8 and Sun 9, and in no earlier week.
const week = '00-prototype.html#reflection', timeline = '00-prototype.html#timeline';
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LONG = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const WORD = { light: 'Light', good: 'Good', even: 'Even', low: 'Low', hard: 'Hard' };

// A week of the record: its first day (a Monday) and the days kept, { 'YYYY-MM-DD': [mood, entries] }, entries
// 'w' (written) or a recording's length. Gives the seven days, Monday first.
const at = iso => new Date(iso + 'T00:00:00Z');
const add = (iso, n) => { const t = at(iso); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const record = (monday, kept) => DOW.map((dow, i) => {
  const date = add(monday, i), [mood = null, entries = []] = kept[date] || [];
  return { dow, date, n: at(date).getUTCDate(), mood, entries };
});
const w32 = record('2026-08-03', {
  '2026-08-03': ['even', ['w']],
  '2026-08-05': ['low', ['11:47']],
  '2026-08-06': ['low', ['w']],
  '2026-08-08': ['good', ['5:08']],
  '2026-08-09': ['even', ['w', '2:41']],
});
const w31 = record('2026-07-27', { '2026-08-01': ['light', ['w', '3:26']] });

// What a note reads from its days.
const here = days => days.filter(d => d.mood);
const kept = (days, kind) => days.filter(d => d.entries.some(e => (e === 'w') === (kind === 'w')));
const count = days => days.reduce((n, d) => n + d.entries.length, 0);
const entries = n => (n === 1 ? '1 entry' : `${n} entries`);
const secs = len => { const [m, s] = len.split(':').map(Number); return m * 60 + s; };

// The pictures' props (leafpic), from the days.
const titled = d => ({ dow: d.dow[0], mood: d.mood, title: `${d.dow} ${d.n}: ${WORD[d.mood]}` });
const dots = (days, on = d => d.mood) => days.map(d => (on(d) && d.mood ? titled(d) : { dow: d.dow[0] }));
const moodsSaid = days => here(days).map(d => `${LONG[d.dow]} ${WORD[d.mood].toLowerCase()}`).join(', ');
const caption = days => here(days).map(d => `${d.dow} ${d.mood}`).join(' · ');
const weekPic = days => ({ kind: 'week', days: dots(days), say: `${moodsSaid(days)}.`, caption: caption(days) });
const keptPic = days => {
  const w = kept(days, 'w'), r = kept(days, 'r');
  return { kind: 'kept', days: days.map(d => ({ dow: d.dow[0], written: w.includes(d), recorded: r.includes(d), title: `${d.dow} ${d.n}` })), say: `Written on ${w.length} ${w.length === 1 ? 'day' : 'days'}, recorded on ${r.length}.` };
};
const recordings = days => days.flatMap(d => d.entries.filter(e => e !== 'w').map(len => ({ d, len })));
const recPic = days => {
  const recs = recordings(days);
  return { kind: 'recordings', recs: recs.map(r => ({ day: r.d.dow, len: r.len })), say: `${recs.length} recordings: ${recs.map(r => `${LONG[r.d.dow]} ${r.len}`).join(', ')}.` };
};
const onDays = (days, on) => ({ kind: 'week', days: dots(days, on), say: '', caption: days.filter(on).map(d => d.dow).join(', ') });
// the trend: the three weeks before, then this one, each by the days it was here
const weeksPic = (before, days, current) => {
  const cols = [...before, { label: current, n: here(days).length, current: true }];
  return { kind: 'weeks', weeks: cols, say: `${cols.map(c => `${c.label}: ${c.n} ${c.n === 1 ? 'day' : 'days'}`).join(', ')}.` };
};

// A note's foot: the entries behind it, opened in Timeline (which lands on their days with its wash and frame), and
// its thumbs. data-days carries the days for the walkthrough's coordinator (journal-reflection.js).
const toTimeline = days => ({ label: entries(count(days)), href: timeline, days: days.filter(d => d.entries.length).map(d => d.date).reverse() });
const earlierWeeks = { label: 'Earlier weeks', href: '#earlier' };

const sleep = w32.filter(d => ['2026-08-05', '2026-08-06', '2026-08-08', '2026-08-09'].includes(d.date));
const longest = recordings(w32).reduce((a, b) => (secs(b.len) > secs(a.len) ? b : a));
const bankHoliday = w31.filter(d => d.date === '2026-08-01');

export default {
  // loading (v4 round 10): the skeleton's announced line
  loading: 'Loading your reflections.',
  title: 'Reflections',
  // desktop's title block carries the day's keybox, as Timeline's does; a new account opened it on Thursday
  day: { key: 'Day', value: "Sun 9 Aug '26" },
  soFarDay: { key: 'Day', value: "Thu 6 Aug '26" },
  // the newest week, then the week before it (the pushed page). A note's leaf id is the way back from Timeline.
  latest: {
    label: 'Reflection, 3 to 9 Aug',
    leaves: [
      { form: 'week', kicker: 'This week', date: '3 to 9 Aug', line: 'Five days here, and sleep on your mind.', picture: weekPic(w32) },
      { id: 'count', form: 'note', kicker: 'What you kept', date: '3 to 9 Aug', big: [{ n: String(kept(w32, 'w').length), unit: 'written' }, { n: String(kept(w32, 'r').length), unit: 'recorded' }], words: 'You wrote on three of the seven days, and recorded on three.', picture: keptPic(w32), source: toTimeline(w32) },
      { id: 'sleep', form: 'note', kicker: 'What came up', date: '6 Aug', big: [{ n: String(sleep.length), unit: 'days with sleep' }], words: 'Sleep came up on Thursday. It has come up on four of the last six days.', picture: { ...onDays(w32, d => sleep.includes(d)), say: `Sleep on ${sleep.map(d => LONG[d.dow]).join(', ')}.` }, source: toTimeline(sleep) },
      { id: 'longest', form: 'note', kicker: 'Your recordings', date: '5 Aug', big: [{ n: longest.len, unit: LONG[longest.d.dow] }], words: 'Your longest recording this week was Wednesday, at 11 minutes 47. Is it the sleep you\'re writing about, or the hour you\'re writing at?', picture: recPic(w32), source: toTimeline([longest.d]) },
      { id: 'trend', form: 'note', kicker: 'Over the weeks', date: '3 to 9 Aug', big: [{ n: String(here(w32).length), unit: 'days here' }], words: 'You were here on five days this week, after one day in each of the three weeks before. Sleep is new: it didn\'t come up in any of them.', picture: weeksPic([{ label: '13 Jul', n: 1 }, { label: '20 Jul', n: 1 }, { label: '27 Jul', n: 1 }], w32, 'This week'), source: earlierWeeks },
    ],
  },
  previous: {
    label: 'Reflection, 27 Jul to 2 Aug',
    key: 'Week', dates: '27 Jul to 2 Aug',
    leaves: [
      { form: 'week', kicker: 'Reflection', date: '27 Jul to 2 Aug', line: 'A bank holiday, done on purpose.', picture: weekPic(w31) },
      { id: 'count', form: 'note', kicker: 'What you kept', date: '27 Jul to 2 Aug', big: [{ n: String(kept(w31, 'w').length), unit: 'written' }, { n: String(kept(w31, 'r').length), unit: 'recorded' }], words: 'You wrote on one of the seven days, and recorded on one.', picture: keptPic(w31), source: toTimeline(w31) },
      { id: 'rest', form: 'note', kicker: 'The day off', date: '1 Aug', big: [{ n: '1', unit: 'August, the bank holiday' }], words: 'Saturday was the bank holiday. You wrote that doing nothing on purpose took most of the day to stop feeling odd.', picture: { ...onDays(w31, d => bankHoliday.includes(d)), say: 'Saturday 1 August.', caption: 'Saturday' }, source: toTimeline(bankHoliday) },
      // 6 to 12 Jul was two days (8 and 12 Jul); the note compares the two weeks before
      { id: 'trend', form: 'note', kicker: 'Over the weeks', date: '27 Jul to 2 Aug', big: [{ n: String(here(w31).length), unit: 'day here' }], words: 'One day again, as in the two weeks before.', picture: weeksPic([{ label: '6 Jul', n: 2 }, { label: '13 Jul', n: 1 }, { label: '20 Jul', n: 1 }], w31, 'That week'), source: earlierWeeks },
    ],
  },
  // the signed leaf, last
  end: { form: 'end', back: { label: 'Earlier weeks', href: '#earlier' } },
  // a first reflection: no trend, a leaf on what comes next, and no earlier weeks to go back to
  next: { form: 'week', kicker: 'Next week', line: 'Next week\'s reflection will compare against this one.' },
  // a new account, opened on Thursday: the week so far, alone
  soFar: {
    label: 'Your first week',
    leaf: { form: 'week', kicker: 'This week so far', date: '3 to 9 Aug', line: 'Your first reflection is written at the end of your first week.', words: 'You\'ve been here once so far. When Sunday ends, the week is read back to you here.',
      picture: { kind: 'week', days: DOW.map((dow, i) => (i < 3 ? { dow: dow[0], day: 'before' } : i === 3 ? { dow: dow[0], mood: 'low', today: true, title: 'Thu 6: Low' } : { dow: dow[0], day: 'ahead' })), say: 'So far: Thursday low. Friday to Sunday are still ahead.' } },
  },
  // a note's thumbs down pressed (What came up): its form open; the booklet opens on it
  rated: 'sleep',
  // Earlier weeks, newest first, each under the month it starts in (DESIGN.md 2026-10-28, the copy)
  earlier: {
    id: 'earlier', heading: 'Earlier weeks', since: 'Since March 2026',
    weeks: [
      { month: 'July', dates: '27 Jul to 2 Aug', line: 'A bank holiday, done on purpose.', href: week },
      { month: 'July', dates: '20 to 26 Jul', line: 'The flat viewing.', href: week },
      { month: 'July', dates: '13 to 19 Jul', line: 'The last day before the shutdown.', href: week },
      { month: 'July', dates: '6 to 12 Jul', line: 'A low Wednesday, then the canal walk.', href: week },
      { month: 'June', dates: '29 Jun to 5 Jul', line: 'The dentist, and the long way home.', href: week },
      { month: 'June', dates: '22 to 28 Jun', line: 'Priya\'s birthday dinner.', href: week },
      { month: 'June', dates: '15 to 21 Jun', line: 'Bad news from home.', href: week },
      { month: 'June', dates: '8 to 14 Jun', line: 'The bookshelf, twice.', href: week },
    ],
  },
  // an earlier week, on its own pushed page
  back: { label: 'Reflections', href: '00-prototype.html#reflections' },
};
