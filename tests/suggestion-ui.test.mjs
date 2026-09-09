import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');
const html=read('records.html'),ui=read('suggestion-ui.js'),css=read('suggestion-ui.css'),sw=read('sw.js');

test('retained records app loads the review candidate enhancement, phone styles and all locale files offline',()=>{
 assert.match(html,/suggestion-ui\.js/);
 assert.match(html,/suggestion-ui\.css/);
 assert.match(sw,/suggestion-ui\.js/);
 assert.match(sw,/suggestion-ui\.css/);
 for(const file of ['es.js','fr.js','ja.js','ko.js'])assert.match(sw,new RegExp(file.replace('.','\\.')));
 assert.match(css,/@media\(max-width:640px\)/);
});

test('candidate UI has explicit accept and reject controls and never uses a network request',()=>{
 assert.match(ui,/dataset\.cnSuggestionAccept/);
 assert.match(ui,/dataset\.cnSuggestionReject/);
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

test('candidate wording says review is required and automatic merging is not claimed in six languages',()=>{
 assert.match(ui,/不会自动合并/);
 assert.match(ui,/never merges records automatically/);
 assert.match(ui,/Nunca combina registros automáticamente/i);
 assert.match(ui,/jamais fusionnées automatiquement/);
 assert.match(ui,/自動で記録を統合/);
 assert.match(ui,/자동으로 합치지/);
});

test('skip link is localized for the added languages',()=>{
 assert.match(ui,/Aller au contenu/);
 assert.match(ui,/本文へ移動/);
 assert.match(ui,/본문으로 이동/);
});
