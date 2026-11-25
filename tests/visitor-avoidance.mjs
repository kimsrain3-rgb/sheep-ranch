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
