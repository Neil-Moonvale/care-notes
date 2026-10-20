import {handoffChanges,handoffLabels} from './handoff-changes.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderHandoffChanges(ledger,lang,{reviewed=false,busy=false}={}){
 const c=handoffLabels(lang),d=handoffChanges(ledger);
 const source=s=>`<p class="meta">${esc(s.author)} · ${esc(s.id)} v${s.version} · ${esc(s.recordedAt)}</p><blockquote>${esc(s.text)}</blockquote>`;
 const group=(label,items,render)=>`<details class="handoff-group"><summary>${esc(label)} (${items.length})</summary>${items.map(render).join('')}</details>`;
 const disabled=!reviewed||busy?'disabled':'';
 return `<section class="panel handoff-changes"><h2>${esc(c.title)}</h2><p>${esc(c.intro)}</p>${d?`<p class="meta">${esc(c.since)}: ${esc(d.createdAt)}</p><p class="note">${esc(c.historical)}</p>${group(c.added,d.added,s=>`<article>${source(s)}</article>`)}${group(c.revised,d.revised,x=>`<article><h3>${esc(c.before)}</h3>${source(x.before)}<h3>${esc(c.after)}</h3>${source(x.after)}</article>`)}${group(c.removed,d.removed,s=>`<article class="retired">${source(s)}</article>`)}${d.coverageChanged?`<p class="note">${esc(c.coverage)}</p>`:''}${!d.added.length&&!d.revised.length&&!d.removed.length&&!d.coverageChanged?`<p>${esc(c.none)}</p>`:''}<p class="meta">${esc(c.pending)}: ${d.pending}</p>`:`<p>${esc(c.empty)}</p>`}<p class="meta">${esc(c.scope)}</p>${!reviewed?`<p>${esc(c.review)}</p>`:''}<div class="toolbar"><button type="button" data-action="save-checkpoint" ${disabled}>${esc(c.save)}</button>${d?`<button type="button" data-action="export-changes" ${disabled}>${esc(c.export)}</button>`:''}</div></section>`;
}
