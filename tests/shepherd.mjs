import assert from 'node:assert/strict';
import {Companions} from '../dist/game/companions.js';
import {ShepherdBoy} from '../dist/game/shepherd.js';
import {CONFIG,distance,keepDry,pondLevel} from '../dist/game/config.js';
import {drawShepherdBoy} from '../dist/render/shepherd.js';
const boy=new ShepherdBoy(),player={x:0,z:0},sheep=[{x:4,z:8,state:'pet',lock:'pet'},{x:6,z:15,state:'roam'}],before=JSON.stringify(sheep);
const initial={x:boy.x,z:boy.z};boy.tick(1,{player,sheep});assert.equal(boy.state,'greet');assert.equal(boy.x,initial.x);
let moved=false;
for(let i=0;i<4000;i++){
 const a={x:boy.x,z:boy.z};boy.tick(.05,{player,sheep});const step=distance(a,boy);assert.ok(step<=.05*.95+.000001);if(step>.001)moved=true;
 assert.ok(pondLevel(boy)>=1.05);
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
let dryMaximumGap=0,chickenHerded=false;
for(let i=0;i<6000;i++){
  const wet=i>3000,old={x:escort.x,z:escort.z};
  leader.tick(.05,{player:owner,sheep,sheltering:wet});
  companions.tick(.05,{player:owner,sheep,yaw:i*.001,sheltering:wet,shepherd:leader});
  assert.ok(distance(old,escort)<=.05*2.7+.00001,'escort walks instead of teleporting');
  if(!wet)dryMaximumGap=Math.max(dryMaximumGap,distance(escort,leader));
  if(escort.state==='herd-chicken')chickenHerded=true;
}
assert.ok(dryMaximumGap<5,`escort remains near boy on dry patrol: ${dryMaximumGap}`);
assert.ok(chickenHerded,'escort dog helps move chickens during sheltering');
assert.equal(companions.coopInside,CONFIG.chickens,'all chickens reach their coop');
assert.ok(distance(escort,leader)<3);assert.equal(escort.state,'rest');assert.ok(distance(escort,owner)>50,'never follows the owner instead');
console.log('Escort dog follows the boy in dry weather, herds chickens into their coop, then returns to the boy.');

// The UI may open only after continuous movement to the waiting NPC.
function approach(npc,visitor,indoors=false){
  const initial={x:visitor.x,z:visitor.z},boyStart={x:npc.x,z:npc.z};
  assert.equal(npc.requestTalk(visitor,{indoors}),true);
  assert.deepEqual({x:visitor.x,z:visitor.z},initial,'request does not teleport the visitor');
  assert.ok(!npc.canTalk(visitor,indoors),'no remote dialogue on request');
  let ready=false;
  for(let i=0;i<5000&&!ready;i++){
    const old={x:visitor.x,z:visitor.z},dx=visitor.tx-visitor.x,dz=visitor.tz-visitor.z,d=Math.hypot(dx,dz);
    if(d>.08){const step=Math.min(d,.05*3.2);visitor.x+=dx/d*step;visitor.z+=dz/d*step;}
    if(!indoors)keepDry(visitor);
    assert.ok(distance(old,visitor)<=.05*3.2+.00001,'approach uses normal walking speed');
    const event=npc.updateTalk(visitor,{indoors});
    npc.tick(.05,{player:visitor,sheep:[],sheltering:indoors});
    assert.deepEqual({x:npc.x,z:npc.z},boyStart,'NPC waits during the whole approach');
    if(!indoors)assert.ok(pondLevel(visitor)>=1.05,'visitor walks around the pond');
    ready=event==='ready';
  }
  assert.ok(ready,'arrival enables the conversation');
  const point=npc.talk.point,dx=point.x-visitor.x,dz=point.z-visitor.z;
  assert.ok(Math.hypot(dx,dz)<=2.2,'conversation is within speaking distance');
  assert.ok(visitor.headingX*dx+visitor.headingZ*dz>0,'visitor faces the shepherd');
  assert.ok(npc.headingX*dx+npc.headingZ*dz<0,'shepherd faces the visitor');
  for(let i=0;i<240;i++){
    npc.updateTalk(visitor,{indoors});npc.tick(.05,{player:visitor,sheep:[],sheltering:indoors});
    assert.equal(npc.canTalk(visitor,indoors),true,'NPC stays facing visitor throughout a long chat');
  }
}
for(const from of [{x:0,z:-18},{x:35,z:42},{x:CONFIG.pond.x-CONFIG.pond.rx*1.3,z:CONFIG.pond.z}]){
  const npc=new ShepherdBoy(),visitor={...from,tx:from.x,tz:from.z};npc.x=-2;npc.z=-5;
  approach(npc,visitor);
  visitor.tx=visitor.x+3;
  assert.equal(npc.updateTalk(visitor),'cancelled','walking away ends conversation');
  assert.ok(!npc.talk);
}
const waiting=new ShepherdBoy(),traveler={x:40,z:40,tx:40,tz:40};
waiting.requestTalk(traveler);waiting.endTalk(traveler);
assert.equal(traveler.tx,traveler.x,'cancel stops the approach');
assert.ok(!waiting.canTalk(traveler));
const resident=new ShepherdBoy(),guest={x:0,z:1,tx:0,tz:1};resident.insideLodge=true;
assert.equal(resident.requestTalk(guest),false,'no conversation across indoor/outdoor spaces');
approach(resident,guest,true);
assert.ok(!resident.canTalk(guest,false),'indoor conversation cannot continue outdoors');
resident.endTalk(guest);
assert.equal(resident.state,'rest');
const returning=new ShepherdBoy(),owner2={x:0,z:0,tx:0,tz:0};
returning.requestTalk(owner2);returning.tick(1,{player:owner2,sheep:[],sheltering:true});returning.endTalk(owner2);
returning.tick(.05,{player:owner2,sheep:[],sheltering:true});
assert.equal(returning.wet,true,'weather shelter behavior resumes after conversation');
console.log('Nearby conversation: normal-speed pond-safe approach, waiting NPC, mutual facing, long dialogue, cancellation and indoor separation passed.');