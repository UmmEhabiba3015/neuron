// notice: <Notice text="…" announce>{action}</Notice> in the developers' code. The action follows the
// text after a space, on the same line.
export default function render({ text = '', announce = false } = {}, slots = {}, { html, attrs }) {
  const action = slots.action && slots.action.text ? html` ${slots.action}` : '';
  return html`<div class="aj-c-notice"${attrs({ role: announce ? 'status' : false })}>${text}${action}</div>`;
}
