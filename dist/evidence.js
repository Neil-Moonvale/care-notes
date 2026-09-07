const REQUIRED = ['event_id','source_type','source_id','observed_at','received_at','event_type','confidence','subject','human_confirmed','privacy_level','provenance'];
const RELATIONS = new Set(['supports','conflicts_with','same_episode','baseline_deviation','derived_from','uncertain_about']);
const GAP_EVENT_TYPES = new Set(['sensor_status','source_status']);
const SOURCE_GAP_VALUES = new Set(['sensor_offline','permission_unavailable','not_synced','no_event_observed']);

export function median(values){
  const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!xs.length) return null;
  const i=Math.floor(xs.length/2);
  return xs.length%2?xs[i]:(xs[i-1]+xs[i])/2;
}

export function mad(values, center=median(values)){
  if(center===null) return null;
  return median(values.filter(Number.isFinite).map(v=>Math.abs(v-center)));
}

export function validateEvidenceEvent(event){
  if(!event || typeof event!=='object') throw new Error('event must be an object');
  for(const key of REQUIRED) if(!(key in event)) throw new Error(`missing ${key}`);
  if(!/^[a-zA-Z0-9_.:-]{3,120}$/.test(event.event_id)) throw new Error('invalid event_id');
  if(!Number.isFinite(Date.parse(event.observed_at)) || !Number.isFinite(Date.parse(event.received_at))) throw new Error('invalid timestamp');
  if(typeof event.confidence!=='number' || event.confidence<0 || event.confidence>1) throw new Error('invalid confidence');
  if(typeof event.human_confirmed!=='boolean') throw new Error('invalid human_confirmed');
  if(!event.provenance || typeof event.provenance!=='object' || !event.provenance.adapter) throw new Error('invalid provenance');
  if(GAP_EVENT_TYPES.has(event.event_type) && event.value!=='available' && !SOURCE_GAP_VALUES.has(event.value)) throw new Error('invalid source gap state');
  return event;
}

export function validateEvidence(events){
  if(!Array.isArray(events)) throw new Error('events must be an array');
  const ids=new Set();
  return events.map(event=>{
    validateEvidenceEvent(event);
    if(ids.has(event.event_id)) throw new Error(`duplicate event_id: ${event.event_id}`);
    ids.add(event.event_id);
    return event;
  });
}

export function buildPersonalBaseline(events,{before,minimumSamples=3}={}){
  validateEvidence(events);
  const cutoff=before?Date.parse(before):Infinity;
  const groups=new Map();
  for(const event of events){
    if(Date.parse(event.observed_at)>=cutoff || typeof event.value!=='number' || !event.baseline_metric) continue;
    const unit=event.unit??'';
    const key=`${event.baseline_metric}|${unit}`;
    if(!groups.has(key)) groups.set(key,{metric:event.baseline_metric,unit,values:[],evidence_ids:[]});
    const group=groups.get(key); group.values.push(event.value); group.evidence_ids.push(event.event_id);
  }
  const result={};
  for(const group of groups.values()){
    if(group.values.length<minimumSamples) continue;
    const center=median(group.values), spread=mad(group.values,center)??0;
    result[group.metric]={metric:group.metric,unit:group.unit,median:center,mad:spread,samples:group.values.length,evidence_ids:group.evidence_ids};
  }
  return result;
}

function thresholdFor(base,direction){
  const relative=Math.abs(base.median)*0.3;
  const robust=3*(base.mad||0);
  const delta=Math.max(relative,robust,base.unit==='hours'?1:1);
  return direction==='lower'?base.median-delta:base.median+delta;
}

export function detectBaselineDeviations(events,baseline,{after}={}){
  const start=after?Date.parse(after):-Infinity;
  const deviations=[];
  for(const event of events){
    if(Date.parse(event.observed_at)<start || typeof event.value!=='number' || !event.baseline_metric) continue;
    const base=baseline[event.baseline_metric]; if(!base) continue;
    const direction=event.deviation_direction || 'either';
    const lower=thresholdFor(base,'lower'), upper=thresholdFor(base,'higher');
    const isDeviation=direction==='lower'?event.value<lower:direction==='higher'?event.value>upper:(event.value<lower||event.value>upper);
    if(!isDeviation) continue;
    deviations.push({
      edge_id:`baseline:${event.event_id}`,
      from:event.event_id,
      to:`baseline:${event.baseline_metric}`,
      relation:'baseline_deviation',
      confidence:1,
      proposed_by:'local_rules',
      human_confirmed:false,
      metric:event.baseline_metric,
      observed:event.value,
      baseline_median:base.median,
      unit:base.unit,
      direction:event.value<base.median?'lower':'higher',
      reason:`${event.baseline_metric} differs from the personal baseline`
    });
  }
  return deviations;
}

