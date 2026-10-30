// said: <Said label note open>{foot}</Said> in the developers' code.
// Shut by default (details/summary, no script); open shows the note without its details.
export default function render({ label = '', ariaLabel = '', note = '', open = false, expanded = false } = {}, slots = {}, { html, attrs }) {
  const foot = slots.foot && slots.foot.text ? html`<div class="aj-c-said__foot">${slots.foot}</div>` : '';
  const inner = html`<div class="aj-c-said__note"><p>${note}</p>${foot}</div>`;
  const body = open
    ? html`<div class="aj-c-said__body"${attrs({ 'data-open': true })}>${inner}</div>`
    : html`<div class="aj-c-said__body"><details${attrs({ open: expanded })}><summary><span class="aj-c-said__labels"><span class="aj-c-said__lbl" data-label="shut">Read the note</span><span class="aj-c-said__lbl" data-label="open">Hide the note</span></span><svg class="aj-c-said__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary>${inner}</details></div>`;
  return html`<aside class="aj-c-said" aria-label="${ariaLabel || label}"><div class="aj-c-said__label">${label}</div>${body}</aside>`;
}
