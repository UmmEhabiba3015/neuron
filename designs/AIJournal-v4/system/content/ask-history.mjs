// Ask's history (v4 C2, DESIGN.md 2026-10-25, sessions and history): how the days with chats fold. Today; the
// past days of this week one by one; a finished week folds into the week, weeks into months, months into years.
// A week without chats leaves no record. A week across two months is split at the month's end: each part sits
// in its own month, named by its dates ("27–31 Jul"). Derived here once, for the drawers' fixtures and the Ask
// page alike. days: [{ date: YYYY-MM-DD, lede: the day's first question, sessions: n }], any order.
import { add, monday, longDate, shortDate } from './journal-days.mjs';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const at = iso => new Date(iso + 'T00:00:00Z');
const ym = date => date.slice(0, 7);
const lastOfMonth = m => { const t = at(m + '-01'); t.setUTCMonth(t.getUTCMonth() + 1); t.setUTCDate(0); return t.toISOString().slice(0, 10); };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const dayNode = (d, today) => ({ type: 'day', key: d.date, name: d.date === today ? 'Today' : shortDate(d.date), long: longDate(d.date), lede: d.lede, count: plural(d.sessions, 'session', 'sessions'), days: 1 });
const counted = (rest, kids) => { const days = kids.reduce((n, k) => n + k.days, 0); return { ...rest, children: kids, days, count: plural(days, 'day', 'days') }; };
// keeps first-seen order of the keys
const group = (list, by) => { const map = new Map(); for (const x of list) { const k = by(x); if (!map.has(k)) map.set(k, []); map.get(k).push(x); } return [...map.entries()]; };

// a week clipped to its month: its dates are its name, so a part never reads as a broken week
function weekNode(days, today) {
  const m = ym(days[0].date), mon = monday(days[0].date), sun = add(mon, 6);
  const a = ym(mon) === m ? mon : m + '-01', b = ym(sun) === m ? sun : lastOfMonth(m);
  const name = `${at(a).getUTCDate()}–${at(b).getUTCDate()} ${MON[at(a).getUTCMonth()]}`;
  const kids = days.map(d => dayNode(d, today));
  return counted({ type: 'week', key: 'w' + a, name, part: a !== mon || b !== sun, lede: kids.map(k => k.name.split(' ')[0]).join(', ') }, kids);
}
const weeksOf = (days, today) => group(days, d => `${ym(d.date)}|${monday(d.date)}`).map(([, ds]) => weekNode(ds, today));
const monthNode = (days, today) => { const t = at(ym(days[0].date) + '-01'); return counted({ type: 'month', key: 'm' + ym(days[0].date), name: MON_LONG[t.getUTCMonth()], year: String(t.getUTCFullYear()) }, weeksOf(days, today)); };
const yearNode = (days, today) => counted({ type: 'year', key: 'y' + days[0].date.slice(0, 4), name: days[0].date.slice(0, 4) }, group(days, d => ym(d.date)).map(([, ds]) => monthNode(ds, today)));

// { today: the day node (or null with no chat today), week: [day nodes], earlier: [week, month and year nodes] },
// newest first throughout.
export function historyOf(days, today) {
  const sorted = [...days].sort((x, y) => (x.date < y.date ? 1 : -1));
  const past = sorted.filter(d => d.date < today), wk = monday(today);
  const month = past.filter(d => d.date < wk && ym(d.date) === ym(today));
  const year = past.filter(d => ym(d.date) !== ym(today) && d.date.slice(0, 4) === today.slice(0, 4));
  const older = past.filter(d => d.date.slice(0, 4) !== today.slice(0, 4));
  const now = sorted.find(d => d.date === today);
  return {
    today: now ? dayNode(now, today) : null,
    week: past.filter(d => d.date >= wk).map(d => dayNode(d, today)),
    earlier: [...weeksOf(month, today), ...group(year, d => ym(d.date)).map(([, ds]) => monthNode(ds, today)), ...group(older, d => d.date.slice(0, 4)).map(([, ds]) => yearNode(ds, today))],
  };
}

// Every group in the tree, each with its parent's key ('' for the top), for the drawer's levels.
export function groupsOf(tree) {
  const out = [];
  const walk = (list, parent) => { for (const n of list) if (n.children) { out.push({ ...n, parent }); walk(n.children, n.key); } };
  walk(tree.earlier, '');
  return out;
}
