import assert from 'node:assert/strict';
import {CONFIG,distance} from '../dist/game/config.js';
import {ShepherdBoy} from '../dist/game/shepherd.js';
import {Companions} from '../dist/game/companions.js';
import {LodgeVisit} from '../dist/game/lodge.js';
import {drawLodge,drawLodgeInterior} from '../dist/render/lodge.js';
import {MeadowView} from '../dist/orbit.js';

assert.ok(CONFIG.lodge.x+CONFIG.lodge.halfWidth<CONFIG.barn.x-CONFIG.barn.halfWidth,'lodge sits beyond the sheep barn with a clear gap');
assert.ok(CONFIG.lodge.entrance.z<CONFIG.lodge.z,'lodge entrance faces the pasture');
const visit=new LodgeVisit(),visitor={x:0,z:0,tx:0,tz:0};
const walkUntilTransition=()=>{
  for(let i=0;i<2000;i++){
    const dx=visitor.tx-visitor.x,dz=visitor.tz-visitor.z,d=Math.hypot(dx,dz);
    if(d>.01){const step=Math.min(d,.16);visitor.x+=dx/d*step;visitor.z+=dz/d*step;}
    const change=visit.tick(visitor);if(change)return change;
  }
  throw Error('lodge route did not complete');
};
visit.request(visitor);
assert.equal(visit.inside,false,'opening lodge starts a walking trip');
assert.equal(walkUntilTransition(),'entered');
assert.equal(visit.floor,1);
visit.walkTo({x:0,z:7},visitor);
for(let i=0;i<60;i++){const dz=visitor.tz-visitor.z;visitor.z+=Math.sign(dz)*Math.min(Math.abs(dz),.16);visit.tick(visitor);}
assert.ok(visitor.z>5,'visitor can walk through the first-floor room');
visit.requestFloor(2,visitor);
visit.walkTo({x:0,z:8},visitor);
assert.equal(visit.trip,null,'a new walk cancels the pending stair trip');
visit.requestFloor(2,visitor);
assert.equal(walkUntilTransition(),'upstairs');
assert.equal(visit.floor,2);
visit.walkTo({x:-2,z:5},visitor);
for(let i=0;i<50;i++){const dx=visitor.tx-visitor.x,dz=visitor.tz-visitor.z,d=Math.hypot(dx,dz);if(d>.01){visitor.x+=dx/d*Math.min(.16,d);visitor.z+=dz/d*Math.min(.16,d);}visit.tick(visitor);}
assert.ok(visitor.z<9,'visitor can walk on the balcony');
visit.requestExit(visitor);
assert.equal(walkUntilTransition(),'downstairs');
assert.equal(walkUntilTransition(),'exited');
assert.equal(visit.inside,false);
assert.ok(distance(visitor,CONFIG.lodge.entrance)<1,'exit returns beside the real lodge');
const lookout=new MeadowView();lookout.zoom=.65;lookout.yaw=2.5;lookout.pitch=.18;lookout.target={x:-20,z:15};
const eye=lookout.basis(960,640);
assert.ok(distance({x:eye.x,z:eye.z},CONFIG.lodge)<2,'upper-floor view is anchored at the lodge');
const boy=new ShepherdBoy(),companions=new Companions(),player={x:0,z:0};
const sheep=[{id:'sheep-1',x:CONFIG.barn.x,z:CONFIG.barn.z,hiddenInBarn:true}];
for(const a of companions.chickens){a.hiddenInCoop=true;a.state='coop-inside';}
let boyMoved=false,dogMoved=false;
for(let i=0;i<2600;i++){
  const oldBoy={x:boy.x,z:boy.z},oldDogs=companions.dogs.map(a=>({x:a.x,z:a.z}));
  boy.tick(.05,{player,sheep,sheltering:true});
  companions.tick(.05,{player,sheep,yaw:0,sheltering:true,shepherd:boy});
  if(distance(oldBoy,boy)>.001)boyMoved=true;
  assert.ok(distance(oldBoy,boy)<=.05*1.5+.00001,'shepherd walks continuously to lodge');
  companions.dogs.forEach((a,j)=>{if(distance(oldDogs[j],a)>.001)dogMoved=true;assert.ok(distance(oldDogs[j],a)<=.05*2.7+.00001,'dogs walk continuously to lodge');});
  if(boy.insideLodge&&companions.dogs.every(a=>a.hiddenInLodge))break;
}
assert.ok(boyMoved&&dogMoved);
assert.ok(boy.insideLodge,'shepherd enters after the flock rests');
assert.ok(companions.dogs.every(a=>a.hiddenInLodge),'both dogs share the lodge after herding');
assert.ok(distance(boy,CONFIG.lodge.entrance)<.35);
boy.tick(.05,{player,sheep,sheltering:false});
companions.tick(.05,{player,sheep,yaw:0,sheltering:false,shepherd:boy});
assert.equal(boy.insideLodge,false,'shepherd leaves on clearing');
assert.ok(companions.dogs.every(a=>!a.hiddenInLodge),'dogs leave on clearing');
const labels=[];
const ctx=new Proxy({},{get(target,key){if(key==='fillText')return text=>labels.push(String(text));return ()=>{};},set(){return true;}});
const hit=drawLodge(ctx,{x:100,y:100,s:10},{night:true,occupants:3});
assert.ok(hit.w>0&&hit.h>0);
assert.ok(labels.some(text=>text.includes('2층 전망대')));
assert.ok(labels.some(text=>text.includes('쉬는 친구 3')));
const room=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get(target,key){if(key in target)return target[key];if(key==='fillText')return text=>labels.push(String(text));return ()=>{};},set(target,key,value){target[key]=value;return true;}});
const project=(x,z,y=0)=>({x:200+x*12,y:250-z*7-y*15,s:20});
drawLodgeInterior(room,640,400,project,{floor:1});
drawLodgeInterior(room,640,400,project,{floor:2});
assert.ok(labels.some(text=>text.includes('목동 침대'))&&labels.some(text=>text.includes('계단')),'both floors render furniture and stairs');
console.log('Shepherd lodge: walkable entry, both floors, stairs, exit, actual lookout and shared dog rest passed.');
