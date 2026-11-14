import {CONFIG,keepDry} from './config.js?v=night-barn';
// Small visibility graph around the pond, shared by shelter routes.
export function dryRoute(from,to){
  const p=CONFIG.pond,normalize=a=>({x:(a.x-p.x)/p.rx,z:(a.z-p.z)/p.rz});
  const clear=(a,b)=>{const u=normalize(a),v=normalize(b),dx=v.x-u.x,dz=v.z-u.z,d=dx*dx+dz*dz,k=d?Math.max(0,Math.min(1,-(u.x*dx+u.z*dz)/d)):0;return Math.hypot(u.x+k*dx,u.z+k*dz)>=1.055;};
  const start={x:from.x,z:from.z};keepDry(start);
  const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>({x:p.x+x*p.rx*1.18,z:p.z+z*p.rz*1.18}));
  const nodes=[start,{...to},...corners],cost=nodes.map(()=>Infinity),previous=[],done=new Set();cost[0]=0;
  for(let i=0;i<nodes.length;i++){
    let u=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(u<0||cost[j]<cost[u]))u=j;
    if(u<0||!Number.isFinite(cost[u]))break;if(u===1)break;done.add(u);
    for(let v=0;v<nodes.length;v++)if(v!==u&&clear(nodes[u],nodes[v])){const c=cost[u]+Math.hypot(nodes[u].x-nodes[v].x,nodes[u].z-nodes[v].z);if(c<cost[v]){cost[v]=c;previous[v]=u;}}
  }
  const result=[];let i=1;while(i!==0&&i!==undefined){result.unshift({...nodes[i]});i=previous[i];}
  if(i===undefined)return [{...to}];
  if(Math.hypot(start.x-from.x,start.z-from.z)>.01)result.unshift(start);
  return result;
}
