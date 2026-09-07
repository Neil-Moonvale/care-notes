import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,activeSources,addAnalysis,reviseSource,removeSource,reconstruct,reconstructionChanges,validateAnalysis} from '../dist/reconstruction-core.js';
import {cases,source,claim,windowAt} from '../examples/reconstruction-cases.mjs';

for(const c of cases)test(`evidence constraints: ${c.id}`,()=>{
  const result=reconstruct(addAnalysis(createLedger(c.sources),c.proposal,{method:'fixture'}));
  for(const id of c.expected.unknown||[])assert.equal(result.claims.find(x=>x.sourceId===id).polarity,'unknown');
  for(const type of c.expected.proposed||[])assert.ok(result.relations.some(r=>r.type===type&&r.status==='proposed'));
  assert.deepEqual(result.relations.filter(r=>r.status==='withdrawn').map(r=>r.reason).sort(),[...(c.expected.withdrawn||[])].sort());
  for(const kind of c.expected.questions||[])assert.ok(result.questions.some(q=>q.kind===kind));
  assert.equal(result.claims.length,c.proposal.claims.length);
});

test('editing a source retires its claims and links; independent evidence survives',()=>{
  const c=cases.find(c=>c.id==='compatible_accounts');
  const old=addAnalysis(createLedger(c.sources),c.proposal,{method:'fixture'}),before=reconstruct(old);
  const edited=reviseSource(old,'b',{text:'Correction: I meant September 4.'},1),after=reconstruct(edited),diff=reconstructionChanges(before,after);
  assert.equal(old.sources[1].versions.length,1);assert.equal(edited.sources[1].versions.length,2);
  assert.equal(after.claims.length,1);assert.equal(after.claims[0].sourceId,'a');
  assert.deepEqual(after.unanalysed,['b']);assert.equal(diff.withdrawnClaims.length,1);assert.equal(diff.withdrawnRelations.length,1);
  assert.ok(after.relations.every(r=>r.status==='withdrawn'));
  const s=activeSources(edited).find(s=>s.id==='b');
  const next=addAnalysis(edited,{claims:[claim(s,{basis:'reported',time:{...windowAt('04'),quote:'September 4'}})],relations:[]},{sources:[s],method:'manual'});
  assert.equal(reconstruct(next).claims.length,2);assert.deepEqual(reconstruct(next).unanalysed,[]);
  assert.equal(reconstruct(next).relations.filter(r=>r.status==='proposed').length,0);
  assert.equal(reconstruct(next).claims.find(c=>c.sourceId==='a').key,before.claims.find(c=>c.sourceId==='a').key);
});

test('a late model reply cannot reintroduce the previous version',()=>{
  const c=cases[0],initial=createLedger(c.sources),snapshot=activeSources(initial);
  const edited=reviseSource(initial,'a',{text:'Different account.'},1);
  assert.throws(()=>addAnalysis(edited,c.proposal,{method:'openai',sources:snapshot}),/stale_analysis/);
  assert.throws(()=>reviseSource(edited,'a',{text:'Stale edit.'},1),/stale_source/);
});

test('source deletion invalidates dependent output and never enters active model input',()=>{
  const c=cases[1],old=addAnalysis(createLedger(c.sources),c.proposal);
  const next=removeSource(old,'a',1),result=reconstruct(next);
  assert.equal(activeSources(next).length,1);assert.equal(result.claims.length,1);
  assert.ok(result.relations.every(r=>r.status==='withdrawn'));
  assert.equal(old.sources[0].deleted,false);
});

test('invented references, ambiguous quotations, invalid calendar dates and missing offsets are rejected',()=>{
  const s=source('a','A repeated phrase. A repeated phrase.');
  assert.throws(()=>validateAnalysis([s],{claims:[claim(s,{quote:'A repeated phrase.'})],relations:[]}),/ambiguous_quote/);
  assert.throws(()=>validateAnalysis([s],{claims:[claim(s,{sourceId:'invented'})],relations:[]}),/stale_claim/);
  for(const start of ['2026-02-30T00:00:00Z','2026-09-05T00:00:00']) {
    assert.throws(()=>validateAnalysis([s],{claims:[claim(s,{time:{start,end:'2026-09-06T00:00:00Z',quote:s.text}})],relations:[]}),/invalid_time/);
  }
});

