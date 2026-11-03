// Sunday 9 August 2026 in the approved design's journal (system/content/ask-journal.mjs). The long and non-Latin
// fixtures are stress tests, not product copy.
import { TODAY, sessionsOf, bubbles, dayOf, SUGGEST, INSTEAD } from '../../../content/ask-journal.mjs';
const today = dayOf(TODAY), past = dayOf('2026-08-06');
const o = { dayHref: () => '00-prototype.html#day', searchHref: '00-prototype.html#timeline' };
const day = sessionsOf(TODAY, o);
// the open session after a question the journal could not answer
const cant = [...day.slice(0, 1), { ...day[1], messages: [...day[1].messages, ...bubbles('cant', `${TODAY}-1-1`, o)] }];
// the open session after a question that did not send: its bubble back as unsent, the words back in the box
const failedQ = { ...bubbles('dentist', `${TODAY}-1-1`, o)[0], unsent: true };
const failed = [...day.slice(0, 1), { ...day[1], messages: [...day[1].messages, failedQ] }];
// an empty session: New pressed, nothing asked yet
const empty = [...day, { label: 'Session 3 · 22:48, open', name: 'Session 3, 22:48', messages: [] }].map((s, i) => i === 1 ? { ...s, label: 'Session 2 · 21:40' } : s);
// the answer being written in
const writing = [...day.slice(0, 1), { ...day[1], messages: [...day[1].messages, { ...bubbles('dentist', `${TODAY}-1-1`, o)[0] }, { voice: 'answer', id: `${TODAY}-1-1-a`, status: 'writing', paras: ['Twice. In April you wrote that you had finally booked it'] }] }];
export default [
  { name: 'Today', note: 'Today’s two sessions, the second still open; New at the end of the head row.', props: { day: today, sessions: day } },
  { name: 'Past day', state: 'disabled', note: 'A past day is read only: Today in the head row, the read-only slip in place of the composer.', props: { day: past, sessions: sessionsOf(past.date, o), todayHref: '00-prototype.html#ask' } },
  { name: 'Empty session', state: 'empty', note: 'New pressed, nothing asked yet: blank above the composer, whose lead asks what to ask (ask-states D).', props: { day: today, sessions: empty, lead: { kind: 'hello', asks: SUGGEST } } },
  { name: 'Question hover', state: 'hover', note: 'A question the lead offers darkens its edge under a mouse.', props: { day: today, sessions: empty, lead: { kind: 'hello', asks: SUGGEST }, composer: { fieldId: 'aj-ask-h' } } },
  { name: 'Focus', state: 'focus-visible', note: 'The product’s ring on the pills, the bubbles’ tools and links, the questions and the composer.', props: { day: today, sessions: day, composer: { fieldId: 'aj-ask-f' } } },
  { name: 'Can’t answer', state: 'error', note: 'The journal could not answer: the dashed bubble; the lead offers what it can answer (f-mix, ask-states D).', props: { day: today, sessions: cant, lead: { kind: 'instead', asks: INSTEAD } } },
  { name: 'Not sent', state: 'error', note: 'The server could not be reached: the question dimmed and marked, its words back in the box; sending again retries it in place (ask-states D).', props: { day: today, sessions: failed, lead: { kind: 'failed' }, composer: { value: 'Have I written about the dentist?' } } },
  { name: 'Writing', state: 'loading', note: 'The answer being written in: words arrive softly; the rest waits until it is done.', props: { day: today, sessions: writing } },
  { name: 'Loading', state: 'loading', note: 'A day opening: the whole page a skeleton resting on the composer, cut off at the top under a fade; the composer waits (f-mix, D’s skeleton).', props: { day: past, state: 'loading', composer: {} }, },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long question and answer.', props: { day: today, sessions: [{ label: 'Session 1 · 08:10, open', name: 'Session 1, 08:10', messages: [{ voice: 'you', id: 'l-q', paras: ['I keep thinking about what Priya said on Sunday about moving to Leeds, and whether I wrote down how I felt about it at the time. Did I? And what did I say about it the week after, when we talked again on the phone?'] }, { voice: 'answer', id: 'l-a', paras: ['You wrote about Priya and Leeds four times between May and July. The first time you were mostly surprised; the second and third, you were working out what it would mean for the Sunday walks; by the last one you had stopped mentioning yourself at all and wrote only about what she would gain.'] }] }] } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { day: today, sessions: [{ label: 'Сессия 1 · 08:10', name: 'Сессия 1', messages: [{ voice: 'you', id: 'n-q', paras: ['Что я писал о сне в июле?'] }, { voice: 'answer', id: 'n-a', paras: ['七月に睡眠について四回書いています。'] }] }] } },
];
