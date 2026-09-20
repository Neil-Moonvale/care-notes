import test from 'node:test';
import assert from 'node:assert/strict';
import {coverageDemo} from '../dist/coverage-demo.js';
import {auditEpisode} from '../dist/claim-firewall.js';
import {withCoverage} from '../dist/evidence-coverage.js';
import {workspaceJSON,restoreWorkspace} from '../dist/reconstruction-workspace.js';
import {currentReport,attachReport} from '../dist/narrative-report.js';
import {activeSources} from '../dist/reconstruction-core.js';
import {renderFirewall} from '../dist/coverage-ui.js';
test('fictional multi-source case exposes gaps, blocked denial, alternate timelines and questions',()=>{
 const l=coverageDemo('en'),a=auditEpisode(l);
 assert.ok(l.sources.length>=6);assert.ok(a.claims.some(c=>c.claim.topic==='medication'&&c.maximumStrength==='not_observed'));
 assert.ok(a.timelines.length);assert.ok(a.questions.length);assert.ok(a.claims.some(c=>c.coverage.gaps.length));
 assert.match(renderFirewall(l,'en'),/Where could events/);assert.match(renderFirewall(l,'zh'),/未被观察|未观察/);
});
test('coverage survives backup, edited coverage invalidates narrative and forged derived audit is ignored',()=>{
 let l=coverageDemo('en');const s=activeSources(l)[0];
 l=attachReport(l,{statements:[{text:'Untrusted model text',evidence:[{sourceId:s.id,sourceVersion:s.version,quote:s.text}]}],questions:[]},{language:'en',model:'fixture',createdAt:'2026-09-20T21:30:00Z'});
 const restored=restoreWorkspace(workspaceJSON(l));assert.deepEqual(restored.coverage,l.coverage);assert.ok(currentReport(restored));
 const changed=withCoverage(l,{...l.coverage,profiles:[] ,bindings:[],assertions:[]});assert.equal(currentReport(changed),null);
 const raw=JSON.parse(workspaceJSON(l));raw.firewall={claims:[{wording:'fake'}]};assert.ok(!JSON.stringify(auditEpisode(restoreWorkspace(JSON.stringify(raw)))).includes('fake'));
});
test('unknown locale gracefully falls back and user strings are HTML-escaped',()=>{
 const l=coverageDemo('en');l.sources[0].versions[0].author='<img src=x onerror=alert(1)>';
 for(const lang of ['en','zh','ja','fr','es','ko']){const html=renderFirewall(l,lang);assert.ok(!html.includes('<img'));assert.ok(!html.includes('undefined'));}
});
test('fabricated absence in model prose cannot enter the Results report or exported report',async()=>{
 const {reportText}=await import('../dist/care-report.js');const {reconstructionCopy}=await import('../dist/reconstruction-copy.js');
 let l=coverageDemo('en');const s=activeSources(l).find(s=>s.id==='f2');
 l=attachReport(l,{statements:[{text:'She did not take her medication.',evidence:[{sourceId:s.id,sourceVersion:1,quote:s.text}]}],questions:[]},{language:'en',model:'adversarial',createdAt:'2026-09-20T21:30:00Z'});
 assert.ok(!renderFirewall(l,'en').includes('She did not take her medication.'));
 assert.ok(!reportText(l,'en',reconstructionCopy.en,()=>'?').includes('She did not take her medication.'));
 assert.ok(renderFirewall(l,'en').includes('No medication-taking event was confirmed'));
});
test('a source correction invalidates observation bindings through a backup round trip',async()=>{
 const {reviseSource}=await import('../dist/reconstruction-core.js');const l=reviseSource(coverageDemo('en'),'f2',{text:'Corrected account.'},1);
 const a=auditEpisode(restoreWorkspace(workspaceJSON(l)));assert.ok(a.staleProfileIds.includes('a'));
 assert.ok(!a.claims.some(c=>c.claim.sourceId==='f2'));
});
