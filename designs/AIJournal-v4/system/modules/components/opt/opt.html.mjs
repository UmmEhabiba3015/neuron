// opt: <Opt label pressed onChange /> in the developers' code. The runtime toggles aria-pressed.
export default function render({ label = '', pressed = false, form = 'plain' } = {}, slots, { html, attrs }) {
  return html`<button class="aj-c-opt" type="button"${attrs({ 'data-form': form === 'plain' ? false : form, 'aria-pressed': pressed ? 'true' : 'false' })}><span class="aj-c-opt__tick" aria-hidden="true"></span>${form === 'compact' ? html`<span>${label}</span>` : html` ${label}`}</button>`;
}
