// Browser-only interaction for the generated review walkthroughs.
// Journal data stays in memory until reload or close; nothing is sent or persisted.
(() => {
  if(new URLSearchParams(location.search).get('fonts')==='portable')document.documentElement.dataset.fontProfile='portable';
  const screens=[...document.querySelectorAll('.screen')];
  const entries=[];
  const previewModels=new Map(),views=new Map();
  let dataRevision=0;
  function activeScreen(){return document.getElementById(location.hash.slice(1))||document.querySelector('.screen.site-current');}
  const entryControlsMarkup=__ENTRY_CONTROLS_MARKUP__;
  const recordingControlsMarkup=__RECORDING_CONTROLS_MARKUP__;
  const fixtureEntries=new Map();
  let nextEntryId=1;
  const recordings=[];
  const micIcon=document.querySelector('.composer .mic')?.innerHTML || '';
  const playIcon=document.querySelector('#recording-kept .play')?.innerHTML || '';
  const pauseIcon='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  let origin='today';
  const globalListeners=new AbortController();
  function measureCompanionHeaders(){
    const screen=activeScreen(),composer=views.get(screen)?.composer;
    if(composer?.classList.contains('writing-companion'))composer.style.setProperty('--journal-header-height',(screen.querySelector('.journal-header')?.getBoundingClientRect().height||0)+'px');
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('.moodrow.ruled-mood .chips button');if(!button)return;
    button.closest('.chips').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  },{signal:globalListeners.signal});
  const memoPlayer=window.createJournalMemoPlayer({playIcon,pauseIcon,feedback});
  let journalPosition=null,journalScrollFrame=0;
  function currentJournal(){
    const screen=activeScreen();
    return views.get(screen)?.composer?screen:null;
  }
  function rememberJournalPosition(){
    const screen=currentJournal();if(!screen||!screen.getClientRects().length)return;
    const anchor=[...screen.querySelectorAll('.entry-item[data-entry-key]')].find(row=>!row.hidden&&row.getBoundingClientRect().bottom>0&&row.getBoundingClientRect().top<innerHeight);
    journalPosition={route:screen.id,atEnd:document.scrollingElement.scrollHeight-innerHeight-scrollY<=32,scrollY,anchor:anchor?{key:anchor.dataset.entryKey,top:anchor.getBoundingClientRect().top,height:anchor.getBoundingClientRect().height}:null};
  }
  // Settle hash navigation and layout first; do not scroll during ordinary edits.
  function positionJournal(position=null){
    cancelAnimationFrame(journalScrollFrame);
    journalScrollFrame=requestAnimationFrame(()=>{
      journalScrollFrame=requestAnimationFrame(()=>{
        journalScrollFrame=0;if(globalListeners.signal.aborted)return;
        const screen=currentJournal();if(!screen||(position&&position.route!==screen.id))return;
        if(position&&!position.atEnd){
          const anchor=[...screen.querySelectorAll('.entry-item[data-entry-key]')].find(row=>row.dataset.entryKey===position.anchor?.key&&!row.hidden);
          // Reflow changes line count; retain the same part of the entry in view.
          const offset=anchor&&position.anchor.top<0&&position.anchor.height?position.anchor.top*anchor.getBoundingClientRect().height/position.anchor.height:position.anchor?.top;
          scrollTo({top:anchor?scrollY+anchor.getBoundingClientRect().top-offset:position.scrollY,behavior:'instant'});
        }else scrollTo({top:document.scrollingElement.scrollHeight,behavior:'instant'});
        rememberJournalPosition();
      });
    });
  }
  window.addEventListener('scroll',rememberJournalPosition,{passive:true,signal:globalListeners.signal});

  function entryKey(text,time){let hash=2166136261;for(const char of text+'|'+time)hash=Math.imul(hash^char.charCodeAt(0),16777619);return 'fixture-'+(hash>>>0).toString(36);}
  function entryModel(row){return previewModels.get(row.dataset.entryKey)||fixtureEntries.get(row.dataset.entryKey);}
  function entryBody(row){return row.matches('.recrow')?row.querySelector('.body .ccol'):row.querySelector('.ccol');}
  function attachEntryControls(row,model){
    row.classList.add('entry-item');row.dataset.entryKey=model.key;
    const body=entryBody(row);
    if(!body.querySelector(':scope > .entry-actions'))body.insertAdjacentHTML('beforeend',model.kind==='recording'?recordingControlsMarkup:entryControlsMarkup);
    updateEntryRow(row,model);
  }
  function updateEntryRow(row,model){
    row.hidden=!!model.deleted;
    const note=row.nextElementSibling;if(note?.classList.contains('said'))note.hidden=!!model.deleted;
    const prose=row.querySelector('.prose');if(prose.textContent!==model.text)prose.textContent=model.text;
    const body=entryBody(row),controls=body.querySelector('.entry-actions');
    let mark=body.querySelector(':scope > .mark');
    if(model.excluded&&!mark){mark=document.createElement('span');mark.className='mark';mark.textContent='Out of memory';controls.before(mark);}
    if(!model.excluded)mark?.remove();
    const memory=controls.querySelector('[data-entry-action="memory"]');
    memory.setAttribute('aria-pressed',String(!model.excluded));
    const dropdown=controls.querySelector('.entry-memory-dropdown');dropdown.dataset.excluded=String(model.excluded);
    dropdown.querySelector('.memory-state').textContent=model.excluded?'Out of memory':'In memory';
    dropdown.querySelector('summary').setAttribute('aria-label',(model.kind==='recording'?'Voice memo':'Entry')+' memory settings: '+(model.excluded?'out of memory':'in memory'));
  }
  function updateFixtureEntries(screen=activeScreen()){
    for(const row of views.get(screen)?.fixtures||[]){const model=entryModel(row);if(model)updateEntryRow(row,model);}
  }
  for(const controls of document.querySelectorAll('.entry-actions')){
    const row=controls.closest('.srow,.recrow');if(!row)continue;
    const text=row.querySelector('.prose').textContent.replace(/\s+/g,' ').trim(),time=row.querySelector('.tcol')?.textContent.trim()||'';
    const voice=row.matches('.recrow'),key=entryKey(text,time)+(voice?'-voice':'');
    if(!fixtureEntries.has(key))fixtureEntries.set(key,{key,text,kind:voice?'recording':'entry',textKind:voice&&text==='Voice memo'?'label':'transcript',excluded:!!row.querySelector('.mark'),deleted:false});
    attachEntryControls(row,fixtureEntries.get(key));
  }
  for(const screen of screens)views.set(screen,{
    composer:screen.querySelector('.composer'),mood:screen.querySelector('.moodrow'),
    empty:screen.querySelector('.empty'),fixtures:[...screen.querySelectorAll('.entry-item')],
    rows:new Map(),list:null,version:-1
  });
  function commitEntries(){dataRevision++;renderPreview();}
  function closeEntryEditor(row){
    row.querySelector('.entry-editor')?.remove();row.querySelector('.entry-confirm')?.remove();
    row.querySelector('.prose').hidden=false;row.querySelector('.entry-actions').hidden=false;
  }
  function focusEntry(key,action='edit'){
    const screen=document.getElementById(location.hash.slice(1));
    const row=screen?.querySelector('.entry-item[data-entry-key="'+key+'"]:not([hidden])');
    (row?.querySelector('[data-entry-action="'+action+'"]')||screen?.querySelector('.prototype-input')||screen?.querySelector('.entry-icon'))?.focus();
  }
  function editEntry(row,draft){
    const model=entryModel(row);if(!model||model.kind==='recording')return;closeEntryEditor(row);
    row.querySelector('.prose').hidden=true;row.querySelector('.entry-actions').hidden=true;
    const form=document.createElement('form');form.className='entry-editor';form.noValidate=true;
    const label=document.createElement('label');label.textContent='Entry text';
    const input=document.createElement('textarea');input.className='field';input.rows=5;input.required=true;input.value=draft??model.text;label.append(input);
    const error=document.createElement('p');error.className='auth-help';error.hidden=true;error.setAttribute('role','alert');
    const actions=document.createElement('div');actions.className='auth-actions';
    const save=document.createElement('button');save.className='btn solid';save.type='submit';save.textContent='Save changes';
    const cancel=document.createElement('button');cancel.className='btn quiet';cancel.type='button';cancel.textContent='Leave as it was';
    actions.append(save,cancel);form.append(label,error,actions);row.querySelector('.entry-actions').before(form);
    input.addEventListener('input',()=>{error.hidden=true;input.removeAttribute('aria-invalid');});
    cancel.addEventListener('click',()=>{closeEntryEditor(row);focusEntry(model.key);});
    form.addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();
      if(!input.value.trim()){error.textContent='An entry cannot be empty. Write something before saving.';error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;}
      model.text=input.value;closeEntryEditor(row);commitEntries();focusEntry(model.key);
    });
    input.focus();input.setSelectionRange(input.value.length,input.value.length);
  }
  function confirmEntryDelete(row){
    const model=entryModel(row);if(!model)return;closeEntryEditor(row);row.querySelector('.entry-actions').hidden=true;
    const voice=model.kind==='recording';
    const confirm=document.createElement('div');confirm.className='entry-confirm';confirm.setAttribute('role','group');confirm.setAttribute('aria-label',voice?'Delete this voice memo?':'Delete this entry?');
    const text=document.createElement('p');text.textContent=(voice?'Delete this voice memo?':'Delete this entry?')+' This cannot be undone.';
    const actions=document.createElement('div');actions.className='auth-actions';
    const remove=document.createElement('button');remove.className='btn quiet';remove.type='button';remove.textContent=voice?'Delete voice memo':'Delete entry';
    const keep=document.createElement('button');keep.className='btn solid';keep.type='button';keep.textContent=voice?'Keep voice memo':'Keep entry';
    actions.append(remove,keep);confirm.append(text,actions);row.querySelector('.entry-actions').before(confirm);
    keep.addEventListener('click',()=>{closeEntryEditor(row);focusEntry(model.key,'delete');});
    remove.addEventListener('click',()=>{
      model.deleted=true;previewModels.delete(model.key);closeEntryEditor(row);
      const index=entries.indexOf(model);if(index>=0)entries.splice(index,1);
      const memoIndex=recordings.indexOf(model);
      if(memoIndex>=0){
        if(memoPlayer.current?.item===model)memoPlayer.stop();
        URL.revokeObjectURL(model.url);recordings.splice(memoIndex,1);
        const kept=document.getElementById('recording-kept');
        if(kept?.querySelector('.play')?.dataset.prototypeRecordingId===String(model.id)){
          kept.querySelector('.prototype-download')?.remove();
          if(recordings.length)showRecording(recordings.at(-1));
          else{kept.querySelector('.recrow').hidden=true;feedback(kept.querySelector('.stack'),'This voice memo was deleted from the preview.');}
        }
      }
      commitEntries();focusEntry(model.key);
    });
    keep.focus();
  }
  function closeEntryMenus(except){for(const menu of document.querySelectorAll('.entry-memory-dropdown[open]'))if(menu!==except)menu.open=false;}
  document.addEventListener('toggle',event=>{
    const menu=event.target;if(!menu.classList?.contains('entry-memory-dropdown'))return;
    if(menu.open)closeEntryMenus(menu);
  },{capture:true,signal:globalListeners.signal});
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-entry-action]');
    if(!event.target.closest('.entry-memory-dropdown'))closeEntryMenus();
    if(!action)return;const row=action.closest('.entry-item'),model=row&&entryModel(row);if(!model)return;
    event.preventDefault();
    if(action.dataset.entryAction==='edit')editEntry(row);
    if(action.dataset.entryAction==='delete')confirmEntryDelete(row);
    if(action.dataset.entryAction==='memory'){
      model.excluded=!model.excluded;commitEntries();
      const screen=document.getElementById(location.hash.slice(1)),dropdown=screen?.querySelector('.entry-item[data-entry-key="'+model.key+'"] .entry-memory-dropdown');
      if(dropdown){dropdown.open=true;dropdown.querySelector('[data-entry-action="memory"]').focus();}
    }
  },{signal:globalListeners.signal});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const menu=event.target.closest('.entry-memory-dropdown');if(menu?.open){menu.open=false;menu.querySelector('summary').focus();event.preventDefault();}
  },{signal:globalListeners.signal});

  // Approved account forms share the portable preview's validation and eye controls.
  const authForms=[...document.querySelectorAll('form[data-auth-form]')];
  function clearAuthError(input){
    input.removeAttribute('aria-invalid');
    const error=document.getElementById(input.id+'-error');if(error)error.hidden=true;
    const hint=input.closest('.auth-field')?.querySelector('[data-password-hint]');
    if(hint){hint.hidden=false;input.setAttribute('aria-describedby',hint.id);}
  }
  function authError(input,message){
    input.setAttribute('aria-invalid','true');
    const error=document.getElementById(input.id+'-error');
    error.textContent=message;error.hidden=false;input.setAttribute('aria-describedby',error.id);
    const hint=input.closest('.auth-field').querySelector('[data-password-hint]');if(hint)hint.hidden=true;
  }
  for(const form of authForms){
    const email=form.querySelector('[data-auth-input="email"]'),password=form.querySelector('[data-auth-input="password"]'),confirmation=form.querySelector('[data-auth-input="confirmation"]');
    const inputs=[email,password,confirmation].filter(Boolean);
    for(const input of inputs)input.addEventListener('input',()=>{clearAuthError(input);if(input===password&&confirmation)clearAuthError(confirmation);});
    form.addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();inputs.forEach(clearAuthError);
      if(!email.value.trim()||!email.validity.valid)authError(email,'Enter a valid email address, such as name@example.com.');
      if(password.value.length<8)authError(password,'Enter a password with at least 8 characters.');
      if(confirmation){
        if(!confirmation.value)authError(confirmation,'Enter your password again.');
        else if(confirmation.value!==password.value)authError(confirmation,'The passwords do not match. Enter the same password in both fields.');
      }
      const invalid=form.querySelector('[aria-invalid="true"]');if(invalid){invalid.focus();return;}
      const target=form.getAttribute('action').split('#')[1];
      if(document.getElementById(target))location.hash=target;
    });
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button.password-toggle');if(!button)return;
    const input=document.getElementById(button.getAttribute('aria-controls'));if(!input)return;
    const show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));
    button.setAttribute('aria-label',(show?'Hide ':'Show ')+(input.dataset.authInput==='confirmation'?'confirmed password':'password'));
  },{signal:globalListeners.signal});
  let previousAuthRoute=location.hash.slice(1)||'auth-login';
  window.addEventListener('hashchange',()=>{
    const route=location.hash.slice(1),previous=authForms.find(form=>form.closest('.screen').id===previousAuthRoute),next=authForms.find(form=>form.closest('.screen').id===route);
    if(previous&&previous!==next){
      if(next)next.querySelector('[data-auth-input="email"]').value=previous.querySelector('[data-auth-input="email"]').value;
      for(const input of previous.querySelectorAll('input')){clearAuthError(input);if(input.dataset.authInput!=='email'){input.value='';input.type='password';}}
      for(const toggle of previous.querySelectorAll('.password-toggle')){toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label',toggle.getAttribute('aria-controls').includes('confirm-password')?'Show confirmed password':'Show password');}
    }
    previousAuthRoute=route;
  },{signal:globalListeners.signal});

  const caption=document.querySelector('.motion-review-status');
  if(caption){
    const line=document.createElement('span');
    line.textContent=' Text and recordings in this preview disappear if this page is reloaded or closed.';
    caption.append(line);
  }

  function feedback(container,message){
    let line=container.querySelector(':scope > .prototype-feedback');
    if(!line){
      line=document.createElement('p');
      line.className='auth-help prototype-feedback';
      line.setAttribute('role','status');
      container.append(line);
    }
    line.textContent=message;
  }
  function clock(date){return date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});}
  function duration(ms){const seconds=Math.max(0,Math.round(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
  function mode(button,hasText){
    button.className=hasText?'send':'mic';
    button.innerHTML=hasText?'Save':micIcon;
    button.setAttribute('aria-label',hasText?'Save entry':'Record voice memo');
  }
  function sizeField(field){
    field.style.height='auto';
    const content=field.scrollHeight;
    field.style.height=`${Math.min(content,160)}px`;
    field.style.overflowY=content>160?'auto':'hidden';
  }
  function makeEntryRow(entry){
    const row=document.createElement('div');row.className='srow';
    const time=document.createElement('div');time.className='tcol';time.textContent=clock(entry.at);
    const body=document.createElement('div');body.className='ccol';
    const prose=document.createElement('p');prose.className='prose';prose.textContent=entry.text;
    body.append(prose);
    if(entry.excluded){const mark=document.createElement('span');mark.className='mark';mark.textContent='Out of memory';body.append(mark);}
    row.append(time,body);attachEntryControls(row,entry);return row;
  }
  function makeRecordingRow(item){
    const row=document.createElement('div');row.className='recrow';row.dataset.liveMemo=String(item.id);
    const head=document.createElement('div');head.className='head dated';
    const timeCol=document.createElement('div');timeCol.className='tcol';
    const time=document.createElement('time');time.dateTime=item.at.toISOString();time.textContent=clock(item.at);timeCol.append(time);
    const body=document.createElement('div');body.className='ccol';
    const button=document.createElement('button');button.className='play';button.type='button';button.innerHTML=playIcon;
    button.dataset.prototypeRecordingId=String(item.id);button.setAttribute('aria-label','Play voice memo');
    body.append(button);body.insertAdjacentHTML('beforeend',window.journalMemoMarkup(item));head.append(timeCol,body);row.append(head);
    row.insertAdjacentHTML('beforeend','<div class="body"><div class="tcol"></div><div class="ccol"><p class="prose"></p></div></div>');
    attachEntryControls(row,item);
    return row;
  }
  function renderPreview(screen=activeScreen()){
    const view=views.get(screen);if(!view||view.version===dataRevision)return;
    updateFixtureEntries(screen);
    const {composer,mood,empty,rows}=view;
    if(composer){
      const items=[...entries,...recordings].sort((a,b)=>a.at-b.at);
      if(empty)empty.hidden=!!items.length;
      if(!items.length){view.list?.remove();view.list=null;rows.clear();}
      else{
        if(!view.list){
          view.list=document.createElement('section');
          view.list.className=mood?'prototype-list in-journal':'sheet prototype-list';
          view.list.setAttribute('aria-label','Items added in this preview');
          if(mood)mood.before(view.list);else composer.before(view.list);
        }
        const keys=new Set(items.map(item=>item.key));
        for(const [key,row] of rows)if(!keys.has(key)){row.remove();rows.delete(key);}
        let cursor=view.list.firstElementChild;
        for(const item of items){
          let row=rows.get(item.key);
          if(!row){row=item.kind==='entry'?makeEntryRow(item):makeRecordingRow(item);rows.set(item.key,row);}
          else updateEntryRow(row,item);
          if(row!==cursor)view.list.insertBefore(row,cursor);
          cursor=row.nextElementSibling;
        }
      }
    }
    view.version=dataRevision;
  }
  for(const screen of screens){
    const composer=screen.querySelector('.composer');if(!composer)continue;
    const oldField=composer.querySelector('.crow .field');
    const button=composer.querySelector('.crow button');
    const option=composer.querySelector('.composer-tools .opt');
    if(!oldField||!button)continue;
    const field=document.createElement('textarea');
    field.className='field prototype-input';field.rows=1;field.placeholder='Add to today';field.setAttribute('aria-label','Add to today');
    field.value=oldField.classList.contains('placeholder')?'':oldField.textContent.trim();
    oldField.replaceWith(field);sizeField(field);mode(button,!!field.value.trim());
    field.addEventListener('input',()=>{mode(button,!!field.value.trim());sizeField(field);});
    option?.addEventListener('click',()=>option.setAttribute('aria-pressed',String(option.getAttribute('aria-pressed')!=='true')));
    button.addEventListener('click',()=>{
      const text=field.value.trim();
      if(!text){origin=screen.id;memoPlayer.stop();location.hash='talk';recorder.open();return;}
      const item={kind:'entry',key:'preview-'+Date.now()+'-'+nextEntryId++,text,at:new Date(),excluded:option?.getAttribute('aria-pressed')==='true'};
      entries.push(item);previewModels.set(item.key,item);commitEntries();field.value='';sizeField(field);mode(button,false);
      option?.setAttribute('aria-pressed','false');
      feedback(composer,'Entry added to this preview. It disappears on reload.');
      field.focus({preventScroll:true});positionJournal();
    });
  }

  function fitVisibleComposers(){
    const field=views.get(activeScreen())?.composer?.querySelector('.prototype-input');if(field)sizeField(field);
  }
  function fitJournalFonts(){fitVisibleComposers();if(journalPosition?.atEnd)positionJournal(journalPosition);}
  document.fonts?.addEventListener('loadingdone',fitJournalFonts,{signal:globalListeners.signal});
  document.fonts?.ready.then(()=>{if(!globalListeners.signal.aborted)fitJournalFonts();});
  window.addEventListener('hashchange',fitVisibleComposers,{signal:globalListeners.signal});
  window.addEventListener('resize',fitVisibleComposers,{signal:globalListeners.signal});

  const recorder=window.createJournalRecorder({
    screen:document.getElementById('talk'),signal:globalListeners.signal,
    onReturn(){location.hash=origin;},
    onKeep(capture,destination){
      const item={kind:'recording',id:Date.now()+Math.random(),key:'memo-'+Date.now()+'-'+nextEntryId++,text:'Voice memo',textKind:'label',excluded:false,at:capture.at,duration:capture.duration,waveform:capture.waveform,blob:capture.blob,url:URL.createObjectURL(capture.blob)};
      recordings.push(item);previewModels.set(item.key,item);commitEntries();showRecording(item);
      location.hash=destination||origin;
      requestAnimationFrame(()=>{const row=document.getElementById(destination||origin)?.querySelector('.recrow[data-live-memo="'+item.id+'"]');if(row){row.tabIndex=-1;row.setAttribute('aria-label','Voice memo kept on today’s page');row.focus({preventScroll:true});}positionJournal();});
    }
  });
  function showRecording(item){
    const kept=document.getElementById('recording-kept');
    const old=kept.querySelector('.recrow');const row=makeRecordingRow(item);old?.replaceWith(row);
    const view=views.get(kept);if(view){view.fixtures=[row];view.version=-1;}
    const time=kept.querySelector('time');if(time){time.dateTime=item.at.toISOString();time.textContent=clock(item.at);}
    const title=kept.querySelector('.keybox .v');if(title)title.textContent=item.at.toLocaleString([], {weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
    const label=kept.querySelector('.dur');if(label)label.textContent=duration(item.duration);
    const play=kept.querySelector('.play');if(play){play.dataset.prototypeRecordingId=String(item.id);play.setAttribute('aria-label','Play voice memo');}
    feedback(kept.querySelector('.stack'),'Kept in this preview until reload. Download it to keep a copy.');
    let download=kept.querySelector('.prototype-download');
    if(!download){download=document.createElement('a');download.className='btn quiet prototype-download';download.textContent='Download recording';kept.querySelector('.stack .row').append(download);}
    const extension=item.blob.type.includes('mp4')?'m4a':item.blob.type.includes('ogg')?'ogg':item.blob.type.includes('webm')?'webm':'bin';
    download.href=item.url;download.download=`journal-memo-${item.at.toISOString().replaceAll(':','-')}.${extension}`;
  }

  window.__journalPreview={
    get recordingActive(){return recorder.active;},
    async snapshot(){
      const drafts={};
      for(const screen of screens){
        const field=screen.querySelector('.composer .prototype-input');if(!field)continue;
        drafts[screen.id]={text:field.value,excluded:screen.querySelector('.composer .opt')?.getAttribute('aria-pressed')==='true'};
      }
      return {
        entries:entries.map(x=>({key:x.key,text:x.text,at:x.at.toISOString(),excluded:x.excluded})),
        fixtureEntries:[...fixtureEntries.values()].map(item=>({...item})),
        entryDrafts:[...document.querySelectorAll('.entry-item .entry-editor')].map(form=>({key:form.closest('.entry-item').dataset.entryKey,route:form.closest('.screen').id,text:form.querySelector('textarea').value})),
        recordings:recordings.map(x=>({id:x.id,key:x.key,text:x.text,textKind:x.textKind,excluded:x.excluded,at:x.at.toISOString(),duration:x.duration,waveform:x.waveform,blob:x.blob})),
        drafts,origin,journalPosition,
        moods:Object.fromEntries(screens.filter(s=>s.querySelector('.moodrow.ruled-mood')).map(s=>[s.id,s.querySelector('.moodrow button[aria-pressed="true"]')?.dataset.mood||null]))
      };
    },
    restore(state){
      if(!state)return;
      for(const item of recordings)URL.revokeObjectURL(item.url);
      entries.splice(0,entries.length,...state.entries.map(x=>({kind:'entry',key:x.key,text:x.text,at:new Date(x.at),excluded:x.excluded})));
      for(const item of state.fixtureEntries||[]){const existing=fixtureEntries.get(item.key);if(existing)Object.assign(existing,item);}
      recordings.splice(0,recordings.length,...state.recordings.map(x=>({...x,kind:'recording',at:new Date(x.at),url:URL.createObjectURL(x.blob)})));
      origin=state.origin||'today';
      for(const [id,value] of Object.entries(state.moods||{})){
        document.getElementById(id)?.querySelectorAll('.moodrow.ruled-mood .chips button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mood===value)));
      }
      for(const screen of screens){
        const draft=state.drafts[screen.id];if(!draft)continue;
        const field=screen.querySelector('.composer .prototype-input');
        const button=screen.querySelector('.composer .crow button');
        if(field&&button){field.value=draft.text;sizeField(field);mode(button,!!field.value.trim());}
        screen.querySelector('.composer .opt')?.setAttribute('aria-pressed',String(!!draft.excluded));
      }
      previewModels.clear();for(const item of [...entries,...recordings])previewModels.set(item.key,item);
      commitEntries();
      for(const draft of state.entryDrafts||[]){const draftScreen=document.getElementById(draft.route);renderPreview(draftScreen);const row=draftScreen?.querySelector('.entry-item[data-entry-key="'+draft.key+'"]');if(row&&!row.hidden)editEntry(row,draft.text);}
      if(recordings.length)showRecording(recordings.at(-1));
      positionJournal(state.journalPosition);
    },
    destroy(){
      globalListeners.abort();
      cancelAnimationFrame(journalScrollFrame);
      recorder.destroy();memoPlayer.stop();
      for(const item of recordings)URL.revokeObjectURL(item.url);
    }
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest('button.play');if(!button)return;
    const item=recordings.find(x=>String(x.id)===button.dataset.prototypeRecordingId);
    if(!item){feedback(button.closest('.recrow'),'This example has no audio file. Record a memo to play it here.');return;}
    memoPlayer.play(item,button);
  },{signal:globalListeners.signal});
  function recordingRoute(){
    const route=location.hash.slice(1);
    const aliases=['microphone-before','microphone-denied','microphone-missing','s-mic-permission','s-mic-denied','s-mic-missing','s-recording-paused'];
    if(aliases.includes(route)){location.hash='talk';recorder.open();return;}
    if(route==='talk')recorder.open();else if(recorder.active)recorder.cancel(false);
  }
  window.addEventListener('hashchange',()=>{renderPreview();measureCompanionHeaders();closeEntryMenus();memoPlayer.stop();recordingRoute();if(currentJournal())positionJournal();},{signal:globalListeners.signal});
  window.addEventListener('resize',()=>{measureCompanionHeaders();if(journalPosition&&!globalListeners.signal.aborted)positionJournal(journalPosition);},{signal:globalListeners.signal});
  document.addEventListener('visibilitychange',()=>memoPlayer.visibility(),{signal:globalListeners.signal});
  window.addEventListener('pagehide',()=>{recorder.destroy();memoPlayer.stop();for(const item of recordings)URL.revokeObjectURL(item.url);},{signal:globalListeners.signal});
  renderPreview();
  recordingRoute();
  measureCompanionHeaders();
  document.fonts.ready.then(()=>{if(!globalListeners.signal.aborted)measureCompanionHeaders();});
  if(currentJournal())positionJournal();
})();