export function detectConflicts(events){
  const groups=new Map();
  for(const event of events){
    if(!event.claim_key || event.value===null || event.value===undefined) continue;
    if(!groups.has(event.claim_key)) groups.set(event.claim_key,[]);
    groups.get(event.claim_key).push(event);
  }
  const edges=[];
  for(const [claimKey,items] of groups){
    for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){
      if(JSON.stringify(items[i].value)===JSON.stringify(items[j].value)) continue;
      edges.push({edge_id:`conflict:${items[i].event_id}:${items[j].event_id}`,from:items[i].event_id,to:items[j].event_id,relation:'conflicts_with',confidence:1,proposed_by:'local_rules',human_confirmed:false,reason:`Different observations for ${claimKey}`});
    }
  }
  return edges;
}

export function sourceGapEvents(events,{after}={}){
  const start=after?Date.parse(after):-Infinity;
  return events.filter(event=>Date.parse(event.observed_at)>=start && GAP_EVENT_TYPES.has(event.event_type) && SOURCE_GAP_VALUES.has(event.value));
}

function noteworthy(event,deviationIds){
  return deviationIds.has(event.event_id) || ['caregiver_observation','sensor_status','source_status','door_event','phone_activity','room_activity'].includes(event.event_type) || Boolean(event.claim_key);
}

function episodeLink(from,to,gapHours){
  const hours=(Date.parse(to.observed_at)-Date.parse(from.observed_at))/3_600_000;
  const confidence=Math.max(.5,Math.min(.98,1-(hours/(gapHours*2))));
  return {
    edge_id:`episode-link:${from.event_id}:${to.event_id}`,
    from:from.event_id,
    to:to.event_id,
    relation:'same_episode',
    confidence:Math.round(confidence*100)/100,
    proposed_by:'local_rules',
    human_confirmed:false,
    reason:`Temporal proximity: ${Math.round(hours*10)/10}h apart inside a ${gapHours}h review window`
  };
}

export function reconstructEpisodes(events,{baseline,after,gapHours=18}={}){
  validateEvidence(events);
  const deviations=detectBaselineDeviations(events,baseline||{}, {after});
  const conflicts=detectConflicts(events);
  const deviationIds=new Set(deviations.map(d=>d.from));
  const filtered=events.filter(e=>(!after||Date.parse(e.observed_at)>=Date.parse(after))&&noteworthy(e,deviationIds)).sort((a,b)=>Date.parse(a.observed_at)-Date.parse(b.observed_at));
  const clusters=[];
  for(const event of filtered){
    const at=Date.parse(event.observed_at), last=clusters.at(-1);
    if(!last || at-last.lastAt>gapHours*3600000) clusters.push({events:[event],links:[],lastAt:at});
    else {
      last.links.push(episodeLink(last.events.at(-1),event,gapHours));
      last.events.push(event);
      last.lastAt=at;
    }
  }
  return clusters.map((cluster,index)=>{
    const ids=cluster.events.map(e=>e.event_id);
    const localDeviations=deviations.filter(d=>ids.includes(d.from));
    const localConflicts=conflicts.filter(c=>ids.includes(c.from)&&ids.includes(c.to));
    const unknowns=cluster.events.filter(e=>GAP_EVENT_TYPES.has(e.event_type)&&SOURCE_GAP_VALUES.has(e.value));
    const unknownEdges=unknowns.map(event=>({
      edge_id:`unknown:${event.event_id}`,
      from:event.event_id,
      to:`metric:${event.related_metric||event.source_id}`,
      relation:'uncertain_about',
      confidence:1,
      proposed_by:'local_rules',
      human_confirmed:false,
      reason:`Source state ${event.value} leaves ${event.related_metric||event.source_id} unknown`
    }));
    const claims=[];
    for(const d of localDeviations){
      claims.push({claim_type:'baseline_deviation',certainty:'supported',metric:d.metric,direction:d.direction,observed:d.observed,baseline_median:d.baseline_median,unit:d.unit,evidence_ids:[d.from]});
    }
    for(const event of unknowns){
      claims.push({claim_type:'unknown',certainty:'unknown',metric:event.related_metric||event.source_id,status:event.value,evidence_ids:[event.event_id]});
    }
    if(localConflicts.length) claims.push({claim_type:'conflict',certainty:'conflicting',count:localConflicts.length,evidence_ids:[...new Set(localConflicts.flatMap(c=>[c.from,c.to]))]});
    return {
      episode_id:`ep_${String(index+1).padStart(2,'0')}`,
      start_at:cluster.events[0].observed_at,
      end_at:cluster.events.at(-1).observed_at,
      status:'needs_review',
      evidence_ids:ids,
      claims,
      edges:[...cluster.links,...localDeviations,...localConflicts,...unknownEdges]
    };
  });
}

