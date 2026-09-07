import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {cases} from '../examples/reconstruction-cases.mjs';
import {createLedger,activeSources,addAnalysis,reviseSource,reconstruct,reconstructionChanges} from '../dist/reconstruction-core.js';
import {proposeReconstruction,summarizeWithOpenAI,RECONSTRUCTION_PROMPT,SUMMARY_PROMPT} from '../server/reconstruction.js';

const args=process.argv.slice(2),live=args.includes('--live');
const option=(name,fallback)=>{const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`Missing ${name}`);return args[i+1];};
const allowed=new Set(['--live','--dry-run','--limit','--max-requests','--max-output-tokens','--out']);
for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw Error(`Unknown argument: ${args[i]}`);if(!['--live','--dry-run'].includes(args[i]))i++;}
if(live&&args.includes('--dry-run'))throw Error('Choose one mode');
const limit=Number(option('--limit',cases.length)),maxOutputTokens=Number(option('--max-output-tokens',6000)),requestBudget=Number(option('--max-requests',0));
if(!Number.isInteger(limit)||limit<1||limit>cases.length)throw Error('Invalid case limit');
if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<1000||maxOutputTokens>12000)throw Error('Invalid token limit');
const selected=cases.slice(0,limit);
const corrected=new Set(['compatible_accounts','opposing_accounts','repeated_events']);
const plannedRequests=2*(selected.length+selected.filter(c=>corrected.has(c.id)).length);
if(live&&(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL))throw Error('Set OPENAI_API_KEY and OPENAI_MODEL locally before --live; no requests sent');
if(live&&(!Number.isInteger(requestBudget)||requestBudget<plannedRequests||requestBudget>100))throw Error(`This run needs ${plannedRequests} requests. Supply an explicit --max-requests budget; no requests sent`);
let requests=0;
const options={apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL,maxOutputTokens};
const rows=[];
for(const scenario of selected){
  let ledger=createLedger(scenario.sources),previous=null;
  for(const stage of corrected.has(scenario.id)?['initial','corrected']:['initial']){
    if(stage==='corrected'){
      ledger=reviseSource(ledger,'b',{text:activeSources(ledger).find(s=>s.id==='b').text.replaceAll('September 5','September 4')},1);
    }
    const sources=activeSources(ledger);
    let proposal=structuredClone(scenario.proposal),baseline={status:'not_run'},model=null,usage=null,providerError=null;
    if(stage==='corrected')for(const c of proposal.claims)if(c.sourceId==='b'){
      c.sourceVersion=2;c.quote=c.quote.replaceAll('September 5','September 4');
      c.time.quote=c.time.quote.replaceAll('September 5','September 4');
      if(c.time.start)c.time.start=c.time.start.replace('2026-09-05','2026-09-04');
      if(c.time.end)c.time.end=c.time.end.replace('2026-09-05','2026-09-04');
    }
    const started=performance.now();
    if(live){
      try{requests++;const result=await summarizeWithOpenAI(sources,options);baseline={status:'completed',...result};}catch(e){baseline={status:'failed',error:e.message};}
      try{requests++;const result=await proposeReconstruction(sources,options);proposal=result.proposal;model=result.model;usage=result.usage;}catch(e){providerError=e.message;proposal=null;}
    }
    let result=null,kernelError=null;
    if(proposal)try{ledger=addAnalysis(ledger,proposal,{method:live?'openai':'fixture',sources});result=reconstruct(ledger);}catch(e){kernelError=e.message;}
    const row={id:scenario.id,stage,sources,baseline,structuredProposal:proposal,model,usage,providerError,kernelError,result,changes:previous&&result?reconstructionChanges(previous,result):null,elapsedMs:Math.round(performance.now()-started),humanReview:{unsupportedFacts:null,incorrectEventLinks:null,importantInformationOmitted:null,reviewSeconds:null,notes:null}};
    rows.push(row);if(result)previous=result;
  }
}
const report={format:'care-notes-reconstruction-comparison',version:1,mode:live?'live_model_comparison':'fixture_replay',liveModelCalled:live,model:live?process.env.OPENAI_MODEL:null,requests,maxOutputTokens,caseCount:selected.length,stageCount:rows.length,limitations:['Public development cases, not an independent held-out evaluation.','Fixture outputs are authored fault injections, not model predictions.','Quote and schema checks do not establish semantic correctness.','Human review fields are deliberately unscored. No superiority or clinical validity claim.'],prompts:{structured:RECONSTRUCTION_PROMPT,baseline:SUMMARY_PROMPT},rows};
const path=resolve(option('--out','evaluation-results/reconstruction-comparison.json'));
await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:report.mode,requests,cases:report.caseCount,stages:report.stageCount,kernelFailures:rows.filter(r=>r.kernelError).length,report:path}));
