// mark: <Mark label="…" glyph="lock" /> in the developers' code.
const LOCK = '<svg class="aj-c-mark__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
export default function render({ label = '', glyph = 'lock' } = {}, slots, { html, raw }) {
  return html`<span class="aj-c-mark">${glyph === 'lock' ? raw(LOCK) : false}${label}</span>`;
}
