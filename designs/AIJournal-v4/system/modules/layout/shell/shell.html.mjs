// shell: <Shell surface layout clip>{children}</Shell> in the developers' code.
// data-surface, data-layout, data-motion and data-clip are written only when they aren't the default.
export default function render({ surface = 'notebook', layout = 'single', motion = 'none', clip = false } = {}, slots = {}, { html, attrs }) {
  return html`<div class="aj-l-shell"${attrs({ 'data-surface': surface !== 'notebook' ? surface : false, 'data-layout': layout !== 'single' ? layout : false, 'data-motion': motion !== 'none' ? motion : false, 'data-clip': clip ? true : false })}>${slots.children}</div>`;
}
