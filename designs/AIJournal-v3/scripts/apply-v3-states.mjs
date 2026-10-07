// Regenerate the v3 state packs using the locked Journal components.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {entryControls,recordingControls} from './entry-controls.mjs';
import {compactRecorder} from './compact-recorder.mjs';
import {renderContextState} from './state-layouts.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const platforms=['mobile-web','tablet-web','desktop-web'];
const E=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const link=(to,label,kind='quiet')=>`<a class="btn ${kind}" href="00-prototype.html#${to}">${E(label)}</a>`;
const actions=(...items)=>`<div class="auth-actions">${items.join('')}</div>`;
const copy=t=>`<p class="auth-copy">${E(t)}</p>`;
const note=t=>`<div class="notice" role="status">${E(t)}</div>`;
const row=(label,why,val='',to='')=>`<${to?'a':'div'} class="srowlink"${to?` href="00-prototype.html#${to}"`:''}><span class="lab">${E(label)}<span class="why">${E(why)}</span></span>${val?`<span class="val">${E(val)}</span>`:''}</${to?'a':'div'}>`;
const field=(id,label,type='text',value='',extra='')=>`<div class="auth-field"><label for="${id}">${E(label)}</label><div class="field-inner"><input class="field" id="${id}" type="${type}" value="${E(value)}" ${extra}>${type==='password'?`<button class="btn quiet" type="button" aria-controls="${id}" aria-label="Show password">Show password</button>`:''}</div></div>`;
const form=(id,fields,action,label)=>`<form class="auth-form" action="00-prototype.html#${action}" method="get">${fields}<button class="btn solid" type="submit">${E(label)}</button></form>`;
const para=(t)=>`<p class="auth-copy">${E(t)}</p>`;
const states=(arr)=>arr.map(x=>({id:x[0],title:x[1],body:x[2],kind:x[3]||'account'}));

