import {startBrowser,pause,removeTemporaryDirectory} from '../tools/lib/browser-harness.mjs';
// Integrated Compact Transport: standalone main website, real capture and playback; the waveform is a
// fixed decorative shape that never follows the sound (v4 B6).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const engine=process.argv.includes('--firefox')?'firefox':'chromium';
const evidence=path.join(root,'verification','compact-merge');fs.mkdirSync(evidence,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'journal recording studies '));
const files=['journal-website.html'];
files.forEach(name=>fs.copyFileSync(path.join(root,name),path.join(temp,name)));
let session;const results=[];
try{
 session=await startBrowser({temp,engine});
 const {call,evaluate,navigate,viewport,errors,requests}=session;
 const screenshot=async name=>{
  await evaluate(name.startsWith('playback')?"document.querySelector('#today .prototype-list .aj-c-recrow').scrollIntoView({block:'center',behavior:'instant'})":'scrollTo(0,0)');await pause(80);
  fs.writeFileSync(path.join(evidence,name),await session.captureScreenshot());
 };
 const data=expression=>evaluate('(async()=>JSON.stringify(await ('+expression+')))()').then(JSON.parse);
 const check=(condition,name,detail)=>{if(!condition)throw Error(name+': '+JSON.stringify(detail));results.push({check:name,...detail});};
 const wait=async expression=>{
  for(let i=0;i<80;i++){try{if(await evaluate(expression))return;}catch{}await pause(100);}
  const detail=await data("(async()=>({memos:[...document.querySelectorAll('#today .prototype-list .aj-c-recrow')].map(r=>({playback:r.dataset.playback,button:r.querySelector('.aj-c-play')?.getAttribute('aria-label'),clock:r.querySelector('.aj-c-recrow__clock')?.textContent})),duration:(await window.__journalPreview.snapshot()).recordings.map(r=>r.duration)}))()");
  throw Error('Timed out: '+expression+'; '+JSON.stringify(detail));
 };
 const click=selector=>evaluate('document.querySelector('+JSON.stringify(selector)+').click()');
 await viewport(1440,960);await navigate(pathToFileURL(path.join(temp,files[0])).href+'?fonts=portable#today');
 await wait("!!document.querySelector('#today .prototype-input')");
 await evaluate('window.__native=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);window.__tracks=[];window.__contexts=[];window.__recorders=[];const OriginalRecorder=window.MediaRecorder;window.MediaRecorder=class extends OriginalRecorder{constructor(...args){super(...args);window.__recorders.push(this);}};');
 // First permission uses the real browser getUserMedia entry point (fake device).
 await click('#today .aj-c-composer .aj-c-composer__mic');await wait("document.querySelector('#talk .aj-s-recorder').dataset.microphone==='granted'");
 check(await evaluate("location.hash==='#talk'&&document.querySelector('#talk [data-clock]').textContent==='0:00'&&window.__recorders.length===0"),'Direct ready screen, explicit Start',{});
 await click('#talk [data-recorder="back"]');await wait("location.hash==='#today'");
 // Measured sound fixture, through the same real Web Audio and MediaRecorder path.
 await evaluate('navigator.mediaDevices.getUserMedia=async()=>{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain(),d=c.createMediaStreamDestination();o.frequency.value=220;g.gain.value=0;o.connect(g);g.connect(d);o.start();await c.resume();window.__gain=g;window.__contexts.push(c);window.__tracks.push(...d.stream.getTracks());return d.stream;};');
 await click('#today .aj-c-composer .aj-c-composer__mic');await wait("document.querySelector('#talk .aj-s-recorder').dataset.microphone==='granted'");
 const flat=await evaluate("Math.max(...[...document.querySelectorAll('#talk [data-live-wave] g')].map(b=>Number(b.style.transform.slice(7,-1))))");
 await click('#talk [data-recorder="start"]');await wait("document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase==='recording'");
 await pause(500);
 const shape=await evaluate("JSON.stringify([...document.querySelectorAll('#talk [data-live-wave] g')].map(b=>[b.style.transform,b.dataset.level]))");
 await evaluate('window.__gain.gain.value=.008');await pause(600);const quiet=await evaluate("JSON.stringify([...document.querySelectorAll('#talk [data-live-wave] g')].map(b=>[b.style.transform,b.dataset.level]))");
 await evaluate('window.__gain.gain.value=.25');await pause(650);const loud=await evaluate("JSON.stringify([...document.querySelectorAll('#talk [data-live-wave] g')].map(b=>[b.style.transform,b.dataset.level]))");
 const drawn=JSON.parse(shape);
 check(flat<=.016&&shape===quiet&&quiet===loud&&drawn.length===128&&drawn.every(([t,l])=>t==='scaleY('+l+')')&&new Set(drawn.map(b=>b[1])).size>4,'Recording shows the fixed shape; sound does not move it',{flat,bars:drawn.length,changed:shape!==quiet||quiet!==loud});
 for(const width of [320,390,834,1440,2560]){
  await viewport(width,width<620?844:960);await pause(100);
  const layout=await data("(()=>{const s=document.querySelector('#talk .aj-s-recorder__sheet');return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,rail:document.querySelector('#talk .aj-l-rail').getBoundingClientRect().left,height:s.getBoundingClientRect().height,wave:document.querySelector('#talk [data-live-wave]').getBoundingClientRect().height,phase:document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase,bad:[...document.querySelectorAll('#talk button,#talk a')].filter(e=>e.getClientRects().length&&(e.getBoundingClientRect().height<43.9||e.getBoundingClientRect().width<43.9)).map(e=>e.textContent)}})()");
  check(!layout.overflow&&layout.rail===0&&layout.phase==='recording'&&!layout.bad.length&&layout.wave===80,'Recorder resize preserves live session',layout);
  if(engine==='chromium'&&[390,1440].includes(width))await screenshot('recording-'+width+'.png');
 }
 await viewport(390,844);await click('#talk [data-recorder="pause"]');
 const frozen=await evaluate("document.querySelector('#talk [data-clock]').textContent+document.querySelector('#talk [data-live-wave]').innerHTML");await pause(300);
 check(await evaluate("document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase==='paused'&&window.__recorders.at(-1).state==='paused'&&!window.__tracks.at(-1).enabled")&&frozen===await evaluate("document.querySelector('#talk [data-clock]').textContent+document.querySelector('#talk [data-live-wave]').innerHTML"),'Pause freezes capture, timer and waveform',{});
 await click('#talk [data-recorder="pause"]');await pause(200);await click('#talk [data-recorder="keep"]');await wait("location.hash==='#today'&&!!document.querySelector('#today .prototype-list .aj-c-recrow__wave')");await pause(250);
 const saved=await data("(async()=>{const s=await window.__journalPreview.snapshot();const m=s.recordings[0],waves=document.querySelectorAll('#today .prototype-list .aj-c-recrow__wave .aj-c-wave');return {count:s.recordings.length,bytes:m.blob.size,waves:waves.length,fixed:[...waves].every(w=>!w.children.length&&getComputedStyle(w).maskImage.startsWith('url(')),stopped:window.__tracks.every(t=>t.readyState==='ended'),phase:document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase,active:active};})()");
 check(saved.count===1&&saved.bytes>0&&saved.waves===2&&saved.fixed&&saved.stopped&&saved.active==='mobile','Keep returns to journal with the fixed memo shape',saved);
 await evaluate("window.__initialWave=document.querySelector('#today .prototype-list .aj-c-recrow__wave').innerHTML.replace(/ style=\"[^\"]*\"/g,'')");
 for(const width of [320,390,834,1440,2560]){
  await viewport(width,960);await pause(250);
  const now=await data("(()=>{const w=document.querySelector('#today .prototype-list .aj-c-recrow__wave'),s=getComputedStyle(w.querySelector('.aj-c-wave'));return {same:w.innerHTML.replace(/ style=\"[^\"]*\"/g,'')===window.__initialWave,size:s.maskSize||s.webkitMaskSize}})()");
  check(now.same&&now.size.startsWith('742.8px'), 'Waveform survives responsive profile change at its fixed pitch',{width,...now});
  const size=await data("(()=>{const w=document.querySelector('#today .prototype-list .aj-c-recrow__wave'),t=document.querySelector('#today .prototype-list .aj-c-recrow__clock');return {wave:w.getBoundingClientRect().width,timer:t.getBoundingClientRect().width};})()");
  await click('#today .prototype-list .aj-c-play');await pause(180);
  check(await evaluate("document.querySelector('#today .prototype-list .aj-c-play').getAttribute('aria-label')==='Stop voice memo playback'&&Math.abs(document.querySelector('#today .prototype-list .aj-c-recrow__wave').getBoundingClientRect().width-"+size.wave+")<.01&&Math.abs(document.querySelector('#today .prototype-list .aj-c-recrow__clock').getBoundingClientRect().width-"+size.timer+")<.01"),'Playback keeps waveform and clock widths',{width,...size});
  if(engine==='chromium'&&[390,1440].includes(width))await screenshot('playback-'+width+'.png');
  if(width===1440){await wait("document.querySelector('#today .prototype-list .aj-c-recrow').dataset.playback==='complete'");if(engine==='chromium')await screenshot('playback-ended-1440.png');}
  else await click('#today .prototype-list .aj-c-play');
 }
 await viewport(390,844);await pause(200);await click('#today .prototype-list .aj-c-play');await pause(200);
 const samples=await data("new Promise(resolve=>{const values=[],start=performance.now();const sample=()=>{values.push(1-parseFloat(getComputedStyle(document.querySelector('#today .prototype-list .aj-c-recrow__progress')).clipPath.split(/\\s+/)[1])/100);if(performance.now()-start<700)requestAnimationFrame(sample);else resolve(values);};requestAnimationFrame(sample);})");
 const distinct=new Set(samples).size,maxStep=Math.max(...samples.slice(1).map((x,i)=>x-samples[i]));
 check(distinct>=samples.length*.8&&maxStep<.03,'Playback progress interpolates native clock updates',{frames:samples.length,distinct,maxStep});
 await wait("document.querySelector('#today .prototype-list .aj-c-recrow').dataset.playback==='complete'");
 check(await evaluate("getComputedStyle(document.querySelector('#today .prototype-list .aj-c-recrow__wave-played')).opacity==='1'&&document.querySelector('#today .prototype-list .aj-c-recrow').style.getPropertyValue('--aj-c-recrow-progress')==='1'"),'Natural finish keeps complete waveform',{});
 if(engine==='chromium')await screenshot('playback-ended-390.png');
 // Retry and unavailable permission stay inline; no separate app permission page.
 for(const [error,state] of [['NotAllowedError','denied'],['NotFoundError','missing']]){
  await evaluate('navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException("Unavailable",'+JSON.stringify(error)+'));');
  await click('#today .aj-c-composer .aj-c-composer__mic');await wait("document.querySelector('#talk .aj-s-recorder').dataset.microphone==="+JSON.stringify(state));
  check(await evaluate("location.hash==='#talk'&&document.querySelector('#talk [data-recorder=\"start\"]').disabled&&!document.querySelector('#talk [data-microphone-status]').hidden&&!document.querySelector('#talk [data-recorder=\"retry\"]').hidden"),'Inline microphone recovery',{state});
  if(engine==='chromium'&&state==='denied')await screenshot('denied-390.png');
  await click('#talk [data-recorder="back"]');await wait("location.hash==='#today'");
 }
 await evaluate('navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.__resolveMic=resolve);');await click('#today .aj-c-composer .aj-c-composer__mic');await wait("!!window.__resolveMic");await click('#talk [data-recorder="back"]');
 await evaluate('window.__late=new AudioContext();const d=window.__late.createMediaStreamDestination();window.__lateTrack=d.stream.getTracks()[0];window.__resolveMic(d.stream);');await pause(150);
 check(await evaluate("location.hash==='#today'&&window.__lateTrack.readyState==='ended'"),'Cancelled pending permission releases late stream',{});
 // 200% text and production reduced motion, on the current mobile shell.
 await evaluate('navigator.mediaDevices.getUserMedia=window.__native;');await click('#today .aj-c-composer .aj-c-composer__mic');await wait("document.querySelector('#talk .aj-s-recorder').dataset.microphone==='granted'");
 await viewport(320,844);await evaluate("for(const e of document.querySelectorAll('#talk .aj-s-recorder__main *'))e.dataset.testSize=getComputedStyle(e).fontSize;for(const e of document.querySelectorAll('#talk .aj-s-recorder__main *'))e.style.fontSize=(parseFloat(e.dataset.testSize)*2)+'px';");
 check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Recorder survives 200% text',{});
 await click('#talk [data-recorder="start"]');await wait("document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase==='recording'");
 await evaluate('delete document.documentElement.dataset.motionReview');await pause(150);const wave=await evaluate("document.querySelector('#talk [data-live-wave]').innerHTML");await pause(200);
 check(wave===await evaluate("document.querySelector('#talk [data-live-wave]').innerHTML"),'Production reduced motion freezes drawing, capture continues',{});
 await click('#talk [data-recorder="keep"]');await wait("location.hash==='#today'");
 await evaluate('window.__contexts.forEach(c=>c.close());window.__late.close();');
 check(!errors.length&&!requests.length,'No browser exceptions or external requests',{errors,requests});
 fs.writeFileSync(path.join(evidence,engine+'-checks.json'),JSON.stringify({engine,files,results,errors,requests},null,2)+'\n');
 console.log('PASS '+engine+': '+results.length+' integrated recording checks');
}catch(error){
 fs.writeFileSync(path.join(evidence,engine+'-failure.json'),JSON.stringify({engine,status:'failed',error:error.message,results},null,2)+'\n');
 throw error;
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
