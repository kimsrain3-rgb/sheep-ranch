import assert from 'node:assert/strict';
import {Flock} from '../dist/game/flock.js';
import {Interactions} from '../dist/game/interactions.js';
import {drawSheep} from '../dist/render/sheep.js';
function openEyes(animal){
 let eyes=0;const ctx=new Proxy({},{set(t,k,v){t[k]=v;return true;},get(t,k){if(k in t)return t[k];if(k==='createRadialGradient'||k==='createLinearGradient')return ()=>({addColorStop(){}});if(k==='ellipse')return ()=>{if(t.fillStyle==='#242f2a')eyes++;};return ()=>{};}});
 drawSheep(ctx,animal,{project:()=>({x:200,y:400,s:35}),time:0,width:390,height:760,player:{x:0,z:0}});return eyes;
}
const f=new Flock(),care=new Interactions(f),sheep=f.adults[0],player={x:-15,z:0,tx:-15,tz:0},view={zoom:1.65,yaw:0,pitch:.23};
care.request('pet',sheep,player,view);
assert.equal(sheep.careContact,false);assert.equal(openEyes(sheep),2,'clicking from far away leaves both eyes open');
Object.assign(player,{x:player.tx-.3,z:player.tz});care.tick(.1,{player,view});
assert.equal(care.active.phase,'approach');assert.equal(openEyes(sheep),2,'proximity alone does not close the eyes');
Object.assign(player,{x:player.tx,z:player.tz});care.tick(.1,{player,view});
assert.equal(sheep.careContact,true);assert.equal(openEyes(sheep),0,'eyes close when the touching animation actually starts');
care.cancel(view);assert.equal(sheep.careContact,false);assert.equal(openEyes(sheep),2);
care.request('pet',sheep,player,view);Object.assign(player,{x:player.tx,z:player.tz});care.tick(.1,{player,view});care.tick(6,{player,view});
assert.equal(care.active,null);assert.equal(openEyes(sheep),2,'eyes reopen on normal completion too');
console.log('Eye contact: actual renderer keeps eyes open while approaching, closes on touch, reopens after cancellation and completion.');
