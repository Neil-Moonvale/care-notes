const COPY={
 zh:{navReconstruct:'重建',navRecords:'记录',title:'发生了什么？',subtitle:'不要再写一遍。Care Notes 从你已经留下的记录里，整理最近这段经历。',start:'开始重建最近几天',count:n=>`已有 ${n} 条记录可用于这次重建`,hint:'重建会保留原话、来源、不确定性和不同说法；它不会替你诊断，也不会自动把两条记录合成事实。',workingTitle:'最近这段时间发生了什么？',workingSubtitle:'下面是从现有记录整理出的经过、待确认问题和原始依据。',result:n=>`已从 ${n} 条现有记录生成可核对的经过`,back:'重新开始'},
 en:{navReconstruct:'Reconstruct',navRecords:'Records',title:'What happened?',subtitle:'Do not write it all again. Care Notes works from the records you already have.',start:'Reconstruct the last few days',count:n=>`${n} existing records are available for this reconstruction`,hint:'Reconstruction keeps original wording, sources, uncertainty and differing accounts. It does not diagnose or silently merge records into facts.',workingTitle:'What happened during this period?',workingSubtitle:'Below is the reconstructed sequence, what still needs clarification, and the source evidence.',result:n=>`Reviewable reconstruction generated from ${n} existing records`,back:'Start over'},
 es:{navReconstruct:'Reconstruir',navRecords:'Registros',title:'¿Qué pasó?',subtitle:'No vuelvas a escribirlo todo. Care Notes trabaja con los registros que ya tienes.',start:'Reconstruir los últimos días',count:n=>`Hay ${n} registros disponibles para esta reconstrucción`,hint:'La reconstrucción conserva el texto original, las fuentes, la incertidumbre y los distintos relatos. No diagnostica ni combina registros en hechos automáticamente.',workingTitle:'¿Qué pasó durante este período?',workingSubtitle:'Abajo se muestra la secuencia reconstruida, lo que falta por aclarar y las fuentes originales.',result:n=>`Reconstrucción revisable generada a partir de ${n} registros`,back:'Empezar de nuevo'},
 fr:{navReconstruct:'Reconstruire',navRecords:'Notes',title:'Que s’est-il passé ?',subtitle:'Ne réécrivez pas tout. Care Notes travaille à partir des notes déjà disponibles.',start:'Reconstruire les derniers jours',count:n=>`${n} notes existantes peuvent être utilisées`,hint:'La reconstruction conserve les mots d’origine, les sources, l’incertitude et les récits différents. Elle ne pose pas de diagnostic et ne fusionne jamais silencieusement des notes en faits.',workingTitle:'Que s’est-il passé pendant cette période ?',workingSubtitle:'Vous trouverez ci-dessous la chronologie reconstruite, les points à clarifier et les sources originales.',result:n=>`Reconstruction vérifiable générée à partir de ${n} notes`,back:'Recommencer'},
 ja:{navReconstruct:'再構成',navRecords:'記録',title:'何が起きた？',subtitle:'もう一度全部を書く必要はありません。Care Notes は、すでに残っている記録から最近の経過を整理します。',start:'最近数日を再構成する',count:n=>`${n}件の既存記録を再構成に使えます`,hint:'再構成では原文、情報源、不確実性、異なる記述をそのまま残します。診断は行わず、記録を自動で事実に統合しません。',workingTitle:'この期間に何が起きた？',workingSubtitle:'既存記録から整理した経過、確認が必要な点、元の根拠を表示しています。',result:n=>`${n}件の既存記録から確認可能な経過を生成しました`,back:'最初からやり直す'},
 ko:{navReconstruct:'재구성',navRecords:'기록',title:'무슨 일이 있었나요?',subtitle:'다시 전부 쓸 필요가 없습니다. Care Notes는 이미 남아 있는 기록으로 최근 경과를 정리합니다.',start:'최근 며칠 재구성하기',count:n=>`기존 기록 ${n}개를 이번 재구성에 사용할 수 있습니다`,hint:'재구성은 원문, 출처, 불확실성, 서로 다른 진술을 그대로 보존합니다. 진단하지 않으며 기록을 자동으로 하나의 사실로 합치지 않습니다.',workingTitle:'이 기간에 무슨 일이 있었나요?',workingSubtitle:'기존 기록에서 정리한 경과, 확인이 필요한 점, 원본 근거를 아래에 표시합니다.',result:n=>`기존 기록 ${n}개로 검토 가능한 경과를 만들었습니다`,back:'다시 시작'}
};

