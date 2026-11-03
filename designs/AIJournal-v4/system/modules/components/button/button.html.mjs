// button: <Button grade form href label>{icon}</Button> in the developers' code.
// A link when href is given, a button element otherwise; both render identically. disabled only on
// a button element, and only for the microphone exception (the compact recorder's transport).
// The toggle's eye (the password field's show/hide): the button's own drawing, with its slash part.
const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12c2.4-3.5 5.5-5.25 9.5-5.25s7.1 1.75 9.5 5.25c-2.4 3.5-5.5 5.25-9.5 5.25S4.9 15.5 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/><path class="aj-c-button__slash" d="M3 3l18 18"/></svg>';
export default function render({ grade = 'solid', form = 'text', href, label = '', disabled = false, checked = false, tool, pressed = false, count, expanded } = {}, slots, { html, raw, attrs }) {
  // The switch: a button element with role=switch, never a link (href is ignored). The grade does not apply, so none is written.
  if (form === 'switch') return html`<button class="aj-c-button"${attrs({ 'data-form': 'switch', type: 'button', role: 'switch', 'aria-checked': checked ? 'true' : 'false' })}><span class="aj-c-button__label">${label}</span><i class="aj-c-button__track" aria-hidden="true"></i></button>`;
  // The pill (v4 C2): a round button, an optional icon, the word, an optional count. The grade does not apply, so none is written.
  if (form === 'pill') {
    const icon = slots.icon && slots.icon.text ? slots.icon : '';
    const counted = typeof count === 'number';
    const body = html`${icon}<span class="aj-c-button__label">${label}</span>${counted ? html`<span class="aj-c-button__count"${attrs({ 'data-zero': count === 0 })}>${String(count)}</span>` : ''}`;
    const open = expanded === undefined || expanded === null ? false : expanded ? 'true' : 'false';
    if (href) return html`<a class="aj-c-button"${attrs({ 'data-form': 'pill', href, 'aria-expanded': open })}>${body}</a>`;
    return html`<button class="aj-c-button"${attrs({ 'data-form': 'pill', type: 'button', 'aria-expanded': open })}>${body}</button>`;
  }
  // A message tool (icon form with tool): always a button element (href is ignored). bookmark, up and down write
  // aria-pressed; copy none; down also writes aria-expanded (the disclosure of its form, which its parent opens).
  if (form === 'icon' && tool) {
    const toggles = tool !== 'copy';
    return html`<button class="aj-c-button"${attrs({ 'data-grade': grade, 'data-form': 'icon', 'data-tool': tool, type: 'button', 'aria-label': label, 'aria-pressed': toggles ? (pressed ? 'true' : 'false') : false, 'aria-expanded': tool === 'down' ? 'false' : false })}>${slots.icon && slots.icon.text ? slots.icon : ''}</button>`;
  }
  const glyph = form === 'icon' || form === 'toggle';
  const common = {
    'data-grade': grade,
    'data-form': form === 'text' ? false : form,
    'aria-label': glyph ? label : false,
  };
  const content = glyph ? (slots.icon && slots.icon.text ? slots.icon : form === 'toggle' ? raw(EYE) : '') : label;
  if (href) return html`<a class="aj-c-button"${attrs({ ...common, href })}>${content}</a>`;
  return html`<button class="aj-c-button"${attrs({ ...common, type: 'button', 'aria-pressed': form === 'toggle' ? 'false' : false, disabled: disabled || false })}>${content}</button>`;
}
