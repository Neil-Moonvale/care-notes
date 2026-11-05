import {activeSources,addSource} from './reconstruction-core.js';
import {auditEpisode} from './claim-firewall.js';
import {emptyCoverage,validateCoverage} from './evidence-coverage.js';

const fail=()=>{throw Error('invalid_clarification');};
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const refOf=s=>({id:s.id,version:s.version});
const canonical=refs=>[...refs].sort((a,b)=>a.id.localeCompare(b.id));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const historicalSource=(ledger,ref)=>ledger.sources.find(s=>s.id===ref.id)?.versions.find(v=>v.version===ref.version);
function references(ledger,input,allowEmpty=false){
  if(!Array.isArray(input)||input.length>40||(!allowEmpty&&!input.length))fail();
  const ids=new Set();
  return input.map(r=>{
    if(!r||!identifier(r.id)||!Number.isSafeInteger(r.version)||ids.has(r.id)||!historicalSource(ledger,r))fail();
    ids.add(r.id);return refOf(r);
  });
}
// Only source versions and a human review snapshot are persisted. Status is derived.
export function validateClarifications(ledger,input){
  if(!Array.isArray(input)||input.length>80)fail();
  const ids=new Set();
  return input.map(q=>{
    if(!q||!identifier(q.id)||ids.has(q.id)||!text(q.question,1000)||!date(q.createdAt)||!Array.isArray(q.reviews)||q.reviews.length>100)fail();
    ids.add(q.id);
    const refs=references(ledger,q.refs),answers=references(ledger,q.answers,true);
    if(answers.some(a=>refs.some(r=>r.id===a.id)))fail();
    const reviews=q.reviews.map(r=>{
      if(!r||!date(r.at)||!['review','reopen'].includes(r.kind)||r.at<q.createdAt)fail();
      if(r.kind==='reopen')return {kind:r.kind,at:r.at};
      const sources=canonical(references(ledger,r.sources,true));
      if(!answers.some(a=>sources.some(s=>s.id===a.id)))fail();
      return {kind:r.kind,at:r.at,sources,coverage:validateCoverage(r.coverage)};
    });
    if(reviews.some((r,i)=>i&&r.at<reviews[i-1].at))fail();
    return {id:q.id,question:q.question,createdAt:q.createdAt,refs,answers,reviews};
  });
}
export function clarificationStatus(ledger,q){
  const last=q.reviews.at(-1);
  if(last?.kind==='review'){
    return same(canonical(activeSources(ledger).map(refOf)),last.sources)&&same(validateCoverage(ledger.coverage||emptyCoverage()),last.coverage)?'reviewed':'recheck';
  }
  return q.answers.length?'answered':'open';
}
export function clarificationItems(ledger){
  return validateClarifications(ledger,ledger.clarifications||[]).map(q=>({...q,status:clarificationStatus(ledger,q)}));
}
export function addClarification(ledger,{id,question,refs,createdAt=new Date().toISOString()}){
  const live=activeSources(ledger);
  if(!Array.isArray(refs)||refs.some(r=>!live.some(s=>s.id===r.id&&s.version===r.version)))fail();
  const tasks=validateClarifications(ledger,ledger.clarifications||[]);
  if(tasks.some(q=>q.question===question&&same(canonical(q.refs),canonical(refs))))throw Error('duplicate_clarification');
  return {...ledger,clarifications:validateClarifications(ledger,[...tasks,{id,question,refs,createdAt,answers:[],reviews:[]}])};
}
export function answerClarification(ledger,id,source){
  const tasks=validateClarifications(ledger,ledger.clarifications||[]),task=tasks.find(q=>q.id===id);
  if(!task)fail();
  // Add independently attributed original words; never overwrite the disputed account.
  const next=addSource(ledger,source);
  task.answers.push({id:source.id,version:1});
  return {...next,clarifications:validateClarifications(next,tasks)};
}
export function reviewClarification(ledger,id,{reopen=false,at=new Date().toISOString()}={}){
  const tasks=validateClarifications(ledger,ledger.clarifications||[]),task=tasks.find(q=>q.id===id),sources=canonical(activeSources(ledger).map(refOf));
  if(!task||(!reopen&&!task.answers.some(a=>sources.some(s=>s.id===a.id))))fail();
  task.reviews.push(reopen?{kind:'reopen',at}:{kind:'review',at,sources,coverage:validateCoverage(ledger.coverage||emptyCoverage())});
  return {...ledger,clarifications:validateClarifications(ledger,tasks)};
}
export function clarificationCandidates(ledger,lang='en'){
  const audit=auditEpisode(ledger,lang),saved=ledger.clarifications||[],seen=new Set();
  return audit.questions.map(q=>{
    const claim=audit.claims.find(c=>c.id===q.claimId);
    const refs=[...new Map([...claim.supportingEvidence,...claim.contradictingEvidence].map(e=>[e.sourceId,{id:e.sourceId,version:e.sourceVersion}])).values()];
    return {question:q.text,refs,reason:q.reason};
  }).filter(q=>{
    const key=JSON.stringify([q.question,canonical(q.refs)]);
    if(seen.has(key))return false;
    seen.add(key);
    return !saved.some(s=>s.question===q.question&&same(canonical(s.refs),canonical(q.refs)));
  });
}
export const clarificationCopy={
  en:{title:'Clarification notebook',intro:'Keep each question with the exact accounts behind it. Save a reply as a new account, then review it yourself.',scope:'Reviewed means you inspected a reply; it does not establish a fact or resolve a medical question. Any source or observation-coverage change makes previous reviews need another check. No model call is made here.',open:'Awaiting reply',answered:'Reply saved · needs review',reviewed:'Reply reviewed by you',recheck:'Records changed · review again',suggestions:'Questions you can follow up',keep:'Keep this question',new:'Add your own question',question:'What needs clarifying?',choose:'Select the original accounts',save:'Save question',original:'Question linked to',current:'Current wording',historical:'Wording when linked · historical',removed:'Withdrawn source · historical only',reply:'Replies',answer:'Save a new reply',author:'Who said this?',words:'Their exact words (include the date or period if known)',submit:'Save reply as a new account',review:'I reviewed the replies and current records',reopen:'Reopen question',export:'Export clarification notebook',empty:'No saved questions yet. Keep a suggestion or write your own.',none:'No suggested questions; this does not establish that the records are complete.',saved:'Question saved on this device.',answerSaved:'Reply saved. Review it alongside the original accounts; conclusions have not been changed.',reviewSaved:'Your review was recorded.',error:'Could not save. Select current sources, complete the required fields and check workspace limits.',duplicate:'This question is already saved.',changed:'A linked source changed. Compare the earlier and current wording below.',full:'The workspace has reached its 40-source limit. Back it up before starting another workspace.',hint:'Review the current records and replies before marking this question reviewed.',at:'Last review action',summary:'Question status',version:'Care Notes 1.3.1'},
  zh:{title:'待核对问题',intro:'把问题与相关原话放在一起，补充回答作为新描述保存，再由你逐项核对。',scope:'“已核对”只表示你查看过回答，不代表事实已证实或医疗问题已解决。任何原始记录或观察范围变化，都会让之前的核对重新待查。这里不会调用模型。',open:'等待补充',answered:'已补充 · 待核对',reviewed:'你已核对回答',recheck:'记录有变化 · 请重新核对',suggestions:'可以继续追问的问题',keep:'记下这个问题',new:'自己添加问题',question:'还有什么需要弄清？',choose:'选择相关原始描述',save:'保存问题',original:'提问时关联的原话',current:'当前原话',historical:'关联时的原话 · 历史内容',removed:'该描述已撤下 · 仅供历史对照',reply:'补充回答',answer:'记录新的回答',author:'这是谁说的？',words:'保留对方原话（知道日期或时段时请一起记录）',submit:'将回答保存为新描述',review:'我已核对回答与当前记录',reopen:'重新打开问题',export:'导出问题与回答',empty:'还没有保存的问题，可以记下建议问题，或自己添加。',none:'暂未生成建议问题，不代表资料已经完整。',saved:'问题已保存在本设备。',answerSaved:'回答已保存，请结合原话核对；原有结论没有被自动改写。',reviewSaved:'已记录你的核对操作。',error:'保存失败，请选择当前描述、填写必填项，并检查工作区容量。',duplicate:'这个问题已经保存。',changed:'相关描述已变化，请对照下方旧原话与当前原话。',full:'当前工作区已达到 40 条来源上限，请先备份再开始新工作区。',hint:'请先查看当前记录和回答，再标记为已核对。',at:'最近核对操作',summary:'问题状态',version:'Care Notes 1.3.1'}
};
export const clarificationLabels=lang=>clarificationCopy[lang]||clarificationCopy.en;
export function clarificationText(ledger,lang='en'){
  const c=clarificationLabels(lang),tasks=clarificationItems(ledger),live=new Map(activeSources(ledger).map(s=>[s.id,s]));
  const lines=[c.version+' · '+c.title,c.scope];
  if(!tasks.length)lines.push(c.empty);
  for(const q of tasks){
    lines.push('',q.question,c.summary+': '+c[q.status]);
    for(const [label,refs] of [[c.original,q.refs],[c.reply,q.answers]])for(const ref of refs){
      const old=historicalSource(ledger,ref),now=live.get(ref.id);
      lines.push(label,`[${old.id} v${old.version}] ${old.author} · ${old.recordedAt}`,!now?c.removed:now.version!==old.version?c.historical:c.current,old.text);
      if(now&&now.version!==old.version)lines.push(c.current,`[${now.id} v${now.version}] ${now.author} · ${now.recordedAt}`,now.text);
    }
    if(q.reviews.length)lines.push(c.at+': '+q.reviews.at(-1).at);
  }
  return lines.join('\n');
}
