// The app's coordinator for the Timeline (v4 C1; the walkthroughs and the website). The sections do their own
// work; this passes what one says to the other, within the screen it was said on:
//   daycard:jump {date} -> the record's data-jump (the record scrolls and draws the arrival);
//   record:day {date}   -> the card's data-day (the date row, the rings in its graph and calendar);
//   find:search {query, mode} -> a stand-in search (the developers implement keyword and meaning search): it hides
//     the rows and month headings that don't match, marks the words found, dates a later row of a day whose first
//     row it hides, writes the found line, and puts the no-matches message (a build-time template) in place of the
//     rows. Exploration logic: explore timeline-jump-arrival, shared/timeline.js.
window.createJournalTimeline=function({signal}){
 const screenOf=el=>el.closest('.aj-l-shell')||document;
 document.addEventListener('daycard:jump',event=>{
  const record=screenOf(event.target).querySelector('[data-module~="record"]');
  if(record&&event.detail?.date)record.dataset.jump=event.detail.date;
 },{signal});
 document.addEventListener('record:day',event=>{
  const card=screenOf(event.target).querySelector('[data-module~="daycard"]');
  if(card&&event.detail?.date&&card.dataset.day!==event.detail.date)card.dataset.day=event.detail.date;
 },{signal});

 // The stand-in search. By meaning, a word brings in the words of its group.
 const GROUPS=[
  ['sleep','slept','tired','night','awake','insomnia','rest','bed'],
  ['flat','home','move','moving','landlord','viewing','house'],
  ['work','office','shutdown','emails','building','job'],
  ['priya','friend','friends','talked','rang','call','phone','birthday'],
  ['holiday','nothing','quiet','odd','break','off','walk'],
  ['heat','hot','weather','summer','light'],
 ];
 const escape=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const pattern=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function terms(query,mode){
  if(mode!=='meaning')return query?[query.toLowerCase()]:[];
  const words=query.toLowerCase().split(/[^a-z']+/).filter(w=>w.length>1),out=new Set(words);
  for(const w of words)for(const g of GROUPS)if(g.some(x=>x.startsWith(w)||w.startsWith(x)))g.forEach(x=>out.add(x));
  return [...out];
 }
 const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 const shortDay=date=>{const t=new Date(date+'T00:00:00Z');return `${DOW[t.getUTCDay()]} ${t.getUTCDate()}`;};
 const original=new WeakMap(),dated=new Set(),notes=new Map();
 document.addEventListener('find:search',event=>{
  const find=event.target.closest('[data-module~="find"]'),screen=screenOf(find);
  const record=screen.querySelector('[data-module~="record"]'),sheet=record?.querySelector('.aj-c-sheet');
  if(!sheet)return;
  const query=(event.detail?.query||'').trim(),mode=event.detail?.mode==='meaning'?'meaning':'keyword';
  const ts=terms(query,mode),on=ts.length>0;
  const hit=text=>ts.some(t=>mode==='meaning'?new RegExp(`\\b${pattern(t)}`,'i').test(text):text.toLowerCase().includes(t));
  // Back to the rows as written, then this search.
  notes.get(sheet)?.forEach(n=>n.remove());notes.delete(sheet);
  for(const cell of dated)if(sheet.contains(cell)){cell.replaceChildren();dated.delete(cell);}
  const rows=[...sheet.querySelectorAll(':scope > [data-day]')],days=new Set();
  for(const row of rows){
   const text=row.matches('.aj-c-dayrow')?row.querySelector('.aj-c-text'):null;
   if(text){if(!original.has(text))original.set(text,text.innerHTML);text.innerHTML=original.get(text);}
   if(!on){row.hidden=false;continue;}
   const words=text?.textContent||'',ok=!!text&&hit(words);
   if(ok){days.add(row.dataset.day);
    const re=new RegExp(`(${ts.map(pattern).join('|')})${mode==='meaning'?'\\w*':''}`,'gi');
    text.innerHTML=escape(words).replace(re,'<mark>$1</mark>');}
   row.hidden=!ok;
  }
  // A day's first row carries its date: when only a later row matched, that row shows the date instead.
  const seen=new Set();
  for(const row of rows){
   if(row.hidden||seen.has(row.dataset.day))continue;
   seen.add(row.dataset.day);
   const cell=row.querySelector('[data-hook~="date"]');
   if(on&&cell&&!cell.querySelector('time')){cell.innerHTML=`<time datetime="${row.dataset.day}">${shortDay(row.dataset.day)}</time>`;dated.add(cell);}
  }
  // A month heading goes with its rows.
  let heading=null,any=false;
  const close=()=>{if(heading)heading.hidden=on&&!any;};
  for(const child of sheet.children){
   if(child.matches('.aj-c-shead')){close();heading=child;any=false;}
   else if(child.dataset.day&&!child.hidden)any=true;
  }
  close();
  if(on&&!days.size){
   const template=document.querySelector(`template[data-template="timeline-none-${mode}"]`);
   if(template){const added=[...template.content.cloneNode(true).children];sheet.append(...added);notes.set(sheet,added);}
  }
  const found=find.querySelector('[data-hook~="found"]');
  if(found)found.textContent=!on||!days.size?'':mode==='meaning'
   ?`${days.size} ${days.size===1?'day':'days'} about “${query}”, in any words.`
   :`${days.size} ${days.size===1?'day':'days'} with “${query}”.`;
  find.dataset.status='idle';
 },{signal});
};
