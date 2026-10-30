// send: <Send /> in the developers' code. The label is final copy, 'Save'; the CSS sets it in caps.
// aria: its accessible name (Save entry); false leaves the label to name it (11's draft).
export default function render({ label = 'Save', aria = 'Save entry' } = {}, slots, { html, attrs }) {
  return html`<button class="aj-c-send" type="button"${attrs({ 'aria-label': aria || false })}>${label}</button>`;
}
