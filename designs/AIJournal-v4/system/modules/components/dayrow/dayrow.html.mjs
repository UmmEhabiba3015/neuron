// dayrow: <DayRow date="Sun 9" datetime="2026-08-09">…</DayRow> in the developers' code.
export default function render({ date = '', datetime = '' } = {}, slots = {}, { html }) {
  return html`<div class="aj-c-dayrow">
  <div class="aj-c-dayrow__date" data-hook="date">${date ? html`<time datetime="${datetime}">${date}</time>` : ''}</div>
  <div class="aj-c-dayrow__body">${slots.children}</div>
</div>`;
}
