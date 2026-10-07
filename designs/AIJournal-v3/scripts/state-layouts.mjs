import {elementRange} from './html-structure.mjs';
// Draw exception states inside their canonical screen composition.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cache=new Map();
const E=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const link=(to,text,kind='quiet')=>`<a class="btn ${kind}" href="00-prototype.html#${to}">${E(text)}</a>`;
const message=text=>`<p class="auth-help state-message" role="status">${E(text)}</p>`;
const eye='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12c2.4-3.5 5.5-5.25 9.5-5.25s7.1 1.75 9.5 5.25c-2.4 3.5-5.5 5.25-9.5 5.25S4.9 15.5 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/><path class="eye-slash" d="M3 3l18 18"/></svg>';

export {elementRange} from './html-structure.mjs';
function find(html,cls){
 const re=new RegExp(`<\\w+\\b[^>]*class="(?:[^"\\n]*\\s)?${cls}(?:\\s[^"\\n]*)?"[^>]*>`),m=re.exec(html);
 return m?elementRange(html,m.index):null;
}
function replace(html,cls,fn){const r=find(html,cls);return r?html.slice(0,r.start)+fn(r.html)+html.slice(r.end):html;}
function inner(html,contents){const opening=html.match(/^<[^>]+>/)[0],close=html.match(/<\/\w+>$/)[0];return opening+contents+close;}
function append(html,cls,contents){return replace(html,cls,h=>h.replace(/(<\/\w+>)$/,contents+'$1'));}
function source(p,file,index=0){
 const key=p+'/'+file;if(!cache.has(key))cache.set(key,fs.readFileSync(path.join(root,p,file),'utf8'));
 const html=cache.get(key);let pos=0,r;
 for(let i=0;i<=index;i++){const start=html.indexOf('<div class="device',pos);if(start<0)throw Error('Missing screen '+key);r=elementRange(html,start);pos=r.end;}
 return r.html;
}
function stamp(html,id){return html.replace(/<div class="app([^\"]*)"[^>]*>/,`<div class="app$1" id="${id}">`);}
function withoutModels(html){
 html=replace(html,'journal-overview',()=> '');
 html=replace(html,'glance',()=> '');
 for(const cls of ['said','askrow','asked'])while(find(html,cls))html=replace(html,cls,()=> '');
 html=replace(html,'recrow',memo=>replace(memo,'prose',p=>inner(p.replace('class="prose"','class="prose audio-label"'),'Voice memo')));
 return html;
}
function authState(p,s){
 const signup=s.id.startsWith('auth-register'),login=s.id.startsWith('auth-login')||s.id==='auth-signed-out';
 let html=source(p,signup?'14-register.html':'13-login.html'),body=s.body;
 const mainForm=html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
 if((signup||login)&&!body.includes('<form'))body+=mainForm.replace(/ data-auth-form="[^"]+"/,'');
 // Static state fields use the same eye control and field rhythm as the main forms.
 body=body.replace(/(<input\b[^>]*type="password"[^>]*>)<button class="btn quiet"[^>]*aria-controls="([^"]+)"[^>]*>Show password<\/button>/g,(_all,input,id)=>`<div class="password-control">${input}<button class="btn quiet password-toggle" type="button" aria-controls="${id}" aria-label="Show password" aria-pressed="false">${eye}</button></div>`);
 if(signup&&body.includes('<form')&&!body.includes('Confirm password')){
  const value=body.match(/type="password" value="([^"]*)"/)?.[1]||'';
  const confirmation=`<div class="auth-field"><label for="${s.id}-confirm-password">Confirm password</label><div class="field-inner"><div class="password-control"><input class="field" id="${s.id}-confirm-password" type="password" value="${value}" required minlength="8" autocomplete="new-password"><button class="btn quiet password-toggle" type="button" aria-controls="${s.id}-confirm-password" aria-label="Show confirmed password" aria-pressed="false">${eye}</button></div></div></div>`;
  body=body.replace(/<button class="btn solid" type="submit">/,confirmation+'<button class="btn solid" type="submit">');
 }
 // Put validation beside its input, using the same 8px spacing as the main form.
 body=body.replace(/(<\/div><\/div>)(<p class="auth-help"[^>]*>[\s\S]*?<\/p>)/g,'$2$1');
 if(s.id==='auth-register-short')body=body.replace('Use at least 8 characters.</p>','Enter a password with at least 8 characters.</p>');
 if(signup&&!body.includes('at least 8 characters'))body=body.replace(/(<\/div><\/div>)(?=<div class="auth-field"><label[^>]*>Confirm password)/,'<p class="auth-help password-note">Use at least 8 characters.</p>$1');
 // Keep recovery under the login password, rather than beside the form actions.
 if(login&&body.includes('<form')){
  body=body.replace(/<a class="btn quiet" href="00-prototype.html#auth-forgot">Forgot your password\?<\/a>/g,'');
  if(!body.includes('class="btn quiet forgot'))body=body.replace(/(<\/div><\/div>)(?=<button class="btn solid" type="submit">)/,'<a class="btn quiet forgot password-note" href="00-prototype.html#auth-forgot">Forgot your password?</a>$1');
  while(find(body,'auth-actions'))body=replace(body,'auth-actions',()=> '');
 }
 if(login&&!body.includes('Create an account'))body+=`<div class="auth-actions">${link('auth-register','Create an account')}</div>`;
 if(signup&&!/href="00-prototype.html#auth-login"/.test(body))body+=`<div class="auth-actions">${link('auth-login','Already have an account? Log in')}</div>`;
 const heading=signup?'Create an account':login?'Log in':s.title;
 html=replace(html,'auth-content',h=>inner(h,`<h2 class="auth-heading" id="${signup?'register':'login'}-heading">${E(heading)}</h2>${body}`));
 return stamp(html,s.id);
}

