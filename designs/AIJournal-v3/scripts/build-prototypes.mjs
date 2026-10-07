import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import './build-v3-prototypes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'lock.css'),'utf8');
if(css.charCodeAt(0)===0xfeff||!css.includes(':root{')&&!css.includes(':root {'))throw Error('Invalid CSS seam');
for(const [platform,out] of [['mobile-web','journal-prototype.html'],['tablet-web','journal-prototype-tablet.html'],['desktop-web','journal-prototype-desktop.html']]){
 const source=fs.readFileSync(path.join(root,platform,'00-prototype.html'),'utf8');
 const output=source
  .replace('<link rel="stylesheet" href="../lock.css">',()=>`<style>\n${css}\n</style>`)
  // Portable files live at the root, so walkthrough routes stay on this page.
  .replace(/((?:href|action)=")00-prototype\.html(#(?:[^"]+))"/g,'$1$2"');
 if(output===source)throw Error('Stylesheet was not inlined');
 fs.writeFileSync(path.join(root,out),output.replace(/\r\n/g,'\n'));
 console.log(out);
}
await import('./build-website-preview.mjs');
