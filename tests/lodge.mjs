import assert from 'node:assert/strict';
import {CONFIG,distance} from '../dist/game/config.js';
import {ShepherdBoy} from '../dist/game/shepherd.js';
import {Companions} from '../dist/game/companions.js';
import {drawLodge,drawLodgePanorama} from '../dist/render/lodge.js';

assert.ok(CONFIG.lodge.x+CONFIG.lodge.halfWidth<CONFIG.barn.x-CONFIG.barn.halfWidth,'lodge sits beyond the sheep barn with a clear gap');
assert.ok(CONFIG.lodge.entrance.z<CONFIG.lodge.z,'lodge entrance faces the pasture');
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
const panorama=new Proxy({canvas:{width:0,height:0}},{get(target,key){if(key in target)return target[key];if(key==='createLinearGradient')return ()=>({addColorStop(){}});if(key==='fillText')return text=>labels.push(String(text));return ()=>{};},set(target,key,value){target[key]=value;return true;}});
drawLodgePanorama(panorama,640,350,{sheep,chickens:companions.chickens,dogs:companions.dogs,shepherd:boy,night:false});
assert.ok(labels.includes('축사')&&labels.includes('닭장'),'balcony labels actual farm buildings');
assert.ok(labels.some(text=>text.includes('목장 전망')));
console.log('Shepherd lodge: clear placement, continuous shared arrival/exit, and two-story exterior passed.');
