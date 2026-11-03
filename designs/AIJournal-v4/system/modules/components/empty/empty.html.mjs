// empty: <Empty text="…" /> in the developers' code.
export default function render({ text = '' } = {}, slots, { html }) {
  return html`<p class="aj-c-empty">${text}</p>`;
}
