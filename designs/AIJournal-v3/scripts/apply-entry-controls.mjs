import {elementRange} from './html-structure.mjs';
// Refresh shared controls in the authored written-entry and saved-memo screens.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {replaceEntryLinks,entryControlsFor,recordingControlsFor} from './entry-controls.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const platform of ['mobile-web','tablet-web','desktop-web']){
 for(const file of fs.readdirSync(path.join(root,platform)).filter(file=>/^(0[1-9]|1[0-4])-.*\.html$/.test(file))){
  const target=path.join(root,platform,file),source=fs.readFileSync(target,'utf8');
  const updated=replaceEntryLinks(source).replace(/<div class="entry-actions"[\s\S]*?<\/details><\/div>/g,(controls,offset,html)=>{
   const excluded=controls.includes('data-excluded="true"')||/^\s*<span class="mark">/.test(html.slice(offset+controls.length));
   return entryControlsFor(excluded);
  });
  // Find complete recording rows by div nesting, including waveform wrappers.
  const starts=[...updated.matchAll(/<div class="recrow"[^>]*>/g)].map(match=>match.index).reverse();
  let result=updated;
  for(const start of starts){
   const {end}=elementRange(result,start);
   let block=result.slice(start,end);if(!/class="play"/.test(block))continue; // Live recording has no item controls.
   const excluded=/class="mark"/.test(block)||block.includes('data-excluded="true"');
   if(block.includes('class="entry-actions"'))block=block.replace(/<div class="entry-actions"[\s\S]*?<\/details><\/div>/g,()=>recordingControlsFor(excluded));
   else if(block.includes('>Recording options</a>'))block=block.replace(/<a class="cite" href="00-prototype\.html#recording-options">Recording options<\/a>/g,()=>recordingControlsFor(excluded));
   else if(block.includes('class="prose"'))block=block.replace(/(<p class="prose">[\s\S]*?<\/p>)/,`$1${recordingControlsFor(excluded)}`);
   else block=block.slice(0,-6)+`<div class="body"><div class="tcol"></div><div class="ccol"><p class="prose">Voice memo</p>${recordingControlsFor(excluded)}</div></div></div>`;
   result=result.slice(0,start)+block+result.slice(end);
  }
  fs.writeFileSync(target,result);
 }
}
console.log('Updated written-entry and saved voice-memo controls across the authored web screens.');
