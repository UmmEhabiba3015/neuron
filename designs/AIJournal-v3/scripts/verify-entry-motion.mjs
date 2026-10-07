import {startBrowser,pause,removeTemporaryDirectory} from './browser-harness.mjs';
// Firefox BiDi check for the approved entry fade and memory disclosure.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'journal-entry-firefox-'));
const standalone=path.join(temp,'journal-website.html');fs.copyFileSync(path.join(root,'journal-website.html'),standalone);
let session;
try{
 session=await startBrowser({temp,engine:'firefox'});
 const {call,evaluate,context}=session;
 await call('browsingContext.setViewport',{context,viewport:{width:1440,height:900},devicePixelRatio:1});
 await call('browsingContext.navigate',{context,url:pathToFileURL(standalone).href,wait:'complete'});
 for(let i=0;i<60;i++){if(await evaluate(`!!document.querySelector('#today .entry-tools')`))break;await pause(100);}
 await evaluate(`location.hash='today';scrollTo(0,0)`);await pause(200);
 const pointer=async(x,y)=>call('input.performActions',{context,actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:Math.round(x),y:Math.round(y),duration:0,origin:'viewport'}]}]});
 await pointer(0,0);await pause(160);
 const idle=JSON.parse(await evaluate(`JSON.stringify((()=>{const row=document.querySelector('#today .entry-item'),p=row.querySelector('.prose'),r=row.getBoundingClientRect();return {hover:matchMedia('(hover:hover) and (pointer:fine)').matches,opacity:Number(getComputedStyle(row.querySelector('.entry-tools')).opacity),width:p.getBoundingClientRect().width,x:r.left+10,y:r.top+10,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches}})())`));
 if(!idle.hover||idle.opacity!==0||!idle.reduced)throw Error('Firefox idle/reduced preference failed: '+JSON.stringify(idle));
 const samples=(duration,selector='#today .entry-tools')=>evaluate(`new Promise(resolve=>{const samples=[],start=performance.now(),tools=document.querySelector(${JSON.stringify(selector)});function sample(){samples.push({ms:performance.now()-start,opacity:Number(getComputedStyle(tools).opacity)});if(performance.now()-start<${duration})requestAnimationFrame(sample);else resolve(JSON.stringify(samples))}requestAnimationFrame(sample)})`);
 await pointer(idle.x,idle.y);const fadeIn=JSON.parse(await samples(220));
 if(!fadeIn.some(x=>x.opacity>0&&x.opacity<1)||fadeIn.at(-1).opacity!==1)throw Error('Firefox fade-in failed: '+JSON.stringify(fadeIn));
 const stable=await evaluate(`document.querySelector('#today .entry-item .prose').getBoundingClientRect().width`);if(stable!==idle.width)throw Error('Firefox text moves during reveal');
 const shot=await call('browsingContext.captureScreenshot',{context});fs.writeFileSync(path.join(root,'verification','entry-hover-firefox-1440.png'),Buffer.from(shot.data,'base64'));
 await pointer(0,0);const fadeOut=JSON.parse(await samples(170));
 if(!fadeOut.some(x=>x.opacity>0&&x.opacity<1)||fadeOut.at(-1).opacity!==0)throw Error('Firefox fade-out failed: '+JSON.stringify(fadeOut));
 const memory=await evaluate(`(()=>{const row=document.querySelector('#today .entry-item'),menu=row.querySelector('details'),button=row.querySelector('[data-entry-action="memory"]');menu.open=true;button.click();const excluded=button.getAttribute('aria-pressed')==='false'&&row.querySelector('.memory-state').textContent==='Out of memory'&&menu.open;button.click();return excluded&&button.getAttribute('aria-pressed')==='true'&&row.querySelector('.memory-state').textContent==='In memory'})()`);if(!memory)throw Error('Firefox memory checkbox failed');
 const iconHover=[];
 await evaluate(`document.activeElement?.blur();document.querySelector('#today .srow.entry-item').scrollIntoView({block:'center'})`);await pointer(0,0);await pause(180);
 for(const [action,target] of [['edit','rgb(54, 68, 52)'],['delete','rgb(166, 55, 45)']]){
  const selector='#today .srow.entry-item [data-entry-action="'+action+'"]';
  const icon=JSON.parse(await evaluate(`JSON.stringify((()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+12,color:getComputedStyle(e).color}})())`));
  await pointer(icon.x,icon.y);
  const colors=JSON.parse(await evaluate(`new Promise(resolve=>{const values=[],start=performance.now(),e=document.querySelector(${JSON.stringify(selector)});function sample(){const s=getComputedStyle(e);values.push({ms:performance.now()-start,color:s.color,background:s.backgroundColor});if(performance.now()-start<220)requestAnimationFrame(sample);else resolve(JSON.stringify(values))}requestAnimationFrame(sample)})`));
  if(colors.at(-1).color!==target||!colors.some(x=>x.color!==icon.color&&x.color!==target)||colors.some(x=>x.background!=='rgba(0, 0, 0, 0)'))throw Error('Firefox icon hover feedback failed: '+action);
  await pointer(0,0);await pause(150);iconHover.push({action,target,colors});
 }
 await evaluate(`document.querySelector('#today .recrow.entry-item').scrollIntoView({block:'center'})`);
 await pointer(0,0);await pause(180);
 const voice=JSON.parse(await evaluate(`JSON.stringify((()=>{const row=document.querySelector('#today .recrow.entry-item'),p=row.querySelector('.prose'),r=x=>x.getBoundingClientRect();return {opacity:Number(getComputedStyle(row.querySelector('.entry-tools')).opacity),noEdit:!row.querySelector('[data-entry-action="edit"]')&&row.querySelectorAll('.entry-icon').length===1,arrowCentered:Math.abs(r(row.querySelector('summary svg')).top+6-r(row.querySelector('.memory-state')).top-r(row.querySelector('.memory-state')).height/2)<1,aligned:[...row.querySelectorAll('.entry-icon svg')].every(x=>Math.abs(r(x).top+10-r(p).top-parseFloat(getComputedStyle(p).lineHeight)/2)<1),x:r(row).left+10,y:r(row).top+10}})())`));
 if(voice.opacity!==0||!voice.aligned||!voice.noEdit||!voice.arrowCentered)throw Error('Firefox voice alignment/idle failed: '+JSON.stringify(voice));
 await pointer(voice.x,voice.y);const voiceFadeIn=JSON.parse(await samples(220,'#today .recrow .entry-tools'));
 await pointer(0,0);const voiceFadeOut=JSON.parse(await samples(170,'#today .recrow .entry-tools'));
 if(!voiceFadeIn.some(x=>x.opacity>0&&x.opacity<1)||voiceFadeIn.at(-1).opacity!==1||!voiceFadeOut.some(x=>x.opacity>0&&x.opacity<1)||voiceFadeOut.at(-1).opacity!==0)throw Error('Firefox voice hover fade failed');
 const voiceMemory=await evaluate(`(()=>{const row=document.querySelector('#today .recrow.entry-item');row.querySelector('summary').click();row.querySelector('[data-entry-action="memory"]').click();return row.querySelector('.memory-state').textContent==='Out of memory'&&row.querySelector('details').open})()`);
 if(!voiceMemory)throw Error('Firefox voice memory menu failed');
 const reduced=JSON.parse(await evaluate(`new Promise(resolve=>{delete document.documentElement.dataset.motionReview;requestAnimationFrame(()=>{const style=getComputedStyle(document.querySelector('#today .recrow .entry-tools'));resolve(JSON.stringify({duration:style.transitionDuration,property:style.transitionProperty,review:document.documentElement.getAttribute('data-motion-review'),reduced:matchMedia('(prefers-reduced-motion:reduce)').matches}))})})`));
 if(!reduced.reduced||reduced.review!==null||!(reduced.property==='none'||reduced.duration.split(',').every(value=>parseFloat(value)===0)))throw Error('Firefox production reduced motion failed: '+JSON.stringify(reduced));
 fs.writeFileSync(path.join(root,'verification','entry-motion-firefox.json'),JSON.stringify({idle,fadeIn,fadeOut,stableText:true,memoryCheckbox:true,iconHover,voice,voiceFadeIn,voiceFadeOut,voiceMemory:true,productionReducedMotion:reduced},null,2)+'\n');
 console.log('PASS: Firefox idle/hover fade, stable text, memory checkbox and reduced-motion behavior.');
}finally{
 await session?.close();
 removeTemporaryDirectory(temp);
}
