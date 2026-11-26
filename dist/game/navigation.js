import {CONFIG,keepDry,pondPoint,pondLevel,isWater} from './config.js?v=windmill-1';
import {RIVER_WAYPOINTS,riverPathClear,segmentsCross} from './waterways.js?v=lake-bridge-1';
import {actorRadius,buildingAccess,buildingPathClear,buildingWaypoints,doorAt} from './building-collision.js?v=windmill-1';
const shore=Array.from({length:96},(_,i)=>pondPoint(i/96*Math.PI*2,1.055));
const clear=(a,b,radius,access=null)=>pondLevel(a)>=1.054&&pondLevel(b)>=1.054&&!shore.some((point,i)=>segmentsCross(a,b,point,shore[(i+1)%shore.length]))&&riverPathClear(a,b)&&buildingPathClear(a,b,CONFIG,{radius,access});
const networks=new Map();
function getNetwork(radius){
  if(networks.has(radius))return networks.get(radius);
  const p=CONFIG.pond,b=CONFIG.playerBounds;
  const candidates=[...[-1,1].flatMap(x=>[-1,1].map(z=>({x:p.x+x*p.rx*1.2,z:p.z+z*p.rz*1.2}))),...RIVER_WAYPOINTS,...buildingWaypoints(CONFIG,radius)];
  const points=[];
  for(const candidate of candidates){
    const point={...candidate};keepDry(point,{radius});
    if(point.x<b.minX||point.x>b.maxX||point.z<b.minZ||point.z>b.maxZ||isWater(point))continue;
    if(points.every(other=>Math.hypot(other.x-point.x,other.z-point.z)>.35))points.push(point);
  }
  const edges=points.map((a,i)=>points.map((b,j)=>i!==j&&clear(a,b,radius)?Math.hypot(b.x-a.x,b.z-a.z):Infinity));
  const graph={points,edges};networks.set(radius,graph);return graph;
}
// Cache the static bank/wall graph per body clearance. Only the start and
// destination connect dynamically; a doorway is opened only for that approach.
export function dryRoute(from,to){
  const radius=actorRadius(from),access=buildingAccess(from),goalAccess=doorAt(to,CONFIG)||access;
  const start={x:from.x,z:from.z},goal={x:to.x,z:to.z};
  keepDry(start,{radius,access});keepDry(goal,{radius,access:goalAccess});
  if(clear(start,goal,radius,goalAccess||access))return [goal];
  const graph=getNetwork(Math.ceil(radius*10)/10),nodes=[start,goal,...graph.points];
  const edges=nodes.map((a,i)=>nodes.map((b,j)=>i>1&&j>1?graph.edges[i-2][j-2]:i!==j&&clear(a,b,radius,i===1||j===1?goalAccess:access)?Math.hypot(b.x-a.x,b.z-a.z):Infinity));
  const cost=nodes.map(()=>Infinity),previous=[],done=new Set();cost[0]=0;
  for(let i=0;i<nodes.length;i++){
    let u=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(u<0||cost[j]<cost[u]))u=j;
    if(u<0||!Number.isFinite(cost[u]))break;if(u===1)break;done.add(u);
    for(let v=0;v<nodes.length;v++)if(!done.has(v)&&cost[u]+edges[u][v]<cost[v]){cost[v]=cost[u]+edges[u][v];previous[v]=u;}
  }
  if(!Number.isFinite(cost[1]))return [start];
  const result=[];let i=1;while(i!==0&&i!==undefined){result.unshift({...nodes[i]});i=previous[i];}
  if(Math.hypot(start.x-from.x,start.z-from.z)>.01)result.unshift(start);
  return result;
}

// A dry path can still put a corner inside a tree beside a building.
// Search around their combined footprints before handing targets to steering.
export function visitorRoute(from,goal,solids,original){
  const radius=actorRadius(from), access=doorAt(goal,CONFIG)||buildingAccess(from);
  const segmentClear=(a,b)=>{
    const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
    for(const o of solids){
      const r=o.radius+.12;
      if(o.x<Math.min(a.x,b.x)-r||o.x>Math.max(a.x,b.x)+r||
         o.z<Math.min(a.z,b.z)-r||o.z>Math.max(a.z,b.z)+r)continue;
      const t=length?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/length)):0;
      if(Math.hypot(a.x+t*dx-o.x,a.z+t*dz-o.z)<Math.min(r,Math.hypot(a.x-o.x,a.z-o.z))-.00001)return false;
      if(Math.hypot(b.x-o.x,b.z-o.z)<o.radius)return false;
    }
    return clear(a,b,radius,access);
  };
  if(original.every((p,i)=>segmentClear(i?original[i-1]:from,p)))return original;
  const bounds=CONFIG.playerBounds,step=2;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const start={x:from.x,z:from.z,cost:0,score:distance(from,goal)};
  const open=[start],best=new Map();
  while(open.length && best.size<4500){
    let index=0;
    for(let i=1;i<open.length;i++)if(open[i].score<open[index].score)index=i;
    const here=open.splice(index,1)[0];
    if(here.key && best.get(here.key)!==here.cost)continue;
    if(segmentClear(here,goal)){
      const route=[goal];
      for(let p=here;p.parent;p=p.parent)route.unshift({x:p.x,z:p.z});
      const result=[];let anchor=from;
      for(let i=0;i<route.length;i++){
        if(i+1<route.length && segmentClear(anchor,route[i+1]))continue;
        result.push(route[i]);anchor=route[i];
      }
      return result;
    }
    for(const dx of [-step,0,step])for(const dz of [-step,0,step]){
      if(!dx&&!dz)continue;
      const x=Math.round(here.x/step)*step+dx,z=Math.round(here.z/step)*step+dz;
      if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)continue;
      const key=x+','+z,p={x,z},cost=here.cost+distance(here,p);
      if(cost>=(best.get(key)??Infinity)||!segmentClear(here,p))continue;
      best.set(key,cost);open.push({...p,key,cost,score:cost+distance(p,goal),parent:here});
    }
  }
  return original;
}
