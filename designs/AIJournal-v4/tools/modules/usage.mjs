// What a module's CSS reads, by the same rules tools/ci/check-modules.mjs enforces, so a tool can
// write the contract's bookkeeping instead of a person (tools/edit.mjs syncs it after every edit):
//   tokens: every var() in tokens.json the CSS reads (keyframes included), and for a layout module
//           each token it sets for its subtree that tokens.sets lists;
//   contexts: every context attribute (design-ci.json system.contexts) an ancestor compound reads,
//           that is, in front of the module's own first class.
// If the checker's rules change, change these with them.
import { parseCss, parseSelectorList, walk, varRefs } from './css.mjs';

export function cssUsage(cssText, { root, layer, sets = [], tokenNames, contexts }) {
  const tokens = new Set(), contextsRead = new Set();
  const own = cls => cls === root || cls.startsWith(root + '__');
  walk(parseCss(cssText), (node, stack) => {
    if (stack.some(a => a.name === 'keyframes')) {
      for (const d of node.decls || []) for (const v of varRefs(String(d.value))) if (!v.startsWith(`--${root}-`) && tokenNames.has(v)) tokens.add(v);
      return;
    }
    if (node.type === 'at') return;
    for (const complex of parseSelectorList(node.selector)) {
      const firstOwn = complex.findIndex(c => c.classes.some(own));
      for (const c of complex.slice(0, Math.max(0, firstOwn))) for (const [, n] of c.text.matchAll(/\[([\w-]+)/g)) if (contexts.includes(n)) contextsRead.add(n);
    }
    for (const d of node.decls) {
      if (layer === 'layout' && d.prop.startsWith('--') && !d.prop.startsWith(`--${root}-`) && sets.includes(d.prop)) tokens.add(d.prop);
      for (const v of varRefs(d.value)) if (!v.startsWith(`--${root}-`) && tokenNames.has(v)) tokens.add(v);
    }
  });
  return { tokens, contexts: contextsRead };
}