const auth=states([
 ['auth-login-error','Try again',note('We could not sign you in with those details.')+form('li-error',field('li-error-email','Email','email','mubeen@example.com','required autocomplete="email"')+field('li-error-pass','Password','password','journalday','required autocomplete="current-password"'),'today','Sign in')+actions(link('auth-forgot','Forgot your password?'))],
 ['auth-login-invalid','Check the fields',form('li-invalid',field('li-invalid-email','Email','email','not-an-email','required aria-invalid="true" aria-describedby="li-invalid-help"')+'<p class="auth-help" id="li-invalid-help">Enter an email address.</p>'+field('li-invalid-pass','Password','password','','required'),'today','Sign in')],
 ['auth-login-sending','Signing in',para('Signing you in.')],
 ['auth-login-rate','Try again shortly',note('There have been too many attempts. Wait a few minutes, then try again.')+actions(link('auth-login','Back to sign in'))],
 ['auth-login-network','Could not sign in',note('We could not reach the server. Your details are still here. Try again.')+form('li-network',field('li-network-email','Email','email','mubeen@example.com','required')+field('li-network-pass','Password','password','journalday','required'),'today','Try again')],
 ['auth-login-after-reset','Password changed',note('Your password was changed. Sign in with the new one.')+form('li-reset',field('li-reset-email','Email','email','','required')+field('li-reset-pass','Password','password','','required'),'today','Sign in')],
 ['auth-login-after-delete','Account deleted',note('Your account and everything in it were deleted.')+form('li-deleted',field('li-deleted-email','Email','email','','required')+field('li-deleted-pass','Password','password','','required'),'today','Sign in')],
 ['auth-login-after-session','Sign in again',note('You were signed out. Sign in again to return to your draft; what you typed is still here.')+form('li-session',field('li-session-email','Email','email','','required')+field('li-session-pass','Password','password','','required'),'draft','Sign in')],
 ['auth-register-error','Email already in use',note('There is already an account with this email.')+form('re-error',field('re-error-email','Email','email','mubeen@example.com','required')+field('re-error-pass','Password','password','','required minlength="8"'),'empty-today','Create account')+actions(link('auth-login','Sign in'),link('auth-forgot','Reset your password'))],
 ['auth-register-invalid','Enter an email address',form('re-invalid',field('re-invalid-email','Email','email','not-an-email','required aria-invalid="true" aria-describedby="re-invalid-help"')+'<p class="auth-help" id="re-invalid-help">Enter an email address.</p>'+field('re-invalid-pass','Password','password','','required minlength="8"'),'empty-today','Create account')],
 ['auth-register-short','Use a longer password',form('re-short',field('re-short-email','Email','email','mubeen@example.com','required')+field('re-short-pass','Password','password','','required minlength="8" aria-invalid="true" aria-describedby="re-short-help"')+'<p class="auth-help" id="re-short-help">Use at least 8 characters.</p>','empty-today','Create account')],
 ['auth-register-creating','Creating account',para('Creating your account. You will open on Today.')],
 ['auth-register-network','Could not create account',note('We could not reach the server. Your email and password are still in the form.')+form('re-network',field('re-network-email','Email','email','mubeen@example.com','required')+field('re-network-pass','Password','password','journalday','required minlength="8"'),'empty-today','Try again')],
 ['auth-forgot','Reset your password',copy('Enter your email address. We will send a link you can use to choose a new password.')+form('fo-base',field('fo-base-email','Email','email','','required autocomplete="email"'),'auth-forgot-sent','Send reset link')+actions(link('auth-login','Back to sign in'))],
 ['auth-forgot-invalid','Enter an email address',form('fo-invalid',field('fo-invalid-email','Email','email','not-an-email','required aria-invalid="true" aria-describedby="fo-invalid-help"')+'<p class="auth-help" id="fo-invalid-help">Enter an email address.</p>','auth-forgot-sent','Send reset link')+actions(link('auth-login','Back to sign in'))],
 ['auth-forgot-sending','Sending the link',para('Sending your request.')],
 ['auth-forgot-sent','Check your email',note('If an account exists for mubeen@example.com, a reset link has been sent. It works for 30 minutes and can be used once.')+actions(link('auth-forgot','Use a different address'),link('auth-login','Back to sign in'))],
 ['auth-forgot-rate','Wait a few minutes',note('Too many links were requested. Wait a few minutes, then try again.')+actions(link('auth-forgot','Try again'))],
 ['auth-forgot-network','Link not sent',note('We could not reach the server, so the request did not go through.')+form('fo-network',field('fo-network-email','Email','email','mubeen@example.com','required'),'auth-forgot-sent','Try again')],
 ['auth-reset','Choose a new password',copy('Use at least 8 characters. This link works once, for 30 minutes.')+form('reset-base',field('reset-base-pass','New password','password','','required minlength="8" autocomplete="new-password"'),'auth-login-after-reset','Save new password')],
 ['auth-reset-short','Use a longer password',form('reset-short',field('reset-short-pass','New password','password','','required minlength="8" aria-invalid="true" aria-describedby="reset-short-help"')+'<p class="auth-help" id="reset-short-help">Use at least 8 characters.</p>','auth-login-after-reset','Save new password')],
 ['auth-reset-saving','Saving password',para('Saving your new password and signing out every device.')],
 ['auth-reset-expired','This link no longer works',copy('This link has expired or has already been used. Ask for a new one.')+actions(link('auth-forgot','Ask for a new link','solid'))],
 ['auth-reset-network','Password not changed',note('We could not reach the server. Your new password is still in the field; try again.')+form('reset-network',field('reset-network-pass','New password','password','quietmorning','required minlength="8"'),'auth-login-after-reset','Try again')],
 ['auth-signed-out','Signed out',copy('You have been signed out of this device.')+actions(link('auth-login','Sign in','solid'))]
]);
for(const state of auth)state.kind='auth';

