import {demoKey,loadLocalizedDemo} from './demo-locales.js';
import {validateBackup,linkRecords} from './core.js';
import {suggestEpisodeLinks} from './episode.js';
import {chooseLanguage} from './locales.js';

const PERSONAL_KEY='care-notes.records.v1';
const COPY={
 zh:{title:'可能属于同一段变化',hint:'Care Notes 只根据“同一类别 + 时间接近”提出候选。它不会自动合并，也不代表两条记录一定说的是同一件事。',accept:'关联这两条',reject:'不是同一段',accepted:'已关联。两条原始记录仍会分别保留。',rejected:'已忽略这个候选。',source:'原始记录'},
 en:{title:'May belong to the same change period',hint:'Care Notes only uses a conservative same-category + close-time rule here. It never merges records automatically and this is not a claim that the accounts describe the same event.',accept:'Link these records',reject:'Not the same period',accepted:'Linked. Both source records remain separate and reviewable.',rejected:'Candidate dismissed.',source:'Source record'},
 es:{title:'Podrían pertenecer al mismo período de cambio',hint:'Care Notes solo usa una regla conservadora de misma categoría + tiempo cercano. Nunca combina registros automáticamente ni afirma que describan el mismo evento.',accept:'Vincular estos registros',reject:'No es el mismo período',accepted:'Vinculados. Los dos registros originales siguen separados y revisables.',rejected:'Candidato descartado.',source:'Registro original'},
 fr:{title:'Peuvent appartenir à la même période de changement',hint:'Care Notes utilise ici uniquement une règle prudente : même catégorie et horaires proches. Les notes ne sont jamais fusionnées automatiquement et cela n’affirme pas qu’elles décrivent le même événement.',accept:'Relier ces deux notes',reject:'Pas la même période',accepted:'Notes reliées. Les deux sources restent séparées et vérifiables.',rejected:'Candidat écarté.',source:'Note source'},
 ja:{title:'同じ変化の期間かもしれません',hint:'Care Notes は「同じカテゴリ + 時間が近い」という慎重なルールだけで候補を示します。自動で記録を統合せず、同じ出来事だと断定もしません。',accept:'この2件を関連付ける',reject:'同じ期間ではない',accepted:'関連付けました。2件の元記録は別々に残り、確認できます。',rejected:'この候補を除外しました。',source:'元の記録'},
 ko:{title:'같은 변화 기간일 수 있습니다',hint:'Care Notes는 “같은 분류 + 가까운 시간”이라는 보수적인 규칙만으로 후보를 제안합니다. 기록을 자동으로 합치지 않으며 같은 사건이라고 단정하지도 않습니다.',accept:'이 두 기록 연결',reject:'같은 기간이 아님',accepted:'연결했습니다. 두 원본 기록은 각각 그대로 남아 검토할 수 있습니다.',rejected:'이 후보를 제외했습니다.',source:'원본 기록'}
};

function language(){
 const saved=localStorage.getItem('care-notes.lang');
 return chooseLanguage(saved?[saved]:navigator.languages||[navigator.language]);
}
function mode(){return localStorage.getItem('care-notes.mode')==='mine'?'mine':'demo';}
function rejectionKey(m=mode(),lang=language()){return `care-notes.rejected-suggestions.v1.${m==='mine'?'mine':`demo.${lang}`}`;}
function rejected(m=mode(),lang=language()){
 try{const value=JSON.parse(localStorage.getItem(rejectionKey(m,lang))||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string').slice(0,500):[];}catch{return [];}
}
function saveRejected(values,m=mode(),lang=language()){
 try{localStorage.setItem(rejectionKey(m,lang),JSON.stringify([...new Set(values)].slice(-500)));}catch{}
}
function loadRecords(m=mode(),lang=language()){
 try{
  if(m==='mine'){
   const raw=localStorage.getItem(PERSONAL_KEY);return raw?validateBackup(JSON.parse(raw)):[];
  }
  return loadLocalizedDemo(localStorage,lang);
 }catch{return [];}
}
function saveRecords(records,m=mode(),lang=language()){
 const clean=validateBackup({format:'care-notes',version:2,records});
 const key=m==='mine'?PERSONAL_KEY:demoKey(lang);
 localStorage.setItem(key,JSON.stringify({format:'care-notes',version:2,records:clean}));
 return clean;
}
function selectedRecords(all){
 const boxes=[...document.querySelectorAll('.selection-list input[data-select]')];
 if(!boxes.length)return [];
 const ids=new Set(boxes.filter(b=>b.checked).map(b=>b.dataset.select));
 return all.filter(r=>ids.has(r.id));
}
function toast(message){
 const el=document.querySelector('#toast');if(!el)return;
 el.textContent=message;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),3500);
}
function recordLine(r){return [r.date,r.time,r.when].filter(Boolean).join(' · ');}
function addText(parent,tag,text,className=''){
 const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;
}
function currentSuggestions(){
 const lang=language(),m=mode(),all=loadRecords(m,lang),selected=selectedRecords(all);
 return {lang,m,all,suggestions:suggestEpisodeLinks(selected,{rejectedSuggestionIds:rejected(m,lang)})};
}

