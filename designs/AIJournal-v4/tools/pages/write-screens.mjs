// Build step: every comp marked "written" (system/comps/) writes its screen file in each screen folder
// (design-ci.json comps.platforms) from its page modules' renders. A screen folder that doesn't exist yet is
// created. A file is rewritten only when its text changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadComps, compRenderer, platformsOf, readCi } from './comps.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const render = await compRenderer(root);
let n = 0;
for (const comp of loadComps(root).filter(c => c.written)) {
  for (const dir of Object.keys(platformsOf(readCi(root)))) {
    const file = path.join(root, dir, comp.file);
    const html = render(comp, dir);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html);
    n++;
  }
}
console.log(`Wrote ${n} screen file(s) from their comps.`);
