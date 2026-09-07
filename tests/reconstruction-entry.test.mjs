import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');
const html=read('index.html'),ui=read('reconstruction-ui.js'),css=read('reconstruction-ui.css'),sw=read('sw.js');

test('demo loads an explicit reconstruction entry layer',()=>{
 assert.match(html,/reconstruction-ui\.css/);
 assert.match(html,/reconstruction-ui\.js/);
 assert.doesNotMatch(html,/product-flow\.js/);
 assert.match(ui,/开始重建最近几天/);
 assert.match(ui,/data-cn-start-reconstruction/);
 assert.match(ui,/navReconstruct:'重建'/);
 assert.match(ui,/navRecords:'记录'/);
});

test('reconstruction starts from existing records rather than another capture form',()=>{
 assert.match(ui,/不要再写一遍/);
 assert.match(ui,/recordCount\(\)/);
 assert.match(ui,/setHidden\(capture,true\)/);
 assert.doesNotMatch(ui,/\bfetch\s*\(/);
});

test('offline shell caches the reconstruction entry assets',()=>{
 assert.match(sw,/care-notes-shell-v9/);
 assert.match(sw,/reconstruction-ui\.css/);
 assert.match(sw,/reconstruction-ui\.js/);
 assert.match(css,/\.reconstruction-start/);
});
