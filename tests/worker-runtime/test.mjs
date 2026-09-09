import app from './app.mjs';
function assert(condition,message){if(!condition)throw Error(message);}
const request=(path,connection)=>new Request('https://care.example/api/mobile/'+path,{
  method:'POST',headers:{Origin:'https://care.example','Content-Type':'application/json','X-Care-Notes':'mobile-ai'},
  body:JSON.stringify({connection,consent:true}),
});
export default {async test(){
  const connection={provider:'deepseek',apiKey:'runtime-fixture'};
  const models=await app.fetch(request('models',connection));
  assert(models.status===200,'Model list must work in workerd, not only Node');
  assert((await models.json()).models[0]==='fixture-text-model','Model response missing');
  const probe=await app.fetch(request('connection',{...connection,model:'fixture-text-model'}));
  assert(probe.status===200&&(await probe.json()).checked,'Structured POST must work in workerd');
  for(const [path,config] of [['models',connection],['connection',{...connection,model:'fixture-text-model'}]]){
    const redirect=await app.fetch(request(path,{...config,apiKey:'redirect-fixture'}));
    assert(redirect.status===502,'Provider redirects must fail closed');
    assert((await redirect.json()).error==='provider_failed','Redirect must reach HTTP status handling');
  }
}};
