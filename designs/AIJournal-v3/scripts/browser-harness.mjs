// Shared disposable-browser lifecycle and CDP/BiDi transport. Node 22+, no npm.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {resolveBrowser} from './browser-paths.mjs';
export const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function removeTemporaryDirectory(directory){
 const resolved=path.resolve(directory),parent=path.resolve(os.tmpdir());
 if(!resolved.startsWith(parent+path.sep))throw Error('Unsafe temporary directory: '+resolved);
 fs.rmSync(resolved,{recursive:true,force:true,maxRetries:4,retryDelay:250});
}
export async function startBrowser({temp,engine='chromium',reducedMotion=true}={}){
 const executable=resolveBrowser(engine);
 const profile=path.join(temp,'profile');fs.mkdirSync(profile,{recursive:true});
 const port=30000+Math.floor(Math.random()*20000);
 if(engine==='firefox')fs.writeFileSync(path.join(profile,'user.js'),[
  `user_pref("ui.prefersReducedMotion",${reducedMotion?1:0});`,
  'user_pref("security.sandbox.content.level",0);',
  'user_pref("browser.shell.checkDefaultBrowser",false);',
  'user_pref("media.navigator.streams.fake",true);',
  'user_pref("media.navigator.permission.disabled",true);'
 ].join('\n'));
 const args=engine==='firefox'?['-headless','-no-remote','-profile',profile,'--remote-debugging-port',String(port),'about:blank']:
  ['--headless','--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'];
 const browser=spawn(executable,args,{windowsHide:true,stdio:'ignore',env:{...process.env,MOZ_DISABLE_CONTENT_SANDBOX:'1'}});
 let socket,next=0,context,closed=false;const pending=new Map(),errors=[],requests=[];
 let spawnError;browser.on('error',error=>{spawnError=error;});
 const call=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timed out: '+method));},30000);
  pending.set(id,{resolve,reject,timer});
  try{socket.send(JSON.stringify({id,method,params}));}catch(error){clearTimeout(timer);pending.delete(id);reject(error);}
 });
 async function close(){
  if(closed)return;closed=true;
  if(socket?.readyState===WebSocket.OPEN)try{await Promise.race([call(engine==='firefox'?'session.end':'Browser.close'),pause(1200)]);}catch{}
  socket?.close();browser.kill();
  for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('Browser closed'));}pending.clear();
  await pause(700);
 }
 try{
  for(let i=0;i<65;i++){
   if(spawnError)throw spawnError;
   if(browser.exitCode!==null)throw Error('Browser exited before its endpoint opened');
   try{
    let url=`ws://127.0.0.1:${port}/session`;
    if(engine!=='firefox'){
     const pages=await(await fetch(`http://127.0.0.1:${port}/json`)).json();
     url=pages.find(p=>p.type==='page')?.webSocketDebuggerUrl;if(!url)throw Error('No browser page');
    }
    socket=new WebSocket(url);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    break;
   }catch{socket?.close();socket=null;await pause(200);}
  }
  if(!socket)throw Error('Browser debugging endpoint unavailable');
  socket.addEventListener('message',event=>{
   const m=JSON.parse(event.data);
   if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
   if(m.method==='log.entryAdded'&&m.params.type==='javascript'&&m.params.level==='error')errors.push(m.params.text);
   const request=m.method==='Network.requestWillBeSent'||m.method==='network.beforeRequestSent'?m.params.request.url:null;
   if(request&&/^https?:/.test(request))requests.push(request);
   if(m.id){const item=pending.get(m.id);if(!item)return;pending.delete(m.id);clearTimeout(item.timer);if(m.error||m.type==='error')item.reject(Error(JSON.stringify(m.error||m.message)));else item.resolve(m.result);}
  });
  if(engine==='firefox'){
   await call('session.new',{capabilities:{alwaysMatch:{}}});
   for(let i=0;i<60;i++){context=(await call('browsingContext.getTree')).contexts[0]?.context;if(context)break;await pause(100);}
   if(!context)throw Error('Firefox browsing context unavailable');
   await call('session.subscribe',{events:['log.entryAdded']});
  }else{
   await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reducedMotion?'reduce':'no-preference'}]});
  }
  const value=remote=>remote?.type==='object'?Object.fromEntries(remote.value.map(([k,v])=>[typeof k==='string'?k:value(k),value(v)])):remote?.type==='array'?remote.value.map(value):remote?.value;
  const evaluate=async expression=>{
   const reply=await call(engine==='firefox'?'script.evaluate':'Runtime.evaluate',engine==='firefox'?{expression,target:{context},awaitPromise:true,userActivation:true}:{expression,returnByValue:true,awaitPromise:true,userGesture:true});
   if(reply.type==='exception'||reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text);
   return engine==='firefox'?value(reply.result):reply.result.value;
  };
  const navigate=url=>call(engine==='firefox'?'browsingContext.navigate':'Page.navigate',engine==='firefox'?{context,url,wait:'complete'}:{url});
  const viewport=(width,height)=>call(engine==='firefox'?'browsingContext.setViewport':'Emulation.setDeviceMetricsOverride',engine==='firefox'?{context,viewport:{width,height},devicePixelRatio:1}:{width,height,deviceScaleFactor:1,mobile:false});
  const captureScreenshot=async()=>{const r=await call(engine==='firefox'?'browsingContext.captureScreenshot':'Page.captureScreenshot',engine==='firefox'?{context}:{format:'png',captureBeyondViewport:false});return Buffer.from(r.data,'base64');};
  return {call,socket,context,evaluate,navigate,viewport,captureScreenshot,errors,requests,close};
 }catch(error){await close();throw error;}
}
