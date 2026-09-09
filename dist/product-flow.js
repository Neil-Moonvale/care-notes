// Product-flow enhancement: keep recording and reconstruction visibly separate.
// This layer changes presentation only; it does not alter evidence or reconstruction logic.
const COPY={
 zh:{reconstruct:'重建',records:'记录',title:'发生了什么？',hint:'先让 Care Notes 从已有记录里把最近这段经历拼一遍。',start:'开始重建最近几天',pre:'重建只使用你已经留下的记录。原话不会被改写；不知道的地方仍然保持不知道。',result:'重建结果',resultHint:'下面是根据当前已选记录整理出的经过、待核实问题和原始依据。',goRecords:'先去补充记录',recordsHint:'这里只负责留下原始观察。写东西、修改记录都在这里；“重建”在单独的页面完成。',capture:'一段话记下来'},
 en:{reconstruct:'Reconstruct',records:'Records',title:'What happened?',hint:'Let Care Notes assemble the recent period from the records you already have.',start:'Reconstruct the recent days',pre:'Reconstruction only uses existing records. Original wording is preserved, and unknowns stay unknown.',result:'Reconstruction result',resultHint:'Below is the assembled sequence, open questions and source evidence from the currently selected records.',goRecords:'Add records first',recordsHint:'This is the evidence inbox. Capture and correct observations here; reconstruction happens in its own workflow.',capture:'Write an account'},
 es:{reconstruct:'Reconstruir',records:'Registros',title:'¿Qué pasó?',hint:'Deja que Care Notes reconstruya el período reciente a partir de los registros que ya tienes.',start:'Reconstruir los últimos días',pre:'La reconstrucción solo usa registros existentes. Conserva las palabras originales y mantiene lo desconocido como desconocido.',result:'Resultado de la reconstrucción',resultHint:'Abajo aparecen la secuencia organizada, las preguntas pendientes y las fuentes de los registros seleccionados.',goRecords:'Añadir registros primero',recordsHint:'Aquí se guardan las observaciones originales. Escribe y corrige aquí; la reconstrucción se hace aparte.',capture:'Escribir un relato'},
 fr:{reconstruct:'Reconstruire',records:'Notes',title:'Que s’est-il passé ?',hint:'Laissez Care Notes reconstituer la période récente à partir des notes déjà disponibles.',start:'Reconstruire les derniers jours',pre:'La reconstruction utilise uniquement les notes existantes. Les mots d’origine sont conservés et les inconnues restent inconnues.',result:'Résultat de la reconstruction',resultHint:'Vous trouverez ci-dessous la séquence organisée, les questions ouvertes et les sources des notes sélectionnées.',goRecords:'Ajouter d’abord des notes',recordsHint:'Ici, vous conservez les observations d’origine. La saisie et les corrections se font ici ; la reconstruction est séparée.',capture:'Saisir un récit'},
 ja:{reconstruct:'再構成',records:'記録',title:'何が起きた？',hint:'すでに残っている記録から、最近の経過を Care Notes に組み立てさせます。',start:'最近数日を再構成',pre:'再構成に使うのは既存の記録だけです。元の言葉は書き換えず、不明な点は不明のまま残します。',result:'再構成の結果',resultHint:'現在選択している記録から整理した経過、確認事項、元の根拠を表示します。',goRecords:'先に記録を追加',recordsHint:'ここは元の観察を残す場所です。入力と修正はここで行い、再構成は別の画面で行います。',capture:'文章で記録'},
 ko:{reconstruct:'재구성',records:'기록',title:'무슨 일이 있었나요?',hint:'이미 남아 있는 기록을 바탕으로 Care Notes가 최근 경과를 먼저 정리합니다.',start:'최근 며칠 재구성',pre:'재구성은 기존 기록만 사용합니다. 원문을 바꾸지 않고, 모르는 내용은 모르는 상태로 유지합니다.',result:'재구성 결과',resultHint:'현재 선택한 기록을 바탕으로 정리한 경과, 확인할 질문, 원본 근거를 아래에 표시합니다.',goRecords:'먼저 기록 추가',recordsHint:'여기는 원본 관찰을 남기는 곳입니다. 입력과 수정은 여기에서 하고, 재구성은 별도 화면에서 진행합니다.',capture:'설명 입력'}
};
let started=false,queued=false;
try{started=sessionStorage.getItem('care-notes.reconstruction.started')==='1';}catch{}
function lang(){
 const saved=localStorage.getItem('care-notes.lang');
 if(saved&&COPY[saved])return saved;
 const code=(document.documentElement.lang||'en').toLowerCase().split('-')[0];
 return COPY[code]?code:'en';
}
function copy(){return COPY[lang()]||COPY.en;}
function text(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function clickView(view){document.querySelector(`.nav button[data-view="${view}"]`)?.click();}
function intro(head,count){
 const c=copy();let section=document.querySelector('#cn-reconstruction-intro');
 if(!section){section=document.createElement('section');section.id='cn-reconstruction-intro';section.className='panel cn-reconstruction-intro';head.insertAdjacentElement('afterend',section);}
 section.innerHTML=`<div class="panel-body"><span class="eyebrow">CARE NOTES / EPISODE RECONSTRUCTION</span><h2>${c.start}</h2><p>${c.pre}</p><p class="small muted">${count} ${lang()==='zh'?'条已有记录将进入本次重建候选。':'records are available for this reconstruction.'}</p><div class="actions"><button class="btn primary" type="button" data-cn-start-reconstruction>${c.start}</button><button class="btn line" type="button" data-cn-go-records>${c.goRecords}</button></div></div>`;
 section.hidden=started;
}
function enhance(){
 const c=copy();
 for(const b of document.querySelectorAll('.nav button[data-view]')){
  const label=b.querySelector('span');if(!label)continue;
  if(b.dataset.view==='episode')text(label,c.reconstruct);
  if(b.dataset.view==='timeline')text(label,c.records);
 }
 const active=document.querySelector('.nav button[aria-current="page"]')?.dataset.view;
 const main=document.querySelector('#main');if(!main)return;
 if(active==='episode'){
  const head=[...main.children].find(el=>el.classList?.contains('page-head'));if(!head)return;
  const h1=head.querySelector('h1'),p=head.querySelector('p');
  text(h1,started?c.result:c.title);text(p,started?c.resultHint:c.hint);
  const capture=head.querySelector('[data-action="capture"]');if(capture)capture.style.display='none';
  const exportBtn=head.querySelector('[data-action="episode-export"]');if(exportBtn)exportBtn.style.display=started?'':'none';
  const count=main.querySelectorAll('.selection-list input[data-select]').length;
  intro(head,count);
  let after=false;
  for(const child of [...main.children]){
   if(child===head){after=true;continue;}
   if(!after||child.id==='cn-reconstruction-intro')continue;
   child.classList.toggle('cn-reconstruction-hidden',!started);
  }
 }else{
  document.querySelector('#cn-reconstruction-intro')?.remove();
 }
 if(active==='timeline'){
  const head=[...main.children].find(el=>el.classList?.contains('page-head'));if(!head)return;
  text(head.querySelector('h1'),c.records);text(head.querySelector('p'),c.recordsHint);
  const actions=head.querySelector('.actions')||head;
  if(!head.querySelector('[data-cn-capture-records]')){
   const button=document.createElement('button');button.type='button';button.className='btn line';button.dataset.action='capture';button.dataset.cnCaptureRecords='1';button.textContent=c.capture;
   const add=head.querySelector('[data-action="add"]');if(add)add.insertAdjacentElement('beforebegin',button);else actions.append(button);
  }
 }
}
function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});}
document.addEventListener('click',event=>{
 if(event.target.closest('[data-cn-start-reconstruction]')){started=true;try{sessionStorage.setItem('care-notes.reconstruction.started','1');}catch{}queue();return;}
 if(event.target.closest('[data-cn-go-records]')){clickView('timeline');return;}
 const nav=event.target.closest('.nav button[data-view]');if(nav?.dataset.view==='episode'){started=false;try{sessionStorage.removeItem('care-notes.reconstruction.started');}catch{}setTimeout(queue,0);}
 if(event.target.closest('[data-action="mode"]')){started=false;try{sessionStorage.removeItem('care-notes.reconstruction.started');}catch{}setTimeout(queue,0);}
});
const app=document.querySelector('#app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target.id==='interface-language')setTimeout(queue,0);});
queue();
