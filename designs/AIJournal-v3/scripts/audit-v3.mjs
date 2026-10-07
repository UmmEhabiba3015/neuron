import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let findings=0;
function checkNavigation(file,html,portable=false){
 const markup=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'');
 for(const m of markup.matchAll(/<(a|form)\b([^>]*?)\s(?:href|action)="([^"]+)"([^>]*)>([\s\S]*?)(?:<\/\1>|$)/g)){
  const target=m[3];
  if(target==='#'||(!/^(?:#.+|00-prototype\.html#.+|https?:|mailto:|tel:)/.test(target))||(portable&&target.startsWith('00-prototype.html#'))){
   console.log(`${file}: unusable navigation target ${target}`);findings++;
  }
  if(m[1]==='a'&&m[5].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()==='You'&&!/^(?:00-prototype\.html)?#you$/.test(target)){
   console.log(`${file}: You points to ${target}`);findings++;
  }
 }
}
for(const p of ['mobile-web','tablet-web','desktop-web']){
 const prototype=fs.readFileSync(path.join(root,p,'00-prototype.html'),'utf8').replace(/<script[\s\S]*?<\/script>/g,'');
 const prototypeIds=new Set([...prototype.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 for(const n of fs.readdirSync(path.join(root,p)).filter(x=>/^\d\d-/.test(x))){
  const s=fs.readFileSync(path.join(root,p,n),'utf8');
  checkNavigation(`${p}/${n}`,s);
  const visible=s.replace(/<!--[\s\S]*?-->/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  for(const m of visible.matchAll(/\b(?:Pro|Free|guest|offline|import|upgrade|notifications|trackers|crisis|tier)\b|browser session|keep what you have written|comes with you/gi)){
   console.log(`${p}/${n}: old visible term: ${visible.slice(Math.max(0,m.index-48),m.index+75)}`);findings++;
  }
  if(n!=='00-prototype.html')for(const m of s.matchAll(/(?:href|action)="00-prototype\.html#([^"]+)"/g))if(!prototypeIds.has(m[1])){
   console.log(`${p}/${n}: broken walkthrough target #${m[1]}`);findings++;
  }
  if(n==='00-prototype.html'){
   const markup=s.replace(/<script[\s\S]*?<\/script>/g,'');
   const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
   const counts=new Map();for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
   for(const [id,count] of counts)if(count>1){console.log(`${p}: duplicate id ${id} (${count})`);findings++;}
   const set=new Set(ids);
   for(const m of markup.matchAll(/(?:href|action)="(?:00-prototype\.html)?#([^"]+)"/g))if(m[1]&&!set.has(m[1])){console.log(`${p}: broken hash #${m[1]}`);findings++;}
  }
 }
}
for(const file of ['journal-prototype.html','journal-prototype-tablet.html','journal-prototype-desktop.html']){
 const s=fs.readFileSync(path.join(root,file),'utf8').replace(/<!--[\s\S]*?-->/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'');
 checkNavigation(file,s,true);
 const ids=new Set([...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 for(const m of s.matchAll(/(?:href|action)="00-prototype\.html#([^"]+)"/g)){
  console.log(`${file}: route leaves portable walkthrough #${m[1]}`);findings++;
 }
 for(const m of s.matchAll(/(?:href|action)="#([^"]+)"/g))if(m[1]&&!ids.has(m[1])){
  console.log(`${file}: broken portable hash #${m[1]}`);findings++;
 }
}
const website=fs.readFileSync(path.join(root,'journal-website.html'),'utf8');
const match=website.match(/const variants=(\{[\s\S]*?\});\s*const host=/);
if(!match){console.log('journal-website.html: embedded layouts missing');findings++;}
else{
 const variants=JSON.parse(match[1]);
 for(const name of ['mobile','tablet','desktop']){
  const source=variants[name];
  if(!source){console.log(`journal-website.html: ${name} layout missing`);findings++;continue;}
  const markup=source.replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'');
  if(markup.includes('id="start"')||markup.includes('class="auth-preview"')){console.log(`journal-website.html: review controls remain in ${name}`);findings++;}
  if(/<link\b[^>]*rel="stylesheet"|<script\b[^>]*src=/.test(markup)){console.log(`journal-website.html: external asset in ${name}`);findings++;}
  const ids=new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  if(!ids.has('auth-login')||!ids.has('today')){console.log(`journal-website.html: core route missing in ${name}`);findings++;}
  for(const m of markup.matchAll(/(?:href|action)="#([^"]+)"/g))if(m[1]&&!ids.has(m[1])){console.log(`journal-website.html: broken ${name} route #${m[1]}`);findings++;}
 }
}
console.log(`Audit findings: ${findings}`);
process.exitCode=findings?1:0;
