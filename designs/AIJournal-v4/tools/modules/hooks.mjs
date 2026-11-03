// The hook check (decision 2026-10-12): the app runtime reaches modules only through their public
// surface. For each runtime script (design-ci.json system.runtime), every selector it queries, every
// class it reads or writes, every data attribute it reads or writes, and every class written into
// markup it builds, checked against what the contracts declare:
//   classes: a module's root class may be read (found); nothing else. A part class or a legacy class
//            is internal; a class written into markup means the script builds a module's structure,
//            which the module renders instead (a build-time <template data-template>).
//   attributes: data-module, data-place, data-template, the context attributes (system.contexts), each
//            module's variants (data-<variant>), and behaviour.state and behaviour.hooks; ARIA, role and
//            the standard HTML attributes. Any other data-* is undeclared.
//   [data-hook~="name"]: the name must be some module's behaviour.hooks entry.
// The result is a list per script; design-ci.json system.runtimeHooks says whether it fails ("fail")
// or is reported ("report").
import { parseSelectorList } from './css.mjs';
import { moduleClassPattern } from './system.mjs';

const STANDARD = new Set(['id', 'class', 'style', 'href', 'src', 'alt', 'title', 'lang', 'dir', 'hidden', 'type', 'name', 'value', 'for',
  'open', 'disabled', 'checked', 'selected', 'required', 'readonly', 'placeholder', 'tabindex', 'role', 'inert', 'datetime', 'download',
  'autocomplete', 'minlength', 'maxlength', 'min', 'max', 'step', 'pattern', 'rows', 'cols', 'width', 'height', 'viewbox', 'd', 'fill',
  'stroke', 'focusable', 'xmlns', 'action', 'method', 'novalidate', 'controls', 'preload', 'contenteditable', 'spellcheck', 'loading']);
const kebab = s => s.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

// cfg.runtimeOwn: the app's own markup, not any module's (the prototype's screens, its feedback line,
// the motion-review switch on <html>): { classes: [...], attributes: [...] }, each with a reason.
export function declaredSurface(modules, cfg) {
  const own = cfg.runtimeOwn || {};
  const attrs = new Set(['data-module', 'data-place', 'data-template', 'data-hook', ...Object.keys(cfg.contexts || {}), ...Object.keys(own.attributes || {})]);
  const hooks = new Set(), roots = new Set(Object.keys(own.classes || {}));
  for (const m of modules) {
    roots.add(m.root);
    const c = m.contract || {};
    for (const v of Object.keys(c.variants || {})) attrs.add(`data-${kebab(v)}`);
    for (const a of Object.keys(c.behaviour?.state || {})) attrs.add(a);
    for (const h of Object.keys(c.behaviour?.hooks || {})) { if (h.startsWith('data-')) attrs.add(h); else hooks.add(h); }
  }
  return { attrs, hooks, roots, pattern: moduleClassPattern(cfg) };
}

// String literals (template literals with their ${} filled by a placeholder), with their line.
function literals(src) {
  const out = [];
  const re = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/gs;
  for (let m; (m = re.exec(src));) {
    const line = src.slice(0, m.index).split('\n').length;
    out.push({ text: m[2].replace(/\$\{[^}]*\}/g, 'X'), line, at: m.index, quote: m[1] });
  }
  return out;
}

export function checkRuntime(src, file, surface) {
  const found = [];
  const add = (line, kind, what, why) => found.push({ file, line, kind, what, why });
  const lineAt = i => src.slice(0, i).split('\n').length;
  const checkClass = (line, cls, kind) => {
    if (surface.roots.has(cls)) return;
    const mod = cls.match(surface.pattern);
    add(line, kind, `.${cls}`, mod ? 'a module part class: internal to the module (use a declared hook)' : 'a legacy class (use the module class, a hook or a state attribute)');
  };
  const checkAttr = (line, name, kind) => {
    name = name.toLowerCase();
    if (!name.startsWith('data-')) { if (!(STANDARD.has(name) || name.startsWith('aria-') || name.startsWith('on'))) add(line, kind, `[${name}]`, 'not a standard attribute'); return; }
    if (!surface.attrs.has(name)) add(line, kind, `[${name}]`, 'a data attribute no contract declares');
  };
  // 1. selectors given to the DOM
  // A selector helper ($('…'), as the recorder runtime defines one) is a query too.
  for (const m of src.matchAll(/(?:\.(?:querySelector|querySelectorAll|closest|matches)|(?<![\w$.])\$)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*?)\1/gs)) {
    const line = lineAt(m.index), sel = m[2].replace(/\$\{[^}]*\}/g, 'X');
    let list; try { list = parseSelectorList(sel); } catch { add(line, 'query', sel, 'unparsed selector'); continue; }
    for (const complex of list) for (const c of complex) {
      for (const cls of [...c.classes, ...c.inner]) checkClass(line, cls, 'query');
      for (const a of c.attrs) {
        const name = a.match(/^\s*([\w-]+)/)?.[1]; if (!name) continue;
        checkAttr(line, name, 'query');
        const hook = name === 'data-hook' && a.match(/~?=\s*"?([\w-]+)/)?.[1];
        if (hook && !surface.hooks.has(hook)) add(line, 'query', `[data-hook~="${hook}"]`, 'a hook no contract declares');
      }
    }
  }
  // 2. classes read or written through classList, className
  for (const m of src.matchAll(/classList\.(add|remove|toggle|contains|replace)\(([^)]*)\)/g)) {
    for (const s of m[2].matchAll(/(['"`])([\w-]+)\1/g)) checkClass(lineAt(m.index), s[2], m[1] === 'contains' ? 'class read' : 'class write');
  }
  for (const m of src.matchAll(/className\s*=\s*(['"`])([^'"`]*)\1/g)) for (const cls of m[2].split(/\s+/).filter(Boolean)) checkClass(lineAt(m.index), cls, 'class write');
  // 3. data attributes through dataset and the attribute methods
  for (const m of src.matchAll(/\.dataset\.([a-zA-Z]+)/g)) checkAttr(lineAt(m.index), `data-${kebab(m[1])}`, 'attribute');
  for (const m of src.matchAll(/(?:get|set|has|remove|toggle)Attribute\(\s*(['"`])([\w-]+)\1/g)) checkAttr(lineAt(m.index), m[2], 'attribute');
  // 4. markup the script builds as text: its classes and data attributes
  for (const lit of literals(src)) {
    if (!/<[a-z][\w-]*[\s>]/i.test(lit.text)) continue;
    for (const c of lit.text.matchAll(/\sclass=\\?"([^"\\]*)\\?"/g)) for (const cls of c[1].split(/\s+/).filter(Boolean)) if (cls !== 'X') add(lit.line, 'markup', `.${cls}`, 'markup built by the script (the module renders it: a <template data-template>)');
    for (const a of lit.text.matchAll(/\s(data-[\w-]+)=/g)) checkAttr(lit.line, a[1], 'markup');
  }
  return found;
}
