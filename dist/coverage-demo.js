import {createLedger,addAnalysis} from './reconstruction-core.js';
import {withCoverage} from './evidence-coverage.js';
const at=t=>`2026-09-20T${t}:00+08:00`;
const range=(a,b)=>({start:at(a),end:at(b)});
export function coverageDemo(lang='en'){
 const zh=lang==='zh';
 const rows=zh?[
 ['家属甲','20:50–21:15，我看到她大约20:55离开家。','behavior','affirmed','observed','20:50','21:15'],
 ['家属乙','20:50–21:15，我看到她一直在客厅，直到21:10；这段时间没有离家。','behavior','denied','observed','20:50','21:15'],
 ['家属甲','20:00–21:00，我没有看到她服药。','medication','unknown','not_observed','20:00','21:00'],
 ['门锁（模拟）','20:54–20:56，门锁记录到开门；无法识别是谁。','other','affirmed','observed','20:54','20:56'],
 ['手表（模拟）','20:00–21:00，手表记录到活动信号；20:30–20:50没有佩戴。','behavior','unknown','uncertain','20:00','21:00'],
 ['摄像头（模拟）','20:00–21:15，摄像头可观察客厅；20:10–20:45断线，不能看到室外。','other','affirmed','observed','20:00','21:15']
 ]:[
 ['Caregiver A','20:50–21:15, I saw her leave home around 20:55.','behavior','affirmed','observed','20:50','21:15'],
 ['Caregiver B','20:50–21:15, I saw her stay in the living room until 21:10; she did not leave during this period.','behavior','denied','observed','20:50','21:15'],
 ['Caregiver A','20:00–21:00, I did not see her take medication.','medication','unknown','not_observed','20:00','21:00'],
 ['Door lock (simulated)','20:54–20:56, the door opened; the lock cannot identify who opened it.','other','affirmed','observed','20:54','20:56'],
 ['Watch (simulated)','20:00–21:00, the watch recorded motion; it was not worn from 20:30–20:50.','behavior','unknown','uncertain','20:00','21:00'],
 ['Camera (simulated)','20:00–21:15, the camera covered the living room; it was offline 20:10–20:45 and cannot see outdoors.','other','affirmed','observed','20:00','21:15']
 ];
 const sources=rows.map((r,i)=>({id:'f'+i,author:r[0],text:r[1],recordedAt:at('21:30')}));
 const claims=rows.map((r,i)=>({id:'c'+i,sourceId:'f'+i,sourceVersion:1,quote:r[1],subject:i===3?'door':'recipient',observer:r[0],topic:r[2],polarity:r[3],basis:r[4],time:{...range(r[5],r[6]),quote:r[1].slice(0,11)}}));
 let ledger=addAnalysis(createLedger(sources),{claims,relations:[{from:'c0',to:'c1',type:'contradicts'}]},{method:'fixture'});
 const base={subject:'recipient',reviewed:true,mode:'direct',active:[range('20:00','21:15')],unavailable:[],blindSpots:[],cadenceSeconds:null,heartbeats:[],clockOffsetSeconds:0,clockUncertaintySeconds:0,reliability:{level:'limited',basis:zh?'虚构示例，非真实验证':'Fictional fixture, not real validation'},silenceMeaningful:false};
 const profiles=[
 {...base,id:'a',label:rows[0][0],type:'caregiver',capabilities:['behavior','medication'],contractCapabilities:['behavior','medication'],active:[range('20:00','20:10'),range('20:50','21:00')]},
 {...base,id:'b',label:rows[1][0],type:'caregiver',capabilities:['behavior'],contractCapabilities:['behavior'],active:[range('20:50','21:15')]},
 {...base,id:'lock',label:rows[3][0],subject:'door',type:'sensor',capabilities:['door_open'],contractCapabilities:['door_open'],clockUncertaintySeconds:60},
 {...base,id:'watch',label:rows[4][0],type:'wearable',capabilities:['motion'],contractCapabilities:['motion'],mode:'indirect',unavailable:[{...range('20:30','20:50'),reason:zh?'未佩戴':'Not worn'}]},
 {...base,id:'camera',label:rows[5][0],type:'camera',capabilities:['behavior'],contractCapabilities:['behavior'],unavailable:[{...range('20:10','20:45'),reason:zh?'断线':'Offline'}],blindSpots:[zh?'无法看到室外或确认吞咽':'Cannot see outdoors or confirm swallowing']}
 ];
 ledger=withCoverage(ledger,{version:1,revision:0,profiles,bindings:['a','b','a','lock','watch','camera'].map((p,i)=>({sourceId:'f'+i,sourceVersion:1,profileId:p})),assertions:[]});
 return ledger;
}
