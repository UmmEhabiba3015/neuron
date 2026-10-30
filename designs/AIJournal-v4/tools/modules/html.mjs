// The tagged template render functions use. Interpolated values are escaped unless they are
// already markup (the result of html`` or of rendering another module), so a label can never
// inject tags. Arrays are joined, and null, undefined and false render as nothing.
//
//   html`<p class="aj-c-note">${label}</p>`   -> Markup
//   raw(string)                               -> Markup, unescaped (for authored SVG and fixtures)
//   attrs({ 'data-variant': 'solid', disabled: true, hidden: false })  -> ' data-variant="solid" disabled'

export class Markup {
  constructor(text) { this.text = String(text); }
  toString() { return this.text; }
}

// The apostrophe is not escaped: renders put values in text and double-quoted attributes only, and the
// screens' markup (which generators read with patterns: the header finds "9 Aug '26") has it literal.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escape = value => String(value).replace(/[&<>"]/g, c => ESC[c]);

const piece = value => {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Markup) return value.text;
  if (Array.isArray(value)) return value.map(piece).join('');
  return escape(value);
};

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += piece(v) + strings[i + 1]; });
  return new Markup(out);
}

export const raw = text => new Markup(text);

export function attrs(map) {
  return new Markup(Object.entries(map).map(([k, v]) => {
    if (v === null || v === undefined || v === false) return '';
    if (v === true) return ` ${k}`;
    return ` ${k}="${escape(v)}"`;
  }).join(''));
}
