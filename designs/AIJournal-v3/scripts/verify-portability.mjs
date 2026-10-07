import {startBrowser,pause,removeTemporaryDirectory} from './browser-harness.mjs';
// Verify embedded fonts, independent exports and local preview tooling.
import fs from 'node:fs';
import {servePreview} from './serve-preview.mjs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'journal-website-'));
const standalone=path.join(temp,'journal-website.html');
fs.copyFileSync(path.join(root,'journal-website.html'),standalone);
const preview=await servePreview({port:0});
let session;
try{
 session=await startBrowser({temp});
 const {call,evaluate,errors,socket}=session;
 const ready=async expected=>{
  for(let i=0;i<80;i++){
   let value;
   try{value=await evaluate(`({active,loaded:!!document.getElementById('auth-login'),hash:location.hash})`);}catch{await pause(100);continue;}
   if(value.active===expected&&value.loaded)return value;
   await pause(100);
  }
  throw Error(`Preview did not load ${expected}: ${JSON.stringify(await evaluate('({active,changing,route,body:document.body.innerText.slice(0,200)})'))}`);
 };
 await call('Page.enable');await call('Runtime.enable');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:pathToFileURL(standalone).href});
 await ready('mobile');
 const assert=(ok,label,data)=>{if(!ok)throw Error(label+': '+JSON.stringify(data));};
 await call('Network.enable');const external=[];
 socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Network.requestWillBeSent'&&/^https?:/.test(m.params.request.url)&&!m.params.request.url.startsWith(preview.url+'/'))external.push(m.params.request.url);});
 await call('Page.navigate',{url:pathToFileURL(standalone).href+'?fonts=portable'});await ready('mobile');
 const loaded=await evaluate(`(async()=>{await Promise.all(['Journal Portable Prose','Journal Portable Labels','Journal Portable Hand'].map(f=>document.fonts.load('400 18px "'+f+'"','Café ĀăŻ Sunday')));await document.fonts.ready;return [...document.fonts].filter(f=>f.family.includes('Journal Portable')).map(f=>({family:f.family,status:f.status}))})()`);
 assert(loaded.length===6&&loaded.every(f=>f.status==='loaded'),'Six embedded font subsets',loaded);
 const layouts=[];
 for(const width of [320,390,834,1440,2560]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await ready(width<739?'mobile':width<1239?'tablet':'desktop');
  await evaluate('document.fonts.ready');
  for(const id of ['auth-login','auth-register','today','day','settings-data','account-devices']){
   await evaluate('location.hash='+JSON.stringify(id)+';scrollTo(0,0)');await pause(100);
   const layout=await evaluate(`(()=>{const s=document.getElementById('${id}'),prose=s.querySelector('.prose,.context-copy,.srowlink .lab'),hand=s.querySelector('.keybox .v:not(.printed)'),label=s.querySelector('label,.dest a,.shead,.tcol,.back');return {id:'${id}',width:${width},overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,prose:getComputedStyle(prose).fontFamily,label:getComputedStyle(label).fontFamily,hand:hand?getComputedStyle(hand).fontFamily:null,review:document.documentElement.dataset.motionReview}})()`);
   assert(!layout.overflow&&layout.prose.includes('Journal Portable Prose')&&layout.label.includes('Journal Portable Labels')&&(!layout.hand||layout.hand.includes('Journal Portable Hand'))&&layout.review==='play','Portable typography layout',layout);
   layouts.push(layout);
   if([390,1440].includes(width)&&['auth-login','today'].includes(id)){
    await pause(750);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'verification',`portable-fonts-${id}-${width}.png`),Buffer.from(shot.data,'base64'));
   }
  }
 }
 await evaluate("location.hash='save-failed'");await pause(100);
 const draft=await evaluate(`(()=>{const f=document.querySelector('#save-failed .prototype-input');return {retained:f.value.includes('flat people'),fits:f.scrollHeight<=f.clientHeight+2||getComputedStyle(f).overflowY==='auto'}})()`);
 assert(draft.retained&&draft.fits,'Draft reflows with portable fonts',draft);
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 await evaluate("location.hash='auth-register'");await pause(40);
 const enlarged=await evaluate(`(()=>{const s=document.getElementById('auth-register'),e=[...s.querySelectorAll('*')],sizes=e.map(x=>parseFloat(getComputedStyle(x).fontSize));e.forEach((x,i)=>x.style.fontSize=(sizes[i]*2)+'px');return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}})()`);
 assert(!enlarged.overflow,'Portable signup at 200% / 320px',enlarged);
 const componentFile=path.join(temp,'runtime.html');fs.copyFileSync(path.join(root,'design system/components/tests/runtime.html'),componentFile);
 await call('Page.navigate',{url:pathToFileURL(componentFile).href});await pause(400);
 const component=await evaluate(`({status:document.documentElement.dataset.testStatus,error:document.documentElement.dataset.testError})`);
 assert(component.status==='passed','Standalone component test',component);
 await call('Page.navigate',{url:preview.url+'/design%20system/components/tests/runtime.source.html'});await pause(400);
 const componentSource=await evaluate(`({status:document.documentElement.dataset.testStatus,error:document.documentElement.dataset.testError})`);
 assert(componentSource.status==='passed','Component source through local server',componentSource);
 const checks=[];
 for(const [route,status,type]of [['/',200,'text/html'],['/design%20system/components/journal-components.js',200,'text/javascript'],['/assets/fonts/lora-latin.woff2',200,'font/woff2'],['/missing-preview-file',404,'text/plain'],['/%2e%2e%2fREADME.md',403,'text/plain']]){
  const response=await fetch(preview.url+route);assert(response.status===status&&response.headers.get('content-type')?.startsWith(type),'Local preview response',{route,status:response.status});await response.arrayBuffer();checks.push({route,status});
 }
 await call('Page.navigate',{url:preview.url+'/'});await ready('mobile');
 const microphone=await evaluate(`({secure:isSecureContext,available:!!navigator.mediaDevices?.getUserMedia,recorder:!!window.MediaRecorder,recordingTypes:['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].filter(t=>MediaRecorder.isTypeSupported(t))})`);
 assert(microphone.secure&&microphone.available&&microphone.recorder&&microphone.recordingTypes.length,'Local microphone context',microphone);
 assert(!external.length&&!errors.length,'External requests or browser errors',{external,errors});
 fs.writeFileSync(path.join(root,'verification','portability-checks.json'),JSON.stringify({loaded,layouts,draft,enlarged,component,componentSource,checks,microphone,externalRequests:external,browserErrors:errors},null,2)+'\n');
 console.log('PASS: embedded fonts, 30 layouts, enlarged portable signup, isolated component test, local module source/server and microphone context.');
}finally{
 await session?.close();
 await new Promise(resolve=>{preview.server.close(resolve);preview.server.closeAllConnections();});
 removeTemporaryDirectory(temp);
}
