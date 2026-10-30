// field: <Field label="…" value="…" tag="input|textarea|select|div" placeholder invalid /> in the developers' code.
// The div stand-in is for the no-script comps only; real fields use the placeholder attribute.
export default function render({ label = '', value = '', tag = 'input', form = 'plain', placeholder = false, invalid = false, options = [] } = {}, slots, { html, attrs }) {
  const ph = placeholder ? { 'data-placeholder': true } : {};
  const f = attrs({ 'data-form': form === 'plain' ? false : form });
  if (tag === 'div') return html`<div class="aj-c-field"${attrs(ph)}>${value}</div>`;
  if (tag === 'textarea') return html`<textarea class="aj-c-field"${f} aria-label="${label}">${value}</textarea>`;
  // options: [{ value, label }] (17's timezone list); without them the one value, as before.
  if (tag === 'select') return html`<select class="aj-c-field"${f}${attrs({ 'aria-label': label || false })}>${options.length ? options.map(o => html`<option value="${o.value}"${attrs({ selected: o.selected ? true : false })}>${o.label ?? o.value}</option>`) : html`<option>${value}</option>`}</select>`;
  return html`<input class="aj-c-field"${f} type="text"${attrs({ 'aria-label': label || false, value: value || false, 'aria-invalid': invalid ? 'true' : false })}>`;
}
