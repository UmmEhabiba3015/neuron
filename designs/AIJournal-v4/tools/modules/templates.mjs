// Build-time templates for markup the app runtime creates while the prototype runs (a new entry row, a
// kept voice memo, the entry editor): each is rendered here by the module's own render function, and
// the runtime clones it (document.querySelector('template[data-template="srow-entry"]')) and fills
// only the hooks its contract declares. No class string in the runtime (decision 2026-10-12).
// build-v3-prototypes.mjs puts the set after every screen and before the runtime (so no
// screen's element order changes); the website preview carries it with the prototype bodies.
//
// Each area's templates are in its own file (the folder design-ci.json system.templates names, default
// scripts/templates/; every .mjs in it, in name order), name -> render => markup, where
// render(module, props, slots, attrs) is the module renderer. attrs (optional) go on the rendered root:
// the attributes a template needs that the module's props don't carry (a declared hook, a role, ARIA,
// type, hidden): { 'data-hook': 'editor-field', 'data-place': 'span', type: 'submit', hidden: true }.
// true writes the bare attribute, false removes it; an attribute the root already has is replaced. Compose children by
// rendering them first and passing them as slots. The names are the round 3 contracts'
// (.claude/waves/behaviour/round3-contracts.md).
import { loadConfig, discoverModules } from './system.mjs';
import { makeRenderer } from './build.mjs';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Every template file's default export merged into one map; a name defined in two files is an error.
export async function loadTemplates(root) {
  const dir = join(root, loadConfig(root).templates);
  const all = {}, from = {};
  if (!existsSync(dir)) return all;
  for (const file of readdirSync(dir).filter(f => f.endsWith('.mjs')).sort()) {
    for (const [name, fn] of Object.entries((await import(pathToFileURL(join(dir, file)).href)).default || {})) {
      if (name in all) throw new Error(`template "${name}" is defined in both ${from[name]} and ${file}`);
      all[name] = fn; from[name] = file;
    }
  }
  return all;
}

export async function templates(root, only = null) {
  const TEMPLATES = await loadTemplates(root);
  const names = Object.keys(TEMPLATES).filter(n => !only || only.includes(n));
  if (!names.length) return '';
  const cfg = loadConfig(root);
  const renderer = await makeRenderer(cfg, discoverModules(cfg));
  const esc = v => String(v).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const render = (name, props, slots, attrs = {}) => {
    let out = String(renderer.render(name, props, slots));
    const open = out.match(/^\s*<[a-z][\w-]*\b[^>]*>/i);
    if (!open) throw new Error(`template: ${name} rendered no root element`);
    let tag = open[0];
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      tag = tag.replace(new RegExp(`\\s${k}(="[^"]*")?(?=[\\s>/])`), '');
      if (v === false) continue;   // false removes it (a link whose href the runtime sets)
      tag = tag.replace(/\s*\/?>$/, m => `${v === true ? ` ${k}` : ` ${k}="${esc(v)}"`}${m}`);
    }
    return tag + out.slice(open[0].length);
  };
  return names.map(n => `<template data-template="${n}">${TEMPLATES[n](render)}</template>`).join('');
}
