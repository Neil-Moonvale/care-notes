// Request-scoped BYOK. Never persist keys, log bodies, or follow provider redirects.
export const PROVIDERS = Object.freeze({
  openai: {name:'OpenAI',origin:'https://api.openai.com',path:'/v1/responses',format:'responses'},
  deepseek: {name:'DeepSeek',origin:'https://api.deepseek.com',path:'/chat/completions',format:'chat'},
});
export const providerList = () => Object.entries(PROVIDERS).map(([id,p])=>({id,name:p.name,origin:p.origin}));
export function connectionConfig(input) {
  if(!input || Object.keys(input).sort().join(',')!=='apiKey,model,provider')throw Error('invalid_connection');
  const {provider,apiKey,model}=input;
  if(!Object.hasOwn(PROVIDERS,provider)||typeof apiKey!=='string'||!/^[\x21-\x7e]{8,512}$/.test(apiKey)||typeof model!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(model))throw Error('invalid_connection');
  return {provider,apiKey,model};
}
export async function boundedJson(response,limit=500000) {
  const reader=response.body?.getReader();if(!reader)throw Error('provider_invalid');
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('too_large');}chunks.push(value);}
  const joined=new Uint8Array(size);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(joined));}catch{throw Error('provider_invalid');}
}
// Validate both providers locally. JSON mode alone is not schema conformance.
export function assertSchema(value,schema) {
  const kinds=Array.isArray(schema.type)?schema.type:[schema.type];
  const kind=value===null?'null':Array.isArray(value)?'array':typeof value;
  if(!kinds.includes(kind)&&!(kinds.includes('integer')&&Number.isSafeInteger(value)))throw Error('provider_invalid');
  if(schema.enum&&!schema.enum.includes(value))throw Error('provider_invalid');
  if(kind==='object'){
    if(Object.keys(value).some(k=>!Object.hasOwn(schema.properties,k))||schema.required.some(k=>!Object.hasOwn(value,k)))throw Error('provider_invalid');
    for(const [k,v] of Object.entries(value))assertSchema(v,schema.properties[k]);
  }
  if(kind==='array'){if(value.length>160)throw Error('provider_invalid');for(const v of value)assertSchema(v,schema.items);}
  if(kind==='string'&&value.length>24000)throw Error('provider_invalid');
}
export async function requestStructured({provider='openai',apiKey,model,baseUrl,format,outputStyle='json',fetchImpl=fetch,maxOutputTokens=6000,schema,instructions,input,name,signal}) {
  const config=provider==='custom'?customConnection({provider,apiKey,model,baseUrl,format}):connectionConfig({provider,apiKey,model});
  const p=provider==='custom'?{format:config.format}:PROVIDERS[config.provider];
  const endpoint=provider==='custom'?config.endpoint:p.origin+p.path;
  if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<1000||maxOutputTokens>12000)throw Error('invalid_token_limit');
  const body=p.format==='responses'
    ? {model,store:false,max_output_tokens:maxOutputTokens,instructions,input:JSON.stringify(input),text:{format:{type:'json_schema',name,strict:true,schema}}}
    : {model,max_tokens:maxOutputTokens,stream:false,response_format:{type:'json_object'},messages:[{role:'system',content:instructions+'\nReturn only a JSON object matching this JSON schema: '+JSON.stringify(schema)},{role:'user',content:JSON.stringify(input)}]};
  if(!['json','compatible'].includes(outputStyle))throw Error('invalid_connection');
  if(outputStyle==='compatible'){
    if(p.format==='responses'){delete body.text;body.instructions+='\nReturn only JSON matching this schema: '+JSON.stringify(schema);}
    else delete body.response_format;
  }
  const requestController=new AbortController();
  const abort=()=>requestController.abort(signal?.reason);
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const deadline=setTimeout(()=>requestController.abort(new DOMException('Timeout','TimeoutError')),120000);
  try {
  let response;
  try{response=await fetchImpl(endpoint,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},signal:requestController.signal,body:JSON.stringify(body)});}
  catch(error){throw Error(['provider_timeout','invalid_connection','rate_limited','too_large'].includes(error?.message)?error.message:['TimeoutError','AbortError'].includes(error?.name)?'provider_timeout':'provider_network');}
  if(!response.ok){await response.body?.cancel();throw Error(response.status===401?'provider_auth':response.status===402?'provider_credit':response.status===429?'provider_limit':[400,403,404,422].includes(response.status)?'provider_model':'provider_failed');}
  const result=await boundedJson(response);
  let output;
  if(p.format==='responses'){
    if(result.status!=='completed'||!Array.isArray(result.output))throw Error('provider_incomplete');
    const parts=result.output.filter(o=>o.type==='message').flatMap(o=>o.content||[]);
    if(parts.some(p=>p.type==='refusal'))throw Error('provider_refusal');
    output=parts.filter(p=>p.type==='output_text').map(p=>p.text).join('');
  }else{
    const choice=result.choices?.[0];
    if(choice?.message?.refusal||choice?.finish_reason==='content_filter')throw Error('provider_refusal');
    if(choice?.finish_reason!=='stop')throw Error('provider_incomplete');
    output=choice.message?.content;
  }
  if(typeof output!=='string'||!output||output.length>160000)throw Error('provider_invalid');
  let proposal;try{proposal=JSON.parse(output.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i,'$1'));}catch{throw Error('provider_invalid');}assertSchema(proposal,schema);
  // Return bounded metadata only. Never forward arbitrary provider errors or response fields.
  const raw=result.usage||{},usage={};
  for(const k of ['input_tokens','output_tokens','prompt_tokens','completion_tokens','total_tokens'])if(Number.isSafeInteger(raw[k])&&raw[k]>=0)usage[k]=raw[k];
  return {proposal,usage,model,provider};
  } finally {clearTimeout(deadline);signal?.removeEventListener('abort',abort);}
}

