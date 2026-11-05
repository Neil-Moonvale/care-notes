import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,activeSources,reviseSource,removeSource,addSource,reconstruct} from '../dist/reconstruction-core.js';
import {addClarification,answerClarification,reviewClarification,clarificationItems,clarificationCandidates,clarificationText} from '../dist/clarification.js';
import {renderClarifications} from '../dist/clarification-ui.js';
import {workspaceJSON,restoreWorkspace,handoffText} from '../dist/reconstruction-workspace.js';
import {reconstructionCopy} from '../dist/reconstruction-copy.js';
import {coverageDemo} from '../dist/coverage-demo.js';
import {emptyCoverage} from '../dist/evidence-coverage.js';
const at='2026-11-05T08:00:00.000Z';
const source={id:'e1',author:'Family',text:'I do not know when this happened.',recordedAt:at};
const reply={id:'e2',author:'Witness',text:'I remember Monday, but I am not sure.',recordedAt:at};
const fixture=()=>addClarification(createLedger([source]),{id:'q1',question:'Which day?',refs:[{id:'e1',version:1}],createdAt:at});
const answered=()=>answerClarification(fixture(),'q1',reply);
const reviewed=()=>reviewClarification(answered(),'q1',{at});
const status=l=>clarificationItems(l)[0].status;

