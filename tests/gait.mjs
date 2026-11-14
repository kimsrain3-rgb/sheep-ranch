import assert from 'node:assert/strict';
import {legJoints,gaitLegs,WALK_CYCLES_PER_SECOND} from '../dist/game/gait.js';
const length=(a,b)=>Math.hypot(a.forward-b.forward,a.y-b.y);
for(let i=0;i<200;i++){
 const phase=i/200,{hip,knee,ankle,lift}=legJoints(phase);
 assert.ok(Math.abs(length(hip,knee)-.325)<1e-9);
 assert.ok(Math.abs(length(knee,ankle)-.325)<1e-9);
 const d={x:ankle.forward-hip.forward,y:ankle.y-hip.y};
 assert.ok((knee.forward-d.x/2)*d.y-(knee.y-hip.y-d.y/2)*d.x>=0,'knee always bends forward, never out to the side');
 assert.ok(ankle.y<=-.06+1e-9);if(phase<.62)assert.equal(lift,0);
 for(const pose of ['front','back'])for(const leg of gaitLegs(phase/WALK_CYCLES_PER_SECOND,pose,true)){
   assert.equal(leg.hip.x,leg.knee.x);assert.equal(leg.knee.x,leg.ankle.x,'front/back legs keep constant lateral lanes');
 }
}
const a=gaitLegs(0,'right',true),b=gaitLegs(.5/WALK_CYCLES_PER_SECOND,'right',true);
assert.ok(Math.abs(a[0].ankle.x-a[0].hip.x-(b[1].ankle.x-b[1].hip.x))<1e-9);
assert.ok(legJoints(.81).lift>.12);
console.log('Gait: fixed bone lengths, forward-only knee flexion, stable front/back lanes, alternating feet, grounded stance and swing clearance passed.');
