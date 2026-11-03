// thumbs: <Thumbs id form rating asking labels onRate /> in the developers' code.
// Helpful and Not helpful, one at a time (v4 C2, Ask's; v4 round 10, a note's too). The thumbs down carries the
// thumbs-down form (rateform), hidden until pressed. form tools (Ask): no box, the thumbs are items of the parent's
// tools row. form pair (a note's foot): a small row of its own. In both the form is one line in the row, after the
// thumbs down (v4 round 10), never over the thread or the list.
import { THUMB_UP, THUMB_DOWN } from '../../../content/icons.mjs';
const WORDS = { up: 'Helpful', down: 'Not helpful' };
export default function render({ id = '', form = 'tools', rating = 'none', asking = false, labels = {} } = {}, slots, { html, raw, attrs, use }) {
  const w = { ...WORDS, ...labels };
  // asking: the form drawn open without the script (the pages' comps), its thumb expanded
  const thumb = (k, glyph) => use('button', { grade: 'quiet', form: 'icon', tool: k, label: w[k], pressed: k === rating, ...(k === 'down' && asking ? { attrs: { 'aria-expanded': 'true' } } : {}) }, { icon: raw(glyph) });
  const why = use('rateform', { id: `${id}-why`, place: 'rate', attrs: { hidden: !asking } });
  return html`<span class="aj-c-thumbs"${attrs({ 'data-module': 'thumbs', 'data-form': form === 'pair' ? 'pair' : false })}>${thumb('up', THUMB_UP)}${thumb('down', THUMB_DOWN)}${why}</span>`;
}
