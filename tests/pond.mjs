import assert from 'node:assert/strict';
import {CONFIG,pondPoint,pondLevel,keepDry} from '../dist/game/config.js';
import {Flock} from '../dist/game/flock.js';
import {MeadowView} from '../dist/orbit.js';
import {dryRoute} from '../dist/game/navigation.js';
import {drawPond,clipPondPolygon} from '../dist/render/pond.js';
assert.equal(CONFIG.playerBounds.maxX-CONFIG.playerBounds.minX,220);
assert.equal(CONFIG.playerBounds.maxZ-CONFIG.playerBounds.minZ,400);
assert.equal(CONFIG.bounds.maxX-CONFIG.bounds.minX,300);
assert.equal(CONFIG.bounds.maxZ-CONFIG.bounds.minZ,450);
const radius=pondLevel;
const outline=Array.from({length:192},(_,i)=>pondPoint(i/192*Math.PI*2));
const area=Math.abs(outline.reduce((sum,a,i)=>{const b=outline[(i+1)%outline.length];return sum+a.x*b.z-b.x*a.z;},0))/2;
assert.ok(Math.abs(CONFIG.pond.rx*CONFIG.pond.rz/(19*11)-2)<1e-10,'lake area doubles without changing its shoreline shape');
assert.ok(area>1000,'natural lake keeps a generous water surface');
const radial=outline.map(point=>Math.hypot((point.x-CONFIG.pond.x)/CONFIG.pond.rx,(point.z-CONFIG.pond.z)/CONFIG.pond.rz));
assert.ok(Math.max(...radial)-Math.min(...radial)>.2,'shore includes a natural asymmetric inlet');
const open=CONFIG.pond.openWater;
for(let i=0;i<64;i++){
 const a=i/64*Math.PI*2;
 assert.ok(pondLevel({x:open.x+Math.cos(a)*open.rx,z:open.z+Math.sin(a)*open.rz})<.85,'future water birds have clear central water');
 const point=pondPoint(a,.98);keepDry(point);assert.ok(pondLevel(point)>=1.059999,'collision follows the actual curved shore');
}
for(const [from,to] of [[{x:-64,z:-9},{x:8,z:-9}],[{x:-25,z:-32},{x:-25,z:14}]]){
 const route=dryRoute(from,to);let previous=from;
 for(const waypoint of route){
  for(let i=0;i<=100;i++)assert.ok(pondLevel({x:previous.x+(waypoint.x-previous.x)*i/100,z:previous.z+(waypoint.z-previous.z)*i/100})>=1.05,'routes stay outside the natural shoreline');
  previous=waypoint;
 }
}
assert.ok(CONFIG.drinkingSpots.every(spot=>radius(spot)>=1.06&&radius(spot)<1.1),'drinking places follow the expanded bank');
assert.ok(new Flock().animals.every(animal=>radius(animal)>=1.06),'animals start on dry ground');
for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const at of [{x:0,z:0},{x:CONFIG.pond.x,z:CONFIG.pond.z}]){
 const view=new MeadowView();view.yaw=yaw;view.target=at;view.zoom=1.65;
 const W=900,H=755,basis=view.basis(W,H),project=(x,z,y=0)=>view.project(x,z,y,W,H);
 let saves=0,fills=0;
 const c=new Proxy({},{set(t,key,value){t[key]=value;return true;},get(t,key){
   if(key==='save')return ()=>saves++;
   if(key==='restore')return ()=>saves--;
   if(key==='fill')return ()=>fills++;
   if(['moveTo','lineTo','quadraticCurveTo','ellipse','translate','scale'].includes(key))return (...values)=>assert.ok(values.every(v=>typeof v!=='number'||Number.isFinite(v)),'projected scenery coordinates stay finite');
   return ()=>{};
 }});
 drawPond(c,project,1.2,{},basis);assert.equal(saves,0);assert.ok(fills>5,'pond and plants render at every camera angle');
 const polygon=[[-40,-30,.04],[-40,20,.04],[10,20,.04],[10,-30,.04]];
 const clipped=clipPondPolygon(polygon,basis);
 assert.ok(clipped.every(([x,z,y])=>project(x,z,y)),'near-plane clipping preserves visible bank portions');
}
console.log('Expanded meadow and natural lake: doubled boundaries, curved-shore collision, clear bird habitat, dry routes, drinking places, all-angle rendering and clipping passed.');
