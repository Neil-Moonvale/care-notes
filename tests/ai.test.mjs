import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyWithOpenAI, createApiHandler } from '../server/ai.js';

const suggestion={id:'s1',category:'medication',source:'unknown',certainty:'direct'};
const completion=suggestions=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions})}]}]});
const request=(data,headers={})=>new Request('http://localhost:8787/api/draft',{method:'POST',headers:{origin:'http://localhost:8787','content-type':'application/json','x-care-notes':'draft',...headers},body:JSON.stringify(data)});
const config={OPENAI_API_KEY:'test-only-placeholder',OPENAI_MODEL:'test-model'};
test('adapter uses server-only credentials, structured output and stateless requests',async()=>{
  let calls=0;
  const result=await classifyWithOpenAI('Not sure whether medication was taken.',{apiKey:config.OPENAI_API_KEY,model:config.OPENAI_MODEL,fetchImpl:async(url,opts)=>{
    calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(opts.headers.Authorization,'Bearer test-only-placeholder');
    const body=JSON.parse(opts.body);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.ok(!('tools' in body));
    assert.equal(JSON.parse(body.input).original,'Not sure whether medication was taken.');return completion([suggestion]);
  }});
  assert.equal(calls,1);assert.equal(result.suggestions[0].certainty,'uncertain');assert.ok(!JSON.stringify(result).includes(config.OPENAI_API_KEY));
});
test('provider failures, refusals, truncation and malformed classifications produce no draft',async()=>{
  const cases=[new Response('',{status:429}),Response.json({status:'incomplete',output:[]}),Response.json({status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'refused'}]}]}),completion([{...suggestion,id:'invented'}])];
  for(const response of cases)await assert.rejects(()=>classifyWithOpenAI('Medication taken.',{apiKey:'test',model:'test-model',fetchImpl:async()=>response}));
});
test('absent configuration never invokes a provider or reports a working AI service',async()=>{
  let calls=0;const handler=createApiHandler({fetchImpl:async()=>{calls++;throw Error();}});
  assert.deepEqual(await (await handler(new Request('http://localhost:8787/api/status'))).json(),{aiConfigured:false});
  assert.equal((await handler(request({text:'Had lunch.',consent:true}))).status,503);assert.equal(calls,0);
});
test('consent and same-origin checks run before any data can leave',async()=>{
  let calls=0;const handler=createApiHandler({env:config,fetchImpl:async()=>{calls++;return completion([suggestion]);}});
  assert.equal((await handler(request({text:'Had lunch.',consent:false}))).status,400);
  assert.equal((await handler(request({text:'Had lunch.',consent:true},{origin:'https://untrusted.example'}))).status,403);
  assert.equal((await handler(request({text:'Had lunch.',consent:true},{'x-care-notes':''}))).status,403);
  assert.equal((await handler(request({text:'Had lunch.',consent:true,records:['must not send']}))).status,400);
  assert.equal(calls,0);
});
test('oversized bodies and invalid text are rejected before provider access',async()=>{
  let calls=0;const handler=createApiHandler({env:config,fetchImpl:async()=>{calls++;throw Error();}});
  assert.equal((await handler(request({text:'x'.repeat(40000),consent:true}))).status,413);
  assert.equal((await handler(request({text:'',consent:true}))).status,400);assert.equal(calls,0);
});
test('local deployment has a request budget and does not retry paid requests automatically',async()=>{
  let calls=0;const handler=createApiHandler({env:config,fetchImpl:async()=>{calls++;return completion([suggestion]);}});
  for(let i=0;i<10;i++)assert.equal((await handler(request({text:'Medication taken.',consent:true}))).status,200);
  assert.equal((await handler(request({text:'Medication taken.',consent:true}))).status,429);assert.equal(calls,10);
});
test('simultaneous classification is rejected while the first request runs',async()=>{
  let release;const wait=new Promise(resolve=>{release=resolve;});
  let started;const ready=new Promise(resolve=>{started=resolve;});
  const handler=createApiHandler({env:config,fetchImpl:async()=>{started();await wait;return completion([suggestion]);}});
  const first=handler(request({text:'Medication taken.',consent:true}));await ready;
  assert.equal((await handler(request({text:'Medication taken.',consent:true}))).status,429);
  release();assert.equal((await first).status,200);
});
