import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');
const html=read('index.html'),flow=read('reconstruction-ui.js'),css=read('reconstruction-ui.css'),sw=read('sw.js');

test('public app loads the explicit reconstruction flow and offline assets',()=>{
 assert.match(html,/reconstruction-ui\.js/);assert.match(html,/reconstruction-ui\.css/);
 assert.match(sw,/reconstruction-ui\.js/);assert.match(sw,/reconstruction-ui\.css/);assert.match(sw,/shell-v9/);
});

test('record entry and reconstruction are visibly separate',()=>{
 assert.match(flow,/发生了什么？/);
 assert.match(flow,/开始重建最近几天/);
 assert.match(flow,/navRecords:'记录'/);
 assert.match(flow,/setHidden\(capture,true\)/);
 assert.match(flow,/episode-export|actions/);
});

test('reconstruction stays human-triggered and does not change evidence',()=>{
 assert.match(flow,/data-cn-start-reconstruction/);
 assert.match(flow,/started=false/);
 assert.doesNotMatch(flow,/\bfetch\s*\(/);
 assert.doesNotMatch(flow,/localStorage\.setItem/);
});

test('all six shipped interface languages get the new core flow wording',()=>{
 for(const code of ['zh','en','es','fr','ja','ko'])assert.match(flow,new RegExp(`\\b${code}:\\{`));
 assert.match(flow,/What happened\?/);assert.match(flow,/¿Qué pasó\?/);assert.match(flow,/Que s’est-il passé/);assert.match(flow,/何が起きた/);assert.match(flow,/무슨 일이 있었나요/);
});

test('phone layout keeps the reconstruction primary action full width',()=>{
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/\.reconstruction-start\{width:100%\}/);
});
