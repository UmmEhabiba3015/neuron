// srowlink: <SettingsRow label value why href /> in the developers' code.
// A row with no href is read only: the same row as a div (the settings pages' privacy list).
export default function render({ label = '', value = '', why = '', href = '' } = {}, slots, { html, raw }) {
  const note = why ? html`<span class="aj-c-srowlink__why">${why}</span>` : '';
  const val = value ? html`<span class="aj-c-srowlink__value">${value}</span>` : '';
  const inner = html`<span class="aj-c-srowlink__label">${label}${note}</span>${val}`;
  return href ? html`<a class="aj-c-srowlink" href="${href}">${inner}</a>` : html`<div class="aj-c-srowlink">${inner}</div>`;
}