function evidenceForClaim(claim,evidence){
  const byId=new Map(evidence.map(e=>[e.event_id,e]));
  return claim.evidence_ids.map(id=>byId.get(id)).filter(Boolean);
}

export function validateDerivedClaim(claim,evidence){
  const ids=new Set(evidence.map(e=>e.event_id));
  if(!claim || !Array.isArray(claim.evidence_ids) || !claim.evidence_ids.length) return {ok:false,reason:'claim has no evidence IDs'};
  const missing=claim.evidence_ids.filter(id=>!ids.has(id));
  if(missing.length) return {ok:false,reason:`unknown evidence IDs: ${missing.join(', ')}`};
  if(!['supported','unknown','conflicting'].includes(claim.certainty)) return {ok:false,reason:'invalid certainty'};
  const refs=evidenceForClaim(claim,evidence);
  if(claim.claim_type==='baseline_deviation'){
    const match=refs.some(event=>event.baseline_metric===claim.metric && typeof event.value==='number');
    if(!match || claim.certainty!=='supported') return {ok:false,reason:'baseline claim is not supported by matching baseline evidence'};
    return {ok:true};
  }
  if(claim.claim_type==='unknown'){
    const match=refs.some(event=>GAP_EVENT_TYPES.has(event.event_type)&&SOURCE_GAP_VALUES.has(event.value)&&(claim.metric===undefined||event.related_metric===claim.metric||event.source_id===claim.metric));
    if(!match || claim.certainty!=='unknown') return {ok:false,reason:'unknown claim requires a matching source-gap event'};
    return {ok:true};
  }
  if(claim.claim_type==='conflict'){
    const grouped=new Map();
    for(const event of refs){
      if(!event.claim_key) continue;
      if(!grouped.has(event.claim_key)) grouped.set(event.claim_key,[]);
      grouped.get(event.claim_key).push(event.value);
    }
    const match=[...grouped.values()].some(values=>new Set(values.map(v=>JSON.stringify(v))).size>1);
    if(!match || claim.certainty!=='conflicting') return {ok:false,reason:'conflict claim requires contradictory evidence for the same claim key'};
    return {ok:true};
  }
  return {ok:false,reason:'unsupported derived claim type'};
}

export function validateGraphEdges(edges,evidence){
  const ids=new Set(evidence.map(e=>e.event_id));
  for(const edge of edges){
    if(!RELATIONS.has(edge.relation)) throw new Error(`invalid relation: ${edge.relation}`);
    if(!ids.has(edge.from)) throw new Error(`unknown edge source: ${edge.from}`);
    const pseudo=String(edge.to).startsWith('baseline:')||String(edge.to).startsWith('metric:');
    if(!ids.has(edge.to) && !pseudo) throw new Error(`unknown edge target: ${edge.to}`);
    if(typeof edge.confidence!=='number'||edge.confidence<0||edge.confidence>1) throw new Error('invalid edge confidence');
  }
  return true;
}

export function validateEpisodeRecord(episode,evidence){
  if(!episode||typeof episode!=='object') return {ok:false,reason:'episode must be an object'};
  if(!Array.isArray(episode.evidence_ids)||!episode.evidence_ids.length) return {ok:false,reason:'episode has no evidence'};
  const ids=new Set(evidence.map(e=>e.event_id));
  if(episode.evidence_ids.some(id=>!ids.has(id))) return {ok:false,reason:'episode references unknown evidence'};
  if(!Number.isFinite(Date.parse(episode.start_at))||!Number.isFinite(Date.parse(episode.end_at))||Date.parse(episode.end_at)<Date.parse(episode.start_at)) return {ok:false,reason:'invalid episode time range'};
  try{validateGraphEdges(episode.edges||[],evidence);}catch(error){return {ok:false,reason:error.message};}
  for(const claim of episode.claims||[]){
    const result=validateDerivedClaim(claim,evidence);
    if(!result.ok) return result;
  }
  return {ok:true};
}
