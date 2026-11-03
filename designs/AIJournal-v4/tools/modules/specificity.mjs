// Specificity drops: when a selector is rewritten one class lighter, a rule in the same layer that
// sets the same property on the same elements can start to win (fc87ae2: `.page.split > .aj-c-panel
// > *` became `[data-layout="split"] > .aj-c-panel > *`, and the panel's own
// `.aj-c-panel > [data-place~="block"]` margin then won by order). Static and conservative: it lists
// the rules that may now win, for a person to read, before any check runs.
//
//   collectRules(files)                       files: [{ file, text }] -> rules in their layers
//   specificityDrops(pairs, rules)            pairs: [{ file, old, now, props, line }] -> findings
import { parseCss, parseSelectorList, splitTop, walk } from './css.mjs';

// ---- specificity -------------------------------------------------------------------------------
export function specificity(complex) {
  const s = [0, 0, 0];
  for (const c of typeof complex === 'string' ? parseSelectorList(complex)[0] : complex) add(s, compound(c));
  return s;
}
function compound(c) {
  const s = [c.ids.length, c.classes.length + c.attrs.length, c.types.filter(t => t !== '*').length];
  for (const p of c.pseudos) {
    if (p.element) s[2]++;
    else if (p.name === 'where') continue;
    else if (['is', 'not', 'has', 'matches'].includes(p.name) && p.arg) add(s, maxOf(p.arg));
    else if (['nth-child', 'nth-last-child'].includes(p.name)) { s[1]++; const of = p.arg?.match(/\bof\b(.*)$/s); if (of) add(s, maxOf(of[1])); }
    else s[1]++;
  }
  return s;
}
const maxOf = list => parseSelectorList(list.replace(/^\s*[+~>]/, '')).map(x => specificity(x)).reduce((a, b) => (cmp(a, b) >= 0 ? a : b), [0, 0, 0]);
const add = (a, b) => { a[0] += b[0]; a[1] += b[1]; a[2] += b[2]; };
export const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
export const specText = s => `(${s.join(',')})`;

// ---- properties that touch the same thing --------------------------------------------------------
const SIDES = { inline: ['left', 'right', 'inline-start', 'inline-end'], block: ['top', 'bottom', 'block-start', 'block-end'] };
function expand(prop) {
  const out = new Set([prop]);
  const m = prop.match(/^(margin|padding|inset|border|scroll-margin|scroll-padding)(?:-(inline|block))?$/);
  if (m) {
    const base = m[1] === 'inset' ? '' : m[1] + '-';
    for (const axis of m[2] ? [m[2]] : ['inline', 'block']) { out.add(`${m[1]}-${axis}`); for (const side of SIDES[axis]) out.add(m[1] === 'inset' ? side : base + side); }
  }
  return out;
}
export function overlaps(a, b) {
  if (a === b) return true;
  if (a.startsWith(b + '-') || b.startsWith(a + '-')) return true;   // margin / margin-top, border-top / border-top-width
  const ea = expand(a), eb = expand(b);
  for (const x of ea) if (eb.has(x)) return true;
  return false;
}

// ---- may two selectors match one element ---------------------------------------------------------
// Conservative: the subjects don't contradict (two different types, two modules' roots, one attribute
// with two exact values), and the selectors share a class or attribute somewhere (an anchor), so an
// unrelated rule elsewhere in the layer isn't listed.
const norm = s => s.replace(/\s+/g, '');
const exactAttrs = c => new Map(c.attrs.map(a => a.match(/^\s*([\w-]+)\s*=\s*"?([^"\]]*)"?\s*$/)).filter(Boolean).map(m => [m[1], m[2]]));
const isModuleClass = cls => /^[a-z]+-[lcsp]-[a-z0-9-]+(__[\w-]+)?$/.test(cls);
const simple = c => [...c.classes.map(x => '.' + x), ...c.attrs.map(x => `[${norm(x)}]`)];
// :not() of one simple selector: what the compound says the element is not.
const negated = c => c.pseudos.filter(p => p.name === 'not' && p.arg && /^\s*(\.[\w-]+|\[[^\]]+\])\s*$/.test(p.arg)).map(p => norm(p.arg).replace(/^\[(.*)\]$/, (m, x) => `[${x}]`));
function subjectsClash(a, b) {
  const ta = a.types.filter(t => t !== '*'), tb = b.types.filter(t => t !== '*');
  if (ta.length && tb.length && ta[0] !== tb[0]) return true;
  // two modules' classes (a root or a part) that the two subjects don't share: different elements
  const ma = a.classes.filter(isModuleClass), mb = b.classes.filter(isModuleClass);
  if (ma.length && mb.length && !ma.some(x => mb.includes(x))) return true;
  const xa = exactAttrs(a), xb = exactAttrs(b);
  for (const [k, v] of xa) if (xb.has(k) && xb.get(k) !== v) return true;
  const sa = simple(a), sb = simple(b);
  if (negated(a).some(x => sb.includes(x)) || negated(b).some(x => sa.includes(x))) return true;
  return false;
}
// Anchors: the subject's own classes and attributes, and its ancestors' classes apart, so a class on
// the element itself never pairs with the same class on another rule's ancestor. An ancestor's
// attribute is no anchor: context attributes sit on the stage and shell, above everything.
const anchors = complex => new Set([...simple(complex[complex.length - 1]).map(x => 'self' + x), ...complex.slice(0, -1).flatMap(c => c.classes).map(x => 'up.' + x)]);
export function mayMatchSame(a, b) {
  if (subjectsClash(a[a.length - 1], b[b.length - 1])) return false;
  const B = anchors(b);
  return [...anchors(a)].some(x => B.has(x));
}

