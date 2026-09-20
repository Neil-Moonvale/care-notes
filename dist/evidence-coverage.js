// Deterministic observation coverage. No provider call or model-owned capability grant.
const fail=()=>{throw Error('invalid_coverage');};
const check=x=>{if(!x)fail();};
const str=(s,n=200)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;
const id=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(s);
export const emptyCoverage=()=>({version:1,revision:0,profiles:[],bindings:[],assertions:[]});
const ms=s=>typeof s==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(s)?Date.parse(s):NaN;
export const validWindow=w=>w&&Number.isFinite(ms(w.start))&&Number.isFinite(ms(w.end))&&ms(w.start)<ms(w.end);
const intervals=a=>Array.isArray(a)&&a.length<=200&&a.every(validWindow);
const strings=a=>Array.isArray(a)&&a.length<=40&&a.every(s=>str(s,300));
export function validateCoverage(input){
 check(input&&input.version===1&&Number.isSafeInteger(input.revision)&&input.revision>=0);
 check(Array.isArray(input.profiles)&&input.profiles.length<=80&&Array.isArray(input.bindings)&&input.bindings.length<=200&&Array.isArray(input.assertions)&&input.assertions.length<=200);
 const seen=new Set();
 for(const p of input.profiles){
  check(p&&id(p.id)&&!seen.has(p.id)&&str(p.label)&&str(p.type)&&str(p.subject,80));seen.add(p.id);
  check(strings(p.capabilities)&&strings(p.contractCapabilities)&&typeof p.reviewed==='boolean'&&['direct','indirect'].includes(p.mode));
  check(intervals(p.active)&&intervals(p.unavailable)&&p.unavailable.every(x=>str(x.reason))&&strings(p.blindSpots));
  check(p.cadenceSeconds===null||(Number.isInteger(p.cadenceSeconds)&&p.cadenceSeconds>0&&p.cadenceSeconds<=86400));
  check(Array.isArray(p.heartbeats)&&p.heartbeats.length<=200&&p.heartbeats.every(h=>Number.isFinite(ms(h))));
  check(Number.isFinite(p.clockOffsetSeconds)&&Math.abs(p.clockOffsetSeconds)<=86400&&Number.isFinite(p.clockUncertaintySeconds)&&p.clockUncertaintySeconds>=0&&p.clockUncertaintySeconds<=86400);
  check(p.reliability&&['high','limited','unknown'].includes(p.reliability.level)&&str(p.reliability.basis,500)&&typeof p.silenceMeaningful==='boolean');
 }
 const bound=new Set();
 for(const b of input.bindings){check(id(b.sourceId)&&Number.isSafeInteger(b.sourceVersion)&&b.sourceVersion>0&&seen.has(b.profileId)&&!bound.has(b.sourceId));bound.add(b.sourceId);}
 const eventIds=new Set();
 for(const a of input.assertions){
  check(id(a.id)&&!eventIds.has(a.id)&&id(a.eventId)&&seen.has(a.profileId)&&str(a.subject,80)&&str(a.eventClass)&&validWindow(a.window));eventIds.add(a.id);
  check(['observed','explicitly_negated','not_observed'].includes(a.category)&&typeof a.reviewed==='boolean');
  check(Array.isArray(a.evidence)&&a.evidence.length>0&&a.evidence.length<=10&&a.evidence.every(e=>id(e.sourceId)&&Number.isSafeInteger(e.sourceVersion)&&e.sourceVersion>0&&str(e.quote,5000)));
 }
 return structuredClone(input);
}
export function withCoverage(ledger,input){
 const next=validateCoverage(input);next.revision=(ledger.coverage?.revision||0)+1;
 return {...ledger,coverage:next};
}
export const coverageFingerprint=ledger=>JSON.stringify(ledger.coverage||emptyCoverage());
const iso=n=>new Date(n).toISOString();
const intersect=(a,b)=>[Math.max(a[0],b[0]),Math.min(a[1],b[1])];
function merge(ranges){const out=[];for(const r of ranges.filter(r=>r[0]<r[1]).sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else out.push([...r]);}return out;}
function subtract(ranges,holes){let out=ranges;for(const [s,e] of holes)out=out.flatMap(([a,b])=>e<=a||s>=b?[[a,b]]:[[a,Math.min(b,s)],[Math.max(a,e),b]].filter(([x,y])=>x<y));return out;}
export function coverageFor(input,eventClass,window,subject){
 const state=validateCoverage(input||emptyCoverage());
 const base={eventClass,subject,window:structuredClone(window),level:'unobserved',fraction:0,negativeEligible:false,segments:[],gaps:[],sources:[],blindSpots:[]};
 if(!validWindow(window))return {...base,reason:'unknown_time'};
 const bounds=[ms(window.start),ms(window.end)],sources=[];
 for(const p of state.profiles){
  const reasons=[];
  if(!p.capabilities.includes(eventClass)||!p.contractCapabilities.includes(eventClass))reasons.push('not_capable');
  if(!p.reviewed)reasons.push('unreviewed');
  if(p.subject!==subject||subject==='unknown')reasons.push('subject_unknown');
  if(p.mode!=='direct')reasons.push('indirect_only');
  const offset=p.clockOffsetSeconds*1000,uncertainty=p.clockUncertaintySeconds*1000;
  let ranges=merge(p.active.map(w=>intersect([ms(w.start)+offset+uncertainty,ms(w.end)+offset-uncertainty],bounds)));
  ranges=subtract(ranges,p.unavailable.map(w=>[ms(w.start)+offset-uncertainty,ms(w.end)+offset+uncertainty]));
  if(p.cadenceSeconds!==null){const beats=p.heartbeats.map(h=>[ms(h)+offset+uncertainty,ms(h)+offset+p.cadenceSeconds*1000-uncertainty]);ranges=merge(ranges.flatMap(r=>beats.map(b=>intersect(r,b))));}
  if(!ranges.length)reasons.push('unavailable');
  if(p.blindSpots.length)reasons.push('blind_spots');
  if(p.reliability.level!=='high')reasons.push('reliability_limited');
  if(!p.silenceMeaningful)reasons.push('silence_not_evidence');
  const usable=!reasons.some(x=>['not_capable','unreviewed','subject_unknown','indirect_only'].includes(x));
  sources.push({id:p.id,label:p.label,reasons,intervals:usable?ranges:[],blindSpots:p.blindSpots,negativeEligible:usable&&!reasons.length,reliability:p.reliability,mode:p.mode});
 }
 const covered=merge(sources.flatMap(s=>s.intervals)),gaps=subtract([bounds],covered);
 const duration=covered.reduce((n,[a,b])=>n+b-a,0),fraction=duration/(bounds[1]-bounds[0]);
 // Label thresholds describe elapsed observation coverage, never truth probabilities.
 const level=fraction===0?'unobserved':fraction<.5?'poor':fraction<1?'partial':'well';
 const negativeRanges=merge(sources.filter(s=>s.negativeEligible).flatMap(s=>s.intervals));
 const edges=[...new Set([bounds[0],bounds[1],...sources.flatMap(s=>s.intervals.flat())])].sort((a,b)=>a-b);
 const segments=edges.slice(0,-1).map((a,i)=>({start:iso(a),end:iso(edges[i+1]),sourceIds:sources.filter(s=>s.intervals.some(([x,y])=>x<=a&&y>=edges[i+1])).map(s=>s.id)}));
 return {...base,level,fraction,negativeEligible:subtract([bounds],negativeRanges).length===0,segments,gaps:gaps.map(([a,b])=>({start:iso(a),end:iso(b)})),sources,blindSpots:[...new Set(sources.flatMap(s=>s.blindSpots))],reason:level==='well'?'declared_coverage':'observation_gaps'};
}
