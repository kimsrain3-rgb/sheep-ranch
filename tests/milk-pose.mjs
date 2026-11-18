import {CONFIG} from '../dist/game/config.js';
import assert from 'node:assert/strict';
import {milkPose} from '../dist/render/milk-pose.js';
import {Flock} from '../dist/game/flock.js';
import {Interactions} from '../dist/game/interactions.js';
for(const size of [.8/3,1.18/3]){
 const p=milkPose(size),length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 assert.ok(length(p.shoulder,p.elbow)<.34);
 assert.ok(length(p.elbow,p.hand)<.34,'forearm keeps its normal length');
 assert.equal(p.nipple.x,.82);assert.equal(p.nipple.y,-.75*size);
}
for(const location of [{x:3,z:6},CONFIG.drinkingSpots[0]]){
 const f=new Flock(),care=new Interactions(f),baby=f.lambs[0];Object.assign(baby,location);baby.milkCooldown=0;
 const player={x:0,z:0,tx:0,tz:0},view={zoom:1.65,yaw:0,pitch:.23};
 care.request('milk',baby,player,view);care.tick(.1,{player,view});assert.equal(care.active.phase,'approach');
 Object.assign(player,{x:player.tx,z:player.tz});care.tick(.1,{player,view});assert.equal(care.active.phase,'playing');
 assert.ok(Math.abs(Math.abs(player.x-baby.x)-.82)<1e-8);assert.equal(player.z,baby.z);
 care.cancel(view);assert.equal(baby.lock,null);assert.equal(view.zoom,1.65);
}
console.log('Milk pose: bounded upper/forearms, low bottle height, close dry-side approach, no premature start and clean cancellation passed.');
