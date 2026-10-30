// sheet: <Sheet tag>{children}</Sheet> in the developers' code.
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
// The rows go straight in; the sheet rules off every row after the first.
export default function render({ tag = 'main', form = 'plain' } = {}, slots = {}, { html, raw }) {
  const t = tag === 'div' ? 'div' : 'main';
  return html`${raw(`<${t} class="aj-c-sheet"${form === 'plain' ? '' : ` data-form="${form}"`}>`)}${slots.children}${raw(`</${t}>`)}`;
}
