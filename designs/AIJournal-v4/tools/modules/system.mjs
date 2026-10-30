// Shared model for the module build and checks: configuration, module discovery, contracts
// and tokens. A project opts in with two keys in design-ci.json:
//   "modules": "system/modules"      the modules folder (one sub-folder per layer)
//   "catalogue": "dist/catalogue"    where the built catalogue pages go
// and a "system" block (prefix, tokens, base, fonts, dist, ...; see DEFAULTS below).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const LAYERS = ['layout', 'components', 'sections', 'pages'];
export const LAYER_LETTER = { layout: 'l', components: 'c', sections: 's', pages: 'p' };
// Cascade order. `legacy` holds a project's pre-module stylesheet while it migrates; it sits
// under every module layer so an extracted module always wins over the rules it replaces.
// review: presentation furniture outside the system (a review page's controls), above every module layer.
export const LAYER_ORDER = ['tokens', 'base', 'legacy', ...LAYERS, 'review'];
export const LAYER_STATEMENT = `@layer ${LAYER_ORDER.join(', ')};`;
// Every state a contract has to account for, as "yes: how" or "n/a: why".
export const REQUIRED_STATES = ['default', 'hover', 'focus-visible', 'active', 'disabled', 'selected', 'loading', 'error', 'empty'];
// Folders the build and checks never read: git internals and Claude Code's worktrees.
export const IGNORED_DIRS = new Set(['.git', '.claude', 'node_modules']);

const DEFAULTS = {
  prefix: '',
  dist: 'dist',
  tokens: 'system/tokens.json',
  base: 'system/base.css',
  fonts: null,          // a font manifest: { faces: [{ alias, weight, file, unicode, license }] }
  context: '',          // declarations for catalogue frames: what the product shell gives a module
  designDoc: 'DESIGN.md',
  assetsDoc: 'ASSETS.md',
  inject: [],           // [{ file, tokens: true, modules: true }]: marker blocks the build rewrites
  inventory: null,      // { components: [names] }: a closed component list, when the project has one
  readme: ['## Why', "## Do and don't"],
  templates: 'scripts/templates',   // a folder of .mjs files, each default-exporting { name: render => markup } (tools/modules/templates.mjs)
  readers: ['scripts'],  // folders of code that reads module classes (check-modules' legacy-class scan; not recursive)
  guideSource: null,     // the guide page's source file, when the project has one (tools/convert)
};

export function loadConfig(root) {
  const file = join(root, 'design-ci.json');
  if (!existsSync(file)) throw new Error(`No design-ci.json in ${root}`);
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  if (!cfg.modules) return null; // not a modular project
  const system = { ...DEFAULTS, ...(cfg.system || {}) };
  return { ...system, modules: cfg.modules, catalogue: cfg.catalogue || `${system.dist}/catalogue`, root };
}

export const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const pascal = s => s.split(/[-_\s]+/).map(w => w[0].toUpperCase() + w.slice(1)).join('');
export const camel = s => { const p = pascal(s); return p[0].toLowerCase() + p.slice(1); };

// aj-c-notice: project prefix, layer letter, module name.
export const rootClass = (cfg, layer, name) => [cfg.prefix, LAYER_LETTER[layer], name].filter(Boolean).join('-');
// Matches any module's class (root or element) in this project: aj-c-card, aj-c-card__body.
export const moduleClassPattern = cfg => new RegExp(`^${cfg.prefix ? cfg.prefix + '-' : ''}([lcsp])-([a-z0-9]+(?:-[a-z0-9]+)*?)(?:__[\\w-]+)?$`);

export function discoverModules(cfg) {
  const base = join(cfg.root, cfg.modules);
  const list = [];
  if (!existsSync(base)) return list;
  for (const layer of LAYERS) {
    const dir = join(base, layer);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      const folder = join(dir, name);
      if (!statSync(folder).isDirectory() || IGNORED_DIRS.has(name)) continue;
      const file = f => join(folder, f);
      const has = f => existsSync(file(f));
      let contract = null, contractError = null;
      try { contract = JSON.parse(readFileSync(file('contract.json'), 'utf8')); } catch (e) { contractError = has('contract.json') ? e.message : 'missing contract.json'; }
      list.push({
        name, layer, folder, rel: relative(cfg.root, folder).split(sep).join('/'),
        root: rootClass(cfg, layer, name), contract, contractError,
        css: has(`${name}.css`) ? file(`${name}.css`) : null,
        render: has(`${name}.html.mjs`) ? file(`${name}.html.mjs`) : null,
        script: has(`${name}.js`) ? file(`${name}.js`) : null,
        fixtures: has('fixtures.mjs') ? file('fixtures.mjs') : null,
        readme: has('README.md') ? file('README.md') : null,
      });
    }
  }
  return list;
}

// `uses` in a contract: { "card": "0.x" } or ["card@0"]. Returns [{ name, version }].
export function usesOf(contract) {
  const u = contract?.uses;
  if (!u) return [];
  if (Array.isArray(u)) return u.map(s => { const [name, version = '*'] = String(s).split('@'); return { name, version }; });
  return Object.entries(u).map(([name, version]) => ({ name, version: String(version) }));
}

// The modules a module renders, transitively, in dependency order (dependencies first).
export function closure(mod, byName, seen = new Set(), out = []) {
  for (const { name } of usesOf(mod.contract)) {
    const dep = byName.get(name);
    if (!dep || seen.has(name)) continue;
    seen.add(name); closure(dep, byName, seen, out); out.push(dep);
  }
  return out;
}

export const loadModule = async file => import(pathToFileURL(file).href + `?t=${Date.now()}`);

// ---- tokens ---------------------------------------------------------------
// tokens.json: groups of tokens. A token is { "$value": "...", "$description"?: "...",
// "$comment"?: "..." }; its key is the custom property name without the leading "--".
// A group may set "$scope" (default ":root") for tokens that live on another selector, and
// "$comment" for the explanation printed above it in the generated CSS.

export function flattenTokens(tokens) {
  const out = [];
  for (const [group, body] of Object.entries(tokens)) {
    if (group.startsWith('$') || typeof body !== 'object') continue;
    for (const [key, t] of Object.entries(body)) {
      if (key.startsWith('$')) continue;
      out.push({ group, scope: body.$scope || ':root', name: `--${key}`, value: t.$value, description: t.$description || '', comment: t.$comment || '' });
    }
  }
  return out;
}

const commentBlock = (text, indent) => text ? `${indent}/* ${text.replace(/\*\//g, '* /').split('\n').join(`\n${indent}`)} */\n` : '';

// Custom properties for every scope, with descriptions as comments.
export function tokensCss(tokens) {
  const flat = flattenTokens(tokens);
  const scopes = [...new Set(flat.map(t => t.scope))];
  let css = '';
  for (const scope of scopes) {
    css += `${scope}{\n`;
    let group = null;
    for (const [gname, body] of Object.entries(tokens)) {
      if (gname.startsWith('$') || (body.$scope || ':root') !== scope) continue;
      if (group !== null) css += '\n';
      group = gname;
      css += commentBlock(body.$comment, '  ');
      for (const t of flat.filter(x => x.group === gname)) {
        css += commentBlock(t.comment, '  ');
        css += `  ${t.name}: ${t.value};${t.description ? ` /* ${t.description.replace(/\*\//g, '* /').split('\n').join('\n     ')} */` : ''}\n`;
      }
      css += commentBlock(body.$after, '  ');
    }
    css += '}\n';
  }
  return css;
}

export const readTokens = cfg => {
  const file = join(cfg.root, cfg.tokens);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
};
