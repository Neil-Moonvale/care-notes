import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const executable=fileURLToPath(new URL('../node_modules/.bin/workerd',import.meta.url));
const result=spawnSync(executable,['test','tests/worker-runtime/test.capnp'],{cwd:root,stdio:'inherit',timeout:30000});
if(result.error)throw result.error;
process.exit(result.status??1);
