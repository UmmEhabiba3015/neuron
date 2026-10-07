import {elementsByClass} from './html-structure.mjs';
import fs from 'node:fs';
import {compactRecorder} from './compact-recorder.mjs';
// Only the recording/recovery blocks change; kept/transcribing review specimens remain.
for(const platform of ['mobile-web','tablet-web','desktop-web']){
 const file=new URL(`../${platform}/03-talk.html`,import.meta.url);
 let html=fs.readFileSync(file,'utf8');
 const spans=elementsByClass(html,'device').map(({start,end},i)=>[start,end,i]);
 if(spans.length!==6)throw Error(`${platform}: expected six recording comps`);
 for(const [start,end,i] of spans.reverse())if([0,3,4,5].includes(i))html=html.slice(0,start)+compactRecorder(platform,{state:i===4?'denied':i===5?'missing':i===3?'pending':'ready'})+html.slice(end);
 html=html.replace(/Talk · capture, keep and transcribe/g,'Voice memo · Compact Transport').replace(/LISTENING/g,'READY / EXPLICIT START');
 fs.writeFileSync(file,html);
}
