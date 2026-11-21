import assert from 'node:assert/strict';
import {CONFIG,WATERWAYS,BRIDGE,LAKE_BRIDGE,BRIDGES,bridgePoint,bridgeHeight,bridgeLocal,onBridge,pondLevel,isWater,keepDry} from '../dist/game/config.js';
import {riverPathClear} from '../dist/game/waterways.js';
import {dryRoute} from '../dist/game/navigation.js';
import {Flock} from '../dist/game/flock.js';
import {drawWaterways,drawRiverMountains,drawRiverBanks} from '../dist/render/waterways.js';
import {drawBridgeDeck,drawBridgeRail,pickBridge} from '../dist/render/bridge.js';
import {MeadowView} from '../dist/orbit.js';
import {trees} from '../dist/pasture.js';
import {makeVegetation} from '../dist/render/details.js';

assert.equal(WATERWAYS.length,2);
const upstream=WATERWAYS[0].points;
const nearestZ=z=>upstream.reduce((a,b)=>Math.abs(a.z-z)<Math.abs(b.z-z)?a:b);
for(const [pool,narrows] of [[87,74],[139,119],[188,169]]){
 assert.ok(nearestZ(pool).width>nearestZ(narrows).width*2,'successive pools and narrows have distinct widths');
}
// A visitor can follow the same side of the stream past several successive pools.
let bankWalk={x:-45,z:87};
for(const z of [101,120,138,160,185,207,225]){
 const p=nearestZ(z),goal={x:p.x+p.width+3,z:p.z};
 for(const step of dryRoute(bankWalk,goal)){
   assert.ok(riverPathClear(bankWalk,step));
   bankWalk=step;
 }
 assert.ok(Math.hypot(bankWalk.x-goal.x,bankWalk.z-goal.z)<.01);
}
assert.equal(BRIDGES.length,2,'both water crossings are available');
assert.ok(WATERWAYS[0].points[0].z>=240,'water begins near the distant mountains');
assert.ok(pondLevel(WATERWAYS[0].points.at(-1))<1,'inlet reaches the lake');
assert.ok(pondLevel(WATERWAYS[1].points[0])<1,'outlet begins in the lake');
assert.ok(WATERWAYS[1].points.at(-1).z<CONFIG.playerBounds.minZ,'outlet continues beyond the walking meadow');
assert.ok(CONFIG.drinkingSpots.every(p=>!isWater(p)),'drinking places remain on accessible banks');
assert.ok(trees.every(p=>!isWater(p)&&!onBridge(p)),'trees stay out of water and off the bridge');
assert.ok(makeVegetation().every(p=>!isWater(p)&&!onBridge(p)),'grass stays out of water and off the bridge');
assert.equal(bridgeHeight(bridgePoint(0)),BRIDGE.rise);
assert.ok(Math.abs(bridgeHeight(bridgePoint(BRIDGE.halfLength)))<1e-9);
assert.ok(!riverPathClear(bridgePoint(-7,4),bridgePoint(7,4)),'ordinary ground cannot cross the stream');
assert.ok(riverPathClear(bridgePoint(-7),bridgePoint(7)),'the deck connects both banks');
const lakeBank=bridgePoint(-LAKE_BRIDGE.halfLength-2,0,LAKE_BRIDGE);
const lakeSide=bridgePoint(LAKE_BRIDGE.halfLength+2,0,LAKE_BRIDGE);
assert.ok(!isWater(lakeBank)&&!isWater(lakeSide),'the lakeside log bridge ends on dry ground');
assert.equal(bridgeHeight(bridgePoint(0,0,LAKE_BRIDGE)),LAKE_BRIDGE.rise);
assert.ok(riverPathClear(lakeBank,lakeSide),'the lakeside log bridge connects both banks');
assert.ok(!riverPathClear(bridgePoint(-8,4,LAKE_BRIDGE),bridgePoint(8,4,LAKE_BRIDGE)),'the stream cannot be crossed beside the log bridge');

