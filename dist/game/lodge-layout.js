// Shared physical layout for first-person room geometry and walking clearance.
export const LODGE_ROOM=Object.freeze({halfWidth:5.5,depth:13.5,height:3.95,floorHeight:4.2,radius:.22});
export const LODGE_STAIRS=Object.freeze({x:3.65,z:10.5});
export const LODGE_OBSTACLES=Object.freeze({
  1:[
    {name:'bed',minX:-5,maxX:-2.25,minZ:2.9,maxZ:6.8},
    {name:'table',minX:2.05,maxX:4.8,minZ:3.0,maxZ:5.55},
    {name:'washstand',minX:-5,maxX:-3.3,minZ:.9,maxZ:2.2},
    {name:'bookcase',minX:-5.05,maxX:-3.75,minZ:9.0,maxZ:11.7},
    {name:'stove',minX:3.15,maxX:4.95,minZ:7,maxZ:8.8},
    {name:'stairs',minX:2.95,maxX:5.5,minZ:10.85,maxZ:13.5}
  ],
  2:[
    {name:'reading bench',minX:-4.85,maxX:-2.5,minZ:3.0,maxZ:5.1},
    {name:'tea table',minX:-.85,maxX:.85,minZ:6.2,maxZ:7.55},
    {name:'cabinet',minX:-5.05,maxX:-3.9,minZ:9.3,maxZ:11.9},
    {name:'stairwell',minX:2.95,maxX:5.5,minZ:10.85,maxZ:13.5},
    {name:'telescope',minX:2.55,maxX:3.3,minZ:-1.2,maxZ:-.5}
  ]
});

const rectangles=floor=>LODGE_OBSTACLES[floor].map(r=>({...r,minX:r.minX-LODGE_ROOM.radius,maxX:r.maxX+LODGE_ROOM.radius,minZ:r.minZ-LODGE_ROOM.radius,maxZ:r.maxZ+LODGE_ROOM.radius}));
const inside=(p,r)=>p.x>r.minX&&p.x<r.maxX&&p.z>r.minZ&&p.z<r.maxZ;
export function lodgeWalkable(p,floor=1){
  const inRoom=Math.abs(p.x)<=5.1&&p.z>=.45&&p.z<=13.08;
  const balcony=floor===2&&p.z>=-1.35&&p.z<.45&&(p.z>=-.15?Math.abs(p.x)<=.65:Math.abs(p.x)<=3.8);
  return (inRoom||balcony)&&!rectangles(floor).some(r=>inside(p,r));
}
function safePoint(point,floor){
  let p={x:Math.max(-5.1,Math.min(5.1,point.x)),z:Math.max(floor===2?-1.35:.55,Math.min(13.08,point.z))};
  if(floor===2&&p.z<.45)p.x=Math.max(p.z>=-.15?-.65:-3.8,Math.min(p.z>=-.15?.65:3.8,p.x));
  if(lodgeWalkable(p,floor))return p;
  const choices=[{x:0,z:p.z},...rectangles(floor).flatMap(r=>[
    {x:r.minX-.025,z:p.z},{x:r.maxX+.025,z:p.z},{x:p.x,z:r.minZ-.025},{x:p.x,z:r.maxZ+.025}
  ])].filter(candidate=>lodgeWalkable(candidate,floor));
  choices.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
  return choices[0]||{x:0,z:1};
}
function hitsRect(a,b,r){
  let lo=0,hi=1;
  for(const [key,min,max] of [['x',r.minX,r.maxX],['z',r.minZ,r.maxZ]]){
    const delta=b[key]-a[key];
    if(Math.abs(delta)<1e-10){if(a[key]<=min||a[key]>=max)return false;continue;}
    let u=(min-a[key])/delta,v=(max-a[key])/delta;if(u>v)[u,v]=[v,u];
    lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>=hi-1e-8)return false;
  }
  return hi>1e-8&&lo<1-1e-8;
}
function clear(a,b,floor){
  if(!lodgeWalkable(a,floor)||!lodgeWalkable(b,floor))return false;
  if(rectangles(floor).some(r=>hitsRect(a,b,r)))return false;
  // The balcony connects through the actual central doorway, not the wall.
  if(floor===2&&Math.min(a.z,b.z)<.45&&Math.max(a.z,b.z)>.45){
    const t=(.45-a.z)/(b.z-a.z);if(Math.abs(a.x+(b.x-a.x)*t)>.65)return false;
  }
  for(let i=1;i<8;i++)if(!lodgeWalkable({x:a.x+(b.x-a.x)*i/8,z:a.z+(b.z-a.z)*i/8},floor))return false;
  return true;
}
const networks=new Map();
function network(floor){
  if(networks.has(floor))return networks.get(floor);
  const points=rectangles(floor).flatMap(r=>[-.03,.03].flatMap((_,i)=>[-.03,.03].map((__,j)=>({x:i?r.maxX+.03:r.minX-.03,z:j?r.maxZ+.03:r.minZ-.03})))).filter(p=>lodgeWalkable(p,floor));
  if(floor===2)points.push({x:0,z:1},{x:0,z:-.7});
  const edges=points.map((a,i)=>points.map((b,j)=>i!==j&&clear(a,b,floor)?Math.hypot(b.x-a.x,b.z-a.z):Infinity));
  const graph={points,edges};networks.set(floor,graph);return graph;
}
export function lodgeRoute(from,to,floor=1){
  const start=safePoint(from,floor),goal=safePoint(to,floor);
  if(clear(start,goal,floor))return [goal];
  const graph=network(floor),nodes=[start,goal,...graph.points];
  const edges=nodes.map((a,i)=>nodes.map((b,j)=>i>1&&j>1?graph.edges[i-2][j-2]:i!==j&&clear(a,b,floor)?Math.hypot(b.x-a.x,b.z-a.z):Infinity));
  const distances=nodes.map(()=>Infinity),previous=[],done=new Set();distances[0]=0;
  for(let i=0;i<nodes.length;i++){
    let u=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(u<0||distances[j]<distances[u]))u=j;
    if(u<0||!Number.isFinite(distances[u]))break;if(u===1)break;done.add(u);
    for(let v=0;v<nodes.length;v++)if(!done.has(v)&&distances[u]+edges[u][v]<distances[v]){distances[v]=distances[u]+edges[u][v];previous[v]=u;}
  }
  if(!Number.isFinite(distances[1]))return [start];
  const result=[];for(let i=1;i!==0&&i!==undefined;i=previous[i])result.unshift({...nodes[i]});return result;
}
export function moveLodgePlayer(player,next,floor){
  if(lodgeWalkable(next,floor)){player.x=next.x;player.z=next.z;return true;}
  // A small manual step can slide along furniture, but cannot cross it.
  let moved=false;
  if(lodgeWalkable({x:next.x,z:player.z},floor)){player.x=next.x;moved=true;}
  if(lodgeWalkable({x:player.x,z:next.z},floor)){player.z=next.z;moved=true;}
  return moved;
}
