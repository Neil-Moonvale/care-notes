import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCoverage,coverageFor} from '../dist/evidence-coverage.js';
const w={start:'2026-09-20T20:00:00Z',end:'2026-09-20T21:00:00Z'};
export const profile=(patch={})=>({id:'camera',type:'camera',label:'Camera',subject:'person',capabilities:['medication'],contractCapabilities:['medication'],reviewed:true,mode:'direct',active:[w],unavailable:[],blindSpots:[],cadenceSeconds:null,heartbeats:[],clockOffsetSeconds:0,clockUncertaintySeconds:0,reliability:{level:'high',basis:'Synthetic controlled coverage'},silenceMeaningful:true,...patch});
const state=p=>({version:1,revision:1,profiles:[p],bindings:[],assertions:[]});
test('full observation differs from an online source without event capability',()=>{
 assert.equal(coverageFor(state(profile()),'medication',w,'person').level,'well');
 assert.equal(coverageFor(state(profile({contractCapabilities:['motion']})),'medication',w,'person').level,'unobserved');
});
test('camera outage creates explicit blind interval and prevents full coverage',()=>{
 const gap={start:'2026-09-20T20:10:00Z',end:'2026-09-20T20:45:00Z',reason:'offline'};
 const c=coverageFor(state(profile({unavailable:[gap]})),'medication',w,'person');
 assert.equal(c.level,'poor');assert.equal(c.negativeEligible,false);assert.deepEqual(c.gaps.map(({start,end})=>({start,end})),[{start:new Date(gap.start).toISOString(),end:new Date(gap.end).toISOString()}]);
});
test('removed wearable, indirect signal and unreviewed capability cannot establish absence',()=>{
 for(const patch of [{mode:'indirect'},{reviewed:false},{unavailable:[{...w,reason:'not worn'}]},{blindSpots:['Cannot see swallowing']}])assert.equal(coverageFor(state(profile(patch)),'medication',w,'person').negativeEligible,false);
});
test('reporting cadence expires when caregiver stops reporting',()=>{
 const c=coverageFor(state(profile({cadenceSeconds:600,heartbeats:[w.start]})),'medication',w,'person');
 assert.equal(c.level,'poor');assert.equal(c.negativeEligible,false);
});
test('clock uncertainty shrinks observation and offset shifts source clock',()=>{
 assert.equal(coverageFor(state(profile({clockUncertaintySeconds:60})),'medication',w,'person').negativeEligible,false);
 assert.equal(coverageFor(state(profile({clockOffsetSeconds:3600})),'medication',w,'person').level,'unobserved');
});
test('unknown window and subject cannot be treated as fully covered',()=>{
 assert.equal(coverageFor(state(profile()),'medication',{start:null,end:null},'person').level,'unobserved');
 assert.equal(coverageFor(state(profile()),'medication',w,'unknown').negativeEligible,false);
});
test('malformed coverage fails closed',()=>{
 for(const patch of [{active:[{start:w.end,end:w.start}]},{clockOffsetSeconds:NaN},{capabilities:['']},{cadenceSeconds:0},{mode:'magic'}])assert.throws(()=>validateCoverage(state(profile(patch))),/invalid_coverage/);
});
test('impossible calendar dates and non-boolean trust declarations are rejected',()=>{
 assert.throws(()=>validateCoverage(state(profile({active:[{start:'2026-02-30T20:00:00Z',end:'2026-03-03T20:00:00Z'}]}))),/invalid_coverage/);
 assert.throws(()=>validateCoverage(state(profile({reviewed:'true'}))),/invalid_coverage/);
});
test('known blind spots prevent the strongest coverage label',()=>{
 assert.notEqual(coverageFor(state(profile({blindSpots:['Hidden corner']})),'medication',w,'person').level,'well');
});
