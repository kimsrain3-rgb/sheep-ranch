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
