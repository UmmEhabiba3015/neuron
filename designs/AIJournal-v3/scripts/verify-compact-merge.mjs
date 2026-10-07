import {startBrowser,pause,removeTemporaryDirectory} from './browser-harness.mjs';
// Integrated Compact Transport: standalone main website, real capture and measured playback.
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
  await evaluate(name.startsWith('playback')?"document.querySelector('#today .prototype-list .recrow').scrollIntoView({block:'center',behavior:'instant'})":'scrollTo(0,0)');await pause(80);
  fs.writeFileSync(path.join(evidence,name),await session.captureScreenshot());
 };
 const data=expression=>evaluate('(async()=>JSON.stringify(await ('+expression+')))()').then(JSON.parse);
 const check=(condition,name,detail)=>{if(!condition)throw Error(name+': '+JSON.stringify(detail));results.push({check:name,...detail});};
 const wait=async expression=>{
  for(let i=0;i<80;i++){try{if(await evaluate(expression))return;}catch{}await pause(100);}
  const detail=await data("(async()=>({memos:[...document.querySelectorAll('#today .prototype-list .recrow')].map(r=>({playback:r.dataset.playback,button:r.querySelector('.play')?.getAttribute('aria-label'),clock:r.querySelector('.journal-memo-clock')?.textContent})),duration:(await window.__journalPreview.snapshot()).recordings.map(r=>r.duration)}))()");
  throw Error('Timed out: '+expression+'; '+JSON.stringify(detail));
 };
 const click=selector=>evaluate('document.querySelector('+JSON.stringify(selector)+').click()');
 await viewport(1440,960);await navigate(pathToFileURL(path.join(temp,files[0])).href+'?fonts=portable#today');
 await wait("!!document.querySelector('#today .prototype-input')");
 await evaluate('window.__native=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);window.__tracks=[];window.__contexts=[];window.__recorders=[];const OriginalRecorder=window.MediaRecorder;window.MediaRecorder=class extends OriginalRecorder{constructor(...args){super(...args);window.__recorders.push(this);}};');
 // First permission uses the real browser getUserMedia entry point (fake device).
 await click('#today .composer .mic');await wait("document.querySelector('#talk .app').dataset.microphone==='granted'");
 check(await evaluate("location.hash==='#talk'&&document.querySelector('#talk [data-clock]').textContent==='0:00'&&window.__recorders.length===0"),'Direct ready screen, explicit Start',{});
 await click('#talk [data-recorder="back"]');await wait("location.hash==='#today'");
 // Measured sound fixture, through the same real Web Audio and MediaRecorder path.
 await evaluate('navigator.mediaDevices.getUserMedia=async()=>{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain(),d=c.createMediaStreamDestination();o.frequency.value=220;g.gain.value=0;o.connect(g);g.connect(d);o.start();await c.resume();window.__gain=g;window.__contexts.push(c);window.__tracks.push(...d.stream.getTracks());return d.stream;};');
 await click('#today .composer .mic');await wait("document.querySelector('#talk .app').dataset.microphone==='granted'");
 await click('#talk [data-recorder="start"]');await wait("document.querySelector('#talk .app').dataset.recorderPhase==='recording'");
 await pause(500);
 const flat=await evaluate("Math.max(...[...document.querySelectorAll('#talk [data-live-wave] g')].map(b=>Number(b.style.transform.slice(7,-1))))");
 await evaluate('window.__gain.gain.value=.008');await pause(600);const low=await evaluate("Number(document.querySelector('#talk [data-live-wave] g:last-child').style.transform.slice(7,-1))");
 await evaluate('window.__gain.gain.value=.25');await pause(650);const loud=await evaluate("Number(document.querySelector('#talk [data-live-wave] g:last-child').style.transform.slice(7,-1))");
 check(flat<=.016&&low>.015&&loud>low*2,'Sound drives measured waveform',{flat,low,loud});
 for(const width of [320,390,834,1440,2560]){
  await viewport(width,width<620?844:960);await pause(100);
  const layout=await data("(()=>{const s=document.querySelector('#talk .recording-sheet');return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,rail:document.querySelector('#talk .rail').getBoundingClientRect().left,height:s.getBoundingClientRect().height,wave:document.querySelector('#talk [data-live-wave]').getBoundingClientRect().height,phase:document.querySelector('#talk .app').dataset.recorderPhase,bad:[...document.querySelectorAll('#talk button,#talk a')].filter(e=>e.getClientRects().length&&(e.getBoundingClientRect().height<43.9||e.getBoundingClientRect().width<43.9)).map(e=>e.textContent)}})()");
  check(!layout.overflow&&layout.rail===0&&layout.phase==='recording'&&!layout.bad.length&&layout.wave===80,'Recorder resize preserves live session',layout);
  if(engine==='chromium'&&[390,1440].includes(width))await screenshot('recording-'+width+'.png');
 }
 await viewport(390,844);await click('#talk [data-recorder="pause"]');
 const frozen=await evaluate("document.querySelector('#talk [data-clock]').textContent+document.querySelector('#talk [data-live-wave]').innerHTML");await pause(300);
 check(await evaluate("document.querySelector('#talk .app').dataset.recorderPhase==='paused'&&window.__recorders.at(-1).state==='paused'&&!window.__tracks.at(-1).enabled")&&frozen===await evaluate("document.querySelector('#talk [data-clock]').textContent+document.querySelector('#talk [data-live-wave]').innerHTML"),'Pause freezes capture, timer and waveform',{});
 await click('#talk [data-recorder="pause"]');await pause(200);await click('#talk [data-recorder="keep"]');await wait("location.hash==='#today'&&!!document.querySelector('#today .prototype-list .journal-memo-wave')");await pause(250);
 const saved=await data("(async()=>{const s=await window.__journalPreview.snapshot();const m=s.recordings[0];return {count:s.recordings.length,bytes:m.blob.size,bins:m.waveform.length,peaks:new Set(m.waveform).size,stopped:window.__tracks.every(t=>t.readyState==='ended'),phase:document.querySelector('#talk .app').dataset.recorderPhase,active:active};})()");
 check(saved.count===1&&saved.bytes>0&&saved.bins===128&&saved.peaks>4&&saved.stopped&&saved.active==='mobile','Keep returns to journal, resize restores measured memo',saved);
 const initialWave=await evaluate("document.querySelector('#today .prototype-list .journal-memo-wave defs g').innerHTML");
 for(const width of [320,390,834,1440,2560]){
  await viewport(width,960);await pause(250);
  check(await evaluate("document.querySelector('#today .prototype-list .journal-memo-wave defs g').innerHTML=== "+JSON.stringify(initialWave)), 'Waveform survives responsive profile change',{width});
  const size=await data("(()=>{const w=document.querySelector('#today .prototype-list .journal-memo-wave'),t=document.querySelector('#today .prototype-list .journal-memo-clock');return {wave:w.getBoundingClientRect().width,timer:t.getBoundingClientRect().width};})()");
  await click('#today .prototype-list .play');await pause(180);
  check(await evaluate("document.querySelector('#today .prototype-list .play').getAttribute('aria-label')==='Stop voice memo playback'&&Math.abs(document.querySelector('#today .prototype-list .journal-memo-wave').getBoundingClientRect().width-"+size.wave+")<.01&&Math.abs(document.querySelector('#today .prototype-list .journal-memo-clock').getBoundingClientRect().width-"+size.timer+")<.01"),'Playback keeps waveform and clock widths',{width,...size});
  if(engine==='chromium'&&[390,1440].includes(width))await screenshot('playback-'+width+'.png');
  if(width===1440){await wait("document.querySelector('#today .prototype-list .recrow').dataset.playback==='complete'");if(engine==='chromium')await screenshot('playback-ended-1440.png');}
  else await click('#today .prototype-list .play');
 }
 await viewport(390,844);await pause(200);await click('#today .prototype-list .play');await pause(200);
 const samples=await data("new Promise(resolve=>{const values=[],start=performance.now();const sample=()=>{values.push(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#today .prototype-list .memo-progress-clip')).transform).m11);if(performance.now()-start<700)requestAnimationFrame(sample);else resolve(values);};requestAnimationFrame(sample);})");
 const distinct=new Set(samples).size,maxStep=Math.max(...samples.slice(1).map((x,i)=>x-samples[i]));
 check(distinct>=samples.length*.8&&maxStep<.03,'Playback progress interpolates native clock updates',{frames:samples.length,distinct,maxStep});
 await wait("document.querySelector('#today .prototype-list .recrow').dataset.playback==='complete'");
 check(await evaluate("getComputedStyle(document.querySelector('#today .prototype-list .memo-wave-played')).opacity==='1'&&document.querySelector('#today .prototype-list .memo-progress-clip').style.transform==='scaleX(1)'"),'Natural finish keeps complete waveform',{});
 if(engine==='chromium')await screenshot('playback-ended-390.png');
 // Retry and unavailable permission stay inline; no separate app permission page.
 for(const [error,state] of [['NotAllowedError','denied'],['NotFoundError','missing']]){
  await evaluate('navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException("Unavailable",'+JSON.stringify(error)+'));');
  await click('#today .composer .mic');await wait("document.querySelector('#talk .app').dataset.microphone==="+JSON.stringify(state));
  check(await evaluate("location.hash==='#talk'&&document.querySelector('#talk [data-recorder=\"start\"]').disabled&&!document.querySelector('#talk [data-microphone-status]').hidden&&!document.querySelector('#talk [data-recorder=\"retry\"]').hidden"),'Inline microphone recovery',{state});
  if(engine==='chromium'&&state==='denied')await screenshot('denied-390.png');
  await click('#talk [data-recorder="back"]');await wait("location.hash==='#today'");
 }
 await evaluate('navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.__resolveMic=resolve);');await click('#today .composer .mic');await wait("!!window.__resolveMic");await click('#talk [data-recorder="back"]');
 await evaluate('window.__late=new AudioContext();const d=window.__late.createMediaStreamDestination();window.__lateTrack=d.stream.getTracks()[0];window.__resolveMic(d.stream);');await pause(150);
 check(await evaluate("location.hash==='#today'&&window.__lateTrack.readyState==='ended'"),'Cancelled pending permission releases late stream',{});
 // 200% text and production reduced motion, on the current mobile shell.
 await evaluate('navigator.mediaDevices.getUserMedia=window.__native;');await click('#today .composer .mic');await wait("document.querySelector('#talk .app').dataset.microphone==='granted'");
 await viewport(320,844);await evaluate("for(const e of document.querySelectorAll('#talk .compact-recorder *'))e.dataset.testSize=getComputedStyle(e).fontSize;for(const e of document.querySelectorAll('#talk .compact-recorder *'))e.style.fontSize=(parseFloat(e.dataset.testSize)*2)+'px';");
 check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Recorder survives 200% text',{});
 await click('#talk [data-recorder="start"]');await wait("document.querySelector('#talk .app').dataset.recorderPhase==='recording'");
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
