// keybox: <Keybox keyLabel value date valueTag /> in the developers' code.
// date (data-date, on the box) says whether the value is written by hand or printed (data-printed on the
// value). The value carries the hook `date` (the masthead date the runtime reads).
export default function render({ key = '', value = '', date = 'printed', valueTag = 'span' } = {}, slots, { html, raw, attrs }) {
  const tag = raw(valueTag === 'h1' ? 'h1' : 'span');
  const written = date === 'hand' ? 'hand' : 'printed';
  return html`<div class="aj-c-keybox" data-date="${written}"><span class="aj-c-keybox__key">${key}</span><${tag} class="aj-c-keybox__value" data-hook="date"${attrs({ 'data-printed': written === 'printed' ? true : false })}>${value}</${tag}></div>`;
}
