// Assemble the web walkthroughs from the numbered screens' devices, rendered from their comps (system/comps).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openTag} from '../tools/lib/html-structure.mjs';
import {loadComps,compRenderer,platformsOf,readCi} from '../tools/pages/comps.mjs';
import {templates} from '../tools/modules/templates.mjs';
import {moduleScripts} from '../tools/modules/scripts.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sharedRuntime=['journal-live-audio.js','journal-recorder-runtime.js','journal-navbar.js','journal-timeline.js','journal-ask.js','journal-reflection.js'].map(file=>fs.readFileSync(path.join(root,'scripts',file),'utf8')).join('\n');
const runtime=moduleScripts(root,['header','find','daycard','record','cal','moodgraph','bubble','thumbs','rateform','chat','drawers','booklet','overview'])+sharedRuntime+'\n'+fs.readFileSync(path.join(root,'scripts','prototype-runtime.js'),'utf8');
if(/<\/script/i.test(runtime))throw Error('Prototype runtime cannot contain a closing script tag');
const platforms=['mobile-web','tablet-web','desktop-web'];
const selection=[
 ['01-today.html',['today']],
 ['02-timeline.html',['timeline','timeline-calendar']],
 ['03-talk.html',['talk','recording-kept','transcribing','microphone-before','microphone-denied','microphone-missing']],
 ['04-ask.html',['ask','ask-past']],
 ['05-reflection.html',['reflections','reflection','reflections-first','reflections-empty','reflections-rated']],
 ['06-conversation.html',['day']],
 ['07-you.html',['you']],
 ['10-settings-privacy.html',['settings-privacy','settings-visible','settings-data']],
 ['11-states.html',['empty-today','today-first','thin-week','audio-no-transcript','note-open','draft','memo-draft','memo-draft-typed','empty-today-memo-draft']],
 ['13-login.html',['auth-login']],
 ['14-register.html',['auth-register']],
 ['15-auth-states.html',null],['16-flow-states.html',null],
 ['17-account-data.html',null],['18-entry-system-states.html',null]
];
// A screen's devices on a platform, each its stage as the page module renders it on a walkthrough (the header's
// navbar form and the page's reader below desktop; the caption stays on the screen file).
const PLATFORMS=platformsOf(readCi(root)),render=await compRenderer(root),comps=new Map(loadComps(root).map(c=>[c.file,c]));
function deviceBlocks(file,platform){
 const comp=comps.get(file);if(!comp)throw Error(`${file}: no comp`);
 return (comp.platforms?.[platform]||comp.devices).map(d=>String(render.device({...d,caption:undefined},PLATFORMS[platform],platform,'walkthrough')));
}
const screenKeys=new Set(selection.flatMap(([,names])=>names||[]));
function remapLocalIds(block,key){
 const ids=[...block.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const map=new Map(ids.map(id=>[id,`${key}-${id}`]));
 for(const [oldId,newId] of map){
  block=block.replaceAll(`id="${oldId}"`,`id="${newId}"`).replaceAll(`for="${oldId}"`,`for="${newId}"`);
  // An in-screen link (Reflections' #earlier) follows its target; a link to a screen, or to the shell's own id, is a route.
  if(!screenKeys.has(oldId)&&!block.match(new RegExp(openTag('div','aj-l-shell')))?.[0].includes(`id="${newId}"`))block=block.replaceAll(`href="#${oldId}"`,`href="#${newId}"`);
  for(const attr of ['aria-labelledby','aria-describedby','aria-controls']){
   block=block.replace(new RegExp(`${attr}="([^"]*)"`,'g'),(all,value)=>`${attr}="${value.split(/\s+/).map(v=>v===oldId?newId:v).join(' ')}"`);
  }
 }
 return block;
}

const groups=[
 ['Start',['auth-login','auth-register','auth-forgot','today-first','empty-today','today','reflections','timeline','ask','you']],
 ['Journal',['talk','recording-kept','transcribing','day','reflection','reflections-first','reflections-empty','reflections-rated','audio-no-transcript','today-without-note','day-without-note']],
 ['Account and data',['account-devices','timezone-choose','settings-privacy','settings-visible','settings-data','export-preparing','account-delete-confirm','account-delete-pending']],
 ['Entry actions',['entry-options','recording-options','entry-edit','entry-delete-confirm','entry-unsent','entry-unsent-stopped','memo-draft']],
 ['Loading and recovery',['today-loading','reflections-loading','settings-loading','timeline-earlier','fetch-failed','day-fetch-failed','not-found','auth-login-after-session']]
];
// The runtime's templates, rendered by the modules (tools/modules/templates.mjs): after every screen
// (no screen's element order changes) and before the runtime, which clones them on its first run.
const moduleTemplates=await templates(root);
for(const platform of platforms){
 const screens=[];const keys=new Set();
 for(const [file,defaultNames] of selection){
  const names=platform==='desktop-web'&&file==='02-timeline.html'?['timeline']:
    platform==='desktop-web'&&file==='04-ask.html'?['ask','ask-past','ask-drawers']:defaultNames;
  const blocks=deviceBlocks(file,platform);
  if(names&&blocks.length!==names.length)throw Error(`${platform}/${file}: ${blocks.length} devices, expected ${names.length}`);
  blocks.forEach((raw,i)=>{
   const key=names?.[i]||raw.match(new RegExp(openTag('div','aj-l-shell')))?.[0].match(/\sid="([^"]+)"/)?.[1];
   if(!key||keys.has(key))throw Error(`Missing or duplicate screen key ${platform}/${file}: ${key}`);
   // The calendar's dated anchors are authored for its index. In the walkthrough
   // each populated date opens the shared day fixture; this is active behavior.
   const block=remapLocalIds(raw,key).replace(/href="#d-2026-[^"]+"/g,'href="00-prototype.html#day"');
   keys.add(key);screens.push({key,block});
  });
 }
 // Broken authored routes fail the build rather than being guessed from labels.
 for(const {key,block} of screens)for(const m of block.matchAll(/<(?:a|form)\b[^>]*?\s(?:href|action)="([^"]+)"/g)){
  const route=m[1].match(/^(?:00-prototype\.html)?#(.+)$/)?.[1];
  const localIds=new Set([...block.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  if((route&&!keys.has(route)&&!localIds.has(route))||(!route&&!/^(?:https?:|mailto:|tel:)/.test(m[1])))throw Error(platform+'/'+key+': invalid route '+m[1]);
 }
 const indexRows=groups.map(([label,ids])=>`<h2 class="aj-c-shead">${label}</h2>${ids.filter(x=>keys.has(x)).map(id=>`<a class="aj-c-srowlink" href="#${id}"><span class="aj-c-srowlink__label">${id.replaceAll('-',' ')}</span><span class="aj-c-srowlink__value">Open</span></a>`).join('')}`).join('\n');
 const allLinks=screens.map(s=>`<a href="#${s.key}">${s.key.replaceAll('-',' ')}</a>`).join(' ');
 const html=`<!doctype html>\n<!-- GENERATED from numbered v3 screens by scripts/build-v3-prototypes.mjs. -->\n<html lang="en" data-motion-review="play"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Journal / v3 walkthrough / ${platform}</title><link rel="stylesheet" href="../lock.css"><style>@layer legacy{.screen{display:none}.screen:target{display:block}body:not(:has(.screen:target)) #start{display:block}.v3-index{max-width:920px;margin:0 auto var(--s6);padding:var(--s6)}.v3-index a{min-height:var(--tap)}.v3-all{display:flex;flex-wrap:wrap;gap:var(--s3);margin:var(--s8) 0}.v3-all a{font:400 var(--t-quiet)/1.5 var(--f-label);color:var(--rule);padding:var(--s3)}.aj-c-field[data-hook~="input"]{display:block;resize:none;min-width:0;max-height:160px;padding:var(--s6);line-height:1.4;overflow-y:hidden}.prototype-list{margin-top:var(--s6)}.prototype-list>.aj-c-srow+.aj-c-srow{border-top:var(--w) solid var(--rule-2)}.prototype-feedback{margin:var(--s4) var(--s6)}.aj-c-composer>.prototype-feedback{margin:var(--s4) 0 0}.screen .aj-c-empty[hidden]{display:none}}</style></head><body><p class="aj-l-stage__caption motion-review-status"><b>Motion preview is on.</b><br>This handover plays its animations even when Windows animation effects are disabled. Your device settings are unchanged.</p>\n<section class="screen" id="start"><div class="aj-l-stage" data-platform="mobile"><div class="aj-l-shell" data-motion="arrive"><div class="aj-l-page"><header class="aj-l-mast" data-place="head"><h1 class="aj-l-mast__wordmark">Journal</h1><div class="aj-c-keybox" data-place="tool"><span class="aj-c-keybox__key">Review</span><span class="aj-c-keybox__value" data-printed>v3</span></div></header><main class="aj-c-sheet v3-index"><h2 class="aj-c-shead">Walk the journal</h2><p class="aj-c-text" data-place="copy" data-form="copy">An account opens the journal. Select a route below, then use each screen's controls or the browser Back button.</p>${indexRows}<details class="auth-preview"><summary>All ${screens.length} review states</summary><nav class="v3-all" aria-label="All review states">${allLinks}</nav></details></main></div></div></div></section>\n${screens.map(s=>`<section class="screen" id="${s.key}">${s.block}</section>`).join('\n')}\n${moduleTemplates}<script>${runtime}</script></body></html>\n`;
 fs.writeFileSync(path.join(root,platform,'00-prototype.html'),html);
 console.log(`${platform}: ${screens.length} screens`);
}
