// Browser/Node shared core. Model proposals are not verified observations.
export const TOPICS = ['sleep','food','medication','behavior','other'];
export const BASES = ['observed','reported','not_observed','uncertain'];
export const RELATIONS = ['same_event','contradicts','reported_from','before'];
const clone = value => structuredClone(value);
const fail = message => { throw new Error(message); };
const check = (condition, message) => { if (!condition) fail(message); };
const text = (value, max = 5000, empty = false) => typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0);
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const [y,m,d] = value.slice(0,10).split('-').map(Number);
  const [hour,minute,second] = value.slice(11,19).split(':').map(Number);
  if(hour>23||minute>59||second>59)return false;
  const date = new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m-1 && date.getUTCDate() === d && Number.isFinite(Date.parse(value));
}
function validateSource(source) {
  check(source && identifier(source.id) && Number.isSafeInteger(source.version) && source.version > 0, 'invalid_source_identity');
  check(text(source.text) && text(source.author,80) && timestamp(source.recordedAt), 'invalid_source');
  return {id:source.id,version:source.version,text:source.text,author:source.author,recordedAt:source.recordedAt};
}
export function activeSources(ledger) {
  return ledger.sources.filter(s=>!s.deleted).map(s=>clone(s.versions.at(-1)));
}
export function createLedger(sources = []) {
  check(Array.isArray(sources) && sources.length <= 40, 'too_many_sources');
  const ids = new Set();
  return {format:'care-notes-reconstruction',version:1,sources:sources.map(s=>{
    const source=validateSource({...s,version:1});
    check(!ids.has(source.id),'duplicate_source');ids.add(source.id);
    return {id:source.id,deleted:false,versions:[source]};
  }),analyses:[]};
}
// Expected version makes late edits and stale model responses fail closed.
export function reviseSource(ledger, id, {text:body,author,recordedAt}, expectedVersion) {
  const next=clone(ledger),source=next.sources.find(s=>s.id===id&&!s.deleted);
  check(source && source.versions.at(-1).version===expectedVersion,'stale_source');
  const old=source.versions.at(-1);
  source.versions.push(validateSource({id,version:old.version+1,text:body,author:author??old.author,recordedAt:recordedAt??old.recordedAt}));
  return next;
}
export function addSource(ledger, source) {
  const validated=createLedger([source]).sources[0];
  check(!ledger.sources.some(s=>s.id===source.id)&&ledger.sources.length<40,'duplicate_or_excess_source');
  return {...clone(ledger),sources:[...clone(ledger.sources),validated]};
}
export function removeSource(ledger,id,expectedVersion) {
  const next=clone(ledger),source=next.sources.find(s=>s.id===id&&!s.deleted);
  check(source && source.versions.at(-1).version===expectedVersion,'stale_source');source.deleted=true;return next;
}
function exactQuote(source, quote) {
  check(text(quote),'invalid_quote');
  const start=source.text.indexOf(quote);
  check(start>=0 && source.text.indexOf(quote,start+1)<0,'missing_or_ambiguous_quote');
  return {start,end:start+quote.length};
}
const nonObservation=/(?:没(?:有)?(?:亲眼)?(?:看到|看见|见到)|没有亲眼见|did(?:\s+not|n't)\s+(?:see|witness)|not\s+observed|no\s+(?:vi|he visto)|pas\s+vu|見ていない|見なかった|보지\s*못|못\s*봤)/iu;
const uncertainty=/(?:不确定|不知道|记不清|可能|not\s+sure|don't\s+know|uncertain|perhaps|no\s+(?:sé|estoy segur)|ne\s+sais\s+pas|pas\s+s[uû]r|分からない|わからない|모르|불확실)/iu;

export function validateAnalysis(sources, proposal) {
  check(Array.isArray(sources)&&sources.length>0&&sources.length<=40,'invalid_sources');
  const bySource=new Map(sources.map(s=>[s.id,validateSource(s)]));
  check(bySource.size===sources.length,'duplicate_source');
  check(proposal && Object.keys(proposal).sort().join(',')==='claims,relations' && Array.isArray(proposal.claims)&&proposal.claims.length<=100 && Array.isArray(proposal.relations)&&proposal.relations.length<=160,'invalid_analysis');
  const localIds=new Map(),keys=new Set();
  const claims=proposal.claims.map(c=>{
    check(c && identifier(c.id) && !localIds.has(c.id),'duplicate_claim');
    const source=bySource.get(c.sourceId);
    check(source && c.sourceVersion===source.version,'stale_claim');
    check(text(c.subject,80)&&text(c.observer,80)&&TOPICS.includes(c.topic)&&BASES.includes(c.basis)&&['affirmed','denied','unknown'].includes(c.polarity),'invalid_claim');
    const span=exactQuote(source,c.quote);
    check(c.support===undefined||(Array.isArray(c.support)&&c.support.length<=10),'invalid_support');
    const dependencies=[{sourceId:source.id,sourceVersion:source.version,quote:c.quote,span}];
    for(const ref of c.support||[]){
      const supporting=bySource.get(ref.sourceId);
      check(supporting&&supporting.version===ref.sourceVersion,'stale_support');
      const supportSpan=exactQuote(supporting,ref.quote);
      if(!dependencies.some(d=>d.sourceId===ref.sourceId&&d.sourceVersion===ref.sourceVersion&&d.quote===ref.quote))dependencies.push({...ref,span:supportSpan});
    }
    const time=c.time;
    check(time && Object.keys(time).sort().join(',')==='end,quote,start','invalid_time');
    if(time.start===null || time.end===null) {
      check(time.start===null&&time.end===null&&text(time.quote,5000,true),'invalid_time');
      if(time.quote)exactQuote(source,time.quote);
    } else {
      check(timestamp(time.start)&&timestamp(time.end)&&Date.parse(time.start)<Date.parse(time.end),'invalid_time');
      exactQuote(source,time.quote);
    }
    let basis=c.basis,polarity=c.polarity;
    const guards=[];
    // A conservative lexical guard, not an entailment proof or complete language coverage.
    if(nonObservation.test(c.quote)) {if(basis!=='reported')basis='not_observed';polarity='unknown';guards.push('non_observation');}
    else if(uncertainty.test(c.quote)) {if(basis!=='reported')basis='uncertain';polarity='unknown';guards.push('uncertainty');}
    if(['not_observed','uncertain'].includes(basis))polarity='unknown';
    const key=JSON.stringify([source.id,source.version,span.start,span.end,c.subject,c.topic]);
    check(!keys.has(key),'duplicate_claim_span');keys.add(key);localIds.set(c.id,key);
    return {key,sourceId:source.id,sourceVersion:source.version,quote:c.quote,span,dependencies,subject:c.subject,observer:c.observer,topic:c.topic,basis,polarity,time:clone(time),guards};
  });
  const seen=new Set();
  const relations=proposal.relations.map(r=>{
    check(r && RELATIONS.includes(r.type)&&localIds.has(r.from)&&localIds.has(r.to)&&r.from!==r.to,'invalid_relation');
    let from=localIds.get(r.from),to=localIds.get(r.to);
    if(['same_event','contradicts'].includes(r.type)&&from>to)[from,to]=[to,from];
    const key=JSON.stringify([r.type,from,to]);check(!seen.has(key),'duplicate_relation');seen.add(key);
    return {key,type:r.type,from,to};
  });
  return {claims,relations};
}
export function addAnalysis(ledger, proposal, {method='manual',sources=activeSources(ledger)}={}) {
  check(['manual','fixture','openai'].includes(method),'invalid_method');
  const current=new Map(activeSources(ledger).map(s=>[s.id,s]));
  for(const s of sources)check(JSON.stringify(current.get(s.id))===JSON.stringify(s),'stale_analysis');
  const analysis=validateAnalysis(sources,proposal);
  check(ledger.analyses.length<100,'analysis_limit');
  return {...clone(ledger),analyses:[...clone(ledger.analyses),{...analysis,method,sources:sources.map(s=>({id:s.id,version:s.version}))}]};
}
const disjoint=(a,b)=>a.start&&b.start&&(Date.parse(a.end)<=Date.parse(b.start)||Date.parse(b.end)<=Date.parse(a.start));
function reachable(start,end,edges,visited=new Set()) {
  if(start===end)return true;if(visited.has(start))return false;visited.add(start);
  return edges.filter(e=>e.from===start).some(e=>reachable(e.to,end,edges,visited));
}
export function reconstruct(ledger,{questionLimit=3}={}) {
  check(Number.isInteger(questionLimit)&&questionLimit>=0&&questionLimit<=10,'invalid_question_limit');
  const sources=activeSources(ledger),current=new Map(sources.map(s=>[s.id,s])),latest=new Map();
  ledger.analyses.forEach((a,i)=>a.sources.forEach(s=>{
    if(current.get(s.id)?.version===s.version)latest.set(s.id,i);
  }));
  const claims=ledger.analyses.flatMap((a,i)=>a.claims.filter(c=>latest.get(c.sourceId)===i&&current.get(c.sourceId)?.version===c.sourceVersion&&c.dependencies.every(d=>current.get(d.sourceId)?.version===d.sourceVersion)).map(c=>({...clone(c),method:a.method})));
  const byClaim=new Map(claims.map(c=>[c.key,c])),relationMap=new Map();
  ledger.analyses.forEach((a,index)=>{for(const r of a.relations)relationMap.set(r.key,{...r,analysisIndex:index});});
  const relations=[...relationMap.values()].map(({analysisIndex,...r})=>{
    const a=byClaim.get(r.from),b=byClaim.get(r.to);let reason='';
    if(!a||!b)reason='source_changed';
    else if(latest.get(a.sourceId)!==analysisIndex||latest.get(b.sourceId)!==analysisIndex)reason='analysis_superseded';
    else if(r.type==='same_event'||r.type==='contradicts') {
      if(a.subject==='unknown'||b.subject==='unknown'||a.subject!==b.subject||a.topic!==b.topic)reason='different_subject_or_topic';
      else if(disjoint(a.time,b.time))reason='different_periods';
      else if(r.type==='contradicts' && (a.polarity==='unknown'||b.polarity==='unknown'||a.polarity===b.polarity))reason='not_opposing_accounts';
      else if(r.type==='contradicts'&&(!a.time.start||!b.time.start))reason='period_not_established';
    } else if(r.type==='before'&&a.time.start&&b.time.start&&Date.parse(a.time.end)>Date.parse(b.time.start))reason='time_order_not_supported';
    else if(r.type==='reported_from'&&a.basis!=='reported')reason='not_a_report';
    return {...r,status:reason?'withdrawn':'proposed',reason};
  });
  // Cyclic order / source lineage must not be repaired by arbitrary input order.
  for(const type of ['before','reported_from']) {
    const edges=relations.filter(r=>r.type===type&&r.status==='proposed');
    for(const edge of edges)if(reachable(edge.to,edge.from,edges)) {edge.status='withdrawn';edge.reason='cycle';}
  }
  // Same-event chains require a common possible time, not only pairwise overlap.
  const same=relations.filter(r=>r.type==='same_event'&&r.status==='proposed');
  for(const seed of claims) {
    const component=new Set([seed.key]);let grew=true;
    while(grew){grew=false;for(const e of same)if(component.has(e.from)||component.has(e.to))for(const key of [e.from,e.to])if(!component.has(key)){component.add(key);grew=true;}}
    const timed=[...component].map(k=>byClaim.get(k).time).filter(t=>t.start);
    if(timed.length>1 && Math.max(...timed.map(t=>Date.parse(t.start)))>=Math.min(...timed.map(t=>Date.parse(t.end)))) {
      for(const edge of same)if(component.has(edge.from)&&component.has(edge.to)){edge.status='withdrawn';edge.reason='no_shared_period';}
    }
  }
  const live=relations.filter(r=>r.status==='proposed');
  const questions=[];
  for(const c of claims) {
    const affected=live.filter(r=>r.from===c.key||r.to===c.key);
    if(!c.time.start&&affected.some(r=>['same_event','before'].includes(r.type)))questions.push({kind:'time',claim:c.key,sourceId:c.sourceId,affected:affected.map(r=>r.key),impact:affected.length});
    else if(c.basis==='reported'&&!live.some(r=>r.type==='reported_from'&&r.from===c.key))questions.push({kind:'source',claim:c.key,sourceId:c.sourceId,affected:[],impact:0});
  }
  questions.sort((a,b)=>b.impact-a.impact||a.sourceId.localeCompare(b.sourceId));
  const seenQuestions=new Set();
  const ranked=questions.filter(q=>{const key=q.kind+':'+q.sourceId;if(seenQuestions.has(key))return false;seenQuestions.add(key);return true;});
  const covered=new Set(claims.map(c=>c.sourceId));
  // Earliest possible start is a display order only; overlapping ranges stay ambiguous.
  claims.sort((a,b)=>(a.time.start?Date.parse(a.time.start):Infinity)-(b.time.start?Date.parse(b.time.start):Infinity)||a.key.localeCompare(b.key));
  const order=[];
  for(const a of claims)for(const b of claims)if(a.key!==b.key&&a.time.end&&b.time.start&&Date.parse(a.time.end)<=Date.parse(b.time.start))order.push({from:a.key,to:b.key});
  return {claims,relations,order,questions:ranked.slice(0,questionLimit),unanalysed:sources.filter(s=>!covered.has(s.id)).map(s=>s.id),sourceCount:sources.length};
}
export function reconstructionChanges(previous,next) {
  const oldClaims=new Map(previous.claims.map(c=>[c.key,c])),newClaims=new Map(next.claims.map(c=>[c.key,c]));
  const oldLinks=previous.relations.filter(r=>r.status==='proposed'),newLinks=new Set(next.relations.filter(r=>r.status==='proposed').map(r=>r.key));
  const semantic=c=>JSON.stringify([c.observer,c.basis,c.polarity,c.time,c.dependencies]);
  const updatedClaims=[...newClaims.values()].filter(c=>oldClaims.has(c.key)&&semantic(oldClaims.get(c.key))!==semantic(c)).map(c=>({before:oldClaims.get(c.key),after:c}));
  const oldLinkKeys=new Set(oldLinks.map(r=>r.key));
  return {withdrawnClaims:[...oldClaims.values()].filter(c=>!newClaims.has(c.key)),addedClaims:[...newClaims.values()].filter(c=>!oldClaims.has(c.key)),updatedClaims,withdrawnRelations:oldLinks.filter(r=>!newLinks.has(r.key)),addedRelations:next.relations.filter(r=>r.status==='proposed'&&!oldLinkKeys.has(r.key)),pendingSources:next.unanalysed};
}
