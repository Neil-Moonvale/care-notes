import {createMobileApi} from '../server/mobile-api.js';
// workerd supports manual/follow, not the browser's redirect:'error'.
// Manual keeps credentials on the original destination; the provider client
// rejects every non-2xx response, including redirects, without another request.
export const workerFetch=(url,options)=>globalThis.fetch(url,{...options,redirect:'manual'});
export function createWorker({assets={},fetchImpl=workerFetch}={}) {
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
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
    }});
  }};
}
