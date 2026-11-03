// Delivered standalone file: common quiet navigation, scrolling and state retention.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {startBrowser,pause,removeTemporaryDirectory} from '../tools/lib/browser-harness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),engine=process.argv.includes('--firefox')?'firefox':'chromium';
const evidence=path.join(root,'verification/navbar');fs.mkdirSync(evidence,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'Journal delivery ')),file=path.join(temp,'journal-website.html');fs.copyFileSync(path.join(root,'journal-website.html'),file);
let session;const results=[];
try{
 session=await startBrowser({temp,engine});const {viewport,navigate}=session;
 const evaluate=expression=>session.evaluate('(()=>eval('+JSON.stringify(expression)+'))()');
 const data=e=>evaluate('(async()=>JSON.stringify(await ('+e+')))()').then(JSON.parse);
 const check=(ok,name,detail={})=>{if(!ok)throw Error(name+': '+JSON.stringify(detail));results.push({name,...detail});};
 const wait=async e=>{for(let i=0;i<70;i++){try{if(await evaluate(e))return;}catch{}await pause(80);}throw Error('Not ready: '+e);};
 await viewport(390,844);await navigate(pathToFileURL(file).href);await wait("active==='mobile'&&!changing");
 check(await evaluate("getComputedStyle(document.getElementById('auth-login')).display!=='none'&&!document.getElementById('start')&&!window.__journalNavbar.active"),'Clean sign-in opening');
 await evaluate("const f=document.querySelector('#auth-login form');for(const i of f.querySelectorAll('input'))i.value=i.type==='email'?'review@example.com':'password123';f.requestSubmit()");await wait("location.hash==='#today'&&!!window.__journalNavbar.active");
 for(const width of [320,390,834,1112]){
  await viewport(width,700);await wait(`active==='${width<724?'mobile':'tablet'}'&&!changing`);await pause(150);
  for(const id of ['today','reflections','timeline','ask','you','today-without-note','ask-loading','you-loading']){
   await evaluate(`location.hash='${id}'`);await wait(`window.__journalNavbar.active?.screen.id==='${id}'`);await pause(200);
   await evaluate("const v=window.__journalNavbar.active;if(v.reader.scrollHeight-v.reader.clientHeight<400){const sheet=v.reader.querySelector('.aj-c-sheet')||v.reader;const fixture=document.createElement('div');fixture.dataset.scrollFixture='true';fixture.style.minHeight=(v.reader.clientHeight+900)+'px';for(let i=0;i<8;i++){const p=document.createElement('p');p.className='prose';p.textContent='Existing review content repeated to exercise scrolling in a tall viewport. '.repeat(3);fixture.append(p);}sheet.append(fixture);}");
   await evaluate("const v=window.__journalNavbar.active;v.reader.scrollTop=v.journal?v.reader.scrollHeight:0;v.setCompact(false)");await pause(350);
   await evaluate("const v=window.__journalNavbar.active;v.reader.scrollTop=v.journal?v.reader.scrollTop-250:250");await pause(350);
   const compact=await data("(()=>{const v=window.__journalNavbar.active,date=v.header.querySelector('time'),d=(v.header.dataset.date==='short'?date.querySelector('.aj-s-header__core'):date)?.getBoundingClientRect(),links=[...v.header.querySelector('nav').querySelectorAll('a')],r=x=>x.getBoundingClientRect();return {state:v.header.dataset.state,height:r(v.header).height,date:d?v.header.dataset.date==='none'||d.left>=r(links[3]).right-1&&d.right<=r(links[4]).left+1:!date,hasDate:!!d,form:v.header.dataset.date||'',readable:!d||v.header.dataset.date==='none'||d.height>=Math.min(12,parseFloat(getComputedStyle(links[0]).fontSize))-0.1,paper:getComputedStyle(v.header).backgroundColor===getComputedStyle(v.header.closest('[data-motion]')).backgroundColor,targets:links.every(a=>r(a).width>=43.9&&r(a).height>=43.9&&document.elementFromPoint(r(a).left+r(a).width/2,r(a).top+r(a).height/2)?.closest('a')===a),nowrap:links.every(a=>{const range=document.createRange();range.selectNodeContents(a);return new Set([...range.getClientRects()].map(x=>Math.round(x.top))).size===1;}),overflow:document.documentElement.scrollWidth>innerWidth+1,quiet:links.filter(a=>!a.hasAttribute('aria-current')&&a!==links.at(-1)).every(a=>getComputedStyle(a).backgroundColor==='rgba(0, 0, 0, 0)')}})()");
   check(compact.state==='compact'&&compact.date&&compact.hasDate===!['reflections','you','you-loading'].includes(id)&&(!compact.hasDate||compact.form===({320:'none',390:'short'}[width]||'full'))&&compact.readable&&compact.paper&&compact.targets&&compact.nowrap&&!compact.overflow&&compact.quiet,'Same quiet navbar on navigation pages',{width,id,...compact});
   if([320,390,834].includes(width)&&['today','reflections','timeline','ask','you'].includes(id))fs.writeFileSync(path.join(evidence,`${engine}-${id}-${width}.png`),await session.captureScreenshot());
   await evaluate("const v=window.__journalNavbar.active;v.reader.scrollTop=v.journal?v.reader.scrollHeight:0");await pause(350);
   check(await evaluate("window.__journalNavbar.active.header.dataset.state==='expanded'"),'Home edge restores header',{width,id});
   await evaluate("document.querySelectorAll('[data-scroll-fixture]').forEach(e=>e.remove())");
  }
 }
 await viewport(390,844);await wait("active==='mobile'&&!changing");await evaluate("location.hash='today'");await wait("window.__journalNavbar.active?.screen.id==='today'");await pause(250);
 for(let i=0;i<7;i++){await evaluate(`const f=document.querySelector('#today .prototype-input');f.value='Entry ${i}: '+('A longer thought for checking the reading position. '.repeat(7));f.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#today .aj-c-composer .aj-c-send').click()`);await pause(80);}
 await pause(350);check(await evaluate("const v=window.__journalNavbar.active;v.reader.scrollHeight-v.reader.clientHeight-v.reader.scrollTop<24"),'New entries stay at the newest end');
 await evaluate("const v=window.__journalNavbar.active;v.reader.scrollTop=v.reader.scrollHeight*.35");await pause(350);
 const before=await data("(async()=>{const state=await window.__journalPreview.snapshot();return state.journalPosition})()");check(!before.atEnd&&!!before.anchor,'Older-entry reading position is recorded');
 for(const width of [834,1440,390]){
  await viewport(width,900);await wait(`active==='${width===1440?'desktop':width===834?'tablet':'mobile'}'&&!changing`);await pause(400);
  const after=await data("(async()=>{const state=await window.__journalPreview.snapshot();return state.journalPosition})()");
  check(after.anchor?.key===before.anchor.key&&!after.atEnd,'Reading position survives profile changes',{width,before,after});
 }
 const motion=await data("new Promise(resolve=>{const v=window.__journalNavbar.active;v.setCompact(false);setTimeout(()=>{const frames=[],start=performance.now();v.setCompact(true);requestAnimationFrame(function sample(){const r=v.header.querySelector('time').getBoundingClientRect();frames.push({ms:performance.now()-start,x:r.left,y:r.top,h:v.header.getBoundingClientRect().height});if(performance.now()-start<340)requestAnimationFrame(sample);else resolve(frames);});},350);})");
 check(motion.some(x=>x.h>Math.min(...motion.map(y=>y.h))+1&&x.h<Math.max(...motion.map(y=>y.h))-1),'Compact transition has intermediate frames',{frames:motion.length,maxStep:Math.max(...motion.slice(1).map((x,i)=>Math.hypot(x.x-motion[i].x,x.y-motion[i].y)))});
 await evaluate("window.__journalNavbar.active.setCompact(false)");await pause(80);
 const reversal=await data("(async()=>{const v=window.__journalNavbar.active,a=v.header.querySelector('time').getAnimations();a.forEach(x=>x.pause());await Promise.all(a.map(x=>x.ready));await new Promise(requestAnimationFrame);const t=v.header.querySelector('time'),b=t.getBoundingClientRect();v.setCompact(true);const d=t.getBoundingClientRect();return Math.hypot(d.left-b.left,d.top-b.top)})()");check(reversal<1,'Reversal remains continuous',{jump:reversal});
 await evaluate("delete document.documentElement.dataset.motionReview;window.__journalNavbar.active.setCompact(false)");await pause(40);check(await evaluate("getComputedStyle(window.__journalNavbar.active.header).transitionDuration==='0s'"),'Production reduced motion is immediate');
 await viewport(1440,1000);await wait("active==='desktop'&&!changing");await pause(650);check(await evaluate("!window.__journalNavbar.active&&!!document.querySelector('#today .aj-l-mast[data-form=title] .aj-c-dest')"),'Desktop navigation remains unchanged');fs.writeFileSync(path.join(evidence,`${engine}-desktop.png`),await session.captureScreenshot());
 // Clean, unmodified product content for the finish review (no scroll fixtures).
 for(const width of [390,834]){
  await viewport(width,844);await navigate(pathToFileURL(file).href+'?fonts=portable#today');await wait('!!window.__journalNavbar.active');await evaluate('document.fonts.ready.then(()=>true)');
  for(const id of ['today','reflections','timeline','ask','you']){
   await evaluate(`location.hash='${id}'`);await wait(`window.__journalNavbar.active?.screen.id==='${id}'`);await pause(100);
   await evaluate('window.__journalNavbar.active.setCompact(true)');await pause(350);
   fs.writeFileSync(path.join(evidence,`${engine}-final-${id}-${width}.png`),await session.captureScreenshot());
  }
 }
 await viewport(320,700);await navigate(pathToFileURL(file).href+'#today');await wait('!!window.__journalNavbar.active');await pause(250);
 await evaluate("const v=window.__journalNavbar.active;[...v.header.querySelector('nav').querySelectorAll('a')].forEach(a=>a.style.fontSize=parseFloat(getComputedStyle(a).fontSize)*2+'px');v.setCompact(true)");await pause(350);
 check(await evaluate("const v=window.__journalNavbar.active,d=v.header.querySelector('time').getBoundingClientRect(),a=v.header.querySelector('nav').querySelectorAll('a');v.header.dataset.type==='large'&&d.height>=11.9&&d.top>=a[3].getBoundingClientRect().bottom-1&&d.right<=a[4].getBoundingClientRect().left+1&&document.documentElement.scrollWidth<=innerWidth+1"),'Enlarged labels keep a readable date between Ask and You');
 check(!session.errors.length&&!session.requests.length,'No browser errors or external requests',{errors:session.errors,requests:session.requests});
 fs.rmSync(path.join(evidence,engine+'-failure.json'),{force:true});
 fs.writeFileSync(path.join(evidence,engine+'-checks.json'),JSON.stringify({engine,results},null,2)+'\n');console.log(`PASS ${engine}: ${results.length} navbar and standalone delivery checks.`);
}catch(error){fs.writeFileSync(path.join(evidence,engine+'-failure.json'),JSON.stringify({engine,error:error.message,results},null,2)+'\n');throw error;}
finally{await session?.close();removeTemporaryDirectory(temp);}
