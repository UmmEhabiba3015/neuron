// Assemble the web walkthroughs from their numbered design-of-record screens.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {entryControls,recordingControls} from './entry-controls.mjs';
import {elementsByClass} from './html-structure.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const audioRuntime=['journal-live-audio.js','journal-recorder-runtime.js'].map(file=>fs.readFileSync(path.join(root,'scripts',file),'utf8')).join('\n');
const runtime=audioRuntime+'\n'+fs.readFileSync(path.join(root,'scripts','prototype-runtime.js'),'utf8').replace('__ENTRY_CONTROLS_MARKUP__',()=>JSON.stringify(entryControls.replaceAll('00-prototype.html',''))).replace('__RECORDING_CONTROLS_MARKUP__',()=>JSON.stringify(recordingControls.replaceAll('00-prototype.html','')));
if(/<\/script/i.test(runtime))throw Error('Prototype runtime cannot contain a closing script tag');
const platforms=['mobile-web','tablet-web','desktop-web'];
const selection=[
 ['01-today.html',['today']],
 ['02-timeline.html',['timeline','timeline-calendar']],
 ['03-talk.html',['talk','recording-kept','transcribing','microphone-before','microphone-denied','microphone-missing']],
 ['04-ask.html',['ask','ask-answer']],
 ['05-reflection.html',['reflection']],
 ['06-conversation.html',['day']],
 ['07-you.html',['you']],
 ['10-settings-privacy.html',['settings-privacy','settings-visible','settings-data']],
 ['11-states.html',['empty-today','thin-week','return','audio-no-transcript','note-open','ask-no-matches','draft']],
 ['13-login.html',['auth-login']],
 ['14-register.html',['auth-register']],
 ['15-auth-states.html',null],['16-flow-states.html',null],
 ['17-account-data.html',null],['18-entry-system-states.html',null]
];
function deviceBlocks(html){return elementsByClass(html,'device').map(range=>range.html);}
function remapLocalIds(block,key){
 const ids=[...block.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const map=new Map(ids.map(id=>[id,`${key}-${id}`]));
 for(const [oldId,newId] of map){
  block=block.replaceAll(`id="${oldId}"`,`id="${newId}"`).replaceAll(`for="${oldId}"`,`for="${newId}"`);
  for(const attr of ['aria-labelledby','aria-describedby','aria-controls']){
   block=block.replace(new RegExp(`${attr}="([^"]*)"`,'g'),(all,value)=>`${attr}="${value.split(/\s+/).map(v=>v===oldId?newId:v).join(' ')}"`);
  }
 }
 return block;
}

const groups=[
 ['Start',['auth-login','auth-register','auth-forgot','empty-today','today','timeline','ask','you']],
 ['Journal',['talk','recording-kept','transcribing','day','reflection','audio-no-transcript','today-without-note','day-without-note']],
 ['Account and data',['account-devices','timezone-choose','settings-privacy','settings-visible','settings-data','export-preparing','account-delete-confirm','account-delete-pending']],
 ['Entry actions',['entry-options','recording-options','entry-edit','entry-delete-confirm','save-failed','recording-upload-failed']],
 ['Loading and recovery',['today-loading','timeline-earlier','fetch-failed','day-fetch-failed','not-found','auth-login-after-session']]
];
for(const platform of platforms){
 const screens=[];const keys=new Set();
 for(const [file,defaultNames] of selection){
  const names=platform==='desktop-web'&&file==='02-timeline.html'?['timeline']:
    platform==='desktop-web'&&file==='04-ask.html'?['ask','ask-answer','ask-answer-source']:defaultNames;
  const blocks=deviceBlocks(fs.readFileSync(path.join(root,platform,file),'utf8'));
  if(names&&blocks.length!==names.length)throw Error(`${platform}/${file}: ${blocks.length} devices, expected ${names.length}`);
  blocks.forEach((raw,i)=>{
   const key=names?.[i]||raw.match(/<div class="app[^>]*\bid="([^"]+)"/)?.[1];
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
 const indexRows=groups.map(([label,ids])=>`<h2 class="shead">${label}</h2>${ids.filter(x=>keys.has(x)).map(id=>`<a class="srowlink" href="#${id}"><span class="lab">${id.replaceAll('-',' ')}</span><span class="val">Open</span></a>`).join('')}`).join('\n');
 const allLinks=screens.map(s=>`<a href="#${s.key}">${s.key.replaceAll('-',' ')}</a>`).join(' ');
 const html=`<!doctype html>\n<!-- GENERATED from numbered v3 screens by scripts/build-v3-prototypes.mjs. -->\n<html lang="en" data-motion-review="play"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Journal / v3 walkthrough / ${platform}</title><link rel="stylesheet" href="../lock.css"><style>.screen{display:none}.screen:target{display:block}body:not(:has(.screen:target)) #start{display:block}.v3-index{max-width:920px;margin-inline:auto;padding:var(--s6)}.v3-index a{min-height:var(--tap)}.v3-all{display:flex;flex-wrap:wrap;gap:var(--s3);margin:var(--s8) 0}.v3-all a{font:400 var(--t-quiet)/1.5 var(--f-label);color:var(--rule);padding:var(--s3)}.screen>.device{margin-inline:auto}.prototype-input.field{display:block;resize:none;min-width:0;max-height:160px;padding:var(--s6);line-height:1.4;overflow-y:hidden}.prototype-list{margin-top:var(--s6)}.prototype-list .srow+.srow{border-top:var(--w) solid var(--rule-2)}.prototype-feedback{margin:var(--s4) var(--s6)}.composer>.prototype-feedback{margin:var(--s4) 0 0}.screen .empty[hidden]{display:none}</style></head><body><p class="caption motion-review-status"><b>Motion preview is on.</b><br>This handover plays its animations even when Windows animation effects are disabled. Your device settings are unchanged.</p>\n<section class="screen" id="start"><div class="device"><div class="app"><div class="page"><header class="mast"><h1 class="wordmark">Journal</h1><div class="keybox"><span class="k">Review</span><span class="v printed">v3</span></div></header><main class="sheet v3-index"><h2 class="shead">Walk the journal</h2><p class="auth-copy">An account opens the journal. Select a route below, then use each screen's controls or the browser Back button.</p>${indexRows}<details class="auth-preview"><summary>All ${screens.length} review states</summary><nav class="v3-all" aria-label="All review states">${allLinks}</nav></details></main></div></div></div></section>\n${screens.map(s=>`<section class="screen" id="${s.key}">${s.block}</section>`).join('\n')}\n<script>${runtime}</script></body></html>\n`;
 fs.writeFileSync(path.join(root,platform,'00-prototype.html'),html);
 console.log(`${platform}: ${screens.length} screens`);
}
