// The Timeline's date and mood card reads the journal's days three ways (v4 C1): the weeks its strip and graph
// step through, the months its calendar wheel offers, and the date as the masthead writes it. Derived here once
// from the days written ({ date: YYYY-MM-DD, mood }), for the card's fixtures and the Timeline page alike.
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WORD = { light: 'Light', good: 'Good', even: 'Even', low: 'Low', hard: 'Hard' };

const at = iso => new Date(iso + 'T00:00:00Z');
const iso = t => t.toISOString().slice(0, 10);
export const add = (date, n) => { const t = at(date); t.setUTCDate(t.getUTCDate() + n); return iso(t); };
export const monday = date => add(date, -((at(date).getUTCDay() + 6) % 7));
// "Sun 9 Aug '26" (the masthead's), "Sunday 9 August", "Sun 9 Aug"
export const keyDate = date => { const t = at(date); return `${DOW[t.getUTCDay()]} ${t.getUTCDate()} ${MON[t.getUTCMonth()]} '${String(t.getUTCFullYear()).slice(2)}`; };
export const longDate = date => { const t = at(date); return `${DOW_LONG[t.getUTCDay()]} ${t.getUTCDate()} ${MON_LONG[t.getUTCMonth()]}`; };
export const shortDate = date => { const t = at(date); return `${DOW[t.getUTCDay()]} ${t.getUTCDate()} ${MON[t.getUTCMonth()]}`; };
// "3 to 9 Aug", "27 Jul to 2 Aug"
export const weekLabel = start => { const a = at(start), b = at(add(start, 6));
  return a.getUTCMonth() === b.getUTCMonth() ? `${a.getUTCDate()} to ${b.getUTCDate()} ${MON[b.getUTCMonth()]}` : `${a.getUTCDate()} ${MON[a.getUTCMonth()]} to ${b.getUTCDate()} ${MON[b.getUTCMonth()]}`; };

// The weeks the card steps through, oldest first: every week with something written, and this week always
// (history skips empty weeks). Each: { week, label, days (seven, Monday first, as moodgraph takes them), before,
// after (the nearest days written outside the week, for the curve) }.
export function weeksOf(written, today) {
  const by = Object.fromEntries(written.map(d => [d.date, d]));
  const dates = written.map(d => d.date).sort();
  const starts = [...new Set([...dates.map(monday), monday(today)])].sort();
  return starts.map(week => {
    const days = Array.from({ length: 7 }, (_, i) => { const date = add(week, i), d = by[date];
      return { date, ...(d ? { mood: d.mood, has: true } : {}), ...(date > today ? { future: true } : {}), name: longDate(date), short: shortDate(date) }; });
    const prev = dates.filter(x => x < week).pop(), next = dates.find(x => x > add(week, 6));
    return { week, label: weekLabel(week), days, ...(prev ? { before: { date: prev, mood: by[prev].mood } } : {}), ...(next ? { after: { date: next, mood: by[next].mood } } : {}) };
  });
}

// The months the calendar wheel offers, oldest first: from the first month written to this month, never a future
// one. Each: { value, short, year, name, days (Monday first, out-of-month cells blank), empty }.
export function monthsOf(written, today, current = today) {
  const by = Object.fromEntries(written.map(d => [d.date, d]));
  const first = (written.map(d => d.date).sort()[0] || today).slice(0, 7);
  const out = [];
  for (let [y, m] = first.split('-').map(Number); `${y}-${String(m).padStart(2, '0')}` <= today.slice(0, 7); m === 12 ? (y++, m = 1) : m++) {
    const value = `${y}-${String(m).padStart(2, '0')}`, start = `${value}-01`, len = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const pad = (at(start).getUTCDay() + 6) % 7;
    const days = [...Array.from({ length: pad }, () => ({ n: '', out: true })), ...Array.from({ length: len }, (_, i) => {
      const date = `${value}-${String(i + 1).padStart(2, '0')}`, d = by[date];
      return d ? { n: i + 1, href: `#d-${date}`, mood: d.mood, ...(date === current ? { current: true } : {}), label: `${longDate(date)}, ${WORD[d.mood]}. Go to this day` } : { n: i + 1 };
    })];
    out.push({ value, short: MON[m - 1], year: String(y), name: `${MON_LONG[m - 1]} ${y}`, days, ...(days.some(d => d.href) ? {} : { empty: true }) });
  }
  return out;
}
