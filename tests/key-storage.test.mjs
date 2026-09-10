import test from 'node:test';
import assert from 'node:assert/strict';
import {keyScope,storedKey,saveKey,forgetKey,canStoreKey,keyCopy} from '../dist/key-storage.js';
import {defaultOutputBudget,requestStructured} from '../dist/provider-client.js';
test('saved credentials are endpoint-scoped and web has no persistent fallback',()=>{
 const c={provider:'custom',baseUrl:'https://models.example.org/v1',format:'chat',apiKey:'synthetic-key'};
 delete globalThis.CareNotesNative;assert.equal(canStoreKey(),false);assert.equal(saveKey(c),false);assert.equal(storedKey(c),'');
 const saved=new Map();globalThis.CareNotesNative={saveApiKey:(s,k)=>(saved.set(s,k),true),readApiKey:s=>saved.get(s)||'',deleteApiKey:s=>(saved.delete(s),true)};
 assert.equal(saveKey(c),true);assert.equal(storedKey({...c,apiKey:''}),'synthetic-key');assert.equal(storedKey({...c,baseUrl:'https://other.example.org/v1'}),'');assert.equal(storedKey({...c,format:'responses'}),'');assert.equal(forgetKey(c),true);assert.equal(storedKey(c),'');delete globalThis.CareNotesNative;
 assert.equal(keyScope({...c,baseUrl:'https://models.example.org/v1/chat/completions'}),keyScope(c));
 for(const v of Object.values(keyCopy))assert.equal(v.length,8);
});
test('forced GLM keeps thinking while receiving sufficient budget; arbitrary APIs receive no vendor parameters',async()=>{
 const schema={type:'object',required:['ok'],properties:{ok:{type:'boolean'}}};
 for(const [baseUrl,model,disabled] of [['https://open.bigmodel.cn/api/paas/v4','glm-5.3-flash',false],['https://open.bigmodel.cn/api/paas/v4','glm-4.7',true],['https://custom.example.org/v1','glm-4.7',false]]){
 const c={provider:'custom',apiKey:'synthetic-key',format:'chat',baseUrl,model};
 await requestStructured({...c,maxOutputTokens:defaultOutputBudget(c),schema,instructions:'test',input:{},name:'test',fetchImpl:async(_,o)=>{const b=JSON.parse(o.body);assert.equal(b.thinking?.type,disabled?'disabled':undefined);assert.equal(b.max_tokens,model==='glm-5.3-flash'?24000:6000);return Response.json({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]});}});
 }
});
