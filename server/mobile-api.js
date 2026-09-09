import {connectionConfig,providerList,boundedJson} from './providers.js';
import {checkConnection,listModels,modelListConfig} from '../dist/provider-client.js';
import {reconstructWithProvider} from './reconstruction.js';
import {validateAnalysis} from '../dist/reconstruction-core.js';

import {CONNECTION_SAMPLE,assertConnectionSample} from '../dist/reconstruction-model.js';
export {CONNECTION_SAMPLE};
const allowedErrors=new Set(['models_forbidden','models_unsupported','invalid_connection','provider_auth','provider_credit','provider_limit','provider_model','provider_failed','provider_timeout','provider_network','provider_invalid','provider_incomplete','provider_refusal','evidence_invalid','check_failed','too_large']);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export function createMobileApi({fetchImpl=fetch,clock=Date.now}={}) {
  // Best-effort isolate limits, not a durable account-wide spending cap.
  let active=0,windowStart=clock(),calls=0;
  return async request=>{
    const url=new URL(request.url);
    if(url.pathname==='/api/mobile/status'&&request.method==='GET')return json({available:true,providers:providerList(),maxOutputTokens:6000,keyStorage:'request-only'});
    if(!['/api/mobile/models','/api/mobile/check','/api/mobile/connection','/api/mobile/reconstruct'].includes(url.pathname))return json({error:'not_found'},404);
    if(request.method!=='POST')return json({error:'method_not_allowed'},405);
    if(request.headers.get('origin')!==url.origin||request.headers.get('x-care-notes')!=='mobile-ai'||request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'forbidden'},403);
    if(clock()-windowStart>=60000){windowStart=clock();calls=0;}
    if(active>=2||calls>=10)return json({error:'rate_limited'},429);
    // Reserve before awaiting the request body, so simultaneous arrivals cannot all pass.
    active++;
    try{
      const listing=url.pathname==='/api/mobile/models';
      const probe=url.pathname==='/api/mobile/connection',checking=listing||probe||url.pathname==='/api/mobile/check';
      let input;try{input=await boundedJson(request,128000);}catch{return json({error:'invalid_input'},400);}
      if(!input||input.consent!==true||Object.keys(input).sort().join(',')!==(checking?'connection,consent':'connection,consent,sources'))return json({error:'consent_required'},400);
      let config;try{if(listing){if(!['openai','deepseek'].includes(input.connection?.provider))throw Error('invalid_connection');modelListConfig(input.connection);config=input.connection;}else config=connectionConfig(input.connection);}catch{return json({error:'invalid_connection'},400);}
      if(listing){calls++;return json(await listModels({...config,fetchImpl,signal:request.signal}));}
      if(probe){calls++;return json(await checkConnection({...config,fetchImpl,signal:request.signal}));}
      const sources=checking?CONNECTION_SAMPLE:input.sources;
      try{validateAnalysis(sources,{claims:[],relations:[]});if(sources.reduce((n,s)=>n+s.text.length,0)>24000)return json({error:'too_large'},413);}catch{return json({error:'invalid_input'},400);}
      calls++;
      const answer=await reconstructWithProvider(sources,{...config,fetchImpl,signal:request.signal,maxOutputTokens:checking?2000:6000});
      if(checking)return json(assertConnectionSample(answer));
      return json(answer);
    }catch(error){return json({error:allowedErrors.has(error?.message)?error.message:'analysis_failed'},502);}
    finally{active--;}
  };
}
