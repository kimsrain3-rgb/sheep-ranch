import assert from 'node:assert/strict';
import {forestPins,trailX,firs,wildlifeAt,clearTrunks,groveRoute} from '../dist/game/fir-grove.js';
import {isWater,CONFIG} from '../dist/game/config.js';
import {dryRoute} from '../dist/game/navigation.js';
for(const p of forestPins)assert.equal(trailX(p.z),p.x);
for(const t of firs){
  assert.ok(!isWater(t,2) && t.x<CONFIG.playerBounds.maxX);
  assert.ok(Math.abs(trailX(t.z)-t.x)>3);
  assert.ok(t.x>CONFIG.shed.x+10);
}
const a={x:trailX(-84),z:-84},b={x:trailX(24),z:24};
for(const end of [a,b]){
  const way=groveRoute({x:0,z:0},dryRoute({x:0,z:0},end));
  assert.ok(Math.hypot(way.at(-1).x-end.x,way.at(-1).z-end.z)<.01);
}
const tree=firs[0],from={x:tree.x-2,z:tree.z},to={x:tree.x+2,z:tree.z};
let prev=from;
for(const point of groveRoute(from,[to])){
  for(let i=0;i<=24;i++){
    const u=i/24,p={x:prev.x+(point.x-prev.x)*u,z:prev.z+(point.z-prev.z)*u};
    assert.ok(Math.hypot(p.x-tree.x,p.z-tree.z)>=tree.radius+.24);
  }
  prev=point;
}
const inTrunk={x:tree.x,z:tree.z};clearTrunks(inTrunk);
assert.ok(Math.hypot(inTrunk.x-tree.x,inTrunk.z-tree.z)>tree.radius);
for(let i=0;i<180;i++)for(const animal of wildlifeAt(i*.5)){
  assert.ok(!isWater(animal));
  assert.ok(!firs.some(t=>Math.hypot(t.x-animal.x,t.z-animal.z)<t.radius+.22));
}
console.log('Four forest landmarks, dry connected access, solid trunks and wildlife clearings passed.');

const foxFrames = new Set();
for(let step=0;step<200;step++){
  const animals = wildlifeAt(step*.1);
  const foxes = animals.filter(a=>a.fox);
  assert.equal(foxes.length,1);
  const fox = foxes[0];
  assert.ok(Math.abs(fox.x-trailX(fox.z))<=2.11 && Math.abs(fox.z+22)<=1.351);
  foxFrames.add(fox.frame);
}
assert.equal(foxFrames.size,36);