// Custom destinations run on the user's device, never through the hosted proxy.
export function customEndpoint(baseUrl,format='chat') {
  if(!['chat','responses'].includes(format)||typeof baseUrl!=='string'||baseUrl.length>1000)throw Error('invalid_connection');
  let url;try{url=new URL(baseUrl.trim());}catch{throw Error('invalid_connection');}
  const host=url.hostname.toLowerCase(),suffix=format==='chat'?'/chat/completions':'/responses';
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port&&url.port!=='443'||!host.includes('.')||!/^[a-z0-9.-]+$/.test(host)||/^[0-9.]+$/.test(host)||/(^|\.)(localhost|local|internal|invalid|test)$/.test(host)||host.endsWith('.'))throw Error('invalid_connection');
  let path=url.pathname.replace(/\/+$/,'');
  if(path.endsWith('/responses')&&format!=='responses'||path.endsWith('/chat/completions')&&format!=='chat')throw Error('invalid_connection');
  if(!path.endsWith(suffix))path=(path||'/v1')+suffix;
  url.pathname=path;return url.href;
}
export function customConnection(input){
  if(!input||Object.keys(input).sort().join(',')!=='apiKey,baseUrl,format,model,provider'||input.provider!=='custom')throw Error('invalid_connection');
  connectionConfig({provider:'openai',apiKey:input.apiKey,model:input.model});
  return {...input,endpoint:customEndpoint(input.baseUrl,input.format)};
}

export async function checkConnection(options){
  const schema={type:'object',additionalProperties:false,required:['ok'],properties:{ok:{type:'boolean'}}};
  const answer=await requestStructured({...options,maxOutputTokens:2000,schema,instructions:'Return the JSON object {"ok":true}. This is a connection check.',input:{task:'connection check'},name:'care_notes_connection'});
  if(answer.proposal.ok!==true)throw Error('check_failed');
  return {checked:true,provider:answer.provider,model:answer.model,usage:answer.usage};
}

// Listing models never requires a model ID and never sends care records.
export function modelListEndpoint({provider,baseUrl,format='chat'}) {
  if(provider==='custom')return customEndpoint(baseUrl,format).replace(/\/(chat\/completions|responses)$/, '/models');
  if(!Object.hasOwn(PROVIDERS,provider))throw Error('invalid_connection');
  return PROVIDERS[provider].origin+(provider==='openai'?'/v1/models':'/models');
}
export function modelListConfig(input) {
  if(!input||Object.keys(input).sort().join(',')!==(input.provider==='custom'?'apiKey,baseUrl,format,provider':'apiKey,provider'))throw Error('invalid_connection');
  connectionConfig({provider:input.provider==='custom'?'openai':input.provider,apiKey:input.apiKey,model:'list-probe'});
  return {...input,endpoint:modelListEndpoint(input)};
}
export async function listModels({fetchImpl=fetch,signal,...input}) {
  const config=modelListConfig(input),controller=new AbortController();
  const abort=()=>controller.abort();
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,20000);
  try {
    let response;
    try{response=await fetchImpl(config.endpoint,{method:'GET',redirect:'error',cache:'no-store',headers:{Authorization:`Bearer ${config.apiKey}`,Accept:'application/json'},signal:controller.signal});}
    catch(error){throw Error(controller.signal.aborted?'provider_timeout':['invalid_connection','rate_limited','too_large'].includes(error?.message)?error.message:'provider_network');}
    if(!response.ok){await response.body?.cancel();throw Error(response.status===401?'provider_auth':response.status===403?'models_forbidden':[404,405].includes(response.status)?'models_unsupported':response.status===429?'provider_limit':'provider_failed');}
    const body=await boundedJson(response);
    if(!Array.isArray(body?.data)||body.data.length>5000)throw Error('provider_invalid');
    const models=[...new Set(body.data.map(x=>x?.id).filter(id=>typeof id==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(id)))].sort();
    return {models};
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
