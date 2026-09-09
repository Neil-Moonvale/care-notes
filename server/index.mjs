import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiHandler } from './ai.js';
import {createMobileApi} from './mobile-api.js';

// Personal local deployment only. Public hosting needs authentication and per-user limits.
const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const api = createApiHandler({env:process.env});
const mobileApi=createMobileApi();
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
createServer(async (req,res) => {
  try {
    const host = req.headers.host;
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(host)) { res.writeHead(403); res.end(); return; }
    const url = new URL(req.url, `http://${host}`);
    if (url.pathname.startsWith('/api/')) {
      const init = {method:req.method,headers:req.headers};
      if (!['GET','HEAD'].includes(req.method)) { init.body = req; init.duplex = 'half'; }
      const reply = await (url.pathname.startsWith('/api/mobile/')?mobileApi:api)(new Request(url,init));
      res.writeHead(reply.status,Object.fromEntries(reply.headers)); res.end(Buffer.from(await reply.arrayBuffer())); return;
    }
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) {res.writeHead(403);res.end();return;}
    try { const data = await readFile(path); res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data); }
    catch {res.writeHead(404);res.end('Not found');}
  } catch { if (!res.headersSent) res.writeHead(400); res.end('Invalid request'); }
}).listen(port,'127.0.0.1',() => console.log(`Care Notes: http://127.0.0.1:${port} (local access only)`));
