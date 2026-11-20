import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.js';
import {createLodgeRoomModel} from '../dist/render/lodge-room-model.js';
import {BuildingRenderer} from '../dist/render/buildings-three.js';
import {LodgeInteriorView} from '../dist/game/lodge-camera.js';
import {lodgeRoute,lodgeWalkable,moveLodgePlayer,LODGE_STAIRS,FLIGHT,LODGE_ROOM} from '../dist/game/lodge-layout.js';

for(const floor of [1,2]){
 const model=createLodgeRoomModel(floor);model.updateMatrixWorld(true);
 assert.ok(model.children.length<=20,'detailed furniture batches into a small set of meshes');
 const cast=(from,direction)=>new THREE.Raycaster(new THREE.Vector3(...from),new THREE.Vector3(...direction),0,30).intersectObject(model,true);
 assert.ok(cast([0,1.65,-5],[0,1,0]).some(hit=>hit.distance<2.4),'solid ceiling surrounds the player overhead');
 assert.ok(cast([0,1.65,-5],[0,-1,0]).some(hit=>hit.distance<1.7),'the floor is under the player');
 assert.ok(cast([0,1.65,-5],[1,0,0]).some(hit=>hit.distance<5.6),'side walls enclose the room');
 assert.ok(!cast([-3.9,2.65,-12],[0,0,-1]).some(hit=>hit.distance<1.7),'window quadrants are real openings onto the meadow');
 for(const mesh of model.children)assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
 const paths=[[{x:0,z:1},{x:-4,z:5}],[{x:0,z:1},LODGE_STAIRS],[LODGE_STAIRS,{x:0,z:.55}]];
 if(floor===2)paths.push([LODGE_STAIRS,{x:0,z:-1.1}],[{x:-3,z:-.8},{x:0,z:9}]);
 for(const [from,to] of paths){
   assert.ok(lodgeWalkable(from,floor));const route=lodgeRoute(from,to,floor);let previous=from;
   for(const next of route){
     for(let i=0;i<=120;i++)assert.ok(lodgeWalkable({x:previous.x+(next.x-previous.x)*i/120,z:previous.z+(next.z-previous.z)*i/120},floor),'paths cannot cut furniture, walls, balcony rails or the stair opening');
     previous=next;
   }
   if(to===LODGE_STAIRS||to.x===0)assert.ok(Math.hypot(previous.x-to.x,previous.z-to.z)<1e-6,'stairs, exit and balcony remain reachable');
 }
}
const view=new LodgeInteriorView();view.target={x:1.2,z:5.7};
for(const [W,H] of [[1440,900],[390,844]]){
 const b=view.basis(W,H);assert.equal(b.x,view.target.x);assert.equal(b.z,view.target.z);assert.equal(b.height,1.65);
 const point=view.project(1.2,9.7,0,W,H),floor=view.ground(point.x,point.y,W,H);
 assert.ok(Math.hypot(floor.x-1.2,floor.z-9.7)<1e-7,'first-person floor picking matches the visible floor');
}
const renderer=new BuildingRenderer();
for(const level of [1,2]){
 const camera=new LodgeInteriorView(),height=(level-1)*LODGE_ROOM.floorHeight;
 camera.target=level===1?{x:FLIGHT.x,z:LODGE_STAIRS.z}:{x:2.5,z:12.85};
 camera.yaw=level===1?0:Math.PI/2;
 camera.pitch=level===1?1:.8;
 const z=level===1?FLIGHT.front+.04:12.85,y=level===1?LODGE_ROOM.floorHeight/FLIGHT.steps:height;
 const target=camera.project(FLIGHT.x,z,y-height,800,520);
 assert.ok(target&&renderer.pickLodgeStairs(target.x,target.y,camera,800,520,height),'visible tread or top landing can be tapped on floor '+level);
}
renderer.dispose();
view.pan(0,-2000);assert.ok(view.pitch<-.9,'the visitor can look up at the ceiling');
view.eyeHeight=5.85;assert.equal(view.basis(1440,900).height,5.85,'the upper-floor outside view uses real elevation');
const walker={x:-1.95,z:5};moveLodgePlayer(walker,{x:-2.2,z:5},1);assert.ok(walker.x>-2.03,'manual walking cannot enter the bed');
console.log('Immersive lodge: eye-height camera, solid floor/ceiling/walls, open windows, furniture collision, reachable stairs/balcony, picking and elevated outlook passed.');
