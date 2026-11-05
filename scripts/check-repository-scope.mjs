// Keep this repository limited to Care Notes. Deliberate new top-level areas
// must update this small allowlist in the same reviewed change.
import {execFileSync} from 'node:child_process';
const directories=new Set(['.github','.openai','android','dist','docs','downloads','examples','scripts','server','tests','worker']);
const files=new Set(['.env.example','.gitignore','CHANGELOG.md','CONTRIBUTING.md','LICENSE','README.md','SECURITY.md','package.json','package-lock.json']);
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const rejected=paths.filter(p=>{
  const parts=p.split('/');
  return !(parts.length===1?files.has(p):directories.has(parts[0]))||/\.(?:jks|keystore|pem|p12)$/i.test(p)||/(?:^|\/)\.env(?:\.|$)/.test(p)&&p!=='.env.example';
});
if(rejected.length){console.error('Files outside the project scope or private signing/configuration files:',...rejected);process.exitCode=1;}
else console.log(`Repository scope checked: ${paths.length} project files.`);
