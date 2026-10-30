// The app's stand-in for Ask (v4 C2; the walkthroughs and the website). The sections do their own work; this answers
// for the app (the developers implement the real chat), within the screen it was asked on:
//   chat:ask {text}  -> the question in the open session, then the answer: the reading line, the words written in,
//     then done. The sample journal's exchange for those words; a wedding it cannot answer (the lead then offers what
//     it can); anything else the approved sample's weekends answer. The dentist question fails the first time it is
//     sent (its bubble marked, its words back in the box, the lead says so); sent again it is retried in place.
//   chat:new         -> a new open session (the last one closes) in a clear window: the day's sessions so far leave
//     the thread (they are the day's History entry); the lead asks what to ask. An open session still empty (today
//     opened whole from History) is kept: the window clears to it.
//   Ask opening (the page loading, or coming back to Ask) starts a new session the same way, on today.
//   chat:today       -> today opens as it was left (the window, a clear one after New).
//   drawers:day {date} -> the day opens whole: the skeleton first, then its chat, every session with its line (a past
//     day read only; today with the open session last). The date box and Bookmarks follow it. A day keeps what was
//     done on it while the page is open.
//   drawers:jump {id} -> the chat's data-jump (a message in a session New cleared away brings the whole day back
//     first);  bubble:bookmark -> the Bookmarks list and its count (the whole day's).
//   The chat fills the view (--aj-s-chat-min, --aj-s-chat-screen), so the composer rests at its foot.
//   Ask opens at its newest end, as a chat does: the navbar places its reader there (mobile, tablet); on desktop the
//   window scrolls to the bottom whenever Ask comes into view.
// The markup is cloned from the templates the modules render at build time (scripts/templates/5-ask.mjs).
// Exploration logic: explore ask-readable, shared/ask.js.
window.createJournalAsk=function({signal}){
 const TODAY='2026-08-09',CLOCK=['21:52','22:07','22:31','22:48'];
 const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const at=date=>new Date(date+'T00:00:00Z');
 const longDate=date=>{const t=at(date);return `${DOW[t.getUTCDay()]} ${t.getUTCDate()} ${MON[t.getUTCMonth()]}`;};
 const keyDate=date=>{const t=at(date);return `${DOW[t.getUTCDay()].slice(0,3)} ${t.getUTCDate()} ${MON[t.getUTCMonth()].slice(0,3)} '${String(t.getUTCFullYear()).slice(2)}`;};
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches&&document.documentElement.dataset.motionReview!=='play';
 const template=name=>document.querySelector(`template[data-template="${name}"]`)?.content.firstElementChild.cloneNode(true);
 const chatOf=el=>el.closest('[data-module~="chat"]');
 const prefixOf=chat=>chat.closest('.screen')?.id||'ask';
 const parts=chat=>{
  const foot=chat.querySelector('[data-place~="foot"]'),row=foot?.querySelector('[data-hook~="row"]');
  return {thread:chat.querySelector('[data-hook~="thread"]'),foot,row,field:row?.querySelector('[data-hook~="input"]'),
   end:chat.querySelector('[data-hook~="new"],[data-hook~="today"]'),drawers:chat.querySelector('[data-module~="drawers"]')};
 };
 // A template's ids (the message, its rate form's field and label) take the screen's prefix and the message's id.
 function own(el,id){
  const from=el.id;el.id=id;
  for(const x of el.querySelectorAll('[id]'))x.id=x.id.replace(from,id);
  for(const x of el.querySelectorAll('label[for]'))x.htmlFor=x.htmlFor.replace(from,id);
  return el;
 }
 // The exchanges by their question (the templates ask-q-<key>, the sample's questions as written).
 const norm=text=>text.replace(/\s+/g,' ').trim().toLowerCase();
 const questions=new Map([...document.querySelectorAll('template[data-template^="ask-q-"]')].map(t=>[norm(t.content.textContent),t.dataset.template.slice(6)]));
 const keyOf=text=>questions.get(norm(text))||(/wedding|\bsam\b/i.test(text)?'cant':/dentist/i.test(text)?'dentist':'live');

 // The composer's lead: the element before its field's row.
 function lead(chat,name){
  const {row}=parts(chat);if(!row)return;
  if(row.previousElementSibling)row.previousElementSibling.remove();
  const fresh=name&&parts(template(`ask-${name}`)).row?.previousElementSibling;
  if(fresh)row.before(fresh);
 }
 const sessions=chat=>[...parts(chat).thread.querySelectorAll(':scope > section')];
 // Today's sessions New cleared from the window, per screen, oldest first: still the day's (History opens the day
 // whole, Bookmarks lists them); they come back above the window's when it does.
 const earlier=new Map();
 const onToday=chat=>(chat.dataset.open||TODAY)===TODAY;
 const cleared=chat=>onToday(chat)?earlier.get(prefixOf(chat))||[]:[];
 function whole(chat){
  const back=cleared(chat);if(!back.length)return;
  earlier.delete(prefixOf(chat));parts(chat).thread.prepend(...back);
 }

 // Bookmarks: the open day's bookmarked messages, in the thread's order, and the pill's count.
 function marks(chat){
  const {thread,drawers}=parts(chat);if(!drawers||!thread)return;
  const list=drawers.querySelector('[data-hook~="marks"]'),pill=drawers.querySelector('[data-hook~="bookmarks"]');
  const kept=[...cleared(chat),thread].flatMap(x=>[...x.querySelectorAll('[data-module~="bubble"]')]).filter(b=>b.querySelector('[data-tool="bookmark"][aria-pressed="true"]'));
  if(!kept.length)list.replaceChildren(...template('ask-marks-none').querySelector('[data-hook~="marks"]').children);
  else{
   const ul=template('ask-marks').querySelector('[data-hook~="marks"] ul'),row=ul.firstElementChild;row.remove();
   for(const b of kept){
    const li=row.cloneNode(true),button=li.querySelector('[data-jump]'),[text,meta]=button.querySelector(':scope > span').children,answer=b.dataset.voice==='answer';
    const words=[...b.querySelectorAll('[data-hook~="text"] p')].map(p=>{const c=p.cloneNode(true);c.querySelectorAll('span:has(> a)').forEach(x=>x.remove());return c.textContent;}).join(' ').replace(/\s+/g,' ').trim();
    const session=(b.closest('section')?.getAttribute('aria-label')||'').replace(/^S/,'s');
    button.dataset.jump=b.id;text.textContent=words;meta.textContent=`${answer?'Answer':'You asked'} · ${session}`;
    if(answer)text.dataset.voice='answer';else delete text.dataset.voice;
    ul.append(li);
   }
   list.replaceChildren(ul);
  }
  const count=pill?.lastElementChild;
  if(count){count.textContent=String(kept.length);count.toggleAttribute('data-zero',!kept.length);}
  dispatchEvent(new Event('resize')); // the drawers' lit pills copy the count while the layer is open
 }

 // A day: the skeleton, then its chat. A day's chat is its root's state, its thread, its composer and its New or
 // Today; the day left behind keeps them until it is opened again.
 const kept=new Map();
 function take(chat){const p=parts(chat);return {state:['aria-label','data-state','data-day'].map(n=>[n,chat.getAttribute(n)]),thread:[...p.thread.childNodes],foot:[...p.foot.childNodes],waiting:p.foot.hasAttribute('data-waiting'),end:p.end};}
 function put(chat,day){
  for(const [n,v] of day.state)v===null?chat.removeAttribute(n):chat.setAttribute(n,v);
  const p=parts(chat);
  p.thread.replaceChildren(...day.thread);p.foot.replaceChildren(...day.foot);p.foot.toggleAttribute('data-waiting',day.waiting);p.end.replaceWith(day.end);
 }
 // a template's ids take the screen's prefix, as the walkthrough's own do (build-v3-prototypes.mjs remapLocalIds)
 function scoped(el,prefix){
  for(const x of el.querySelectorAll('[id]'))x.id=`${prefix}-${x.id}`;
  for(const x of el.querySelectorAll('label[for]'))x.htmlFor=`${prefix}-${x.htmlFor}`;
  return el;
 }
 function open(chat,date,{all=false,after=null}={}){
  if(chat.dataset.state==='loading'||((chat.dataset.open||TODAY)===date&&!(all&&cleared(chat).length)))return;
  const prefix=prefixOf(chat),screen=chat.closest('.aj-l-shell')||document;
  kept.set(`${prefix} ${chat.dataset.open||TODAY}`,take(chat));
  const loading=scoped(template('ask-loading'),prefix);
  for(const x of loading.querySelectorAll('label'))x.textContent=x.textContent.replace(longDate(TODAY),longDate(date));
  for(const x of loading.querySelectorAll('textarea[placeholder]'))x.placeholder=x.placeholder.replace(longDate(TODAY),longDate(date));
  put(chat,take(loading));
  chat.dataset.open=date;
  for(const d of screen.querySelectorAll('[data-hook~="date"]'))if(!chat.contains(d))d.textContent=keyDate(date);
  const day=parts(chat).drawers?.querySelector('[data-hook~="day"]');if(day)day.textContent=`${date===TODAY?'Today, ':''}${longDate(date)}`;
  setTimeout(()=>{
   if(signal.aborted||chat.dataset.open!==date)return;
   const back=kept.get(`${prefix} ${date}`);kept.delete(`${prefix} ${date}`);
   put(chat,back||take(scoped(template(`ask-day-${date}`),prefix)));
   if(all)whole(chat);
   after?.(chat);
   marks(chat);size(chat);
   [...chat.querySelectorAll('[data-module~="bubble"]')].pop()?.scrollIntoView({block:'end'});
  },900);
 }

 // A question and its answer.
 const failed=new Set();
 function ask(chat,text){
  const {thread,field}=parts(chat),prefix=prefixOf(chat),key=keyOf(text);
  let session=sessions(chat).pop();
  if(!session){session=parts(template('ask-hello')).thread.querySelector(':scope > section');thread.append(session);}
  const si=cleared(chat).length+sessions(chat).length-1,j=session.querySelectorAll('[data-voice="answer"]').length,base=`${prefix}-${TODAY}-${si}-${j}`;
  // the dentist fails the first time: the question marked, its words back in the box; sent again, retried in place
  const fails=key==='dentist'&&!failed.has(prefix),again=[...session.querySelectorAll('[data-unsent]')].find(b=>b.textContent.includes(text));
  const you=own(template(fails?'ask-unsent':'ask-you'),`${base}-q`);
  you.querySelector('[data-hook~="text"] p').textContent=text;
  if(again)again.replaceWith(you);else session.append(you);
  if(fails){failed.add(prefix);lead(chat,'failed');if(field){field.value=text;field.focus();}return;}
  lead(chat,null);
  const reading=own(template('ask-reading'),`${base}-a`);you.after(reading);
  setTimeout(()=>{
   if(signal.aborted)return;
   const writing=own(template(`ask-w-${key}`),`${base}-a`),ps=[...writing.querySelectorAll('[data-hook~="text"] p')];
   const queue=ps.flatMap(p=>{const nodes=[...p.childNodes];p.replaceChildren();return nodes.map(n=>[p,n]);});
   reading.replaceWith(writing);
   const done=()=>{writing.replaceWith(own(template(`ask-x-${key}`),`${base}-a`));if(key==='cant')lead(chat,'instead');};
   if(reduced()){queue.forEach(([p,n])=>p.append(n));return done();}
   const tick=()=>{if(signal.aborted)return;let n;do{n=queue.shift();if(n)n[0].append(n[1]);}while(n&&n[1].nodeType!==1);queue.length?setTimeout(tick,45):setTimeout(done,260);};
   tick();
  },reduced()?300:1100);
 }
 function fresh(chat,{quiet=false}={}){
  const all=sessions(chat),last=all.at(-1);
  // the open session is still empty: it stays the new one, and the window clears to it
  if(last&&!last.querySelector('[data-module~="bubble"]')){
   const rest=all.slice(0,-1);
   if(rest.length){earlier.set(prefixOf(chat),[...cleared(chat),...rest]);rest.forEach(x=>x.remove());marks(chat);size(chat);}
   if(!quiet){parts(chat).foot.scrollIntoView({block:'end'});parts(chat).field?.focus({preventScroll:true});}
   return;
  }
  if(last){const line=last.querySelector('p span');if(line)line.textContent=line.textContent.replace(/, open$/,'');}
  const gone=[...cleared(chat),...all];earlier.set(prefixOf(chat),gone);all.forEach(x=>x.remove());
  const n=gone.length+1,time=CLOCK[Math.min(n-3,CLOCK.length-1)]||CLOCK[0];
  const s=parts(template('ask-hello')).thread.querySelector(':scope > section');
  s.setAttribute('aria-label',`Session ${n}, ${time}`);s.querySelector('p span').textContent=`Session ${n} · ${time}, open`;
  parts(chat).thread.append(s);lead(chat,'hello');marks(chat);size(chat);
  if(!quiet){parts(chat).foot.scrollIntoView({block:'end'});parts(chat).field?.focus({preventScroll:true});}
 }

 // The chat fills the view below what is above it: the reader's (navbar pages) or the window's.
 function size(chat){
  if(!chat.getClientRects().length)return;
  const reader=chat.closest('[data-place~="reader"]');
  const h=reader?reader.clientHeight-(chat.getBoundingClientRect().top-reader.getBoundingClientRect().top+reader.scrollTop):innerHeight-(chat.getBoundingClientRect().top+scrollY);
  chat.style.setProperty('--aj-s-chat-min',Math.max(0,Math.round(h))+'px');
  chat.style.setProperty('--aj-s-chat-screen',Math.max(320,Math.round(h))+'px');
 }
 const chats=()=>[...document.querySelectorAll('[data-module~="chat"]')];
 const sizer=new ResizeObserver(entries=>entries.forEach(e=>{const c=e.target.matches('[data-module~="chat"]')?e.target:e.target.querySelector(':scope > [data-module~="chat"]');if(c)size(c);}));
 for(const chat of chats()){marks(chat);sizer.observe(chat.closest('[data-place~="reader"]')||chat);}
 signal.addEventListener('abort',()=>sizer.disconnect());
 addEventListener('resize',()=>chats().forEach(size),{signal});
 addEventListener('hashchange',()=>requestAnimationFrame(()=>chats().forEach(size)),{signal});
 // desktop: the window is the chat's scroll; once the screen has settled (two frames), its bottom
 function bottom(){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(signal.aborted)return;
   if(chats().some(c=>c.getClientRects().length&&!c.closest('[data-place~="reader"]')))scrollTo({top:document.scrollingElement.scrollHeight,behavior:'instant'});
  }));
 }
 // Ask opening: the chat in view starts a new session on today (no focus: nothing was pressed); a past day left open
 // goes back to today first. A screen drawn on a past day (a walkthrough's past-day screen), or one loading, is left.
 const home=new Map(chats().map(c=>[c,c.dataset.day==='past'?'past':'today']));
 function opened(){
  for(const chat of chats()){
   if(!chat.getClientRects().length||chat.dataset.state==='loading'||home.get(chat)!=='today')continue;
   if(onToday(chat))fresh(chat,{quiet:true});else open(chat,TODAY,{after:c=>fresh(c,{quiet:true})});
  }
 }
 addEventListener('hashchange',()=>{opened();bottom();},{signal});
 document.fonts.ready.then(bottom);
 opened();requestAnimationFrame(opened);bottom();

 document.addEventListener('chat:ask',event=>ask(event.target,event.detail?.text||''),{signal});
 document.addEventListener('chat:new',event=>fresh(event.target),{signal});
 document.addEventListener('chat:today',event=>open(event.target,TODAY),{signal});
 document.addEventListener('drawers:day',event=>{const chat=chatOf(event.target);if(chat&&event.detail?.date)open(chat,event.detail.date,{all:true});},{signal});
 document.addEventListener('drawers:jump',event=>{const chat=chatOf(event.target);if(chat&&event.detail?.id){if(!parts(chat).thread.querySelector(`[id="${event.detail.id}"]`)){whole(chat);size(chat);}chat.dataset.jump=event.detail.id;}},{signal});
 document.addEventListener('bubble:bookmark',event=>{const chat=chatOf(event.target);if(chat)marks(chat);},{signal});
};
