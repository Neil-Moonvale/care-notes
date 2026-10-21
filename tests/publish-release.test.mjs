import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// Run the actual publishing CLI in an isolated fixture cwd. Every fetch is
// replaced; these tests never read real credentials or contact GitHub.
async function runPublisher(scenario){
 const cwd=await mkdtemp(join(tmpdir(),'care-publish-test-'));
 try{
  await mkdir(join(cwd,'downloads'));await mkdir(join(cwd,'docs/releases'),{recursive:true});
  await writeFile(join(cwd,'package.json'),JSON.stringify({version:'1.2.0'}));
  await writeFile(join(cwd,'downloads/Care-Notes-1.2.0.apk'),'synthetic signed APK bytes');
  await writeFile(join(cwd,'downloads/SHA256SUMS'),'synthetic checksum fixture\n');
  await writeFile(join(cwd,'docs/releases/1.2.0.md'),'Current release notes.\n');
  const child=`
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const scenario=${JSON.stringify(scenario)},trace=[];
const currentSha='a'.repeat(40),originalSha='b'.repeat(40);
const names=['Care-Notes-1.2.0.apk','SHA256SUMS'];
const file=name=>{const bytes=readFileSync('downloads/'+name);return {name,size:bytes.length,digest:'sha256:'+createHash('sha256').update(bytes).digest('hex')};};
const unrelated={id:1,name:'Care-Notes-1.2.0-web.zip',size:123,digest:'sha256:portable-web'};
const release={id:42,tag_name:'v1.2.0',target_commitish:originalSha,draft:false,prerelease:false,body:'Earlier source-only notes.',name:'Source release',html_url:'https://github.com/Neil-Moonvale/care-notes/releases/tag/v1.2.0',assets:[unrelated]};
if(scenario==='matching')release.assets.push(...names.map(file));
if(scenario.startsWith('mismatch:')){const name=scenario.slice(9);release.assets.push({...file(name),digest:'sha256:wrong'});}
globalThis.fetch=async(input,options={})=>{
 const url=new URL(input),method=options.method||'GET';
 const event={method,host:url.host,path:url.pathname};trace.push(event);
 if(!['api.github.com','uploads.github.com'].includes(url.host))throw Error('Unexpected network destination');
 if(method==='GET'&&url.pathname.endsWith('/releases/tags/v1.2.0'))return Response.json(release);
 if(method==='GET'&&url.pathname.endsWith('/releases/42')){
  if(scenario==='refetch-mismatch')return Response.json({...release,assets:release.assets.map(a=>a.name===names[0]?{...a,digest:'sha256:wrong'}:a)});
  return Response.json(release);
 }
 if(method==='POST'&&url.host==='uploads.github.com'&&url.pathname.endsWith('/releases/42/assets')){
  const name=url.searchParams.get('name');event.name=name;
  if(!names.includes(name))throw Error('Unexpected uploaded file');
  const bytes=Buffer.from(options.body),expected=readFileSync('downloads/'+name);
  if(!bytes.equals(expected))throw Error('Uploaded bytes differ');
  const asset={id:release.assets.length+1,...file(name)};release.assets.push(asset);
  return Response.json(scenario==='upload-mismatch'?{...asset,digest:'sha256:wrong'}:asset);
 }
 if(method==='PATCH'&&url.host==='api.github.com'&&url.pathname.endsWith('/releases/42')){
  event.body=JSON.parse(options.body);Object.assign(release,event.body);return Response.json(release);
 }
 throw Error('Unexpected GitHub operation: '+method+' '+url.pathname);
};
try{await import(${JSON.stringify(new URL('../scripts/publish-preview.mjs',import.meta.url).href)});}
catch(error){console.error(error.message);process.exitCode=1;}
finally{writeFileSync('trace.json',JSON.stringify({trace,release,originalSha,currentSha}));}
`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',child],{cwd,encoding:'utf8',env:{...process.env,GITHUB_REPOSITORY:'Neil-Moonvale/care-notes',GITHUB_REF:'refs/heads/main',GITHUB_SHA:'a'.repeat(40),GH_TOKEN:'synthetic-test-only-token'}});
  assert.ifError(result.error);
  return {...result,...JSON.parse(await readFile(join(cwd,'trace.json'),'utf8'))};
 }finally{await rm(cwd,{recursive:true,force:true});}
}

test('a published source release gains only missing signed assets, verifies them, then becomes latest',async()=>{
 const result=await runPublisher('source-only');assert.equal(result.status,0,result.stderr);
 const uploads=result.trace.filter(x=>x.method==='POST');
 assert.deepEqual(uploads.map(x=>x.name),['Care-Notes-1.2.0.apk','SHA256SUMS']);
 assert.ok(uploads.every(x=>x.host==='uploads.github.com'));
 assert.equal(result.release.assets.find(x=>x.name.endsWith('-web.zip')).digest,'sha256:portable-web');
 const patch=result.trace.find(x=>x.method==='PATCH');
 assert.equal(patch.body.make_latest,'true');assert.equal(patch.body.body,'Current release notes.\n');
 assert.equal(patch.body.name,'Care Notes 1.2.0');
 const lastUpload=result.trace.findLastIndex(x=>x.method==='POST'),publish=result.trace.indexOf(patch);
 assert.ok(result.trace.slice(lastUpload+1,publish).some(x=>x.method==='GET'&&x.path.endsWith('/releases/42')),'must re-fetch and verify before publishing metadata');
 assert.equal(result.release.target_commitish,result.originalSha);
 assert.ok(!result.trace.some(x=>x.method!=='GET'&&/git\/(?:refs?|tags)/.test(x.path)));
});

test('an existing mismatched signed APK or checksum fails before uploading or patching anything',async()=>{
 for(const name of ['Care-Notes-1.2.0.apk','SHA256SUMS']){
  const result=await runPublisher('mismatch:'+name);
  assert.notEqual(result.status,0);assert.match(result.stderr,/differ|mismatch|overwrite|replace/i);
  assert.equal(result.trace.filter(x=>x.method!=='GET').length,0,'preflight all existing assets before any mutation');
 }
});

test('rerunning with matching signed assets does not upload or change the source tag',async()=>{
 const result=await runPublisher('matching');assert.equal(result.status,0,result.stderr);
 assert.equal(result.trace.filter(x=>x.method==='POST').length,0);
 assert.equal(result.release.assets.length,3);
 assert.equal(result.release.target_commitish,result.originalSha);
 assert.ok(!result.trace.some(x=>x.method!=='GET'&&/git\/(?:refs?|tags)/.test(x.path)));
});

test('an upload response with the wrong digest prevents further upload or publication',async()=>{
 const result=await runPublisher('upload-mismatch');
 assert.notEqual(result.status,0);assert.match(result.stderr,/Uploaded asset digest mismatch/);
 assert.equal(result.trace.filter(x=>x.method==='POST').length,1);
 assert.equal(result.trace.filter(x=>x.method==='PATCH').length,0);
});

test('fresh release verification rejects a mismatched stored asset before changing metadata',async()=>{
 const result=await runPublisher('refetch-mismatch');
 assert.notEqual(result.status,0);assert.match(result.stderr,/Incomplete release assets/);
 assert.equal(result.trace.filter(x=>x.method==='POST').length,2);
 assert.equal(result.trace.filter(x=>x.method==='PATCH').length,0);
});
