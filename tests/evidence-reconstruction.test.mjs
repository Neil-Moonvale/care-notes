import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPersonalBaseline,detectBaselineDeviations,detectConflicts,reconstructEpisodes,validateDerivedClaim,validateEvidence,validateGraphEdges} from '../dist/evidence.js';
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

test('reconstructs reviewable episodes with traceable claims',()=>{
  const baseline=buildPersonalBaseline(events,{before:demo.baseline_before});
  const episodes=reconstructEpisodes(events,{baseline,after:demo.baseline_before});
  assert.ok(episodes.length>=1);
  const claims=episodes.flatMap(e=>e.claims);
  assert.ok(claims.some(c=>c.claim_type==='unknown'&&c.metric==='medication_status'));
  assert.ok(claims.some(c=>c.claim_type==='conflict'));
  for(const episode of episodes){
    validateGraphEdges(episode.edges,events);
    for(const claim of episode.claims) assert.equal(validateDerivedClaim(claim,events).ok,true);
  }
});

test('rejects a derived claim with no evidence',()=>{
  assert.equal(validateDerivedClaim({certainty:'supported',evidence_ids:[]},events).ok,false);
});