const flows=states([
 ['s-mic-permission','Allow the microphone',copy('Your browser will ask before anything is recorded.')+actions(link('s-recording-paused','Allow the microphone','solid'),link('today','Write instead')),'journal'],
 ['s-mic-denied','Microphone blocked',note('Your browser is blocking the microphone for this site. Allow it in your browser settings, then try again.')+actions(link('s-mic-permission','Try again'),link('today','Write instead')),'journal'],
 ['s-mic-missing','No microphone found',note('No microphone was found on this device. You can still write.')+actions(link('s-mic-permission','Check again'),link('today','Write instead')),'journal'],
 ['s-recording-paused','Recording paused',copy('0:47 recorded. Nothing is being recorded while paused.')+actions(link('s-recording-paused','Resume recording','solid'),link('s-recording-kept','Stop and keep')),'journal'],
 ['s-recording-kept','Recording kept',note('Your 0:47 recording is kept as audio.')+actions(link('today','Return to Today','solid')),'journal'],
 ['s-search-empty','No matches',copy('No written entries match “mountains”. Try another word. Recordings without transcripts are not searched.')+actions(link('ask','Search again','solid'),link('timeline','Browse Timeline')),'journal'],
 ['s-thinking','Reading your entries',copy('Looking through the entries that can be read.')+actions(link('ask-answer','See answer','solid'),link('ask','Cancel')),'journal'],
 ['s-answer-dismissed','Your own words remain',copy('The answer was removed because you marked it wrong. Your original excerpts are still here.')+actions(link('ask','Back to Ask','solid')),'journal']
]);

const zones=Intl.supportedValuesOf('timeZone');
const zoneOptions=zones.map(z=>`<option value="${E(z)}"${z==='Asia/Karachi'?' selected':''}>${E(z.replaceAll('_',' '))}</option>`).join('');
const accountContent=(several,failed=false)=>row('Email','The address used to sign in.','mubeen@example.com')+row('Timezone','A day ends at 4am in this timezone. Changing it does not move anything already written.','Karachi (UTC+5)','timezone-choose')+'<h3 class="shead">Signed-in devices</h3>'+row('Chrome on Windows','This device · last used now · signed in 30 September 2026.','This device')+(several?row('Safari on iPhone','Last used 5 October 2026 · signed in 2 October 2026.','Sign out','account-device-signed-out'):'')+(failed?note('We could not reach the server. That device is still signed in. Try its Sign out action again.'):'')+actions(link('auth-signed-out','Sign out of this device'),...(several?[link('auth-signed-out','Sign out everywhere')]:[]))+copy('To choose a new password, use the forgot-password link on sign in.');
const account=states([
 ['account-delete-confirm','Delete everything?',''],
 ['account-devices','Account',accountContent(true)],
 ['account-only-device','Account',accountContent(false)],
 ['account-device-signed-out','Account',accountContent(false)],
 ['account-device-failed','Account',accountContent(true,true)],
 ['timezone-choose','Timezone',copy('A day ends at 4am in this timezone. Changing it does not move what you have already written.')+`<form class="auth-form" action="00-prototype.html#account-devices" method="get"><div class="auth-field"><label for="timezone-list">Timezone</label><select class="field" id="timezone-list">${zoneOptions}</select></div><button class="btn solid" type="submit">Save timezone</button></form>`+actions(link('account-devices','Leave as it is'))],
 ['timezone-failed','Timezone not changed',note('We could not reach the server. Your timezone is still Karachi (UTC+5).')+actions(link('timezone-choose','Try again','solid'))],
 ['export-preparing','Preparing export',copy('We are packaging your entries as Markdown and JSON, with recordings as audio files.')+actions(link('export-ready','Download when ready'))],
 ['export-ready','Export ready',note('Your download is ready. If it did not start, download it again.')+actions(link('export-ready','Download file','solid'),link('settings-data','Back to Your data'))],
 ['export-empty','Nothing to export yet',copy('There are no entries or recordings in this account yet.')+actions(link('settings-data','Back to Your data','solid'))],
 ['export-failed','Export did not work',note('We could not reach the server. Nothing was downloaded. You can try again.')+actions(link('export-preparing','Try export again','solid'))],
 ['account-delete-pending','Deleting account',copy('Deleting your account and everything in it. You will be signed out everywhere.')],
 ['account-delete-failed','Delete everything?',`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="account-delete-failed-heading"><div class="card"><h3 id="account-delete-failed-heading">Delete everything?</h3><p>This deletes the account, 148 entries and 31 recordings, and signs out every device.</p><p>We could not reach the server. Nothing was deleted.</p><div class="card-foot">${link('export-preparing','Export instead','solid')}${link('account-delete-pending','Try deleting again','keyline')}</div></div></div>`]
]);

