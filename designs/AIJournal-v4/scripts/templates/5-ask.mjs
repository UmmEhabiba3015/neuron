// Area 5 (Ask, v4 C2): the markup the stand-in chat (scripts/journal-ask.js) puts on the page, rendered by the
// modules from the approved journal (system/content/ask-journal.mjs). name -> render => markup
// (tools/modules/templates.mjs). The stand-in takes parts of a render by their hooks and places:
//   ask-day-<date>: a day's chat (its thread, its composer, New or Today), for a day opened from History;
//   ask-loading: the chat while a day opens (the skeleton thread, the waiting composer);
//   ask-hello, ask-instead, ask-failed: the composer's leads (and ask-hello's empty session, for New);
//   ask-q-<exchange>: the sample's questions (the stand-in knows an exchange by its words); ask-you, ask-unsent: a
//     question, and one that did not send; ask-reading, ask-x-<exchange>, ask-w-<exchange>: the reading line, an
//     answer done and being written (each word its own span);
//   ask-marks, ask-marks-none: the Bookmarks list's row and its empty line.
import { TODAY, DAYS, EXCHANGES, sessionsOf, bubbles, dayOf, SUGGEST, INSTEAD } from '../../system/content/ask-journal.mjs';

const o = { dayHref: () => '00-prototype.html#day', searchHref: '00-prototype.html#timeline' };
// each template's ids are its own (the build's audit): the composer's field is named for the template
const chat = (render, name, date, props = {}) => render('chat', { day: dayOf(date), sessions: [], composer: { fieldId: `t-${name}` }, ...props });
const open = [{ label: '', name: '', messages: [] }];
const days = Object.fromEntries(Object.keys(DAYS).map(date => [`ask-day-${date}`, render => chat(render, `day-${date}`, date, { sessions: sessionsOf(date, o) })]));
const answers = Object.fromEntries(Object.keys(EXCHANGES).flatMap(key => {
  const [you, answer] = bubbles(key, `t-${key}`, { ...o, bookmarks: [], ratings: {} });
  return [
    ...(you.paras[0] ? [[`ask-q-${key}`, render => render('bubble', you)]] : []),
    [`ask-x-${key}`, render => render('bubble', answer)],
    [`ask-w-${key}`, render => render('bubble', { voice: 'answer', id: `t-${key}-w`, status: 'writing', paras: answer.paras, refs: answer.refs })],
  ];
}));

export default {
  ...days,
  'ask-loading': render => chat(render, 'loading', TODAY, { state: 'loading' }),
  'ask-hello': render => chat(render, 'hello', TODAY, { sessions: open, lead: { kind: 'hello', asks: SUGGEST } }),
  'ask-instead': render => chat(render, 'instead', TODAY, { lead: { kind: 'instead', asks: INSTEAD } }),
  'ask-failed': render => chat(render, 'failed', TODAY, { lead: { kind: 'failed' } }),
  'ask-you': render => render('bubble', { voice: 'you', id: 't-you', paras: [''] }),
  'ask-unsent': render => render('bubble', { voice: 'you', id: 't-unsent', paras: [''], unsent: true }),
  'ask-reading': render => render('bubble', { voice: 'answer', id: 't-reading', status: 'reading' }),
  ...answers,
  'ask-marks': render => render('drawers', { id: 't-marks', today: TODAY, days: [], bookmarks: { day: '', items: [{ id: 't-mark', voice: 'answer', text: '', meta: '' }] } }),
  'ask-marks-none': render => render('drawers', { id: 't-marks-none', today: TODAY, days: [], bookmarks: { day: '', items: [] } }),
};
