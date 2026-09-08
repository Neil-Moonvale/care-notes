import {createLedger,activeSources,addAnalysis,addSource,reviseSource,reconstruct,reconstructionChanges} from './reconstruction-core.js';
import {demoLedger,correctDemoDate} from './reconstruction-demo.js';
import {reconstructionCopy} from './reconstruction-copy.js';
import {mobileCopy} from './mobile-copy.js';
import {WORKSPACE_KEY,restoreWorkspace,workspaceJSON,handoffText} from './reconstruction-workspace.js';

const root=document.querySelector('#reconstruction-app');
const status=document.querySelector('#reconstruction-status');
const labels={zh:'简体中文',en:'English',es:'Español',fr:'Français',ja:'日本語',ko:'한국어'};
const requested=new URL(location.href).searchParams.get('lang')||navigator.language.split('-')[0];
let lang=reconstructionCopy[requested]?requested:'en',sampleLang=lang;
let mode=new URL(location.href).searchParams.get('mode')==='demo'?'demo':'own',own=createLedger(),storageOK=true;
try{const raw=localStorage.getItem(WORKSPACE_KEY);if(raw)own=restoreWorkspace(raw);}catch{storageOK=false;}
let demoModified=false;
let example=demoLedger(lang),ledger=mode==='demo'?example:own,result=reconstruct(ledger),changes=null,editing='',modified=false,corrected=false,configured=false,busy=false,revision=0,questionLimit=3,method=mode==='demo'?'fixture':own.analyses.at(-1)?.method||'manual',fictional=mode==='demo';
let connection={provider:'openai',model:'',apiKey:''},providers=[],checked=false,connectionOpen=true,testConsent=false,sendConsent=false,reviewed=false,controller=null;
const drafts={};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=()=>reconstructionCopy[lang];
const m=()=>mobileCopy[lang];
const notice=message=>{status.textContent=message;};
const button=(action,label,attrs='')=>`<button type="button" data-action="${action}" ${attrs}>${esc(label)}</button>`;
const sourceName=id=>activeSources(ledger).find(s=>s.id===id)?.author||id;
function timeLabel(time) {
  if(!time.start)return t().unknownTime;
  const f=new Intl.DateTimeFormat(t().locale,{dateStyle:'medium',timeStyle:'short'});
  return `${f.format(new Date(time.start))} — ${f.format(new Date(time.end))} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
}
function update(next,{kind=method}={}) {
  if(workspaceJSON(next).length>4000000)throw Error('too_large');
  if(mode==='demo')demoModified=true;
  const before=result;ledger=next;result=reconstruct(ledger,{questionLimit});changes=reconstructionChanges(before,result);method=kind;revision++;modified=true;reviewed=false;sendConsent=false;persist();render();
}
function persist(){if(mode==='demo'){example=ledger;return;}own=ledger;if(!storageOK)return;try{localStorage.setItem(WORKSPACE_KEY,workspaceJSON(ledger));}catch{storageOK=false;}}
function localTimestamp(){const now=new Date(),minutes=-now.getTimezoneOffset();return new Date(now.getTime()+minutes*60000).toISOString().slice(0,-1)+(minutes<0?'-':'+')+String(Math.floor(Math.abs(minutes)/60)).padStart(2,'0')+':'+String(Math.abs(minutes)%60).padStart(2,'0');}
function hasEdits(){return Boolean(editing||drafts.new?.trim());}
function clearDrafts(){for(const key of Object.keys(drafts))delete drafts[key];editing='';}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function settings(){const c=m();return `<details class="panel connection" id="connection-panel" ${connectionOpen?'open':''}><summary>${esc(c.setup)}${checked?' · '+esc(connection.model):''}</summary><fieldset ${busy?'disabled':''}>
  <label>${esc(c.provider)}<select id="provider">${(providers.length?providers:[{id:'openai',name:'OpenAI'},{id:'deepseek',name:'DeepSeek'}]).map(p=>`<option value="${esc(p.id)}" ${p.id===connection.provider?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
  <p class="meta">${esc(c.destination)}: ${esc(providers.find(p=>p.id===connection.provider)?.origin||'—')}</p>
  <label>${esc(c.model)}<input id="model" value="${esc(connection.model)}" maxlength="128" autocomplete="off" autocapitalize="none" spellcheck="false"></label><p class="meta">${esc(c.modelHint)}</p>
  <label>${esc(c.key)}<input id="api-key" type="password" value="${esc(connection.apiKey)}" maxlength="512" autocomplete="off" autocapitalize="none" spellcheck="false"></label><p class="meta">${esc(c.keyHint)}</p>
  <label class="consent"><input id="test-consent" type="checkbox" ${testConsent?'checked':''}><span>${esc(c.testConsent)}</span></label>
  <div class="toolbar">${button('test',busy?t().busy:c.test,!configured||busy?'disabled':'')}${button('disconnect',c.disconnect)}</div></fieldset>
  ${checked?`<p class="note">${esc(c.checked)}</p>`:''}${!configured?`<p class="note">${esc(c.offline)}</p>`:''}</details>`;}
async function modelRequest(checking){
  if(busy||!configured)return;
  if(checking?!testConsent:!sendConsent){notice(checking?m().testConsent:m().sendConsent);return;}
  if(!checking&&ledger.analyses.length>=100){notice(m().errors.too_large);return;}
  if(!checking&&(!checked||hasEdits())){notice(hasEdits()?m().pendingEdits:m().testFirst);return;}
  const snapshot=revision,sources=activeSources(ledger),selected={...connection};busy=true;notice(t().busy);controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),65000);render();
  try{
    const response=await fetch(checking?'./api/mobile/check':'./api/mobile/reconstruct',{method:'POST',headers:{'Content-Type':'application/json','X-Care-Notes':'mobile-ai'},body:JSON.stringify({connection:selected,consent:true,...(checking?{}:{sources})}),signal:controller.signal});
    const body=await response.json();if(!response.ok)throw Error(body.error||'analysis_failed');
    if(snapshot!==revision){notice(t().stale);return;}
    if(checking){if(body.checked!==true)throw Error('check_failed');checked=true;connectionOpen=false;notice(m().checked);}
    else{update(addAnalysis(ledger,body.proposal,{sources,method:'model'}),{kind:'model'});notice(t().live);}
  }catch(error){notice(error.name==='AbortError'?m().errors.provider_timeout:m().errors[error.message]||m().errors.analysis_failed);}
  finally{clearTimeout(timeout);controller=null;busy=false;sendConsent=false;testConsent=false;render();}
}
function render() {
  const c=t(),u=m();document.documentElement.lang=c.locale;document.title=`Care Notes · ${mode==='demo'?c.title:u.title}`;
  const sources=activeSources(ledger),byClaim=new Map(result.claims.map(x=>[x.key,x]));
  const allClaims=new Map(ledger.analyses.flatMap(a=>a.claims.map(x=>[x.key,x])));
  const relationText=r=>`${sourceName(allClaims.get(r.from)?.sourceId)} / ${sourceName(allClaims.get(r.to)?.sourceId)}`;
  root.innerHTML=`<main><header><div><span class="brand">CARE NOTES</span> · <a href="./index.html">${esc(c.back)}</a></div><label>${esc(c.language)} <select id="lab-language">${Object.entries(labels).map(([code,name])=>`<option value="${code}" ${code===lang?'selected':''}>${esc(name)}</option>`).join('')}</select></label></header>
  <nav class="toolbar">${button('own',u.own,`aria-pressed="${mode==='own'}" ${busy?'disabled':''}`)}${button('demo',u.demo,`aria-pressed="${mode==='demo'}" ${busy?'disabled':''}`)}</nav><div class="intro"><span class="mode">${esc(['openai','model'].includes(method)?c.live:mode==='demo'&&fictional?c.demo:c.local)}</span><h1>${esc(mode==='demo'?c.title:u.title)}</h1><p>${esc(mode==='demo'?c.intro:u.intro)}</p></div>
  ${mode==='demo'?`<div class="toolbar">${button('correct',corrected?c.corrected:c.correct,`class="primary" ${corrected||activeSources(ledger).find(s=>s.id==='e2')?.version!==1?'disabled':''}`)}${button('reset',c.reset)}</div>`:''}
  <div class="layout"><div>${settings()}<section class="panel"><h2>${esc(c.sources)} · ${sources.length}</h2>${sources.length?'':`<p>${esc(u.empty)}</p>`}${sources.map(s=>`<article class="source" id="source-${esc(s.id)}"><div class="source-head"><h3>${esc(s.author)}</h3><span class="meta">${esc(s.id)} · ${esc(c.version)} ${s.version}</span></div>${editing===s.id?`<form id="edit-source" data-id="${esc(s.id)}"><label>${esc(c.sources)}<textarea name="text" required maxlength="5000">${esc(drafts[s.id]??s.text)}</textarea></label><button type="submit">${esc(c.save)}</button> ${button('cancel',c.cancel)}</form>`:`<p>${esc(s.text)}</p>${button('edit',c.edit,`data-id="${esc(s.id)}"`)}`}${result.unanalysed.includes(s.id)?`<p class="note">${esc(c.pending)}</p>`:''}<details><summary>${esc(c.history)}</summary>${ledger.sources.find(x=>x.id===s.id).versions.map(v=>`<p class="meta">${esc(c.version)} ${v.version}</p><blockquote>${esc(v.text)}</blockquote>`).join('')}</details></article>`).join('')}
  <form id="add-source"><label>${esc(c.add)}<textarea name="text" maxlength="5000" required>${esc(drafts.new??'')}</textarea></label><label>${esc(u.author)}<input name="author" maxlength="80" value="${esc(drafts.author??'')}"></label><p class="meta">${esc(c.addHint)}</p><button type="submit" ${sources.length>=40?'disabled':''}>${esc(c.add)}</button></form>
  <section class="ai-controls"><p class="meta">${esc(u.destination)}: ${esc(providers.find(p=>p.id===connection.provider)?.name||connection.provider)} / ${esc(connection.model||'—')}</p><label class="consent"><input id="send-consent" type="checkbox" ${sendConsent?'checked':''}><span>${esc(u.sendConsent)}</span></label>${button('analyse',busy?c.busy:u.send,`class="primary" ${!checked||!configured||busy||!sources.length?'disabled':''}`)}${!checked?`<p class="meta">${esc(u.testFirst)}</p>`:''}</section></section>
  <section class="panel"><p class="meta">${esc(mode==='demo'?u.exampleOnly:storageOK?u.saved:u.storageFailed)}</p><div class="toolbar">${button('download',u.backup)}<label class="button">${esc(u.restore)}<input id="restore" type="file" accept=".json,application/json" ${busy?'disabled':''}></label>${mode==='own'?button('clear',u.clear,busy?'disabled':''):''}</div></section></div>
  <div>  <section class="panel"><h2>${esc(c.accounts)}</h2>${result.claims.length?result.claims.map(x=>`<article class="account"><h3>${esc(sourceName(x.sourceId))}</h3><p class="meta">${esc(c.basis[x.basis])}</p><p>${esc(x.quote)}</p><p class="meta">${esc(timeLabel(x.time))}</p>${x.polarity==='unknown'?`<p class="note">${esc(c.unknownFact)}</p>`:''}<a href="#source-${esc(x.sourceId)}">${esc(c.history)} · ${esc(x.sourceId)} v${x.sourceVersion}</a></article>`).join(''):`<p>${esc(c.noClaims)}</p>`}</section><section class="panel changes" aria-live="polite"><h2>${esc(c.changes)}</h2>${changes?`<div class="changes-grid"><div><b>${changes.withdrawnClaims.length}</b>${esc(c.withdrawn)}</div><div><b>${changes.withdrawnRelations.length}</b>${esc(c.linksWithdrawn)}</div><div><b>${changes.addedClaims.length+changes.updatedClaims.length}</b>${esc(c.added)}</div></div>${changes.withdrawnClaims.map(x=>`<blockquote class="retired">${esc(x.quote)}</blockquote>`).join('')}${changes.updatedClaims.map(x=>`<blockquote>${esc(x.after.quote)}<div class="meta">${esc(timeLabel(x.before.time))} → ${esc(timeLabel(x.after.time))}</div></blockquote>`).join('')}${corrected?`<p class="meta">${esc(c.manual)}</p>`:''}`:`<p class="meta">${esc(c.noChanges)}</p>`}</section>
  <section class="panel"><h2>${esc(c.questions)}</h2>${result.questions.length?result.questions.map(q=>`<p><a href="#source-${esc(q.sourceId)}">${esc(sourceName(q.sourceId))}</a> — ${esc(q.kind==='time'?c.timeQuestion:c.sourceQuestion)}</p>${button('edit',c.edit,`data-id="${esc(q.sourceId)}"`)}`).join('')+button('skip',c.skip):`<p class="meta">${esc(c.none)}</p>`}</section>
  <section class="panel"><h2>${esc(c.relations)}</h2>${result.relations.map(r=>`<div class="relationship ${r.status==='withdrawn'?'retired':''}"><b>${esc(r.status==='withdrawn'?c.withdrawal:c[r.type])}</b><div class="meta">${esc(relationText(r))}</div></div>`).join('')}${result.order.slice(0,6).map(r=>`<div class="relationship"><b>${esc(c.order)}</b><div class="meta">${esc(sourceName(byClaim.get(r.from).sourceId))} → ${esc(sourceName(byClaim.get(r.to).sourceId))}</div></div>`).join('')}<p class="meta">${esc(c.scope)}</p></section>
<section class="panel"><p>${esc(reviewed?u.reviewed:u.reviewNeeded)}</p><div class="toolbar">${button('review',u.review,!result.claims.length||busy||reviewed?'disabled':'')}${button('handoff',u.handoff,!reviewed||busy?'disabled':'')}</div></section></div></div></main><footer>${esc(u.privacy)}</footer>`;
}
root.addEventListener('click',async event=>{
  const b=event.target.closest('button[data-action]');if(!b||b.disabled)return;
  const c=t();
  try {
    switch(b.dataset.action) {
      case 'correct': {if(busy)return;const next=correctDemoDate(ledger,sampleLang);corrected=true;update(next);notice(c.stateSaved);break;}
      case 'edit':editing=b.dataset.id;render();root.querySelector('#edit-source textarea')?.focus();break;
      case 'cancel':delete drafts[editing];editing='';render();break;
      case 'skip':questionLimit=0;result=reconstruct(ledger,{questionLimit});render();break;
      case 'reset':if(busy)return;if(modified&&!confirm(c.resetConfirm))return;ledger=demoLedger(lang);sampleLang=lang;result=reconstruct(ledger);changes=null;modified=false;demoModified=false;corrected=false;editing='';questionLimit=3;method='fixture';fictional=true;for(const key of Object.keys(drafts))delete drafts[key];reviewed=false;sendConsent=false;persist();revision++;render();break;
      case 'download':download(workspaceJSON(ledger),'care-notes-workspace.json','application/json');break;
      case 'test':await modelRequest(true);break;
      case 'analyse':await modelRequest(false);break;
      case 'disconnect':connection.apiKey='';checked=false;testConsent=false;sendConsent=false;connectionOpen=true;render();break;
      case 'review':if(hasEdits()){notice(m().pendingEdits);return;}reviewed=true;render();break;
      case 'handoff':if(reviewed&&!hasEdits())download(handoffText(ledger,t(),timeLabel),'care-notes-handoff.txt','text/plain;charset=utf-8');else notice(m().pendingEdits);break;
      case 'own':case 'demo':{
        if(b.dataset.action===mode)return;if(hasEdits()&&!confirm(t().resetConfirm))return;persist();mode=b.dataset.action;if(mode==='demo'&&!demoModified){example=demoLedger(lang);sampleLang=lang;}ledger=mode==='own'?own:example;method=ledger.analyses.at(-1)?.method||'manual';fictional=mode==='demo'&&!demoModified;result=reconstruct(ledger);changes=null;corrected=false;reviewed=false;sendConsent=false;questionLimit=3;revision++;clearDrafts();render();break;
      }
      case 'clear':if(!confirm(m().clearConfirm))return;try{localStorage.removeItem(WORKSPACE_KEY);storageOK=true;}catch{storageOK=false;}clearDrafts();update(createLedger(),{kind:'manual'});break;
    }
  } catch {notice(c.failed);}
});
root.addEventListener('submit',event=>{
  if(!['edit-source','add-source'].includes(event.target.id))return;event.preventDefault();
  const form=new FormData(event.target),text=form.get('text')?.trim();if(!text)return;
  try {
    fictional=false;
    if(event.target.id==='edit-source'){const id=event.target.dataset.id,source=activeSources(ledger).find(s=>s.id===id);update(reviseSource(ledger,id,{text},source.version));editing='';delete drafts[id];render();}
    else {update(addSource(ledger,{id:`e-${crypto.randomUUID()}`,text,author:form.get('author')?.trim()||m().unknownAuthor,recordedAt:localTimestamp()}));delete drafts.new;delete drafts.author;render();}
    notice(mode==='demo'?m().exampleOnly:storageOK?m().saved:m().storageFailed);
  }catch{notice(t().failed);}
});
root.addEventListener('input',event=>{
  const el=event.target;
  if(el.matches('textarea')){const form=el.closest('form');drafts[form.dataset.id||'new']=el.value;reviewed=false;}
  if(el.name==='author')drafts.author=el.value;
  if(el.id==='api-key'||el.id==='model'){connection[el.id==='api-key'?'apiKey':'model']=el.value.trim();checked=false;sendConsent=false;testConsent=false;for(const id of ['send-consent','test-consent']){const box=root.querySelector('#'+id);if(box)box.checked=false;}const send=root.querySelector('[data-action=analyse]');if(send)send.disabled=true;}
});
root.addEventListener('toggle',event=>{if(event.target.id==='connection-panel')connectionOpen=event.target.open;},true);
root.addEventListener('change',async event=>{
  const el=event.target;
  if(el.id==='test-consent')testConsent=el.checked;
  if(el.id==='send-consent')sendConsent=el.checked;
  if(el.id==='provider'){connection={provider:el.value,apiKey:'',model:''};checked=false;testConsent=false;sendConsent=false;render();}
  if(el.id==='lab-language'){lang=el.value;if(mode==='demo'&&!demoModified){sampleLang=lang;ledger=demoLedger(lang);example=ledger;result=reconstruct(ledger);}sendConsent=false;testConsent=false;render();}
  if(el.id==='restore'&&el.files[0]){
    const file=el.files[0];if(file.size>4000000){notice(m().badBackup);return;}
    try{const next=restoreWorkspace(await file.text());if(!confirm(m().restoreConfirm))return;mode='own';clearDrafts();storageOK=true;update(next,{kind:next.analyses.at(-1)?.method||'manual'});notice(storageOK?m().saved:m().storageFailed);}catch{notice(m().badBackup);}
  }
});
window.addEventListener('pagehide',()=>{connection.apiKey='';checked=false;controller?.abort();});
window.addEventListener('pageshow',event=>{if(event.persisted)render();});
render();
function refreshAvailability(){fetch('./api/mobile/status',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(body=>{configured=body.available===true;providers=Array.isArray(body.providers)?body.providers:[];render();}).catch(()=>{});}
refreshAvailability();
window.addEventListener('online',refreshAvailability);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
