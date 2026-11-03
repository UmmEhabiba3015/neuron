// Code samples generated from the modules, so the markup a guide shows developers can't drift
// from what the modules render. In a guide's source, inside a code block (escaped HTML), write
//   {{sample <module>/<fixture> [attr="value" …]}}
// and fillSamples() replaces it with that fixture's rendered markup: escaped for display,
// one element per line where it has element children, indented to the placeholder's column, and
// with any extra attributes added to its root element (a runtime hook like
// data-journal-component="mood"). Hand-written markup around a placeholder stays as written.
import { loadConfig, discoverModules } from './system.mjs';
import { makeRenderer, loadFixtures } from './build.mjs';
import { escape } from './html.mjs';

const TOKEN = /\{\{sample ([\w-]+)\/([^}\s][^}]*?)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\}\}/g;
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

// Indents rendered markup: an element whose content holds other elements opens its own lines;
// one holding only text (a label, a button) stays on one line. Inline SVG is kept whole.
export function format(markup, indent = '') {
  const tokens = markup.match(/<svg\b[\s\S]*?<\/svg>|<!--[\s\S]*?-->|<\/?[a-z][^>]*>|[^<]+/gi) || [];
  const lines = []; let depth = 0, line = '';
  const flush = () => { if (line.trim()) lines.push(indent + '  '.repeat(depth) + line.trim()); line = ''; };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const open = /^<([a-z][\w-]*)/i.exec(t), close = /^<\/([a-z][\w-]*)/i.exec(t);
    if (open && !/^<svg/i.test(t) && !VOID.has(open[1].toLowerCase()) && !t.endsWith('/>')) {
      // Find this element's content; one line if it holds no element.
      let j = i + 1, d = 1, hasChild = false;
      for (; j < tokens.length && d; j++) { if (/^<[a-z]/i.test(tokens[j]) && !VOID.has((/^<([a-z][\w-]*)/i.exec(tokens[j]) || [])[1]?.toLowerCase())) { if (!/^<svg/i.test(tokens[j])) d++; hasChild = true; } else if (/^<\//.test(tokens[j])) d--; else if (/^<(svg|[a-z])/i.test(tokens[j])) hasChild = true; }
      if (!hasChild) { flush(); line = tokens.slice(i, j).join(''); flush(); i = j - 1; continue; }
      flush(); line = t; flush(); depth++; continue;
    }
    if (close) { flush(); depth = Math.max(0, depth - 1); line = t; flush(); continue; }
    line += t; if (open || /^<svg/i.test(t)) flush();
  }
  flush();
  return lines.join('\n');
}

const addAttrs = (markup, extra) => extra.trim() ? markup.replace(/^(<[a-z][^>]*?)(\/?>)/i, `$1 ${extra.trim()}$2`) : markup;

// Fills every placeholder in text. Returns { text, used: [{ module, fixture }] }; throws on a
// module or fixture that doesn't exist, so a renamed fixture fails the build, not the reader.
export async function fillSamples(text, root) {
  if (!TOKEN.test(text)) return { text, used: [] };
  TOKEN.lastIndex = 0;
  const cfg = loadConfig(root);
  const modules = discoverModules(cfg);
  const renderer = await makeRenderer(cfg, modules);
  const fixtures = new Map();
  const used = [];
  let out = '', last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const [whole, name, fixtureName, extra] = m;
    const mod = modules.find(x => x.name === name);
    if (!mod) throw new Error(`sample: no module "${name}"`);
    if (!fixtures.has(name)) fixtures.set(name, await loadFixtures(mod, renderer));
    const f = fixtures.get(name).find(x => x.name === fixtureName.trim());
    if (!f) throw new Error(`sample: module "${name}" has no fixture "${fixtureName.trim()}"`);
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    // Indent to the placeholder's column only when it starts its line (not right after <code>).
    const before = text.slice(lineStart, m.index), indent = /^\s*$/.test(before) ? before : '';
    const markup = addAttrs(String(renderer.render(name, f.props || {}, f.slots || {})), extra);
    // The first line takes the placeholder's place, so it carries no indent of its own.
    out += text.slice(last, m.index) + escape(format(markup, indent)).replace(new RegExp(`^${indent}`), '');
    last = m.index + whole.length;
    used.push({ module: name, fixture: f.name });
  }
  return { text: out + text.slice(last), used };
}
