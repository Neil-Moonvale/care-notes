import test from 'node:test';
import assert from 'node:assert/strict';
import {modelListEndpoint,listModels} from '../dist/provider-client.js';
import {createMobileApi} from '../server/mobile-api.js';
import {deviceFetch} from '../dist/device-client.js';
const key='synthetic-key';
test('model discovery requires no model ID, preserves custom prefixes and sends only a GET',async()=>{
 for(const [config,endpoint] of [
 [{provider:'openai'},'https://api.openai.com/v1/models'],
 [{provider:'deepseek'},'https://api.deepseek.com/models'],
 [{provider:'custom',format:'chat',baseUrl:'https://models.example.org/gateway/v1/chat/completions'},'https://models.example.org/gateway/v1/models'],
 [{provider:'custom',format:'responses',baseUrl:'https://models.example.org/v1/responses'},'https://models.example.org/v1/models']]){
 assert.equal(modelListEndpoint(config),endpoint);let count=0;
 const result=await listModels({...config,apiKey:key,fetchImpl:async(url,opts)=>{count++;assert.equal(url,endpoint);assert.equal(opts.method,'GET');assert.equal(opts.body,undefined);assert.equal(opts.redirect,'error');return Response.json({data:[{id:'z-model'},{id:'a-model'},{id:'z-model'},{id:'<script>'}]});}});
 assert.deepEqual(result.models,['a-model','z-model']);assert.equal(count,1);
 }
});
test('model list failures are bounded, actionable, and never retried',async()=>{
 for(const [status,code] of [[401,'provider_auth'],[403,'models_forbidden'],[404,'models_unsupported'],[429,'provider_limit']]){let count=0;await assert.rejects(listModels({provider:'deepseek',apiKey:key,fetchImpl:async()=>{count++;return Response.json({error:key},{status});}}),new RegExp(code));assert.equal(count,1);}
 await assert.rejects(listModels({provider:'openai',apiKey:key,fetchImpl:async()=>Response.json({data:'wrong'})}),/provider_invalid/);
});
test('hosted model list accepts fixed providers only, without originals or a model field',async()=>{
 let calls=0;const api=createMobileApi({fetchImpl:async(url,opts)=>{calls++;assert.equal(url,'https://api.deepseek.com/models');assert.equal(opts.method,'GET');return Response.json({data:[{id:'deepseek-v4-flash'}]});}});
 const req=body=>new Request('https://care.example/api/mobile/models',{method:'POST',headers:{Origin:'https://care.example','Content-Type':'application/json','X-Care-Notes':'mobile-ai'},body:JSON.stringify(body)});
 const connection={provider:'deepseek',apiKey:key};
 assert.equal((await api(req({connection,consent:false}))).status,400);
 assert.equal((await api(req({connection:{...connection,provider:'custom',baseUrl:'https://elsewhere.example/v1',format:'chat'},consent:true}))).status,400);
 assert.equal((await api(req({connection,consent:true,sources:[]}))).status,400);assert.equal(calls,0);
 assert.deepEqual(await(await api(req({connection,consent:true}))).json(),{models:['deepseek-v4-flash']});assert.equal(calls,1);
});
test('Android model discovery uses the native GET method without a request body',async()=>{
 globalThis.CareNotesNative={request:()=>assert.fail('must not POST'),listModels:(id,url,authorization)=>{assert.equal(url,'https://api.deepseek.com/models');assert.equal(authorization,'Bearer '+key);queueMicrotask(()=>globalThis.__careNotesReply(id,{status:200,body:'{"data":[]}'}));},cancel:()=>{}};
 try{assert.deepEqual(await(await deviceFetch('https://api.deepseek.com/models',{method:'GET',headers:{Authorization:'Bearer '+key}})).json(),{data:[]});}finally{delete globalThis.CareNotesNative;}
});
