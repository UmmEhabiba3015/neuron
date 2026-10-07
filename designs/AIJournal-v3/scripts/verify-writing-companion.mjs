import {startBrowser,pause,removeTemporaryDirectory} from './browser-harness.mjs';
// Portable overview/mood studies: layout, selection, entry order and disclosure paths.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const engine=process.argv.includes('--firefox')?'firefox':'chromium';
const evidence=path.join(root,'verification','overview-studies');fs.mkdirSync(evidence,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'journal overview studies '));
const files=['journal-website.html'];
files.forEach(name=>fs.copyFileSync(path.join(root,name),path.join(temp,name)));
let session;const results=[];
try{
 session=await startBrowser({temp,engine});
 const {call,evaluate,navigate,viewport,context,errors,requests}=session;
 const screenshot=async name=>{
  await pause(80);
  fs.writeFileSync(path.join(evidence,name),await session.captureScreenshot());
 };
 const data=expression=>evaluate('(async()=>JSON.stringify(await ('+expression+')))()').then(JSON.parse);
 const check=(condition,name,detail)=>{if(!condition)throw Error(name+': '+JSON.stringify(detail));results.push({check:name,...detail});};
 const wait=async expression=>{for(let i=0;i<70;i++){try{if(await evaluate(expression))return;}catch{}await pause(100);}throw Error('Not ready: '+expression);};
 for(const [index,file] of files.entries()){
  await viewport(390,844);await navigate(pathToFileURL(path.join(temp,file)).href+'#today');await wait("document.querySelector('#today.site-current .composer.writing-companion')");await pause(650);
  check(await evaluate("location.hash==='#today'&&document.querySelectorAll('#today "+'.journal-overview'+"').length===1"),'Opens the populated journal with one overview',{file});
  await evaluate("(()=>{const s=document.querySelector('#today select');if(s){s.value='Good';s.dispatchEvent(new Event('change',{bubbles:true}));}else [...document.querySelectorAll('#today .moodrow .chips button')].find(b=>b.textContent==='Good').click();})()");
  await evaluate("(()=>{const f=document.querySelector('#today .composer .prototype-input');f.value='A new entry to check the latest end.';f.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#today .composer .crow button').click();})()");await pause(350);
  const order=await data("(()=>{const s=document.querySelector('#today'),m=s.querySelector('.moodrow'),r=s.querySelector('.prototype-list .entry-item'),note=s.querySelector('.study-latest-note');return {entry:!!r,inSheet:!!r?.closest('.sheet'),beforeMood:!!(r?.compareDocumentPosition(m)&Node.DOCUMENT_POSITION_FOLLOWING),noteAfterEntry:!note||!!(r?.compareDocumentPosition(note)&Node.DOCUMENT_POSITION_FOLLOWING)};})()");
  check(order.entry&&order.inSheet&&order.beforeMood&&order.noteAfterEntry,'New entry stays before mood and the latest overview',{file,...order});
  for(const width of [320,390,834,1440]){
   await viewport(width,844);await pause(600);await evaluate('scrollTo(0,100000)');await pause(150);
   const r=await data("(()=>{const s=document.querySelector('#today'),m=s.querySelector('.moodrow'),targets=[...s.querySelectorAll('.moodrow button,.study-mood-select select,.study-fold>summary,.study-overview-access button')],select=s.querySelector('select'),selected=select?select.value:s.querySelector('.moodrow .chips button[aria-pressed=true]')?.textContent;return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,moodHeight:m.getBoundingClientRect().height,selected,targets:targets.map(e=>({text:e.textContent.slice(0,55),height:e.getBoundingClientRect().height})),headerTop:s.querySelector('.journal-header')?.getBoundingClientRect().top};})()");
   check(!r.overflow&&r.targets.every(t=>t.height>=43.5)&&r.selected==='Good'&&(r.headerTop===undefined||Math.abs(r.headerTop)<1),'Responsive controls and retained mood',{file,...r});
   const gutter=await data("(()=>{const s=document.querySelector('#today'),m=s.querySelector('.moodrow>.tcol'),r=s.querySelector('.srow>.tcol'),columns=[...s.querySelectorAll('.sheet .tcol')];return {moodRight:m.getBoundingClientRect().right,entryRight:r.getBoundingClientRect().right,columnRights:columns.map(e=>({label:e.textContent.trim(),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})),border:getComputedStyle(m).borderRightWidth,aligned:columns.every(e=>getComputedStyle(e).textAlign==='left'),order:[...s.querySelectorAll('.moodrow button')].map(e=>e.textContent.trim())};})()");
   check(gutter.columnRights.every(c=>Math.abs(c.right-gutter.entryRight)<.5)&&gutter.border==='1px'&&gutter.aligned&&gutter.order.join(',')==='Light,Good,Even,Low,Hard','Every entry, record-note and mood divider shares one column',{file,width,...gutter});
   if(width===390||width===1440)await screenshot(engine+'-'+(index+1)+'-'+width+'.png');
  }
  await viewport(390,844);await pause(500);
  const move=(x,y)=>engine==='firefox'?call('input.performActions',{context,actions:[{type:'pointer',id:'mood-mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:Math.round(x),y:Math.round(y),duration:0,origin:'viewport'}]}]}):call('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
  await evaluate('scrollTo(0,100000)');await pause(100);await move(0,0);await pause(180);
  const point=await data("(()=>{const b=document.querySelector('#today [data-mood=light]'),r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()");
  await evaluate("window.__moodFrames=[];requestAnimationFrame(function sample(){const b=document.querySelector('#today [data-mood=light]');window.__moodFrames.push(+getComputedStyle(b,'::before').opacity);if(window.__moodFrames.length<24)requestAnimationFrame(sample);})");
  await move(point.x,point.y);await pause(450);
  const fade=await data("({frames:window.__moodFrames,color:getComputedStyle(document.querySelector('#today [data-mood=light]')).color,opacity:getComputedStyle(document.querySelector('#today [data-mood=light]'),'::before').opacity})");
  check(fade.frames.some(v=>v>0&&v<1)&&fade.opacity==='1'&&fade.color==='rgb(51, 100, 59)','Hover fades to green without changing layout',{file,...fade});
  await screenshot(engine+'-light-hover-390.png');await move(0,0);await pause(200);
  check(await evaluate("getComputedStyle(document.querySelector('#today [data-mood=light]'),'::before').opacity==='0'"),'Hover clears after pointer exit',{file});
  // Touch selection uses immediate press feedback and retains the selected tone.
  if(engine==='chromium'){
   await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
   await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else await call('input.performActions',{context,actions:[{type:'pointer',id:'mood-touch',parameters:{pointerType:'touch'},actions:[{type:'pointerMove',x:Math.round(point.x),y:Math.round(point.y),duration:0,origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
  await pause(200);
  check(await evaluate("document.querySelector('#today [data-mood=light]').getAttribute('aria-pressed')==='true'&&getComputedStyle(document.querySelector('#today [data-mood=light]'),'::before').opacity==='1'"),'Touch keeps selected green feedback',{file});
  const palette=await data("(()=>{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');function rgb(color){ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);}function lum(c){const a=c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722;}return [...document.querySelectorAll('#today .moodrow button')].map(b=>{const c=getComputedStyle(b),tone=c.getPropertyValue('--mood-tone'),surface=getComputedStyle(b,'::before').backgroundColor,a=lum(rgb(tone)),z=lum(rgb(surface));return {label:b.textContent,tone,contrast:(Math.max(a,z)+.05)/(Math.min(a,z)+.05)};});})()");
  check(palette.every(p=>p.contrast>=4.5)&&new Set(palette.map(p=>p.tone)).size===5,'All five mood tones remain readable on their tints',{file,palette});
  await evaluate("delete document.documentElement.dataset.motionReview");await pause(60);
  check(await evaluate("getComputedStyle(document.querySelector('#today [data-mood=light]')).transitionDuration==='0s'&&getComputedStyle(document.querySelector('#today [data-mood=light]'),'::before').transitionDuration==='0s'"),'Production reduced motion makes feedback immediate',{file});
  await evaluate("document.documentElement.dataset.motionReview='play'");
  await viewport(320,480);await pause(500);
  await evaluate("(()=>{const nodes=[...document.querySelectorAll('#today .study-overview,#today .study-overview h2,#today .study-overview .glance,#today .journal-overview,#today .journal-overview h2,#today .journal-overview .glance,#today .moodrow h2,#today .moodrow button')];const sizes=nodes.map(e=>parseFloat(getComputedStyle(e).fontSize));nodes.forEach((e,i)=>e.style.fontSize=sizes[i]*2+'px');scrollTo(0,100000);})()");await pause(100);
  check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Enlarged text stays within a short mobile viewport',{file});
 }
 check(!errors.length&&!requests.length,'No browser errors or external requests',{errors,requests});
 fs.writeFileSync(path.join(evidence,engine+'-main-checks.json'),JSON.stringify({engine,results},null,2)+'\n');
 console.log('PASS '+engine+': '+results.length+' overview study checks');
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
