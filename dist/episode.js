// Deterministic evidence assembly. Does not infer causes, diagnoses or truth.
export const episodeLabels = {
 zh:{episode:'事件重建',subtitle:'选出这次需要交接的记录，查看经过与待核实问题。',notice:'本地规则整理，尚未使用 AI 理解事件。关联来自人工选择；多种说法不等于矛盾。没有记录不代表没有发生。',questions:'先核实这些问题',noQuestions:'所选记录没有触发这些检查；不代表信息完整或情况安全。',accounts:'经过与原始依据',handoff:'下载交接内容',includeUnknown:'保留日期未确定的记录（不计入日期范围）',scope:'选择本次事件涉及的记录；未选记录不会出现在交接中。',empty:'先选择记录，或用“一段话记下来”补充已有观察。',linked:'人工关联的描述',single:'尚未关联的记录',partial:'关联记录有部分未选入；当前材料不完整。',undated:'日期未确定',more:'其余待核实问题',medication:'这条服药描述仍不确定：能否补充当时的观察或已有记录？无法确认就保留未知。',date:'这段描述具体发生在哪一天？无法确认就保留日期未知。',source:'这句话是谁的观察或转述？不清楚就保留来源未知。',accountsQuestion:'这些已关联的描述指的是同一时段吗？请并列核对，无法解释的差异继续保留。',uncertainty:'这条描述中哪些是已观察到的，哪些仍不确定？',partialQuestion:'这组关联描述有记录未选入，是否需要补充到本次交接？',edit:'查看依据 / 补充核实',questionNotice:'按固定检查顺序显示，属于信息核实，不是医疗紧急程度排序。',omitted:'未选入记录数',review:'已有核对说明',ref:'记录依据',demo:'虚构示例 · 不是真实照护情况'},
 en:{episode:'Reconstruct an episode',subtitle:'Select records for this handoff, then review the sequence and open questions.',notice:'Local rule-based assembly; no AI event understanding yet. Links are selected by people; multiple accounts do not necessarily conflict. Missing records do not mean nothing happened.',questions:'Clarify these first',noQuestions:'No checks were triggered by the selection. This does not establish completeness or safety.',accounts:'Sequence and original evidence',handoff:'Download handoff',includeUnknown:'Keep undated records (outside the date range)',scope:'Select records for this episode. Unselected records are excluded from the handoff.',empty:'Select records or capture a paragraph describing an existing observation.',linked:'Manually linked accounts',single:'Unlinked record',partial:'Some linked records are excluded; this material is incomplete.',undated:'Date unknown',more:'Other open questions',medication:'This medication account is uncertain. Can an observation or existing record clarify it? Keep it unknown if not.',date:'On which day did this happen? Keep the date unknown if it cannot be established.',source:'Whose observation or report is this? Keep the source unknown if unclear.',accountsQuestion:'Do these linked accounts refer to the same period? Review them together and retain unexplained differences.',uncertainty:'Which parts were observed and which remain uncertain?',partialQuestion:'Some linked accounts were excluded. Should they be included in this handoff?',edit:'View evidence / clarify',questionNotice:'Shown in a fixed information-check order, not a medical urgency ranking.',omitted:'Records excluded',review:'Existing review note',ref:'Evidence reference',demo:'Fictional example · not real care data'}
};
export function reconstructEpisode(records, allRecords=records){
 const ids=new Set(); const map=new Map();
 for(const r of records){
  if(!r?.id||ids.has(r.id))throw Error('duplicate_or_missing_id');ids.add(r.id);
  const key=r.group?`group:${r.group}`:`record:${r.id}`;
  if(!map.has(key))map.set(key,{id:key,group:r.group||'',items:[],partial:false});
  map.get(key).items.push({...r});
 }
 const compare=(a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'99:99').localeCompare(b.time||'99:99')||a.id.localeCompare(b.id);
 const events=[...map.values()];const questions=[];
 const add=(kind,refs,rank)=>questions.push({kind,refs,rank});
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
 events.sort((a,b)=>compare(a.items[0],b.items[0]));
 questions.sort((a,b)=>a.rank-b.rank||a.refs[0].localeCompare(b.refs[0]));
 return {events,questions,selectedCount:records.length,excludedCount:allRecords.filter(r=>!ids.has(r.id)).length};
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

episodeLabels.es={episode:'Revisar un episodio',subtitle:'Selecciona los registros, revisa lo ocurrido y prepara el informe.',notice:'Organización mediante reglas locales, sin interpretación de eventos por IA. Los vínculos son manuales. Varios relatos no implican contradicción; la falta de registros no demuestra que algo no ocurriera.',questions:'Qué falta por aclarar',noQuestions:'No se activaron estas comprobaciones. Esto no demuestra que la información esté completa ni que la situación sea segura.',accounts:'Relatos y fuentes',handoff:'Descargar informe',includeUnknown:'Incluir registros sin fecha (fuera del intervalo)',scope:'Selecciona los registros de este episodio. Los demás no aparecerán en el informe.',empty:'Selecciona registros o añade una descripción de lo observado.',linked:'Relatos vinculados manualmente',single:'Registro sin vincular',partial:'Faltan registros vinculados en esta selección.',undated:'Fecha sin confirmar',more:'Otras preguntas',medication:'Este relato sobre la medicación no está confirmado. ¿Hay alguna observación o registro que lo aclare? Si no, conserva la incertidumbre.',date:'¿En qué día ocurrió? Deja la fecha sin confirmar si no se puede saber.',source:'¿De quién es esta observación o relato? Deja la fuente sin confirmar si no se sabe.',accountsQuestion:'¿Estos relatos vinculados se refieren al mismo período? Revísalos juntos y conserva las diferencias que no se puedan explicar.',uncertainty:'¿Qué partes se observaron y cuáles siguen sin confirmar?',partialQuestion:'Se han excluido relatos vinculados. ¿Deben incluirse en este informe?',edit:'Ver fuente / aclarar',questionNotice:'Orden fijo para revisar información; no indica urgencia médica.',omitted:'Registros excluidos',review:'Aclaración existente',ref:'Referencia del registro',demo:'Ejemplo ficticio · No son datos reales'};
Object.assign(episodeLabels.zh,{episode:'整理经过',subtitle:'选记录、核对经过，再下载交接内容。',questions:'还需要核实什么',accounts:'这次涉及的描述',single:'独立记录'});
Object.assign(episodeLabels.en,{episode:'Review an episode',subtitle:'Select records, review the accounts, then download a handoff.',questions:'What still needs clarification',accounts:'Accounts in this episode'});
