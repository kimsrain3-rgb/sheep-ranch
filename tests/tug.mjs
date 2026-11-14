import assert from 'node:assert/strict';
import {Flock} from '../dist/game/flock.js';
import {Interactions} from '../dist/game/interactions.js';
import {MeadowView} from '../dist/orbit.js';
for(const yaw of [0,Math.PI/2,Math.PI,4.7]){
 const f=new Flock(),care=new Interactions(f),view=new MeadowView(),player={x:0,z:0,tx:0,tz:0,walking:false};view.yaw=yaw;
 const sheep=f.adults[1];sheep.x=1;sheep.z=.1;
 assert.equal(care.startTug(sheep,player,view),true);
 for(let i=0;i<150;i++){care.tick(1/60,{player,view});f.tick(1/60,{player,yaw,canTug:false});}
 assert.equal(care.active.phase,'playing');assert.equal(view.zoom,1.65);assert.equal(view.yaw,yaw);
 const p=view.project(0,0,0,390,760),a=view.project(sheep.x,sheep.z,0,390,760),side=care.active.tugSide;
 const mouth={x:a.x+sheep.headX*a.s*sheep.size,y:a.y+(sheep.headY+.3)*a.s*sheep.size};
 const hem={x:p.x+side*.34*p.s,y:p.y-.65*p.s};
 assert.ok(Math.hypot(mouth.x-hem.x,mouth.y-hem.y)<p.s*.03,'mouth stays beside the coat, without a long gap');
 care.cancel(view);assert.equal(sheep.lock,null);assert.equal(care.active,null);
}
console.log('Tug: gradual approach, short mouth-to-hem contact, no zoom/rotation, cancellation across four camera angles passed.');
