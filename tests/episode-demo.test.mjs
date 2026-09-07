import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../dist/episode-demo.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../dist/episode-demo.css',import.meta.url),'utf8');
const a11y=fs.readFileSync(new URL('../dist/episode-demo-a11y.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../dist/episode-demo.js',import.meta.url),'utf8');

test('episode demo declares a mobile viewport and semantic main content',()=>{
  assert.match(html,/name="viewport"[^>]+viewport-fit=cover/);
  assert.match(html,/<main>/);
  assert.match(html,/<section class="episodes-section">/);
  assert.match(html,/<section class="evidence-section">/);
});

test('interactive controls are native buttons with explicit button type',()=>{
  assert.match(html,/id="langButton"[^>]+type="button"/);
  assert.match(html,/id="clearFocus"[^>]+type="button"/);
  assert.match(js,/class="evidence-chip" type="button"/);
});

test('mobile CSS has narrow-screen layout and small-screen guard',()=>{
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(max-width:390px\)/);
});

test('demo includes reduced-motion and forced-color fallbacks',()=>{
  assert.match(a11y,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(a11y,/@media\(forced-colors:active\)/);
});

test('demo exposes data gaps, evidence graph relations and raw provenance',()=>{
  assert.match(html,/id="sourceGaps"/);
  assert.match(js,/same_episode/);
  assert.match(js,/raw_reference/);
  assert.match(js,/sourceGapEvents/);
});
