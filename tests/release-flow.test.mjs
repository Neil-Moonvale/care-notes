import test from 'node:test';
import assert from 'node:assert/strict';
import {checkConnection,requestStructured} from '../dist/provider-client.js';
import {createMobileApi} from '../server/mobile-api.js';
import {releaseCopy} from '../dist/release-copy.js';
const config={provider:'custom',apiKey:'test-only-key',model:'example-model',baseUrl:'https://models.example.org/v1',format:'chat'};
const schema={type:'object',additionalProperties:false,required:['ok'],properties:{ok:{type:'boolean'}}};
const chat=text=>Response.json({choices:[{finish_reason:'stop',message:{content:text}}]});
test('connection probe checks the selected protocol without requiring a clinical extraction',async()=>{
 let calls=0;const answer=await checkConnection({...config,fetchImpl:async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.deepEqual(JSON.parse(body.messages[1].content),{task:'connection check'});return chat('{"ok":true}');}});
 assert.equal(calls,1);assert.equal(answer.checked,true);
});
test('explicit compatibility mode omits unsupported JSON parameters but retains output validation',async()=>{
 for(const format of ['chat','responses']){
 let calls=0;const answer=await requestStructured({...config,format,outputStyle:'compatible',schema,instructions:'Return JSON',input:{},name:'probe',fetchImpl:async(url,options)=>{calls++;const b=JSON.parse(options.body);assert.equal(b.response_format,undefined);assert.equal(b.text,undefined);return format==='chat'?chat('```json\n{"ok":true}\n```'):Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"ok":true}'}]}]});}});
 assert.equal(answer.proposal.ok,true);assert.equal(calls,1);
 }
 await assert.rejects(checkConnection({...config,outputStyle:'compatible',fetchImpl:async()=>chat('{"ok":"yes"}')}),/provider_invalid/);
});
test('hosted connection probe requires consent and refuses custom destinations before sending',async()=>{
 let calls=0;const api=createMobileApi({fetchImpl:async()=>{calls++;return chat('{"ok":true}');}});
 const req=body=>new Request('https://care.example/api/mobile/connection',{method:'POST',headers:{Origin:'https://care.example','Content-Type':'application/json','X-Care-Notes':'mobile-ai'},body:JSON.stringify(body)});
 const connection={provider:'deepseek',apiKey:'test-only-key',model:'test-model'};
 assert.equal((await api(req({connection,consent:false}))).status,400);
 assert.equal((await api(req({connection:config,consent:true}))).status,400);assert.equal(calls,0);
 assert.equal((await (await api(req({connection,consent:true}))).json()).checked,true);assert.equal(calls,1);
});
test('new navigation and diagnostic labels cover all six shipped languages',()=>{
 const keys=Object.keys(releaseCopy.en).sort();for(const lang of ['zh','en','es','fr','ja','ko']){assert.deepEqual(Object.keys(releaseCopy[lang]).sort(),keys);for(const value of Object.values(releaseCopy[lang]))assert.ok(value.trim());}
});
test('official DeepSeek V4 reserves output budget with low reasoning effort only for V4',async()=>{
 for(const options of [
  {provider:'deepseek',model:'deepseek-v4-flash'},
  {provider:'deepseek',model:'deepseek-v4-pro'},
  {provider:'deepseek',model:'legacy-model'},
  {...config,model:'deepseek-v4-flash'},
 ]){
  await checkConnection({...options,apiKey:'test-only-key',fetchImpl:async(url,init)=>{
   const body=JSON.parse(init.body);
   assert.equal(body.reasoning_effort,options.provider==='deepseek'&&options.model.startsWith('deepseek-v4-')?'low':undefined);
   assert.equal(body.thinking,undefined);assert.equal(body.max_tokens,2000);
   return chat('{"ok":true}');
  }});
 }
});
