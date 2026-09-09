// Fixed in-process service: these tests never contact a real provider.
export default {async fetch(request) {
  const url=new URL(request.url);
  if(url.origin!=='https://api.deepseek.com')throw Error('Credentials followed a redirect');
  if(request.headers.get('authorization')==='Bearer redirect-fixture')return new Response(null,{status:302,headers:{Location:'https://untrusted.example/models'}});
  if(request.method==='GET'&&url.pathname==='/models')return Response.json({data:[{id:'fixture-text-model'}]});
  if(request.method==='POST'&&url.pathname==='/chat/completions')return Response.json({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]});
  throw Error('Unexpected provider request');
}};
