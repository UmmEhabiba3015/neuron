// The week of the approved design (explore booklet-feel f-mix), 3 to 9 Aug as 02-timeline records it, with the copy of
// DESIGN.md 2026-10-28. Links point into the prototype, as the screens' do. The long and non-Latin fixtures are
// stress tests, not product copy. The kept note has no foot here: with the whole system loaded Chromium paints a dotted
// underline after the kept squares' dashed rings a step differently (the leaf's catalogue has the same debt, round 7).
export default ({ html, use }) => {
  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], NAMES = ['Mon 3', 'Tue 4', 'Wed 5', 'Thu 6', 'Fri 7', 'Sat 8', 'Sun 9'];
  const MOODS = ['even', null, 'low', 'low', null, 'good', 'even'], WORD = { even: 'Even', low: 'Low', good: 'Good' };
  const days = on => DOW.map((dow, i) => MOODS[i] && on(i) ? { dow, mood: MOODS[i], title: `${NAMES[i]}: ${WORD[MOODS[i]]}` } : { dow });
  const pic = props => use('leafpic', { ...props, place: 'pic' });
  let rated = 0; const thumbs = () => use('thumbs', { id: `booklet-${++rated}`, form: 'pair' });
  const foot = n => html`${use('button', { grade: 'cite', href: '00-prototype.html#timeline', label: n === 1 ? '1 entry' : `${n} entries` })}${thumbs()}`;
  const week = { form: 'week', kicker: 'This week', date: '3 to 9 Aug', line: 'Five days here, and sleep on your mind.',
    picture: pic({ kind: 'week', days: days(() => true), say: 'Monday even, Wednesday low, Thursday low, Saturday good, Sunday even.', caption: 'Mon even · Wed low · Thu low · Sat good · Sun even' }) };
  const kept = { id: 'count', form: 'note', kicker: 'What you kept', date: '3 to 9 Aug', big: [{ n: '3', unit: 'written' }, { n: '3', unit: 'recorded' }], words: 'You wrote on three of the seven days, and recorded on three.',
    picture: pic({ kind: 'kept', days: DOW.map((dow, i) => ({ dow, written: [0, 3, 6].includes(i), recorded: [2, 5, 6].includes(i), title: NAMES[i] })), say: 'Written on 3 days, recorded on 3.' }) };
  const sleep = { id: 'sleep', form: 'note', kicker: 'What came up', date: '6 Aug', big: [{ n: '4', unit: 'days with sleep' }], words: 'Sleep came up on Thursday. It has come up on four of the last six days.',
    picture: pic({ kind: 'week', days: days(i => [2, 3, 5, 6].includes(i)), say: 'Sleep on Wednesday, Thursday, Saturday, Sunday.', caption: 'Wed, Thu, Sat, Sun' }), foot: foot(5) };
  const longest = { id: 'longest', form: 'note', kicker: 'Your recordings', date: '5 Aug', big: [{ n: '11:47', unit: 'Wednesday' }], words: 'Your longest recording this week was Wednesday, at 11 minutes 47. Is it the sleep you’re writing about, or the hour you’re writing at?',
    picture: pic({ kind: 'recordings', recs: [{ day: 'Wed', len: '11:47' }, { day: 'Sat', len: '5:08' }, { day: 'Sun', len: '2:41' }], say: '3 recordings: Wednesday 11:47, Saturday 5:08, Sunday 2:41.' }), foot: foot(1) };
  const trend = { id: 'trend', form: 'note', kicker: 'Over the weeks', date: '3 to 9 Aug', big: [{ n: '5', unit: 'days here' }], words: 'You were here on five days this week, after one day in each of the three weeks before. Sleep is new: it didn’t come up in any of them.',
    picture: pic({ kind: 'weeks', weeks: [{ label: '13 Jul', n: 1 }, { label: '20 Jul', n: 1 }, { label: '27 Jul', n: 1 }, { label: 'This week', n: 5, current: true }], say: '13 Jul: 1 day, 20 Jul: 1 day, 27 Jul: 1 day, This week: 5 days.' }),
    foot: html`${use('button', { grade: 'cite', href: '#earlier', label: 'Earlier weeks' })}${thumbs()}` };
  const end = { form: 'end', back: { label: 'Earlier weeks', href: '#earlier' } };
  const leaves = [week, kept, sleep, longest, trend, end];
  const label = 'Reflection, 3 to 9 Aug';
  const sofar = { form: 'week', kicker: 'This week so far', date: '3 to 9 Aug', line: 'Your first reflection is written at the end of your first week.', words: 'You’ve been here once so far. When Sunday ends, the week is read back to you here.',
    picture: pic({ kind: 'week', days: DOW.map((dow, i) => i < 3 ? { dow, day: 'before' } : i === 3 ? { dow, mood: 'low', today: true, title: 'Thu 6: Low' } : { dow, day: 'ahead' }), say: 'So far: Thursday low. Friday to Sunday are still ahead.' }) };
  return [
    { name: 'Week', note: 'Open on its first leaf (leaves 1 and 2 at the container’s 1200): the week, its notes, the signed leaf. Arrows, keys, a swipe, a tap on the outer thirds.', props: { id: 'booklet-a', label, leaves } },
    { name: 'At a note', state: 'selected', note: 'Opened on a note’s leaf (the rated state opens on its note): the leaves before it turned.', props: { id: 'booklet-b', label, leaves, at: 2 } },
    { name: 'Last leaf', state: 'disabled', note: 'On the signed leaf the next arrow is spent.', props: { id: 'booklet-c', label, leaves, at: 5 } },
    { name: 'Arrow hover', state: 'hover', note: 'An arrow’s ground lightens to --paper under a mouse.', props: { id: 'booklet-d', label, leaves } },
    { name: 'Arrow focus', state: 'focus-visible', note: 'The arrows take the product’s ring.', props: { id: 'booklet-e', label, leaves } },
    { name: 'Turning', state: 'active', note: 'A leaf turning over the spine (live: press the next arrow).', props: { id: 'booklet-f', label, leaves, at: 1 } },
    { name: 'Week so far', state: 'empty', note: 'A new account: one leaf, nothing to turn, no pager.', props: { id: 'booklet-g', label: 'Your first week', leaves: [sofar] } },
    { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { id: 'booklet-h', label: 'Reflection for a very long week with a long name, 27 Jul to 2 Aug', leaves: [{ ...week, line: 'A very long line for one week, which runs to three or four lines on a phone and still sits above its dots.' }, end], labels: { prev: 'The previous page of this booklet', next: 'The next page of this booklet' } } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { id: 'booklet-i', label: 'Отражение · 振り返り', leaves: [{ ...week, kicker: 'Эта неделя', line: '五日間ここにいて、眠りのことを考えていた。' }, end], labels: { page: 'Страница {a} из {n}', pages: 'Страницы {a} и {b} из {n}' } } },
  ];
};
