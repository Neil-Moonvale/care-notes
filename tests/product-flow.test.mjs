import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');
const html=read('index.html'),flow=read('product-flow.js'),css=read('product-flow.css'),sw=read('sw.js');

test('public app loads the explicit reconstruction flow and offline assets',()=>{
 assert.match(html,/product-flow\.js/);assert.match(html,/product-flow\.css/);
 assert.match(sw,/product-flow\.js/);assert.match(sw,/product-flow\.css/);assert.match(sw,/shell-v8/);
});

test('record entry and reconstruction are visibly separate',()=>{
 assert.match(flow,/发生了什么？/);
 assert.match(flow,/开始重建最近几天/);
 assert.match(flow,/这里只负责留下原始观察/);
 assert.match(flow,/data-action='capture'|dataset\.action='capture'/);
 assert.match(flow,/capture\.style\.display='none'/);
 assert.match(flow,/episode-export/);
});

test('reconstruction stays human-triggered and does not change evidence',()=>{
 assert.match(flow,/data-cn-start-reconstruction/);
 assert.match(flow,/sessionStorage/);
 assert.match(flow,/presentation only/);
 assert.doesNotMatch(flow,/\bfetch\s*\(/);
 assert.doesNotMatch(flow,/localStorage\.setItem\([^)]*records/);
});

test('all six shipped interface languages get the new core flow wording',()=>{
 for(const code of ['zh','en','es','fr','ja','ko'])assert.match(flow,new RegExp(`\\b${code}:\\{`));
 assert.match(flow,/What happened\?/);assert.match(flow,/¿Qué pasó\?/);assert.match(flow,/Que s’est-il passé/);assert.match(flow,/何が起きた/);assert.match(flow,/무슨 일이 있었나요/);
});

test('phone layout keeps the reconstruction decision buttons full width',()=>{
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/grid-template-columns:1fr/);
 assert.match(css,/width:100%/);
});
