// Canonical, script-free Writing companion markup for numbered web screens.
import {elementRange} from './html-structure.mjs';
const moods=['Light','Good','Even','Low','Hard'];
function find(html,cls){
 const match=new RegExp(`<\\w+\\b[^>]*class="(?:[^"\\n]*\\s)?${cls}(?:\\s[^"\\n]*)?"[^>]*>`).exec(html);
 return match?elementRange(html,match.index):null;
}
function moodRows(html,label='Today felt'){
 const re=/<(?:section|div)\b[^>]*class="[^"\n]*\bmoodrow\b[^"\n]*"[^>]*>/g;
 const replacements=[];
 for(let match;match=re.exec(html);){
  const row=elementRange(html,match.index);re.lastIndex=row.end;
  if(/\bruled-mood\b/.test(match[0]))continue;
  const chips=find(row.html,'chips');if(!chips)continue;
  const buttons=[...chips.html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(m=>m[0]);
  const ordered=moods.map(name=>buttons.find(b=>new RegExp(`>${name}<\\/button>`).test(b)));
  if(ordered.some(b=>!b))throw Error('Writing companion requires the five canonical mood words');
  const extra=row.html.slice(chips.end).replace(/<\/(?:section|div)>\s*$/,'');
  const opening=match[0].replace('moodrow','moodrow ruled-mood');
  const closing=row.html.match(/<\/(?:section|div)>$/)[0];
  const controls=ordered.map((button,i)=>button.replace('<button',`<button data-mood="${moods[i].toLowerCase()}"`)).join('');
  replacements.push({start:row.start,end:row.end,html:`${opening}<div class="tcol"><h2>${label}</h2></div><div class="ccol"><div class="chips" role="group" aria-label="How was this day?">${controls}</div>${extra}</div>${closing}`});
 }
 for(const r of replacements.reverse())html=html.slice(0,r.start)+r.html+html.slice(r.end);
 return html;
}
function device(html){
 const hasComposer=!!find(html,'composer');html=moodRows(html,hasComposer?'Today felt':'Day felt');
 let composer=find(html,'composer'),glance=find(html,'glance');
 if(!composer||!glance||find(html,'journal-overview'))return html;
 const note=`<section class="journal-overview" aria-label="Recent overview"><h2>Recent overview</h2>${glance.html}</section>`;
 html=html.slice(0,glance.start)+html.slice(glance.end);
 composer=find(html,'composer');
 const opening=composer.html.match(/^<[^>]+>/)[0];
 const next=composer.html.replace(opening,opening.replace('composer','composer writing-companion')+note);
 return html.slice(0,composer.start)+next+html.slice(composer.end);
}
export function writingCompanion(html){
 const re=/<div\b[^>]*class="device(?:\s[^"\n]*)?"[^>]*>/g,replacements=[];
 for(let m;m=re.exec(html);){const r=elementRange(html,m.index);re.lastIndex=r.end;replacements.push({...r,html:device(r.html)});}
 for(const r of replacements.reverse())html=html.slice(0,r.start)+r.html+html.slice(r.end);
 return html;
}
