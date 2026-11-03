// The app's coordinator for the quiet navbar on mobile/tablet (the portable website and walkthroughs).
// Keep native scrolling; the page's reader (rendered at build) turns scroll, wheel, touch and keys into
// the header's data-reading (home at the journal's end or a page's top, away otherwise). The header
// section's own script lays itself out; this keeps the reading positions and the follow-end logic.
window.createJournalNavbar=function({activeScreen,signal,isPositioning}){
 const views=new Map(),positions=new Map();let active;
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches&&document.documentElement.dataset.motionReview!=='play';
 const atHome=view=>view.journal?view.reader.scrollHeight-view.reader.clientHeight-view.reader.scrollTop<24:view.reader.scrollTop<24;
 // A view is remembered once it has been placed: a remembered top before then (fonts settling, a resize) would
 // send a page that reads from its end back to its top.
 function remember(view){
  if(!view?.placed||!view.reader.clientHeight)return;
  positions.set(view.screen.id,{compact:view.compact,top:view.reader.scrollTop,home:atHome(view)});
 }
 // The page fills the view: the window less the page's top and a margin (the whole window on the website).
 function sizePage(view){
  view.page.style.setProperty('--aj-l-page-view-height',document.getElementById('journal')?'100dvh':Math.max(240,innerHeight-Math.max(0,view.page.getBoundingClientRect().top)-24)+'px');
  if(view.header.getClientRects().length)view.composer?.style.setProperty('--aj-c-composer-header-height',view.header.getBoundingClientRect().height+'px');
 }
 function prepare(screen){
  const reader=screen?.querySelector('[data-place~="reader"]'),header=screen?.querySelector('.aj-s-header');
  if(!reader||!header)return null;
  const page=reader.parentElement,composer=page.querySelector(':scope>.aj-c-composer');
  // Today's journal and Ask's chat read from their newest end, above the composer: home is the end.
  const view={screen,page,header,reader,composer,journal:!!composer||!!reader.querySelector(':scope>[data-module~="chat"]'),lastTop:0,animating:false,placing:false,followEnd:false,
   get compact(){return header.dataset.reading==='away';}};
  function reading(compact){header.dataset.reading=compact?'away':'home';}
  view.setCompact=value=>{
   if(value===view.compact)return;
   if(!value&&view.journal&&atHome(view))view.followEnd=true;
   view.animating=!reduced()&&header.getClientRects().length>0;
   reading(value);view.lastTop=reader.scrollTop;remember(view);
  };
  view.place=()=>{
   if(view!==active)return;const saved=positions.get(screen.id);sizePage(view);reading(saved?.compact||false);
   const target=()=>saved?(saved.home&&view.journal?reader.scrollHeight:saved.top):(view.journal?reader.scrollHeight:0);
   // The header lays itself out as the reading changes (a microtask); set the position after it, then once more when the frame has settled.
   // The placement is the app's own scroll: no scroll it causes counts as the reader reading away (until two frames after the last one).
   view.placing=true;
   Promise.resolve().then(()=>{if(view!==active)return;reader.scrollTop=target();view.lastTop=reader.scrollTop;});
   requestAnimationFrame(()=>{if(signal.aborted||view!==active)return;reader.scrollTop=target();view.lastTop=reader.scrollTop;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{view.placing=false;view.placed=true;view.lastTop=reader.scrollTop;}));});
  };
  view.toEnd=()=>{view.followEnd=true;view.setCompact(false);reader.scrollTop=reader.scrollHeight;view.lastTop=reader.scrollTop;if(!view.animating)view.followEnd=false;};
  reader.addEventListener('scroll',()=>{
   const delta=reader.scrollTop-view.lastTop;view.lastTop=reader.scrollTop;
   if(!view.animating&&!view.placing&&!isPositioning()){if(atHome(view))view.setCompact(false);else if(Math.abs(delta)>1)view.setCompact(true);}
   remember(view);window.dispatchEvent(new Event('journal-reader-scroll'));
  },{passive:true,signal});
  function intent(delta){
   if(!delta)return;
   const away=view.journal?delta<0:delta>0;
   if(away&&!atHome(view))view.setCompact(true);else if(!away&&atHome(view))view.setCompact(false);
  }
  reader.addEventListener('wheel',event=>intent(event.deltaY),{passive:true,signal});
  let fingerY;
  reader.addEventListener('touchstart',event=>{fingerY=event.touches[0]?.clientY;},{passive:true,signal});
  reader.addEventListener('touchmove',event=>{const y=event.touches[0]?.clientY;if(y!==undefined&&fingerY!==undefined)intent(fingerY-y);fingerY=y;},{passive:true,signal});
  reader.addEventListener('keydown',event=>{
   if(event.target!==reader)return;
   if(['Home','End','PageUp','PageDown','ArrowUp','ArrowDown'].includes(event.key)){
    if(event.key===(view.journal?'End':'Home'))view.setCompact(false);else intent(['Home','PageUp','ArrowUp'].includes(event.key)?-40:40);
   }
  },{signal});
  header.addEventListener('transitionend',event=>{if(event.target===header&&event.propertyName==='height'){view.animating=false;if(view.followEnd){reader.scrollTop=reader.scrollHeight;view.followEnd=false;}view.lastTop=reader.scrollTop;remember(view);}},{signal});
  // The header says its height after each layout: the composer's cap under it follows.
  header.addEventListener('header:resize',event=>{composer?.style.setProperty('--aj-c-composer-header-height',event.detail.height+'px');},{signal});
  view.size=new ResizeObserver(()=>{if(view.followEnd)reader.scrollTop=reader.scrollHeight;});view.size.observe(header);
  sizePage(view);return view;
 }
 function activate(){
  remember(active);const screen=activeScreen();if(!screen){active=null;return;}
  if(!views.has(screen))views.set(screen,prepare(screen));active=views.get(screen);
  if(active){const current=active;requestAnimationFrame(()=>{if(!signal.aborted&&current===active)current.place();});}
 }
 addEventListener('hashchange',activate,{signal});
 addEventListener('resize',()=>{if(active){remember(active);sizePage(active);}},{signal});
 document.fonts.ready.then(()=>{if(!signal.aborted&&active){remember(active);sizePage(active);}});
 activate();
 return {get active(){return active;},snapshot(){remember(active);return Object.fromEntries(positions);},restore(state){for(const [id,position]of Object.entries(state||{}))positions.set(id,position);active?.place();},destroy(){remember(active);for(const view of views.values())view?.size.disconnect();}};
};
