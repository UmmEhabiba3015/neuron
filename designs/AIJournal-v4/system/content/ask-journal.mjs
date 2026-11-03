// Ask's sample journal (v4 C2), from the approved design (explore ask-readable shared/ask.js): the entries an
// answer can point to, the exchanges, the days with chats and their sessions, the bookmarks and ratings already
// set. Read once here for the chat and drawers fixtures and the Ask page, so they never drift apart.
import { longDate, shortDate } from './journal-days.mjs';

export const TODAY = '2026-08-09';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayMonth = d => `${Number(d.slice(8))} ${MON[Number(d.slice(5, 7)) - 1]}`;

// the person's own words an answer can point to
const ENTRIES = {
  '2026-08-06': { t: '22:10', text: 'Slept badly again. I’ve stopped counting which night this is.' },
  '2026-07-03': { t: '18:20', text: 'Walked to the canal after work. The swans were exactly where they always are, which I found more reassuring than it probably is.' },
  '2026-08-02': { t: '17:05', text: 'Walked the canal as far as the second bridge and back. Didn’t listen to anything.' },
  '2026-06-14': { t: '11:30', text: 'Took the long way round past the water. Two swans and a heron that left before I got close.' },
  '2026-07-29': { t: '12:45', text: 'The office is too much lately. I put headphones on just so nobody talks to me.' },
  '2026-07-23': { t: '16:10', text: 'Worked from the library. Got more done before lunch than all of Tuesday.' },
  '2026-07-21': { t: '21:00', text: 'Going to ask about two days at home. Monday. Writing it here so I actually do it.' },
  '2026-03-28': { t: '20:15', text: 'Rang Mum. Same conversation as last week, same ending.' },
  '2026-06-30': { t: '19:40', text: 'Mum wants to do the coast in September. I said yes before I thought about it, and I’m glad.' },
  '2026-04-14': { t: '08:40', text: 'Finally booked the dentist. Thursday at four. Telling myself it is only a check-up.' },
  '2026-07-08': { t: '19:10', text: 'Filling done. Less bad than the version of it I had been carrying around since April.' },
  '2026-07-26': { t: '13:00', text: 'Out by nine, coffee by the river, home by noon with the whole day still there.' },
  '2026-07-19': { t: '18:30', text: 'Didn’t get up till eleven. Lost the afternoon to my phone again.' },
};

// the exchanges: the question, the answer's paragraphs ({n} marks where reference n is used), the references
export const EXCHANGES = {
  sleep: { q: 'What do I write about when I can’t sleep?', a: ['Sleep comes up in eleven of your entries since June. Nine of them were written after ten at night{1}, and most are less about the night than about the next day: work you haven’t started, a call you keep putting off.', 'The nights you slept well, you had been out walking first{2}.'], refs: ['2026-08-06', '2026-07-03'] },
  sleep2: { q: 'Was July any better?', a: ['A little. You wrote about sleep four times in July and said twice that you slept well{1}. Both times you had been outside in the evening.'], refs: ['2026-07-03'] },
  calm: { q: 'When did I last feel properly calm?', a: ['Sunday the 2nd. You walked the canal as far as the second bridge and wrote that you didn’t listen to anything{1}.', 'Before that, the last time you used the word calm was 14 June, on another walk past the water{2}.'], refs: ['2026-08-02', '2026-06-14'] },
  work: { q: 'What have I said about the office lately?', a: ['Mostly that it’s loud. In the last three weeks you mention the office six times, and four of those are about noise or not being able to think{1}.', 'The one good day was the Thursday you worked from the library{2}.'], refs: ['2026-07-29', '2026-07-23'] },
  work2: { q: 'Did I ever write about asking to work from home?', a: ['Once, on 21 July: you wrote that you would ask on Monday{1}. There is nothing after that about whether you did.'], refs: ['2026-07-21'] },
  mum: { q: 'How have things been with Mum?', a: ['Warmer than in the spring. In March and April most entries about her end on an argument{1}; since June they end on plans: the garden, the coast in September{2}.'], refs: ['2026-03-28', '2026-06-30'] },
  cant: { q: 'What did Sam say at the wedding?', cant: true, a: ['Your journal doesn’t mention a wedding, or anyone called Sam, so I can’t answer that from it.', 'Entries you keep out of memory are never read, so if you wrote about it in one of those, it isn’t here.'], refs: [], next: 'Search Timeline for “wedding”' },
  // live: the walkthroughs' answer to a question the sample has no exchange for (the stand-in, scripts/journal-ask.js)
  live: { q: '', a: ['You have written about weekends twelve times since May. The ones you call good have one thing in common: you were out of the flat before ten{1}.', 'The slow ones start late, and your phone comes up in most of them{2}.'], refs: ['2026-07-26', '2026-07-19'] },
  dentist: { q: 'Have I written about the dentist?', a: ['Twice. In April you wrote that you had finally booked it{1}, and in July that the filling was done and less bad than you had made it in your head{2}.'], refs: ['2026-04-14', '2026-07-08'] },
};

