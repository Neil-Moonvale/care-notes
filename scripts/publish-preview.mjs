// Runs only in this repository's publishing workflow, using its temporary token.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const repo='Neil-Moonvale/care-notes';
if(process.env.GITHUB_REPOSITORY!==repo || process.env.GITHUB_REF!=='refs/heads/feature/evidence-revision-core')throw Error('Unexpected publishing repository or branch');
const sha=process.env.GITHUB_SHA,token=process.env.GH_TOKEN;
if(!/^[a-f0-9]{40}$/.test(sha||'')||!token)throw Error('Missing publishing context');
const {version}=JSON.parse(await readFile('package.json','utf8'));
if(!/^\d+\.\d+\.\d+-rc\.\d+$/.test(version))throw Error('This workflow only publishes release candidates');
const tag=`v${version}`;
const files=await Promise.all([`Care-Notes-${version}.apk`,'SHA256SUMS'].map(async name=>{
  const bytes=await readFile(`downloads/${name}`);
  return {name,bytes,digest:`sha256:${createHash('sha256').update(bytes).digest('hex')}`};
}));
const notes=await readFile(`docs/releases/${version}.md`,'utf8');
async function request(path,{method='GET',data,missing=false}={}){
  const response=await fetch(`https://api.github.com/repos/${repo}/${path}`,{
    method,redirect:'error',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
    ...(data===undefined?{}:{body:JSON.stringify(data)})});
  if(response.status===404&&missing)return null;
  if(!response.ok)throw Error(`GitHub ${method} ${path}: ${response.status}`);
  return response.json();
}
function matches(asset,file){return asset?.name===file.name&&asset.size===file.bytes.length&&asset.digest===file.digest;}
let release=await request(`releases/tags/${tag}`,{missing:true});
if(release&&!release.draft){
  if(!files.every(file=>matches(release.assets.find(a=>a.name===file.name),file)))throw Error('Published assets differ; refusing to replace a release');
  if(release.body!==notes)release=await request(`releases/${release.id}`,{method:'PATCH',data:{body:notes}});
  console.log(JSON.stringify({status:'already_published',url:release.html_url}));
}else{
  if(release&&release.target_commitish!==sha)throw Error('Draft targets a different source commit; manual review required');
  if(!release){
    const existingTag=await request(`git/ref/tags/${tag}`,{missing:true});
    if(existingTag&&existingTag.object.sha!==sha)throw Error('Tag already targets different source; refusing to move it');
    release=await request('releases',{method:'POST',data:{tag_name:tag,target_commitish:sha,name:`Care Notes ${version}`,body:notes,draft:true,prerelease:true,make_latest:'false'}});
  }
  for(const file of files){
    const existing=release.assets.find(a=>a.name===file.name);
    if(existing){if(!matches(existing,file))throw Error('Draft asset differs; refusing to overwrite');continue;}
    const url=new URL(`https://uploads.github.com/repos/${repo}/releases/${release.id}/assets`);url.searchParams.set('name',file.name);
    const response=await fetch(url,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/octet-stream'},body:file.bytes});
    if(!response.ok)throw Error(`Asset upload: ${response.status}`);
    if(!matches(await response.json(),file))throw Error('Uploaded asset digest mismatch');
  }
  release=await request(`releases/${release.id}`);
  if(!files.every(file=>matches(release.assets.find(a=>a.name===file.name),file)))throw Error('Incomplete release assets');
  release=await request(`releases/${release.id}`,{method:'PATCH',data:{draft:false,prerelease:true,make_latest:'false'}});
  console.log(JSON.stringify({status:'published',url:release.html_url}));
}
