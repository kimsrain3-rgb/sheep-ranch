import assert from 'node:assert/strict';
import {Companions} from '../dist/game/companions.js';
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

const leader=new ShepherdBoy(),companions=new Companions(),owner={x:55,z:100};
const escort=companions.dogs.find(a=>a.role==='escort');assert.ok(escort);assert.equal(companions.dogs.length,2);
let maximumGap=0,herded=false;
for(let i=0;i<6000;i++){
  const wet=i>3000,old={x:escort.x,z:escort.z};
  leader.tick(.05,{player:owner,sheep,sheltering:wet});
  companions.tick(.05,{player:owner,sheep,yaw:i*.001,sheltering:wet,shepherd:leader});
  assert.ok(distance(old,escort)<=.05*2.7+.00001,'escort walks instead of teleporting');
  assert.notEqual(escort.state,'herd','escort stays assigned to boy in rain');
  maximumGap=Math.max(maximumGap,distance(escort,leader));
  if(companions.dogs[0].state==='herd')herded=true;
}
assert.ok(maximumGap<5,`escort remains near boy through patrol and shelter trip: ${maximumGap}`);
assert.ok(distance(escort,leader)<3);assert.equal(escort.state,'rest');assert.ok(distance(escort,owner)>50,'never follows the owner instead');
console.log('One escort dog stays near the boy in dry and wet weather, walks continuously and rests nearby; second dog remains independent.');
