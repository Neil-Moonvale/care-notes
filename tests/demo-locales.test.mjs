import test from 'node:test';
import assert from 'node:assert/strict';
import {demoKey,localizedDemo,loadLocalizedDemo} from '../dist/demo-locales.js';
import {LANGUAGES} from '../dist/locales.js';
import {helpLabels} from '../dist/help.js';
import {episodeLabels,suggestEpisodeLinks} from '../dist/episode.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const save=(s,lang,rs)=>s.setItem(demoKey(lang),JSON.stringify({format:'care-notes',version:2,records:rs}));
test('each shipped language has localized examples, a guide and matching episode labels',()=>{
 for(const {code} of LANGUAGES){
  const demo=localizedDemo(code);
  assert.equal(demo.length,6);assert.equal(helpLabels[code].steps.length,3);
  assert.deepEqual(Object.keys(episodeLabels[code]).sort(),Object.keys(episodeLabels.en).sort());
  assert.ok(suggestEpisodeLinks(demo).some(s=>s.evidence_ids.includes('demo-food')&&s.evidence_ids.includes('demo-food-self')));
 }
 const zh=localizedDemo('zh'),en=localizedDemo('en'),es=localizedDemo('es'),fr=localizedDemo('fr'),ja=localizedDemo('ja'),ko=localizedDemo('ko');
 assert.match(zh[0].text,/昨晚/);
 assert.match(en[0].text,/last night/i);
 assert.match(es[0].text,/Anoche/);assert.equal(es[0].when,'Anoche');
 assert.match(fr[0].text,/La nuit dernière/);assert.equal(fr[0].when,'La nuit dernière');
 assert.match(ja[0].text,/昨夜/);assert.equal(ja[0].when,'昨夜');
 assert.match(ko[0].text,/어젯밤/);assert.equal(ko[0].when,'어젯밤');
});
test('switching languages keeps edited demos separate and never changes personal data',()=>{
 const s=storage();s.setItem('care-notes.records.v1','personal original');
 const zh=localizedDemo('zh');zh[0].text='我修改了中文示例';save(s,'zh',zh);
 const en=loadLocalizedDemo(s,'en');assert.match(en[0].text,/last night/i);
 en[0].text='Edited English account';save(s,'en',en);
 assert.equal(loadLocalizedDemo(s,'zh')[0].text,zh[0].text);
 assert.equal(loadLocalizedDemo(s,'en')[0].text,en[0].text);
 assert.match(loadLocalizedDemo(s,'es')[0].text,/Anoche/);
 assert.match(loadLocalizedDemo(s,'fr')[0].text,/La nuit dernière/);
 assert.match(loadLocalizedDemo(s,'ja')[0].text,/昨夜/);
 assert.match(loadLocalizedDemo(s,'ko')[0].text,/어젯밤/);
 assert.equal(s.getItem('care-notes.records.v1'),'personal original');
});
test('legacy Chinese demo remains recoverable while English gets English examples',()=>{
 const s=storage(),rs=localizedDemo('zh');rs[0].text='旧的修改仍要保留';
 s.setItem('care-notes.demo.v1',JSON.stringify({format:'care-notes',version:2,records:rs}));
 assert.equal(loadLocalizedDemo(s,'zh')[0].text,rs[0].text);
 assert.match(loadLocalizedDemo(s,'en')[0].text,/last night/i);
 assert.ok(s.getItem('care-notes.demo.v1'));
});
test('an intentionally empty demo stays empty and invalid persisted records fail validation',()=>{
 const s=storage();save(s,'es',[]);assert.deepEqual(loadLocalizedDemo(s,'es'),[]);
 s.setItem(demoKey('en'),'broken');assert.throws(()=>loadLocalizedDemo(s,'en'));
});
