// foot: <Foot text="…" /> in the developers' code.
export default function render({ text = '' } = {}, slots, { html }) {
  return html`<p class="aj-c-foot">${text}</p>`;
}
