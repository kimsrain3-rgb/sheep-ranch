import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist'),files={};
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(['server','.openai'].includes(entry.name))continue;const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else{const data=await readFile(file);files['/'+path.relative(dist,file).replaceAll('\\','/')]={base64:data.toString('base64'),type:mime[path.extname(file)]||'application/octet-stream',etag:'"'+createHash('sha256').update(data).digest('hex')+'"'};}}}
await walk(dist);
const api=await readFile(path.join(root,'server/shepherd-api.js'),'utf8'),assets=await readFile(path.join(root,'server/static-response.js'),'utf8');
const worker=`${api}\n${assets}\nconst ASSETS=${JSON.stringify(files)};\nconst decoded=new Map();\nexport default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return handleShepherd(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});let name;try{name=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}const key=name==='/'?'/index.html':name,asset=ASSETS[key];if(!asset)return new Response('Not found',{status:404});if(!decoded.has(key))decoded.set(key,Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0)));return serveAsset(request,{...asset,data:decoded.get(key)});}};\n`;
await mkdir(path.join(dist,'server'),{recursive:true});await mkdir(path.join(dist,'.openai'),{recursive:true});await writeFile(path.join(dist,'server/index.js'),worker);await writeFile(path.join(dist,'.openai/hosting.json'),await readFile(path.join(root,'.openai/hosting.json')));
console.log(`Worker built with ${Object.keys(files).length} game assets (${worker.length} bytes).`);