const distanceToDoor=(point,kind)=>Math.hypot(point.x-CONFIG[kind].entrance.x,point.z-CONFIG[kind].entrance.z);
let crossed=false,lakeCrossed=false,maxStep=0,previousHeight=0;
for(const [from,to] of [[bridgePoint(-7),bridgePoint(7)],[lakeSide,lakeBank],[{x:0,z:0},{x:-64,z:0}],[{x:0,z:-40},CONFIG.barn.entrance],[{x:-65,z:120},{x:-80,z:120}]]){
 const route=dryRoute(from,to),last=route.at(-1);
 assert.ok(Math.hypot(last.x-to.x,last.z-to.z)<1e-6,'route reaches the actual destination');
 const walker={...from,buildingAccess:['barn','coop','lodge','shed'].find(kind=>distanceToDoor(to,kind)<.01)||null};previousHeight=bridgeHeight(walker);
 for(const goal of route){
   for(let i=0;i<10000&&Math.hypot(goal.x-walker.x,goal.z-walker.z)>.001;i++){
     const dx=goal.x-walker.x,dz=goal.z-walker.z,d=Math.hypot(dx,dz),step=Math.min(d,.16),before={...walker};
     walker.x+=dx/d*step;walker.z+=dz/d*step;keepDry(walker);
     maxStep=Math.max(maxStep,Math.hypot(walker.x-before.x,walker.z-before.z));
     assert.ok(!isWater(walker),'walking routes stay on dry ground or bridge planks');
     const height=bridgeHeight(walker);
     assert.ok(Math.abs(height-previousHeight)<.08,'feet follow the arch smoothly');
     previousHeight=height;if(height>.8)crossed=true;
     if(height>.8&&Math.hypot(walker.x-LAKE_BRIDGE.x,walker.z-LAKE_BRIDGE.z)<2)lakeCrossed=true;
   }
   assert.ok(Math.hypot(goal.x-walker.x,goal.z-walker.z)<.001,'each waypoint is reachable without sticking');
 }
}
assert.ok(crossed&&lakeCrossed,'both arches are walkable');assert.ok(maxStep<=.160001,'river avoidance never teleports a routed walker');
const waterSpot=CONFIG.drinkingSpots[2];
const sheep={x:-25,z:22,tx:waterSpot.x,tz:waterSpot.z,walking:false,dir:1};
const flockWalker=Object.create(Flock.prototype);let sheepHeight=0;
for(let i=0;i<1200&&Math.hypot(sheep.x-waterSpot.x,sheep.z-waterSpot.z)>.25;i++){
  flockWalker.move(sheep,.05,.8,0);
  assert.ok(!isWater(sheep),'a sheep stays dry while using the lakeside bridge');
  sheepHeight=Math.max(sheepHeight,bridgeHeight(sheep));
}
assert.ok(sheepHeight>.7&&Math.hypot(sheep.x-waterSpot.x,sheep.z-waterSpot.z)<.25,'sheep from the meadow use the arch to reach a lakeside drinking spot');
for(const river of WATERWAYS)for(const p of river.points){
 const point={x:p.x,z:p.z};keepDry(point);assert.ok(!isWater(point),'water collisions resolve even at the river mouths');
}

for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 const view=new MeadowView();view.target=bridgePoint(0);view.yaw=yaw;view.zoom=1.1;
 const W=1100,H=800,project=(x,z,y=0)=>view.project(x,z,y,W,H);let saves=0,fills=0;
 const c=new Proxy({},{set(t,k,v){t[k]=v;return true;},get(t,k){
  if(k==='save')return ()=>saves++;
  if(k==='restore')return ()=>saves--;
  if(k==='fill')return ()=>fills++;
  if(['moveTo','lineTo','translate','scale'].includes(k))return (...v)=>assert.ok(v.every(Number.isFinite),'scenery projects to finite coordinates');
  return ()=>{};
 }});
 drawRiverMountains(c,project,view.basis(W,H));drawRiverBanks(c,project,view.basis(W,H));drawWaterways(c,project,13,view.basis(W,H));
 drawBridgeDeck(c,project);drawBridgeRail(c,project,-1);drawBridgeRail(c,project,1);
 assert.equal(saves,0);assert.ok(fills>50,'water and bridge render in every direction');
 const center=project(BRIDGE.x,BRIDGE.z,BRIDGE.rise),picked=pickBridge(center.x,center.y,project);
 assert.ok(picked&&Math.abs(bridgeLocal(picked).u)<.04&&Math.abs(bridgeLocal(picked).v)<.04,'tapping the raised deck picks the bridge rather than ground underneath');
 view.target=bridgePoint(0,0,LAKE_BRIDGE);
 const logCenter=project(LAKE_BRIDGE.x,LAKE_BRIDGE.z,LAKE_BRIDGE.rise),logPick=pickBridge(logCenter.x,logCenter.y,project);
 assert.ok(logPick&&Math.abs(bridgeLocal(logPick,LAKE_BRIDGE).u)<.04&&Math.abs(bridgeLocal(logPick,LAKE_BRIDGE).v)<.04,'tapping the log deck picks the new crossing');
}
console.log('Water landscape: mountain source, 2x lake, outlet, two walkable arches, sheep drinking route, dry bank routes, deck picking and all-angle rendering passed.');