const entryText='The flat people said Tuesday, and it is Sunday, so I decided not to think about it until Tuesday.';
const editable=`<div class="srow"><div class="tcol">09:20</div><div class="ccol"><p class="prose">${E(entryText)}</p></div></div>`;
const memo=`<div class="recrow"><div class="head dated"><div class="tcol">14:05</div><div class="ccol"><button class="play" type="button" aria-label="Play voice memo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg></button><span class="dur">2:41</span></div></div><div class="body"><div class="tcol"></div><div class="ccol"><p class="prose">Voice memo</p>${recordingControls}</div></div></div>`;
const changedEntryText=entryText+' I read the email again.';
const savedEntry=`<div class="srow"><div class="tcol">09:20</div><div class="ccol"><p class="prose">${E(changedEntryText)}</p></div></div>`;
const entryForm=(id,value,help='',invalid=false)=>`<form class="auth-form" action="00-prototype.html#entry-saved" method="get"><div class="srow"><div class="tcol">09:20</div><div class="ccol"><div class="auth-field"><label for="${id}">Entry text</label><textarea class="field" id="${id}" rows="7" required${invalid?' aria-invalid="true"':''}>${E(value)}</textarea>${help?`<p class="auth-help">${E(help)}</p>`:''}</div></div></div><button class="btn solid" type="submit">Save changes</button></form>`;
const system=states([
 ['today-without-note','Today before model features','', 'journal'],
 ['day-fetch-failed','Could not open this day',note('We could not reach the server. Try loading this day again.')+actions(link('day','Try again','solid')),'journal'],
 ['composer-options','Composer options',row('If you want to talk to someone','A support resource is available whenever you need it.','Read','support-resource')+actions(link('today','Back to Today')),'panel'],
 ['support-resource','If you want to talk to someone',copy('In the UK or Ireland, Samaritans are available all night, every night, on 116 123. There is no charge for the call, and you do not need to give your name. Elsewhere, use a local support line.')+actions(link('composer-options','Back to options'),link('settings-privacy','Back to settings')),'journal'],
 ['entry-options','Entry',editable.replace('</p>','</p>'+entryControls),'journal'],
 ['recording-options','Voice memo',memo,'journal'],
 ['entry-memory','Out of memory',note('This entry is out of memory. It stays in your journal and cannot be read or cited by the model.')+actions(link('entry-memory-return','Let it back into memory','solid'),link('entry-options','Back to entry')),'journal'],
 ['entry-memory-return','Back in memory',note('This entry can be read and cited by the model again.')+actions(link('entry-options','Back to entry','solid')),'journal'],
 ['recording-memory','Out of memory',note('This recording stays in your journal but is out of memory.')+actions(link('recording-memory-return','Let it back into memory','solid'),link('recording-options','Back to recording')),'journal'],
 ['recording-memory-return','Back in memory',note('This recording can be included in memory again after transcription.')+actions(link('recording-options','Back to recording','solid')),'journal'],
 ['entry-edit','Edit entry',entryForm('edit-entry',entryText)+actions(link('entry-options','Leave as it was')),'journal'],
 ['entry-saved','Entry',savedEntry.replace('</p>','</p>'+entryControls),'journal'],
 ['entry-edit-empty','An entry cannot be empty',note('Write something before saving, or delete the entry instead.')+entryForm('edit-empty','','An entry cannot be empty.',true)+actions(link('entry-delete-confirm','Delete entry')),'journal'],
 ['entry-edit-failed','Changes not saved',note('We could not reach the server. Your changed text is still here; try saving again.')+entryForm('edit-failed',changedEntryText) ,'journal'],
 ['entry-delete-confirm','Delete this entry?',editable+note('This cannot be undone. The entry will leave your journal at once.')+actions(link('entry-deleted','Delete entry'),link('entry-options','Keep entry','solid')),'journal'],
 ['recording-delete-confirm','Delete this recording?',row('Recording','2:41 · saved at 14:05.','Play')+note('This cannot be undone. The recording will leave your journal at once.')+actions(link('recording-deleted','Delete recording'),link('recording-options','Keep recording','solid')),'journal'],
 ['entry-deleted','Entry deleted',copy('The entry is gone from your journal.')+actions(link('today','Back to Today','solid')),'journal'],
 ['entry-delete-failed','Entry not deleted',editable+note('We could not reach the server. The entry is still here.')+actions(link('entry-delete-confirm','Try again','solid')),'journal'],
 ['recording-deleted','Recording deleted',copy('The recording is gone from your journal.')+actions(link('today','Back to Today','solid')),'journal'],
 ['recording-delete-failed','Recording not deleted',row('Recording','2:41 · saved at 14:05.','Play')+note('We could not reach the server. The recording is still here.')+actions(link('recording-delete-confirm','Try again','solid'),link('recording-options','Keep recording')),'journal'],
 ['day-last-deleted','Nothing on this day',copy('The last item on this day was deleted, so this day no longer appears in Timeline.')+actions(link('timeline','Back to Timeline','solid')),'journal'],
 ['save-failed','Entry not saved',note('We could not reach the server. Your words are still in the composer.')+`<form class="auth-form" action="00-prototype.html#today"><div class="auth-field"><label for="save-draft">Your entry</label><textarea class="field" id="save-draft" rows="6">${E(entryText)}</textarea></div><button class="btn solid">Try saving again</button></form>`,'journal'],
 ['recording-upload-failed','Recording not saved yet',row('Recording held on this page','2:41 · not yet saved to your account.','Play')+note('We could not send this recording. Try again before closing this page; closing it will lose the recording.')+actions(link('s-recording-kept','Send recording again','solid')),'journal'],
 ['mood-failed','Mood not changed',note('We could not reach the server. The saved mood is still Low.')+row('How was today?','Hard · Low · Even · Good · Light','Low')+actions(link('today','Try again','solid')),'journal'],
 ['today-loading','Opening Today',para('Opening your journal. The destinations are available.')+actions(link('today','Preview Today')),'journal'],
 ['timeline-loading','Opening Timeline',para('Loading your days. The destinations are available.')+actions(link('timeline','Preview Timeline')),'journal'],
 ['day-loading','Opening a day',para('Loading this day. The destinations are available.')+actions(link('day','Preview day')),'journal'],
 ['ask-loading','Opening Ask',para('Loading your search. The destinations are available.')+actions(link('ask','Preview Ask')),'journal'],
 ['you-loading','Opening You',para('Loading your settings. The destinations are available.')+actions(link('you','Preview You')),'journal'],
 ['timeline-earlier','Earlier days',para('Fetching earlier entries.')+actions(link('timeline-end','Preview end of Timeline')),'journal'],
 ['timeline-end','The beginning',para('There is nothing earlier in this journal.')+actions(link('timeline','Back to Timeline','solid')),'journal'],
 ['fetch-failed','Could not open this page',note('We could not reach the server. Try loading it again.')+actions(link('today','Try again','solid')),'journal'],
 ['not-found','Page not found',copy('This entry or day could not be found.')+actions(link('today','Back to Today','solid')),'journal'],
 ['server-error','Something went wrong',copy('We could not show this page. Please try again.')+actions(link('today','Try again','solid')),'journal'],
 ['day-without-note','A day without a note',editable.replace('</p>','</p>'+entryControls)+row('Recording','2:41 · kept as audio. Text will appear after transcription.','Play')+copy('Entries and recordings stand on their own. A note appears only when it has been made.')+actions(link('day','Back to day')),'journal']
]);

