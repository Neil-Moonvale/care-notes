import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger} from '../dist/reconstruction-core.js';
import {WORKSPACE_KEY,workspaceJSON} from '../dist/reconstruction-workspace.js';
// Runs the actual UI controller with a small event/DOM boundary. No browser or live model is simulated as verified.
test('AI entry remains visible without a test pass; results and errors have separate persistent surfaces',async()=>{
 const listeners={},root={innerHTML:'',addEventListener:(n,f)=>listeners[n]=f,querySelector:()=>null},status={textContent:''};
 const source={id:'e1',version:1,author:'家属',recordedAt:'2026-09-09T08:00:00+08:00',text:'昨晚我没看到她吃药。'};
 const data=new Map([[WORKSPACE_KEY,workspaceJSON(createLedger([source]))],['care-notes.lang','zh'],['care-notes.connection.v1',JSON.stringify({provider:'custom',model:'model',baseUrl:'https://models.example.org/v1',format:'chat'})]]);
 globalThis.document={querySelector:s=>s==='#reconstruction-app'?root:status,documentElement:{},getElementById:()=>null};
 globalThis.location={href:'https://care.example/'};
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 globalThis.window={scrollTo:()=>{},addEventListener:()=>{}};
 let requests=0,fail=false;
 globalThis.fetch=async(url,options)=>{if(url==='./api/mobile/status')return Response.json({available:false});requests++;if(fail)return Response.json({error:'secret'},{status:401});return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({claims:[{id:'c1',sourceId:'e1',sourceVersion:1,quote:source.text,subject:'unknown',observer:'家属',topic:'medication',basis:'not_observed',polarity:'unknown',time:{start:null,end:null,quote:''},support:[]}],relations:[]})}}]});};
 await import('../dist/reconstruction-lab.js');
 const click=action=>listeners.click({target:{closest:s=>['[data-source]','a.brand'].includes(s)?null:{disabled:false,dataset:{action}}}});
 for(const action of ['capture','ai','review','settings'])assert.ok(root.innerHTML.includes(`data-action="${action}"`));
 await click('settings');listeners.input({target:{id:'api-key',value:'test-only-key',matches:()=>false}});
 await click('ai');assert.ok(root.innerHTML.includes('开始 AI 整理'));
 await click('analyse');assert.ok(root.innerHTML.includes('consent_required'));assert.equal(requests,0);
 await listeners.change({target:{id:'send-consent',checked:true}});await click('analyse');
 assert.equal(requests,1);assert.ok(root.innerHTML.includes('整理完成，请核对'));assert.ok(root.innerHTML.includes('昨晚我没看到她吃药。'));assert.ok(root.innerHTML.includes('提取的描述'));
 fail=true;await click('ai');await listeners.change({target:{id:'send-consent',checked:true}});await click('analyse');
 assert.equal(requests,2);assert.ok(root.innerHTML.includes('provider_auth'));assert.ok(root.innerHTML.includes('request-status error'));assert.ok(!root.innerHTML.includes('secret'));
 await click('review');assert.ok(root.innerHTML.includes('昨晚我没看到她吃药。'));assert.ok(root.innerHTML.includes('provider_auth'));
 assert.ok(!data.get(WORKSPACE_KEY).includes('test-only-key'));
});

test('model list can populate an empty model field; connection changes discard stale responses',async()=>{
 const listeners={},root={innerHTML:'',addEventListener:(n,f)=>listeners[n]=f,querySelector:()=>null},status={textContent:''};
 const data=new Map([['care-notes.lang','zh']]);
 globalThis.document={querySelector:s=>s==='#reconstruction-app'?root:status,documentElement:{},getElementById:()=>null};globalThis.location={href:'https://care.example/'};
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={scrollTo:()=>{},addEventListener:()=>{}};
 let resolveRequest,calls=0;
 globalThis.fetch=async(url,opts)=>{calls++;assert.equal(url,'./api/mobile/models');assert.equal(JSON.parse(opts.body).connection.model,undefined);return new Promise(resolve=>resolveRequest=resolve);};
 await import('../dist/reconstruction-lab.js?model-list-test');
 const click=action=>listeners.click({target:{closest:s=>['[data-source]','a.brand'].includes(s)?null:{disabled:false,dataset:{action}}}});
 await click('settings');listeners.input({target:{id:'api-key',value:'synthetic-key',matches:()=>false}});
 const first=click('get-models');assert.equal(calls,1);resolveRequest(Response.json({models:['listed-model']}));await first;
 assert.ok(root.innerHTML.includes('id="model-choice"'));await listeners.change({target:{id:'model-choice',value:'listed-model'}});
 assert.equal(JSON.parse(data.get('care-notes.connection.v1')).model,'listed-model');assert.ok(!data.get('care-notes.connection.v1').includes('synthetic-key'));
 const second=click('get-models');await listeners.change({target:{id:'provider',value:'deepseek'}});resolveRequest(Response.json({models:['stale-model']}));await second;assert.ok(!root.innerHTML.includes('stale-model'));
});
