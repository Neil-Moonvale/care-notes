// Deterministic evidence assembly. Does not infer causes, diagnoses or truth.
export const episodeLabels = {
 zh:{episode:'事件重建',subtitle:'选出这次需要交接的记录，查看经过与待核实问题。',notice:'本地规则整理，尚未使用 AI 理解事件。关联来自人工选择；系统只会提出“可能属于同一段变化”的候选，不会自动合并。多种说法不等于矛盾。没有记录不代表没有发生。',questions:'先核实这些问题',noQuestions:'所选记录没有触发这些检查；不代表信息完整或情况安全。',accounts:'经过与原始依据',handoff:'下载交接内容',includeUnknown:'保留日期未确定的记录（不计入日期范围）',scope:'选择本次事件涉及的记录；未选记录不会出现在交接中。',empty:'先选择记录，或用“一段话记下来”补充已有观察。',linked:'人工关联的描述',single:'尚未关联的记录',partial:'关联记录有部分未选入；当前材料不完整。',undated:'日期未确定',more:'其余待核实问题',medication:'这条服药描述仍不确定：能否补充当时的观察或已有记录？无法确认就保留未知。',date:'这段描述具体发生在哪一天？无法确认就保留日期未知。',source:'这句话是谁的观察或转述？不清楚就保留来源未知。',accountsQuestion:'这些已关联的描述指的是同一时段吗？请并列核对，无法解释的差异继续保留。',uncertainty:'这条描述中哪些是已观察到的，哪些仍不确定？',partialQuestion:'这组关联描述有记录未选入，是否需要补充到本次交接？',possibleSameEpisode:'这两条记录属于同一类别且时间接近，可能是同一段变化的一部分。请查看原始依据后再决定是否关联；系统不会自动合并。',edit:'查看依据 / 补充核实',questionNotice:'按固定检查顺序显示，属于信息核实，不是医疗紧急程度排序。',omitted:'未选入记录数',review:'已有核对说明',ref:'记录依据',demo:'虚构示例 · 不是真实照护情况'},
 en:{episode:'Reconstruct an episode',subtitle:'Select records for this handoff, then review the sequence and open questions.',notice:'Local rule-based assembly; no AI event understanding yet. Links are selected by people. The system may surface conservative “same change period” candidates, but never merges them automatically. Multiple accounts do not necessarily conflict. Missing records do not mean nothing happened.',questions:'Clarify these first',noQuestions:'No checks were triggered by the selection. This does not establish completeness or safety.',accounts:'Sequence and original evidence',handoff:'Download handoff',includeUnknown:'Keep undated records (outside the date range)',scope:'Select records for this episode. Unselected records are excluded from the handoff.',empty:'Select records or capture a paragraph describing an existing observation.',linked:'Manually linked accounts',single:'Unlinked record',partial:'Some linked records are excluded; this material is incomplete.',undated:'Date unknown',more:'Other open questions',medication:'This medication account is uncertain. Can an observation or existing record clarify it? Keep it unknown if not.',date:'On which day did this happen? Keep the date unknown if it cannot be established.',source:'Whose observation or report is this? Keep the source unknown if unclear.',accountsQuestion:'Do these linked accounts refer to the same period? Review them together and retain unexplained differences.',uncertainty:'Which parts were observed and which remain uncertain?',partialQuestion:'Some linked accounts were excluded. Should they be included in this handoff?',possibleSameEpisode:'These two records share a category and are close in time, so they may belong to the same change period. Review the source records before linking them; Care Notes will not merge them automatically.',edit:'View evidence / clarify',questionNotice:'Shown in a fixed information-check order, not a medical urgency ranking.',omitted:'Records excluded',review:'Existing review note',ref:'Evidence reference',demo:'Fictional example · not real care data'}
};

function dayNumber(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;
 const [y,m,d]=date.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;
}
function timedMs(r){
 if(!r?.date||!r?.time)return null;
 const day=dayNumber(r.date);if(day===null||!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))return null;
 const [h,m]=r.time.split(':').map(Number);return day*86400000+h*3600000+m*60000;
}
function pairId(a,b){return `same-episode:${[a,b].sort().join(':')}`;}

