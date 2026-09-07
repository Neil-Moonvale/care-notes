import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {suggestEpisodeLinks,reconstructEpisode} from '../dist/episode.js';
import {validateBackup} from '../dist/core.js';

const fixture=JSON.parse(fs.readFileSync(new URL('../examples/fictional-phone-only-case.json',import.meta.url),'utf8'));
const records=validateBackup({format:'care-notes',version:2,records:fixture.records});
const pairKey=ids=>[...ids].sort().join('|');

test('phone-only fixture produces only the expected conservative review candidates',()=>{
 const suggestions=suggestEpisodeLinks(records);
 const actual=new Set(suggestions.map(s=>pairKey(s.evidence_ids)));
 const expected=new Set(fixture.expected_candidate_pairs.map(pairKey));
 assert.deepEqual([...actual].sort(),[...expected].sort());
 for(const pair of fixture.expected_non_candidate_pairs)assert.equal(actual.has(pairKey(pair)),false);
});

test('fixture suggestions remain review questions rather than merged events',()=>{
 const result=reconstructEpisode(records);
 assert.equal(result.events.length,records.length);
 assert.equal(result.suggestions.length,fixture.expected_candidate_pairs.length);
 for(const s of result.suggestions){
  assert.equal(s.requires_human_review,true);
  assert.equal(s.relation,'same_episode_candidate');
  assert.ok(result.questions.some(q=>q.kind==='possibleSameEpisode'&&q.suggestion_id===s.suggestion_id));
 }
});

test('unknown and uncertain fixture records remain explicit',()=>{
 const result=reconstructEpisode(records);
 assert.ok(result.questions.some(q=>q.kind==='date'&&q.refs.includes('fx-undated')));
 assert.ok(result.questions.some(q=>q.kind==='medication'&&q.refs.includes('fx-med-family')));
 assert.ok(result.questions.some(q=>q.kind==='uncertainty'&&q.refs.includes('fx-food-self')));
});
