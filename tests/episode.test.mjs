import test from 'node:test';
import assert from 'node:assert/strict';
import {reconstructEpisode,episodeText,episodeLabels} from '../dist/episode.js';
import {makeDemo} from '../dist/core.js';
import {en} from '../dist/i18n.js';
test('every selected account survives once; opposing accounts are not resolved',()=>{
 const rs=makeDemo(true),result=reconstructEpisode(rs);
 assert.deepEqual(result.events.flatMap(e=>e.items.map(r=>r.id)).sort(),rs.map(r=>r.id).sort());
 const text=episodeText(result,episodeLabels.en,en,{demo:true});
 for(const r of rs)assert.ok(text.includes(r.text));
 assert.ok(result.questions.some(q=>q.kind==='accountsQuestion'&&q.refs.length===2));
 assert.ok(text.includes(episodeLabels.en.demo));
});
test('excluding a related account surfaces incompleteness without leaking excluded text',()=>{
 const rs=makeDemo(true),selected=rs.filter(r=>r.id!=='demo-sleep-self');
 const result=reconstructEpisode(selected,rs);
 assert.ok(result.events.some(e=>e.partial));assert.equal(result.excludedCount,1);
 const text=episodeText(result,episodeLabels.en,en);
 assert.ok(!text.includes(rs.find(r=>r.id==='demo-sleep-self').text));
});
test('uncertain medication stays uncertain with a question and no missed-dose assertion',()=>{
 const r=makeDemo(true).find(r=>r.category==='medication');
 const result=reconstructEpisode([r]);assert.equal(result.questions[0].kind,'medication');
 assert.equal(result.events[0].items[0].text,r.text);assert.equal(result.events[0].items[0].certainty,'uncertain');
});
test('unknown dates are retained after dated material; dates are not inferred from prose',()=>{
 const rs=makeDemo(true).slice(2,4);rs[0]={...rs[0],date:'',text:'Yesterday at noon.'};
 const result=reconstructEpisode(rs);assert.equal(result.events.at(-1).items[0].date,'');
 assert.ok(result.questions.some(q=>q.kind==='date'));
});
test('same date or category cannot silently associate independent accounts',()=>{
 const rs=makeDemo(true).slice(0,2).map(r=>({...r,group:''}));
 assert.equal(reconstructEpisode(rs).events.length,2);
 assert.ok(!reconstructEpisode(rs).questions.some(q=>q.kind==='accountsQuestion'));
});
test('review updates recompute questions and preserve the review text in handoff',()=>{
 const rs=makeDemo(true).slice(0,2).map(r=>({...r,review:'noted',reviewNote:'Different periods; neither account discarded.'}));
 const result=reconstructEpisode(rs);assert.equal(result.questions.length,0);
 assert.ok(episodeText(result,episodeLabels.en,en).includes(rs[0].reviewNote));
});
test('empty selection never claims safety; duplicate IDs fail instead of dropping evidence',()=>{
 const result=reconstructEpisode([]);assert.equal(result.selectedCount,0);
 assert.ok(episodeText(result,episodeLabels.en,en).includes(episodeLabels.en.noQuestions));
 const r=makeDemo()[0];assert.throws(()=>reconstructEpisode([r,r]));
});
test('assembly leaves input immutable and bilingual labels have equal coverage',()=>{
 const rs=makeDemo();const before=JSON.stringify(rs);reconstructEpisode(rs);assert.equal(JSON.stringify(rs),before);
 assert.deepEqual(Object.keys(episodeLabels.zh).sort(),Object.keys(episodeLabels.en).sort());
});
