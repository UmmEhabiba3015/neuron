// Writes the developer handover as a folder (default export/AIJournal-v4): the approved website and its
// review files, the screens, the component library (dist/) with its source (system/) and the tools that
// build it, and the current documents. An explicit allow-list, so working notes, explorations, check
// evidence and untracked files never travel. Usage: node scripts/package-handover.mjs [output folder]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||path.join(root,'export','AIJournal-v4'));
if(fs.existsSync(out))throw Error(`Output already exists, choose another folder: ${out}`);
// Outside the project, or inside its ignored export/ folder; never the project or a folder holding it.
// path.relative gives an absolute path across drives: that is outside, either way.
const within=(parent,child)=>{const relative=path.relative(parent,child);return !relative.startsWith('..')&&!path.isAbsolute(relative);};
if(within(out,root))throw Error('Output must not hold the project');
if(within(root,out)&&!path.relative(root,out).startsWith('export'+path.sep))throw Error('Inside the project, write to export/');

const rootFiles=[
 // What the developer builds from
 'journal-website.html','journal-skeletons.html','journal-prototype.html','journal-prototype-tablet.html',
 'journal-prototype-desktop.html','motion-index.html','lock.css',
 // Build inputs the tools read
 'review.css','design-ci.json',
 // Documents
 'README.md','EXPORT-HANDOFF.md','DESIGN.md','direction-lock.md','PROJECT.md','AUTH-HANDOVER.md',
 'MOTION-HANDOVER.md','ASSETS.md','reset-email.txt'
];
const rules=[
 /^(mobile-web|tablet-web|desktop-web)\/[^/]+\.html$/,
 // The native Today only (the app is out of scope): motion-index.html links to it.
 /^mobile-app\/01-today\.html$/,
 /^assets\/fonts\/[^/]+$/,
 /^docs\/(navbar|recording)\/DESIGN\.md$/,
 /^design system\/(index(\.source)?\.html|build-export\.mjs|README\.md)$/,
 /^design system\/components\/.+\.(css|js|ts|json|md|html)$/,
 /^dist\/.+$/,
 /^system\/.+$/,
 /^scripts\/[^/]+\.(mjs|js)$/,
 /^scripts\/templates\/[^/]+\.mjs$/,
 /^tools\/serve-preview\.mjs$/,
 /^tools\/(lib|modules|pages)\/[^/]+\.(mjs|js)$/,
 // The browser launcher the checks use (tools/lib/browser-harness.mjs imports it).
 /^tools\/ci\/temp\.mjs$/
];
const required=['journal-website.html','journal-skeletons.html','lock.css','README.md','EXPORT-HANDOFF.md',
 'DESIGN.md','scripts/build.mjs','design system/index.html','dist/system.css','dist/modules.json','system/tokens.json'];

const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>{
 const relative=dir?`${dir}/${entry.name}`:entry.name;
 return entry.isDirectory()?walk(relative):[relative];
});
const selected=[
 ...rootFiles.filter(file=>fs.existsSync(path.join(root,file))),
 ...['mobile-web','tablet-web','desktop-web','mobile-app','assets','docs','design system','dist','system','scripts','tools']
  .filter(dir=>fs.existsSync(path.join(root,dir))).flatMap(walk).filter(file=>rules.some(rule=>rule.test(file)))
];
for(const file of required)if(!selected.includes(file))throw Error(`Missing delivery file: ${file}`);

// The motion review switch (data-motion-review="play") and its on-page notice stay on the review
// copies only: delivered pages follow the viewer's reduced-motion setting.
const deliver=source=>source
 .replace(/(<html\b[^>]*?)\s+data-motion-review="play"/,'$1')
 .replace(/<p class="aj-l-stage__caption motion-review-status">[\s\S]*?<\/p>/g,'')
 // The website and skeleton review set it again each time a profile loads (build-website-preview.mjs).
 .replaceAll("document.documentElement.dataset.motionReview='play';",'');
const switchOn=/<html\b[^>]*data-motion-review|dataset\.motionReview\s*=\s*['"]|setAttribute\(\s*['"]data-motion-review/;

let bytes=0,switched=0;
for(const file of selected){
 const from=path.join(root,file),to=path.join(out,file);
 fs.mkdirSync(path.dirname(to),{recursive:true});
 if(file.endsWith('.html')){
  const source=fs.readFileSync(from,'utf8'),html=deliver(source);
  if(html!==source)switched++;
  if(switchOn.test(html))throw Error(`Motion review switch left on: ${file}`);
  fs.writeFileSync(to,html);
 }else fs.copyFileSync(from,to);
 bytes+=fs.statSync(to).size;
}
console.log(`${selected.length} files, ${(bytes/1048576).toFixed(1)} MB, motion review switch removed from ${switched} pages`);
console.log(out);
