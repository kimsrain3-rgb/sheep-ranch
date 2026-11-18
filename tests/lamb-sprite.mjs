import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LAMB_SPRITE} from '../dist/assets/sheep/lamb/lamb-sprite.js';
import {Flock} from '../dist/game/flock.js';

for(const part of LAMB_SPRITE.parts){
  const png=await readFile(new URL(`../dist/assets/sheep/lamb/${part.name}.png`,import.meta.url));
  assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),part.width,'cropped part width matches its drawing placement');
  assert.equal(png.readUInt32BE(20),part.height);
  assert.ok(part.x>=0&&part.y>=0&&part.x+part.width<=LAMB_SPRITE.width&&part.y+part.height<=LAMB_SPRITE.height);
}
const images=[];
globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=768;images.push(this);}};
try{
  const {drawSheep}=await import('../dist/render/sheep.js');
  const f=new Flock(undefined,{adults:45,lambs:12}),lamb=f.lambs[0];
  assert.equal(f.animals.length,57);assert.equal(lamb.size,lamb.mother.size/3);
  const trace={draws:[],rotations:[],eyelids:0,saves:0};
  const c=new Proxy({},{set(t,key,value){t[key]=value;return true;},get(t,key){
    if(key in t)return t[key];
    if(key==='save')return ()=>trace.saves++;
    if(key==='restore')return ()=>trace.saves--;
    if(key==='drawImage')return image=>trace.draws.push(image.src);
    if(key==='rotate')return angle=>trace.rotations.push(angle);
    if(key==='ellipse')return ()=>{if(t.fillStyle==='#664944')trace.eyelids++;};
    return ()=>{};
  }});
  const options={project:()=>({x:200,y:300,s:90}),time:.6,width:900,height:755,player:{x:0,z:0}};
  Object.assign(lamb,{phase:2,state:'roam',walking:true,careContact:false});
  drawSheep(c,lamb,options);
  assert.equal(trace.draws.length,6);
  assert.ok(trace.draws.every(url=>url.includes('/assets/sheep/lamb/')),'all six parts use the supplied lamb, not adult artwork');
  assert.ok(trace.rotations[0]*trace.rotations[1]<0,'legs alternate during walking');
  assert.equal(trace.eyelids,0);assert.equal(trace.saves,0);
  const first=trace.rotations.slice();trace.rotations=[];
  drawSheep(c,lamb,{...options,time:.8});
  assert.notDeepEqual(trace.rotations,first,'head and legs animate over time');
  Object.assign(lamb,{state:'milk',careContact:true,walking:false});
  drawSheep(c,lamb,options);assert.equal(trace.eyelids,2,'eyes close on actual care contact');
  assert.equal(trace.saves,0);
  lamb.hiddenInBarn=true;trace.draws=[];drawSheep(c,lamb,options);assert.equal(trace.draws.length,0);
}finally{delete globalThis.Image;}
console.log('Layered lamb: six valid cropped assets, original baby art, animated parts, care eyes, hidden shelter and mother-size ratio passed.');
