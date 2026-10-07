import {startBrowser,pause,removeTemporaryDirectory} from './browser-harness.mjs';
// Verify revised design states in the portable prototype in Edge.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'journal-website-'));
const standalone=path.join(temp,'journal-website.html');
fs.copyFileSync(path.join(root,'journal-website.html'),standalone);
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
 const evidence=[];
 const assert=(ok,label,data)=>{if(!ok)throw Error(label+': '+JSON.stringify(data));};
 for(const width of [390,834,1440]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await ready(width===390?'mobile':width===834?'tablet':'desktop');
  for(const id of ['settings-data','account-delete-confirm','account-delete-failed','today-without-note','day-without-note','save-failed','recording-upload-failed','mood-failed','entry-edit-failed','entry-edit-empty','entry-delete-failed','recording-delete-failed','today-loading','timeline-loading','day-loading','ask-loading','you-loading','timeline-earlier','timeline-end','fetch-failed','day-fetch-failed','account-only-device','account-device-signed-out','account-device-failed',
   'auth-login-error','auth-login-invalid','auth-login-sending','auth-login-rate','auth-login-network','auth-login-after-reset','auth-login-after-delete','auth-login-after-session','auth-register-error','auth-register-invalid','auth-register-short','auth-register-creating','auth-register-network','auth-forgot','auth-forgot-invalid','auth-forgot-sending','auth-forgot-sent','auth-forgot-rate','auth-forgot-network','auth-reset','auth-reset-short','auth-reset-saving','auth-reset-expired','auth-reset-network','auth-signed-out']){
   await evaluate('location.hash='+JSON.stringify(id)+';scrollTo(0,0)');await pause(25);
   const data=await evaluate(`(()=>{
    const s=document.getElementById('${id}'),text=s.textContent,q=x=>s.querySelector(x),all=x=>[...s.querySelectorAll(x)];
    const dialog=q('.dialog'),form=q('.auth-form'),memo=q('.recrow'),pwd=all('input[type="password"]');
    return {id:'${id}',width:${width},visible:getComputedStyle(s).display!=='none',overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
     text,dialogs:all('.dialog').length,dialogError:dialog?.innerText.includes('Nothing was deleted.'),safe:dialog?.querySelector('a.solid')?.textContent,
     paper:!!q('.auth-paper'),formFields:form?.querySelectorAll('input').length,confirmation:all('label').some(x=>x.textContent==='Confirm password'),
     passwordEyes:pwd.every(x=>!!s.querySelector('[aria-controls="'+x.id+'"].password-toggle')),hintCount:(text.match(/at least 8 characters/g)||[]).length,
     composer:!!q('.composer'),draft:q('.prototype-input')?.value,save:q('.composer .crow button')?.textContent,
     memoPlay:!!memo?.querySelector('button.play'),model:!!q('.glance,.said'),transcript:memo?.querySelector('.prose')?.textContent.trim(),
     chips:all('.chips button').length,selected:all('.chips button[aria-pressed="true"]').map(x=>x.textContent),
     changed:q('.entry-editor textarea')?.value,invalid:q('.entry-editor textarea')?.getAttribute('aria-invalid'),
     nav:all('.dest [aria-current="page"]').map(x=>x.textContent),mast:q('.wordmark')?.textContent,
     dates:!!q('.keybox'),rows:all('.dayrow').length,
     timezone:text.includes('Karachi (UTC+5)'),email:text.includes('mubeen@example.com'),deviceDate:text.includes('30 September 2026'),
     otherDevice:text.includes('Safari on iPhone'),passwordHint:text.includes('forgot-password'),
     warning:memo?.innerText.includes('closing it will lose the recording'),retry:memo?.textContent.includes('Send recording again')};
   })()`);
   assert(data.visible&&!data.overflow,'Visible state or overflow',data);
   if(id==='settings-data')assert(data.dialogs===0,'Your data must be unobstructed',data);
   if(id.startsWith('account-delete-'))assert(data.dialogs===1&&data.safe==='Export instead'&&(id.endsWith('confirm')||data.dialogError),'Deletion confirmation',data);
   if(id.endsWith('without-note'))assert(!data.model&&data.memoPlay&&data.transcript==='Voice memo'&&data.chips===5&&data.composer===(id==='today-without-note'),'Full model-free day',data);
   if(id==='save-failed')assert(data.composer&&data.draft?.includes('flat people')&&data.save==='Save','Save failure retained draft',data);
   if(id==='recording-upload-failed')assert(data.memoPlay&&data.warning&&data.retry,'Upload failure kept memo',data);
   if(id==='mood-failed')assert(data.chips===5&&data.selected.join()==='Low','Actual saved mood',data);
   if(id==='entry-edit-failed')assert(data.changed?.includes('I read the email again.'),'Changed edit retained',data);
   if(id==='entry-edit-empty')assert(data.changed===''&&data.invalid==='true','Empty edit validation',data);
   if(id.endsWith('-loading')){
    const expected={today:'Today',timeline:'Timeline',ask:'Ask',you:'You'}[id.split('-')[0]];
    assert((data.mast||data.dates)&&(!expected||data.nav.join()===expected)&&(!['today-loading','day-loading'].includes(id)||data.dates),'Loading page context',data);
   }
   if(id==='timeline-earlier'||id==='timeline-end')assert(data.rows>0,'Earlier Timeline keeps days',data);
   if(id.startsWith('account-')&&!id.startsWith('account-delete'))assert(data.email&&data.timezone&&data.deviceDate&&data.passwordHint&&data.otherDevice===(id==='account-device-failed'),'Complete Account variant',data);
   if(id.startsWith('auth-'))assert(data.paper&&data.passwordEyes,'Auth plain-paper / eye controls',data);
   if(id.startsWith('auth-register'))assert(data.confirmation&&data.formFields===3&&data.hintCount===1,'Signup confirmation and single hint',data);
   if(['auth-login-after-reset','auth-login-after-delete','auth-login-after-session','auth-signed-out'].includes(id))assert(data.formFields===2&&data.mast==='Journal','Ordinary sign-in arrival',data);
   if(['auth-forgot','auth-forgot-invalid','auth-forgot-network','auth-reset','auth-reset-short','auth-reset-network'].includes(id))assert(data.formFields===1,'Single-field recovery',data);
   evidence.push({...data,text:undefined});
   if(width===834&&['auth-register-short','account-delete-confirm','recording-upload-failed','today-without-note','day-without-note','account-device-failed'].includes(id)){
    await pause(750);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(root,'verification','revision-'+id+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
   }
  }
 }
 await evaluate("location.hash='settings-data'");await pause(30);
 await evaluate("[...document.querySelectorAll('#settings-data a')].find(x=>x.textContent.includes('Delete everything')).click()");await pause(30);
 assert(await evaluate('location.hash')==='#account-delete-confirm','Delete row opens confirmation');
 await evaluate("[...document.querySelectorAll('#account-delete-confirm a')].find(x=>x.textContent.includes('Keep my account')).click()");await pause(30);
 assert(await evaluate('location.hash')==='#settings-data','Cancel returns to Your data');
 await evaluate("location.hash='auth-register-network'");await pause(30);
 assert(await evaluate(`(()=>{const s=document.getElementById('auth-register-network'),eye=s.querySelector('.password-toggle'),input=s.querySelector('input[type="password"]'),value=input.value;eye.click();const shown=input.type==='text'&&input.value===value;eye.click();return shown&&input.type==='password'&&input.value===value})()`),'State password visibility retains values');
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 const enlarged=[];
 for(const id of ['auth-register-short','account-delete-failed','entry-edit-failed','recording-upload-failed']){
  await evaluate('location.hash='+JSON.stringify(id)+';scrollTo(0,0)');await pause(40);
  const layout=await evaluate(`(()=>{const s=document.getElementById('${id}'),elements=[...s.querySelectorAll('*')],sizes=elements.map(x=>parseFloat(getComputedStyle(x).fontSize));elements.forEach((x,i)=>x.style.fontSize=(sizes[i]*2)+'px');return {id:'${id}',overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,buttons:[...s.querySelectorAll('.btn')].filter(x=>getComputedStyle(x).display!=='none').every(x=>x.getBoundingClientRect().height>=43.9)}})()`);
  assert(!layout.overflow&&layout.buttons,'200% state text at 320px',layout);enlarged.push(layout);
 }
 if(errors.length)throw Error('Browser exceptions: '+errors.join('; '));
 fs.writeFileSync(path.join(root,'verification','revision-state-checks.json'),JSON.stringify({stateChecks:evidence.length,states:evidence,deletionRouting:true,passwordEye:true,enlarged,browserExceptions:errors},null,2)+'\n');
 console.log('PASS: '+evidence.length+' contextual state checks at mobile, tablet and desktop, account-delete routing and state password eyes.');
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
