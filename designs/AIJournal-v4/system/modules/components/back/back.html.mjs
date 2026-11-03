// back: <Back label="You" href="…" /> in the developers' code. In the product it is history back.
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
export default function render({ label = '', href = '#' } = {}, slots, { html, raw }) {
  return html`<a class="aj-c-back" href="${href}">${raw(CHEVRON)}${label}</a>`;
}
