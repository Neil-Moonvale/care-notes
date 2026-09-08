import {build} from 'esbuild';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {extname,join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),publicDir=join(root,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const assets={};
for(const file of await readdir(publicDir,{withFileTypes:true})){
  if(!file.isFile()||!types[extname(file.name)])continue;
  assets['/'+file.name]={content:await readFile(join(publicDir,file.name),'utf8'),type:types[extname(file.name)]};
}
if(!assets['/index.html']||!assets['/reconstruction.html'])throw Error('Missing entry page');
await mkdir(join(publicDir,'server'),{recursive:true});
await build({entryPoints:[join(root,'worker/index.js')],outfile:join(publicDir,'server/index.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',legalComments:'none',plugins:[{name:'care-notes-assets',setup(b){b.onResolve({filter:/^care-notes:assets$/},()=>({path:'assets',namespace:'care-notes'}));b.onLoad({filter:/.*/,namespace:'care-notes'},()=>({contents:'export default '+JSON.stringify(assets),loader:'js'}));}}]});
let manifest={};try{manifest=JSON.parse(await readFile(join(root,'.openai/hosting.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}delete manifest.static;
await mkdir(join(publicDir,'.openai'),{recursive:true});
await writeFile(join(publicDir,'.openai/hosting.json'),JSON.stringify(manifest)+'\n');
console.log(`Built Worker with ${Object.keys(assets).length} public assets.`);
