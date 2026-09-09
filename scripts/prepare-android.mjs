import {readdir,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const target=join(root,'android/app/src/main/assets');
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
const allowed=new Set(['.html','.js','.css','.svg','.webmanifest']);
let count=0;
for(const entry of await readdir(join(root,'dist'),{withFileTypes:true})){
  if(!entry.isFile()||!allowed.has(extname(entry.name))||entry.name==='sw.js')continue;
  await writeFile(join(target,entry.name),await readFile(join(root,'dist',entry.name)));count++;
}
console.log(`Prepared ${count} bundled public assets. No server sources or hosting credentials included.`);
