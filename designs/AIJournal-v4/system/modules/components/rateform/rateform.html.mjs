// rateform: <RateForm id question send value onSend onCancel /> in the developers' code.
// The thumbs-down form (v4 C2; one line everywhere since v4 round 10): one row as tall as the thumb's box, the field
// with Send at its end; the question is its placeholder and its name. Shown, placed and cleared by its parent (the
// thumbs). Cancelled by the thumb again, Escape or a press elsewhere.
export default function render({ id = 'why', question = 'What was wrong?', send = 'Send', value = '' } = {}, slots, { html, use, el }) {
  return html`<form class="aj-c-rateform" data-module="rateform" aria-label="${question}"><input class="${el('why')}" id="${id}" type="text" placeholder="${question}" aria-label="${question}" autocomplete="off" data-hook="input" value="${value}">${use('button', { grade: 'quiet', label: send, place: 'send', attrs: { type: 'submit' } })}</form>`;
}
