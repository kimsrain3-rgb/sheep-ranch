import {keepRiverDry,inRiver} from './waterways.js?v=lake-bridge-1';
export {BRIDGE,LAKE_BRIDGE,BRIDGES,bridgePathClear,bridgeHeight,bridgePoint,bridgeLocal,onBridge,WATERWAYS,nearestRiver,inRiver} from './waterways.js?v=lake-bridge-1';
import {keepOutsideBuildings} from './building-collision.js?v=windmill-1';
export {actorRadius,buildingAccess,buildingPathClear,buildingFootprints} from './building-collision.js?v=windmill-1';
const pond=Object.freeze({
  x:-25,z:-9,rx:19*Math.sqrt(2),rz:11*Math.sqrt(2),
  openWater:Object.freeze({x:-26,z:-9,rx:6*Math.sqrt(2),rz:3*Math.sqrt(2)})
});
// A smooth asymmetric shore with a sheltered inlet on the eastern bank.
export function pondEdge(angle){
  const inlet=Math.atan2(Math.sin(angle-.45),Math.cos(angle-.45));
  return .94+.10*Math.sin(angle*2+.35)+.055*Math.cos(angle*3-.3)-.32*Math.exp(-((inlet/.42)**2));
}
export function pondPoint(angle,scale=1){
  const radius=pondEdge(angle)*scale;
  return {x:pond.x+Math.cos(angle)*pond.rx*radius,z:pond.z+Math.sin(angle)*pond.rz*radius};
}
export function pondLevel(point){
  const dx=(point.x-pond.x)/pond.rx,dz=(point.z-pond.z)/pond.rz;
  return Math.hypot(dx,dz)/pondEdge(Math.atan2(dz,dx));
}
// All tunable counts, places and activity durations live here.
export const CONFIG = Object.freeze({
  adults: 50, lambs: 12, chickens: 10, dogs: 2,
  bounds: {
    minX:-150,maxX:150,minZ:-150,maxZ:300
  },
  playerBounds:{minX:-110,maxX:110,minZ:-110,maxZ:290},
  pond,
  drinkingSpots: [.06,.9,2.7].map(angle=>pondPoint(angle,1.08)),
  windmill: {walkableFloors:0,x:-57.3,z:-41,entrance:{x:-57.3,z:-45},deckHeight:15.8,ridge:24.6},
  barn: {walkableFloors:1,x:-25,z:37,entrance:{x:-25,z:28},halfWidth:10,depth:18,capacity:80},
  coop: {walkableFloors:1,x:-8.5,z:37,entrance:{x:-8.5,z:31},halfWidth:4,depth:10,capacity:10},
  lodge: {walkableFloors:2,x:-47,z:52,entrance:{x:-47,z:43},halfWidth:6,depth:14},
  hammock: {x:-46.7,z:-46.9},
  shed: {walkableFloors:1,
    x:24,z:48,entrance:{
      x:24,z:48
    }
  },
  durations: {
    pet:5.5,milk:8,sleep:28,nurse:10,drink:8,tug:4
  },
  maxHayPiles: 4, hayPortions: 10,
});
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function seededRandom(seed=1731){
  return ()=>((seed=seed*16807%2147483647)-1)/2147483646;
}
export function isWater(point,clearance=0){
  return pondLevel(point)<1+clearance/Math.min(pond.rx,pond.rz)||inRiver(point,clearance);
}
export function keepDry(a,options={}){
  for(let pass=0;pass<4;pass++){
    const oldX=a.x,oldZ=a.z,p=CONFIG.pond,dx=(a.x-p.x)/p.rx,dz=(a.z-p.z)/p.rz,r=Math.hypot(dx,dz);
    const angle=r>.0001?Math.atan2(dz,dx):0,edge=pondEdge(angle)*1.06;
    if(r<edge){a.x=p.x+Math.cos(angle)*p.rx*edge;a.z=p.z+Math.sin(angle)*p.rz*edge;}
    keepRiverDry(a);
    keepOutsideBuildings(a,CONFIG,options);
    if(Math.hypot(a.x-oldX,a.z-oldZ)<1e-7)break;
  }
}