let started=false,queued=false;
const lang=()=>document.querySelector('#interface-language')?.value||'en';
const copy=()=>COPY[lang()]||COPY.en;
const episodeActive=()=>Boolean(document.querySelector('.nav button[data-view="episode"].active'));
const recordCount=()=>document.querySelectorAll('.selection-list input[data-select]').length;
const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
const setHidden=(el,hidden)=>{if(el&&el.hidden!==hidden)el.hidden=hidden;};

function patchNav(){
 const c=copy();
 setText(document.querySelector('.nav button[data-view="episode"] span'),c.navReconstruct);
 setText(document.querySelector('.nav button[data-view="timeline"] span'),c.navRecords);
}
function launchMarkup(c,n){return `<section id="cn-reconstruction-launch" class="reconstruction-launch"><div class="reconstruction-mark" aria-hidden="true">↻</div><div><p class="eyebrow">ZERO-INPUT EPISODE RECONSTRUCTION</p><h2>${c.title}</h2><p class="reconstruction-lead">${c.subtitle}</p><p class="small muted">${c.count(n)}</p><button type="button" class="btn primary reconstruction-start" data-cn-start-reconstruction>${c.start}</button><p class="small muted reconstruction-hint">${c.hint}</p></div></section>`;}
function resultMarkup(c,n){return `<section id="cn-reconstruction-result" class="reconstruction-result"><div><span class="reconstruction-status">✓</span><strong>${c.result(n)}</strong></div><button type="button" class="btn ghost" data-cn-reset-reconstruction>${c.back}</button></section>`;}
function patchEpisode(){
 if(!episodeActive())return;
 const c=copy(),main=document.querySelector('#main'),head=main?.querySelector('.page-head');
 if(!main||!head)return;
 const n=recordCount(),actions=head.querySelector('.actions'),capture=actions?.querySelector('[data-action="capture"]');
 setHidden(capture,true);
 const detail=main.querySelector('.method-note'),filters=main.querySelector('.episode-filters'),undated=main.querySelector('.episode-undated'),layout=main.querySelector('.summary-layout');
 if(!started){
  setText(head.querySelector('h1'),c.title);setText(head.querySelector('p'),c.subtitle);setHidden(actions,true);
  setHidden(detail,true);setHidden(filters,true);setHidden(undated,true);setHidden(layout,true);
  document.querySelector('#cn-reconstruction-result')?.remove();
  if(!document.querySelector('#cn-reconstruction-launch'))head.insertAdjacentHTML('afterend',launchMarkup(c,n));
 }else{
  setText(head.querySelector('h1'),c.workingTitle);setText(head.querySelector('p'),c.workingSubtitle);setHidden(actions,false);setHidden(capture,true);
  setHidden(detail,false);setHidden(filters,false);setHidden(undated,false);setHidden(layout,false);
  document.querySelector('#cn-reconstruction-launch')?.remove();
  if(!document.querySelector('#cn-reconstruction-result'))head.insertAdjacentHTML('afterend',resultMarkup(c,n));
 }
}
function patch(){queued=false;patchNav();patchEpisode();}
function queue(){if(queued)return;queued=true;queueMicrotask(patch);}

document.addEventListener('click',event=>{
 if(event.target.closest('[data-cn-start-reconstruction]')){started=true;patch();window.scrollTo({top:0,behavior:'smooth'});return;}
 if(event.target.closest('[data-cn-reset-reconstruction]')){started=false;patch();window.scrollTo({top:0,behavior:'smooth'});return;}
 const nav=event.target.closest('.nav button[data-view]');if(nav&&nav.dataset.view!=='episode')started=false;
});
document.addEventListener('change',event=>{if(event.target.id==='interface-language'){started=false;setTimeout(queue,0);}});
const app=document.querySelector('#app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
queue();
