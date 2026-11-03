// Ask's states (v4 C2; DESIGN.md 2026-10-25, the C2 states row). Each: the day open (date, default today), its
// sessions (default the day's own), the chat's state, the composer's lead and words, the drawers drawn open, the
// shell's id (18's route). From the approved journal (system/content/ask-journal.mjs).
import { TODAY, sessionsOf, bubbles, SUGGEST, INSTEAD } from '../../../content/ask-journal.mjs';
import data from './data.mjs';

const o = { dayHref: () => data.links.day, searchHref: data.links.search };
const today = () => sessionsOf(TODAY, o);
// today with more in its open (second) session
const more = messages => { const d = today(); return [d[0], { ...d[1], messages: [...d[1].messages, ...messages] }]; };
const dentist = bubbles('dentist', `${TODAY}-1-1`, o);

export default {
  today: {},
  past: { date: '2026-08-06' },
  history: { open: { history: true } },
  bookmarks: { open: { bookmarks: true } },
  drawers: { open: { history: true, bookmarks: true } },
  // the thumbs down pressed on the morning's first answer: its form open under the tools
  rate: { sessions: today().map((s, i) => i ? s : { ...s, messages: s.messages.map(m => m.id === `${TODAY}-0-0-a` ? { ...m, asking: true } : m) }) },
  // the answer being written in, word by word
  writing: { sessions: more([dentist[0], { voice: 'answer', id: dentist[1].id, status: 'writing', paras: ['Twice. In April you wrote that you had finally booked it'] }]) },
  // New pressed, nothing asked yet: the composer's lead asks what to ask
  empty: { sessions: [...today().map((s, i) => i ? { ...s, label: 'Session 2 · 21:40' } : s), { label: 'Session 3 · 22:48, open', name: 'Session 3, 22:48', messages: [] }], lead: { kind: 'hello', asks: SUGGEST } },
  cant: { sessions: more(bubbles('cant', `${TODAY}-1-1`, o)), lead: { kind: 'instead', asks: INSTEAD } },
  // the server could not be reached: the question dimmed and marked, its words back in the box
  failed: { sessions: more([{ ...dentist[0], unsent: true }]), lead: { kind: 'failed' }, value: dentist[0].paras[0] },
  // Ask opening (18): today's page as a skeleton resting on the composer
  loading: { chat: 'loading', id: 'ask-loading' },
};
