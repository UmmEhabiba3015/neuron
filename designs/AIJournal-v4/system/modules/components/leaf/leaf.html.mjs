// leaf: <Leaf form number kicker date line big words sign back picture foot /> in the developers' code.
// A leaf of the Reflections booklet (v4 C3, explore booklet-feel f-mix): the kicker and the leaf's date on one
// line, the week's line or the note's big number, the picture, the words at the foot, the foot, the number.
export default function render({ form = 'week', number = '', kicker = '', date = '', line = '', big = [], words = '', sign = 'Your journal', back = null } = {}, slots = {}, { html, attrs, el }) {
  const no = html`<p class="${el('no')}" aria-hidden="true">${number}</p>`;
  if (form === 'end') {
    return html`<section class="aj-c-leaf" data-form="end"><p class="${el('sign')}">${sign}</p>${back ? html`<a class="${el('back')}" href="${back.href}">${back.label}</a>` : ''}${no}</section>`;
  }
  const head = kicker ? html`<div class="${el('head')}"><p class="${el('kicker')}">${kicker}</p>${date ? html`<p class="${el('date')}">${date}</p>` : ''}</div>` : '';
  const top = form === 'note'
    ? html`<p class="${el('big')}">${big.map(b => html`${b.n}<small>${b.unit}</small>`)}</p>`
    : line ? html`<h2 class="${el('line')}">${line}</h2>` : '';
  const picture = slots.picture && slots.picture.text ? slots.picture : '';
  const say = words ? html`<p class="${el('words')}">${words}</p>` : '';
  const foot = slots.foot && slots.foot.text ? html`<div class="${el('foot')}">${slots.foot}</div>` : '';
  return html`<section class="aj-c-leaf"${attrs({ 'data-form': form })}>${head}${top}${picture}${say}${foot}${no}</section>`;
}
