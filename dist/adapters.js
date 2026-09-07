import {validateEvidenceEvent} from './evidence.js';

export const SOURCE_STATES=['available','sensor_offline','permission_unavailable','not_synced','no_event_observed'];

function iso(value){
  const ms=typeof value==='number'?value*1000:Date.parse(value);
  if(!Number.isFinite(ms)) throw new Error('invalid adapter timestamp');
  return new Date(ms).toISOString();
}

function safe(value){
  return String(value??'event').replace(/[^a-zA-Z0-9_.:-]+/g,'-').slice(0,72).replace(/^-+|-+$/g,'')||'event';
}

function canonical({prefix,rawId,sourceType,sourceId,observedAt,receivedAt=observedAt,eventType,value,unit=null,confidence=.99,subject='person_a',humanConfirmed=false,privacyLevel='personal',rawReference,provenance,extra={}}){
  const event={
    event_id:`ev:${safe(prefix)}:${safe(rawId)}`,
    source_type:sourceType,
    source_id:sourceId,
    observed_at:iso(observedAt),
    received_at:iso(receivedAt),
    event_type:eventType,
    value,
    unit,
    confidence,
    subject,
    human_confirmed:humanConfirmed,
    privacy_level:privacyLevel,
    raw_reference:rawReference||`${sourceType}:${rawId}`,
    provenance:{adapter:provenance.adapter,adapter_version:provenance.adapter_version||'0.1',derived:false},
    ...extra
  };
  return validateEvidenceEvent(event);
}

export function adaptHealthConnectSleep(record,{subject='person_a',sourceId='health_connect:sleep',receivedAt}={}){
  if(!record?.id || !record.startTime || !record.endTime) throw new Error('invalid Health Connect sleep record');
  const start=Date.parse(record.startTime), end=Date.parse(record.endTime);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start) throw new Error('invalid Health Connect sleep interval');
  const hours=Math.round(((end-start)/3_600_000)*100)/100;
  return canonical({
    prefix:'hc-sleep',rawId:record.id,sourceType:'health_connect',sourceId,observedAt:record.endTime,receivedAt:receivedAt||record.endTime,
    eventType:'sleep_duration',value:hours,unit:'hours',confidence:.98,subject,rawReference:`health-connect:sleep:${record.id}`,
    provenance:{adapter:'health_connect'},extra:{baseline_metric:'sleep_duration',deviation_direction:'lower'}
  });
}

export function adaptHomeAssistantEvent(record,{subject='person_a',eventType,privacyLevel='household',receivedAt}={}){
  if(!record?.entity_id || !record.last_changed) throw new Error('invalid Home Assistant event');
  const inferred=eventType||(record.entity_id.includes('door')||record.entity_id.includes('lock')?'door_event':'room_activity');
  return canonical({
    prefix:'ha',rawId:record.context_id||`${record.entity_id}:${record.last_changed}`,sourceType:'home_assistant',sourceId:record.entity_id,
    observedAt:record.last_changed,receivedAt:receivedAt||record.last_changed,eventType:inferred,value:record.state,confidence:.99,subject,
    privacyLevel,rawReference:`home-assistant:${record.entity_id}:${record.context_id||record.last_changed}`,
    provenance:{adapter:'home_assistant'}
  });
}

export function adaptFrigateReview(record,{subject='person_a',receivedAt}={}){
  if(!record?.id || !record.camera || record.start_time===undefined) throw new Error('invalid Frigate review event');
  const observedAt=iso(record.start_time);
  const value={label:record.label||'activity',zones:Array.isArray(record.zones)?record.zones:[]};
  return canonical({
    prefix:'frigate',rawId:record.id,sourceType:'frigate',sourceId:record.camera,observedAt,receivedAt:receivedAt||observedAt,
    eventType:'room_activity',value,confidence:typeof record.confidence==='number'?record.confidence:.95,subject,privacyLevel:'household',
    rawReference:`frigate:review:${record.id}`,provenance:{adapter:'frigate'}
  });
}

export function adaptCaregiverObservation(record,{subject='person_a',receivedAt}={}){
  if(!record?.id || !record.observed_at || !String(record.text||'').trim()) throw new Error('invalid caregiver observation');
  return canonical({
    prefix:'caregiver',rawId:record.id,sourceType:'caregiver_note',sourceId:record.author_id||'caregiver',observedAt:record.observed_at,
    receivedAt:receivedAt||record.observed_at,eventType:'caregiver_observation',value:record.normalized_value??record.text,
    confidence:typeof record.confidence==='number'?record.confidence:.9,subject,humanConfirmed:record.human_confirmed!==false,privacyLevel:'household',
    rawReference:`caregiver-note:${record.id}`,provenance:{adapter:'caregiver_note'},extra:{note:record.text,claim_key:record.claim_key||undefined}
  });
}

export function adaptSourceStatus(record,{subject='person_a',receivedAt}={}){
  if(!record?.id || !record.source_type || !record.source_id || !record.observed_at) throw new Error('invalid source status');
  if(!SOURCE_STATES.includes(record.status)) throw new Error('invalid source status value');
  return canonical({
    prefix:'status',rawId:record.id,sourceType:record.source_type,sourceId:record.source_id,observedAt:record.observed_at,
    receivedAt:receivedAt||record.observed_at,eventType:'source_status',value:record.status,confidence:1,subject,privacyLevel:record.privacy_level||'personal',
    rawReference:record.raw_reference||`${record.source_type}:status:${record.id}`,provenance:{adapter:record.adapter||'source_status'},
    extra:{related_metric:record.related_metric||record.source_id,status_detail:record.detail||undefined}
  });
}
