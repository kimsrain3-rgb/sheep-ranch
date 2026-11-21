const specs=[
  {name:'inlet',points:[[-80,250,1],[-63,183,1.3],[-72,124,1.5],[-53,84,1.7],[-59,47,2],[-44,21,2.7],[-33,9,3],[-31,2,3.1]]},
  {name:'outlet',points:[[-10,-5,2.3],[-3,-12,2],[7,-24,1.8],[10,-39,1.9],[24,-58,2.1],[15,-85,2],[29,-116,2.2],[21,-154,2.1]]}
];
const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
// Surveyed half-widths along the upstream valley, from the lake towards the source.
const inletWidths=[[21,2.7],[34,1.55],[47,2.1],[62,3.8],[74,1.35],[87,4.1],[104,2.7],[119,1.25],[139,3.9],[157,2.3],[169,1.05],[188,3.3],[207,1.6],[225,2.65],[241,1.15],[250,1]];
function inletWidth(z,original){
  if(z<=21)return original;
  const i=inletWidths.findIndex(([at])=>at>=z);
  if(i<0)return inletWidths.at(-1)[1];
  const [start,a]=inletWidths[i-1],[end,b]=inletWidths[i];
  const t=(z-start)/(end-start);
  return a+(b-a)*t*t*(3-2*t);
}
export const WATERWAYS=specs.map(spec=>{
  const points=[];
  for(let i=0;i<spec.points.length-1;i++)for(let j=0;j<12;j++){
    const a=spec.points[Math.max(0,i-1)],b=spec.points[i],c=spec.points[i+1],d=spec.points[Math.min(spec.points.length-1,i+2)],t=j/12;
    const z=cat(a[1],b[1],c[1],d[1],t),width=b[2]+(c[2]-b[2])*t;
    points.push({x:cat(a[0],b[0],c[0],d[0],t),z,width:spec.name==='inlet'?inletWidth(z,width):width});
  }
  const last=spec.points.at(-1);points.push({x:last[0],z:last[1],width:last[2]});
  return {...spec,controls:points.filter((_,i)=>i%12===0),points};
});
export const BRIDGE=Object.freeze({x:7,z:-24,halfLength:5.2,halfWidth:1.35,rise:.95,ux:27/Math.hypot(27,13),uz:13/Math.hypot(27,13)});
export const LAKE_BRIDGE=Object.freeze({x:-34,z:10,halfLength:6.4,halfWidth:2,rise:.85,ux:12/Math.hypot(12,11),uz:11/Math.hypot(12,11),style:'logs'});
export const BRIDGES=Object.freeze([BRIDGE,LAKE_BRIDGE]);
export function bridgeLocal(point,bridge=BRIDGE){const dx=point.x-bridge.x,dz=point.z-bridge.z;return {u:dx*bridge.ux+dz*bridge.uz,v:-dx*bridge.uz+dz*bridge.ux};}
export function bridgePoint(u,v=0,bridge=BRIDGE){return {x:bridge.x+u*bridge.ux-v*bridge.uz,z:bridge.z+u*bridge.uz+v*bridge.ux};}
export function bridgeAt(point,padding=0){return BRIDGES.find(bridge=>{const {u,v}=bridgeLocal(point,bridge);return Math.abs(u)<=bridge.halfLength+padding&&Math.abs(v)<=bridge.halfWidth+padding;});}
export function onBridge(point,padding=0){return !!bridgeAt(point,padding);}
export function bridgeHeight(point){
  const bridge=bridgeAt(point);if(!bridge)return 0;
  const {u}=bridgeLocal(point,bridge),t=u/bridge.halfLength;
  return bridge.rise*Math.max(0,1-t*t);
}
export const RIVER_SEGMENTS=WATERWAYS.flatMap(river=>river.points.slice(1).map((b,i)=>{
  const a=river.points[i],width=Math.max(a.width,b.width),dx=b.x-a.x,dz=b.z-a.z;
  return {a,b,width,dx,dz,length2:dx*dx+dz*dz,minX:Math.min(a.x,b.x)-width,maxX:Math.max(a.x,b.x)+width,minZ:Math.min(a.z,b.z)-width,maxZ:Math.max(a.z,b.z)+width};
}));
export function nearestRiver(point){
  let best=null;
  for(const segment of RIVER_SEGMENTS){
    const t=Math.max(0,Math.min(1,((point.x-segment.a.x)*segment.dx+(point.z-segment.a.z)*segment.dz)/(segment.length2||1)));
    const x=segment.a.x+segment.dx*t,z=segment.a.z+segment.dz*t,distance=Math.hypot(point.x-x,point.z-z),clearance=distance-segment.width;
    if(!best||clearance<best.clearance)best={x,z,distance,clearance,width:segment.width,segment};
  }
  return best;
}
export function inRiver(point,margin=0){return !onBridge(point)&&nearestRiver(point).clearance<margin;}
export function keepRiverDry(point){
  if(onBridge(point))return;
  const hit=nearestRiver(point);if(hit.clearance>=.22)return;
  const d=hit.distance||1,length=Math.sqrt(hit.segment.length2)||1;
  const nx=hit.distance>.0001?(point.x-hit.x)/d:-hit.segment.dz/length;
  const nz=hit.distance>.0001?(point.z-hit.z)/d:hit.segment.dx/length;
  point.x=hit.x+nx*(hit.width+.24);point.z=hit.z+nz*(hit.width+.24);
}
export function segmentsCross(a,b,c,d){
  const ax=b.x-a.x,az=b.z-a.z,bx=d.x-c.x,bz=d.z-c.z,den=ax*bz-az*bx;
  if(Math.abs(den)<1e-9)return false;
  const cx=c.x-a.x,cz=c.z-a.z,u=(cx*bz-cz*bx)/den,v=(cx*az-cz*ax)/den;
  return u>=0&&u<=1&&v>=0&&v<=1;
}
function pointDistanceSquared(p,a,b){
  const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;
  return (p.x-a.x-dx*t)**2+(p.z-a.z-dz*t)**2;
}
function distanceSquared(a,b,c,d){
  if(segmentsCross(a,b,c,d))return 0;
  return Math.min(pointDistanceSquared(a,c,d),pointDistanceSquared(b,c,d),pointDistanceSquared(c,a,b),pointDistanceSquared(d,a,b));
}
function bridgeInterval(a,b,bridge){
  const from=bridgeLocal(a,bridge),to=bridgeLocal(b,bridge);let enter=0,exit=1;
  for(const [key,half] of [['u',bridge.halfLength],['v',bridge.halfWidth]]){
    const delta=to[key]-from[key];
    if(Math.abs(delta)<1e-9){if(Math.abs(from[key])>half)return null;continue;}
    let lo=(-half-from[key])/delta,hi=(half-from[key])/delta;if(lo>hi)[lo,hi]=[hi,lo];
    enter=Math.max(enter,lo);exit=Math.min(exit,hi);if(enter>exit)return null;
  }
  // The rails close both long sides. Enter/leave only at a ground-level end,
  // preventing a diagonal shortcut that would jump straight onto the arch.
  const uAt=t=>from.u+(to.u-from.u)*t;
  if(enter>1e-6&&Math.abs(uAt(enter))<bridge.halfLength-.001)return false;
  if(exit<1-1e-6&&Math.abs(uAt(exit))<bridge.halfLength-.001)return false;
  return [enter,exit];
}
export function bridgePathClear(a,b){return BRIDGES.every(bridge=>bridgeInterval(a,b,bridge)!==false);}
export function riverPathClear(a,b){
  const intervals=BRIDGES.map(bridge=>bridgeInterval(a,b,bridge));
  if(intervals.includes(false))return false;
  const pieces=[],covered=intervals.filter(Boolean).sort((left,right)=>left[0]-right[0]);
  const at=t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
  let start=0;
  for(const [enter,exit] of covered){if(enter>start+.00001)pieces.push([at(start),at(enter)]);start=Math.max(start,exit);}
  if(start<.99999)pieces.push([at(start),b]);
  for(const [from,to] of pieces){
    for(const segment of RIVER_SEGMENTS){
      if(Math.max(from.x,to.x)<segment.minX-.225||Math.min(from.x,to.x)>segment.maxX+.225||Math.max(from.z,to.z)<segment.minZ-.225||Math.min(from.z,to.z)>segment.maxZ+.225)continue;
      if(distanceSquared(from,to,segment.a,segment.b)<(segment.width+.225)**2)return false;
    }
  }
  return true;
}
export const RIVER_WAYPOINTS=[...WATERWAYS.flatMap(river=>river.controls.flatMap((point,i)=>{
  const previous=river.controls[Math.max(0,i-1)],next=river.controls[Math.min(river.controls.length-1,i+1)],dx=next.x-previous.x,dz=next.z-previous.z,l=Math.hypot(dx,dz)||1,r=point.width+2.2;
  return [-1,1].map(side=>({x:point.x-dz/l*r*side,z:point.z+dx/l*r*side}));
})),...BRIDGES.flatMap(bridge=>[bridgePoint(-bridge.halfLength-.6,0,bridge),bridgePoint(bridge.halfLength+.6,0,bridge)]),{x:-80,z:255}];
