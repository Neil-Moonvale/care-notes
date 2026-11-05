import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,addSource,reviseSource,removeSource} from '../dist/reconstruction-core.js';
import {emptyCoverage,withCoverage} from '../dist/evidence-coverage.js';
import {workspaceJSON,restoreWorkspace} from '../dist/reconstruction-workspace.js';
import {saveCheckpoint,handoffChanges,changesText} from '../dist/handoff-changes.js';
import {renderHandoffChanges} from '../dist/handoff-ui.js';
const source=(id,text='I did not see the event.')=>({id,text,author:'Family',recordedAt:'2026-10-20T08:00:00Z'});
const stamp='2026-10-20T09:00:00.000Z';

test('checkpoint compares exact historical sources after several edits, additions and deletion',()=>{
 let ledger=saveCheckpoint(createLedger([source('a'),source('b')]),stamp);
 ledger=reviseSource(ledger,'a',{text:'I am not sure which evening it was.'},1);
 ledger=reviseSource(ledger,'a',{text:'The date is still unknown.'},2);
 ledger=removeSource(ledger,'b',1);
 ledger=addSource(ledger,source('c','A new account.'));
 const d=handoffChanges(ledger);
 assert.equal(d.revised[0].before.text,'I did not see the event.');
 assert.equal(d.revised[0].after.version,3);
 assert.deepEqual(d.added.map(s=>s.id),['c']);assert.deepEqual(d.removed.map(s=>s.id),['b']);
 assert.equal(d.pending,2);
 const restored=restoreWorkspace(workspaceJSON(ledger));
 assert.deepEqual(handoffChanges(restored),d);
 assert.match(changesText(restored),/historical, not a current claim/);
 assert.match(changesText(restored),/I did not see the event/);
 assert.doesNotMatch(changesText(restored),/event did not happen/);
});
test('old backups have no checkpoint; replacement establishes a new baseline without deleting history',()=>{
 let ledger=createLedger([source('a')]);assert.equal(handoffChanges(restoreWorkspace(workspaceJSON(ledger))),null);
 ledger=saveCheckpoint(ledger,stamp);ledger=reviseSource(ledger,'a',{text:'Corrected.'},1);
 const replacement=saveCheckpoint(ledger,stamp);
 assert.equal(handoffChanges(replacement).revised.length,0);assert.equal(replacement.sources[0].versions.length,2);
 assert.equal(handoffChanges(ledger).revised.length,1);
});
test('coverage changes and removal of all accounts remain visible',()=>{
 let ledger=saveCheckpoint(createLedger([source('a')]),stamp);
 ledger=withCoverage(ledger,emptyCoverage());ledger=removeSource(ledger,'a',1);
 const d=handoffChanges(ledger);assert.equal(d.coverageChanged,true);assert.equal(d.removed.length,1);
 assert.match(renderHandoffChanges(ledger,'zh'),/已撤下描述/);
});
test('restore rejects forged, duplicated, missing and noncanonical checkpoint references and dates',()=>{
 const base=JSON.parse(workspaceJSON(saveCheckpoint(createLedger([source('a')]),stamp)));
 for(const corrupt of [c=>c.sources.push(c.sources[0]),c=>c.sources[0].version=99,c=>c.sources[0].id='missing',c=>c.createdAt='2026-02-30T09:00:00.000Z',c=>c.coverage=null,c=>c.version=2]){
  const input=structuredClone(base);corrupt(input.ledger.handoffCheckpoint);assert.throws(()=>restoreWorkspace(JSON.stringify(input)));
 }
 const input=structuredClone(base);input.ledger.handoffCheckpoint.sources[0].text='forged original';
 assert.ok(!workspaceJSON(restoreWorkspace(JSON.stringify(input))).includes('forged original'));
});
test('UI escapes source text, falls back to English and locks actions until reviewed',()=>{
 let ledger=saveCheckpoint(createLedger([source('a','<img src=x onerror=alert(1)>')]),stamp);
 ledger=reviseSource(ledger,'a',{text:'<script>bad</script>'},1);
 for(const lang of ['zh','en','fr','es','ja','ko']){
  const html=renderHandoffChanges(ledger,lang);
  assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('undefined'));
  assert.match(html,/data-action="save-checkpoint" disabled/);
 }
 assert.match(renderHandoffChanges(ledger,'en',{reviewed:true,busy:true}),/data-action="export-changes" disabled/);
 assert.doesNotMatch(renderHandoffChanges(ledger,'en',{reviewed:true}),/disabled/);
});
