import {startBrowser,pause,removeTemporaryDirectory} from '../tools/lib/browser-harness.mjs';
// Browser smoke check for the generated walkthrough's text and voice controls.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(path.join(root,'verification'),{recursive:true});
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
   const button=screen.querySelector('.aj-c-composer .aj-c-composer__row button');
   if(!field||!button)return {error:'composer missing'};
   field.value='   ';field.dispatchEvent(new Event('input',{bubbles:true}));
   const blankRemainsRecord=button.classList.contains('aj-c-composer__mic');
   field.value='A real preview entry.';field.dispatchEvent(new Event('input',{bubbles:true}));
   const switched=button.textContent.trim()==='Save';button.click();
   return {blankRemainsRecord,switched,shown:screen.querySelector('.prototype-list')?.textContent.includes('A real preview entry.'),reset:button.classList.contains('aj-c-composer__mic'),status:screen.querySelector('.aj-c-composer .prototype-feedback')?.textContent};
  })()`);
  if(!typed.blankRemainsRecord||!typed.switched||!typed.shown||!typed.reset||!typed.status?.includes('reload'))throw Error(`${file}: text path failed: ${JSON.stringify(typed)}`);
  if(file==='journal-prototype.html'){
   await evalJs(`document.querySelector('#today .prototype-list').scrollIntoView({block:'center'})`);
   await pause(120);
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(root,'verification','v3-interactive-entry.png'),Buffer.from(shot.data,'base64'));
  }
  await evalJs(`document.querySelector('#today .aj-c-composer .aj-c-composer__mic').click()`);
  if(await evalJs('location.hash')!=='#talk')throw Error(`${file}: recorder did not open directly`);
  await waitFor(`document.querySelector('#talk .aj-s-recorder').dataset.microphone==='granted'`);
  if(await evalJs(`document.querySelector('#talk [data-clock]').textContent`)!=='0:00')throw Error('Recording started without an explicit Start');
  await evalJs(`document.querySelector('#talk [data-recorder="start"]').click()`);
  await waitFor(`document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase==='recording'`);
  await pause(850);
  const started=await evalJs(`({hash:location.hash,phase:document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase,readout:document.querySelector('#talk [data-clock]')?.textContent,secure:isSecureContext,media:!!navigator.mediaDevices,recorder:!!window.MediaRecorder})`);
  if(started.hash!=='#talk'||started.phase!=='recording')throw Error(`${file}: microphone did not start: ${JSON.stringify(started)}`);
  const paused=await evalJs(`(()=>{const button=[...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Pause');button.click();return button.textContent.trim()})()`);
  if(paused!=='Resume')throw Error(`${file}: pause did not work`);
  await evalJs(`([...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Resume')).click()`);
  await pause(300);
  await evalJs(`([...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Stop and keep')).click()`);
  await pause(500);
  const kept=await evalJs(`({hash:location.hash,download:document.querySelector('#recording-kept .prototype-download')?.href,preview:document.querySelector('#today .prototype-list')?.textContent,play:document.querySelector('#today .prototype-list .aj-c-play')?.dataset.prototypeRecordingId})`);
  if(kept.hash!=='#today'||!kept.download?.startsWith('blob:')||!kept.preview?.includes('A real preview entry.')||!kept.play)throw Error(`${file}: recording path failed: ${JSON.stringify(kept)}`);
  if(file==='journal-prototype.html'){
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(root,'verification','v3-interactive-recording.png'),Buffer.from(shot.data,'base64'));
  }
  await evalJs(`document.querySelector('#today .prototype-list .aj-c-play').click()`);
  await pause(120);
  const playing=await evalJs(`({label:document.querySelector('#today .prototype-list .aj-c-play').getAttribute('aria-label'),message:document.querySelector('#today .prototype-list .prototype-feedback')?.textContent})`);
  if(playing.label!=='Stop voice memo playback')throw Error(`${file}: playback did not start: ${JSON.stringify(playing)}`);
  await evalJs(`document.querySelector('#today .prototype-list .aj-c-play').click()`);
  if(file==='journal-prototype.html'){
   await evalJs(`location.hash='today';document.querySelector('#today .aj-c-composer .aj-c-composer__mic').click()`);
   await waitFor(`document.querySelector('#talk .aj-s-recorder').dataset.microphone==='granted'`);
   await evalJs(`document.querySelector('#talk [data-recorder="start"]').click()`);
   await waitFor(`document.querySelector('#talk .aj-s-recorder').dataset.recorderPhase==='recording'`);
   await pause(2200);
   if(await evalJs('location.hash')!=='#talk')throw Error('Back-button recording did not start');
   // v4 C5: leaving keeps the memo as the one draft: nothing is kept, and Today carries the draft line.
   const app="document.querySelector('#talk .aj-s-recorder')",q=s=>`document.querySelector('#talk ${s}')`;
   const toDraft=async()=>{await evalJs(`${q('[data-recorder="back"]')}.click()`);await pause(300);return evalJs(`({hash:location.hash,count:document.querySelectorAll('#today .prototype-list .aj-c-recrow').length,line:document.querySelector('#today .aj-c-composer [data-hook~=draft]')?.getAttribute('aria-label'),empty:!!document.querySelector('#empty-today .aj-c-composer [data-hook~=draft]')})`);};
   const parked=await toDraft();
   if(parked.hash!=='#today'||parked.count!==1||!/^Continue your voice memo draft, 0:0[2-3]$/.test(parked.line||'')||!parked.empty)throw Error(`Back did not keep a draft: ${JSON.stringify(parked)}`);
   const reopen=async()=>{await evalJs(`document.querySelector('#today .aj-c-composer [data-hook~=draft]').click()`);await pause(200);return evalJs(`({hash:location.hash,phase:${app}.dataset.recorderPhase,draft:${app}.hasAttribute('data-draft'),state:${q('[data-session-state]')}.textContent,date:${q('[data-session-date]')}.textContent,slider:${q('[data-hook~=track]')}.getAttribute('role'),player:getComputedStyle(${q('[data-hook~=player]')}).display})`);};
   const opened=await reopen();
   if(opened.hash!=='#talk'||opened.phase!=='paused'||!opened.draft||opened.state!=='Paused · draft'||opened.slider!=='slider'||opened.player==='none'||/:/.test(opened.date))throw Error(`Continue did not open the draft: ${JSON.stringify(opened)}`);
   // The player: keys, a click on the trace, play, and Resume stopping playback.
   const at=()=>evalJs(`({now:${q('[data-hook~=track]')}.getAttribute('aria-valuenow'),max:${q('[data-hook~=track]')}.getAttribute('aria-valuemax'),text:${q('[data-hook~=track]')}.getAttribute('aria-valuetext'),at:Number(${app}.style.getPropertyValue('--aj-s-recorder-at')||0),playback:${app}.dataset.playback||'',label:${q('[data-recorder="play"]')}.getAttribute('aria-label')})`);
   const key=k=>evalJs(`(()=>{const t=${q('[data-hook~=track]')};t.focus();t.dispatchEvent(new KeyboardEvent('keydown',{key:'${k}',bubbles:true}));})()`);
   await key('End');const end=await at();
   await key('Home');const home=await at();
   await evalJs(`(()=>{const t=${q('[data-hook~=track]')},r=t.getBoundingClientRect();t.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+r.width/2,clientY:r.top+r.height/2,pointerId:1,bubbles:true}));})()`);const middle=await at();
   if(end.at!==1||home.at!==0||home.playback!==''||Math.abs(middle.at-.5)>.02||middle.playback!=='started')throw Error(`Player seek failed: ${JSON.stringify({end,home,middle})}`);
   await key('Home');await evalJs(`${q('[data-recorder="play"]')}.click()`);await pause(400);const playing=await at();
   if(playing.playback!=='playing'||playing.at<=0||playing.label!=='Pause playback')throw Error(`Playback did not run: ${JSON.stringify(playing)}`);
   await evalJs(`${q('[data-recorder="pause"]')}.click()`);await pause(80);
   const resumed=await evalJs(`({phase:${app}.dataset.recorderPhase,playback:${app}.dataset.playback||'',slider:${q('[data-hook~=track]')}.getAttribute('role'),draft:${app}.hasAttribute('data-draft'),line:!!document.querySelector('#today .aj-c-composer [data-hook~=draft]')})`);
   if(resumed.phase!=='recording'||resumed.playback||resumed.slider||resumed.draft||resumed.line)throw Error(`Resume did not stop playback and record on: ${JSON.stringify(resumed)}`);
   await pause(300);
   if(!(await toDraft()).line)throw Error('Leaving while recording did not keep a draft');
   // Discard asks first; Go back returns to Discard; Discard memo returns to Today with nothing kept.
   await reopen();
   await evalJs(`${q('[data-recorder="discard"]')}.click()`);
   const asked=await evalJs(`({shown:!${q('[data-hook~=confirm]')}.hidden,focus:document.activeElement?.dataset.recorder,words:${q('[data-hook~=confirm]')}.textContent})`);
   if(!asked.shown||asked.focus!=='discard-no'||!/^Discard this 0:0\d memo\? This cannot be undone\./.test(asked.words))throw Error(`Discard did not ask: ${JSON.stringify(asked)}`);
   await evalJs(`${q('[data-recorder="discard-no"]')}.click()`);
   const kept=await evalJs(`({hidden:${q('[data-hook~=confirm]')}.hidden,focus:document.activeElement?.dataset.recorder})`);
   if(!kept.hidden||kept.focus!=='discard')throw Error(`Go back failed: ${JSON.stringify(kept)}`);
   await evalJs(`${q('[data-recorder="discard"]')}.click();${q('[data-recorder="discard-yes"]')}.click()`);await pause(200);
   const discarded=await evalJs(`({hash:location.hash,count:document.querySelectorAll('#today .prototype-list .aj-c-recrow').length,line:!!document.querySelector('#today .aj-c-composer [data-hook~=draft]'),phase:${app}.dataset.recorderPhase})`);
   if(discarded.hash!=='#today'||discarded.count!==1||discarded.line||discarded.phase!=='idle')throw Error(`Discard memo failed: ${JSON.stringify(discarded)}`);
   // The round trip: a draft kept later is dated when it is kept and joins the day; the line goes.
   await evalJs(`document.querySelector('#today .aj-c-composer .aj-c-composer__mic').click()`);
   await waitFor(`${app}.dataset.microphone==='granted'`);await evalJs(`${q('[data-recorder="start"]')}.click()`);
   await waitFor(`${app}.dataset.recorderPhase==='recording'`);await pause(600);
   await toDraft();await evalJs(`document.querySelector('#today .aj-c-composer .aj-c-composer__mic').click()`);await pause(150);
   if(!await evalJs(`location.hash==='#talk'&&${app}.hasAttribute('data-draft')`))throw Error('The mic did not open the draft');
   await evalJs(`${q('[data-recorder="keep"]')}.click()`);await pause(500);
   const back=await evalJs(`({hash:location.hash,count:document.querySelectorAll('#today .prototype-list .aj-c-recrow').length,line:!!document.querySelector('#today .aj-c-composer [data-hook~=draft]')})`);
   if(back.hash!=='#today'||back.count!==2||back.line)throw Error(`Keeping the draft failed: ${JSON.stringify(back)}`);
   await evalJs(`Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:()=>Promise.reject(new DOMException('Blocked','NotAllowedError'))});document.querySelector('#today .aj-c-composer .aj-c-composer__mic').click()`);
   await pause(150);
   if(!await evalJs(`location.hash==='#talk'&&document.querySelector('#talk .aj-s-recorder').dataset.microphone==='denied'&&document.querySelector('#talk [data-recorder="start"]').disabled`))throw Error('Denied permission did not disable Start with an inline status');
   const empty=await evalJs(`(()=>{location.hash='empty-today';const screen=document.getElementById('empty-today');const field=screen.querySelector('textarea.prototype-input');field.value='First day entry.';field.dispatchEvent(new Event('input',{bubbles:true}));screen.querySelector('.aj-c-composer .aj-c-send').click();return {shown:screen.querySelector('.prototype-list')?.textContent.includes('First day entry.'),emptyHidden:screen.querySelector('.aj-c-empty')?.hidden,hash:location.hash}})()`);
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
