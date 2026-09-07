import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentText, localDraft, validateSuggestions, draftToRecords } from '../dist/draft.js';
import { validateBackup, summaryText } from '../dist/core.js';
import { en, zh } from '../dist/i18n.js';
import { LANGUAGES, chooseLanguage, getLabels } from '../dist/locales.js';

const decisions = drafts => drafts.map(d => ({...d,date:'',confirmed:true}));
const payload = drafts => ({suggestions:drafts.map(({id,category,source,certainty})=>({id,category,source,certainty}))});
test('opposing accounts preserve every original character and both sources',()=>{
  const original='妈妈说她昨晚没睡，她自己说睡了大概三个小时。';
  const drafts=localDraft(original);
  assert.equal(drafts.length,2); assert.equal(drafts[0].source,'family'); assert.equal(drafts[1].source,'self');
  assert.equal(drafts.map(d=>d.quote).join(''),original);
  assert.ok(drafts.every(d=>d.certainty==='uncertain'));
});
test('Unicode, decimals and non-English records keep exact source positions',()=>{
  for(const original of ['🙂 昨夜睡了3.5小时。今天喝水。','She slept 3.5 hours. Then had soup.','نامت ثلاث ساعات. ثم شربت ماء.','Durmió tres horas. No sé si tomó la medicación.']){
    const ds=segmentText(original);
    assert.equal(ds.map(d=>d.quote).join('').replace(/\s/g,''),original.replace(/\s/g,''));
    for(const d of ds)assert.equal(original.slice(d.start,d.end),d.quote);
  }
  assert.ok(segmentText('She slept 3.5 hours. Then had soup.')[0].quote.includes('3.5'));
});
test('ambiguous first-person narrator is never assumed to be the patient',()=>{
  assert.equal(localDraft('I did not see them sleeping.')[0].source,'unknown');
  assert.equal(localDraft('妈妈说她没睡但本人说睡了三个小时。')[0].source,'unknown');
});
test('input and segment limits fail without silently dropping text',()=>{
  for(const value of ['',null,' '.repeat(20),'x'.repeat(5001),'note. '.repeat(41)]) assert.throws(()=>segmentText(value));
});
test('missing, duplicate, invented and rewritten model items are rejected',()=>{
  const original='Had lunch. Took medication.'; const good=payload(localDraft(original));
  assert.equal(validateSuggestions(original,good).length,2);
  for(const mutate of [p=>p.suggestions.pop(),p=>p.suggestions[1].id=p.suggestions[0].id,p=>p.suggestions[0].id='invented',p=>p.suggestions[0].text='Invented claim',p=>p.suggestions[0].category='diagnosis']){
    const p=structuredClone(good);mutate(p);assert.throws(()=>validateSuggestions(original,p));
  }
});
test('a model cannot remove explicit uncertainty even when it labels a clause direct',()=>{
  const original='Not sure whether medication was taken. Had lunch.';
  const p=payload(localDraft(original));p.suggestions.forEach(s=>s.certainty='direct');
  assert.ok(validateSuggestions(original,p).every(s=>s.certainty==='uncertain'));
});
test('drafts require every human confirmation and never invent dates',()=>{
  const original='Last night I slept. 昨天吃了饭。';const ds=localDraft(original);
  assert.throws(()=>draftToRecords(original,ds));
  const choices=decisions(ds);choices[0].confirmed=false;
  assert.throws(()=>draftToRecords(original,ds,{decisions:choices}));
  const rs=draftToRecords(original,ds,{decisions:decisions(ds)});
  assert.ok(rs.every(r=>r.date==='' && r.group===''));
  const bad=decisions(ds);bad[0].date='2026-02-30';assert.throws(()=>draftToRecords(original,ds,{decisions:bad}));
});
test('evidence survives correction, backup restore and summary references',()=>{
  const original='Not sure whether medication was taken.';const ds=localDraft(original);
  const rs=draftToRecords(original,ds,{decisions:decisions(ds),batchId:'example-batch'});
  rs[0].text='Manually corrected wording';
  const restored=validateBackup(JSON.parse(JSON.stringify({format:'care-notes',version:2,records:rs})));
  assert.equal(restored[0].provenance.original,original);
  assert.equal(restored[0].provenance.quote,original);
  assert.ok(summaryText(restored,en).includes(restored[0].id));
  const bad=structuredClone(rs);bad[0].provenance.end--;assert.throws(()=>validateBackup({format:'care-notes',version:2,records:bad}));
  assert.throws(()=>validateBackup({format:'care-notes',version:3,records:rs}));
});
test('language selection supports all six shipped languages with explicit English fallback',()=>{
  assert.deepEqual(LANGUAGES.map(l=>l.code),['zh','en','es','fr','ja','ko']);
  assert.equal(chooseLanguage(['zh-Hans-CN']),'zh');assert.equal(chooseLanguage(['en-GB']),'en');
  assert.equal(chooseLanguage(['es-MX']),'es');assert.equal(chooseLanguage(['fr-FR','zh-CN']),'fr');
  assert.equal(chooseLanguage(['ja-JP']),'ja');assert.equal(chooseLanguage(['ko-KR']),'ko');
  assert.equal(chooseLanguage(['ar']),'en');assert.equal(getLabels('unsupported').capture,en.capture);
});
test('every shipped translation has matching keys and interpolation placeholders',()=>{
  const keys=Object.keys(en).sort();
  for(const language of LANGUAGES){
    assert.deepEqual(Object.keys(language.messages).sort(),keys);
    for(const key of keys){assert.equal(typeof language.messages[key],'string');assert.deepEqual(language.messages[key].match(/\{\w+\}/g)||[],en[key].match(/\{\w+\}/g)||[]);}
  }
  assert.equal(zh.unknown,'来源未确定');
});
test('newly added French Japanese and Korean have localized safety and workflow copy',()=>{
  const sentinels=['welcome','summaryNotice','storageDesc','captureLocalHelp','captureConsent','languageHelp'];
  for(const code of ['fr','ja','ko']){
    const messages=LANGUAGES.find(l=>l.code===code).messages;
    for(const key of sentinels)assert.notEqual(messages[key],en[key],`${code}.${key} unexpectedly fell back to English`);
  }
});
