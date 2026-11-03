// Comps (pages round 0, DESIGN.md 2026-10-14): a screen file is a comp, the devices it shows on each
// web platform, each one a page module's render in a stage with its caption. system/comps/<screen>.json:
//   { file, title, comment, written, devices: [{ page, state, caption: { title, text } }],
//     platforms: { "desktop-web": [devices] } }   (a platform's own device list, when it differs)
// "written": true means the build writes the screen from the comp (tools/pages/write-screens.mjs); until
// then the comp is only checked against the hand-written file (tools/ci/page-parity.mjs).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, discoverModules } from '../modules/system.mjs';
import { makeRenderer } from '../modules/build.mjs';

// design-ci.json "comps" (every key optional; without "platforms" the project has no comps):
//   dir "system/comps", platforms { "<screen folder>": "<platform name>" }, stage "stage" (the stage module),
//   stageProps {} (extra props for every stage), title "{title} / {dir}" (the <title>), stylesheets [] (one
//   <link> each), bodyStart "" (markup right after <body>).
export const readCi = root => JSON.parse(readFileSync(join(root, 'design-ci.json'), 'utf8'));
export const platformsOf = cfg => cfg?.comps?.platforms || {};

export function loadComps(root) {
  const ci = readCi(root);
  if (!Object.keys(platformsOf(ci)).length) return [];
  const dir = join(root, ci.comps.dir || 'system/comps');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.json')).map(f => ({ id: f.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(dir, f), 'utf8')) }));
}

export async function compRenderer(root) {
  const cfg = loadConfig(root), ci = readCi(root), comps = ci.comps || {}, platforms = platformsOf(ci);
  const stage = comps.stage || 'stage', stageProps = comps.stageProps || {}, stylesheets = comps.stylesheets || [];
  const renderer = await makeRenderer(cfg, discoverModules(cfg));
  // One device: the stage around the page's render, its caption after it. A pending device (a state its page
  // doesn't render yet: pages round 4b) renders nothing; parity compares the others device by device.
  // A caption may name its platform folder: {dir} (the state packs' captions end "· mobile-web").
  // context: 'screen' (the numbered screens) or 'walkthrough' (the prototypes and the website: the pages' navbar).
  const device = (d, platform, dir = '', context = 'screen') => d.pending ? '' : String(renderer.render(stage, { platform, ...stageProps, captionTitle: (d.caption?.title || '').replace('{dir}', dir), captionText: (d.caption?.text || '').replace('{dir}', dir) }, {
    children: renderer.render(d.page, { platform, state: d.state || 'default', context }),
  }));
  // A screen file: its head, the motion note, each device. The stage writes data-platform on its chrome and
  // caption on every platform.
  const file = (comp, dir) => {
    const platform = platforms[dir];
    const devices = comp.platforms?.[dir] || comp.devices;
    if (comp.written && devices.some(d => d.pending)) throw new Error(`${comp.file}: a written comp has pending devices`);
    const body = devices.map(d => device(d, platform, dir)).join('\n\n');
    file.device = device;
    return `<!doctype html>\n<html lang="en" data-motion-review="play">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="${comp.viewport || 'width=device-width, initial-scale=1'}">\n<title>${(comps.title || '{title} / {dir}').replace('{title}', () => comp.title).replace('{dir}', () => dir)}</title>\n<!-- ${comp.comment} -->\n${stylesheets.map(href => `<link rel="stylesheet" href="${href}">\n`).join('')}</head>\n<body>${comps.bodyStart || ''}\n\n${body}\n</body>\n</html>\n`;
  };
  file.device = device;
  return file;
}

// The attributes design-ci.json pageParity.tolerate lists ({ attr, on }), taken off the elements they
// name: the modules write them on purpose (page-parity.mjs and class-diff.mjs --normalise both strip them).
export function stripTolerated(text, tolerate = []) {
  // x.value: only that value comes off (data-date="printed", which nothing styles; "hand" still compares).
  const val = x => x.value !== undefined ? `="${x.value}"` : '(="[^"]*")?';
  return tolerate.reduce((t, x) => t.replace(new RegExp(`<([a-z][\\w-]*)([^>]*class="[^"]*\\b${x.on}\\b[^"]*"[^>]*)>`, 'g'), (m, tag, rest) => `<${tag}${rest.replace(new RegExp(`\\s${x.attr}${val(x)}`), '')}>`), text);
}

// Markup as parity compares it: whitespace between tags dropped, whitespace in text collapsed, each
// tag's attributes sorted. Inline spacing is proven by the computed-style round check, not here.
export function normalise(html) {
  // An apostrophe escaped by the render (&#39;) is the same character the browser shows.
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, ' ').replace(/>\s+</g, '><').replace(/\s+>/g, '>').replace(/>\s+/g, '>').replace(/\s+</g, '<')
    .replace(/<([a-z][\w-]*)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*(\/?)>/gi, (m, tag, attrs, slash) => {
      // An empty value is the bare attribute (data-placeholder="" is data-placeholder).
      const list = [...attrs.matchAll(/\s+([^\s=>]+)(?:="([^"]*)")?/g)].map(([, k, v]) => v === undefined || v === '' ? k : `${k}="${v}"`).sort();
      return `<${tag}${list.length ? ' ' + list.join(' ') : ''}${slash}>`;
    }).trim();
}
