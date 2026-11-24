import assert from 'node:assert/strict';
import {steerWalk} from '../dist/game/walking-clearance.js';

for(const row of [[0],[-1.8,-.6,.6,1.8]]){
  const bodies=row.map(x=>({x,z:0,r:.82}));
  const memory={},goal={x:0,z:4};
  let p={x:0,z:-4};
  for(let i=0;i<400;i++){
    const distance=Math.hypot(goal.x-p.x,goal.z-p.z);
    if(distance<.01)break;
    p=steerWalk(p,goal,Math.min(distance,.05),bodies,()=>true,memory);
    for(const a of bodies)assert.ok(Math.hypot(p.x-a.x,p.z-a.z)>=a.r-1e-8);
  }
  assert.ok(Math.hypot(goal.x-p.x,goal.z-p.z)<.01,'reach the far side of the entire row');
}
