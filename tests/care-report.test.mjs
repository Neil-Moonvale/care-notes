import test from 'node:test';
import assert from 'node:assert/strict';
import {careReport,reportText,reportCopy} from '../dist/care-report.js';
import {demoLedger} from '../dist/reconstruction-demo.js';
import {reconstructionCopy} from '../dist/reconstruction-copy.js';
import {reviseSource,activeSources,createLedger,addAnalysis} from '../dist/reconstruction-core.js';
import {restoreWorkspace,workspaceJSON} from '../dist/reconstruction-workspace.js';
const time=t=>t.start||'unknown';
test('reports retain uncertainty, references, translated sections and retire corrected evidence',()=>{
 for(const lang of Object.keys(reportCopy)){
 const ledger=demoLedger(lang),copy=reconstructionCopy[lang],r=careReport(ledger,lang,copy,time);
 assert.equal(r.status,reportCopy[lang][9]);assert.ok(r.sections.some(s=>s.title===reportCopy[lang][4]));
 for(const s of r.sections)for(const i of s.items)for(const ref of i.refs)assert.ok(activeSources(ledger).some(s=>s.id===ref));
 const changed=reviseSource(ledger,'e4',{text:'Replacement observation'},1);
 assert.ok(!reportText(changed,lang,copy,time).includes(copy.texts[3]));assert.ok(careReport(changed,lang,copy,time).pending);
 }
});
test('new model metadata survives restore; old and empty ledgers do not invent a model run',()=>{
 const fixture=demoLedger('en'),sources=activeSources(fixture),a=fixture.analyses[0];
 const ids=new Map(a.claims.map((c,i)=>[c.key,'c'+i]));
 const proposal={claims:a.claims.map(c=>({...c,id:ids.get(c.key),support:[]})),relations:a.relations.map(r=>({from:ids.get(r.from),to:ids.get(r.to),type:r.type}))};
 const metadata={model:'test-model',createdAt:'2026-09-10T10:00:00Z'};
 const ledger=addAnalysis(createLedger(sources),proposal,{sources,method:'model',metadata});
 assert.deepEqual(restoreWorkspace(workspaceJSON(ledger)).analyses[0].metadata,metadata);
 assert.equal(careReport(fixture,'en',reconstructionCopy.en,time).metadata,null);
 assert.equal(careReport(createLedger(),'en',reconstructionCopy.en,time).empty,true);
});
