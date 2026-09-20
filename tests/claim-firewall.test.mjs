import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,addAnalysis,reviseSource} from '../dist/reconstruction-core.js';
import {auditEpisode} from '../dist/claim-firewall.js';
import {withCoverage} from '../dist/evidence-coverage.js';
const time={start:'2026-09-20T20:00:00Z',end:'2026-09-20T21:00:00Z',quote:'20:00–21:00'};
const source={id:'s',author:'A',recordedAt:time.end,text:'20:00–21:00 I did not see medication taken.'};
const claim={id:'c',sourceId:'s',sourceVersion:1,quote:source.text,subject:'person',observer:'A',topic:'medication',basis:'observed',polarity:'denied',time};
const ledger=()=>addAnalysis(createLedger([source]),{claims:[claim],relations:[]});
const profile={id:'p',label:'A',type:'caregiver',subject:'person',capabilities:['medication'],contractCapabilities:['medication'],reviewed:true,mode:'direct',active:[time],unavailable:[],blindSpots:[],cadenceSeconds:null,heartbeats:[],clockOffsetSeconds:0,clockUncertaintySeconds:0,reliability:{level:'high',basis:'Reviewed'},silenceMeaningful:true};
const cov={version:1,revision:1,profiles:[profile],bindings:[{sourceId:'s',sourceVersion:1,profileId:'p'}],assertions:[]};
test('model denial from non-observation is downgraded even with full coverage',()=>{
 for(const l of [ledger(),withCoverage(ledger(),cov)]){const a=auditEpisode(l,'en').claims[0];assert.equal(a.maximumStrength,'not_observed');assert.match(a.wording,/No .* confirmed/);assert.ok(!a.wording.includes('did not take'));}
});
test('coverage does not turn model-proposed denial into reviewed explicit negation',()=>{
 const l=addAnalysis(createLedger([{...source,text:'20:00–21:00 There are no recorded events.'}]),{claims:[{...claim,quote:'20:00–21:00 There are no recorded events.'}],relations:[]});
 assert.equal(auditEpisode(withCoverage(l,cov)).claims[0].maximumStrength,'not_observed');
});
test('explicit reviewed bounded negative requires direct complete coverage and matching evidence',()=>{
 const s={...source,text:'20:00–21:00 I watched continuously: the box was not opened.'};
 let l=addAnalysis(createLedger([s]),{claims:[{...claim,quote:s.text}],relations:[]});
 const assertion={id:'a',eventId:'box-event',profileId:'p',subject:'person',eventClass:'medication',window:time,category:'explicitly_negated',reviewed:true,evidence:[{sourceId:'s',sourceVersion:1,quote:s.text}]};
 l=withCoverage(l,{...cov,assertions:[assertion]});
 assert.equal(auditEpisode(l).claims[0].maximumStrength,'explicitly_negated');
 assert.equal(auditEpisode(withCoverage(l,{...l.coverage,profiles:[{...profile,unavailable:[{...time,reason:'offline'}]}]})).claims[0].maximumStrength,'not_observed');
});
test('source edits invalidate bindings, assertions and old claims',()=>{
 const l=withCoverage(ledger(),cov);assert.equal(auditEpisode(reviseSource(l,'s',{text:'Correction'},1)).claims.length,0);
});
test('unknown time produces targeted question without invented interval',()=>{
 const l=addAnalysis(createLedger([source]),{claims:[{...claim,time:{start:null,end:null,quote:''}}],relations:[]});
 const a=auditEpisode(l);assert.equal(a.claims[0].status,'UNRESOLVED');assert.match(a.questions[0].text,/time/i);
});
test('opposing caregiver accounts produce contested candidates without probabilities',()=>{
 const s2={...source,id:'s2',author:'B',text:'20:00–21:00 I saw her take medication.'};
 const s1={...source,text:'20:00–21:00 She did not take medication.'};
 const l=addAnalysis(createLedger([s1,s2]),{claims:[{...claim,quote:s1.text},{...claim,id:'d',sourceId:'s2',quote:s2.text,polarity:'affirmed'}],relations:[{from:'c',to:'d',type:'contradicts'}]});
 const a=auditEpisode(l);assert.equal(a.claims[0].status,'CONTESTED');assert.equal(a.timelines.length,1);assert.equal(a.timelines[0].candidates.length,2);assert.ok(!JSON.stringify(a.timelines).includes('probability'));
});
