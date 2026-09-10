import {reportText} from './care-report.js';
import {createLedger,activeSources,addSource,reviseSource,validateAnalysis,reconstruct} from './reconstruction-core.js';
export const WORKSPACE_KEY='care-notes-reconstruction-workspace-v1';
// Restore evidence through validation, never trust a saved/imported derived result.
export function restoreWorkspace(raw) {
  if(typeof raw!=='string'||raw.length>4000000)throw Error('invalid_backup');
  const input=JSON.parse(raw),saved=input.ledger;
  if(!['care-notes-reconstruction-workspace','care-notes-reconstruction-review'].includes(input.format)||input.version!==1||saved?.format!=='care-notes-reconstruction'||saved.version!==1||!Array.isArray(saved.sources)||saved.sources.length>40||!Array.isArray(saved.analyses)||saved.analyses.length>100)throw Error('invalid_backup');
  let ledger=createLedger();const historical=new Map();
  for(const s of saved.sources){
    if(typeof s.deleted!=='boolean'||!Array.isArray(s.versions)||!s.versions.length||s.versions.length>200)throw Error('invalid_backup');
    for(const [i,v] of s.versions.entries()){
      if(v.id!==s.id||v.version!==i+1)throw Error('invalid_backup');
      ledger=i===0?addSource(ledger,v):reviseSource(ledger,s.id,v,i);
      historical.set(s.id+':'+v.version,activeSources(ledger).find(x=>x.id===s.id));
    }
    ledger.sources.at(-1).deleted=s.deleted;
  }
  for(const a of saved.analyses){
    if(!['fixture','manual','openai','model'].includes(a.method)||!Array.isArray(a.sources)||!Array.isArray(a.claims)||!Array.isArray(a.relations))throw Error('invalid_backup');
    const sources=a.sources.map(s=>historical.get(s.id+':'+s.version));
    if(sources.some(s=>!s))throw Error('invalid_backup');
    const ids=new Map(a.claims.map((c,i)=>[c.key,'c'+i]));
    if(ids.size!==a.claims.length)throw Error('invalid_backup');
    const claims=a.claims.map(c=>({id:ids.get(c.key),sourceId:c.sourceId,sourceVersion:c.sourceVersion,quote:c.quote,subject:c.subject,observer:c.observer,topic:c.topic,basis:c.basis,polarity:c.polarity,time:c.time,support:c.dependencies?.map(d=>({sourceId:d.sourceId,sourceVersion:d.sourceVersion,quote:d.quote}))}));
    const relations=a.relations.map(r=>({from:ids.get(r.from),to:ids.get(r.to),type:r.type}));
    if(a.metadata&&(typeof a.metadata.model!=='string'||a.metadata.model.length>128||typeof a.metadata.createdAt!=='string'||!Number.isFinite(Date.parse(a.metadata.createdAt))))throw Error('invalid_backup');
    ledger.analyses.push({...validateAnalysis(sources,{claims,relations}),method:a.method,...(a.metadata?{metadata:{model:a.metadata.model,createdAt:a.metadata.createdAt}}:{}),sources:sources.map(s=>({id:s.id,version:s.version}))});
  }
  reconstruct(ledger);
  return ledger;
}
export function workspaceJSON(ledger) {
  return JSON.stringify({format:'care-notes-reconstruction-workspace',version:1,ledger,result:reconstruct(ledger)},null,2);
}
export function handoffText(ledger,copy,timeLabel) {
  const result=reconstruct(ledger),sources=activeSources(ledger),byId=new Map(sources.map(s=>[s.id,s]));
  const byClaim=new Map(result.claims.map(c=>[c.key,c]));
  const ref=c=>`${c.sourceId} v${c.sourceVersion}`;
  const method=ledger.analyses.at(-1)?.method;
  const lines=[reportText(ledger,copy.locale.split('-')[0],copy,timeLabel),'','Care Notes',['openai','model'].includes(method)?copy.live:method==='fixture'?copy.demo:copy.local,'',copy.accounts];
  for(const c of result.claims)lines.push(`[${ref(c)}] ${byId.get(c.sourceId).author}`,`${copy.basis[c.basis]} · ${timeLabel(c.time)}`,c.quote,...(c.polarity==='unknown'?[copy.unknownFact]:[]),'');
  lines.push(copy.relations);
  for(const r of result.relations.filter(r=>r.status==='proposed'))lines.push(`${copy[r.type]}: [${ref(byClaim.get(r.from))}] / [${ref(byClaim.get(r.to))}]`);
  lines.push('',copy.questions);
  for(const q of result.questions)lines.push(`[${q.sourceId}] ${q.kind==='time'?copy.timeQuestion:copy.sourceQuestion}`);
  if(!result.questions.length)lines.push(copy.none);
  for(const id of result.unanalysed)lines.push(`[${id}] ${copy.pending}`);
  lines.push('',copy.sources);
  for(const s of sources)lines.push(`[${s.id} v${s.version}] ${s.author}`,s.text,'');
  lines.push(copy.scope);return lines.join('\n');
}
