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

const {passageTraffic}=await import('../dist/game/visitor-avoidance.js');
for(const fps of [15,30,60]){
  for(const radius of [.7,.95,1.65]){
    const goal={x:5,z:0}, memory=new Map(), steering={};
    const animal={x:0,z:0}, dt=1/fps;
    const legal=(_,p)=>Math.abs(p.z)<=.48;
    let at={x:-4,z:0};
    for(let i=0;i<fps*14 && goal.x-at.x>.08;i++){
      const b={...animal,radius,actor:animal};
      const traffic=passageTraffic(at,goal,Math.min(3.2*dt,goal.x-at.x),dt,[b],memory,legal);
      const next=traffic.stride>.001?visitorStep(at,goal,traffic.stride,[b],p=>legal(at,p),steering):at;
      assert.ok(next.x>=at.x-1e-7 && legal(at,next),JSON.stringify({fps,radius,i,at,next,animal,traffic}));
      assert.ok(Math.hypot(next.x-animal.x,next.z-animal.z)>=radius-1e-6);
      if(traffic.moves.length)Object.assign(animal,traffic.moves[0].point);
      else animal.x-=.3*dt;
      at=next;
    }
    assert.ok(goal.x-at.x<=.08,'pass a head-on animal without repeated taps');
  }
}

const herd=[{x:0,z:0},{x:2.4,z:.1},{x:4.8,z:-.1}];
let walker={x:-4,z:0};
const end={x:8,z:0}, queueMemory=new Map(), turnMemory={};
for(let i=0;i<900 && end.x-walker.x>.08;i++){
  const bodies=herd.map(actor=>({...actor,radius:1.15,actor}));
  const legal=(_,p)=>Math.abs(p.z)<.5;
  const step=Math.min(3.2/60,Math.hypot(end.x-walker.x,walker.z));
  const traffic=passageTraffic(walker,end,step,1/60,bodies,queueMemory,legal);
  if(traffic.stride>.001)walker=visitorStep(walker,end,traffic.stride,bodies,p=>legal(walker,p),turnMemory);
  for(const {actor,point} of traffic.moves)Object.assign(actor,point);
  for(const actor of herd)assert.ok(Math.hypot(walker.x-actor.x,walker.z-actor.z)>=1.15-1e-6);
}
assert.ok(Math.hypot(end.x-walker.x,walker.z)<.08,'a queue clears space beyond the original goal');
