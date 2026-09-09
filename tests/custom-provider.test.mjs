import test from 'node:test';
import assert from 'node:assert/strict';
import {customEndpoint,customConnection,connectionConfig} from '../dist/provider-client.js';
import {reconstructOnDevice,CONNECTION_SAMPLE,assertConnectionSample} from '../dist/reconstruction-model.js';
import {createLedger,addAnalysis,reviseSource,reconstruct} from '../dist/reconstruction-core.js';
import {restoreWorkspace,workspaceJSON,handoffText} from '../dist/reconstruction-workspace.js';
import {createMobileApi} from '../server/mobile-api.js';
import {reconstructionCopy} from '../dist/reconstruction-copy.js';
import {productCopy} from '../dist/product-copy.js';
import {readFile} from 'node:fs/promises';

const config={provider:'custom',apiKey:'fictional-not-a-real-key',model:'example/model',baseUrl:'https://models.example.org/v1',format:'chat'};
const proposal={claims:[{id:'c1',sourceId:'connection-check',sourceVersion:1,quote:CONNECTION_SAMPLE[0].text,subject:'unknown',observer:'Caregiver',topic:'medication',basis:'not_observed',polarity:'unknown',time:{start:null,end:null,quote:''},support:[]}],relations:[]};
const chat=output=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]});

test('custom base URLs and full endpoints normalize without changing provider or protocol',()=>{
  assert.equal(customEndpoint(config.baseUrl),'https://models.example.org/v1/chat/completions');
  assert.equal(customEndpoint('https://models.example.org'),'https://models.example.org/v1/chat/completions');
  assert.equal(customEndpoint('https://models.example.org/v1/chat/completions/'),'https://models.example.org/v1/chat/completions');
  assert.equal(customEndpoint('https://models.example.org/v1beta/openai'),'https://models.example.org/v1beta/openai/chat/completions');
  assert.equal(customEndpoint('https://models.example.org/v1','responses'),'https://models.example.org/v1/responses');
  assert.throws(()=>customEndpoint('https://models.example.org/v1/responses','chat'));
});
test('custom destinations reject credentials, query secrets, insecure addresses and IP variants',()=>{
  for(const url of ['http://models.example.org','https://user:pass@models.example.org','https://models.example.org/?key=secret','https://models.example.org/#token','https://localhost','https://home.local','https://127.1','https://2130706433','https://0x7f000001','https://[::1]','https://192.168.1.1','https://models.example.org:8443','https://models.example.org.'])assert.throws(()=>customEndpoint(url),url);
  assert.throws(()=>customConnection({...config,headers:{}}));
  assert.throws(()=>connectionConfig(config));
});
test('custom chat request uses the selected endpoint once and retains unknown through correction and restore',async()=>{
  let calls=0;
  const answer=await reconstructOnDevice(CONNECTION_SAMPLE,{...config,fetchImpl:async(url,options)=>{
    calls++;assert.equal(url,'https://models.example.org/v1/chat/completions');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer '+config.apiKey);
    const body=JSON.parse(options.body);assert.equal(body.model,config.model);assert.equal(body.response_format.type,'json_object');assert.deepEqual(JSON.parse(body.messages[1].content),{sources:CONNECTION_SAMPLE});return chat(proposal);
  }});
  assert.equal(calls,1);assert.equal(assertConnectionSample(answer).checked,true);
  let ledger=addAnalysis(createLedger(CONNECTION_SAMPLE),answer.proposal,{method:'model'});
  assert.equal(reconstruct(ledger).claims[0].polarity,'unknown');
  const exported=workspaceJSON(ledger);assert.ok(!exported.includes(config.apiKey));
  ledger=restoreWorkspace(exported);
  const handoff=handoffText(ledger,reconstructionCopy.en,()=> 'Unknown time');assert.match(handoff,/did not see/);
  ledger=reviseSource(ledger,'connection-check',{text:'Correction: I was describing a different evening.'},1);
  assert.equal(reconstruct(ledger).claims.length,0);
});
test('custom Responses uses its selected endpoint and the same evidence validation',async()=>{
  const answer=await reconstructOnDevice(CONNECTION_SAMPLE,{...config,format:'responses',fetchImpl:async(url,options)=>{
    assert.equal(url,'https://models.example.org/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);
    return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(proposal)}]}]});
  }});
  assert.equal(answer.proposal.claims[0].basis,'not_observed');
  const fabricated=structuredClone(proposal);fabricated.claims[0].quote='The medication was missed.';
  await assert.rejects(reconstructOnDevice(CONNECTION_SAMPLE,{...config,fetchImpl:async()=>chat(fabricated)}),/evidence_invalid/);
});
test('custom provider failures never retry or turn invalid output into a result',async()=>{
  let calls=0;
  await assert.rejects(reconstructOnDevice(CONNECTION_SAMPLE,{...config,fetchImpl:async()=>{calls++;return Response.json({error:config.apiKey},{status:401});}}),/provider_auth/);
  assert.equal(calls,1);
  await assert.rejects(reconstructOnDevice(CONNECTION_SAMPLE,{...config,fetchImpl:async()=>chat({claims:[],relations:[],unexpected:'x'})}),/provider_invalid/);
});
test('the hosted proxy rejects arbitrary destinations without making any outgoing request',async()=>{
  let calls=0;const api=createMobileApi({fetchImpl:async()=>{calls++;throw Error('unexpected');}});
  const response=await api(new Request('https://care.example.org/api/mobile/check',{method:'POST',headers:{Origin:'https://care.example.org','Content-Type':'application/json','X-Care-Notes':'mobile-ai'},body:JSON.stringify({connection:config,consent:true})}));
  assert.equal(response.status,400);assert.equal(calls,0);
});
test('six-language product help is complete and bundled modules are reachable offline',async()=>{
  const keys=Object.keys(productCopy.en).sort();
  for(const lang of ['zh','en','es','fr','ja','ko']){assert.deepEqual(Object.keys(productCopy[lang]).sort(),keys);assert.equal(productCopy[lang].guide.length,4);}
  const sw=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
  for(const path of ['product-copy.js','device-client.js','provider-client.js','reconstruction-model.js','records.html']){
    assert.ok(sw.includes(path));assert.ok((await readFile(new URL('../dist/'+path,import.meta.url))).length);
  }
  const main=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert.ok(main.includes('reconstruction-lab.js'));
});