test('reply becomes a separate attributed source without changing original claims or resolving the question',()=>{
 const before=fixture(),after=answerClarification(before,'q1',reply);
 assert.equal(status(before),'open');assert.equal(status(after),'answered');
 assert.deepEqual(activeSources(before)[0],activeSources(after)[0]);
 assert.equal(activeSources(after)[1].author,'Witness');assert.equal(after.analyses.length,0);
 assert.deepEqual(reconstruct(after).claims,[]);assert.equal(before.sources.length,1);
});
test('human review and explicit reopening are retained without promoting evidence',()=>{
 let l=reviewed();assert.equal(status(l),'reviewed');
 l=reviewClarification(l,'q1',{reopen:true,at});assert.equal(status(l),'answered');
 assert.equal(l.clarifications[0].reviews.length,2);assert.equal(l.analyses.length,0);
});
test('source edits, reply edits, deletions, new accounts and coverage edits invalidate reviews',()=>{
 for(const mutate of [
  l=>reviseSource(l,'e1',{text:'Corrected day.'},1),
  l=>reviseSource(l,'e2',{text:'Actually Tuesday.'},1),
  l=>removeSource(l,'e1',1),l=>removeSource(l,'e2',1),
  l=>addSource(l,{...reply,id:'e3'}),
  l=>({...l,coverage:{...emptyCoverage(),revision:1}})
 ])assert.equal(status(mutate(reviewed())),'recheck');
});
test('a new analysis alone does not pretend to answer or automatically review a question',()=>{
 assert.equal(status({...answered(),report:{untrusted:'claim'}}),'answered');
});
test('re-review records the current snapshot while preserving the original question and answer versions',()=>{
 let l=reviseSource(reviewed(),'e1',{text:'Corrected.'},1);
 l=reviewClarification(l,'q1',{at});assert.equal(status(l),'reviewed');
 assert.equal(l.clarifications[0].refs[0].version,1);
 assert.equal(l.clarifications[0].reviews.at(-1).sources[0].version,2);
});
test('cannot review without an active reply, or answer a missing task',()=>{
 assert.throws(()=>reviewClarification(fixture(),'q1',{at}));
 assert.throws(()=>reviewClarification(removeSource(answered(),'e2',1),'q1',{at}));
 assert.throws(()=>answerClarification(fixture(),'absent',reply));
});
test('source limits fail atomically and never lose the draft ledger',()=>{
 let l=fixture();for(let i=2;i<=40;i++)l=addSource(l,{...reply,id:'e'+i});
 assert.throws(()=>answerClarification(l,'q1',{...reply,id:'e41'}));
 assert.equal(l.clarifications[0].answers.length,0);assert.equal(l.sources.length,40);
});
test('question validation rejects missing, stale, duplicated and excessive refs',()=>{
 for(const refs of [[],[{id:'missing',version:1}],[{id:'e1',version:2}],[{id:'e1',version:1},{id:'e1',version:1}]]){
  assert.throws(()=>addClarification(createLedger([source]),{id:'q',question:'Why?',refs,createdAt:at}));
 }
 assert.throws(()=>addClarification(fixture(),{id:'q2',question:'Which day?',refs:[{id:'e1',version:1}],createdAt:at}),/duplicate_clarification/);
});
test('new and old backups restore, and imported derived status is ignored',()=>{
 const old=restoreWorkspace(workspaceJSON(createLedger([source])));assert.equal(old.clarifications,undefined);
 const l=reviewed();assert.equal(status(restoreWorkspace(workspaceJSON(l))),'reviewed');
 const stale=reviseSource(l,'e1',{text:'Different'},1);stale.clarifications[0].status='reviewed';
 assert.equal(status(restoreWorkspace(workspaceJSON(stale))),'recheck');
});
test('malformed backup references, dates, duplicate IDs, review snapshots and unbounded histories fail closed',()=>{
 for(const mutate of [
  q=>q.refs[0].version=999,q=>q.answers[0].id='missing',q=>q.createdAt='2026-02-31T08:00:00.000Z',
  q=>q.reviews[0].sources[0].version=999,q=>q.reviews[0].kind='resolved',q=>q.reviews[0].sources=[],
  q=>q.reviews=Array(101).fill(q.reviews[0]),q=>q.question=' '.repeat(5)
 ]){const l=reviewed();mutate(l.clarifications[0]);assert.throws(()=>restoreWorkspace(workspaceJSON(l)));}
 const l=reviewed();l.clarifications.push(l.clarifications[0]);assert.throws(()=>restoreWorkspace(workspaceJSON(l)));
});
test('candidate questions keep supporting and opposing source versions; saving never calls a model',()=>{
 let l=coverageDemo('en');const candidates=clarificationCandidates(l,'en');assert.ok(candidates.length);
 const q=candidates[0];assert.ok(q.refs.length);assert.ok(q.refs.every(r=>activeSources(l).some(s=>s.id===r.id&&s.version===r.version)));
 const analyses=l.analyses.length;l=addClarification(l,{...q,id:'q1',createdAt:at});
 assert.equal(l.analyses.length,analyses);assert.ok(!clarificationCandidates(l).some(c=>c.question===q.question));
});
test('exports label withdrawn and corrected evidence as historical and include current wording and status',()=>{
 let l=reviseSource(reviewed(),'e1',{text:'Tuesday correction.'},1);l=removeSource(l,'e2',1);
 const txt=clarificationText(l);assert.match(txt,/historical/);assert.match(txt,/Tuesday correction/);assert.match(txt,/review again/);
 assert.match(txt,/Witness/);assert.match(txt,/not establish a fact/);
 const handoff=handoffText(l,reconstructionCopy.en,()=>'?');assert.match(handoff,/Which day/);assert.match(handoff,/Tuesday correction/);
});
test('six-language rendering escapes user text and disables writes during model requests',()=>{
 let l=addClarification(createLedger([{...source,text:'<img src=x onerror=bad>'}]),{id:'q1',question:'<script>bad</script>',refs:[{id:'e1',version:1}],createdAt:at});
 for(const lang of ['en','zh','es','fr','ja','ko']){
  const html=renderClarifications(l,lang,{busy:true,drafts:{question:'</textarea><script>bad</script>'}});
  assert.doesNotMatch(html,/<script>|<img |undefined/);assert.match(html,/<fieldset disabled>/);assert.match(html,/data-action="review-question"[^>]+disabled/);
 }
});
test('deleting an answer preserves historical reply and prevents claiming it was reviewed as current',()=>{
 const l=removeSource(reviewed(),'e2',1),html=renderClarifications(l,'en');
 assert.match(html,/Withdrawn source/);assert.match(html,/data-action="review-question"[^>]+disabled/);
});

test('opposing claims sharing the same question and source set produce one follow-up, with both accounts retained',()=>{
 const l=coverageDemo('zh'),questions=clarificationCandidates(l,'zh');
 const identity=q=>JSON.stringify([q.question,[...q.refs].sort((a,b)=>a.id.localeCompare(b.id))]);
 assert.equal(new Set(questions.map(identity)).size,questions.length);
 const opposing=questions.filter(q=>q.refs.some(r=>r.id==='f0')&&q.refs.some(r=>r.id==='f1'));
 assert.equal(opposing.length,1);
 assert.ok(questions.some(q=>q.refs.some(r=>r.id==='f2')),'a distinct observation-gap question remains');
});
