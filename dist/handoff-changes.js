import {activeSources,reconstruct} from './reconstruction-core.js';
import {emptyCoverage,validateCoverage} from './evidence-coverage.js';

// A local review checkpoint, never a receipt proving delivery or clinical change.
export function validateCheckpoint(ledger,input){
 const fail=()=>{throw Error('invalid_checkpoint');};
 if(!input||input.version!==1||typeof input.createdAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.createdAt)||!Number.isFinite(Date.parse(input.createdAt))||new Date(input.createdAt).toISOString()!==input.createdAt||!Array.isArray(input.sources)||input.sources.length>40)fail();
 const seen=new Set();
 const sources=input.sources.map(ref=>{
  if(!ref||seen.has(ref.id)||!Number.isSafeInteger(ref.version)||!ledger.sources.some(s=>s.id===ref.id&&s.versions.some(v=>v.version===ref.version)))fail();
  seen.add(ref.id);return {id:ref.id,version:ref.version};
 });
 return {version:1,createdAt:input.createdAt,sources,coverage:validateCoverage(input.coverage)};
}
export function saveCheckpoint(ledger,createdAt=new Date().toISOString()){
 const handoffCheckpoint=validateCheckpoint(ledger,{version:1,createdAt,sources:activeSources(ledger).map(({id,version})=>({id,version})),coverage:ledger.coverage||emptyCoverage()});
 return {...ledger,handoffCheckpoint};
}
export function handoffChanges(ledger){
 if(!ledger.handoffCheckpoint)return null;
 const checkpoint=validateCheckpoint(ledger,ledger.handoffCheckpoint);
 const before=new Map(checkpoint.sources.map(ref=>[ref.id,ledger.sources.find(s=>s.id===ref.id).versions.find(v=>v.version===ref.version)]));
 const current=activeSources(ledger),after=new Map(current.map(s=>[s.id,s]));
 return {createdAt:checkpoint.createdAt,
  added:current.filter(s=>!before.has(s.id)),
  revised:current.filter(s=>before.has(s.id)&&before.get(s.id).version!==s.version).map(s=>({before:before.get(s.id),after:s})),
  removed:[...before.values()].filter(s=>!after.has(s.id)),
  coverageChanged:JSON.stringify(checkpoint.coverage)!==JSON.stringify(ledger.coverage||emptyCoverage()),
  pending:reconstruct(ledger).unanalysed.length};
}
export const handoffCopy={
 en:{title:'Changes since the last handoff checkpoint',intro:'Save a local checkpoint after reviewing your handoff. Next time, compare new, corrected and withdrawn accounts with their original wording.',scope:'This compares source records and declared observation coverage, not health changes or AI report changes. A checkpoint does not prove that anyone received or read a handoff.',save:'Save handoff checkpoint',replace:'Replace the previous checkpoint? Future comparisons will start from the current records. Original source history is retained.',saved:'Handoff checkpoint saved on this device.',empty:'No handoff checkpoint yet.',since:'Checkpoint saved',added:'New accounts',revised:'Corrected accounts',removed:'Withdrawn accounts — historical wording only',before:'At the checkpoint',after:'Current account',none:'No source or coverage changes since this checkpoint.',coverage:'Declared observation coverage changed. Review the current coverage map before sharing.',pending:'Current accounts awaiting AI organization',export:'Export change list',review:'Review the current results before saving a checkpoint or exporting changes.',historical:'Earlier wording below is historical, not a current claim.'},
 zh:{title:'与上次交接相比，哪些记录变了',intro:'核对交接内容后保存本地基准。下次可逐条对照新增、更正和撤下的描述，保留前后原话。',scope:'这里只比较原始记录与声明的观察范围，不判断病情变化，也不比较 AI 报告变化。保存基准不代表对方已收到或阅读交接。',save:'保存交接基准',replace:'替换上一次交接基准？之后将从当前记录开始比较，原始版本历史仍然保留。',saved:'交接基准已保存在本设备。',empty:'尚未保存交接基准。',since:'基准保存时间',added:'新增描述',revised:'更正描述',removed:'已撤下描述 · 仅供历史对照',before:'上次交接时',after:'当前描述',none:'自该基准以来，原始记录与观察范围没有变化。',coverage:'声明的观察范围发生了变化，请在分享前重新核对当前覆盖图。',pending:'尚待 AI 整理的当前描述',export:'导出变化清单',review:'请先核对当前整理结果，再保存基准或导出变化。',historical:'以下旧原话只用于历史对照，不代表当前说法。'}
};
export const handoffLabels=lang=>handoffCopy[lang]||handoffCopy.en;
export function changesText(ledger,lang='en'){
 const c=handoffLabels(lang),d=handoffChanges(ledger);
 const lines=['Care Notes · '+c.title,c.scope];
 if(!d)return lines.concat(c.empty).join('\n');
 lines.push(c.since+': '+d.createdAt,c.historical);
 const source=s=>`[${s.id} v${s.version}] ${s.author}\n${s.recordedAt}\n${s.text}`;
 for(const [key,label] of [['added',c.added],['revised',c.revised],['removed',c.removed]]){
  lines.push('',`${label} (${d[key].length})`);
  for(const entry of d[key])lines.push(key==='revised'?`${c.before}\n${source(entry.before)}\n${c.after}\n${source(entry.after)}`:source(entry));
 }
 if(d.coverageChanged)lines.push('',c.coverage);
 if(!d.added.length&&!d.revised.length&&!d.removed.length&&!d.coverageChanged)lines.push('',c.none);
 lines.push('',`${c.pending}: ${d.pending}`);
 return lines.join('\n');
}
