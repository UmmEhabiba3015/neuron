// srow: <SRow time="09:20" datetime="2026-08-09T09:20">…</SRow> in the developers' code. Without time there is no column (index pages).
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
export default function render({ time = '', datetime = '', bareTime = false } = {}, slots = {}, { html, attrs }) {
  const column = !time ? '' : bareTime ? html`<div class="aj-c-srow__time">${time}</div>` : html`<div class="aj-c-srow__time"><time${attrs({ datetime: datetime || false })}>${time}</time></div>`;
  return html`<div class="aj-c-srow">${column}<div class="aj-c-srow__body">${slots.children}</div></div>`;
}
