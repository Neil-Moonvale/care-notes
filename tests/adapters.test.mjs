import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptCaregiverObservation,adaptFrigateReview,adaptHealthConnectSleep,adaptHomeAssistantEvent,adaptSourceStatus} from '../dist/adapters.js';

test('Health Connect sleep becomes a low-level duration observation',()=>{
  const event=adaptHealthConnectSleep({id:'sleep-1',startTime:'2026-09-06T23:30:00+08:00',endTime:'2026-09-07T05:30:00+08:00'});
  assert.equal(event.source_type,'health_connect');
  assert.equal(event.event_type,'sleep_duration');
  assert.equal(event.value,6);
  assert.equal(event.baseline_metric,'sleep_duration');
  assert.match(event.raw_reference,/health-connect:sleep:sleep-1/);
});

test('Home Assistant preserves the source state instead of assigning clinical meaning',()=>{
  const event=adaptHomeAssistantEvent({entity_id:'binary_sensor.living_room_motion',state:'on',last_changed:'2026-09-07T02:13:00+08:00',context_id:'ctx-1'});
  assert.equal(event.event_type,'room_activity');
  assert.equal(event.value,'on');
  assert.ok(!JSON.stringify(event).toLowerCase().includes('depression'));
});

test('Frigate review metadata does not require uploading raw video',()=>{
  const event=adaptFrigateReview({id:'review-1',camera:'living_room',start_time:Date.parse('2026-09-07T02:47:00Z')/1000,label:'person',zones:['living_room']});
  assert.equal(event.source_type,'frigate');
  assert.equal(event.event_type,'room_activity');
  assert.equal(event.raw_reference,'frigate:review:review-1');
  assert.deepEqual(event.value.zones,['living_room']);
});

test('caregiver observation stays human-confirmed and keeps original wording',()=>{
  const event=adaptCaregiverObservation({id:'note-1',author_id:'caregiver_a',observed_at:'2026-09-07T08:20:00+08:00',text:'早餐只吃了几口。',normalized_value:'meal_reduced'});
  assert.equal(event.human_confirmed,true);
  assert.equal(event.note,'早餐只吃了几口。');
  assert.equal(event.value,'meal_reduced');
});

test('source status distinguishes permission gaps from real-world absence',()=>{
  const event=adaptSourceStatus({id:'status-1',source_type:'health_connect',source_id:'sleep',observed_at:'2026-09-07T08:00:00+08:00',status:'permission_unavailable',related_metric:'sleep_duration'});
  assert.equal(event.event_type,'source_status');
  assert.equal(event.value,'permission_unavailable');
  assert.equal(event.related_metric,'sleep_duration');
  assert.throws(()=>adaptSourceStatus({...event,id:'bad',observed_at:event.observed_at,status:'did_not_sleep'}));
});
