import {buildPersonalBaseline,reconstructEpisodes} from './evidence.js';
import {fictionalSevenDayEvidence} from './demo-evidence.js';

const copy={
 zh:{fictional:'虚构演示',title:'发生了什么？',subtitle:'当被照护者没有主动记录时，把家属观察与设备留下的碎片重新拼成可核对的时间线。',notDiagnosis:'这不是诊断。',notDiagnosisBody:'系统只整理证据、变化、冲突与未知，不把传感器信号升级成医学结论。',baselineTitle:'先和这个人平时的状态比较',baselinePeriod:'基线：前 4 天',reviewTitle:'段值得回顾的变化',reviewHint:'每一条结论都必须能回到原始证据。',evidenceTitle:'原始证据时间线',clearFocus:'清除高亮',footer:'Care Notes v0.3 prototype · 数据为虚构示例 · Local-first / Evidence-first',needsReview:'待家属确认',episode:'变化片段',baseline:'个人基线',sleep:'睡眠时长',night:'夜间活动',hours:'小时',events:'次',supported:'有证据支持',unknown:'仍然未知',conflict:'存在冲突',claimSleepLow:(v,b)=>`记录到的睡眠时长为 ${v} 小时，低于个人基线中位数 ${b} 小时。`,claimNightHigh:(v,b)=>`夜间活动事件为 ${v} 次，高于个人基线中位数 ${b} 次。`,claimUnknown:m=>m==='medication_status'?'当晚用药状态无法确认：药盒传感器离线。':`${m} 状态未知。`,claimConflict:n=>`同一件事出现 ${n} 组互相不一致的观察。系统保留双方说法，不替家属决定谁是对的。`,evidenceCount:n=>`${n} 条证据`,sources:{health_connect:'Health Connect',home_assistant:'Home Assistant',frigate:'Frigate',caregiver_note:'家属记录',phone:'手机',medication:'药盒'},events:{sleep_duration:'睡眠时长',night_activity_count:'夜间活动',phone_activity:'手机活动',door_event:'门锁事件',caregiver_observation:'家属观察',sensor_status:'传感器状态'},values:{screen_active:'屏幕在该时段有活动',unlocked_then_locked:'门锁发生解锁后重新上锁',very_little:'几乎没吃',half_bowl:'约半碗',meal_reduced:'只吃了几口',sensor_offline:'传感器离线'}},
 en:{fictional:'Fictional demo',title:'What happened?',subtitle:'When the person being cared for did not actively document, reconstruct a reviewable timeline from caregiver observations and device evidence.',notDiagnosis:'This is not a diagnosis.',notDiagnosisBody:'Care Notes organizes evidence, changes, conflicts and unknowns without upgrading sensor signals into medical conclusions.',baselineTitle:'Compare with this person’s usual pattern first',baselinePeriod:'Baseline: previous 4 days',reviewTitle:'reviewable change clusters',reviewHint:'Every claim must lead back to source evidence.',evidenceTitle:'Source evidence timeline',clearFocus:'Clear highlight',footer:'Care Notes v0.3 prototype · Fictional data only · Local-first / Evidence-first',needsReview:'Needs caregiver review',episode:'Change cluster',baseline:'Personal baseline',sleep:'Sleep duration',night:'Night activity',hours:'h',events:'events',supported:'Supported by evidence',unknown:'Unknown',conflict:'Conflicting',claimSleepLow:(v,b)=>`Recorded sleep duration was ${v} h, below the personal baseline median of ${b} h.`,claimNightHigh:(v,b)=>`Nighttime activity recorded ${v} events, above the personal baseline median of ${b}.`,claimUnknown:m=>m==='medication_status'?'Medication status cannot be confirmed because the pillbox sensor was offline.':`${m} remains unknown.`,claimConflict:n=>`${n} conflicting observation pair(s) refer to the same matter. Care Notes preserves both accounts instead of deciding which is true.`,evidenceCount:n=>`${n} evidence items`,sources:{health_connect:'Health Connect',home_assistant:'Home Assistant',frigate:'Frigate',caregiver_note:'Caregiver note',phone:'Phone',medication:'Pillbox'},events:{sleep_duration:'Sleep duration',night_activity_count:'Night activity',phone_activity:'Phone activity',door_event:'Door event',caregiver_observation:'Caregiver observation',sensor_status:'Sensor status'},values:{screen_active:'Screen activity observed in this window',unlocked_then_locked:'Door unlocked then locked again',very_little:'Very little observed',half_bowl:'About half a bowl observed',meal_reduced:'Only a few bites observed',sensor_offline:'Sensor offline'}}
};

let lang=(navigator.language||'').toLowerCase().startsWith('zh')?'zh':'en';
const demo=fictionalSevenDayEvidence();
const events=demo.events;
const baseline=buildPersonalBaseline(events,{before:demo.baseline_before});
const episodes=reconstructEpisodes(events,{baseline,after:demo.baseline_before});
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=()=>copy[lang];
const sourceName=s=>t().sources[s]||s;