test('overlapping pairs cannot transitively group events with no shared possible time',()=>{
  const sources=['a','b','c'].map(id=>source(id,`September 5 account ${id}.`));
  const times=[['00','03'],['02','06'],['05','08']];
  const proposal={claims:sources.map((s,i)=>claim(s,{time:{...windowAt('05',...times[i]),quote:'September 5'}})),relations:[{from:'a',to:'b',type:'same_event'},{from:'b',to:'c',type:'same_event'}]};
  const result=reconstruct(addAnalysis(createLedger(sources),proposal));
  assert.equal(result.relations.filter(r=>r.reason==='no_shared_period').length,2);
});

test('replaying equivalent extraction is idempotent for unchanged evidence',()=>{
  const c=cases[1],once=addAnalysis(createLedger(c.sources),c.proposal),twice=addAnalysis(once,c.proposal);
  assert.deepEqual(reconstruct(once),reconstruct(twice));
  assert.equal(reconstructionChanges(reconstruct(once),reconstruct(twice)).withdrawnClaims.length,0);
});

test('evidence arriving in another order preserves proposed relations',()=>{
  const c=cases[1];
  const a=reconstruct(addAnalysis(createLedger(c.sources),c.proposal));
  const b=reconstruct(addAnalysis(createLedger([...c.sources].reverse()),{claims:[...c.proposal.claims].reverse(),relations:[...c.proposal.relations].reverse()}));
  assert.deepEqual(a.claims,b.claims);assert.deepEqual(a.relations.map(x=>[x.key,x.status]).sort(),b.relations.map(x=>[x.key,x.status]).sort());
});

test('unanalysed records remain visible rather than silently omitted',()=>{
  const ledger=createLedger([source('a','An observation that the model omitted.')]);
  const result=reconstruct(addAnalysis(ledger,{claims:[],relations:[]}));
  assert.deepEqual(result.unanalysed,['a']);assert.equal(result.sourceCount,1);
});

test('question budget supports skipping all questions',()=>{
  const c=cases.find(c=>c.id==='date_question'),ledger=addAnalysis(createLedger(c.sources),c.proposal);
  assert.ok(reconstruct(ledger).questions.length>0);
  assert.deepEqual(reconstruct(ledger,{questionLimit:0}).questions,[]);
});

test('a newer analysis can withdraw a relation without changing the quotations',()=>{
  const c=cases[1],old=addAnalysis(createLedger(c.sources),c.proposal);
  const next=addAnalysis(old,{claims:c.proposal.claims,relations:[]});
  assert.equal(reconstruct(next).claims.length,2);
  assert.ok(reconstruct(next).relations.every(r=>r.status==='withdrawn'&&r.reason==='analysis_superseded'));
});

test('hearsay about non-observation keeps its lineage and unknown occurrence',()=>{
  const a=source('a','I did not see the medication taken.'),b=source('b','They told me they did not see the medication taken.');
  const proposal={claims:[claim(a,{topic:'medication'}),claim(b,{topic:'medication',basis:'reported'})],relations:[{from:'b',to:'a',type:'reported_from'}]};
  const result=reconstruct(addAnalysis(createLedger([a,b]),proposal));
  assert.equal(result.claims.find(c=>c.sourceId==='b').basis,'reported');
  assert.ok(result.claims.every(c=>c.polarity==='unknown'));
  assert.equal(result.relations[0].status,'proposed');
});

test('correcting a supporting source also invalidates interpretations of unchanged originals',()=>{
  const a=source('a','I slept that night.'),b=source('b','That night was September 5.');
  const proposal={claims:[claim(a,{support:[{sourceId:'b',sourceVersion:1,quote:b.text}],time:{...windowAt('05'),quote:'that night'}}),claim(b)],relations:[]};
  const old=addAnalysis(createLedger([a,b]),proposal);
  const next=reviseSource(old,'b',{text:'Correction: that night was September 4.'},1);
  assert.equal(activeSources(next)[0].version,1);
  assert.deepEqual(reconstruct(next).unanalysed,['a','b']);
  assert.equal(reconstruct(next).claims.length,0);
  assert.equal(reconstructionChanges(reconstruct(old),reconstruct(next)).withdrawnClaims.length,2);
});

test('a changed interpretation of the same quotation appears in the change report',()=>{
  const s=source('a','On September 5, I slept.');
  const old=addAnalysis(createLedger([s]),{claims:[claim(s)],relations:[]});
  const next=addAnalysis(old,{claims:[claim(s,{time:{...windowAt('05'),quote:'September 5'}})],relations:[]});
  const diff=reconstructionChanges(reconstruct(old),reconstruct(next));
  assert.equal(diff.updatedClaims.length,1);assert.equal(diff.withdrawnClaims.length,0);
});
