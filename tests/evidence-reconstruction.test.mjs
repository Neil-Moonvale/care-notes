import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPersonalBaseline,detectBaselineDeviations,detectConflicts,reconstructEpisodes,sourceGapEvents,validateDerivedClaim,validateEvidence,validateGraphEdges} from '../dist/evidence.js';
import {fictionalSevenDayEvidence} from '../dist/demo-evidence.js';

const demo=JSON.parse(fs.readFileSync(new URL('../examples/fictional-7-day-evidence.json',import.meta.url),'utf8'));
const events=demo.events;

test('fictional evidence validates with unique stable IDs',()=>{
  assert.equal(validateEvidence(events).length,events.length);
});

test('browser demo evidence also validates',()=>{
  const browserDemo=fictionalSevenDayEvidence();
  assert.equal(validateEvidence(browserDemo.events).length,browserDemo.events.length);
  assert.equal(browserDemo.baseline_before,demo.baseline_before);
});

test('builds a four-day personal baseline',()=>{
  const baseline=buildPersonalBaseline(events,{before:demo.baseline_before});
  assert.equal(baseline.sleep_duration.samples,4);
  assert.equal(baseline.night_activity_count.samples,4);
  assert.ok(baseline.sleep_duration.median>7);
});

test('detects large changes without naming a diagnosis',()=>{
  const baseline=buildPersonalBaseline(events,{before:demo.baseline_before});
  const deviations=detectBaselineDeviations(events,baseline,{after:demo.baseline_before});
  assert.ok(deviations.some(d=>d.from==='ev_0505_sleep'&&d.direction==='lower'));
  assert.ok(deviations.some(d=>d.from==='ev_0505_night'&&d.direction==='higher'));
  assert.ok(deviations.every(d=>!String(d.reason).toLowerCase().includes('insomnia')));
});

test('preserves conflicting caregiver observations',()=>{
  const conflicts=detectConflicts(events);
  assert.ok(conflicts.some(c=>new Set([c.from,c.to]).has('ev_0505_breakfast_a')&&new Set([c.from,c.to]).has('ev_0505_breakfast_b')));
});

test('source gaps remain explicit evidence context',()=>{
  const gaps=sourceGapEvents(events,{after:demo.baseline_before});
  assert.ok(gaps.some(g=>g.event_id==='ev_0505_med_status'&&g.value==='sensor_offline'));
});

test('reconstructs reviewable episodes with traceable claims',()=>{
  const baseline=buildPersonalBaseline(events,{before:demo.baseline_before});
  const episodes=reconstructEpisodes(events,{baseline,after:demo.baseline_before});
  assert.ok(episodes.length>=1);
  const claims=episodes.flatMap(e=>e.claims);
  assert.ok(claims.some(c=>c.claim_type==='unknown'&&c.metric==='medication_status'));
  assert.ok(claims.some(c=>c.claim_type==='conflict'));
  assert.ok(episodes.flatMap(e=>e.edges).some(edge=>edge.relation==='uncertain_about'&&edge.to==='metric:medication_status'));
  for(const episode of episodes){
    validateGraphEdges(episode.edges,events);
    for(const claim of episode.claims) assert.equal(validateDerivedClaim(claim,events).ok,true);
  }
});

test('rejects a derived claim with no evidence',()=>{
  assert.equal(validateDerivedClaim({certainty:'supported',evidence_ids:[]},events).ok,false);
});

test('rejects an unknown claim backed only by phone activity',()=>{
  const result=validateDerivedClaim({claim_type:'unknown',certainty:'unknown',metric:'medication_status',evidence_ids:['ev_0505_phone']},events);
  assert.equal(result.ok,false);
});

test('rejects a conflict claim when cited observations do not conflict',()=>{
  const result=validateDerivedClaim({claim_type:'conflict',certainty:'conflicting',evidence_ids:['ev_0505_phone','ev_0505_door']},events);
  assert.equal(result.ok,false);
});

test('rejects semantic upgrade from phone activity to a baseline sleep claim',()=>{
  const result=validateDerivedClaim({claim_type:'baseline_deviation',certainty:'supported',metric:'sleep_duration',evidence_ids:['ev_0505_phone']},events);
  assert.equal(result.ok,false);
});
