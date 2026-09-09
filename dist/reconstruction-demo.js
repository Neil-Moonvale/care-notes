import {createLedger,activeSources,addAnalysis,reviseSource} from './reconstruction-core.js';
import {reconstructionCopy} from './reconstruction-copy.js';

export function demoLedger(language='en') {
  const t=reconstructionCopy[language]||reconstructionCopy.en;
  const sources=t.texts.map((text,i)=>({id:`e${i+1}`,text,author:t.names[i],recordedAt:'2026-09-05T21:00:00+08:00',version:1}));
  const claims=sources.map((s,i)=>({id:s.id,sourceId:s.id,sourceVersion:1,quote:s.text,subject:'recipient',observer:i===2?t.names[0]:s.author,topic:i===3?'medication':'sleep',basis:['not_observed','observed','reported','not_observed'][i],polarity:['unknown','affirmed','denied','unknown'][i],time:i===0||i===3?{start:'2026-09-05T00:00:00+08:00',end:'2026-09-06T00:00:00+08:00',quote:t.dateQuote}:{start:null,end:null,quote:''}}));
  return addAnalysis(createLedger(sources),{claims,relations:[{from:'e1',to:'e2',type:'same_event'},{from:'e3',to:'e1',type:'reported_from'}]},{method:'fixture'});
}
// Explicit manual correction, not free-text understanding or a model response.
export function correctDemoDate(ledger,language='en') {
  const t=reconstructionCopy[language]||reconstructionCopy.en;
  const old=activeSources(ledger).find(s=>s.id==='e2');
  if(!old||old.version!==1||old.text!==t.texts[1])throw Error('demo_changed');
  const revised=reviseSource(ledger,'e2',{text:t.correction},1);
  const source=activeSources(revised).find(s=>s.id==='e2');
  return addAnalysis(revised,{claims:[{id:'e2',sourceId:'e2',sourceVersion:2,quote:source.text,subject:'recipient',observer:source.author,topic:'sleep',basis:'observed',polarity:'affirmed',time:{start:'2026-09-04T02:00:00+08:00',end:'2026-09-04T05:00:00+08:00',quote:t.correctionQuote}}],relations:[]},{method:'manual',sources:[source]});
}
