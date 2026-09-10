// The native bridge exists only in the APK's bundled, isolated origin.
export const isAndroid=()=>typeof globalThis.CareNotesNative?.request==='function';
const pending=new Map();
globalThis.__careNotesReply=(id,payload)=>{
  const job=pending.get(id);if(!job)return;
  pending.delete(id);job.cleanup();
  if(payload.error)job.reject(Error(payload.error));
  else {try{job.resolve(new Response(payload.body,{status:payload.status,headers:{'Content-Type':'application/json'}}));}catch{job.reject(Error('provider_invalid'));}}
};
export function deviceFetch(url,options={}){
  if(!isAndroid())return fetch(url,options);
  return new Promise((resolve,reject)=>{
    const id=crypto.randomUUID(),signal=options.signal;
    const cancel=()=>{if(!pending.has(id))return;pending.delete(id);globalThis.CareNotesNative.cancel(id);cleanup();reject(new DOMException('Cancelled','AbortError'));};
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);};
    const timer=setTimeout(cancel,245000);
    pending.set(id,{resolve,reject,cleanup});
    if(signal?.aborted){cancel();return;}
    signal?.addEventListener('abort',cancel,{once:true});
    try{const authorization=new Headers(options.headers).get('Authorization')||'';if(options.method==='GET'){if(typeof globalThis.CareNotesNative.listModels!=='function')throw Error('native_update_required');globalThis.CareNotesNative.listModels(id,url,authorization);}else globalThis.CareNotesNative.request(id,url,authorization,options.body||'');}
    catch(error){pending.delete(id);cleanup();reject(Error(error?.message==='native_update_required'?'native_update_required':'provider_network'));}
  });
}
export function saveFile(content,name,type){
  if(isAndroid()){globalThis.CareNotesNative.saveFile(content,name,type.split(';')[0]);return;}
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
