import {activeSources,addAnalysis,addSource,reviseSource,reconstruct,reconstructionChanges} from './reconstruction-core.js';
import {demoLedger,correctDemoDate} from './reconstruction-demo.js';
import {reconstructionCopy} from './reconstruction-copy.js';

const root=document.querySelector('#reconstruction-app');
const status=document.querySelector('#reconstruction-status');
const labels={zh:'简体中文',en:'English',es:'Español',fr:'Français',ja:'日本語',ko:'한국어'};
const requested=new URL(location.href).searchParams.get('lang')||navigator.language.split('-')[0];
let lang=reconstructionCopy[requested]?requested:'en',sampleLang=lang;
let ledger=demoLedger(lang),result=reconstruct(ledger),changes=null,editing='',modified=false,corrected=false,configured=false,busy=false,revision=0,questionLimit=3,method='fixture',fictional=true;
const drafts={};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=()=>reconstructionCopy[lang];
const notice=message=>{status.textContent=message;clearTimeout(notice.timer);notice.timer=setTimeout(()=>status.textContent='',6000);};
const button=(action,label,attrs='')=>`<button type="button" data-action="${action}" ${attrs}>${esc(label)}</button>`;
const sourceName=id=>activeSources(ledger).find(s=>s.id===id)?.author||id;
function timeLabel(time) {
  if(!time.start)return t().unknownTime;
  const f=new Intl.DateTimeFormat(t().locale,{dateStyle:'medium',timeStyle:'short'});
  return `${f.format(new Date(time.start))} — ${f.format(new Date(time.end))} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
}
function update(next,{kind=method}={}) {
  const before=result;ledger=next;result=reconstruct(ledger,{questionLimit});changes=reconstructionChanges(before,result);method=kind;revision++;modified=true;render();
}
function render() {
  const c=t();document.documentElement.lang=c.locale;document.title=`Care Notes · ${c.title}`;
  const sources=activeSources(ledger),byClaim=new Map(result.claims.map(x=>[x.key,x]));
  const allClaims=new Map(ledger.analyses.flatMap(a=>a.claims.map(x=>[x.key,x])));
  const relationText=r=>`${sourceName(allClaims.get(r.from)?.sourceId)} / ${sourceName(allClaims.get(r.to)?.sourceId)}`;
  root.innerHTML=`<main><header><div><span class="brand">CARE NOTES</span> · <a href="./index.html">${esc(c.back)}</a></div><label>${esc(c.language)} <select id="lab-language">${Object.entries(labels).map(([code,name])=>`<option value="${code}" ${code===lang?'selected':''}>${esc(name)}</option>`).join('')}</select></label></header>
  <div class="intro"><span class="mode">${esc(method==='openai'?c.live:fictional?c.demo:c.local)}</span><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p></div>
  <div class="toolbar">${button('correct',corrected?c.corrected:c.correct,`class="primary" ${corrected||activeSources(ledger).find(s=>s.id==='e2')?.version!==1?'disabled':''}`)}${button('reset',c.reset)}${button('download',c.download)}</div>
  <div class="layout"><section class="panel"><h2>${esc(c.sources)}</h2>${sources.map(s=>`<article class="source" id="source-${esc(s.id)}"><div class="source-head"><h3>${esc(s.author)}</h3><span class="meta">${esc(s.id)} · ${esc(c.version)} ${s.version}</span></div>${editing===s.id?`<form id="edit-source" data-id="${esc(s.id)}"><label>${esc(c.sources)}<textarea name="text" required maxlength="5000">${esc(drafts[s.id]??s.text)}</textarea></label><button type="submit">${esc(c.save)}</button> ${button('cancel',c.cancel)}</form>`:`<p>${esc(s.text)}</p>${button('edit',c.edit,`data-id="${esc(s.id)}"`)}`}${result.unanalysed.includes(s.id)?`<p class="note">${esc(c.pending)}</p>`:''}<details><summary>${esc(c.history)}</summary>${ledger.sources.find(x=>x.id===s.id).versions.map(v=>`<p class="meta">${esc(c.version)} ${v.version}</p><blockquote>${esc(v.text)}</blockquote>`).join('')}</details></article>`).join('')}
  <form id="add-source"><label>${esc(c.add)}<textarea name="text" maxlength="5000" required>${esc(drafts.new??'')}</textarea></label><p class="meta">${esc(c.addHint)}</p><button type="submit">${esc(c.add)}</button></form>
  <section class="ai-controls"><p class="meta">${esc(configured?c.live:c.unavailable)}</p>${configured?`<label class="consent"><input id="ai-consent" type="checkbox"><span>${esc(c.consent)}</span></label>${button('analyse',busy?c.busy:c.analyse,busy?'disabled':'')}`:''}</section></section>
  <div><section class="panel changes" aria-live="polite"><h2>${esc(c.changes)}</h2>${changes?`<div class="changes-grid"><div><b>${changes.withdrawnClaims.length}</b>${esc(c.withdrawn)}</div><div><b>${changes.withdrawnRelations.length}</b>${esc(c.linksWithdrawn)}</div><div><b>${changes.addedClaims.length+changes.updatedClaims.length}</b>${esc(c.added)}</div></div>${changes.withdrawnClaims.map(x=>`<blockquote class="retired">${esc(x.quote)}</blockquote>`).join('')}${changes.updatedClaims.map(x=>`<blockquote>${esc(x.after.quote)}<div class="meta">${esc(timeLabel(x.before.time))} → ${esc(timeLabel(x.after.time))}</div></blockquote>`).join('')}${corrected?`<p class="meta">${esc(c.manual)}</p>`:''}`:`<p class="meta">${esc(c.noChanges)}</p>`}</section>
  <section class="panel"><h2>${esc(c.questions)}</h2>${result.questions.length?result.questions.map(q=>`<p><a href="#source-${esc(q.sourceId)}">${esc(sourceName(q.sourceId))}</a> — ${esc(q.kind==='time'?c.timeQuestion:c.sourceQuestion)}</p>`).join('')+button('skip',c.skip):`<p class="meta">${esc(c.none)}</p>`}</section>
  <section class="panel"><h2>${esc(c.relations)}</h2>${result.relations.map(r=>`<div class="relationship ${r.status==='withdrawn'?'retired':''}"><b>${esc(r.status==='withdrawn'?c.withdrawal:c[r.type])}</b><div class="meta">${esc(relationText(r))}</div></div>`).join('')}${result.order.slice(0,6).map(r=>`<div class="relationship"><b>${esc(c.order)}</b><div class="meta">${esc(sourceName(byClaim.get(r.from).sourceId))} → ${esc(sourceName(byClaim.get(r.to).sourceId))}</div></div>`).join('')}<p class="meta">${esc(c.scope)}</p></section>
  <section class="panel"><h2>${esc(c.accounts)}</h2>${result.claims.length?result.claims.map(x=>`<article class="account"><h3>${esc(sourceName(x.sourceId))}</h3><p class="meta">${esc(c.basis[x.basis])}</p><p>${esc(x.quote)}</p><p class="meta">${esc(timeLabel(x.time))}</p>${x.polarity==='unknown'?`<p class="note">${esc(c.unknownFact)}</p>`:''}<a href="#source-${esc(x.sourceId)}">${esc(c.history)} · ${esc(x.sourceId)} v${x.sourceVersion}</a></article>`).join(''):`<p>${esc(c.noClaims)}</p>`}</section></div></div></main><footer>${esc(c.scratch)}</footer>`;
}
root.addEventListener('click',async event=>{
  const b=event.target.closest('button[data-action]');if(!b||b.disabled)return;
  const c=t();
  try {
    switch(b.dataset.action) {
      case 'correct': {const next=correctDemoDate(ledger,sampleLang);corrected=true;update(next);notice(c.stateSaved);break;}
      case 'edit':editing=b.dataset.id;render();root.querySelector('textarea')?.focus();break;
      case 'cancel':editing='';render();break;
      case 'skip':questionLimit=0;result=reconstruct(ledger,{questionLimit});render();break;
      case 'reset':if(modified&&!confirm(c.resetConfirm))return;ledger=demoLedger(lang);sampleLang=lang;result=reconstruct(ledger);changes=null;modified=false;corrected=false;editing='';questionLimit=3;method='fixture';fictional=true;for(const key of Object.keys(drafts))delete drafts[key];revision++;render();break;
      case 'download':{const payload={format:'care-notes-reconstruction-review',version:1,method,fictional,ledger,result,changes};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='care-notes-reconstruction-review.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);break;}
      case 'analyse': {
        if(!configured||busy||!root.querySelector('#ai-consent')?.checked){notice(c.consent);return;}
        const sources=activeSources(ledger),snapshot=revision;busy=true;render();
        try {
          const response=await fetch('./api/reconstruct',{method:'POST',headers:{'Content-Type':'application/json','X-Care-Notes':'reconstruct'},body:JSON.stringify({sources,consent:true}),signal:AbortSignal.timeout(65000)});
          if(!response.ok)throw Error('request_failed');const body=await response.json();
          if(snapshot!==revision){notice(t().stale);return;}
          update(addAnalysis(ledger,body.proposal,{sources,method:'openai'}),{kind:'openai'});
        }catch{notice(t().failed);}finally{busy=false;render();}
        break;
      }
    }
  } catch {notice(c.failed);}
});
root.addEventListener('submit',event=>{
  if(!['edit-source','add-source'].includes(event.target.id))return;event.preventDefault();
  const text=new FormData(event.target).get('text')?.trim();if(!text)return;
  try {
    fictional=false;
    if(event.target.id==='edit-source'){const id=event.target.dataset.id,source=activeSources(ledger).find(s=>s.id===id);editing='';delete drafts[id];update(reviseSource(ledger,id,{text},source.version));}
    else {delete drafts.new;update(addSource(ledger,{id:`added-${crypto.randomUUID()}`,text,author:t().newAuthor,recordedAt:new Date().toISOString()}));}
    notice(t().stateSaved);
  }catch{notice(t().failed);}
});
root.addEventListener('input',event=>{if(event.target.matches('textarea')){const form=event.target.closest('form');drafts[form.dataset.id||'new']=event.target.value;}});
root.addEventListener('change',event=>{
  if(event.target.id!=='lab-language')return;lang=event.target.value;
  if(!modified){ledger=demoLedger(lang);sampleLang=lang;result=reconstruct(ledger,{questionLimit});}
  render();
});
render();
fetch('./api/status').then(r=>r.ok?r.json():{}).then(body=>{configured=body.reconstructionConfigured===true;render();}).catch(()=>{});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
