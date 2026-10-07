import {startBrowser,pause,removeTemporaryDirectory} from './browser-harness.mjs';
// Browser smoke check for the generated walkthrough's text and voice controls.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'journal-v3-runtime-'));
let session;
try{
 session=await startBrowser({temp});
 const {call,errors,evaluate:evalJs}=session;

 const waitFor=async expression=>{for(let i=0;i<80;i++){if(await evalJs(expression))return;await pause(100);}throw Error('Timed out: '+expression);};
 await call('Page.enable');await call('Runtime.enable');
 const results=[];
 for(const file of ['journal-prototype.html','journal-prototype-tablet.html','journal-prototype-desktop.html']){
  const width=file.includes('tablet')?920:file.includes('desktop')?1520:430;
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  const navigation=await call('Page.navigate',{url:pathToFileURL(path.join(root,file)).href+'#today'});
  let ready=false;
  for(let attempt=0;attempt<40;attempt++){
   try{ready=await evalJs(`!!document.querySelector('#today textarea.prototype-input')`);}catch{}
   if(ready)break;
   await pause(100);
  }
  if(!ready){
   let state;try{state=await evalJs(`({url:location.href,scripts:document.scripts.length,body:document.body?.textContent.slice(0,120)})`);}catch(error){state=String(error);}
   throw Error(`${file}: interactive composer did not load: ${JSON.stringify({navigation,state,errors})}`);
  }
  const typed=await evalJs(`(()=>{
   const screen=document.getElementById('today');
   const field=screen.querySelector('textarea.prototype-input');
   const button=screen.querySelector('.composer .crow button');
   if(!field||!button)return {error:'composer missing'};
   field.value='   ';field.dispatchEvent(new Event('input',{bubbles:true}));
   const blankRemainsRecord=button.classList.contains('mic');
   field.value='A real preview entry.';field.dispatchEvent(new Event('input',{bubbles:true}));
   const switched=button.textContent.trim()==='Save';button.click();
   return {blankRemainsRecord,switched,shown:screen.querySelector('.prototype-list')?.textContent.includes('A real preview entry.'),reset:button.classList.contains('mic'),status:screen.querySelector('.composer .prototype-feedback')?.textContent};
  })()`);
  if(!typed.blankRemainsRecord||!typed.switched||!typed.shown||!typed.reset||!typed.status?.includes('reload'))throw Error(`${file}: text path failed: ${JSON.stringify(typed)}`);
  if(file==='journal-prototype.html'){
   await evalJs(`document.querySelector('#today .prototype-list').scrollIntoView({block:'center'})`);
   await pause(120);
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(root,'verification','v3-interactive-entry.png'),Buffer.from(shot.data,'base64'));
  }
  await evalJs(`document.querySelector('#today .composer .mic').click()`);
  if(await evalJs('location.hash')!=='#talk')throw Error(`${file}: recorder did not open directly`);
  await waitFor(`document.querySelector('#talk .app').dataset.microphone==='granted'`);
  if(await evalJs(`document.querySelector('#talk [data-clock]').textContent`)!=='0:00')throw Error('Recording started without an explicit Start');
  await evalJs(`document.querySelector('#talk [data-recorder="start"]').click()`);
  await waitFor(`document.querySelector('#talk .app').dataset.recorderPhase==='recording'`);
  await pause(850);
  const started=await evalJs(`({hash:location.hash,phase:document.querySelector('#talk .app').dataset.recorderPhase,readout:document.querySelector('#talk [data-clock]')?.textContent,secure:isSecureContext,media:!!navigator.mediaDevices,recorder:!!window.MediaRecorder})`);
  if(started.hash!=='#talk'||started.phase!=='recording')throw Error(`${file}: microphone did not start: ${JSON.stringify(started)}`);
  const paused=await evalJs(`(()=>{const button=[...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Pause');button.click();return button.textContent.trim()})()`);
  if(paused!=='Resume')throw Error(`${file}: pause did not work`);
  await evalJs(`([...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Resume')).click()`);
  await pause(300);
  await evalJs(`([...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Stop and keep')).click()`);
  await pause(500);
  const kept=await evalJs(`({hash:location.hash,download:document.querySelector('#recording-kept .prototype-download')?.href,preview:document.querySelector('#today .prototype-list')?.textContent,play:document.querySelector('#today .prototype-list .play')?.dataset.prototypeRecordingId})`);
  if(kept.hash!=='#today'||!kept.download?.startsWith('blob:')||!kept.preview?.includes('A real preview entry.')||!kept.play)throw Error(`${file}: recording path failed: ${JSON.stringify(kept)}`);
  if(file==='journal-prototype.html'){
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(root,'verification','v3-interactive-recording.png'),Buffer.from(shot.data,'base64'));
  }
  await evalJs(`document.querySelector('#today .prototype-list .play').click()`);
  await pause(120);
  const playing=await evalJs(`({label:document.querySelector('#today .prototype-list .play').getAttribute('aria-label'),message:document.querySelector('#today .prototype-list .prototype-feedback')?.textContent})`);
  if(playing.label!=='Stop voice memo playback')throw Error(`${file}: playback did not start: ${JSON.stringify(playing)}`);
  await evalJs(`document.querySelector('#today .prototype-list .play').click()`);
  if(file==='journal-prototype.html'){
   await evalJs(`location.hash='today';document.querySelector('#today .composer .mic').click()`);
   await waitFor(`document.querySelector('#talk .app').dataset.microphone==='granted'`);
   await evalJs(`document.querySelector('#talk [data-recorder="start"]').click()`);
   await waitFor(`document.querySelector('#talk .app').dataset.recorderPhase==='recording'`);
   await pause(550);
   if(await evalJs('location.hash')!=='#talk')throw Error('Back-button recording did not start');
   await evalJs(`document.querySelector('#talk [data-recorder="back"]').click()`);
   await pause(400);
   const back=await evalJs(`({hash:location.hash,count:document.querySelectorAll('#today .prototype-list .recrow').length})`);
   if(back.hash!=='#today'||back.count!==2)throw Error(`Back did not stop and keep: ${JSON.stringify(back)}`);
   await evalJs(`Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:()=>Promise.reject(new DOMException('Blocked','NotAllowedError'))});document.querySelector('#today .composer .mic').click()`);
   await pause(150);
   if(!await evalJs(`location.hash==='#talk'&&document.querySelector('#talk .app').dataset.microphone==='denied'&&document.querySelector('#talk [data-recorder="start"]').disabled`))throw Error('Denied permission did not disable Start with an inline status');
   const empty=await evalJs(`(()=>{location.hash='empty-today';const screen=document.getElementById('empty-today');const field=screen.querySelector('textarea.prototype-input');field.value='First day entry.';field.dispatchEvent(new Event('input',{bubbles:true}));screen.querySelector('.composer .send').click();return {shown:screen.querySelector('.prototype-list')?.textContent.includes('First day entry.'),emptyHidden:screen.querySelector('.empty')?.hidden,hash:location.hash}})()`);
   if(!empty.shown||!empty.emptyHidden||empty.hash!=='#empty-today')throw Error(`Empty Today input failed: ${JSON.stringify(empty)}`);
  }
  results.push({file,typed,started,paused,kept:{hash:kept.hash,downloadReady:true,playReady:true,playbackStarted:true}});
 }
 if(errors.length)throw Error(`Browser exceptions: ${errors.join('; ')}`);
 console.log(JSON.stringify(results,null,2));
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
