import {startBrowser,pause,removeTemporaryDirectory} from '../tools/lib/browser-harness.mjs';
// Verify revised design states in the portable prototype in Edge.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(path.join(root,'verification'),{recursive:true});
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
  for(const id of ['settings-data','account-delete-confirm','account-delete-failed','today-without-note','day-without-note','entry-unsent','entry-unsent-stopped','memo-draft','memo-draft-typed','empty-today-memo-draft','s-recording-draft','s-recording-discard','mood-failed','entry-edit-failed','entry-edit-empty','entry-delete-failed','recording-delete-failed','today-loading','timeline-loading','day-loading','ask-loading','you-loading','timeline-earlier','timeline-end','fetch-failed','day-fetch-failed','account-only-device','account-device-signed-out','account-device-failed',
   'auth-login-error','auth-login-invalid','auth-login-sending','auth-login-network','auth-login-after-reset','auth-login-after-delete','auth-login-after-session','auth-register-error','auth-register-invalid','auth-register-short','auth-register-creating','auth-register-network','auth-forgot','auth-forgot-invalid','auth-forgot-sending','auth-forgot-sent','auth-forgot-network','auth-reset','auth-reset-short','auth-reset-saving','auth-reset-expired','auth-reset-network','auth-signed-out']){
   await evaluate('location.hash='+JSON.stringify(id)+';scrollTo(0,0)');await pause(25);
   const data=await evaluate(`(()=>{
    const s=document.getElementById('${id}'),text=s.textContent,q=x=>s.querySelector(x),all=x=>[...s.querySelectorAll(x)];
    const dialog=q('.aj-c-dialog'),form=q('.aj-s-auth-form__form'),memo=q('.aj-c-recrow'),pwd=all('input[type="password"]');
    return {id:'${id}',width:${width},visible:getComputedStyle(s).display!=='none',overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
     text,dialogs:all('.aj-c-dialog').length,dialogError:dialog?.innerText.includes('Nothing was deleted.'),safe:dialog?.querySelector('a.aj-c-button[data-grade=solid]')?.textContent,
     paper:!!q('.aj-l-shell[data-surface=auth]'),formFields:form?.querySelectorAll('input').length,confirmation:all('label').some(x=>x.textContent==='Confirm password'),
     passwordEyes:pwd.every(x=>!!s.querySelector('[aria-controls="'+x.id+'"].aj-c-button[data-form=toggle]')),hintCount:(text.match(/at least 8 characters/g)||[]).length,
     composer:!!q('.aj-c-composer'),draft:q('.prototype-input')?.value,save:q('.aj-c-composer .aj-c-composer__row button')?.textContent,
     memoPlay:!!memo?.querySelector('button.aj-c-play'),model:!!q('.aj-s-overview,.aj-c-said'),transcript:memo?.querySelector('.aj-c-text[data-form=prose],.aj-c-text[data-form=label]')?.textContent.trim(),
     chips:all('.aj-c-moodrow__chips button').length,selected:all('.aj-c-moodrow__chips button[aria-pressed="true"]').map(x=>x.textContent),
     changed:q('.aj-c-entry-actions[data-form=editor] textarea')?.value,invalid:q('.aj-c-entry-actions[data-form=editor] textarea')?.getAttribute('aria-invalid'),
     nav:all('.aj-c-dest [aria-current="page"]').map(x=>x.textContent),mast:q('.aj-l-mast__wordmark,.aj-s-recorder__wordmark')?.textContent,
     dates:!!q('.aj-c-keybox'),rows:all('.aj-c-dayrow').length,
     timezone:text.includes('Karachi (UTC+5)'),email:text.includes('mubeen@example.com'),deviceDate:text.includes('30 September 2026'),
     otherDevice:text.includes('Safari on iPhone'),passwordHint:text.includes('forgot-password'),
     pending:all('.aj-c-pending:not([data-form=draft])').map(x=>({sub:x.dataset.sub||'retrying',retry:!!x.querySelector('[data-hook~=retry]'),row:!!x.closest('.aj-c-srow,.aj-c-recrow')?.querySelector('[data-entry-action=delete]')})),
     draftLine:q('.aj-c-composer [data-hook~=draft]')?.getAttribute('aria-label'),state:q('[data-session-state]')?.textContent,asked:!!q('[data-hook~=confirm]:not([hidden])'),player:!!q('[data-hook~=player]')&&getComputedStyle(q('[data-hook~=player]')).display!=='none'};
   })()`);
   assert(data.visible&&!data.overflow,'Visible state or overflow',data);
   if(id==='settings-data')assert(data.dialogs===0,'Your data must be unobstructed',data);
   if(id.startsWith('account-delete-'))assert(data.dialogs===1&&data.safe==='Export instead'&&(id.endsWith('confirm')||data.dialogError),'Deletion confirmation',data);
   if(id.endsWith('without-note'))assert(!data.model&&data.memoPlay&&data.transcript==='Voice memo'&&data.chips===5&&data.composer===(id==='today-without-note'),'Full model-free day',data);
   // v4 C5: the unsent entry and memo are in the list with their tools and the pending line; the memo draft line; the
   // recorder's draft and discard drawings.
   if(id.startsWith('entry-unsent'))assert(data.pending.length===2&&data.pending.every(p=>p.sub===(id==='entry-unsent'?'retrying':'stopped')&&p.retry&&p.row)&&data.memoPlay,'Unsent rows in the list',data);
   if(id.includes('memo-draft'))assert(data.composer&&data.draftLine==='Continue your voice memo draft, 0:47'&&(id!=='memo-draft-typed'||(data.draft?.includes('Priya rang back')&&data.save==='Save')),'Memo draft line',data);
   if(id==='s-recording-draft')assert(data.state==='Paused · draft'&&data.player&&!data.asked,'Paused draft',data);
   if(id==='s-recording-discard')assert(data.asked&&data.player,'Discard asked',data);
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
   if(width===834&&['auth-register-short','account-delete-confirm','entry-unsent','today-without-note','day-without-note','account-device-failed'].includes(id)){
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
 assert(await evaluate(`(()=>{const s=document.getElementById('auth-register-network'),eye=s.querySelector('.aj-c-button[data-form=toggle]'),input=s.querySelector('input[type="password"]'),value=input.value;eye.click();const shown=input.type==='text'&&input.value===value;eye.click();return shown&&input.type==='password'&&input.value===value})()`),'State password visibility retains values');
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 const enlarged=[];
 for(const id of ['auth-register-short','account-delete-failed','entry-edit-failed','entry-unsent']){
  await evaluate('location.hash='+JSON.stringify(id)+';scrollTo(0,0)');await pause(40);
  const layout=await evaluate(`(()=>{const s=document.getElementById('${id}'),elements=[...s.querySelectorAll('*')],sizes=elements.map(x=>parseFloat(getComputedStyle(x).fontSize));elements.forEach((x,i)=>x.style.fontSize=(sizes[i]*2)+'px');return {id:'${id}',overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,buttons:[...s.querySelectorAll('.aj-c-button')].filter(x=>x.getClientRects().length).every(x=>x.getBoundingClientRect().height>=43.9)}})()`);
  assert(!layout.overflow&&layout.buttons,'200% state text at 320px',layout);enlarged.push(layout);
 }
 // v4 C5: Try again on an unsent row sends it (Uploading…, no button), then the line goes.
 await evaluate("location.hash='entry-unsent';scrollTo(0,0)");await pause(40);
 await evaluate("document.querySelector('#entry-unsent .aj-c-pending [data-hook~=retry]').click()");await pause(50);
 const sending=await evaluate("(()=>{const l=document.querySelector('#entry-unsent .aj-c-pending');return {sub:l.dataset.sub,words:l.textContent.trim(),retry:!!l.querySelector('[data-hook~=retry]'),left:document.querySelectorAll('#entry-unsent .aj-c-pending').length}})()");
 assert(sending.sub==='sending'&&sending.words==='Uploading…'&&!sending.retry&&sending.left===2,'Try again sends',sending);
 await pause(1800);
 assert(await evaluate("document.querySelectorAll('#entry-unsent .aj-c-pending').length")===1,'Uploaded: the line goes');
 if(errors.length)throw Error('Browser exceptions: '+errors.join('; '));
 fs.writeFileSync(path.join(root,'verification','revision-state-checks.json'),JSON.stringify({stateChecks:evidence.length,states:evidence,deletionRouting:true,passwordEye:true,enlarged,browserExceptions:errors},null,2)+'\n');
 console.log('PASS: '+evidence.length+' contextual state checks at mobile, tablet and desktop, account-delete routing and state password eyes.');
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
