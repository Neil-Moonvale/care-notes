import test from 'node:test';
import assert from 'node:assert/strict';
import {createMobileApi,CONNECTION_SAMPLE} from '../server/mobile-api.js';
import {createWorker} from '../worker/handler.js';
import {createLedger,activeSources,addAnalysis,reviseSource,reconstruct} from '../dist/reconstruction-core.js';
import {restoreWorkspace,workspaceJSON,handoffText} from '../dist/reconstruction-workspace.js';
import {demoLedger,correctDemoDate} from '../dist/reconstruction-demo.js';
import {reconstructionCopy} from '../dist/reconstruction-copy.js';
import {mobileCopy} from '../dist/mobile-copy.js';
const connection={provider:'openai',apiKey:'test-only-secret',model:'test-model'};
const request=(path,body,headers={})=>new Request('https://care.example'+path,{method:'POST',headers:{origin:'https://care.example','content-type':'application/json','x-care-notes':'mobile-ai',...headers},body:JSON.stringify(body)});
const proposal=(s=CONNECTION_SAMPLE[0])=>({claims:[{id:'c1',sourceId:s.id,sourceVersion:s.version,quote:s.text,subject:'person',observer:'caregiver',topic:'medication',basis:'not_observed',polarity:'unknown',time:{start:null,end:null,quote:''},support:[]}],relations:[]});
const response=(p,provider='openai')=>Response.json(provider==='openai'?{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(p)}]}],usage:{input_tokens:10,output_tokens:30}}:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(p)}}],usage:{prompt_tokens:10,completion_tokens:30}});
test('hosted request uses selected provider and exact snapshot without reflecting a key',async()=>{
  for(const provider of ['openai','deepseek']){
    let calls=0;const api=createMobileApi({fetchImpl:async(url,init)=>{
      calls++;assert.equal(url,provider==='openai'?'https://api.openai.com/v1/responses':'https://api.deepseek.com/chat/completions');
      assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer test-only-secret');
      const body=JSON.parse(init.body);assert.equal(body.model,'test-model');
      if(provider==='openai'){assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.deepEqual(JSON.parse(body.input).sources,CONNECTION_SAMPLE);}
      else{assert.equal(body.response_format.type,'json_object');assert.deepEqual(JSON.parse(body.messages[1].content).sources,CONNECTION_SAMPLE);}
      return response(proposal(),provider);
    }});
    const reply=await api(request('/api/mobile/reconstruct',{connection:{...connection,provider},consent:true,sources:CONNECTION_SAMPLE}));
    assert.equal(reply.status,200);const raw=await reply.text();assert.ok(!raw.includes(connection.apiKey));assert.equal(JSON.parse(raw).provider,provider);assert.equal(calls,1);
  }
});
test('connection test sends only the fixed fictional case and checks its meaning',async()=>{
  let calls=0;const api=createMobileApi({fetchImpl:async(url,init)=>{calls++;assert.deepEqual(JSON.parse(JSON.parse(init.body).input).sources,CONNECTION_SAMPLE);const p=proposal();if(calls===2)p.claims[0].polarity='denied';return response(p);}});
  const body={connection,consent:true};
  assert.equal((await (await api(request('/api/mobile/check',body))).json()).checked,true);
  assert.equal((await (await api(request('/api/mobile/check',body))).json()).error,'check_failed');
  assert.equal((await api(request('/api/mobile/check',{...body,sources:CONNECTION_SAMPLE}))).status,400);assert.equal(calls,2);
});
test('wrong origin, absent consent, arbitrary endpoint and missing key never reach a provider',async()=>{
  let calls=0;const api=createMobileApi({fetchImpl:async()=>{calls++;throw Error();}}),body={connection,consent:true,sources:CONNECTION_SAMPLE};
  assert.equal((await api(request('/api/mobile/reconstruct',body,{origin:'https://elsewhere.example'}))).status,403);
  assert.equal((await api(request('/api/mobile/reconstruct',body,{'x-care-notes':''}))).status,403);
  for(const edited of [{...body,consent:false},{...body,connection:{...connection,apiKey:''}},{...body,connection:{...connection,provider:'https://127.0.0.1'}},{...body,connection:{...connection,baseUrl:'https://evil.example'}}])assert.equal((await api(request('/api/mobile/reconstruct',edited))).status,400);
  assert.equal(calls,0);
});
test('no paid retries and provider errors are sanitized',async()=>{
  for(const [status,code] of [[401,'provider_auth'],[402,'provider_credit'],[429,'provider_limit'],[400,'provider_model'],[503,'provider_failed']]){
    let calls=0;const api=createMobileApi({fetchImpl:async()=>{calls++;return new Response('secret upstream body '+connection.apiKey,{status});}});
    const reply=await api(request('/api/mobile/check',{connection,consent:true}));
    assert.deepEqual(await reply.json(),{error:code});assert.equal(calls,1);
  }
});
test('JSON-mode malformed structures and fabricated evidence fail closed',async()=>{
  for(const mutate of [p=>{p.claims[0].quote='invented';},p=>{delete p.claims[0].support;},p=>{p.extra='unrequested';},p=>{p.claims[0].sourceVersion=2;}]){
    const p=proposal();mutate(p);const api=createMobileApi({fetchImpl:async()=>response(p,'deepseek')});
    const reply=await api(request('/api/mobile/reconstruct',{connection:{...connection,provider:'deepseek'},consent:true,sources:CONNECTION_SAMPLE}));
    assert.equal(reply.status,502);assert.ok(['evidence_invalid','provider_invalid'].includes((await reply.json()).error));
  }
});
test('provider truncation, refusals, oversized bodies and timeouts never produce a usable result',async()=>{
  for(const [fetchImpl,expected] of [
    [async()=>Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]}),'provider_incomplete'],
    [async()=>Response.json({choices:[{finish_reason:'content_filter',message:{}}]}),'provider_refusal'],
    [async()=>new Response('x'.repeat(500001)),'too_large'],
    [async()=>{throw new DOMException('timeout','TimeoutError');},'provider_timeout'],
  ]){
    const api=createMobileApi({fetchImpl}),reply=await api(request('/api/mobile/reconstruct',{connection:{...connection,provider:'deepseek'},consent:true,sources:CONNECTION_SAMPLE}));
    assert.equal((await reply.json()).error,expected);
  }
});
test('concurrent requests reserve capacity before reading the body',async()=>{
  let release;const wait=new Promise(r=>release=r);let calls=0;const api=createMobileApi({fetchImpl:async()=>{calls++;await wait;return response(proposal());}});
  const body={connection,consent:true},a=api(request('/api/mobile/check',body)),b=api(request('/api/mobile/check',body));
  assert.equal((await api(request('/api/mobile/check',body))).status,429);release();
  assert.equal((await a).status,200);assert.equal((await b).status,200);assert.equal(calls,2);
});
test('Worker serves public assets but never exposes source files, credentials or a shared account',async()=>{
  const worker=createWorker({assets:{'/index.html':{content:'Care Notes',type:'text/html'}}});
  const get=path=>worker.fetch(new Request('https://care.example'+path));
  assert.equal((await get('/')).status,200);assert.equal((await get('/server/providers.js')).status,404);assert.equal((await get('/.env')).status,404);
  assert.equal((await (await get('/api/status')).json()).reconstructionConfigured,false);
  const status=await (await get('/api/mobile/status')).json();assert.equal(status.available,true);assert.equal(status.keyStorage,'request-only');
  assert.equal((await get('/')).headers.get('Content-Security-Policy').includes("connect-src 'self'"),true);
});
test('synthetic request → analysis → correction → re-analysis → backup → handoff uses the real pipeline',async()=>{
  const worker=createWorker({fetchImpl:async(url,init)=>response(proposal(JSON.parse(JSON.parse(init.body).input).sources[0]))});
  let ledger=createLedger(CONNECTION_SAMPLE),snapshot=activeSources(ledger);
  let reply=await worker.fetch(request('/api/mobile/reconstruct',{connection,consent:true,sources:snapshot}));
  ledger=addAnalysis(ledger,(await reply.json()).proposal,{sources:snapshot,method:'model'});
  const old=proposal(snapshot[0]);ledger=reviseSource(ledger,snapshot[0].id,{text:'Correction: I did not see the medication taken on September 2.'},1);
  assert.equal(reconstruct(ledger).claims.length,0);assert.throws(()=>addAnalysis(ledger,old,{sources:snapshot,method:'model'}),/stale/);
  snapshot=activeSources(ledger);reply=await worker.fetch(request('/api/mobile/reconstruct',{connection,consent:true,sources:snapshot}));
  ledger=addAnalysis(ledger,(await reply.json()).proposal,{sources:snapshot,method:'model'});
  const restored=restoreWorkspace(workspaceJSON(ledger)),output=handoffText(restored,reconstructionCopy.en,()=>'?');
  assert.deepEqual(reconstruct(restored),reconstruct(ledger));assert.equal(restored.sources[0].versions.length,2);
  assert.ok(output.includes('Correction:'));assert.ok(output.includes('occurrence unknown'));assert.ok(!workspaceJSON(ledger).includes(connection.apiKey));
});
test('restore validates history and recomputes derived claims in all six examples',()=>{
  for(const lang of Object.keys(reconstructionCopy)){
    const ledger=correctDemoDate(demoLedger(lang),lang),saved=workspaceJSON(ledger),restored=restoreWorkspace(saved);
    assert.deepEqual(reconstruct(restored),reconstruct(ledger));
    const forged=JSON.parse(saved);forged.ledger.analyses[0].claims[0].quote='invented';assert.throws(()=>restoreWorkspace(JSON.stringify(forged)));
    const derived=JSON.parse(saved);derived.result.claims=[];assert.equal(reconstruct(restoreWorkspace(JSON.stringify(derived))).claims.length,4);
  }
});
test('connection controls and actionable errors have complete six-language text',()=>{
  const keys=Object.keys(mobileCopy.en).sort(),errorKeys=Object.keys(mobileCopy.en.errors).sort();
  for(const lang of Object.keys(reconstructionCopy)){assert.deepEqual(Object.keys(mobileCopy[lang]).sort(),keys);assert.deepEqual(Object.keys(mobileCopy[lang].errors).sort(),errorKeys);}
});
