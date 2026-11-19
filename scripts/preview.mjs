import {previewNotebook} from './preview-notebook.mjs';
const DB=previewNotebook(process.env.HARU_DATA_DIR);
import http from 'node:http';import {readFile} from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {handleShepherd} from '../server/shepherd-api.js';import {serveAsset} from '../server/static-response.js';
const dist=path.resolve('dist'),mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.mp3':'audio/mpeg','.png':'image/png'};
http.createServer(async(req,res)=>{try{
 const origin=`http://${req.headers.host}`,url=new URL(req.url,origin),chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>12000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
 const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});let response;
 if(url.pathname.startsWith('/api/')){
   const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
   response=await handleShepherd(request,{OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL,DB,localOperator:local});
 }
 else{const name=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1),file=path.resolve(dist,name);if(!file.startsWith(dist+path.sep)||name.startsWith('server/')||name.startsWith('.openai/'))throw Error('not found');const data=await readFile(file);response=serveAsset(request,{data,type:mime[path.extname(file)]||'application/octet-stream',etag:'"'+createHash('sha256').update(data).digest('hex')+'"'});}
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('Meadow Worker preview ready'));
