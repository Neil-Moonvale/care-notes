import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const dist=new URL('../dist/',import.meta.url);
const read=path=>readFileSync(new URL(path,dist),'utf8');
test('both entry pages and their imported modules exist and are included in the offline shell',()=>{
  const sw=read('sw.js');
  const cacheFiles=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
  const visited=new Set();
  function visit(path){
    if(visited.has(path))return;visited.add(path);
    assert.ok(existsSync(new URL(path,dist)),`missing ${path}`);
    assert.ok(cacheFiles.includes(path),`not cached: ${path}`);
    const body=read(path);
    const regex=path.endsWith('.html')?/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g:/\bfrom\s*['"]\.\/([^'"]+)['"]/g;
    if(!/\.(html|js)$/.test(path))return;
    for(const match of body.matchAll(regex))visit(match[1]);
  }
  visit('index.html');visit('reconstruction.html');
  assert.ok(!cacheFiles.some(x=>x.startsWith('api/')));
});
