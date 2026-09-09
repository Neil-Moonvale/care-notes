import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiHandler} from '../server/ai.js';
import {proposeReconstruction} from '../server/reconstruction.js';
import {cases} from '../examples/reconstruction-cases.mjs';
const request=(body,headers={})=>new Request('http://localhost:8787/api/reconstruct',{method:'POST',headers:{origin:'http://localhost:8787','Content-Type':'application/json','X-Care-Notes':'reconstruct',...headers},body:JSON.stringify(body)});
const success=proposal=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(proposal)}]}],usage:{input_tokens:10,output_tokens:10}}));
test('reconstruction sends only the consented snapshot and uses an explicit model schema',async()=>{
  const c=cases[1];let called=0;
  const api=createApiHandler({env:{OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'},fetchImpl:async(url,init)=>{
    called++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(init.body);
    assert.equal(body.store,false);assert.equal(body.text.format.strict,true);
    assert.deepEqual(JSON.parse(body.input),{sources:c.sources});return success(c.proposal);
  }});
  assert.equal((await api(request({sources:c.sources,consent:false}))).status,400);
  assert.equal((await api(request({sources:c.sources,consent:true},{origin:'https://other.invalid'}))).status,403);
  assert.equal(called,0);
  const response=await api(request({sources:c.sources,consent:true}));
  assert.equal(response.status,200);assert.deepEqual((await response.json()).proposal,c.proposal);assert.equal(called,1);
});
test('missing configuration and invalid identity fail before provider access',async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;throw Error('must not call');};
  assert.equal((await createApiHandler({fetchImpl})(request({sources:cases[0].sources,consent:true}))).status,503);
  const api=createApiHandler({env:{OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'},fetchImpl});
  assert.equal((await api(request({sources:[{...cases[0].sources[0],recordedAt:'not-a-date'}],consent:true}))).status,400);
  assert.equal(calls,0);
});
test('a fabricated model quotation is not returned as usable analysis',async()=>{
  const proposal=structuredClone(cases[0].proposal);proposal.claims[0].quote='Invented observation.';
  const api=createApiHandler({env:{OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'},fetchImpl:async()=>success(proposal)});
  assert.equal((await api(request({sources:cases[0].sources,consent:true}))).status,502);
});
test('model refusals and incomplete outputs are never accepted as empty success',async()=>{
  for(const response of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}]){
    await assert.rejects(proposeReconstruction(cases[0].sources,{apiKey:'test-only',model:'test-model',fetchImpl:async()=>new Response(JSON.stringify(response))}),/provider_/);
  }
});