// ---- the rules of a set of stylesheets, by layer -------------------------------------------------
// A module file's layer is its folder's (the build wraps it); in other files, the enclosing @layer.
// Generated blocks (/* X START ... X END */) are left out: their sources are read instead.
export function stripGenerated(text) {
  return text.replace(/\/\*\s*([A-Z][A-Z ]*?) START\b[\s\S]*?\/\*\s*\1 END\s*\*\//g, m => m.replace(/[^\n]/g, ' '));
}
export function collectRules(files) {
  const rules = [];
  for (const { file, text } of files) {
    const fixed = (file.match(/(?:^|\/)modules\/(layout|components|sections|pages)\//) || [])[1];
    let nodes; try { nodes = parseCss(stripGenerated(text)); } catch { continue; }
    walk(nodes, (node, stack) => {
      if (node.type !== 'rule' || stack.some(a => a.name === 'keyframes')) return;
      const layer = fixed || stack.filter(a => a.name === 'layer').map(a => a.prelude.trim()).pop() || '(unlayered)';
      const props = node.decls.filter(d => !d.important).map(d => d.prop);
      const sig = node.decls.map(d => `${d.prop}:${d.value.replace(/\s+/g, ' ')}${d.important ? '!' : ''}`).join(';');
      const at = stack.filter(a => a.name !== 'layer').map(a => `@${a.name} ${a.prelude}`.replace(/\s+/g, '')).join(' ');
      for (const text of splitTop(node.selector, ',')) {
        const complex = parseSelectorList(text)[0];
        if (!complex?.length) continue;
        rules.push({ file, line: node.line, layer, at, selector: text.trim().replace(/\s+/g, ' '), complex, spec: specificity(complex), props, sig });
      }
    });
  }
  return rules;
}

// ---- the report ----------------------------------------------------------------------------------
// For each rewrite that got lighter: the rules in its layer that set an overlapping property, may
// match the same elements, and sit between the new and the old specificity (equal counts: then the
// order decides, which is what happened in fc87ae2).
export function specificityDrops(pairs, rules) {
  const out = [];
  for (const p of pairs) {
    const oldSpec = specificity(p.old), newSpec = specificity(p.now);
    if (cmp(newSpec, oldSpec) >= 0) continue;
    const now = parseSelectorList(p.now)[0];
    const competitors = [];
    for (const r of rules) {
      if (r.layer !== p.layer || (r.file === p.file && r.line === p.line) || r.selector === p.now.trim().replace(/\s+/g, ' ')) continue;
      if (cmp(r.spec, newSpec) < 0 || cmp(r.spec, oldSpec) > 0) continue;
      const props = p.props.filter(x => r.props.some(y => overlaps(x, y)));
      if (!props.length || !mayMatchSame(now, r.complex)) continue;
      competitors.push({ ...r, overlap: props });
    }
    if (competitors.length) out.push({ ...p, oldSpec, newSpec, competitors });
  }
  return out;
}

export function formatDrops(drops, cap = 8) {
  const lines = [];
  for (const d of drops) {
    lines.push(`${d.file}${d.line ? ':' + d.line : ''} "${d.old}" ${specText(d.oldSpec)} -> "${d.now}" ${specText(d.newSpec)}, layer ${d.layer}; may now lose to:`);
    for (const c of d.competitors.slice(0, cap)) lines.push(`    ${c.file}:${c.line} "${c.selector}" ${specText(c.spec)}${cmp(c.spec, d.newSpec) === 0 ? ' (equal: order decides)' : ''} sets ${c.overlap.join(', ')}${c.at ? ` in ${c.at}` : ''}`);
    if (d.competitors.length > cap) lines.push(`    … ${d.competitors.length - cap} more`);
  }
  return lines;
}
