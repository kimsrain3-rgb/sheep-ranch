// Ground footprints match the exterior models. Padding includes the animal's
// body, so its fleece cannot enter a wall while its feet remain outside it.
export function actorRadius(a={}){
  if(a.isLamb||/^(sheep|lamb)-/.test(a.id||''))return Math.max(.3,1.35*(a.size||1));
  return a.type==='dog'?.55:a.type==='chicken'?.3:.4;
}
export function buildingAccess(a={}){
  if(a.buildingAccess)return a.buildingAccess;
  if(['shelter-go','shelter-exit'].includes(a.state))return 'barn';
  if(['coop-go','coop-exit'].includes(a.state))return 'coop';
  if(a.state==='lodge-go'||a.lodgeBound)return 'lodge';
  return null;
}
export function buildingFootprints(config){
  return [['barn',9.65,18,3.1],['coop',3.8,10.8,1.05],['lodge',5.6,13.5,1.2],['shed',5.75,10.8,1.5],['windmill',4,8,1.1]].filter(([kind])=>config[kind]).map(([kind,half,depth,doorHalf])=>{
    const b=config[kind];return {kind,left:b.x-half,right:b.x+half,front:b.entrance.z,back:b.entrance.z+depth,doorX:b.entrance.x,doorHalf};
  });
}
export function doorAt(point,config){
  return buildingFootprints(config).find(b=>Math.hypot(point.x-b.doorX,point.z-b.front)<.16)?.kind||null;
}
export function buildingSolids(config,radius=.4,access=null){
  return buildingFootprints(config).flatMap(b=>{
    const left=b.left-radius,right=b.right+radius,front=b.front-radius,back=b.back+radius;
    if(access!==b.kind)return [{kind:b.kind,left,right,front,back}];
    // Entry/exit controllers may reach the open front door, never the side or
    // back walls. Outdoor coordinates stop at the threshold before room entry.
    const gap=Math.max(.25,b.doorHalf-radius);
    return [
      {kind:b.kind,left,right:b.doorX-gap,front,back},
      {kind:b.kind,left:b.doorX+gap,right,front,back},
      {kind:b.kind,left:b.doorX-gap,right:b.doorX+gap,front:b.front+.35,back}
    ];
  });
}
export function keepOutsideBuildings(point,config,{radius=actorRadius(point),access=buildingAccess(point)}={}){
  const solids=buildingSolids(config,radius,access);
  const inside=(x,z,b)=>x>b.left&&x<b.right&&z>b.front&&z<b.back;
  if(!solids.some(b=>inside(point.x,point.z,b)))return point;
  // Padded neighboring walls may overlap in an alley that is too narrow for
  // a large sheep. Find the nearest point outside their union instead of
  // repeatedly pushing the animal from one building into the other.
  const xs=[point.x,...solids.flatMap(b=>[b.left-.025,b.right+.025])];
  const zs=[point.z,...solids.flatMap(b=>[b.front-.025,b.back+.025])];
  let best=null,bestDistance=Infinity;
  for(const x of xs)for(const z of zs){
    const d=(x-point.x)**2+(z-point.z)**2;
    if(d>=bestDistance||solids.some(b=>inside(x,z,b)))continue;
    best={x,z};bestDistance=d;
  }
  if(best){point.x=best.x;point.z=best.z;}
  return point;
}
function enters(a,b,box){
  let low=0,high=1;
  for(const [axis,min,max] of [['x',box.left,box.right],['z',box.front,box.back]]){
    const d=b[axis]-a[axis],p=a[axis];
    if(Math.abs(d)<1e-10){if(p<=min+1e-7||p>=max-1e-7)return false;continue;}
    const t1=(min+1e-7-p)/d,t2=(max-1e-7-p)/d;
    low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));
    if(low>=high)return false;
  }
  return high>0&&low<1;
}
export function buildingPathClear(a,b,config,{radius=actorRadius(a),access=buildingAccess(a)}={}){
  return !buildingSolids(config,radius,access).some(box=>enters(a,b,box));
}
export function buildingWaypoints(config,radius){
  return buildingFootprints(config).flatMap(b=>[-1,1].flatMap(x=>[-1,1].map(z=>({x:(x<0?b.left:b.right)+x*(radius+.45),z:(z<0?b.front:b.back)+z*(radius+.45)}))));
}