// Conservative review suggestions only. A suggestion is never treated as a fact or applied automatically.
export function suggestEpisodeLinks(records,{maxHours=18,rejectedSuggestionIds=[]}={}){
 const rejected=new Set(rejectedSuggestionIds);const suggestions=[];
 for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
  const a=records[i],b=records[j];
  if(!a?.id||!b?.id||a.id===b.id||a.group||b.group||!a.date||!b.date)continue;
  if(a.category!==b.category)continue;
  const id=pairId(a.id,b.id);if(rejected.has(id))continue;
  const da=dayNumber(a.date),db=dayNumber(b.date);if(da===null||db===null)continue;
  const sameDay=da===db;const ta=timedMs(a),tb=timedMs(b);
  let hours=null;
  if(ta!==null&&tb!==null)hours=Math.abs(ta-tb)/3600000;
  if(hours!==null&&hours>maxHours)continue;
  if(hours===null&&!sameDay)continue;
  let score=.45;const reasons=['same_category'];
  if(sameDay){score+=.15;reasons.push('same_day');}
  if(hours!==null){score+=hours<=6?.35:.25;reasons.push(hours<=6?'within_6h':'within_18h');}
  if(a.source&&b.source&&a.source!==b.source){score+=.05;reasons.push('different_sources');}
  if(score<.65)continue;
  suggestions.push({suggestion_id:id,relation:'same_episode_candidate',evidence_ids:[a.id,b.id],score:Number(score.toFixed(2)),reasons,requires_human_review:true});
 }
 return suggestions.sort((a,b)=>b.score-a.score||a.suggestion_id.localeCompare(b.suggestion_id));
}

export function reconstructEpisode(records, allRecords=records,{includeSuggestions=false,rejectedSuggestionIds=[]}={}){
 const ids=new Set(); const map=new Map();
 for(const r of records){
  if(!r?.id||ids.has(r.id))throw Error('duplicate_or_missing_id');ids.add(r.id);
  const key=r.group?`group:${r.group}`:`record:${r.id}`;
  if(!map.has(key))map.set(key,{id:key,group:r.group||'',items:[],partial:false});
  map.get(key).items.push({...r});
 }
 const compare=(a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'99:99').localeCompare(b.time||'99:99')||a.id.localeCompare(b.id);
 const events=[...map.values()];const questions=[];
 const add=(kind,refs,rank,extra={})=>questions.push({kind,refs,rank,...extra});
 for(const e of events){
  e.items.sort(compare);e.partial=Boolean(e.group&&allRecords.some(r=>r.group===e.group&&!ids.has(r.id)));
  if(e.partial)add('partialQuestion',e.items.map(r=>r.id),0);
  if(e.items.length>1&&e.items.some(r=>r.review!=='noted'))add('accountsQuestion',e.items.map(r=>r.id),2);
  for(const r of e.items){
   if(r.certainty==='uncertain')add(r.category==='medication'?'medication':'uncertainty',[r.id],r.category==='medication'?1:5);
   if(!r.date)add('date',[r.id],3);
   if(r.source==='unknown')add('source',[r.id],4);
  }
 }
 const suggestions=includeSuggestions?suggestEpisodeLinks(records,{rejectedSuggestionIds}):[];
 for(const s of suggestions)add('possibleSameEpisode',s.evidence_ids,6,{suggestion_id:s.suggestion_id,score:s.score});
 events.sort((a,b)=>compare(a.items[0],b.items[0]));
 questions.sort((a,b)=>a.rank-b.rank||a.refs[0].localeCompare(b.refs[0]));
 return {events,questions,suggestions,selectedCount:records.length,excludedCount:allRecords.filter(r=>!ids.has(r.id)).length};
}
export function episodeText(result,labels,recordLabels,{demo=false}={}){
 const lines=[labels.episode,demo?labels.demo:'',labels.notice,`${labels.omitted}: ${result.excludedCount}`,'',labels.questions,labels.questionNotice];
 if(!result.questions.length)lines.push(labels.noQuestions);
 for(const q of result.questions)lines.push(`${labels[q.kind]} [${q.refs.join(', ')}]`);
 lines.push('',labels.accounts);
 for(const e of result.events){
  lines.push('',e.group?labels.linked:labels.single);if(e.partial)lines.push(labels.partial);
  for(const r of e.items){lines.push(`${r.date||labels.undated} ${r.time||''} ${r.when||''} · ${recordLabels[r.source]} · ${recordLabels[r.certainty]}`,r.text,`${labels.ref}: ${r.id}`);if(r.reviewNote)lines.push(`${labels.review}: ${r.reviewNote}`);}
 }
 return lines.join('\n');
}

