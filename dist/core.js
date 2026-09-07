export const CATEGORIES=['sleep','food','medication','mood','visit','other'];
export const SOURCES=['self','family','clinician'];
export const CERTAINTIES=['direct','reported','uncertain'];
export const uid=()=>crypto.randomUUID();
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00Z`);return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
export function validateBackup(value){
 if(!value||value.format!=='care-notes'||value.version!==1||!Array.isArray(value.records)||value.records.length>5000)throw Error('invalid');
 const ids=new Set(); const str=(v,max)=>typeof v==='string'&&v.length<=max;
 const records=value.records.map(r=>{
 if(!r||!str(r.id,80)||!(/^[a-zA-Z0-9-]+$/).test(r.id)||ids.has(r.id)||!str(r.text,5000)||!r.text.trim()||!CATEGORIES.includes(r.category)||!SOURCES.includes(r.source)||!CERTAINTIES.includes(r.certainty)||!(r.date===''||validDate(r.date))||!str(r.time,5)||!(r.time===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))||!str(r.when,120)||!str(r.author,60)||!str(r.group,80)||!(r.group===''||/^[a-zA-Z0-9-]+$/.test(r.group))||!['pending','noted'].includes(r.review)||!str(r.reviewNote,1000)||!str(r.createdAt,40)||!Number.isFinite(Date.parse(r.createdAt))||!str(r.updatedAt,40)||!Number.isFinite(Date.parse(r.updatedAt)))throw Error('invalid');
 ids.add(r.id);const history=r.history??[];if(!Array.isArray(history)||history.length>1000||history.some(h=>!h||!str(h.text,5000)||!str(h.date,10)||!(h.date===''||validDate(h.date))||!str(h.time,5)||!(h.time===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(h.time))||!str(h.when,120)||!str(h.author,60)||!SOURCES.includes(h.source)||!CATEGORIES.includes(h.category)||!CERTAINTIES.includes(h.certainty)||!str(h.updatedAt,40)||!Number.isFinite(Date.parse(h.updatedAt))))throw Error('invalid');const clean=Object.fromEntries(['id','text','category','source','certainty','date','time','when','author','group','review','reviewNote','createdAt','updatedAt'].map(k=>[k,r[k]]));clean.history=history.map(h=>Object.fromEntries(['text','date','time','when','author','source','category','certainty','updatedAt'].map(k=>[k,h[k]])));return clean;
 });
 return records;
}
export function sortRecords(records){return [...records].sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)||b.createdAt.localeCompare(a.createdAt));}
export function groups(records){const m=new Map();for(const r of records){if(r.group){if(!m.has(r.group))m.set(r.group,[]);m.get(r.group).push(r);}}return [...m.entries()].filter(([,rs])=>rs.length>1).map(([id,items])=>({id,items,pending:items.some(r=>r.review!=='noted')}));}
export function inRange(r,from,to){return (!from&&!to)||(!r.date?false:(!from||r.date>=from)&&(!to||r.date<=to));}
export function linkRecords(records,record,relatedId){
 const related=records.find(r=>r.id===relatedId&&r.id!==record.id);
 let next=records.filter(r=>r.id!==record.id);
 if(related){const group=related.group||related.id;const old=record.group;next=next.map(r=>(r.id===related.id||r.group===group||(old&&r.group===old))?{...r,group,review:'pending',reviewNote:''}:r);record={...record,group,review:'pending',reviewNote:''};}
 else if(record.group){next=next.map(r=>r.group===record.group?{...r,review:'pending',reviewNote:''}:r);record={...record,review:'pending',reviewNote:''};}
 return [...next,record];
}
export function summaryText(records,labels,{demo=false,includeAuthors=false,from='',to='',now=new Date()}={}){
 const lines=[labels.summaryTitle,demo?labels.demoLabel:'',`${labels.generated}: ${now.toLocaleString(labels.locale)}`,`${labels.range}: ${from||labels.unlimited} — ${to||labels.unlimited}`,labels.summaryNotice,''];
 const gs=groups(records);
 for(const [i,r] of sortRecords(records).entries()){
 lines.push(`[${i+1}] ${r.date||labels.unknownDate}${r.time?' '+r.time:''}${r.when?' · '+r.when:''} · ${labels[r.category]}`);
 lines.push(`${labels.source}: ${labels[r.source]}${includeAuthors&&r.author?' · '+r.author:''} · ${labels[r.certainty]}`);
 lines.push(r.text);
 const g=gs.find(g=>g.items.some(x=>x.id===r.id));
 if(g){lines.push(`${labels.review}: ${g.pending?labels.pending:labels.noted}`);if(r.reviewNote)lines.push(`${labels.reviewNote}: ${r.reviewNote}`);}
 else if(r.group)lines.push(labels.relatedOutside);
 lines.push(`${labels.reference}: ${r.id} · ${labels.updated}: ${r.updatedAt}`,'');
 }
 if(!records.length)lines.push(labels.noRecords);
 lines.push(labels.missingNotice);return lines.filter(x=>x!==undefined).join('\n');
}
export function makeDemo(en=false){const date=localDate();const yesterday=localDate(new Date(Date.now()-86400000));const at=new Date().toISOString();const base={certainty:'direct',time:'',when:'',author:'',group:'',review:'pending',reviewNote:'',createdAt:at,updatedAt:at};
 return [
 {...base,id:'demo-sleep-family',date,category:'sleep',source:'family',time:'08:00',when:en?'Last night':'昨夜',group:'demo-sleep',text:en?'I did not see them sleeping last night. I think they stayed awake.':'昨晚我没有看到她睡着，我觉得她一夜没睡。'},
 {...base,id:'demo-sleep-self',date,category:'sleep',source:'self',time:'08:20',when:en?'Last night':'昨夜',group:'demo-sleep',text:en?'I slept for about three hours after midnight.':'我凌晨睡了大概三个小时。'},
 {...base,id:'demo-food',date,category:'food',source:'family',time:'12:30',text:en?'Had half a bowl of rice and some soup at lunch.':'午饭吃了半碗米饭，喝了一点汤。'},
 {...base,id:'demo-med',date:yesterday,category:'medication',source:'family',certainty:'uncertain',time:'20:00',text:en?'I am not sure whether the evening medication was taken. I did not see it.':'不确定晚上的药有没有吃，我没有亲眼看到。'},
 {...base,id:'demo-self',date:yesterday,category:'mood',source:'self',time:'16:00',text:en?'I felt tired this afternoon and wanted some quiet time.':'下午觉得累，想自己安静待一会儿。'}];}

export function previousVersion(r){return Object.fromEntries(['text','date','time','when','author','source','category','certainty','updatedAt'].map(k=>[k,r[k]]));}
