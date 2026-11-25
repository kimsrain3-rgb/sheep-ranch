import assert from 'node:assert/strict';
import {visitorStep} from '../dist/game/visitor-avoidance.js';

for (const side of [-1,1]) {
  let visitor={x:-5,z:0};
  const goal={x:5,z:0}, obstacles=[{x:2,z:0,radius:.85}];
  for (let frame=0;frame<240;frame++) {
    // A sheep enters the planned walk after departure.
    if (frame===10) obstacles.push({x:-1,z:0,radius:1.5});
    const distance=Math.hypot(goal.x-visitor.x,goal.z-visitor.z);
    const next=visitorStep(visitor,goal,Math.min(.08,distance),obstacles,p=>side*p.z>=-1e-8);
    assert.ok(Math.hypot(next.x-visitor.x,next.z-visitor.z)<=.080001);
    for (const o of obstacles) assert.ok(Math.hypot(next.x-o.x,next.z-o.z)>=o.radius-1e-8);
    visitor=next;
  }
  assert.ok(Math.hypot(visitor.x-goal.x,visitor.z-goal.z)<.01);
}
console.log('Visitor walks around a crossing sheep and a trunk and reaches the goal on either side.');

// The tempting gap between these three bodies pinches shut mid-walk.
const cluster = [
  {x:.05047,z:.07463,radius:1.4}, {x:.80329,z:2.93115,radius:1.5},
  {x:1.73492,z:-2.84746,radius:1.5}
];
for (const fps of [30,60]) {
  const goal={x:4,z:0}, steering={};
  let at={x:-4,z:0}, previous, travelled=0;
  for(let i=0;i<fps*10;i++){
    const remaining=Math.hypot(goal.x-at.x,goal.z-at.z);
    if(remaining<.08)break;
    const next=visitorStep(at,goal,Math.min(remaining,3.2/fps),cluster,()=>true,steering);
    for(const o of cluster) assert.ok(Math.hypot(next.x-o.x,next.z-o.z)>=o.radius);
    const angle=Math.atan2(next.z-at.z,next.x-at.x);
    if(previous!==undefined)assert.ok(Math.cos(angle-previous)>0,'no abrupt reversal');
    previous=angle;travelled+=Math.hypot(next.x-at.x,next.z-at.z);at=next;
  }
  assert.ok(Math.hypot(goal.x-at.x,goal.z-at.z)<.08 && travelled<10,'short continuous detour');
}
