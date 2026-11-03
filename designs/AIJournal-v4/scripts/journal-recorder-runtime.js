// Main recorder and memo playback. The waveform is a fixed decorative shape (v4 B6): nothing measures the sound. No network, monitoring or persistent storage.
// v4 C5: leaving the recorder pauses the memo and keeps it as the one draft (in the page here; the product keeps it on
// the device); the mic and Today's Continue line open it again. While paused the field is the player over the memo so
// far, and Discard asks before it throws the memo away. A memo is dated when it is kept.
(() => {
 'use strict';
 const reduced=()=>!document.documentElement.hasAttribute('data-motion-review')&&matchMedia('(prefers-reduced-motion:reduce)').matches;
 const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 window.createJournalRecorder=({screen,onKeep,onReturn,onDraft,signal})=>{
  const app=screen.querySelector('.aj-s-recorder'),$=s=>app.querySelector(s),$$=s=>[...app.querySelectorAll(s)];
  const bars=[...$('[data-live-wave]').querySelectorAll('g')];
  const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',resumeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
  // The player's glyphs (system/content/icons.mjs PLAY and PAUSE).
  const playGlyph='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',pauseGlyph='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14"/><rect x="13.5" y="5" width="4" height="14"/></svg>';
  const copy={back:'Leaving keeps your memo as a draft.',listening:'Take your time. Pauses belong here too.',paused:'Your memo is paused. Play it back, record more, or keep it.'};
  let phase='idle',serial=0,stream=null,session=null,starting=false,elapsed=0,started=0,timer=null,disposed=false,parked=false,loads=0;
  const track=$('[data-hook~="track"]'),confirm=$('[data-hook~="confirm"]'),playButton=$('[data-recorder="play"]');
  const setPhase=p=>{phase=p;app.dataset.recorderPhase=p;};
  const release=()=>{stream?.getTracks().forEach(t=>t.stop());stream=null;};
  const idle=()=>window.dispatchEvent(new Event('journal-recorder-idle'));
  const tick=()=>{$('[data-clock]').textContent=format((elapsed+(phase==='recording'?performance.now()-started:0))/1000);};
  // Today's draft line follows the draft: its length while one is kept, nothing once it is kept, resumed or discarded.
  const draftChanged=()=>onDraft?.(parked&&phase==='paused'?{length:format(elapsed/1000)}:null);
  const rtl=()=>getComputedStyle(app).direction==='rtl';

  // The player: the place in seconds over the memo so far. A clock moves it (so it moves the same with or without
  // sound); the audio follows the clock on play and seek.
  const player={audio:null,url:'',pos:0,total:0,playing:false,from:0,since:0,frame:0};
  function drawPlayer(){
   const p=player;
   app.style.setProperty('--aj-s-recorder-at',String(p.total?Math.min(1,p.pos/p.total):0));
   $('[data-position]').textContent=format(p.pos);
   track.setAttribute('aria-valuenow',String(Math.round(p.pos)));track.setAttribute('aria-valuetext',`${format(p.pos)} of ${format(p.total)}`);
   if(p.playing)app.dataset.playback='playing';else if(p.pos>0)app.dataset.playback='started';else delete app.dataset.playback;
   playButton.innerHTML=p.playing?pauseGlyph:playGlyph;playButton.setAttribute('aria-label',p.playing?'Pause playback':'Play back');
  }
  function halt(){const p=player;p.playing=false;cancelAnimationFrame(p.frame);p.audio?.pause();}
  function frame(){
   const p=player;if(!p.playing)return;
   p.pos=Math.min(p.total,p.from+(performance.now()-p.since)/1000);
   if(p.pos>=p.total)halt();else p.frame=requestAnimationFrame(frame);
   drawPlayer();
  }
  function play(){
   const p=player;if(phase!=='paused'||!p.total)return;
   if(p.pos>=p.total)p.pos=0;
   p.playing=true;p.from=p.pos;p.since=performance.now();
   if(p.audio){try{p.audio.currentTime=p.pos;}catch{}p.audio.play().catch(()=>{});}
   p.frame=requestAnimationFrame(frame);drawPlayer();
  }
  function seek(seconds){
   const p=player;if(phase!=='paused')return;
   p.pos=Math.max(0,Math.min(p.total,seconds));
   if(p.playing){p.from=p.pos;p.since=performance.now();}
   if(p.audio){try{p.audio.currentTime=p.pos;}catch{}}
   drawPlayer();
  }
  // Paused: the track becomes a slider over the memo so far, and the audio is fetched from the recorder.
  async function load(){
   unload();const ticket=++loads;
   player.total=elapsed/1000;
   $$('[data-length]').forEach(n=>n.textContent=format(player.total));$('[data-axis-end]').textContent=format(player.total);
   for(const [name,value] of Object.entries({role:'slider',tabindex:'0','aria-label':'Position in the memo','aria-valuemin':'0','aria-valuemax':String(Math.round(player.total))}))track.setAttribute(name,value);
   drawPlayer();
   const blob=await session.snapshot();
   if(ticket!==loads||phase!=='paused'||disposed)return;
   player.url=URL.createObjectURL(blob);player.audio=new Audio(player.url);player.audio.preload='auto';
  }
  function unload(){
   halt();loads++;
   if(player.url)URL.revokeObjectURL(player.url);
   Object.assign(player,{audio:null,url:'',pos:0,total:0});
   delete app.dataset.playback;app.style.removeProperty('--aj-s-recorder-at');
   for(const name of ['role','tabindex','aria-label','aria-valuemin','aria-valuemax','aria-valuenow','aria-valuetext'])track.removeAttribute(name);
  }
  // Discard asks first: the question takes the transport's place.
  function ask(){if(phase!=='paused')return;halt();drawPlayer();confirm.hidden=false;confirm.querySelector('[data-recorder="discard-no"]').focus({preventScroll:true});}
  function unask(focus=false){if(confirm.hidden)return;confirm.hidden=true;if(focus)$('[data-recorder="discard"]').focus({preventScroll:true});}

  function status(state,message=''){
   app.dataset.microphone=state;$('[data-recorder="start"]').disabled=state!=='granted';
   $('[data-microphone-status]').textContent=message;$('[data-microphone-status]').hidden=!message;
   $('[data-recorder="retry"]').hidden=['granted','pending'].includes(state);
   $('[data-session-state]').textContent=state==='granted'?'Ready':state==='pending'?'Microphone access':state==='denied'?'Microphone blocked':'Microphone unavailable';
  }
  async function request(){
   release();const request=++serial;
   status('pending','Waiting for microphone access. Respond to your browser’s permission prompt.');
   if(!navigator.mediaDevices?.getUserMedia){status('unavailable','Microphone access is unavailable. Open this preview from localhost or HTTPS, then try again.');return;}
   if(!window.MediaRecorder||!(window.AudioContext||window.webkitAudioContext)){status('unavailable','Live audio recording is unavailable in this browser. Try a current browser, or write instead.');return;}
   try{
    const input=await navigator.mediaDevices.getUserMedia({audio:true});
    if(request!==serial||phase!=='ready'||disposed){input.getTracks().forEach(t=>t.stop());return;}
    stream=input;
    input.getAudioTracks().forEach(track=>{track.enabled=false;track.addEventListener('ended',()=>{
     if(stream!==input)return;
     if(phase==='recording'||phase==='paused')keep();
     else if(phase==='ready'){release();status('unavailable','Microphone disconnected. Connect it, then try again.');}
    });});status('granted');
   }catch(error){
    if(request!==serial||phase!=='ready'||disposed)return;
    if(['NotAllowedError','PermissionDeniedError','SecurityError'].includes(error.name))status('denied','Microphone access is blocked. Allow it in your browser settings, then try again.');
    else if(['NotFoundError','DevicesNotFoundError'].includes(error.name))status('missing','No microphone found. Connect a microphone, then try again.');
    else status('unavailable','The microphone is unavailable. Close other apps using it, then try again.');
   }
  }
  const focusHeading=()=>{const heading=$('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});window.scrollTo(0,0);};
  function open(){
   // The draft (or a memo still under way): the recorder as it was left, paused, saying it is the draft.
   if(phase==='paused'||phase==='recording'){
    if(parked){app.dataset.draft='';$('[data-session-state]').textContent='Paused · draft';}
    focusHeading();return;
   }
   if(phase!=='idle')return;
   elapsed=0;starting=false;setPhase('ready');tick();
   bars.forEach(bar=>bar.style.transform='scaleY(.015)');
   $('[data-hook~="start"]').hidden=false;$('[data-hook~="transport"]').hidden=true;confirm.hidden=true;
   $('[data-recorder="keep"]').disabled=false;$('[data-recorder="pause"]').disabled=false;
   $('[data-back-note]').textContent='No recording has started.';$('[data-axis-end]').textContent='Not started';
   // The day only, never a time: a memo is dated when it is kept (v4 C5).
   const date=new Date();
   $('.aj-c-keybox [data-hook~="date"]').textContent=date.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short',year:'2-digit'});
   $('[data-session-date]').textContent=date.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'});
   request();
   focusHeading();
  }
  async function start(){
   if(phase!=='ready'||starting||app.dataset.microphone!=='granted')return;
   starting=true;const request=serial;
   const capture=new window.JournalAudioSession(stream);session=capture;$('[data-recorder="start"]').disabled=true;
   try{
    if(!await capture.start()||request!==serial||phase!=='ready'||disposed){capture.cancel();return;}
    started=performance.now();setPhase('recording');timer=setInterval(tick,100);
    // The trace rises once to the memo's fixed shape (recorder.css: the wave's own timing); it holds still after.
    bars.forEach(bar=>bar.style.transform=`scaleY(${bar.dataset.level||.015})`);
    $('[data-hook~="start"]').hidden=true;$('[data-hook~="transport"]').hidden=false;
    $('[data-session-state]').textContent='Listening';$('[data-axis-end]').textContent='Now';
    $('[data-back-note]').textContent=copy.back;
    $('[data-recorder="pause"]').innerHTML=pauseIcon+'<span>Pause</span>';$('[data-recording-hint]').textContent=copy.listening;
   }catch{
    capture.cancel();if(request===serial&&phase==='ready'){session=null;release();status('unavailable','Recording could not start. Check your microphone, then try again.');}
   }finally{starting=false;}
  }
  function pause(){
   if(phase==='recording'){
    session.pause();elapsed+=performance.now()-started;setPhase('paused');
    $('[data-session-state]').textContent='Paused';$('[data-recorder="pause"]').innerHTML=resumeIcon+'<span>Resume</span>';$('[data-recording-hint]').textContent=copy.paused;
    load();
   }else if(phase==='paused'){
    // Resume stops playback and records on from the end; the memo is no longer a draft.
    unask();unload();parked=false;delete app.dataset.draft;draftChanged();
    session.resume();started=performance.now();setPhase('recording');
    $('[data-session-state]').textContent='Listening';$('[data-axis-end]').textContent='Now';
    $('[data-recorder="pause"]').innerHTML=pauseIcon+'<span>Pause</span>';$('[data-recording-hint]').textContent=copy.listening;
   }
   tick();
  }
  async function keep(destination){
   if(!['recording','paused'].includes(phase))return;
   if(phase==='recording')elapsed+=performance.now()-started;
   unask();unload();
   clearInterval(timer);setPhase('saving');$('[data-session-state]').textContent='Keeping';
   $('[data-recorder="keep"]').disabled=true;$('[data-recorder="pause"]').disabled=true;
   // The memo's time is the moment it is kept.
   const at=new Date();
   try{
    const result=await session.stop();session=null;release();
    if(disposed)return;
    parked=false;delete app.dataset.draft;
    setPhase('idle');draftChanged();onKeep({...result,duration:Math.max(.001,elapsed),at},destination);idle();
   }catch{
    session=null;release();parked=false;delete app.dataset.draft;if(disposed)return;
    setPhase('idle');draftChanged();open();status('unavailable','No audio could be kept. Check your microphone, then try again.');
   }
  }
  // Leaving (back, a destination, closing): a memo under way pauses and stays as the draft; nothing is kept or lost.
  function park(){
   if(phase==='recording')pause();
   if(phase!=='paused')return;
   unask();halt();drawPlayer();
   parked=true;app.dataset.draft='';$('[data-session-state]').textContent='Paused · draft';draftChanged();
  }
  function discard(){
   if(phase!=='paused')return;
   unask();unload();serial++;session?.cancel();session=null;release();clearInterval(timer);
   parked=false;delete app.dataset.draft;setPhase('idle');draftChanged();onReturn();idle();
  }
  function cancel(returnToJournal=true){
   if(phase==='saving')return;
   if(phase==='recording'||phase==='paused'){park();if(returnToJournal)onReturn();return;}
   serial++;session?.cancel();session=null;release();clearInterval(timer);setPhase('idle');
   if(returnToJournal)onReturn();idle();
  }
  app.addEventListener('click',event=>{
   const button=event.target.closest('[data-recorder]');if(!button)return;event.preventDefault();
   if(button.disabled)return;
   const action=button.dataset.recorder;
   if(action==='start')start();if(action==='retry'&&phase==='ready')request();if(action==='pause')pause();if(action==='keep')keep();if(action==='back')cancel();
   if(action==='play'){if(player.playing){halt();drawPlayer();}else play();}
   if(action==='skip')seek(player.pos+Number(button.dataset.skip));
   if(action==='discard')ask();if(action==='discard-no')unask(true);if(action==='discard-yes')discard();
  },{signal});
  confirm.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();unask(true);}},{signal});
  // The track: click or drag anywhere on it, or its keys (right to left, the arrows follow the memo's direction).
  const place=event=>{const r=track.getBoundingClientRect(),x=(event.clientX-r.left)/r.width;return (rtl()?1-x:x)*player.total;};
  track.addEventListener('pointerdown',event=>{if(phase!=='paused')return;try{track.setPointerCapture(event.pointerId);}catch{}seek(place(event));},{signal});
  track.addEventListener('pointermove',event=>{if(track.hasPointerCapture(event.pointerId))seek(place(event));},{signal});
  track.addEventListener('keydown',event=>{
   if(phase!=='paused')return;
   const forward=rtl()?'ArrowLeft':'ArrowRight',back=rtl()?'ArrowRight':'ArrowLeft';
   const step={[forward]:5,ArrowUp:5,[back]:-5,ArrowDown:-5}[event.key];
   if(step){event.preventDefault();seek(player.pos+step);}
   else if(event.key==='Home'){event.preventDefault();seek(0);}
   else if(event.key==='End'){event.preventDefault();seek(player.total);}
   else if(event.key===' '||event.key==='Enter'){event.preventDefault();if(player.playing){halt();drawPlayer();}else play();}
  },{signal});
  return {open,cancel,get active(){return phase!=='idle';},get draft(){return parked&&phase==='paused';},get phase(){return phase;},destroy(){disposed=true;serial++;unload();session?.cancel();session=null;release();clearInterval(timer);setPhase('idle');}};
 };

 let unique=0;
 // A kept memo's row: a clone of the template recrow-live (recrow, play, the text paragraph), its hooks
 // filled. Its waveform is the wave module's (the memo's phrase at a fixed pitch).
 window.journalMemoRow=item=>{
  const n=++unique,holder=document.createElement('template');
  holder.innerHTML=document.querySelector('template[data-template="recrow-live"]').innerHTML;
  const row=holder.content.firstElementChild;
  const total=format(Math.ceil(item.duration/1000));
  row.dataset.liveMemo=String(item.id);row.style.setProperty('--aj-c-recrow-timer-ch',String(Math.max(8,total.length+2)));
  row.querySelector('[data-hook~="total"]').textContent=total;
  return row;
 };
 window.createJournalMemoPlayer=({playIcon,pauseIcon,feedback})=>{
  let current=null,frame=0;
  const rows=item=>[...document.querySelectorAll('.aj-c-recrow[data-live-memo="'+item.id+'"]')];
  const progress=(row,value)=>row.style.setProperty('--aj-c-recrow-progress',String(value));
  const clipOf=row=>row.querySelector('[data-hook~="progress"]');
  const length=()=>Number.isFinite(current?.audio.duration)&&current.audio.duration>0?current.audio.duration:(current?.item.duration||1000)/1000;
  function time(row,position,total,complete=false){row.querySelector('[data-hook~="elapsed"]').textContent=format(complete?Math.ceil(total):Math.min(position,total));row.querySelector('[data-hook~="total"]').textContent=format(Math.ceil(total));}
  function draw(){
   frame=0;if(!current||document.hidden)return;
   const total=length();
   for(const row of rows(current.item)){if(!row.getClientRects().length)continue;time(row,current.audio.currentTime,total);if(!reduced())progress(row,Math.min(1,current.audio.currentTime/total).toFixed(6));}
   frame=requestAnimationFrame(draw);
  }
  function stop(complete=false){
   cancelAnimationFrame(frame);frame=0;if(!current)return;
   for(const row of rows(current.item)){
    const clip=clipOf(row);time(row,current.audio.currentTime,length(),complete);
    if(complete){row.dataset.playback='complete';progress(row,1);}
    else{const position=1-parseFloat(getComputedStyle(clip).clipPath.split(/\s+/)[1])/100;clip.style.transition='none';progress(row,position);delete row.dataset.playback;}
    const button=row.querySelector('.aj-c-play');button.innerHTML=playIcon;button.setAttribute('aria-label','Play voice memo');
   }
   current.audio.pause();current.audio.removeAttribute('src');current.audio.load();current=null;
  }
  async function play(item,button){
   if(current?.item===item){stop();return;}stop();
   const audio=new Audio(item.url);current={item,audio};
   for(const row of rows(item)){
    row.dataset.playback='playing';
    const clip=clipOf(row);clip.style.transition='none';progress(row,0);getComputedStyle(clip).clipPath;clip.style.removeProperty('transition');
    time(row,0,item.duration/1000);const control=row.querySelector('.aj-c-play');control.innerHTML=pauseIcon;control.setAttribute('aria-label','Stop voice memo playback');
   }
   const failed=()=>{if(current?.audio!==audio)return;stop();feedback(button.closest('.aj-c-recrow'),'This recording could not be played in this browser.');};
   audio.addEventListener('loadedmetadata',()=>{if(current?.audio===audio&&Number.isFinite(audio.duration)&&audio.duration>0)item.duration=audio.duration*1000;});
   audio.addEventListener('playing',()=>{if(current?.audio===audio&&!frame)frame=requestAnimationFrame(draw);});
   audio.addEventListener('ended',()=>{if(current?.audio===audio)stop(true);});audio.addEventListener('error',failed);
   try{await audio.play();if(item.deleted&&current?.audio===audio)stop();}catch{failed();}
  }

  return {play,stop,get current(){return current;},visibility(){if(!document.hidden&&current&&!frame)frame=requestAnimationFrame(draw);}};
 };
})();
