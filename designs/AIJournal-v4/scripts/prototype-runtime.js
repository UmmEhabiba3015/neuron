// Browser-only interaction for the generated review walkthroughs.
// Journal data stays in memory until reload or close; nothing is sent or persisted.
(() => {
  if(new URLSearchParams(location.search).get('fonts')==='portable')document.documentElement.dataset.fontProfile='portable';
  const screens=[...document.querySelectorAll('.screen')];
  const entries=[];
  const previewModels=new Map(),views=new Map();
  let dataRevision=0;
  function activeScreen(){return document.getElementById(location.hash.slice(1))||document.querySelector('.screen.site-current');}
  const fixtureEntries=new Map();
  let nextEntryId=1;
  const recordings=[];
  const micIcon=document.querySelector('.aj-c-composer [data-hook~="mic"]')?.innerHTML || '';
  const playIcon=document.querySelector('#recording-kept .aj-c-play')?.innerHTML || '';
  const pauseIcon='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  let origin='today';
  const globalListeners=new AbortController();
  document.addEventListener('click',event=>{
    const button=event.target.closest('.aj-c-moodrow[data-form="ruled"] [data-hook~="chips"] [data-mood]');if(!button)return;
    button.closest('[data-hook~="chips"]').querySelectorAll('[data-mood]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  },{signal:globalListeners.signal});
  const memoPlayer=window.createJournalMemoPlayer({playIcon,pauseIcon,feedback});
  let journalPosition=null,journalScrollFrame=0,positioningJournal=false;
  function currentJournal(){
    const screen=activeScreen();
    return views.get(screen)?.composer?screen:null;
  }
  function rememberJournalPosition(){
    if(positioningJournal)return;
    const screen=currentJournal();if(!screen||!screen.getClientRects().length)return;
    const reader=window.__journalNavbar?.active?.screen===screen?window.__journalNavbar.active.reader:document.scrollingElement,top=reader===document.scrollingElement?0:reader.getBoundingClientRect().top,height=reader===document.scrollingElement?innerHeight:reader.clientHeight;
    const anchor=[...screen.querySelectorAll('[data-entry-key]')].find(row=>!row.hidden&&row.getBoundingClientRect().bottom>top&&row.getBoundingClientRect().top<top+height);
    journalPosition={route:screen.id,atEnd:reader.scrollHeight-height-reader.scrollTop<=32,scrollY:reader.scrollTop,anchor:anchor?{key:anchor.dataset.entryKey,top:anchor.getBoundingClientRect().top-top,height:anchor.getBoundingClientRect().height}:null};
  }
  // Settle hash navigation and layout first; do not scroll during ordinary edits.
  function positionJournal(position=null){
    positioningJournal=true;if(position)journalPosition=position;
    cancelAnimationFrame(journalScrollFrame);
    journalScrollFrame=requestAnimationFrame(()=>{
      journalScrollFrame=requestAnimationFrame(()=>{
        journalScrollFrame=0;if(globalListeners.signal.aborted)return;
        const screen=currentJournal();if(!screen||(position&&position.route!==screen.id)){positioningJournal=false;return;}
        const navView=window.__journalNavbar?.active?.screen===screen?window.__journalNavbar.active:null,reader=navView?.reader||document.scrollingElement,top=navView?reader.getBoundingClientRect().top:0;
        if(position&&!position.atEnd){
          const anchor=[...screen.querySelectorAll('[data-entry-key]')].find(row=>row.dataset.entryKey===position.anchor?.key&&!row.hidden);
          // Reflow changes line count; retain the same part of the entry in view.
          const offset=anchor&&position.anchor.top<0&&position.anchor.height?position.anchor.top*anchor.getBoundingClientRect().height/position.anchor.height:position.anchor?.top;
          reader.scrollTop=anchor?reader.scrollTop+anchor.getBoundingClientRect().top-top-offset:position.scrollY;
        }else if(navView)navView.toEnd();else scrollTo({top:document.scrollingElement.scrollHeight,behavior:'instant'});
        positioningJournal=false;rememberJournalPosition();
      });
    });
  }
  window.addEventListener('scroll',rememberJournalPosition,{passive:true,signal:globalListeners.signal});
  window.addEventListener('journal-reader-scroll',rememberJournalPosition,{signal:globalListeners.signal});

  function entryKey(text,time){let hash=2166136261;for(const char of text+'|'+time)hash=Math.imul(hash^char.charCodeAt(0),16777619);return 'fixture-'+(hash>>>0).toString(36);}
  function entryModel(row){return previewModels.get(row.dataset.entryKey)||fixtureEntries.get(row.dataset.entryKey);}
  // Markup the runtime creates is cloned from the templates the build renders from the modules.
  function template(name){return document.querySelector('template[data-template="'+name+'"]').content.firstElementChild.cloneNode(true);}
  function textOf(row){return row.querySelector('.aj-c-text');}
  function entryBody(row){return textOf(row).parentElement;}
  function toolsOf(row){return row.querySelector('.aj-c-entry-actions[data-place~="tools"]');}
  function formOf(row,form){return row.querySelector('.aj-c-entry-actions[data-form="'+form+'"]');}
  function attachEntryControls(row,model){
    row.dataset.entryKey=model.key;
    const body=entryBody(row);
    if(!body.querySelector(':scope > .aj-c-entry-actions[data-place~="tools"]'))body.append(template(model.kind==='recording'?'entry-actions-recording':'entry-actions-entry'));
    updateEntryRow(row,model);
  }
  function updateEntryRow(row,model){
    row.hidden=!!model.deleted;
    const note=row.nextElementSibling;if(note?.classList.contains('aj-c-said'))note.hidden=!!model.deleted;
    const prose=textOf(row);if(prose.textContent!==model.text)prose.textContent=model.text;
    const body=entryBody(row),controls=toolsOf(row);
    let mark=body.querySelector(':scope > .aj-c-mark');
    if(model.excluded&&!mark){mark=template('mark-out');controls.before(mark);if(!mark.previousElementSibling?.matches('.aj-c-text'))mark.removeAttribute('data-place');}
    if(!model.excluded)mark?.remove();
    // Memory is one way: only an entry kept out has the part (its tag and Use in memory); once in, it is gone.
    if(!model.excluded)controls.querySelector('[data-excluded]')?.remove();
  }
  function updateFixtureEntries(screen=activeScreen()){
    for(const row of views.get(screen)?.fixtures||[]){const model=entryModel(row);if(model)updateEntryRow(row,model);}
  }
  for(const controls of document.querySelectorAll('.aj-c-entry-actions[data-place~="tools"]')){
    const row=controls.closest('.aj-c-srow,.aj-c-recrow');if(!row)continue;
    const words=textOf(row),lead=row.firstElementChild;
    const text=words.textContent.replace(/\s+/g,' ').trim(),time=row.querySelector('time')?.textContent.trim()??(row.matches('.aj-c-srow')&&!lead.contains(words)?lead.textContent.trim():'');
    const voice=row.matches('.aj-c-recrow'),key=entryKey(text,time)+(voice?'-voice':'');
    if(!fixtureEntries.has(key))fixtureEntries.set(key,{key,text,kind:voice?'recording':'entry',textKind:voice&&text==='Voice memo'?'label':'transcript',excluded:!!row.querySelector('.aj-c-mark'),deleted:false});
    attachEntryControls(row,fixtureEntries.get(key));
  }
  for(const screen of screens)views.set(screen,{
    composer:screen.querySelector('.aj-c-composer:not([data-form="chat"])'),mood:screen.querySelector('.aj-c-moodrow'),record:screen.querySelector('.aj-s-record'),
    empty:screen.querySelector('.aj-c-empty'),fixtures:[...screen.querySelectorAll('[data-entry-key]')],
    rows:new Map(),list:null,version:-1
  });
  function commitEntries(){dataRevision++;renderPreview();}
  function closeEntryEditor(row){
    formOf(row,'editor')?.remove();formOf(row,'confirm')?.remove();
    textOf(row).hidden=false;toolsOf(row).hidden=false;
  }
  function focusEntry(key,action='edit',options){
    const screen=document.getElementById(location.hash.slice(1));
    const row=screen?.querySelector('[data-entry-key="'+key+'"]:not([hidden])');
    (row?.querySelector('[data-entry-action="'+action+'"]')||screen?.querySelector('[data-hook~="input"]')||screen?.querySelector('[data-entry-action]'))?.focus(options);
  }
  function editEntry(row,draft){
    const model=entryModel(row);if(!model||model.kind==='recording')return;closeEntryEditor(row);
    textOf(row).hidden=true;toolsOf(row).hidden=true;
    const form=template('entry-actions-editor'),input=form.querySelector('[data-hook~="editor-field"]'),error=form.querySelector('[role="alert"]');
    const cancel=form.querySelector('.aj-c-button[data-grade="quiet"]');
    input.value=draft??model.text;toolsOf(row).before(form);
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
    const model=entryModel(row);if(!model)return;closeEntryEditor(row);toolsOf(row).hidden=true;
    const voice=model.kind==='recording',question=voice?'Delete this voice memo?':'Delete this entry?';
    const confirm=template('entry-actions-confirm'),remove=confirm.querySelector('.aj-c-button[data-grade="quiet"]'),keep=confirm.querySelector('.aj-c-button[data-grade="solid"]');
    confirm.setAttribute('aria-label',question);confirm.querySelector('p').textContent=question+' This cannot be undone.';
    remove.textContent=voice?'Delete voice memo':'Delete entry';keep.textContent=voice?'Keep voice memo':'Keep entry';
    toolsOf(row).before(confirm);
    keep.addEventListener('click',()=>{closeEntryEditor(row);focusEntry(model.key,'delete');});
    remove.addEventListener('click',()=>{
      model.deleted=true;previewModels.delete(model.key);closeEntryEditor(row);
      const index=entries.indexOf(model);if(index>=0)entries.splice(index,1);
      const memoIndex=recordings.indexOf(model);
      if(memoIndex>=0){
        if(memoPlayer.current?.item===model)memoPlayer.stop();
        URL.revokeObjectURL(model.url);recordings.splice(memoIndex,1);
        const kept=document.getElementById('recording-kept');
        if(kept?.querySelector('.aj-c-play')?.dataset.prototypeRecordingId===String(model.id)){
          kept.querySelector('.prototype-download')?.remove();
          if(recordings.length)showRecording(recordings.at(-1));
          else{kept.querySelector('.aj-c-recrow').hidden=true;feedback(kept.querySelector('.aj-c-stack'),'This voice memo was deleted from the preview.');}
        }
      }
      commitEntries();focusEntry(model.key);
    });
    keep.focus();
  }
  // Use in memory can't be undone, so it asks once, as delete does.
  function confirmEntryMemory(row){
    const model=entryModel(row);if(!model)return;closeEntryEditor(row);toolsOf(row).hidden=true;
    const voice=model.kind==='recording',question=voice?'Use this voice memo in memory?':'Use this entry in memory?';
    const confirm=template('entry-actions-confirm'),use=confirm.querySelector('.aj-c-button[data-grade="quiet"]'),keep=confirm.querySelector('.aj-c-button[data-grade="solid"]');
    confirm.setAttribute('aria-label',question);confirm.querySelector('p').textContent=question+' Once it is in, it cannot be taken out.';
    use.textContent='Use in memory';keep.textContent='Keep it out';
    toolsOf(row).before(confirm);
    // Memory never moves the reader: focus without scrolling.
    keep.addEventListener('click',()=>{closeEntryEditor(row);row.querySelector('details[data-excluded] summary')?.focus({preventScroll:true});});
    use.addEventListener('click',()=>{model.excluded=false;closeEntryEditor(row);commitEntries();focusEntry(model.key,voice?'delete':'edit',{preventScroll:true});});
    keep.focus({preventScroll:true});
  }
  function closeEntryMenus(except){for(const menu of document.querySelectorAll('details[data-excluded][open]'))if(menu!==except)menu.open=false;}
  document.addEventListener('toggle',event=>{
    const menu=event.target;if(!menu.matches?.('details[data-excluded]'))return;
    if(menu.open)closeEntryMenus(menu);
  },{capture:true,signal:globalListeners.signal});
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-entry-action]');
    if(!event.target.closest('details[data-excluded]'))closeEntryMenus();
    if(!action)return;const row=action.closest('[data-entry-key]'),model=row&&entryModel(row);if(!model)return;
    event.preventDefault();
    if(action.dataset.entryAction==='edit')editEntry(row);
    if(action.dataset.entryAction==='delete')confirmEntryDelete(row);
    if(action.dataset.entryAction==='memory'&&model.excluded){closeEntryMenus();confirmEntryMemory(row);}
  },{signal:globalListeners.signal});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const menu=event.target.closest('details[data-excluded]');if(menu?.open){menu.open=false;menu.querySelector('summary').focus();event.preventDefault();}
  },{signal:globalListeners.signal});

  // Approved account forms share the portable preview's validation and eye controls.
  const authForms=[...document.querySelectorAll('form[data-auth-form]')];
  function clearAuthError(input){
    input.removeAttribute('aria-invalid');
    const error=document.getElementById(input.id+'-error');if(error)error.hidden=true;
    const hint=input.dataset.authInput==='password'?input.form.querySelector('[data-password-hint]'):null;
    if(hint){hint.hidden=false;input.setAttribute('aria-describedby',hint.id);}
  }
  function authError(input,message){
    input.setAttribute('aria-invalid','true');
    const error=document.getElementById(input.id+'-error');
    error.textContent=message;error.hidden=false;input.setAttribute('aria-describedby',error.id);
    const hint=input.dataset.authInput==='password'?input.form.querySelector('[data-password-hint]'):null;if(hint)hint.hidden=true;
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
    const button=event.target.closest('.aj-c-button[data-form="toggle"]');if(!button)return;
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
      for(const toggle of previous.querySelectorAll('.aj-c-button[data-form="toggle"]')){toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label',toggle.getAttribute('aria-controls').includes('confirm-password')?'Show confirmed password':'Show password');}
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
      line.className='aj-c-text prototype-feedback';line.dataset.form='help';
      line.setAttribute('role','status');
      container.append(line);
    }
    line.textContent=message;
  }
  function clock(date){return date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});}
  function duration(ms){const seconds=Math.max(0,Math.round(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
  function mode(button,hasText){
    button.className=hasText?'aj-c-send':'aj-c-composer__mic';
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
    const row=template('srow-entry'),time=row.querySelector('time');
    time.dateTime=entry.at.toISOString();time.textContent=clock(entry.at);
    attachEntryControls(row,entry);return row;
  }
  function makeRecordingRow(item){
    const row=window.journalMemoRow(item);
    const time=row.querySelector('time');time.dateTime=item.at.toISOString();time.textContent=clock(item.at);
    const button=row.querySelector('.aj-c-play');button.innerHTML=playIcon;button.dataset.prototypeRecordingId=String(item.id);
    attachEntryControls(row,item);
    return row;
  }
  // Timeline (v4 C1): what the preview adds today joins today's day in the record (its newest), after the day's own
  // rows, as written: an entry as the record's later writing of a day (no date, the lede, its mark out of memory),
  // a recording as the kept memo's row with its tools, its time cell left empty. They follow edits and deletes.
  function updateTimelineRow(row,model){
    if(model.kind==='recording'){updateEntryRow(row,model);return;}
    row.hidden=!!model.deleted;
    const prose=textOf(row);if(prose.textContent!==model.text)prose.textContent=model.text;
    let mark=row.querySelector('.aj-c-mark');
    if(model.excluded&&!mark){mark=template('timeline-mark');prose.after(mark);}
    if(!model.excluded)mark?.remove();
  }
  function makeTimelineRow(model,day){
    const row=model.kind==='entry'?template('timeline-dayrow'):makeRecordingRow(model);
    if(model.kind==='recording')row.querySelector('time')?.remove();
    row.dataset.day=day;row.dataset.entryKey=model.key;updateTimelineRow(row,model);return row;
  }
  function renderTimeline(view){
    const dated=[...view.record.querySelectorAll('[data-day]')],ours=new Set(view.rows.values());
    const own=dated.filter(row=>!ours.has(row));if(!own.length)return;
    const day=own[0].dataset.day,items=[...entries,...recordings].sort((a,b)=>a.at-b.at),keys=new Set(items.map(item=>item.key));
    for(const [key,row] of view.rows)if(!keys.has(key)){row.remove();view.rows.delete(key);}
    let cursor=own.filter(row=>row.dataset.day===day).pop();
    for(const item of items){
      let row=view.rows.get(item.key);
      if(!row){row=makeTimelineRow(item,day);view.rows.set(item.key,row);}
      else updateTimelineRow(row,item);
      if(cursor.nextElementSibling!==row)cursor.after(row);
      cursor=row;
    }
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
          if(mood){view.list=document.createElement('section');view.list.className='prototype-list in-journal';view.list.setAttribute('aria-label','Items added in this preview');}
          else{view.list=template('sheet-list');view.list.classList.add('prototype-list');}
          const reader=screen.querySelector('[data-place~="reader"]');
          if(mood)mood.before(view.list);else if(reader)reader.append(view.list);else composer.before(view.list);
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
    if(view.record)renderTimeline(view);
    view.version=dataRevision;
  }
  for(const screen of screens){
    const composer=screen.querySelector('.aj-c-composer:not([data-form="chat"])');if(!composer)continue;
    const oldField=composer.querySelector('[data-hook~="row"] [data-hook~="input"]');
    const button=composer.querySelector('[data-hook~="row"] button');
    const option=composer.querySelector('[data-hook~="tools"] [data-hook~="memory"]');
    if(!oldField||!button)continue;
    const field=document.querySelector('template[data-template="composer-input"]').content.firstElementChild.cloneNode(true);field.classList.add('prototype-input');
    field.value=oldField.textContent.trim()===field.placeholder?'':oldField.textContent.trim();
    oldField.replaceWith(field);sizeField(field);mode(button,!!field.value.trim());
    field.addEventListener('input',()=>{mode(button,!!field.value.trim());sizeField(field);});
    option?.addEventListener('click',()=>option.setAttribute('aria-pressed',String(option.getAttribute('aria-pressed')!=='true')));
    button.addEventListener('click',()=>{
      const text=field.value.trim();
      // the mic: the recorder starts with this composer's Keep this out of memory
      if(!text){origin=screen.id;memoPlayer.stop();if(!recorder.draft)keepOut()?.setAttribute('aria-pressed',option?.getAttribute('aria-pressed')==='true'?'true':'false');location.hash='talk';recorder.open();return;}
      const item={kind:'entry',key:'preview-'+Date.now()+'-'+nextEntryId++,text,at:new Date(),excluded:option?.getAttribute('aria-pressed')==='true'};
      entries.push(item);previewModels.set(item.key,item);commitEntries();field.value='';sizeField(field);mode(button,false);
      option?.setAttribute('aria-pressed','false');
      feedback(composer,'Entry added to this preview. It disappears on reload.');
      field.focus({preventScroll:true});positionJournal();
    });
  }

  function fitVisibleComposers(){
    const field=views.get(activeScreen())?.composer?.querySelector('[data-hook~="input"]');if(field&&'value' in field)sizeField(field);
  }
  function fitJournalFonts(){fitVisibleComposers();if(!positioningJournal&&!window.__journalNavbar?.active?.compact&&journalPosition?.atEnd)positionJournal(journalPosition);}
  document.fonts?.addEventListener('loadingdone',fitJournalFonts,{signal:globalListeners.signal});
  document.fonts?.ready.then(()=>{if(!globalListeners.signal.aborted)fitJournalFonts();});
  window.addEventListener('hashchange',fitVisibleComposers,{signal:globalListeners.signal});
  window.addEventListener('resize',fitVisibleComposers,{signal:globalListeners.signal});

  const navbar=window.createJournalNavbar({activeScreen,signal:globalListeners.signal,isPositioning:()=>positioningJournal});window.__journalNavbar=navbar;window.createJournalTimeline({signal:globalListeners.signal});window.createJournalAsk({signal:globalListeners.signal});window.createJournalReflection({signal:globalListeners.signal});
  // The recorder's Keep this out of memory: the kept memo takes it, then it clears for the next memo.
  const keepOut=()=>document.querySelector('#talk .aj-s-recorder [data-hook~="memory"]');
  keepOut()?.addEventListener('click',event=>{const o=event.currentTarget;o.setAttribute('aria-pressed',String(o.getAttribute('aria-pressed')!=='true'));},{signal:globalListeners.signal});
  const draftLines=new Set();
  // The draft line opens the recorder on the draft; on a static drawing with no draft kept, the drawing of the draft.
  document.addEventListener('click',event=>{
    const line=event.target.closest('.aj-c-composer [data-hook~="draft"]');if(!line)return;
    origin=line.closest('.screen')?.id||'today';memoPlayer.stop();
    if(recorder.draft){location.hash='talk';recorder.open();}else location.hash='s-recording-draft';
  },{signal:globalListeners.signal});
  // An unsent entry or memo (v4 C5): Try again sends it (Uploading…), then, in this preview, it is uploaded and the
  // line goes. Nothing in the preview fails on its own.
  document.addEventListener('click',event=>{
    const retry=event.target.closest('.aj-c-pending [data-hook~="retry"]');if(!retry)return;
    const line=retry.closest('.aj-c-pending'),row=line.closest('.aj-c-srow,.aj-c-recrow');
    line.dataset.sub='sending';line.querySelector('[data-hook~="words"]').textContent='Uploading…';
    line.tabIndex=-1;line.focus({preventScroll:true});retry.remove();
    setTimeout(()=>{line.remove();if(row){row.tabIndex=-1;row.focus({preventScroll:true});}},1600);
  },{signal:globalListeners.signal});
  const recorder=window.createJournalRecorder({
    screen:document.getElementById('talk'),signal:globalListeners.signal,
    onReturn(){location.hash=origin;},
    // v4 C5: while a draft is kept, every Today composer carries its line under the row (the template memo-draft-line);
    // the static drawings that already draw one keep theirs.
    onDraft(draft){
      for(const line of draftLines)line.remove();draftLines.clear();
      if(!draft)return;
      for(const screen of screens){
        const composer=screen.querySelector('.aj-c-composer:not([data-form="chat"])');if(!composer||composer.querySelector('[data-hook~="draft"]'))continue;
        const line=template('memo-draft-line');line.querySelector('[data-hook~="length"]').textContent=draft.length;line.setAttribute('aria-label','Continue your voice memo draft, '+draft.length);
        composer.querySelector('[data-hook~="row"]').after(line);draftLines.add(line);
      }
    },
    onKeep(capture,destination){
      const item={kind:'recording',id:Date.now()+Math.random(),key:'memo-'+Date.now()+'-'+nextEntryId++,text:'Voice memo',textKind:'label',excluded:keepOut()?.getAttribute('aria-pressed')==='true',at:capture.at,duration:capture.duration,blob:capture.blob,url:URL.createObjectURL(capture.blob)};
      keepOut()?.setAttribute('aria-pressed','false');
      recordings.push(item);previewModels.set(item.key,item);commitEntries();showRecording(item);
      location.hash=destination||origin;
      requestAnimationFrame(()=>{const row=document.getElementById(destination||origin)?.querySelector('.aj-c-recrow[data-live-memo="'+item.id+'"]');if(row){row.tabIndex=-1;row.setAttribute('aria-label','Voice memo kept on today’s page');row.focus({preventScroll:true});}positionJournal();});
    }
  });
  function showRecording(item){
    const kept=document.getElementById('recording-kept');
    const old=kept.querySelector('.aj-c-recrow');const row=makeRecordingRow(item);row.dataset.place='fill';old?.replaceWith(row);   // the stack's recording row (fill); in a day's sheet it has no role
    const view=views.get(kept);if(view){view.fixtures=[row];view.version=-1;}
    const time=kept.querySelector('time');if(time){time.dateTime=item.at.toISOString();time.textContent=clock(item.at);}
    const title=kept.querySelector('.aj-c-keybox [data-hook~="date"]');if(title)title.textContent=item.at.toLocaleString([], {weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
    const play=kept.querySelector('.aj-c-play');if(play){play.dataset.prototypeRecordingId=String(item.id);play.setAttribute('aria-label','Play voice memo');}
    feedback(kept.querySelector('.aj-c-stack'),'Kept in this preview until reload. Download it to keep a copy.');
    let download=kept.querySelector('.prototype-download');
    if(!download){download=document.querySelector('template[data-template="memo-download"]').content.firstElementChild.cloneNode(true);download.classList.add('prototype-download');[...kept.querySelector('.aj-c-stack').children].find(row=>row.querySelector(':scope > .aj-c-button')).append(download);}
    const extension=item.blob.type.includes('mp4')?'m4a':item.blob.type.includes('ogg')?'ogg':item.blob.type.includes('webm')?'webm':'bin';
    download.href=item.url;download.download=`journal-memo-${item.at.toISOString().replaceAll(':','-')}.${extension}`;
  }

  window.__journalPreview={
    get recordingActive(){return recorder.active;},
    async snapshot(){
      const drafts={};
      for(const screen of screens){
        const field=screen.querySelector('.aj-c-composer:not([data-form="chat"]) [data-hook~="input"]');if(!field)continue;
        drafts[screen.id]={text:field.value,excluded:screen.querySelector('.aj-c-composer:not([data-form="chat"]) [data-hook~="memory"]')?.getAttribute('aria-pressed')==='true'};
      }
      return {
        entries:entries.map(x=>({key:x.key,text:x.text,at:x.at.toISOString(),excluded:x.excluded})),
        fixtureEntries:[...fixtureEntries.values()].map(item=>({...item})),
        entryDrafts:[...document.querySelectorAll('[data-entry-key] .aj-c-entry-actions[data-form="editor"]')].map(form=>({key:form.closest('[data-entry-key]').dataset.entryKey,route:form.closest('.screen').id,text:form.querySelector('[data-hook~="editor-field"]').value})),
        recordings:recordings.map(x=>({id:x.id,key:x.key,text:x.text,textKind:x.textKind,excluded:x.excluded,at:x.at.toISOString(),duration:x.duration,blob:x.blob})),
        drafts,origin,journalPosition,navbarPositions:navbar.snapshot(),
        moods:Object.fromEntries(screens.filter(s=>s.querySelector('.aj-c-moodrow[data-form="ruled"]')).map(s=>[s.id,s.querySelector('.aj-c-moodrow [data-hook~="chips"] button[aria-pressed="true"]')?.dataset.mood||null]))
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
        document.getElementById(id)?.querySelectorAll('.aj-c-moodrow[data-form="ruled"] [data-hook~="chips"] button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mood===value)));
      }
      for(const screen of screens){
        const draft=state.drafts[screen.id];if(!draft)continue;
        const field=screen.querySelector('.aj-c-composer:not([data-form="chat"]) [data-hook~="input"]');
        const button=screen.querySelector('.aj-c-composer:not([data-form="chat"]) [data-hook~="row"] button');
        if(field&&button){field.value=draft.text;sizeField(field);mode(button,!!field.value.trim());}
        screen.querySelector('.aj-c-composer:not([data-form="chat"]) [data-hook~="memory"]')?.setAttribute('aria-pressed',String(!!draft.excluded));
      }
      previewModels.clear();for(const item of [...entries,...recordings])previewModels.set(item.key,item);
      commitEntries();
      for(const draft of state.entryDrafts||[]){const draftScreen=document.getElementById(draft.route);renderPreview(draftScreen);const row=draftScreen?.querySelector('[data-entry-key="'+draft.key+'"]');if(row&&!row.hidden)editEntry(row,draft.text);}
      if(recordings.length)showRecording(recordings.at(-1));
      navbar.restore(state.navbarPositions);positionJournal(state.journalPosition);
    },
    destroy(){
      globalListeners.abort();
      navbar.destroy();
      cancelAnimationFrame(journalScrollFrame);
      recorder.destroy();memoPlayer.stop();
      for(const item of recordings)URL.revokeObjectURL(item.url);
    }
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest('.aj-c-play');if(!button)return;
    const item=recordings.find(x=>String(x.id)===button.dataset.prototypeRecordingId);
    if(!item){feedback(button.closest('.aj-c-recrow'),'This example has no audio file. Record a memo to play it here.');return;}
    memoPlayer.play(item,button);
  },{signal:globalListeners.signal});
  function recordingRoute(){
    const route=location.hash.slice(1);
    const aliases=['microphone-before','microphone-denied','microphone-missing','s-mic-permission','s-mic-denied','s-mic-missing','s-recording-paused'];
    if(aliases.includes(route)){location.hash='talk';recorder.open();return;}
    if(route==='talk')recorder.open();else if(recorder.active)recorder.cancel(false);
  }
  window.addEventListener('hashchange',()=>{renderPreview();closeEntryMenus();memoPlayer.stop();recordingRoute();if(currentJournal()&&!navbar.active)positionJournal();},{signal:globalListeners.signal});
  window.addEventListener('resize',()=>{if(journalPosition&&!globalListeners.signal.aborted)positionJournal(journalPosition);},{signal:globalListeners.signal});
  document.addEventListener('visibilitychange',()=>memoPlayer.visibility(),{signal:globalListeners.signal});
  window.addEventListener('pagehide',()=>{navbar.destroy();recorder.destroy();memoPlayer.stop();for(const item of recordings)URL.revokeObjectURL(item.url);},{signal:globalListeners.signal});
  renderPreview();
  recordingRoute();
  if(currentJournal())positionJournal();
})();