function render(){
 const mount=document.querySelector('.episode-questions .panel-body');
 const old=document.querySelector('#care-notes-link-suggestions');
 if(!mount){old?.remove();return;}
 const state=currentSuggestions();
 const signature=`${state.m}|${state.lang}|${state.suggestions.map(s=>s.suggestion_id).join(',')}`;
 if(old?.dataset.signature===signature)return;
 old?.remove();
 if(!state.suggestions.length)return;
 const c=COPY[state.lang]||COPY.en,byId=new Map(state.all.map(r=>[r.id,r]));
 const section=document.createElement('section');section.id='care-notes-link-suggestions';section.className='suggestion-review';section.dataset.signature=signature;
 addText(section,'h3',c.title);
 addText(section,'p',c.hint,'small muted');
 for(const s of state.suggestions){
  const pair=s.evidence_ids.map(id=>byId.get(id)).filter(Boolean);if(pair.length!==2)continue;
  const card=document.createElement('article');card.className='paper-record suggestion-card';card.dataset.suggestionId=s.suggestion_id;
  for(const r of pair){
   const source=document.createElement('div');source.className='suggestion-source';
   addText(source,'small',`${recordLine(r)} · ${c.source} ${r.id}`,'muted');
   addText(source,'p',r.text,'quote');card.append(source);
  }
  const actions=document.createElement('div');actions.className='actions';
  const accept=document.createElement('button');accept.type='button';accept.className='btn primary';accept.textContent=c.accept;accept.dataset.cnSuggestionAccept=s.suggestion_id;
  const reject=document.createElement('button');reject.type='button';reject.className='btn line';reject.textContent=c.reject;reject.dataset.cnSuggestionReject=s.suggestion_id;
  actions.append(accept,reject);card.append(actions);section.append(card);
 }
 mount.append(section);
}

function findSuggestion(id){return currentSuggestions().suggestions.find(s=>s.suggestion_id===id);}
function acceptSuggestion(id){
 const lang=language(),m=mode(),all=loadRecords(m,lang),s=findSuggestion(id);if(!s)return;
 const [firstId,secondId]=s.evidence_ids,first=all.find(r=>r.id===firstId);if(!first||!all.some(r=>r.id===secondId))return;
 try{
  const next=linkRecords(all,{...first},secondId);saveRecords(next,m,lang);
  saveRejected(rejected(m,lang).filter(x=>x!==id),m,lang);
  toast((COPY[lang]||COPY.en).accepted);
  setTimeout(()=>location.reload(),120);
 }catch{toast('Care Notes: unable to save this review.');}
}
function rejectSuggestion(id){
 const lang=language(),m=mode();saveRejected([...rejected(m,lang),id],m,lang);toast((COPY[lang]||COPY.en).rejected);render();
}

let queued=false;
function queueRender(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render();});}
const app=document.querySelector('#app');if(app)new MutationObserver(queueRender).observe(app,{childList:true,subtree:true});
document.addEventListener('change',queueRender);
document.addEventListener('click',event=>{
 const accept=event.target.closest('[data-cn-suggestion-accept]');if(accept){acceptSuggestion(accept.dataset.cnSuggestionAccept);return;}
 const reject=event.target.closest('[data-cn-suggestion-reject]');if(reject){rejectSuggestion(reject.dataset.cnSuggestionReject);return;}
 const reset=event.target.closest('[data-action="reset-demo"]');if(reset){saveRejected([], 'demo', language());setTimeout(queueRender,0);}
});
queueRender();