// the days with chats, each a list of sessions in time order; today's last session is the one still open
export const DAYS = {
  '2026-08-09': [{ start: '08:10', ex: ['sleep', 'sleep2'] }, { start: '21:40', ex: ['calm'] }],
  '2026-08-06': [{ start: '07:50', ex: ['sleep'] }, { start: '22:30', ex: ['work', 'mum'] }],
  '2026-08-04': [{ start: '19:15', ex: ['work2'] }],
  '2026-08-01': [{ start: '10:20', ex: ['mum'] }],
  '2026-07-31': [{ start: '23:05', ex: ['sleep2'] }],
  '2026-07-28': [{ start: '12:50', ex: ['work'] }],
  '2026-07-16': [{ start: '18:40', ex: ['calm'] }],
  '2026-07-02': [{ start: '21:15', ex: ['mum'] }],
  '2026-06-24': [{ start: '23:50', ex: ['sleep'] }],
  '2026-06-21': [{ start: '09:30', ex: ['calm'] }, { start: '20:10', ex: ['sleep2'] }],
  '2026-06-09': [{ start: '19:25', ex: ['work'] }],
  '2026-05-14': [{ start: '22:00', ex: ['sleep'] }],
  '2026-05-02': [{ start: '11:45', ex: ['mum'] }],
  '2026-04-20': [{ start: '20:30', ex: ['work'] }],
  '2026-03-11': [{ start: '21:05', ex: ['mum'] }],
};
// bookmarks and ratings already set (message ids: day-session-exchange-q|a)
export const BOOKMARKS = ['2026-08-09-0-0-a', '2026-08-06-1-1-a', '2026-08-06-1-0-q', '2026-08-06-0-0-a'];
export const RATINGS = { '2026-08-09-0-1-a': 'up' };
// questions the lead offers: in an empty session, and after a can't-answer (ask-states D)
export const SUGGEST = ['When did I last feel properly calm?', 'What have I said about the office lately?', 'How have things been with Mum?'];
export const INSTEAD = ['How have things been with Mum?', 'What do I write about when I can’t sleep?'];

const plain = ex => ex.a.join(' ').replace(/\{\d+\}/g, '');
// an exchange as the two bubbles' props; dayHref(date) is where a reference goes (that day's Day page)
export function bubbles(key, id, { dayHref = () => '#day', searchHref = '#timeline', bookmarks = BOOKMARKS, ratings = RATINGS, ex = EXCHANGES[key] } = {}) {
  const refs = ex.refs.map(d => ({ short: dayMonth(d), long: `${longDate(d)}, ${ENTRIES[d].t}`, text: ENTRIES[d].text, href: dayHref(d) }));
  const you = { voice: 'you', id: `${id}-q`, paras: [ex.q], bookmarked: bookmarks.includes(`${id}-q`) };
  const answer = { voice: 'answer', id: `${id}-a`, paras: ex.a, refs, used: refs.length ? `${refs.length} ${refs.length === 1 ? 'entry' : 'entries'} used` : '', bookmarked: bookmarks.includes(`${id}-a`), rating: ratings[`${id}-a`] || 'none', ...(ex.cant ? { cant: true, next: { label: ex.next, href: searchHref } } : {}) };
  return [you, answer];
}
// a day's sessions as the chat takes them
export function sessionsOf(date, o = {}) {
  const ss = DAYS[date] || [];
  return ss.map((s, si) => ({
    label: `Session ${si + 1} · ${s.start}${date === TODAY && si === ss.length - 1 ? ', open' : ''}`,
    name: `Session ${si + 1}, ${s.start}`,
    messages: s.ex.flatMap((k, j) => bubbles(k, `${date}-${si}-${j}`, o)),
  }));
}
// the days with chats as the history takes them
export const historyDays = () => Object.entries(DAYS).map(([date, ss]) => ({ date, lede: EXCHANGES[ss[0].ex[0]].q, sessions: ss.length }));
// the open day's bookmarks as the drawer lists them
export function bookmarksOf(date, bookmarks = BOOKMARKS) {
  return bookmarks.filter(id => id.startsWith(date + '-')).sort().map(id => {
    const [s, x, kind] = id.slice(11).split('-'), session = DAYS[date][Number(s)], ex = EXCHANGES[session.ex[Number(x)]];
    return { id, voice: kind === 'q' ? 'you' : 'answer', text: kind === 'q' ? ex.q : plain(ex), meta: `${kind === 'q' ? 'You asked' : 'Answer'} · session ${Number(s) + 1}, ${session.start}` };
  });
}
export const dayOf = date => ({ date, today: date === TODAY, long: longDate(date), short: shortDate(date) });