function shell(p,s) {
 const recorderStates={"s-mic-permission":"pending","s-mic-denied":"denied","s-mic-missing":"missing","s-recording-paused":"paused"};
 if(recorderStates[s.id])return compactRecorder(p,{id:s.id,state:recorderStates[s.id]})+`<p class="caption"><b>Voice memo / ${recorderStates[s.id]}</b><br>Compact Transport. Native browser permission; inline recovery. Stop and keep returns directly to the journal.</p>`;
 const contextual=renderContextState(p,s);
 if(contextual){const klass=p==='mobile-web'?'':p==='tablet-web'?' t':' d';return contextual+'<p class="caption'+klass+'"><b>'+E(s.title)+'</b><br>Journal v3 design state. The surrounding page stays visible; V3-REVISION.md specifies integration behavior.</p>';}

 const klass=p==='mobile-web'?'':p==='tablet-web'?' t':' d';
 const heading=s.kind==='journal'||s.kind==='panel'?'Journal':'You';
 const nav=s.kind==='auth'?'':`<nav class="dest" aria-label="Destinations"><a href="00-prototype.html#today"${s.kind==='journal'||s.kind==='panel'?' aria-current="page"':''}>Today</a><a href="00-prototype.html#timeline">Timeline</a><a href="00-prototype.html#ask">Ask</a><a href="00-prototype.html#you"${s.kind==='account'?' aria-current="page"':''}>You</a></nav>`;
 const main=s.kind==='panel'
  ? `<main class="sheet"><div class="srow"><div class="tcol">09:20</div><div class="ccol"><p class="prose">${E(entryText)}</p></div></div></main><section class="panel" aria-label="Composer options"><h2>Composer options</h2>${s.body}</section>`
  : `<main class="sheet auth-sheet"><div class="auth-content"><h2 class="auth-heading">${E(s.title)}</h2>${s.body}</div></main>`;
 const mast=p==='desktop-web'
 ? `<div class="title"><h1 class="wordmark">${heading}</h1><div class="keybox"><span class="k">Journal</span><span class="v printed">Your journal</span></div>${nav}</div><div class="page">${main}</div>`
 : `<div class="page"><header class="mast"><h1 class="wordmark">${heading}</h1><div class="keybox"><span class="k">Journal</span><span class="v printed">Your journal</span></div></header>${nav}${main}</div>`;
 return `<div class="device${klass}"><div class="chrome" aria-hidden="true"><span>journal.app</span></div><div class="app auth-surface" id="${s.id}"><div class="rail" aria-hidden="true"></div>${mast}</div></div><p class="caption${klass}"><b>${E(s.title)} · ${E(p)}</b><br>Journal v3 review state. The action and recovery use existing fields, rows, notices and buttons. This static file illustrates the state; V3-REVISION.md specifies behavior.</p>`;
}
function page(p,file,title,list) {
 const html=`<!doctype html>\n<!-- Journal v3 design of record. Static states use the closed component inventory and lock.css. -->\n<html lang="en" data-motion-review="play"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Journal / ${E(title)} / ${E(p)}</title><link rel="stylesheet" href="../lock.css"></head><body><p class="caption motion-review-status"><b>Motion preview is on.</b><br>This handover plays its animations even when Windows animation effects are disabled. Your device settings are unchanged.</p>\n${list.map(s=>shell(p,s)).join('\n')}\n</body></html>\n`;
 fs.writeFileSync(path.join(root,p,file),html);
}
for(const p of platforms) {
 page(p,'15-auth-states.html','Account states',auth);
 page(p,'16-flow-states.html','Flow states',flows);
 page(p,'17-account-data.html','Account and data states',account);
 page(p,'18-entry-system-states.html','Entry and system states',system);
}
fs.writeFileSync(path.join(root,'reset-email.txt'),`Subject: Choose a new Journal password\n\nA password reset was requested for your Journal account.\n\nChoose a new password: [reset link]\nCopy this address if the link does not open: [reset URL]\n\nThis link works for 30 minutes and can be used once.\nIf you did not ask for this, ignore this email. Nothing changes.\n`);
console.log(`Created ${auth.length} auth, ${flows.length} flow, ${account.length} account/data and ${system.length} entry/system states for each web width.`);
