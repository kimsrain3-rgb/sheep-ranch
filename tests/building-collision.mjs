import assert from 'node:assert/strict';
import {CONFIG,keepDry,distance,seededRandom} from '../dist/game/config.js';
import {actorRadius,buildingFootprints,buildingPathClear,keepOutsideBuildings} from '../dist/game/building-collision.js';
import {dryRoute} from '../dist/game/navigation.js';
import {Flock} from '../dist/game/flock.js';

for(const b of buildingFootprints(CONFIG)){
  for(const size of [.3,.8,1.18]){
    const a={id:'sheep-test',size,x:(b.left+b.right)/2,z:b.front-4,state:'roam'},radius=actorRadius(a);
    const goal={x:a.x,z:b.back+4};
    assert.equal(buildingPathClear(a,goal,CONFIG),false,`${b.kind}: a straight crossing intersects the walls`);
    const route=dryRoute(a,goal);
    assert.ok(distance(route.at(-1),goal)<.001,`${b.kind}: detour reaches the far side`);
    for(const target of route){
      assert.ok(buildingPathClear(a,target,CONFIG),`${b.kind}: each detour leg has body clearance`);
      for(let step=0;step<10000&&distance(a,target)>.001;step++){
        const d=distance(a,target),amount=Math.min(d,.06),before={x:a.x,z:a.z};
        a.x+=(target.x-a.x)/d*amount;a.z+=(target.z-a.z)/d*amount;keepDry(a);
        assert.ok(distance(before,a)<=amount+.00001,'a normal walking step never jumps out through a wall');
        const projected={x:a.x,z:a.z};keepOutsideBuildings(projected,CONFIG,{radius});
        assert.ok(distance(projected,a)<.00001,'the complete body stays outside the wall');
      }
      assert.ok(distance(a,target)<.001,'corners do not trap the walker');
    }
  }
  // Push accidental/old spawn coordinates out before they are ever rendered.
  const spawned={id:'sheep-test',size:1,x:(b.left+b.right)/2,z:(b.front+b.back)/2};
  keepDry(spawned);const safe={...spawned};keepDry(safe);assert.ok(distance(safe,spawned)<.00001);
  assert.ok(spawned.x<=b.left-actorRadius(spawned)||spawned.x>=b.right+actorRadius(spawned)||spawned.z<=b.front-actorRadius(spawned)||spawned.z>=b.back+actorRadius(spawned));
  const door={x:b.doorX,z:b.front},front={x:b.doorX,z:b.front-4};
  assert.equal(buildingPathClear(front,door,CONFIG),false,'ordinary roaming cannot enter a building');
  assert.equal(buildingPathClear(front,door,CONFIG,{access:b.kind,radius:.4}),true,'authorized entry reaches the actual doorway');
  assert.equal(buildingPathClear({x:b.left-4,z:b.front+2},door,CONFIG,{access:b.kind,radius:.4}),false,'entry permission never opens a side wall');
}

const flock=new Flock(seededRandom(315));
// The largest adult cannot fit between the barn and coop. Resolving an old
// position or an invalid target must never push it back inside its neighbor.
const alley={id:'sheep-wide',size:1.18,x:-13.82,z:35};keepDry(alley);
const again={...alley};keepDry(again);assert.ok(distance(alley,again)<1e-8,'overlapping clearance zones resolve outside both buildings without oscillating');
for(const a of flock.animals){
  const safe={...a};keepDry(safe);assert.ok(distance(a,safe)<1e-6,'initial sheep are outside buildings');
}
// Reproduce the screenshot: a sheep tries to reach food across the coop.
const a=flock.adults[0],b=buildingFootprints(CONFIG).find(b=>b.kind==='coop');
Object.assign(a,{size:.8,x:b.left-1.5,z:b.front+4,tx:b.right+3,tz:b.front+4,state:'roam',walkGoal:null,walkRoute:null});
const goal={x:a.tx,z:a.tz};let maxStep=0;
for(let i=0;i<2400&&distance(a,goal)>.31;i++){
  const before={x:a.x,z:a.z};flock.move(a,.05,1.6,0);maxStep=Math.max(maxStep,distance(before,a));
  const safe={...a};keepDry(safe);assert.ok(distance(safe,a)<1e-6,'walking sheep never occupies a wall');
}
assert.ok(distance(a,goal)<.31,'a sheep actually walks around the coop and reaches the other side');
assert.ok(maxStep<=.080001,'the detour preserves normal movement speed');
console.log('Building collisions: four footprints, adult/lamb body sizes, side/back walls, continuous detours, safe spawns, door-only access and real flock movement passed.');