episodeLabels.es={episode:'Revisar un episodio',subtitle:'Selecciona los registros, revisa lo ocurrido y prepara el informe.',notice:'Organización mediante reglas locales, sin interpretación de eventos por IA. Los vínculos son manuales. El sistema puede mostrar candidatos conservadores del mismo período de cambio, pero nunca los combina automáticamente. Varios relatos no implican contradicción; la falta de registros no demuestra que algo no ocurriera.',questions:'Qué falta por aclarar',noQuestions:'No se activaron estas comprobaciones. Esto no demuestra que la información esté completa ni que la situación sea segura.',accounts:'Relatos y fuentes',handoff:'Descargar informe',includeUnknown:'Incluir registros sin fecha (fuera del intervalo)',scope:'Selecciona los registros de este episodio. Los demás no aparecerán en el informe.',empty:'Selecciona registros o añade una descripción de lo observado.',linked:'Relatos vinculados manualmente',single:'Registro sin vincular',partial:'Faltan registros vinculados en esta selección.',undated:'Fecha sin confirmar',more:'Otras preguntas',medication:'Este relato sobre la medicación no está confirmado. ¿Hay alguna observación o registro que lo aclare? Si no, conserva la incertidumbre.',date:'¿En qué día ocurrió? Deja la fecha sin confirmar si no se puede saber.',source:'¿De quién es esta observación o relato? Deja la fuente sin confirmar si no se sabe.',accountsQuestion:'¿Estos relatos vinculados se refieren al mismo período? Revísalos juntos y conserva las diferencias que no se puedan explicar.',uncertainty:'¿Qué partes se observaron y cuáles siguen sin confirmar?',partialQuestion:'Se han excluido relatos vinculados. ¿Deben incluirse en este informe?',possibleSameEpisode:'Estos dos registros comparten categoría y están próximos en el tiempo, por lo que podrían pertenecer al mismo período de cambio. Revisa las fuentes antes de vincularlos; Care Notes no los combinará automáticamente.',edit:'Ver fuente / aclarar',questionNotice:'Orden fijo para revisar información; no indica urgencia médica.',omitted:'Registros excluidos',review:'Aclaración existente',ref:'Referencia del registro',demo:'Ejemplo ficticio · No son datos reales'};
episodeLabels.fr={episode:'Revoir un épisode',subtitle:'Sélectionnez les notes, examinez les récits, puis téléchargez une transmission.',notice:'Organisation par règles locales, sans compréhension de l’événement par IA. Les liens sont choisis par une personne. Le système peut proposer des candidats prudents de « même période de changement », mais ne les fusionne jamais automatiquement. Plusieurs récits ne signifient pas forcément contradiction. Une absence de note ne signifie pas qu’il ne s’est rien passé.',questions:'Ce qui reste à clarifier',noQuestions:'Aucune vérification n’a été déclenchée par la sélection. Cela ne prouve ni que les informations sont complètes ni que la situation est sûre.',accounts:'Récits de cet épisode',handoff:'Télécharger la transmission',includeUnknown:'Conserver les notes sans date (hors de la plage de dates)',scope:'Sélectionnez les notes de cet épisode. Les notes non sélectionnées sont exclues de la transmission.',empty:'Sélectionnez des notes ou saisissez un récit décrivant une observation existante.',linked:'Récits reliés manuellement',single:'Note non reliée',partial:'Certaines notes reliées sont exclues ; le contenu est incomplet.',undated:'Date inconnue',more:'Autres questions ouvertes',medication:'Ce récit sur la prise du médicament reste incertain. Une observation ou une note existante peut-elle le préciser ? Sinon, conservez l’inconnu.',date:'Quel jour cela s’est-il produit ? Conservez une date inconnue si elle ne peut pas être établie.',source:'Qui a observé ou rapporté cela ? Conservez une source inconnue si elle n’est pas claire.',accountsQuestion:'Ces récits reliés concernent-ils la même période ? Examinez-les ensemble et conservez les différences inexpliquées.',uncertainty:'Quelles parties ont été observées et lesquelles restent incertaines ?',partialQuestion:'Certaines notes reliées ont été exclues. Faut-il les ajouter à cette transmission ?',possibleSameEpisode:'Ces deux notes ont la même catégorie et sont proches dans le temps ; elles peuvent appartenir à la même période de changement. Vérifiez les notes source avant de les relier ; Care Notes ne les fusionnera pas automatiquement.',edit:'Voir la source / clarifier',questionNotice:'Ordre fixe de vérification des informations ; ce n’est pas un classement de l’urgence médicale.',omitted:'Notes exclues',review:'Note de vérification existante',ref:'Référence de la source',demo:'Exemple fictif · Pas de données réelles'};
episodeLabels.ja={episode:'出来事を確認',subtitle:'記録を選び、複数の記述を確認してから引き継ぎをダウンロードします。',notice:'ローカルルールによる整理で、AIが出来事を理解しているわけではありません。関連付けは人が選びます。システムは「同じ変化の期間かもしれない」という慎重な候補を示すことがありますが、自動で統合しません。複数の記述があること自体は矛盾を意味しません。記録がないことは、何も起きなかったことを意味しません。',questions:'まだ確認が必要なこと',noQuestions:'選択内容では確認項目が出ませんでした。情報が完全、または安全だと確認された意味ではありません。',accounts:'この出来事に含まれる記述',handoff:'引き継ぎをダウンロード',includeUnknown:'日付未確定の記録も含める（日付範囲の外）',scope:'今回の出来事に含める記録を選択します。未選択の記録は引き継ぎに入りません。',empty:'記録を選択するか、すでに観察した内容を文章で追加してください。',linked:'手動で関連付けた記述',single:'未関連の記録',partial:'関連する記録の一部が除外されており、資料が不完全です。',undated:'日付未確定',more:'その他の確認事項',medication:'この服薬に関する記述は未確認です。当時の観察や既存の記録で確認できますか？確認できなければ不明のまま残してください。',date:'これは何日に起きましたか？確定できなければ日付未確定のままにしてください。',source:'これは誰の観察または伝聞ですか？分からなければ情報源未確認のままにしてください。',accountsQuestion:'関連付けた記述は同じ時期について述べていますか？一緒に確認し、説明できない違いは残してください。',uncertainty:'どの部分が観察された事実で、どの部分がまだ不確かですか？',partialQuestion:'関連する記録の一部が除外されています。今回の引き継ぎに追加しますか？',possibleSameEpisode:'この2件は同じカテゴリで時間も近いため、同じ変化の期間に含まれる可能性があります。関連付ける前に元の記録を確認してください。Care Notesが自動で統合することはありません。',edit:'根拠を見る / 確認する',questionNotice:'情報確認のための固定順です。医療上の緊急度順ではありません。',omitted:'除外した記録',review:'既存の確認メモ',ref:'根拠となる記録',demo:'架空のサンプル · 実際のケアデータではありません'};
episodeLabels.ko={episode:'사건 검토',subtitle:'기록을 선택하고 서로 다른 진술을 검토한 뒤 인계 내용을 다운로드합니다.',notice:'로컬 규칙으로 정리하며 AI가 사건의 의미를 이해하는 것은 아닙니다. 연결은 사람이 선택합니다. 시스템은 “같은 변화 기간일 수 있음” 후보를 보수적으로 제안할 수 있지만 자동으로 합치지 않습니다. 여러 진술이 있다고 해서 반드시 모순은 아닙니다. 기록이 없다고 해서 아무 일도 없었다는 뜻은 아닙니다.',questions:'아직 확인할 내용',noQuestions:'선택한 기록에서 확인 항목이 나오지 않았습니다. 정보가 완전하거나 상황이 안전하다는 뜻은 아닙니다.',accounts:'이번 사건의 진술',handoff:'인계 내용 다운로드',includeUnknown:'날짜 미확정 기록 포함(날짜 범위 밖)',scope:'이번 사건에 포함할 기록을 선택합니다. 선택하지 않은 기록은 인계 내용에서 제외됩니다.',empty:'기록을 선택하거나 이미 관찰한 내용을 한 문단으로 추가하세요.',linked:'수동으로 연결한 진술',single:'연결되지 않은 기록',partial:'연결된 기록 일부가 제외되어 현재 자료가 불완전합니다.',undated:'날짜 미확정',more:'그 밖의 확인 사항',medication:'이 복약 진술은 아직 불확실합니다. 당시 관찰이나 기존 기록으로 확인할 수 있나요? 확인할 수 없으면 모르는 상태로 남겨 두세요.',date:'이 일은 어느 날 있었나요? 확정할 수 없으면 날짜 미확정으로 남겨 두세요.',source:'누가 관찰하거나 전달한 내용인가요? 알 수 없으면 출처 미확정으로 남겨 두세요.',accountsQuestion:'연결된 진술이 같은 시기를 말하나요? 함께 검토하고 설명되지 않는 차이는 그대로 유지하세요.',uncertainty:'어떤 부분은 직접 관찰되었고 어떤 부분은 아직 불확실한가요?',partialQuestion:'연결된 기록 일부가 제외되었습니다. 이번 인계에 추가해야 하나요?',possibleSameEpisode:'이 두 기록은 같은 분류이며 시간도 가까워 같은 변화 기간에 속할 수 있습니다. 연결하기 전에 원래 기록을 확인하세요. Care Notes는 자동으로 합치지 않습니다.',edit:'근거 보기 / 확인',questionNotice:'정보 확인을 위한 고정 순서이며 의료적 긴급도 순위가 아닙니다.',omitted:'제외된 기록',review:'기존 검토 메모',ref:'근거 기록',demo:'가상 예시 · 실제 돌봄 데이터가 아닙니다'};
Object.assign(episodeLabels.zh,{episode:'整理经过',subtitle:'选记录、核对经过，再下载交接内容。',questions:'还需要核实什么',accounts:'这次涉及的描述',single:'独立记录'});
Object.assign(episodeLabels.en,{episode:'Review an episode',subtitle:'Select records, review the accounts, then download a handoff.',questions:'What still needs clarification',accounts:'Accounts in this episode'});
