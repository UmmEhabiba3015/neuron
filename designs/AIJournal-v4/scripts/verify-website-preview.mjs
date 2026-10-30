import {startBrowser,pause,removeTemporaryDirectory} from '../tools/lib/browser-harness.mjs';
// Smoke test the portable, full-viewport website preview in Edge.
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
  throw Error(`Preview did not load ${expected}: ${JSON.stringify(await evaluate('({active,changing,hash:location.hash,width:innerWidth,body:document.body.innerText.slice(0,200)})'))}`);
 };
 const checkMoodOrder=async()=>{
  const result=await evaluate(`(()=>{const screen=document.getElementById('today'),mood=screen.querySelector('.aj-c-moodrow'),rows=[...screen.querySelectorAll('[data-entry-key]')].filter(row=>!row.hidden);return {rows:rows.length,beforeMood:rows.every(row=>!!(row.compareDocumentPosition(mood)&Node.DOCUMENT_POSITION_FOLLOWING)&&row.getBoundingClientRect().bottom<=mood.getBoundingClientRect().top+1),sameSheet:!screen.querySelector('.prototype-list')||screen.querySelector('.prototype-list').parentElement===mood.parentElement,latestIsLast:!screen.querySelector('.prototype-list .aj-c-recrow')||screen.querySelector('.prototype-list').lastElementChild.matches('.aj-c-recrow')}})()`);
  if(!result.beforeMood||!result.sameSheet||!result.latestIsLast)throw Error('Mood prompt did not follow the latest entry: '+JSON.stringify(result));
 };
 const navigationChecks=[];
 const checkPinnedNavigation=async()=>{
  await evaluate('(()=>{const v=window.__journalNavbar.active;if(v){v.reader.scrollTop=0;v.setCompact(true);}else scrollTo(0,0);})()');await pause(350);
  const initial=await evaluate(`(()=>{const nav=document.querySelector('#today .aj-c-dest'),r=nav.getBoundingClientRect(),mast=document.querySelector('#today .aj-s-header .aj-l-mast');return {top:r.top,left:r.left,height:r.height,mastTop:mast?.getBoundingClientRect().top,desktop:!!nav.closest('.aj-l-mast[data-form=title]')};})()`);
  for(const y of [300,800,100000]){
   await evaluate(`(()=>{const v=window.__journalNavbar.active;if(v){v.reader.scrollTop=Math.min(${y},v.reader.scrollHeight-v.reader.clientHeight-50);v.setCompact(true);}else scrollTo(0,${y});})()`);await pause(350);
   const result=await evaluate(`(()=>{const nav=document.querySelector('#today .aj-c-dest'),r=nav.getBoundingClientRect(),mast=document.querySelector('#today .aj-s-header .aj-l-mast');return {width:innerWidth,scroll:scrollY,top:r.top,left:r.left,height:r.height,mastTop:mast?.getBoundingClientRect().top,reachable:[...nav.querySelectorAll('a')].every(a=>{const b=a.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight&&document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.closest('a')===a;})};})()`);
   const expected=initial.desktop?initial.top:8;
   if(Math.abs(result.top-expected)>1||Math.abs(result.left-initial.left)>1||(!initial.desktop&&Math.abs(result.mastTop-initial.mastTop)>1)||!result.reachable)throw Error('Header moved out of place during scroll: '+JSON.stringify({initial,result,expected}));
   navigationChecks.push(result);
  }
 };
 await call('Page.enable');await call('Runtime.enable');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:pathToFileURL(standalone).href});
 await ready('mobile');
 const login=await evaluate(`(()=>{const d=document;return {visible:getComputedStyle(d.getElementById('auth-login')).display,review:!!d.getElementById('start'),links:d.querySelectorAll('.auth-preview').length,chrome:getComputedStyle(d.querySelector('.aj-l-stage__chrome')).display,motion:d.documentElement.dataset.motionReview,overflow:d.documentElement.scrollWidth>390}})()`);
 if(login.visible==='none'||login.review||login.links||login.chrome!=='none'||login.motion!=='play'||login.overflow)throw Error(`Login preview failed: ${JSON.stringify(login)}`);
 const form=await evaluate(`(()=>{const d=document;const form=d.querySelector('#auth-login form');return {action:form?.getAttribute('action'),buttons:[...form?.querySelectorAll('button')||[]].map(x=>x.getAttribute('aria-label')||x.textContent.trim())}})()`);
 if(!form.action||!form.buttons.includes('Show password'))throw Error(`Login form missing: ${JSON.stringify(form)}`);
 await evaluate(`(()=>{const d=document;const form=d.querySelector('#auth-login form');for(const input of form.querySelectorAll('input')){input.value=input.type==='email'?'test@example.com':'password123'}form.requestSubmit()})()`);
 await pause(100);
 if(await evaluate('location.hash')!=='#today')throw Error('Login did not open Today');
 const checkJournalEnd=async()=>{await pause(350);const gap=await evaluate('(()=>{const v=window.__journalNavbar.active;return v?v.reader.scrollHeight-v.reader.clientHeight-v.reader.scrollTop:document.scrollingElement.scrollHeight-innerHeight-scrollY;})()');if(gap>32)throw Error('Journal did not open at the latest end: '+gap);};
 await checkJournalEnd();
 const typed=await evaluate(`(()=>{const d=document;const screen=d.getElementById('today');const field=screen.querySelector('textarea.prototype-input');field.value='Portable journal entry.';field.dispatchEvent(new Event('input',{bubbles:true}));screen.querySelector('.aj-c-composer .aj-c-composer__row button').click();return screen.querySelector('.prototype-list')?.textContent.includes('Portable journal entry.')})()`);
 if(!typed)throw Error('Text composer did not save an entry');
 await checkMoodOrder();
 await checkJournalEnd();
 await evaluate(`document.querySelector('#today .aj-c-composer .aj-c-composer__mic').click()`);
 if(await evaluate('location.hash')!=='#talk')throw Error('Compact recorder did not open directly');
 let started;
 for(let attempt=0;attempt<60;attempt++){
  started=await evaluate(`({hash:location.hash,granted:document.querySelector('#talk .aj-s-recorder').dataset.microphone==='granted',secure:isSecureContext,media:!!navigator.mediaDevices,recorder:!!MediaRecorder,origin:location.origin})`);
  if(started.granted)break;
  await pause(150);
 }
 if(started.hash!=='#talk'||!started.granted)throw Error(`Microphone did not prepare from standalone file: ${JSON.stringify(started)}`);
 // The recorder's Keep this out of memory: the kept memo takes it.
 await evaluate(`document.querySelector('#talk .aj-s-recorder [data-hook~=memory]').click()`);
 await evaluate(`document.querySelector('#talk [data-recorder="start"]').click()`);
 // Capture enough audio to observe playback before the memo immediately ends.
 await pause(600);
 await evaluate(`[...document.querySelectorAll('#talk button')].find(x=>x.textContent.trim()==='Stop and keep').click()`);
 await pause(300);
 const audio=await evaluate(`({hash:location.hash,download:document.querySelector('#recording-kept .prototype-download')?.href})`);
 if(audio.hash!=='#today'||!audio.download?.startsWith('blob:'))throw Error(`Voice recording did not save: ${JSON.stringify(audio)}`);
 await checkJournalEnd();
 // A long conversation proves save-at-bottom and reading-position preservation.
 await evaluate('(async()=>{window.__chatBaseline=await window.__journalPreview.snapshot();})()');
 for(let i=0;i<8;i++){
  await evaluate(`(()=>{const s=document.getElementById('today'),f=s.querySelector('.prototype-input');${i===1?"s.querySelector('.aj-c-composer [data-hook~=memory]').click();":''}f.value='Chat entry ${i}. '+('A longer journal thought to exercise the reading position. '.repeat(8));f.dispatchEvent(new Event('input',{bubbles:true}));s.querySelector('.aj-c-composer .aj-c-send').click();})()`);
  await checkJournalEnd();
 }
 const chronological=await evaluate(`(()=>{const rows=[...document.querySelectorAll('#today .prototype-list .aj-c-srow')];return rows.slice(1).every((row,i)=>row.querySelector('.aj-c-text').textContent.startsWith('Chat entry '+i+'.'))&&rows.at(-1).querySelector('.aj-c-text').textContent.startsWith('Chat entry 7.');})()`);
 if(!chronological)throw Error('Latest entry was not last in the conversation');
 await evaluate('window.__journalNavbar.active.reader.scrollTop=window.__journalNavbar.active.reader.scrollHeight*.4');await pause(350);
 const reader=await evaluate('(async()=>{const s=await window.__journalPreview.snapshot();return s.journalPosition;})()');
 if(reader.atEnd||!reader.anchor)throw Error('Older-entry reading position was not recorded');
 await evaluate(`(()=>{const row=[...document.querySelectorAll('#today .prototype-list .aj-c-srow')][2];row.querySelector('[data-entry-action="memory"]').click();[...row.querySelectorAll('.aj-c-entry-actions[data-form=confirm] .aj-c-button')].find(b=>b.textContent.trim()==='Use in memory').click();})()`);await pause(100);
 const afterMemory=await evaluate('window.__journalNavbar.active?.reader.scrollTop??scrollY');
 if(Math.abs(afterMemory-reader.scrollY)>2)throw Error('Memory change pulled the reader away from older entries');
 for(const [width,expected] of [[834,'tablet'],[1440,'desktop']]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await ready(expected);await pause(150);
  const rect=await evaluate(`(()=>{const r=document.querySelector('#today [data-entry-key][data-entry-key="${reader.anchor.key}"]').getBoundingClientRect(),top=window.__journalNavbar.active?.reader.getBoundingClientRect().top||0;return {top:r.top-top,height:r.height,bottom:r.bottom-top};})()`);
  const expectedTop=reader.anchor.top<0?reader.anchor.top*rect.height/reader.anchor.height:reader.anchor.top;
  if(rect.bottom<=0||Math.abs(rect.top-expectedTop)>2)throw Error('Resizing lost the older entry being read: '+JSON.stringify({width,rect,expectedTop,reader,restored:await evaluate('(async()=>({saved:state?.journalPosition,current:(await window.__journalPreview.snapshot()).journalPosition,top:window.__journalNavbar.active?.reader.scrollTop,compact:window.__journalNavbar.active?.compact}))()')}));
 }
 await evaluate('window.__journalPreview.restore(window.__chatBaseline);delete window.__chatBaseline');
 await checkJournalEnd();
 await evaluate(`location.hash='today'`);
 const widths=[320,390,699,700,714,715,739,834,1199,1200,1214,1215,1238,1239,1366,1440,1920,2560,3840];
 const results=[];
 for(const width of widths){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  const expected=width>=1239?'desktop':width>=739?'tablet':'mobile';
  await ready(expected);
  await checkPinnedNavigation();
  await checkMoodOrder();
  const result=await evaluate(`(()=>{const d=document;const screen=d.getElementById('today');const app=screen.querySelector('.aj-l-shell');const page=screen.querySelector('.aj-l-page');const rail=screen.querySelector('.aj-l-rail');const title=screen.querySelector('.aj-l-mast[data-form=title]');const sheet=page.querySelector(':scope > .aj-c-sheet');const rect=x=>x?.getBoundingClientRect();return {width:${width},clientWidth:d.documentElement.clientWidth,active,hash:location.hash,entry:screen.querySelector('.prototype-list')?.textContent.includes('Portable journal entry.'),recording:!!screen.querySelector('.prototype-list .aj-c-recrow'),visibleScreens:[...d.querySelectorAll('.screen')].filter(x=>getComputedStyle(x).display!=='none').length,outerOverflow:d.documentElement.scrollWidth>innerWidth,appWidth:Math.round(rect(app).width),railLeft:Math.round(rect(rail).left),pageLeft:Math.round(rect(page).left),pageRight:Math.round(rect(page).right),sheetWidth:sheet?Math.round(rect(sheet).width):null,titleWidth:title?Math.round(rect(title).width):null,pattern:getComputedStyle(page).backgroundImage.includes('repeating-linear-gradient'),motion:getComputedStyle(screen.querySelector('.aj-s-overview svg')).animationDuration}})()`);
  if(result.hash!=='#today'||!result.entry||!result.recording||result.visibleScreens!==1||result.outerOverflow||result.appWidth<1||result.appWidth>width||!result.pattern||Math.abs(result.pageRight-result.clientWidth)>1)throw Error(`Responsive preview failed: ${JSON.stringify(result)}`);
  if(expected!=='desktop'&&result.railLeft!==0)throw Error(`Binding rail moved away from left edge: ${JSON.stringify(result)}`);
  if(expected==='desktop'&&(result.pageLeft!==result.railLeft+24||result.titleWidth!==result.railLeft||result.railLeft<360||result.railLeft>396||result.appWidth<result.clientWidth))throw Error(`Desktop shell did not scale: ${JSON.stringify(result)}`);
  if(width>=1920&&(result.sheetWidth<1000||result.sheetWidth>1300))throw Error(`Desktop reading measure did not scale: ${JSON.stringify(result)}`);
  if([390,834,1199,1200,1440,1920,2560].includes(width)){
   await pause(900);
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(root,'verification',`journal-website-${width}.png`),Buffer.from(shot.data,'base64'));
   if([390,1440].includes(width)){
    await evaluate(`document.querySelector('#today .aj-c-moodrow').scrollIntoView({block:'center',behavior:'instant'})`);
    await pause(160);
    const moodShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(root,'verification',`mood-after-latest-${width}.png`),Buffer.from(moodShot.data,'base64'));
    await evaluate('scrollTo(0,0)');
   }
  }
  results.push(result);
 }
 await evaluate(`document.querySelector('#today a[href="#you"]').click()`);
 await pause(100);
 const account=await evaluate(`({hash:location.hash,visible:getComputedStyle(document.getElementById('you')).display,visibleScreens:[...document.querySelectorAll('.screen')].filter(x=>getComputedStyle(x).display!=='none').length})`);
 if(account.hash!=='#you'||account.visible==='none'||account.visibleScreens!==1)throw Error(`You navigation failed: ${JSON.stringify(account)}`);
 const details=[];
 for(const width of [834,1199,1440,2560]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await ready(width<1239?'tablet':'desktop');
  for(const id of ['account-devices','support-resource','entry-options']){
   await evaluate(`location.hash='${id}'`);await pause(70);
   const layout=await evaluate(`(()=>{const screen=document.getElementById('${id}');const sheet=screen.querySelector('.aj-c-sheet[data-form=account]');const content=sheet.querySelector('.aj-s-auth-form');const heading=content.querySelector('.aj-s-auth-form__heading');const form=content.querySelector('.aj-s-auth-form__form');const rect=x=>x?.getBoundingClientRect();return {width:${width},id:'${id}',sheetWidth:Math.round(rect(sheet).width),contentWidth:Math.round(rect(content).width),headingInset:Math.round(rect(heading).left-rect(sheet).left),formWidth:form?Math.round(rect(form).width):null,visible:getComputedStyle(screen).display!=='none'}})()`);
   if(!layout.visible||Math.abs(layout.contentWidth-layout.sheetWidth)>2||layout.headingInset<27||layout.headingInset>43||layout.formWidth>(width<1239?560:700))throw Error(`Detail alignment failed: ${JSON.stringify(layout)}`);
   if([834,1440].includes(width)&&['account-devices','support-resource'].includes(id)){
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(root,'verification',`journal-website-${id}-${width}.png`),Buffer.from(shot.data,'base64'));
   }
   details.push(layout);
  }
 }
 const entryActions=[];
 for(const width of [320,390,834,1440,2560]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await ready(width<739?'mobile':width<1239?'tablet':'desktop');
  await evaluate(`location.hash='today';scrollTo(0,0)`);await pause(90);
  const actions=await evaluate(`(()=>{const s=document.getElementById('today'),row=s.querySelector('[data-entry-key]'),controls=row.querySelector('.aj-c-entry-actions[data-place~=tools]'),tools=controls.querySelector('.aj-c-entry-actions__tools'),out=[...s.querySelectorAll('[data-entry-key]')].find(x=>x.querySelector('[data-excluded]')),part=out?.querySelector('[data-excluded]'),r=x=>x.getBoundingClientRect(),buttons=[...tools.querySelectorAll('.aj-c-button[data-form=icon]')];return {width:${width},icons:buttons.length===2&&buttons.every(x=>x.querySelector('svg')&&r(x).width>=43.9&&r(x).height>=43.9),firstLine:${width}<=1000?r(tools).top>=r(row.querySelector('.aj-c-text')).bottom&&Math.abs(r(row.querySelector('.aj-c-text')).width-r(row.querySelector('.aj-c-srow__body')).width+parseFloat(getComputedStyle(row.querySelector('.aj-c-srow__body')).paddingLeft)+parseFloat(getComputedStyle(row.querySelector('.aj-c-srow__body')).paddingRight))<1:buttons.every(x=>Math.abs((r(x.querySelector('svg')).top+10)-(r(row.querySelector('.aj-c-text')).top+parseFloat(getComputedStyle(row.querySelector('.aj-c-text')).lineHeight)/2))<1),aligned:Math.abs(r(tools).right-r(buttons.at(-1)).right)<1&&(${width}<=1000||r(tools).left>=(()=>{const p=row.querySelector('.aj-c-text'),range=document.createRange();range.setStart(p.firstChild,0);range.setEnd(p.firstChild,Math.min(8,p.firstChild.length));return range.getBoundingClientRect().right})()),inMemory:!controls.querySelector('[data-excluded]')&&![...s.querySelectorAll('*')].some(x=>!x.children.length&&x.textContent.trim()==='In memory'),tag:!!part&&part.querySelector('summary')?.textContent.trim()==='Out of memory'&&getComputedStyle(part.querySelector('summary')).opacity==='1'&&r(part.querySelector('summary')).width>0&&parseFloat(getComputedStyle(part.querySelector('summary')).fontSize)===10,compact:!!part&&parseFloat(getComputedStyle(part.querySelector('.aj-c-opt')).fontSize)===10&&part.querySelector('.aj-c-opt').textContent.trim()==='Use in memory',inside:!!part&&r(part).left>=r(out).left&&r(part).right<=r(out).right&&r(part).bottom<=r(out).bottom,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,oldLink:!!s.querySelector('a.aj-c-button[data-grade=cite][href="#entry-options"]')}})()`);
  if(!actions.icons||!actions.firstLine||!actions.aligned||!actions.inMemory||!actions.tag||!actions.compact||!actions.inside||actions.overflow||actions.oldLink)throw Error('Entry actions layout failed: '+JSON.stringify(actions));
  if([390,1440].includes(width)){await pause(900);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'verification',`journal-website-entry-actions-${width}.png`),Buffer.from(shot.data,'base64'));}
  const keyboard=await evaluate(`(()=>{const summary=[...document.querySelectorAll('#today details[data-excluded] summary')].find(x=>x.getClientRects().length);summary.click();const opened=summary.parentElement.open;summary.focus();summary.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return opened&&!summary.parentElement.open&&document.activeElement===summary})()`);
  if(!keyboard)throw Error('Memory dropdown Escape/focus failed');
  entryActions.push(actions);
 }
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 const editing=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key]'),original=row.querySelector('.aj-c-text').textContent,time=row.querySelector('.aj-c-srow__time').textContent;row.querySelector('[data-entry-action="edit"]').click();const f=row.querySelector('.aj-c-entry-actions[data-form=editor]'),input=f.querySelector('textarea'),selected=input.value===original;input.value=' ';f.requestSubmit();const empty=!!f.querySelector('[aria-invalid="true"]')&&location.hash==='#today';f.querySelector('button[type="button"]').click();const cancelled=!row.querySelector('.aj-c-entry-actions[data-form=editor]')&&row.querySelector('.aj-c-text').textContent===original;row.querySelector('[data-entry-action="edit"]').click();row.querySelector('.aj-c-entry-actions[data-form=editor] textarea').value=original+' Edited in this preview.';return {selected,empty,cancelled,key:row.dataset.entryKey,time,draft:row.querySelector('.aj-c-entry-actions[data-form=editor] textarea').value}})()`);
 if(!editing.selected||!editing.empty||!editing.cancelled)throw Error('Entry edit validation/cancel failed: '+JSON.stringify(editing));
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await ready('desktop');
 const restoredDraft=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key][data-entry-key="${editing.key}"]');return row.querySelector('.aj-c-entry-actions[data-form=editor] textarea').value===${JSON.stringify(editing.draft)}})()`);
 if(!restoredDraft)throw Error('Entry edit draft lost at breakpoint');
 await evaluate(`document.querySelector('#today .aj-c-entry-actions[data-form=editor]').requestSubmit()`);
 const savedEntry=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key][data-entry-key="${editing.key}"]');return row.querySelector('.aj-c-text').textContent===${JSON.stringify(editing.draft)}&&row.querySelector('.aj-c-srow__time').textContent===${JSON.stringify(editing.time)}&&!row.querySelector('.aj-c-entry-actions[data-form=editor]')})()`);
 if(!savedEntry)throw Error('Entry edit save/time failed');
 const letIn=await evaluate(`(()=>{const row=[...document.querySelectorAll('#today [data-entry-key]')].find(x=>x.querySelector('[data-excluded]'));const key=row.dataset.entryKey;row.querySelector('[data-entry-action="memory"]').click();[...row.querySelectorAll('.aj-c-entry-actions[data-form=confirm] .aj-c-button')].find(b=>b.textContent.trim()==='Use in memory').click();return key})()`);await pause(50);
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 const memory=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key][data-entry-key="${editing.key}"]'),let_=document.querySelector('#today [data-entry-key][data-entry-key="${letIn}"]');return !row.querySelector('[data-excluded]')&&!!let_&&!let_.querySelector('[data-excluded]')&&!let_.querySelector('[data-form=confirm]')&&row.querySelector('.aj-c-text').textContent===${JSON.stringify(editing.draft)}})()`);
 if(!memory)throw Error('Entry edit/memory lost at breakpoint');
 const dynamic=await evaluate(`(()=>{const row=document.querySelector('#today .prototype-list .aj-c-srow[data-entry-key]'),key=row.dataset.entryKey;row.querySelector('[data-entry-action="edit"]').click();const f=row.querySelector('.aj-c-entry-actions[data-form=editor]');f.querySelector('textarea').value='Portable journal entry. Edited in place.';f.requestSubmit();const updated=document.querySelector('#today .prototype-list .aj-c-srow[data-entry-key]');const edited=updated.querySelector('.aj-c-text').textContent==='Portable journal entry. Edited in place.';updated.querySelector('[data-entry-action="delete"]').click();const prompted=!!updated.querySelector('.aj-c-entry-actions[data-form=confirm]')&&!!document.querySelector('#today .prototype-list .aj-c-srow[data-entry-key]');updated.querySelector('.aj-c-entry-actions[data-form=confirm] .aj-c-button[data-grade=solid]').click();const kept=!updated.querySelector('.aj-c-entry-actions[data-form=confirm]')&&!!document.querySelector('#today .prototype-list .aj-c-srow[data-entry-key]');updated.querySelector('[data-entry-action="delete"]').click();updated.querySelector('.aj-c-entry-actions[data-form=confirm] .aj-c-button[data-grade=quiet]').click();const deleted=!document.querySelector('[data-entry-key][data-entry-key="'+key+'"]')&&!!document.querySelector('#today .prototype-list .aj-c-recrow');return {edited,prompted,kept,deleted}})()`);
 if(Object.values(dynamic).some(value=>value!==true))throw Error('Added-entry edit/delete failed: '+JSON.stringify(dynamic));
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await ready('desktop');
 await evaluate(`location.hash='today';document.activeElement?.blur();scrollTo(0,0)`);await pause(180);
 await call('DOM.enable');await call('CSS.enable');
 const doc=await call('DOM.getDocument'),hoverNode=await call('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#today [data-entry-key]'});
 const idle=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key]'),tools=row.querySelector('.aj-c-entry-actions__tools'),p=row.querySelector('.aj-c-text');return {opacity:Number(getComputedStyle(tools).opacity),hoverDevice:matchMedia('(hover:hover) and (pointer:fine)').matches,textWidth:p.getBoundingClientRect().width}})()`);
 if(!idle.hoverDevice||idle.opacity!==0)throw Error('Entry icons are persistent on desktop: '+JSON.stringify(idle));
 const idleShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'verification','journal-website-entry-idle-1440.png'),Buffer.from(idleShot.data,'base64'));
 const samples=async duration=>evaluate(`new Promise(resolve=>{const values=[],start=performance.now(),tools=document.querySelector('#today .aj-c-entry-actions__tools');function sample(){values.push({ms:performance.now()-start,opacity:Number(getComputedStyle(tools).opacity)});if(performance.now()-start<${duration})requestAnimationFrame(sample);else resolve(values)}requestAnimationFrame(sample)})`);
 await call('CSS.forcePseudoState',{nodeId:hoverNode.nodeId,forcedPseudoClasses:['hover']});const fadeIn=await samples(200);
 if(!fadeIn.some(x=>x.opacity>0&&x.opacity<1)||fadeIn.at(-1).opacity!==1)throw Error('Entry fade-in failed: '+JSON.stringify(fadeIn));
 const stable=await evaluate(`document.querySelector('#today [data-entry-key] .aj-c-text').getBoundingClientRect().width`);if(stable!==idle.textWidth)throw Error('Entry text moves on hover');
 const hoverShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'verification','journal-website-entry-hover-1440.png'),Buffer.from(hoverShot.data,'base64'));
 await call('CSS.forcePseudoState',{nodeId:hoverNode.nodeId,forcedPseudoClasses:[]});const fadeOut=await samples(160);
 if(!fadeOut.some(x=>x.opacity>0&&x.opacity<1)||fadeOut.at(-1).opacity!==0)throw Error('Entry fade-out failed: '+JSON.stringify(fadeOut));
 const focus=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key]');row.querySelector('[data-entry-action="edit"]').focus();return getComputedStyle(row.querySelector('.aj-c-entry-actions__tools')).opacity==='1'})()`);if(!focus)throw Error('Keyboard focus does not reveal entry tools');
 await evaluate(`document.activeElement.blur()`);
 await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await pause(150);
 const touch=await evaluate(`getComputedStyle(document.querySelector('#today .aj-c-entry-actions__tools')).opacity==='1'`);if(!touch)throw Error('Touch entry tools hidden');
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 const reduced=await evaluate(`(()=>{delete document.documentElement.dataset.motionReview;const duration=getComputedStyle(document.querySelector('#today .aj-c-entry-actions__tools')).transitionDuration;document.documentElement.dataset.motionReview='play';return duration==='0s'})()`);if(!reduced)throw Error('Production entry fade ignores reduced motion');
 const entryMotion={idle,fadeIn,fadeOut,stableText:true,keyboard:true,touch:true,productionReducedMotion:true};
 const iconHover=[];
 await call('CSS.forcePseudoState',{nodeId:hoverNode.nodeId,forcedPseudoClasses:['hover']});await pause(180);
 for(const [action,target] of [['edit','rgb(54, 68, 52)'],['delete','rgb(166, 55, 45)']]){
  const selector='#today .aj-c-srow[data-entry-key] [data-entry-action="'+action+'"]',node=await call('DOM.querySelector',{nodeId:doc.root.nodeId,selector});
  const before=await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).color`);
  await call('CSS.forcePseudoState',{nodeId:node.nodeId,forcedPseudoClasses:['hover']});
  const colors=await evaluate(`new Promise(resolve=>{const values=[],start=performance.now(),icon=document.querySelector(${JSON.stringify(selector)});function sample(){const s=getComputedStyle(icon);values.push({ms:performance.now()-start,color:s.color,background:s.backgroundColor});if(performance.now()-start<200)requestAnimationFrame(sample);else resolve(values)}requestAnimationFrame(sample)})`);
  if(colors.at(-1).color!==target||!colors.some(x=>x.color!==before&&x.color!==target)||colors.some(x=>x.background!=='rgba(0, 0, 0, 0)'))throw Error('Icon color fade/background failed: '+action+' '+JSON.stringify(colors));
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'verification',`journal-website-${action}-hover-1440.png`),Buffer.from(shot.data,'base64'));
  await call('CSS.forcePseudoState',{nodeId:node.nodeId,forcedPseudoClasses:[]});await pause(150);
  if(!await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).color===${JSON.stringify(before)}`))throw Error('Icon hover color did not return: '+action);
  iconHover.push({action,target,colors,backgroundTransparent:true});
 }
 await call('CSS.forcePseudoState',{nodeId:hoverNode.nodeId,forcedPseudoClasses:[]});
 const voiceActions=[];
 for(const width of [320,390,834,1440,2560]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await ready(width<739?'mobile':width<1239?'tablet':'desktop');
  await evaluate(`location.hash='today';document.activeElement?.blur()`);await pause(180);
  const result=await evaluate(`(()=>{const rows=[...document.querySelectorAll('#today .aj-c-recrow[data-entry-key]')],r=x=>x.getBoundingClientRect();return {width:${width},count:rows.length,aligned:rows.every(row=>[...row.querySelectorAll('.aj-c-button[data-form=icon] svg')].every(icon=>${width}<=1000?r(row.querySelector('.aj-c-entry-actions__tools')).top>=r(row.querySelector('.aj-c-text')).bottom:Math.abs(r(icon).top+r(icon).height/2-r(row.querySelector('.aj-c-text')).top-parseFloat(getComputedStyle(row.querySelector('.aj-c-text')).lineHeight)/2)<1)),controls:rows.every(row=>row.querySelectorAll('.aj-c-button[data-form=icon]').length===1&&!row.querySelector('[data-entry-action="edit"]')&&(!!row.closest('.prototype-list')||!row.querySelector('[data-excluded]'))),oldLink:!!document.querySelector('#today a.aj-c-button[data-grade=cite][href="#recording-options"]'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}})()`);
  if(result.count<2||!result.aligned||!result.controls||result.oldLink||result.overflow)throw Error('Voice controls layout failed: '+JSON.stringify(result));
  voiceActions.push(result);
 }
 const voiceState=await evaluate(`(()=>{const row=document.querySelector('#today .aj-c-recrow[data-entry-key]:not(.prototype-list .aj-c-recrow)');return {key:row.dataset.entryKey,text:row.querySelector('.aj-c-text').textContent,time:row.querySelector('.aj-c-recrow__time').textContent,inMemory:!row.querySelector('[data-excluded]')&&!row.querySelector('[data-entry-action="memory"]')}})()`);
 if(!voiceState.inMemory)throw Error('A voice memo in memory offers a memory control');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 const voiceRestored=await evaluate(`(()=>{const fixture=document.querySelector('#today [data-entry-key][data-entry-key="${voiceState.key}"]');return fixture.querySelector('.aj-c-text').textContent===${JSON.stringify(voiceState.text)}&&fixture.querySelector('.aj-c-recrow__time').textContent===${JSON.stringify(voiceState.time)}&&!fixture.querySelector('[data-excluded]')&&!document.querySelector('#today .aj-c-recrow [data-entry-action="edit"]')})()`);
 if(!voiceRestored)throw Error('Voice memory or original text lost at breakpoint');
 await evaluate(`document.querySelector('#today .prototype-list .aj-c-recrow .aj-c-play').click()`);await pause(80);
 if(!await evaluate(`document.querySelector('#today .prototype-list .aj-c-recrow .aj-c-play').getAttribute('aria-label')==='Stop voice memo playback'`))throw Error('Voice memo did not play');
 const playbackAfterMemory=await evaluate(`(()=>{const row=document.querySelector('#today .prototype-list .aj-c-recrow');if(!row.querySelector('[data-excluded]'))return false;row.querySelector('[data-entry-action="memory"]').click();[...row.querySelectorAll('.aj-c-entry-actions[data-form=confirm] .aj-c-button')].find(b=>b.textContent.trim()==='Use in memory').click();const after=document.querySelector('#today .prototype-list .aj-c-recrow');return !after.querySelector('[data-excluded]')&&after.querySelector('.aj-c-play').getAttribute('aria-label')==='Stop voice memo playback'})()`);
 if(!playbackAfterMemory)throw Error('Memory toggle reset active voice playback controls');
 const voiceDeleted=await evaluate(`(()=>{let row=document.querySelector('#today .prototype-list .aj-c-recrow');row.querySelector('[data-entry-action="delete"]').click();const prompt=row.querySelector('.aj-c-entry-actions[data-form=confirm]').textContent.includes('Delete this voice memo?');row.querySelector('.aj-c-entry-actions[data-form=confirm] .aj-c-button[data-grade=solid]').click();const cancelled=!row.querySelector('.aj-c-entry-actions[data-form=confirm]');row.querySelector('[data-entry-action="delete"]').click();row.querySelector('.aj-c-entry-actions[data-form=confirm] .aj-c-button[data-grade=quiet]').click();return prompt&&cancelled&&!document.querySelector('#today .prototype-list .aj-c-recrow')&&!document.querySelector('#recording-kept .prototype-download')})()`);
 if(!voiceDeleted)throw Error('Voice delete confirmation/playback/download cleanup failed');
 await checkMoodOrder();
 const auth=[];
 for(const width of [320,390,700,834,1000,1239,1440,1920,2560]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await ready(width<739?'mobile':width<1239?'tablet':'desktop');
  for(const id of ['auth-login','auth-register']){
   await evaluate(`location.hash='${id}'`);await pause(110);
   const layout=await evaluate(`(()=>{const screen=document.getElementById('${id}');const sheet=screen.querySelector('.aj-c-sheet[data-form=account]'),content=sheet.querySelector('.aj-s-auth-form'),region=sheet.querySelector('.aj-s-auth__region'),context=sheet.querySelector('.aj-s-auth__context'),canvas=screen.querySelector('.aj-s-auth'),toggle=screen.querySelector('.aj-c-button[data-form=toggle]'),field=document.getElementById(toggle.getAttribute('aria-controls')),rect=x=>x.getBoundingClientRect(),style=getComputedStyle(canvas);return {width:${width},id:'${id}',sheetWidth:Math.round(rect(sheet).width),contentWidth:Math.round(rect(content).width),centerOffset:Math.round((rect(content).left+rect(content).width/2)-(rect(region).left+rect(region).width/2)),topGap:Math.round(rect(sheet).top+scrollY),bottomGap:Math.round(innerHeight-(rect(sheet).bottom+scrollY)),eye:!!toggle.querySelector('svg'),text:toggle.textContent.trim(),type:field.type,opaque:getComputedStyle(content).backgroundColor==='rgb(251, 246, 238)',shadow:getComputedStyle(content).boxShadow!=='none',railLeft:rect(screen.querySelector('.aj-l-rail')).left,filled:Math.abs(rect(canvas).height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-rect(sheet).height)<2,formFirst:rect(region).top<=rect(context).top,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,confirmation:!!screen.querySelector('[data-auth-input="confirmation"]'),targets:[...content.querySelectorAll('button,a')].every(x=>rect(x).height>=43.9&&rect(x).width>=43.9)}})()`);
   if(!layout.eye||layout.text||layout.type!=='password'||Math.abs(layout.centerOffset)>1||layout.contentWidth>500||!layout.opaque||!layout.shadow||layout.railLeft!==0||!layout.filled||!layout.formFirst||layout.overflow||!layout.targets||layout.confirmation!==(id==='auth-register'))throw Error(`Auth layout failed: ${JSON.stringify(layout)}`);
   const toggle=await evaluate(`(()=>{const screen=document.getElementById('${id}');const button=screen.querySelector('.aj-c-button[data-form=toggle]');const field=document.getElementById(button.getAttribute('aria-controls'));field.value='secret123';button.click();const shown={type:field.type,value:field.value,label:button.getAttribute('aria-label'),pressed:button.getAttribute('aria-pressed')};button.click();return {shown,hidden:{type:field.type,value:field.value,label:button.getAttribute('aria-label'),pressed:button.getAttribute('aria-pressed')}}})()`);
   if(toggle.shown.type!=='text'||toggle.shown.value!=='secret123'||toggle.shown.label!=='Hide password'||toggle.shown.pressed!=='true'||toggle.hidden.type!=='password'||toggle.hidden.value!=='secret123'||toggle.hidden.label!=='Show password'||toggle.hidden.pressed!=='false')throw Error(`Password toggle failed: ${JSON.stringify(toggle)}`);
   if(id==='auth-register'){
    const validation=await evaluate(`(()=>{const s=document.getElementById('auth-register'),f=s.querySelector('form'),e=f.querySelector('[data-auth-input="email"]'),p=f.querySelector('[data-auth-input="password"]'),c=f.querySelector('[data-auth-input="confirmation"]'),hint=f.querySelector('[data-password-hint]'),error=document.getElementById(p.id+'-error');e.value='test@example.com';p.value='1234567';c.value='12345678';f.requestSubmit();const short=location.hash==='#auth-register'&&hint.hidden&&!error.hidden&&p.getAttribute('aria-describedby')===error.id&&p.value==='1234567'&&document.activeElement===p;p.value='12345678';p.dispatchEvent(new Event('input',{bubbles:true}));const restored=!hint.hidden&&error.hidden;c.value='';f.requestSubmit();const missing=location.hash==='#auth-register'&&c.getAttribute('aria-invalid')==='true'&&document.activeElement===c;c.value='different';f.requestSubmit();const mismatch=location.hash==='#auth-register'&&c.getAttribute('aria-invalid')==='true'&&p.value==='12345678'&&c.value==='different';const t=f.querySelector('[aria-controls="'+c.id+'"]');t.click();const independent=c.type==='text'&&p.type==='password'&&t.getAttribute('aria-label')==='Hide confirmed password';t.click();c.value='12345678';f.requestSubmit();const valid=location.hash==='#today-first';return {short,restored,missing,mismatch,independent,valid}})()`);
    if(Object.values(validation).some(value=>value!==true))throw Error('Main signup validation failed: '+JSON.stringify({width,validation}));
    await pause(70);await evaluate(`location.hash='auth-register'`);await pause(70);
   }
   if([390,834,1440].includes(width)){
    await pause(900);
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(root,'verification',`journal-website-${id}-${width}.png`),Buffer.from(shot.data,'base64'));
   }
   auth.push(layout);
  }
 }
 for(const height of [600,1200]){
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height,deviceScaleFactor:1,mobile:false});await ready('desktop');
  for(const id of ['auth-login','auth-register']){
   await evaluate(`location.hash='${id}';scrollTo(0,0)`);await pause(80);
   const vertical=await evaluate(`(()=>{const s=document.getElementById('${id}'),rect=x=>x.getBoundingClientRect(),sheet=s.querySelector('.aj-c-sheet[data-form=account]'),canvas=s.querySelector('.aj-s-auth'),cs=getComputedStyle(canvas);return {id:'${id}',height:${height},top:rect(sheet).top,bottom:innerHeight-rect(sheet).bottom,filled:Math.abs(rect(canvas).height-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-rect(sheet).height)<2,contained:[...s.querySelectorAll('.aj-s-auth-form input,.aj-s-auth-form button')].every(x=>rect(x).top>=rect(sheet).top&&rect(x).bottom<=rect(sheet).bottom)}})()`);
   if(!vertical.filled||!vertical.contained||(height===1200&&Math.abs(vertical.top-vertical.bottom)>2))throw Error('Auth height failed: '+JSON.stringify(vertical));
  }
 }
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 await evaluate(`(()=>{const elements=[...document.querySelectorAll('#auth-login *,#auth-register *')],sizes=elements.map(x=>parseFloat(getComputedStyle(x).fontSize));elements.forEach((x,i)=>x.style.fontSize=(sizes[i]*2)+'px')})()`);
 for(const id of ['auth-login','auth-register']){
  await evaluate(`location.hash='${id}'`);await pause(70);
  if(!await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth&&[...document.querySelectorAll('#${id} input,#${id} button')].every(x=>x.getBoundingClientRect().right<=document.documentElement.clientWidth)`))throw Error('Auth enlarged-text overflow: '+id);
 }
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});await ready('mobile');
 await evaluate(`location.hash='today';scrollTo(0,0)`);await pause(70);
 await evaluate(`(()=>{const elements=[...document.querySelectorAll('#today *')],sizes=elements.map(x=>parseFloat(getComputedStyle(x).fontSize));elements.forEach((x,i)=>x.style.fontSize=(sizes[i]*2)+'px');dispatchEvent(new Event('resize'));document.querySelector('#today [data-entry-key] [data-entry-action="delete"]').focus()})()`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(70);
 const enlargedEntry=await evaluate(`(()=>{const row=document.querySelector('#today [data-entry-key]'),menu=row.querySelector('.aj-c-entry-actions[data-form=confirm]'),r=x=>x.getBoundingClientRect();const result={open:!!menu,inside:!!menu&&r(menu).bottom<=r(row).bottom&&r(menu).right<=r(row).right&&r(menu).left>=r(row).left,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};menu?.querySelector('.aj-c-button[data-grade=solid]').click();return result})()`);
 if(!enlargedEntry.open||!enlargedEntry.inside||enlargedEntry.overflow)throw Error('Enlarged entry confirmation/keyboard failed: '+JSON.stringify(enlargedEntry));
 await evaluate(`document.querySelector('#today .aj-l-mast:not([data-form=title])').click()`);await pause(30);
 if(!await evaluate(`!document.querySelector('#today [data-entry-key] .aj-c-entry-actions[data-form=confirm]')`))throw Error('Entry confirmation was left open');
 if(errors.length)throw Error(`Browser exceptions: ${errors.join('; ')}`);
 const evidence={login,form,audio:{saved:true},account,results,details,navigationChecks,entryActions,entryMotion,iconHover,voiceActions,voiceHasNoEdit:true,voiceMemory:true,voiceMemoryAcrossBreakpoints:true,voicePlayback:true,voiceDeletion:true,entryEditing:true,entryMemory:true,entryDeletion:true,entryDraftAcrossBreakpoints:true,enlargedEntryText:true,entryKeyboard:true,auth,enlargedAuthText:true,authHeightChecks:true,signupValidation:true};
 fs.writeFileSync(path.join(root,'verification','website-preview-checks.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('PASS: portable website, journal text/voice, entry icons/memory dropdown (one way)/edit/delete and breakpoint drafts, account navigation, '+auth.length+' auth layouts, password confirmation, hint replacement, tall/short viewports and 200% auth text.');
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
