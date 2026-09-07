import test from 'node:test';
import assert from 'node:assert/strict';
import {demoLedger,correctDemoDate} from '../dist/reconstruction-demo.js';
import {reconstructionCopy} from '../dist/reconstruction-copy.js';
import {reconstruct,reconstructionChanges,activeSources,reviseSource} from '../dist/reconstruction-core.js';

for(const lang of Object.keys(reconstructionCopy))test(`correction demo works with ${lang} original evidence`,()=>{
  const initial=demoLedger(lang),before=reconstruct(initial),next=correctDemoDate(initial,lang),after=reconstruct(next);
  const diff=reconstructionChanges(before,after);
  assert.equal(before.claims.length,4);assert.equal(after.claims.length,4);
  assert.equal(diff.withdrawnRelations.length,1);assert.equal(diff.withdrawnRelations[0].type,'same_event');
  assert.equal(after.relations.filter(r=>r.type==='reported_from'&&r.status==='proposed').length,1);
  assert.equal(before.questions[0].kind,'time');assert.equal(after.questions.length,0);
  assert.equal(after.claims.find(c=>c.sourceId==='e4').polarity,'unknown');
  assert.ok(after.order.some(r=>after.claims.find(c=>c.key===r.from).sourceId==='e2'&&after.claims.find(c=>c.key===r.to).sourceId==='e1'));
  assert.equal(next.sources[1].versions[0].text,reconstructionCopy[lang].texts[1]);
  assert.equal(activeSources(next)[1].text,reconstructionCopy[lang].correction);
  assert.equal(next.analyses.at(-1).method,'manual');
});
test('free edits do not keep stale fixture annotations or trigger a scripted correction',()=>{
  const edited=reviseSource(demoLedger('en'),'e2',{text:'This is an unrelated new account.'},1);
  assert.throws(()=>correctDemoDate(edited,'en'),/demo_changed/);
  const result=reconstruct(edited);
  assert.ok(result.unanalysed.includes('e2'));
  assert.ok(result.relations.filter(r=>r.type==='same_event').every(r=>r.status==='withdrawn'));
});
