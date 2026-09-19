import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,activeSources,reviseSource,addSource} from '../dist/reconstruction-core.js';
import {attachReport,currentReport,validateReport} from '../dist/narrative-report.js';
import {restoreWorkspace,workspaceJSON} from '../dist/reconstruction-workspace.js';
const ledger=()=>createLedger([{id:'s1',version:1,text:'I did not see the light switched off.',author:'A',recordedAt:'2026-09-19T00:00:00Z'}]);
const report={statements:[{text:'A did not observe whether the light was switched off; its state remains unknown.',evidence:[{sourceId:'s1',sourceVersion:1,quote:'I did not see the light switched off.'}]}],questions:[{text:'Was the light subsequently checked?',sourceIds:['s1']}]};
const meta={language:'en',model:'test',createdAt:'2026-09-19T01:00:00Z'};
test('narrative preserves evidence through backup and becomes stale after any source change',()=>{
 const l=attachReport(ledger(),report,meta);assert.deepEqual(currentReport(restoreWorkspace(workspaceJSON(l))).report,report);
 assert.equal(currentReport(reviseSource(l,'s1',{text:'Correction: it was on.'},1)),null);
 assert.equal(currentReport(addSource(l,{id:'s2',text:'It was off later.',author:'B',recordedAt:'2026-09-19T02:00:00Z'})),null);
});
test('narrative rejects missing, fabricated and obsolete evidence',()=>{
 const sources=activeSources(ledger());
 for(const evidence of [[],[{sourceId:'s1',sourceVersion:2,quote:sources[0].text}],[{sourceId:'s1',sourceVersion:1,quote:'It was off.'}]])assert.throws(()=>validateReport(sources,{...report,statements:[{text:'Some report',evidence}]}),/evidence_invalid/);
 assert.throws(()=>validateReport(sources,{...report,questions:[{text:'Question?',sourceIds:['missing']}]}),/evidence_invalid/);
});
test('tampered report backup is rejected and legacy backups still restore',()=>{
 const l=attachReport(ledger(),report,meta),raw=JSON.parse(workspaceJSON(l));raw.ledger.report.report.statements[0].evidence[0].quote='fabricated';
 assert.throws(()=>restoreWorkspace(JSON.stringify(raw)));assert.equal(currentReport(restoreWorkspace(workspaceJSON(ledger()))),null);
});
import {reconstructOnDevice} from '../dist/reconstruction-model.js';
import {reportText} from '../dist/care-report.js';
import {reconstructionCopy} from '../dist/reconstruction-copy.js';
import {createMobileApi} from '../server/mobile-api.js';
const proposal={claims:[{id:'c1',sourceId:'s1',sourceVersion:1,quote:'I did not see the light switched off.',subject:'light',observer:'A',topic:'other',basis:'not_observed',polarity:'unknown',time:{start:null,end:null,quote:''},support:[]}],relations:[],report};
test('custom Chat, custom Responses and hosted report use one request and validate narrative evidence',async()=>{
 for(const format of ['chat','responses']){
  let calls=0;const fetchImpl=async(url,init)=>{calls++;const body=JSON.parse(init.body);assert.ok(JSON.stringify(body).includes('write report in en'));
   return Response.json(format==='chat'?{choices:[{finish_reason:'stop',message:{content:JSON.stringify(proposal)}}]}:{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(proposal)}]}]});};
  const answer=await reconstructOnDevice(activeSources(ledger()),{provider:'custom',baseUrl:'https://models.example/v1',format,model:'test',apiKey:'synthetic',reportLanguage:'en',fetchImpl});
  assert.equal(calls,1);assert.deepEqual(answer.report,report);assert.ok(!('report' in answer.proposal));
 }
 const api=createMobileApi({fetchImpl:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(proposal)}}]})});
 const res=await api(new Request('https://care.example/api/mobile/reconstruct',{method:'POST',headers:{origin:'https://care.example','x-care-notes':'mobile-ai','content-type':'application/json'},body:JSON.stringify({connection:{provider:'deepseek',model:'test',apiKey:'synthetic'},consent:true,sources:activeSources(ledger()),language:'en'})}));
 assert.equal(res.status,200);assert.deepEqual((await res.json()).report,report);
});
test('export includes the readable report and exact evidence, stale report is excluded',()=>{
 const l=attachReport(ledger(),report,meta),copy=reconstructionCopy.en;
 assert.ok(reportText(l,'en',copy,()=>'?').includes(report.statements[0].text));
 assert.ok(!reportText(reviseSource(l,'s1',{text:'Correction.'},1),'en',copy,()=>'?').includes(report.statements[0].text));
});