function fmtTime(value){return new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-US',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
function renderText(){document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.querySelectorAll('[data-i18n]').forEach(el=>{const v=t()[el.dataset.i18n];if(typeof v==='string')el.textContent=v;});$('#langButton').textContent=lang==='zh'?'EN':'中';}

function renderBaseline(){
  const specs=[['sleep_duration','sleep','hours'],['night_activity_count','night','events']];
  $('#baselineCards').innerHTML=specs.map(([metric,label,unit])=>{
    const base=baseline[metric];
    const current=events.filter(e=>e.baseline_metric===metric&&Date.parse(e.observed_at)>=Date.parse(demo.baseline_before)).slice(0,2);
    const max=Math.max(base.median,...current.map(e=>e.value))*1.18;
    return `<article class="baseline-card"><div class="metric-head"><div><h3>${esc(t()[label])}</h3><div class="metric-sub">${esc(t().baseline)} · n=${base.samples}</div></div><div class="metric-value">${base.median.toFixed(1)} <small>${esc(t()[unit])}</small></div></div><div class="compare-row"><span>${esc(t().baseline)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,base.median/max*100)}%"></div></div><b>${base.median.toFixed(1)}</b></div>${current.map(e=>`<div class="compare-row"><span>${esc(fmtTime(e.observed_at).split(' ')[0])}</span><div class="bar-track"><div class="bar-fill current" style="width:${Math.max(4,e.value/max*100)}%"></div></div><b>${e.value}</b></div>`).join('')}</article>`;
  }).join('');
}

function claimText(claim){
  if(claim.claim_type==='baseline_deviation'){
    if(claim.metric==='sleep_duration')return t().claimSleepLow(claim.observed,claim.baseline_median.toFixed(1));
    if(claim.metric==='night_activity_count')return t().claimNightHigh(claim.observed,claim.baseline_median.toFixed(1));
  }
  if(claim.claim_type==='unknown')return t().claimUnknown(claim.metric);
  if(claim.claim_type==='conflict')return t().claimConflict(claim.count);
  return claim.claim_type;
}
function claimClass(c){return c.claim_type==='unknown'?'unknown':c.claim_type==='conflict'?'conflict':'';}
function claimLabel(c){return c.claim_type==='unknown'?t().unknown:c.claim_type==='conflict'?t().conflict:t().supported;}

function renderEpisodes(){
  $('#episodeCount').textContent=episodes.length;
  $('#episodes').innerHTML=episodes.map((ep,index)=>{
    const epEvents=events.filter(e=>ep.evidence_ids.includes(e.event_id));
    const sources=[...new Set(epEvents.map(e=>e.source_type))];
    return `<article class="episode-card"><div class="episode-head"><div class="episode-index"><span class="episode-number">${String(index+1).padStart(2,'0')}</span><div><h3>${esc(t().episode)} ${index+1}</h3><div class="episode-time">${esc(fmtTime(ep.start_at))} — ${esc(fmtTime(ep.end_at))} · ${esc(t().evidenceCount(ep.evidence_ids.length))}</div></div></div><span class="needs-review">${esc(t().needsReview)}</span></div><div class="claims">${ep.claims.map(c=>`<div class="claim ${claimClass(c)}"><div class="claim-top"><span class="claim-mark"></span><div><p>${esc(claimText(c))}</p><small>${esc(claimLabel(c))}</small><div class="evidence-chips">${c.evidence_ids.map(id=>`<button class="evidence-chip" data-focus="${esc(id)}">${esc(id)}</button>`).join('')}</div></div></div></div>`).join('')}</div><div class="episode-sources">${sources.map(s=>`<span class="source-pill">${esc(sourceName(s))}</span>`).join('')}</div></article>`;
  }).join('');
}

function evidenceDescription(e){
  if(e.note)return e.note;
  const name=t().events[e.event_type]||e.event_type;
  const value=t().values[e.value]||e.value;
  if(typeof e.value==='number')return `${name}: ${e.value}${e.unit?` ${e.unit}`:''}`;
  return `${name}: ${value??''}`;
}
function renderEvidence(){
  const relevant=events.filter(e=>Date.parse(e.observed_at)>=Date.parse(demo.baseline_before)).sort((a,b)=>Date.parse(a.observed_at)-Date.parse(b.observed_at));
  $('#evidenceTimeline').innerHTML=relevant.map(e=>`<article class="evidence-item" data-evidence="${esc(e.event_id)}"><div class="evidence-time">${esc(fmtTime(e.observed_at))}</div><div class="evidence-main"><strong>${esc(t().events[e.event_type]||e.event_type)}</strong><p>${esc(evidenceDescription(e))}</p><p>${esc(e.event_id)} · confidence ${Math.round(e.confidence*100)}%</p></div><span class="source-tag ${esc(e.source_type)}">${esc(sourceName(e.source_type))}</span></article>`).join('');
}
function focusEvidence(id){document.querySelectorAll('.evidence-item').forEach(el=>{el.classList.toggle('focused',el.dataset.evidence===id);el.classList.toggle('dimmed',el.dataset.evidence!==id);});document.querySelector(`[data-evidence="${CSS.escape(id)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});}
function clearFocus(){document.querySelectorAll('.evidence-item').forEach(el=>el.classList.remove('focused','dimmed'));}
function render(){renderText();renderBaseline();renderEpisodes();renderEvidence();}

document.addEventListener('click',e=>{const focus=e.target.closest('[data-focus]');if(focus)focusEvidence(focus.dataset.focus);});
$('#clearFocus').addEventListener('click',clearFocus);
$('#langButton').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';render();});
render();
