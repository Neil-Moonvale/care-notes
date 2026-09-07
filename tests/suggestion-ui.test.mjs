import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');
const html=read('index.html'),ui=read('suggestion-ui.js'),css=read('suggestion-ui.css'),sw=read('sw.js');

test('main app loads the review candidate enhancement and phone styles',()=>{
 assert.match(html,/suggestion-ui\.js/);
 assert.match(html,/suggestion-ui\.css/);
 assert.match(sw,/suggestion-ui\.js/);
 assert.match(sw,/suggestion-ui\.css/);
 assert.match(css,/@media\(max-width:640px\)/);
});

test('candidate UI has explicit accept and reject controls and never uses a network request',()=>{
 assert.match(ui,/data\.cnSuggestionAccept/);
 assert.match(ui,/data\.cnSuggestionReject/);
 assert.match(ui,/accept\.type='button'/);
 assert.match(ui,/reject\.type='button'/);
 assert.doesNotMatch(ui,/\bfetch\s*\(/);
 assert.doesNotMatch(ui,/XMLHttpRequest/);
});

test('accept links existing records while reject only stores the local review choice',()=>{
 const accept=ui.match(/function acceptSuggestion[\s\S]*?\n}\nfunction rejectSuggestion/)?.[0]||'';
 const reject=ui.match(/function rejectSuggestion[\s\S]*?\n}\n\nlet queued/)?.[0]||'';
 assert.match(accept,/linkRecords\(/);
 assert.match(accept,/saveRecords\(/);
 assert.match(reject,/saveRejected\(/);
 assert.doesNotMatch(reject,/saveRecords\(/);
 assert.match(ui,/rejected-suggestions\.v1/);
});

test('candidate wording says review is required and automatic merging is not claimed',()=>{
 assert.match(ui,/不会自动合并/);
 assert.match(ui,/never merges records automatically/);
 assert.match(ui,/nunca combina registros automáticamente/);
});
