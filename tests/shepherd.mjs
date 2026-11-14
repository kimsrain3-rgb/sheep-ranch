import assert from 'node:assert/strict';
import {ShepherdBoy} from '../dist/game/shepherd.js';
import {CONFIG,distance} from '../dist/game/config.js';
import {drawShepherdBoy} from '../dist/render/shepherd.js';
const boy=new ShepherdBoy(),player={x:0,z:0},sheep=[{x:4,z:8,state:'pet',lock:'pet'},{x:6,z:15,state:'roam'}],before=JSON.stringify(sheep);
const initial={x:boy.x,z:boy.z};boy.tick(1,{player,sheep});assert.equal(boy.state,'greet');assert.equal(boy.x,initial.x);
let moved=false;
for(let i=0;i<4000;i++){
 const a={x:boy.x,z:boy.z};boy.tick(.05,{player,sheep});const step=distance(a,boy);assert.ok(step<=.05*.95+.000001);if(step>.001)moved=true;
 assert.ok(Math.hypot((boy.x-CONFIG.pond.x)/CONFIG.pond.rx,(boy.z-CONFIG.pond.z)/CONFIG.pond.rz)>=1.05);
}
assert.ok(moved);assert.equal(JSON.stringify(sheep),before,'NPC never changes sheep care or positions');
boy.tick(.05,{player,sheep,sheltering:true});const a={x:boy.x,z:boy.z};boy.greet(player);assert.equal(boy.x,a.x);assert.equal(boy.z,a.z);
for(let i=0;i<1600;i++)boy.tick(.05,{player,sheep,sheltering:true});
assert.ok(distance(boy,{x:CONFIG.barn.entrance.x+3,z:CONFIG.barn.entrance.z-1})<.3,'resumes walk to shelter after greeting in wet weather');
let saves=0;const ctx=new Proxy({},{get(target,key){if(key==='save')return ()=>saves++;if(key==='restore')return ()=>saves--;return ()=>{};},set(){return true;}});
for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]])for(const yaw of [0,Math.PI/2,Math.PI]){
 boy.headingX=x;boy.headingZ=z;drawShepherdBoy(ctx,{x:100,y:200,s:35},boy,yaw);assert.ok(boy.screen.w>0);assert.equal(saves,0);
}
drawShepherdBoy(ctx,null,boy);assert.equal(boy.screen,null);
console.log('Shepherd boy: continuous dry patrol, no sheep mutations, wet-weather resume after greeting, four camera-relative facings and balanced canvas state passed.');
