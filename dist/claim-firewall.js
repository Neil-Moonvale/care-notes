import {activeSources,reconstruct} from './reconstruction-core.js';
import {coverageFor,emptyCoverage,validateCoverage,validWindow} from './evidence-coverage.js';
const overlap=(a,b)=>validWindow(a)&&validWindow(b)&&Date.parse(a.start)<Date.parse(b.end)&&Date.parse(b.start)<Date.parse(a.end);
const contains=(a,b)=>validWindow(a)&&validWindow(b)&&Date.parse(a.start)<=Date.parse(b.start)&&Date.parse(a.end)>=Date.parse(b.end);
export const firewallCopy={
 en:{title:'What can we actually tell?',intro:'Accounts are kept separate from conclusions. Missing observations stay unknown.',map:'Where could events have been observed?',audit:'Check the evidence',debt:'Most useful next questions',alternate:'Possible timelines — not a resolved sequence',evidence:'Original evidence',conflicts:'Different accounts',coverage:'Observation coverage',blind:'Blind spots',why:'Why this wording?',none:'None identified; this does not prove none exist.',unverified:'Observation setup is declared by people or adapters, not independently verified.',draft:'The model draft is not used as a verified conclusion. The report below uses bounded, attributed wording.',empty:'No current extracted claims. Add accounts and run AI organisation.',fallback:'New coverage features are shown in English for this language.',labels:{SUPPORTED:'Supported account',CONTESTED:'Conflicting accounts',UNDEROBSERVED:'Observation gap',UNRESOLVED:'Unknown'},levels:{well:'Well observed',partial:'Partially observed',poor:'Poorly observed',unobserved:'Unobserved'},classes:{medication:'medication-taking',sleep:'sleep',food:'eating',behavior:'behaviour',other:'event',departure:'departure',door_open:'door opening',motion:'movement'},reasons:{not_capable:'Cannot observe this event class',unreviewed:'Capability not reviewed',subject_unknown:'Person not established',indirect_only:'Indirect signal only',unavailable:'Unavailable in this period',blind_spots:'Known blind spots',reliability_limited:'Reliability not established',silence_not_evidence:'Silence has no evidentiary meaning',declared_coverage:'Declared observation available',observation_gaps:'Observation gaps remain',unknown_time:'Event time is unknown'}},
 zh:{title:'这段时间，哪些事情能说清？',intro:'把家属的说法和已证实的结论分开。没观察到的事情，仍然保留为不知道。',map:'哪些时段有人或设备能看见？',audit:'展开核对依据',debt:'接下来最值得问',alternate:'两种可能的经过，暂不能选定一种',evidence:'原始依据',conflicts:'不同说法',coverage:'观察覆盖',blind:'看不到的地方',why:'为什么这样写？',none:'目前没有识别到，不代表一定不存在。',unverified:'观察范围由人或适配器声明，系统无法独立确认设备或人的真实观察能力。',draft:'模型草稿不直接作为已证实的结论。以下报告使用受规则限制、注明来源的表述。',empty:'还没有当前记录的提取结果，请补充原话并运行 AI 整理。',fallback:'',labels:{SUPPORTED:'有依据的说法',CONTESTED:'说法有冲突',UNDEROBSERVED:'存在观察空白',UNRESOLVED:'尚不清楚'},levels:{well:'充分覆盖',partial:'部分覆盖',poor:'覆盖较少',unobserved:'未被观察'},classes:{medication:'服药',sleep:'睡眠',food:'进食',behavior:'行为',other:'相关事件',departure:'离家',door_open:'开门',motion:'活动'},reasons:{not_capable:'无法观察这类事件',unreviewed:'观察能力未核对',subject_unknown:'无法确定观察的是谁',indirect_only:'仅有间接信号',unavailable:'这段时间不可用',blind_spots:'存在已知盲区',reliability_limited:'可靠性未确定',silence_not_evidence:'没有上报不能说明没有发生',declared_coverage:'声明的观察范围覆盖该时段',observation_gaps:'仍有未观察到的时段',unknown_time:'事件时间不明确'}}
};
export const copyFor=lang=>firewallCopy[lang]||firewallCopy.en;
export const timeRange=(w,lang='en')=>validWindow(w)?`${w.start} – ${w.end}`:(lang==='zh'?'时间不明确':'Time not established');
function permittedWording(c,category,coverage,source,lang){
 const zh=lang==='zh',label=copyFor(lang).classes[c.topic]||c.topic,period=timeRange(c.time,lang);
 if(category==='not_observed'||category==='unknown'){
  const gaps=coverage.gaps.map(w=>timeRange(w,lang)).join('; ');
  return zh?`现有资料无法确认${label}是否发生。${gaps?`未被观察的时段：${gaps}。`:!validWindow(c.time)?'事件时间还不明确。':'观察范围也不能独立证明事情没有发生。'}`:`No ${label} event was confirmed by this account; whether it happened remains unknown. ${gaps?`Unobserved: ${gaps}.`:!validWindow(c.time)?'The event time is not established.':'Coverage alone does not independently prove absence.'}`;
 }
 if(category==='explicitly_negated')return zh?`${source.author}的已核对记录明确否定了该事件（${period}），仅限声明的观察范围；并非对现实的独立核实。`:`The reviewed account from ${source.author} explicitly negates this event (${period}), only within its declared observation scope; this is not independent verification.`;
 return zh?`${source.author}${category==='inferred'?'转述或推测':'记下的说法'}：“${c.quote}”${validWindow(c.time)?` 时间范围：${period}。`: ' 事件时间尚不明确。'}这是一条来源说法，仍需核对。`:`${source.author} ${category==='inferred'?'reported or inferred':'recorded'}: “${c.quote}” ${validWindow(c.time)?`Time range: ${period}.`:'Event time remains unclear.'} This is an attributed account, still subject to review.`;
}
export function auditEpisode(ledger,lang='en'){
 const language=lang==='zh'?'zh':'en',zh=language==='zh',copy=copyFor(language),result=reconstruct(ledger),sources=activeSources(ledger),byId=new Map(sources.map(s=>[s.id,s]));
 const configured=validateCoverage(ledger.coverage||emptyCoverage());
 const liveBindings=configured.bindings.filter(b=>byId.get(b.sourceId)?.version===b.sourceVersion);
 const liveProfiles=new Set(liveBindings.map(b=>b.profileId));
 // A single corrected binding withdraws its whole profile until observation setup is reviewed.
 const staleProfiles=new Set(configured.bindings.filter(b=>byId.get(b.sourceId)?.version!==b.sourceVersion).map(b=>b.profileId));
 const state={...configured,profiles:configured.profiles.filter(p=>liveProfiles.has(p.id)&&!staleProfiles.has(p.id)),bindings:[],assertions:[]};
 const validAssertions=configured.assertions.filter(a=>a.reviewed&&!staleProfiles.has(a.profileId)&&a.evidence.every(e=>byId.get(e.sourceId)?.version===e.sourceVersion&&byId.get(e.sourceId).text.includes(e.quote)));
 const events=new Set();
 const assertions=validAssertions.filter(a=>{const k=JSON.stringify([a.profileId,a.eventId,a.category]);if(events.has(k))return false;events.add(k);return true;});
 const claims=result.claims.map(c=>{
  const coverage=coverageFor(state,c.topic,c.time,c.subject);
  const opposite=result.claims.filter(o=>o.key!==c.key&&o.subject===c.subject&&c.subject!=='unknown'&&o.topic===c.topic&&o.polarity!=='unknown'&&c.polarity!=='unknown'&&o.polarity!==c.polarity&&overlap(o.time,c.time));
  const linked=result.relations.filter(r=>r.status==='proposed'&&r.type==='contradicts'&&(r.from===c.key||r.to===c.key)).map(r=>result.claims.find(o=>o.key===(r.from===c.key?r.to:r.from)));
  const contradicting=[...new Map([...opposite,...linked].map(o=>[o.key,o])).values()];
  const unresolved=result.claims.filter(o=>o.key!==c.key&&o.subject===c.subject&&o.topic===c.topic&&(!validWindow(o.time)||o.polarity==='unknown'));
  const matches=a=>a.subject===c.subject&&a.eventClass===c.topic&&contains(a.window,c.time)&&a.evidence.some(e=>e.sourceId===c.sourceId&&e.sourceVersion===c.sourceVersion&&e.quote===c.quote)&&liveBindings.some(b=>b.sourceId===c.sourceId&&b.profileId===a.profileId);
  const denial=assertions.find(a=>a.category==='explicitly_negated'&&matches(a)&&coverageFor({...state,profiles:state.profiles.filter(p=>p.id===a.profileId)},c.topic,c.time,c.subject).negativeEligible);
  const positive=assertions.filter(a=>a.category==='observed'&&a.subject===c.subject&&a.eventClass===c.topic&&overlap(a.window,c.time));
  const negative=c.polarity==='denied'||c.basis==='not_observed';
  let category=c.basis==='not_observed'?'not_observed':c.polarity==='unknown'?'unknown':c.polarity==='denied'?'not_observed':c.basis==='reported'||c.basis==='uncertain'?'inferred':'directly_observed';
  if(c.polarity==='denied'&&denial&&coverage.negativeEligible&&!contradicting.length&&!positive.length&&!unresolved.length&&!result.unanalysed.length)category='explicitly_negated';
  const conflict=contradicting.length>0||(negative&&positive.length>0);
  const status=conflict?'CONTESTED':!validWindow(c.time)?'UNRESOLVED':category==='not_observed'||category==='unknown'||coverage.level!=='well'?'UNDEROBSERVED':'SUPPORTED';
  const supporting=c.dependencies.map(d=>({...d}));
  const wording=permittedWording(c,category,coverage,byId.get(c.sourceId),language);
  const reason=category==='explicitly_negated'?(zh?'明确否定已由人核对；本来源直接、连续覆盖该事件和对象，且未发现相反依据。结论仅限此来源。':'A human-reviewed explicit negation has direct continuous source coverage and no identified opposing evidence. Scope remains source-bounded.'):negative?(zh?'缺少充分、已核对的否定依据；没有记录或没有看见，不能变成没有发生。':'Missing observations cannot establish absence; sufficient reviewed negative evidence is missing.'):(zh?'保留来源原话，不把模型对原话的解释当成独立事实。':'The source account is attributed, not promoted to an independently verified fact.');
  return {id:c.key,claim:c,category:conflict?'contradicted':category,maximumStrength:category,status,wording,supportingEvidence:supporting,contradictingEvidence:[...contradicting.flatMap(o=>o.dependencies),...(negative?positive.flatMap(a=>a.evidence):[])],unresolvedEvidence:unresolved.flatMap(o=>o.dependencies),coverage,blindSpots:coverage.blindSpots,reason,alternatives:conflict?[zh?'不同说法可能指向不同的事件，仍需核对时间和对象。':'Accounts may refer to different occurrences; verify time and subject.']:negative?[zh?'事件可能发生在未被观察的时间或地点。':'The event may have occurred outside the observed time or scope.']:[]};
 });
 const questions=claims.filter(a=>a.status!=='SUPPORTED').map(a=>{
  const p=state.profiles.find(p=>liveBindings.some(b=>b.sourceId===a.claim.sourceId&&b.profileId===p.id));
  const window=a.coverage.gaps[0]||a.claim.time;
  const text=!validWindow(a.claim.time)?(zh?'这条描述指的是哪一天、哪个时间段？':'What date and time period does this account refer to?'):p?.type==='wearable'?(zh?`${timeRange(window,language)}，设备是否一直佩戴在本人身上？`:`Was the wearable being worn by this person during ${timeRange(window,language)}?`):(zh?`${timeRange(window,language)}，是否有人一直在她/他身边，并能观察到${copy.classes[a.claim.topic]||a.claim.topic}？`:`Was anyone with this person and able to observe ${copy.classes[a.claim.topic]||a.claim.topic} during ${timeRange(window,language)}?`);
  const factors={importance:a.claim.topic==='medication'?2:1,uncertainty:a.status==='CONTESTED'?3:a.status==='UNRESOLVED'?3:2,reliabilityGap:p?.reliability.level==='high'?0:1,expectedClarification:validWindow(a.claim.time)?2:1};
  return {claimId:a.id,text,affectedEvidence:a.supportingEvidence.map(e=>e.sourceId),reason:a.reason,factors,score:Object.values(factors).reduce((n,x)=>n+x,0)};
 }).sort((a,b)=>b.score-a.score||a.claimId.localeCompare(b.claimId));
 const pairs=new Set(),timelines=[];
 for(const a of claims.filter(a=>a.status==='CONTESTED'))for(const b of claims){
  if(a.id===b.id||!a.contradictingEvidence.some(e=>b.supportingEvidence.some(s=>s.sourceId===e.sourceId&&s.quote===e.quote)))continue;
  const id=[a.id,b.id].sort().join('|');if(pairs.has(id))continue;pairs.add(id);
  timelines.push({id,candidates:[a,b].map(x=>({claimId:x.id,window:x.claim.time,wording:x.wording,evidence:x.supportingEvidence})),missing:questions.filter(q=>q.claimId===a.id||q.claimId===b.id).map(q=>q.text)});
 }
 return {version:1,language,pendingSourceIds:result.unanalysed,claims,questions:questions.slice(0,3),timelines,coverageRevision:configured.revision,duplicateEventsIgnored:validAssertions.length-assertions.length,staleProfileIds:[...staleProfiles]};
}
export function firewallText(ledger,lang='en'){
 const c=copyFor(lang),a=auditEpisode(ledger,lang);
 return [c.title,c.intro,...a.claims.flatMap(x=>['',c.labels[x.status],x.wording,c.why+': '+x.reason,...x.supportingEvidence.map(e=>`[${e.sourceId} v${e.sourceVersion}] ${e.quote}`),c.coverage+': '+c.levels[x.coverage.level],...x.coverage.gaps.map(w=>timeRange(w,lang))]),'',c.debt,...a.questions.map(q=>q.text+' ['+q.affectedEvidence.join(', ')+']'),c.unverified].join('\n');
}
