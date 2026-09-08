import {createMobileApi} from '../server/mobile-api.js';
export function createWorker({assets={},fetchImpl=fetch}={}) {
  const api=createMobileApi({fetchImpl});
  return {async fetch(request) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/mobile/'))return api(request);
    if(url.pathname==='/api/status')return Response.json({aiConfigured:false,reconstructionConfigured:false},{headers:{'Cache-Control':'no-store'}});
    if(url.pathname.startsWith('/api/'))return Response.json({error:'not_found'},{status:404,headers:{'Cache-Control':'no-store'}});
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    const path=url.pathname==='/'?'/index.html':url.pathname,asset=Object.hasOwn(assets,path)?assets[path]:null;
    if(!asset)return new Response('Not found',{status:404});
    return new Response(request.method==='HEAD'?null:asset.content,{headers:{
      'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
    }});
  }};
}
