import assert from 'node:assert/strict';
import {CONFIG,keepDry,distance,seededRandom} from '../dist/game/config.js';
import {actorRadius,buildingFootprints,buildingPathClear,keepOutsideBuildings} from '../dist/game/building-collision.js';
import {dryRoute} from '../dist/game/navigation.js';
import {BUILDING_SPECS} from '../dist/render/building-models.js';
import {ROOM_DOORS} from '../dist/game/doorway.js';
import {FARM_ROOMS} from '../dist/game/farm-room.js';
import {Flock} from '../dist/game/flock.js';

const footprints=buildingFootprints(CONFIG);
const obstacles=new Set(footprints.map(b=>b.kind));
const places=Object.entries(CONFIG).filter(([,place])=>place?.entrance||place?.walkableFloors!==undefined);
const buildings=new Set([...places.map(([kind])=>kind),...Object.keys(BUILDING_SPECS),
  ...Object.keys(FARM_ROOMS),...Object.keys(ROOM_DOORS),...obstacles]);
for(const kind of buildings){
  const place=CONFIG[kind];
  assert.ok(Number.isFinite(place?.entrance?.x)&&Number.isFinite(place?.entrance?.z),kind+': missing map entrance');
  assert.ok(obstacles.has(kind),kind+': missing exterior wall collision');
  assert.ok(Number.isInteger(place.walkableFloors)&&place.walkableFloors>=0,kind+': declare the number of walkable floors');
  assert.equal(!!ROOM_DOORS[kind],place.walkableFloors>0,kind+': room doorway and walkable floors must agree');
  if(FARM_ROOMS[kind])assert.ok(place.walkableFloors>0,kind+': walkable utility room needs a door');
}

for(const b of footprints){
  for(const actor of [{type:'visitor'},{type:'dog'},{type:'chicken'},{id:'sheep-adult',size:1.18},{id:'lamb-test',isLamb:true,size:.33}]){
    const radius=actorRadius(actor);
    const middleX=(b.left+b.right)/2,middleZ=(b.front+b.back)/2;
    for(const [x,z,dx,dz] of [[b.left-radius-.1,middleZ,1,0],[b.right+radius+.1,middleZ,-1,0],
      [middleX,b.front-radius-.1,0,1],[middleX,b.back+radius+.1,0,-1]]){
      const from={...actor,x,z},next={...actor,x:x+dx*.22,z:z+dz*.22};
      assert.equal(buildingPathClear(from,next,CONFIG),false,b.kind+': approaching a wall must block roaming');
      keepOutsideBuildings(next,CONFIG);
      assert.ok(next.x<=b.left-radius||next.x>=b.right+radius||next.z<=b.front-radius||next.z>=b.back+radius,
        b.kind+': the whole body must stay outside');
    }
  }
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
const barn=buildingFootprints(CONFIG).find(b=>b.kind==='barn');
for(const actor of [{type:'visitor'},{id:'sheep-wall-check',size:1.18}])for(const [x,z,dx,dz] of [
  [barn.left-actorRadius(actor)-.2,(barn.front+barn.back)/2,1,0],
  [barn.right+actorRadius(actor)+.2,barn.front+.3,-1,0],
  [barn.doorX+barn.doorHalf+actorRadius(actor)+1,barn.front-actorRadius(actor)-.2,0,1],
  [barn.doorX,barn.back+actorRadius(actor)+.2,0,-1]
]){
  const walker={...actor,x,z};
  for(let step=0;step<80;step++){
    const before={x:walker.x,z:walker.z};walker.x+=dx*.16;walker.z+=dz*.16;keepDry(walker);
    const safe={...walker};keepOutsideBuildings(safe,CONFIG);
    assert.ok(distance(safe,walker)<1e-7,'visitor and sheep stay outside the new barn walls');
    assert.ok(distance(before,walker)<=.160001,`a wall never teleports a visitor or sheep: ${JSON.stringify({actor,step,before,after:walker})}`);
  }
}
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
console.log('Building collisions: registered footprints, visitor and animal body sizes, side/back walls, continuous detours, safe spawns, door-only access and real flock movement passed.');