export function accountDialog(failed=false){
 return `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-heading"><div class="card"><h3 id="delete-account-heading">Delete everything?</h3><p>This deletes your account, 148 entries and 31 recordings, including items deleted earlier. You will be signed out everywhere. It cannot be undone.</p>${failed?message('We could not reach the server. Nothing was deleted.'):''}<p>Export first if you want a copy.</p><div class="card-foot">${link('export-preparing','Export instead','solid')}${link('account-delete-pending',failed?'Try deleting again':'Delete everything','keyline')}${link('settings-data','Keep my account')}</div></div></div>`;
}
export function renderContextState(p,s){
 if(s.kind==='auth')return authState(p,s);
 if(s.id==='account-delete-confirm'||s.id==='account-delete-failed')return stamp(append(source(p,'10-settings-privacy.html',2),'page',accountDialog(s.id.endsWith('failed'))),s.id);
 if(s.id.startsWith('export-')){
  let html=source(p,'10-settings-privacy.html',2);
  html=append(html,'sheet',`<div class="state-message">${s.body}</div>`);
  if(s.id==='export-empty')html=html.replace('148 and 31','0 and 0');
  return stamp(html,s.id);
 }
 if(s.id==='today-without-note')return stamp(withoutModels(source(p,'01-today.html')),s.id);
 if(s.id==='day-without-note'){
  let html=withoutModels(source(p,'06-conversation.html'));
  const memo=replace(find(withoutModels(source(p,'01-today.html')),'recrow').html,'head',h=>h.replaceAll('2026-08-09','2026-08-06'));
  html=replace(html,'sheet',h=>h.replace(/^(<main\b[^>]*>)/,'$1'+memo));
  return stamp(html,s.id);
 }
 if(s.id==='save-failed'){
  let html=source(p,'01-today.html');
  html=replace(html,'composer',h=>{
   h=h.replace(/<div class="field placeholder">[^<]*<\/div>/,'<div class="field">The flat people said Tuesday, and it is Sunday, so I decided not to think about it until Tuesday.</div>');
   h=replace(h,'mic',()=>'<button class="send" type="button" aria-label="Save entry">Save</button>');
   return h.replace(/(<\/div>)$/,message('We could not reach the server. Your entry was not saved. Your words are still here; try saving again.')+'$1');
  });
  return stamp(html,s.id);
 }
 if(s.id==='recording-upload-failed'||s.id==='recording-delete-failed'||s.id==='recording-delete-confirm'){
  let html=source(p,'01-today.html');
  if(s.id==='recording-upload-failed')html=withoutModels(html);
  html=replace(html,'recrow',memo=>{
   if(s.id==='recording-upload-failed')return replace(replace(memo,'prose',p=>inner(p,'Voice memo')),'entry-actions',()=> '');
   return replace(memo,'entry-actions',()=>`<div class="entry-confirm"><p>${s.id.endsWith('failed')?'We could not reach the server. The recording is still here.':'Delete this recording? This cannot be undone.'}</p><div class="auth-actions">${link(s.id.endsWith('failed')?'recording-delete-confirm':'recording-deleted',s.id.endsWith('failed')?'Try again':'Delete recording')}${link('today','Keep recording','solid')}</div></div>`);
  });
  if(s.id==='recording-upload-failed')html=replace(html,'recrow',memo=>replace(memo,'body',body=>append(body,'ccol',`<div class="state-message">${message('Not yet saved to your account. We could not send this recording. Try again before closing this page; closing it will lose the recording.')}${link('recording-kept','Send recording again','solid')}</div>`)));
  return stamp(html,s.id);
 }
 if(s.id==='mood-failed'){
  let html=source(p,'01-today.html');
  html=replace(html,'moodrow',h=>{
   h=h.replace(/(<button[^>]*aria-pressed=")false("[^>]*>Low<\/button>)/,'$1true$2');
   const error=message('Mood was not changed. We could not reach the server; the saved mood is still Low. Choose a mood to try again.');
   return find(h,'ccol')?append(h,'ccol',error):h.replace(/(<\/section>)$/,error+'$1');
  });
  return stamp(html,s.id);
 }
 if(['entry-delete-failed','entry-delete-confirm','entry-edit-failed','entry-edit-empty','entry-edit'].includes(s.id)){
  let html=source(p,'01-today.html');
  html=replace(html,'srow',h=>replace(h,'ccol',c=>{
   const prose=find(c,'prose').html;
   if(s.id.startsWith('entry-delete'))return inner(c,prose+`<div class="entry-confirm"><p>${s.id.endsWith('failed')?'We could not reach the server. The entry is still here.':'Delete this entry? This cannot be undone.'}</p><div class="auth-actions">${link(s.id.endsWith('failed')?'entry-delete-confirm':'entry-deleted',s.id.endsWith('failed')?'Try again':'Delete entry')}${link('today','Keep entry','solid')}</div></div>`);
   const empty=s.id==='entry-edit-empty',text=empty?'':prose.replace(/<[^>]*>/g,'')+(s.id.endsWith('failed')?' I read the email again.':'');
   return inner(c,`<form class="entry-editor" action="00-prototype.html#entry-saved"><label for="state-entry-text">Entry text<textarea class="field" id="state-entry-text" rows="5" required${empty?' aria-invalid="true" aria-describedby="state-entry-error"':''}>${E(text)}</textarea></label>${s.id.endsWith('failed')?message('Changes were not saved. We could not reach the server. Your changed text is still here; try saving again.'):empty?'<p class="auth-help" id="state-entry-error" role="alert">An entry cannot be empty. Write something or delete the entry instead.</p>':''}<div class="auth-actions"><button class="btn solid" type="submit">Save changes</button>${link('today','Leave as it was')}${empty?link('entry-delete-confirm','Delete entry'):''}</div></form>`);
  }));
  return stamp(html,s.id);
 }
 const contexts={
  'today-loading':['01-today.html',0],'timeline-loading':['02-timeline.html',0],
  'day-loading':['06-conversation.html',0],'ask-loading':['04-ask.html',0],
  'you-loading':['07-you.html',0],'fetch-failed':['01-today.html',0],
  'day-fetch-failed':['06-conversation.html',0]
 };
 if(contexts[s.id]){
  const [file,index]=contexts[s.id];let html=source(p,file,index);
  html=replace(html,'glance',()=> '');html=replace(html,'composer',()=> '');
  const loading={'today-loading':'Opening your journal.','timeline-loading':'Loading your days.','day-loading':'Loading this day.','ask-loading':'Loading your search.','you-loading':'Loading your settings.'};
  html=replace(html,'sheet',h=>inner(h,`<div class="state-message">${loading[s.id]?message(loading[s.id]):s.body}</div>`));
  html=replace(html,'foot',()=> '');return stamp(html,s.id);
 }
 if(s.id==='timeline-earlier'||s.id==='timeline-end'){
  let html=source(p,'02-timeline.html');const line=s.id==='timeline-earlier'?'Fetching earlier entries.':'There is nothing earlier in this journal.';
  if(find(html,'foot'))html=replace(html,'foot',h=>inner(h,line));else html=append(html,'page',`<p class="foot">${line}</p>`);
  return stamp(html,s.id);
 }
 return null;
}
