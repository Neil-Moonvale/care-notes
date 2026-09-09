import { validateAnalysis, TOPICS, BASES, RELATIONS } from '../dist/reconstruction-core.js';
import {requestStructured} from './providers.js';

import {RECONSTRUCTION_SCHEMA,RECONSTRUCTION_PROMPT,SUMMARY_SCHEMA,SUMMARY_PROMPT,reconstructOnDevice} from '../dist/reconstruction-model.js';
export {RECONSTRUCTION_SCHEMA,RECONSTRUCTION_PROMPT,SUMMARY_SCHEMA,SUMMARY_PROMPT};

async function requestModel(sources,{apiKey,model,fetchImpl=fetch,maxOutputTokens=6000},schema,instructions,name) {
  if(!apiKey||!model)throw Error('not_configured');
  // Validate source identity, dates and bounded input before any billable request.
  validateAnalysis(sources,{claims:[],relations:[]});
  if(sources.reduce((n,s)=>n+s.text.length,0)>24000)throw Error('too_large');
  if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<1000||maxOutputTokens>12000)throw Error('invalid_token_limit');
  const response=await fetchImpl('https://api.openai.com/v1/responses',{
    method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),
    body:JSON.stringify({model,store:false,max_output_tokens:maxOutputTokens,instructions,input:JSON.stringify({sources}),text:{format:{type:'json_schema',name,strict:true,schema}}}),
  });
  if(!response.ok)throw Error('provider_failed');
  const result=await response.json();
  if(result.status!=='completed'||!Array.isArray(result.output))throw Error('provider_incomplete');
  const parts=result.output.filter(o=>o.type==='message').flatMap(o=>o.content||[]);
  if(parts.some(p=>p.type==='refusal'))throw Error('provider_refusal');
  const output=parts.filter(p=>p.type==='output_text').map(p=>p.text).join('');
  if(!output||output.length>160000)throw Error('invalid_analysis');
  const proposal=JSON.parse(output);
  return {proposal,usage:result.usage??null,model:result.model??model};
}

export async function proposeReconstruction(sources,options={}) {
  return requestModel(sources,options,RECONSTRUCTION_SCHEMA,RECONSTRUCTION_PROMPT,'care_notes_reconstruction');
}
export async function summarizeWithOpenAI(sources,options={}) {
  const {proposal,...meta}=await requestModel(sources,options,SUMMARY_SCHEMA,SUMMARY_PROMPT,'care_notes_handoff');
  return {summary:proposal,...meta};
}

export async function reconstructWithOpenAI(sources,options) {
  const {proposal,usage,model}=await proposeReconstruction(sources,options);
  // Validate before returning to the UI; the client checks versions again on receipt.
  validateAnalysis(sources,proposal);
  return {proposal,usage,model};
}

export const reconstructWithProvider=reconstructOnDevice;
