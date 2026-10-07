// Main recorder and measured playback. No network, monitoring or persistent storage.
(() => {
 'use strict';
 const reduced=()=>!document.documentElement.hasAttribute('data-motion-review')&&matchMedia('(prefers-reduced-motion:reduce)').matches;
 const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 const summary=levels=>Array.from({length:128},(_,i)=>{
  let peak=0;const end=Math.max(Math.floor(i*levels.length/128)+1,Math.floor((i+1)*levels.length/128));
  for(let j=Math.floor(i*levels.length/128);j<end;j++)peak=Math.max(peak,levels[j]||0);return peak;
 });
 window.createJournalRecorder=({screen,onKeep,onReturn,signal})=>{
  const app=screen.querySelector('.compact-recorder-app'),$=s=>app.querySelector(s);
  const bars=[...$('[data-live-wave]').querySelectorAll('g')];
  const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',resumeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
  let phase='idle',serial=0,stream=null,session=null,starting=false,elapsed=0,started=0,at=null,timer=null,disposed=false;
  const setPhase=p=>{phase=p;app.dataset.recorderPhase=p;};
  const release=()=>{stream?.getTracks().forEach(t=>t.stop());stream=null;};
  const idle=()=>window.dispatchEvent(new Event('journal-recorder-idle'));
  const tick=()=>{$('[data-clock]').textContent=format((elapsed+(phase==='recording'?performance.now()-started:0))/1000);};
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
  function open(){
   if(phase!=='idle')return;
   elapsed=0;starting=false;at=null;setPhase('ready');tick();
   bars.forEach(bar=>bar.style.transform='scaleY(.015)');
   $('.start-controls').hidden=false;$('.transport').hidden=true;
   $('[data-recorder="keep"]').disabled=false;$('[data-recorder="pause"]').disabled=false;
   $('[data-back-note]').textContent='No recording has started.';$('[data-axis-end]').textContent='Not started';
   const date=new Date();
   $('.recorder-mast .keybox .v').textContent=date.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short',year:'2-digit'});
   $('[data-session-date]').textContent=date.toLocaleString([],{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
   request();
   const heading=$('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});window.scrollTo(0,0);
  }
  async function start(){
   if(phase!=='ready'||starting||app.dataset.microphone!=='granted')return;
   starting=true;const request=serial;
   const capture=new window.JournalAudioSession(stream,(_level,levels)=>{
    if(document.hidden||reduced()||!$('[data-live-wave]').getClientRects().length)return;
    const recent=levels.slice(-128),offset=128-recent.length;
    bars.forEach((bar,i)=>bar.style.transform=`scaleY(${Math.max(.015,recent[i-offset]||0).toFixed(4)})`);
   });session=capture;$('[data-recorder="start"]').disabled=true;
   try{
    if(!await capture.start()||request!==serial||phase!=='ready'||disposed){capture.cancel();return;}
    at=new Date();started=performance.now();setPhase('recording');timer=setInterval(tick,100);
    $('.start-controls').hidden=true;$('.transport').hidden=false;
    $('[data-session-state]').textContent='Listening';$('[data-axis-end]').textContent='Now';
    $('[data-back-note]').textContent='Leaving this page stops and keeps your memo.';
    $('[data-recorder="pause"]').innerHTML=pauseIcon+'<span>Pause</span>';$('[data-recording-hint]').textContent='Take your time. Pauses belong here too.';
   }catch{
    capture.cancel();if(request===serial&&phase==='ready'){session=null;release();status('unavailable','Recording could not start. Check your microphone, then try again.');}
   }finally{starting=false;}
  }
  function pause(){
   if(phase==='recording'){session.pause();elapsed+=performance.now()-started;setPhase('paused');$('[data-session-state]').textContent='Paused';$('[data-recorder="pause"]').innerHTML=resumeIcon+'<span>Resume</span>';$('[data-recording-hint]').textContent='Your memo is paused. Resume whenever you are ready.';}
   else if(phase==='paused'){session.resume();started=performance.now();setPhase('recording');$('[data-session-state]').textContent='Listening';$('[data-recorder="pause"]').innerHTML=pauseIcon+'<span>Pause</span>';$('[data-recording-hint]').textContent='Take your time. Pauses belong here too.';}
   tick();
  }
  async function keep(destination){
   if(!['recording','paused'].includes(phase))return;
   if(phase==='recording')elapsed+=performance.now()-started;
   clearInterval(timer);setPhase('saving');$('[data-session-state]').textContent='Keeping';
   $('[data-recorder="keep"]').disabled=true;$('[data-recorder="pause"]').disabled=true;
   try{
    const result=await session.stop();session=null;release();
    if(disposed)return;
    setPhase('idle');onKeep({...result,waveform:summary(result.levels),duration:Math.max(.001,elapsed),at},destination);idle();
   }catch{
    session=null;release();if(disposed)return;
    setPhase('idle');open();status('unavailable','No audio could be kept. Check your microphone, then try again.');
   }
  }
  function cancel(returnToJournal=true){
   if(phase==='saving')return;
   if(phase==='recording'||phase==='paused'){keep(returnToJournal?undefined:location.hash.slice(1));return;}
   serial++;session?.cancel();session=null;release();clearInterval(timer);setPhase('idle');
   if(returnToJournal)onReturn();idle();
  }
  app.addEventListener('click',event=>{
   const button=event.target.closest('[data-recorder]');if(!button)return;event.preventDefault();
   if(button.disabled)return;
   const action=button.dataset.recorder;
   if(action==='start')start();if(action==='retry'&&phase==='ready')request();if(action==='pause')pause();if(action==='keep')keep();if(action==='back')cancel();
  },{signal});
  return {open,cancel,get active(){return phase!=='idle';},get phase(){return phase;},destroy(){disposed=true;serial++;session?.cancel();session=null;release();clearInterval(timer);setPhase('idle');}};
 };

 let unique=0;
 window.journalMemoMarkup=item=>{
  const id='journal-memo-shape-'+(++unique),clip='journal-memo-clip-'+unique;
  const shape=Array.from({length:128},(_,i)=>{const h=160*Math.max(.015,item.waveform?.[i]||0);return `<rect x="${i*8+2}" y="${90-h/2}" width="4" height="${h}" fill="currentColor"/>`;}).join('');
  const total=format(Math.ceil(item.duration/1000));
  return `<svg class="journal-memo-wave" viewBox="0 0 1024 180" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><g id="${id}">${shape}</g><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><rect class="memo-progress-clip" width="1024" height="180" style="transform:scaleX(0)"/></clipPath></defs><use href="#${id}" class="memo-wave-base"/><use href="#${id}" class="memo-wave-played" clip-path="url(#${clip})"/></svg><span class="journal-memo-clock" style="--timer-ch:${Math.max(8,total.length+2)}" aria-label="Playback time"><span data-memo-elapsed>0:00</span><span class="memo-total">/ <span data-memo-total>${total}</span></span></span>`;
 };
 window.createJournalMemoPlayer=({playIcon,pauseIcon,feedback})=>{
  let current=null,frame=0;
  const rows=item=>[...document.querySelectorAll('.recrow[data-live-memo="'+item.id+'"]')];
  const length=()=>Number.isFinite(current?.audio.duration)&&current.audio.duration>0?current.audio.duration:(current?.item.duration||1000)/1000;
  function time(row,position,total,complete=false){row.querySelector('[data-memo-elapsed]').textContent=format(complete?Math.ceil(total):Math.min(position,total));row.querySelector('[data-memo-total]').textContent=format(Math.ceil(total));}
  function draw(){
   frame=0;if(!current||document.hidden)return;
   const total=length();
   for(const row of rows(current.item)){if(!row.getClientRects().length)continue;time(row,current.audio.currentTime,total);if(!reduced())row.querySelector('.memo-progress-clip').style.transform=`scaleX(${Math.min(1,current.audio.currentTime/total).toFixed(6)})`;}
   frame=requestAnimationFrame(draw);
  }
  function stop(complete=false){
   cancelAnimationFrame(frame);frame=0;if(!current)return;
   for(const row of rows(current.item)){
    const clip=row.querySelector('.memo-progress-clip');time(row,current.audio.currentTime,length(),complete);
    if(complete){row.dataset.playback='complete';clip.style.transform='scaleX(1)';}
    else{const position=new DOMMatrixReadOnly(getComputedStyle(clip).transform).m11;clip.style.transition='none';clip.style.transform=`scaleX(${position})`;}
    row.classList.remove('is-playing');const button=row.querySelector('.play');button.innerHTML=playIcon;button.setAttribute('aria-label','Play voice memo');
   }
   current.audio.pause();current.audio.removeAttribute('src');current.audio.load();current=null;
  }
  async function play(item,button){
   if(current?.item===item){stop();return;}stop();
   const audio=new Audio(item.url);current={item,audio};
   for(const row of rows(item)){
    delete row.dataset.playback;row.classList.add('is-playing');
    const clip=row.querySelector('.memo-progress-clip');clip.style.transition='none';clip.style.transform='scaleX(0)';getComputedStyle(clip).transform;clip.style.removeProperty('transition');
    time(row,0,item.duration/1000);const control=row.querySelector('.play');control.innerHTML=pauseIcon;control.setAttribute('aria-label','Stop voice memo playback');
   }
   const failed=()=>{if(current?.audio!==audio)return;stop();feedback(button.closest('.recrow'),'This recording could not be played in this browser.');};
   audio.addEventListener('loadedmetadata',()=>{if(current?.audio===audio&&Number.isFinite(audio.duration)&&audio.duration>0)item.duration=audio.duration*1000;});
   audio.addEventListener('playing',()=>{if(current?.audio===audio&&!frame)frame=requestAnimationFrame(draw);});
   audio.addEventListener('ended',()=>{if(current?.audio===audio)stop(true);});audio.addEventListener('error',failed);
   try{await audio.play();if(item.deleted&&current?.audio===audio)stop();}catch{failed();}
  }

  return {play,stop,get current(){return current;},visibility(){if(!document.hidden&&current&&!frame)frame=requestAnimationFrame(draw);}};
 };
})();
