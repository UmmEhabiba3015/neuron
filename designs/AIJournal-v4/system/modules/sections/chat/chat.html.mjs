// chat: <Chat day sessions state composer lead copy>{tools}</Chat> in the developers' code.
// Ask's conversation (v4 C2, explore ask-readable a-mirror-bubble, as revised; the states from ask-states D and
// ask-cant-loading f-mix): the head row (the drawers' pills in the tools slot, New or Today at its end), the thread
// (a day's sessions in time order, each with its line, then its messages as bubbles), and the chat composer at the
// foot. state: day (the thread), empty (data only, (an open session with nothing asked: the composer's lead asks what to ask),
// loading (a whole page of skeleton resting on the composer while a day opens).
// sessions: [{ label: "Session 1 · 08:10", name: "Session 1, 08:10", messages: [bubble props] }], oldest first.
// lead: none, or { kind: hello | instead | failed, asks?: [question] } (the composer's lead; failed says the
// question is back in the box).
import { PLUS } from '../../../content/icons.mjs';
const COPY = {
  new: 'New', today: 'Today', loading: 'Loading', readonly: 'Past sessions are read only.', backToday: 'Back to today',
  note: 'Ask reads only your own entries. The 4 kept out of memory are never read.', label: 'Ask your journal',
  hello: 'What would you like to ask?', instead: 'Your journal can answer these',
  failedWord: 'Not sent.', failed: 'We could not reach the server. Your question is back in the box: send it again.',
};
// The skeleton's day, oldest first: four sessions, enough for a tall screen, the widths varied so it reads as a
// chat rather than a pattern (f-mix). A line, your question (its one line's width), the answer (its lines).
const BONES = [
  'line', [0.55], { a: [1, 0.7] }, [0.75], { a: [1, 1, 0.35] },
  'line', [0.6], { a: [1, 0.9, 0.4] }, [0.8], { a: [1, 0.65] },
  'line', [0.45], { a: [1, 1, 0.75] }, [0.7], { a: [0.85] },
  'line', [0.7], { a: [1, 1, 0.55] }, [0.5], { a: [1, 0.8] },
];
const pct = w => `${Math.round(w * 100)}%`;

export default function render({ day = {}, sessions = [], state = 'day', composer = {}, lead = null, todayHref = '', copy = {} } = {}, slots, { html, raw, attrs, use, el }) {
  const c = { ...COPY, ...copy }, past = day.today === false, loading = state === 'loading';
  const end = past ? use('button', { form: 'pill', label: c.today, ...(todayHref ? { href: todayHref } : {}), hook: 'today' }) : use('button', { form: 'pill', label: c.new, hook: 'new' }, { icon: raw(PLUS) });
  const head = html`<div class="${el('head')}"><div class="${el('row')}">${slots.tools}<span class="${el('end')}">${end}</span></div></div>`;
  const session = s => html`<section class="${el('session')}"${attrs({ 'aria-label': s.name || s.label })}><p class="${el('line')}"><span>${s.label}</span></p>${(s.messages || []).map(m => use('bubble', { ...m, place: m.voice === 'answer' ? 'answer' : 'you' }))}</section>`;
  // the skeleton's pieces are the bone's (v4 round 10): a line, a tool's box, entries used
  const tools = n => html`<span class="${el('tools')}">${Array.from({ length: n }, () => use('bone', { form: 'block', width: '16px', height: '16px' }))}</span>`;
  const bone = b => b === 'line' ? html`<div class="${el('sk-line')}">${use('bone', { width: '150px' })}</div>`
    : Array.isArray(b) ? html`<div class="${el('sk')}" data-voice="you"><div class="${el('sk-bubble')}">${b.map(w => use('bone', { width: pct(w) }))}</div>${tools(2)}</div>`
    : html`<div class="${el('sk')}" data-voice="answer"><div class="${el('sk-bubble')}">${b.a.map(w => use('bone', { width: pct(w) }))}${use('bone', { width: '96px', height: '9px', place: 'used' })}${tools(4)}</div></div>`;
  const thread = loading
    ? html`<div class="${el('thread')}" data-hook="thread" role="status"><span class="${el('vh')}">${c.loading} ${day.long || ''}</span><div class="${el('skeleton')}" aria-hidden="true">${BONES.map(bone)}</div></div>`
    : html`<div class="${el('thread')}" data-hook="thread">${sessions.map(session)}</div>`;
  const asks = qs => html`<ul class="${el('asks')}">${qs.map(q => html`<li><button class="${el('ask')}" type="button" data-hook="ask">${q}</button></li>`)}</ul>`;
  const leadSlot = !lead || loading || past ? ''
    : lead.kind === 'hello' ? html`<p class="${el('hello')}">${c.hello}</p>${asks(lead.asks || [])}`
    : lead.kind === 'instead' ? html`<p class="${el('try')}">${c.instead}</p>${asks(lead.asks || [])}`
    : lead.kind === 'failed' ? html`<p class="${el('note')}" role="status"><b>${c.failedWord}</b> ${c.failed}</p>` : '';
  const foot = use('composer', {
    form: 'chat', place: 'foot', note: c.note, label: loading ? `${c.loading} ${day.long || ''}…` : c.label, value: composer.value || '', waiting: loading,
    readonly: past, readonlyText: c.readonly, todayLabel: c.backToday, ...(todayHref ? { todayHref } : {}), fieldId: composer.fieldId || 'aj-ask',
  }, { lead: leadSlot });
  return html`<section class="aj-s-chat" data-module="chat"${attrs({ 'aria-label': day.long ? `Ask, ${day.long}` : 'Ask', 'data-state': loading ? 'loading' : false, 'data-day': past ? 'past' : false })}>${head}${thread}${foot}</section>`;
}
