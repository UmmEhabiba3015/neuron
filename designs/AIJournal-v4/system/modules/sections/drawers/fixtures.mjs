// The approved design's journal (system/content/ask-journal.mjs), Sunday 9 August 2026. The long and non-Latin
// fixtures are stress tests, not product copy.
import { TODAY, historyDays, bookmarksOf } from '../../../content/ask-journal.mjs';
const base = { today: TODAY, current: TODAY, days: historyDays(), bookmarks: { day: 'Today, Sunday 9 August', items: bookmarksOf(TODAY) } };
const past = { ...base, current: '2026-08-06', bookmarks: { day: 'Thursday 6 August', items: bookmarksOf('2026-08-06') } };
export default [
  { name: 'Shut', note: 'The two pills (icons only below 1200), the layer shut.', props: base },
  { name: 'History open', state: 'selected', note: 'History from the left: today (marked, the open day), this week’s past days, then earlier weeks and months.', props: { ...base, open: { history: true } } },
  { name: 'Bookmarks open', note: 'Bookmarks from the right: the open day’s, each jumping to its message.', props: { ...past, id: 'ask-drawers-b', open: { bookmarks: true } } },
  { name: 'Both open', note: 'History and Bookmarks together over one dim.', props: { ...base, id: 'ask-drawers-c', open: { history: true, bookmarks: true } } },
  { name: 'Row hover', state: 'hover', note: 'A history row takes a 7% --rule ground under a mouse.', props: { ...base, id: 'ask-drawers-d', open: { history: true } } },
  { name: 'Focus', state: 'focus-visible', note: 'The product’s ring; opening a drawer focuses its Close.', props: { ...base, id: 'ask-drawers-e', open: { history: true } } },
  { name: 'No bookmarks', state: 'empty', note: 'A day without bookmarks says how to make one.', props: { ...base, id: 'ask-drawers-f', current: '2026-08-04', bookmarks: { day: 'Tuesday 4 August', items: [] }, open: { bookmarks: true } } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long first question and a long bookmark.', props: { ...base, id: 'ask-drawers-g', days: [{ date: TODAY, lede: 'I keep thinking about what Priya said on Sunday about moving to Leeds, and whether I wrote it down', sessions: 12 }], bookmarks: { day: 'Today, Sunday 9 August', items: [{ id: 'x-a', voice: 'answer', text: 'You wrote about Priya and Leeds four times between May and July. The first time you were mostly surprised; by the last one you had stopped mentioning yourself at all.', meta: 'Answer · session 11, 23:58' }] }, open: { history: true, bookmarks: true } } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { ...base, id: 'ask-drawers-h', days: [{ date: TODAY, lede: 'Что я писал о сне в июле?', sessions: 1 }], bookmarks: { day: 'Сегодня', items: [{ id: 'y-a', voice: 'answer', text: '七月に睡眠について四回書いています。', meta: 'Ответ · сессия 1, 08:10' }] }, copy: { history: 'История', bookmarks: 'Закладки' }, open: { bookmarks: true } } },
];
