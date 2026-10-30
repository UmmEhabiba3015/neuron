// A small CSS tokenizer and parser for the module checks and build. No packages: it reads
// comments, strings, url(), blocks and declarations well enough to check selectors, values
// and layers, and it never rewrites CSS (the build wraps module files as they are).
//
//   parseCss(text)          -> [{ type:'rule', selector, decls, line, before }, { type:'at', name, prelude, children|null, line, before }]
//   parseSelectorList(sel)  -> [[{ combinator, compound, classes, types, attrs, ids, pseudos, inner }]]
//   walk(nodes, fn)         -> calls fn(node, atStack) for every rule, with the enclosing at-rules
//
// `before` holds the comments directly in front of a rule; a declaration's `comments` hold the
// comments inside it or right after it on the same line (how `/* token-exempt: … */` is read).

export function parseCss(text) {
  let i = 0, line = 1;
  const n = text.length;
  const lineAt = pos => { for (; scanPos < pos; scanPos++) if (text[scanPos] === '\n') scanLine++; return scanLine; };
  let scanPos = 0, scanLine = 1;

  // Reads a prelude or declaration up to one of the stop characters at depth 0, collecting
  // comments separately. Returns { text, comments, stop }.
  function readUntil(stops) {
    let out = '', comments = [], depth = 0;
    while (i < n) {
      const c = text[i];
      if (c === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        if (end < 0) throw new CssError('Unclosed comment', lineAt(i));
        comments.push({ text: text.slice(i + 2, end).trim(), line: lineAt(i) });
        out += ' '; i = end + 2; continue;
      }
      if (c === '"' || c === "'") {
        const start = i++; while (i < n && text[i] !== c) { if (text[i] === '\\') i++; if (text[i] === '\n') throw new CssError('Unclosed string', lineAt(i)); i++; }
        i++; out += text.slice(start, i); continue;
      }
      if (c === '\\') { out += text.slice(i, i + 2); i += 2; continue; }
      if (c === '(' || c === '[') depth++;
      if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
      if (depth === 0 && stops.includes(c)) return { text: out, comments, stop: c };
      out += c; i++;
    }
    return { text: out, comments, stop: null };
  }

  function parseBlock(isTop) {
    const nodes = [];
    let pending = []; // comments seen between items, attached to the next node
    while (i < n) {
      // skip whitespace and collect comments
      if (/\s/.test(text[i])) { i++; continue; }
      if (text[i] === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        if (end < 0) throw new CssError('Unclosed comment', lineAt(i));
        pending.push({ text: text.slice(i + 2, end).trim(), line: lineAt(i) });
        i = end + 2; continue;
      }
      if (text[i] === '}') { if (isTop) throw new CssError('Unexpected }', lineAt(i)); i++; return nodes; }
      const startLine = lineAt(i), start = i;
      const head = readUntil(['{', ';', '}']);
      const prelude = head.text.trim();
      if (head.stop === '{') {
        i++;
        if (prelude.startsWith('@')) {
          const name = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
          const rest = prelude.slice(1 + name.length).trim();
          const children = DECL_AT.has(name) ? parseDecls() : parseBlock(false);
          nodes.push({ type: 'at', name, prelude: rest, children, decls: DECL_AT.has(name) ? children : null, line: startLine, start, end: i, before: pending.concat(head.comments) });
        } else {
          // start, open and end: offsets of the selector, its { and the char after its }, for tools that
          // rewrite a stylesheet in place (tools/convert/prep-round.mjs).
          const open = i - 1, decls = parseDecls();
          nodes.push({ type: 'rule', selector: prelude, decls, line: startLine, start, open, end: i, before: pending.concat(head.comments) });
        }
        pending = [];
      } else if (head.stop === ';' || head.stop === null) {
        if (head.stop === ';') i++;
        if (prelude.startsWith('@')) {
          const name = prelude.slice(1).split(/[\s(;]/)[0].toLowerCase();
          nodes.push({ type: 'at', name, prelude: prelude.slice(1 + name.length).trim(), children: null, line: startLine, before: pending });
        } else if (prelude) {
          throw new CssError(`Declaration outside a rule: ${prelude.slice(0, 60)}`, startLine);
        }
        pending = [];
      } else if (head.stop === '}') {
        if (prelude) throw new CssError(`Unexpected } after ${prelude.slice(0, 60)}`, startLine);
      }
    }
    if (!isTop) throw new CssError('Unclosed block', lineAt(i));
    return nodes;
  }

  // Declarations inside a rule. Nested rules (CSS nesting) are not used in this system and are
  // reported as an error so they can't slip past the selector checks.
  function parseDecls() {
    const decls = [];
    while (i < n) {
      if (/\s/.test(text[i])) { i++; continue; }
      if (text[i] === '}') { i++; return decls; }
      const startLine = lineAt(i);
      const d = readUntil([';', '}', '{']);
      if (d.stop === '{') throw new CssError(`Nested rule inside a declaration block: ${d.text.trim().slice(0, 60)}`, startLine);
      if (d.stop === ';') i++;
      // comments right after the semicolon on the same line belong to this declaration
      const trailing = [];
      let j = i;
      while (j < n && (text[j] === ' ' || text[j] === '\t')) j++;
      if (text[j] === '/' && text[j + 1] === '*') {
        const end = text.indexOf('*/', j + 2);
        if (end >= 0) { trailing.push({ text: text.slice(j + 2, end).trim(), line: lineAt(j) }); i = end + 2; }
      }
      const raw = d.text.trim();
      if (!raw) { if (d.comments.length && decls.length) decls[decls.length - 1].comments.push(...d.comments); continue; }
      const colon = raw.indexOf(':');
      if (colon < 0) throw new CssError(`Not a declaration: ${raw.slice(0, 60)}`, startLine);
      let value = raw.slice(colon + 1).trim();
      const important = /!\s*important\s*$/i.test(value);
      if (important) value = value.replace(/!\s*important\s*$/i, '').trim();
      const name = raw.slice(0, colon).trim();
      decls.push({ prop: name.startsWith('--') ? name : name.toLowerCase(), value, important, comments: d.comments.concat(trailing), line: startLine });
    }
    throw new CssError('Unclosed declaration block', lineAt(i));
  }

  return parseBlock(true);
}

// At-rules whose block holds declarations rather than rules.
const DECL_AT = new Set(['font-face', 'property', 'page', 'counter-style', 'font-palette-values', 'view-transition']);

export class CssError extends Error {
  constructor(message, line) { super(`line ${line}: ${message}`); this.line = line; }
}

export function walk(nodes, fn, stack = []) {
  for (const node of nodes) {
    if (node.type === 'rule') fn(node, stack);
    else if (node.type === 'at') {
      fn(node, stack);
      if (node.children && !node.decls) walk(node.children, fn, [...stack, node]);
    }
  }
}

// Splits on a character at depth 0 (outside (), [] and strings).
export function splitTop(text, sep) {
  const parts = []; let depth = 0, quote = null, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === sep && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts;
}

// One complex selector -> a list of compounds, each with the combinator that precedes it.
// `classes` are the compound's own top-level classes; `inner` collects classes found inside
// functional pseudo-classes (:is, :where, :has, :not), which still count as references.
export function parseComplex(selector) {
  const out = [];
  let i = 0; const s = selector.trim(); let combinator = null; let buf = '';
  const flush = () => { if (buf.trim()) { out.push({ combinator, ...parseCompound(buf.trim()) }); combinator = null; } buf = ''; };
  let depth = 0, quote = null;
  for (; i < s.length; i++) {
    const c = s[i];
    if (quote) { buf += c; if (c === '\\') { buf += s[++i]; } else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === '\\') { buf += c + s[++i]; continue; }
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (depth === 0 && (c === '>' || c === '+' || c === '~')) { flush(); combinator = c; continue; }
    if (depth === 0 && /\s/.test(c)) {
      // whitespace is a descendant combinator unless next to an explicit one
      let j = i; while (j < s.length && /\s/.test(s[j])) j++;
      if (buf.trim() && !'>+~'.includes(s[j])) { flush(); combinator = ' '; }
      i = j - 1; continue;
    }
    buf += c;
  }
  flush();
  return out;
}

export function parseSelectorList(selector) {
  return splitTop(selector, ',').map(parseComplex);
}

function parseCompound(text) {
  const classes = [], types = [], ids = [], attrs = [], pseudos = [], inner = [];
  let i = 0;
  const ident = () => { let m = ''; while (i < text.length && /[\w\-\\ -￿]/.test(text[i])) { if (text[i] === '\\') { m += text[i + 1]; i += 2; } else m += text[i++]; } return m; };
  while (i < text.length) {
    const c = text[i];
    if (c === '.') { i++; classes.push(ident()); }
    else if (c === '#') { i++; ids.push(ident()); }
    else if (c === '[') { const end = matching(text, i, '[', ']'); attrs.push(text.slice(i + 1, end)); i = end + 1; }
    else if (c === ':') {
      const el = text[i + 1] === ':'; i += el ? 2 : 1;
      const name = ident().toLowerCase(); let arg = null;
      if (text[i] === '(') { const end = matching(text, i, '(', ')'); arg = text.slice(i + 1, end); i = end + 1; }
      pseudos.push({ name, element: el, arg });
      if (arg && ['is', 'where', 'has', 'not', 'host', 'host-context', 'slotted', 'nth-child', 'nth-last-child'].includes(name)) {
        for (const complex of parseSelectorList(arg.replace(/^\s*[+~>]/, '').replace(/^.*?\bof\b/, ''))) for (const comp of complex) { inner.push(...comp.classes, ...comp.inner); }
      }
    }
    else if (c === '*') { types.push('*'); i++; }
    else if (/[a-zA-Z]/.test(c)) types.push(ident().toLowerCase());
    else i++;
  }
  return { text, classes, types, ids, attrs, pseudos, inner };
}

function matching(text, start, open, close) {
  let depth = 0, quote = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return i;
  }
  return text.length - 1;
}

// var(--name) references in a value, in order.
export const varRefs = value => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
