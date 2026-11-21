import {isWater} from './config.js';
import {denSites} from './forest-hills.js';
// The plan’s four pin centres, read against P09 and the player boundary.
export const forestPins=[
  {id:'P14',x:51,z:-82},{id:'P12',x:68,z:-56},
  {id:'P11',x:68,z:-22},{id:'P13',x:68,z:19}
];
export function trailX(z){
  let i=1;
  while(i<forestPins.length-1 && z>forestPins[i].z)i++;
  const a=forestPins[i-1],b=forestPins[i];
  const u=Math.max(0,Math.min(1,(z-a.z)/(b.z-a.z)));
  return a.x+(b.x-a.x)*u*u*(3-2*u)+1.15*Math.sin(Math.PI*2*u);
}
export function inGrove(x,z,margin=0){
  return z>=-85-margin && z<=22+margin && Math.abs(x-trailX(z))<14+margin;
}
export function generator(seed){
  return ()=>((seed=seed*16807%2147483647)-1)/2147483646;
}
const random=generator(71239);
export const firs=[];
for(let row=0;row<3;row++)for(const side of [-1,1]){
  for(let z=-82+random()*3;z<22;z+=4.5+random()*3.3){
    const offset=3.3+row*4.0+random()*1.9;
    const height=13+random()*6;
    firs.push({x:trailX(z)+side*offset,z,height:height*1.5,width:height*(.35+random()*.12),
      radius:.3+random()*.18,variant:Math.floor(random()*7)});
  }
}
// Sweep a strip twice the fir footprint (107 × 28), curving along the inlet.
const birchRandom=generator(48131);
export const birches=[];
export const birchCenter=z=>-19+6*Math.sin((z-90)/107*Math.PI);
// Distance inside a scalloped woodland outline, with different shapes on all four sides.
export function birchDepth(x,z){
  const offset=x-birchCenter(z);
  const west=29+5*Math.sin(z*.11)+3*Math.cos(z*.19);
  const east=27+7*Math.sin(z*.105+1)+4*Math.cos(z*.21);
  const south=90+6*Math.sin(offset*.14)+4*Math.cos(offset*.25);
  const north=197+5*Math.sin(offset*.18)-3*Math.cos(offset*.23);
  return Math.min(west+offset,east-offset,z-south,north-z);
}
const edgeRandom=generator(97631);
for(let cell=0;cell<21;cell++){
  const z0=90+cell*107/21;
  for(let column=0;column<11;column++){
    const z=z0+(.12+.76*birchRandom())*107/21;
    const x=birchCenter(z)-28+(column+.12+.76*birchRandom())*56/11;
    const height=11+birchRandom()*6;
    const tree={x,z,height,width:height*.44,radius:.22+birchRandom()*.12,variant:Math.floor(birchRandom()*9)};
    const depth=birchDepth(x,z);
    if(depth<9){
      if(edgeRandom()>Math.max(0,(depth+1)/10))continue;
      const scale=.55+.45*Math.min(1,Math.max(0,depth/9));
      tree.height*=scale;tree.width*=scale;tree.radius*=scale;
    }
    birches.push(tree);
  }
}
// A few families of younger trees break away from the mature stand.
for(const [cx,cz] of [[-39,89],[1,85],[17,115],[19,157],[10,190],[-22,202],[-48,157]]){
  for(let i=0;i<3;i++){
    const x=cx+(edgeRandom()-.5)*7,z=cz+(edgeRandom()-.5)*7;
    if(isWater({x,z},2)||birches.some(t=>Math.hypot(t.x-x,t.z-z)<2)||
      denSites.some(p=>Math.hypot(p.x-x,p.z-z)<2))continue;
    const height=4+edgeRandom()*4;
    birches.push({x,z,height,width:height*.45,radius:.12+height*.012,variant:Math.floor(edgeRandom()*9)});
  }
}
const birchBounds={
  left:Math.min(...birches.map(p=>p.x))-1,right:Math.max(...birches.map(p=>p.x))+1,
  near:Math.min(...birches.map(p=>p.z))-1,far:Math.max(...birches.map(p=>p.z))+1
};
const allTrunks=[...firs,...birches];
// Snap a destination out of the solid wood; grazing the trunk slides along it.
export function clearTrunks(p){
  if(!inGrove(p.x,p.z,3)&&(p.x<birchBounds.left||p.x>birchBounds.right||p.z<birchBounds.near||p.z>birchBounds.far))return;
  for(const tree of allTrunks){
    const dx=p.x-tree.x,dz=p.z-tree.z,r=tree.radius+.24;
    if(Math.abs(dx)>=r || Math.abs(dz)>=r)continue;
    const d=Math.hypot(dx,dz);
    if(d<r){p.x=tree.x+(d?dx/d:1)*r;p.z=tree.z+(d?dz/d:0)*r;}
  }
}
// Route a walking segment around each intersected trunk. Trees are well spaced.
export function groveRoute(from,points){
  const route=[];let a=from;
  for(const original of points){
    const b={...original};clearTrunks(b);
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length>.001){
      const ux=dx/length,uz=dz/length,hits=[];
      for(const tree of allTrunks){
        const tx=tree.x-a.x,tz=tree.z-a.z,along=tx*ux+tz*uz,side=tz*ux-tx*uz;
        if(along<=0 || along>=length || Math.abs(side)>=tree.radius+.27)continue;
        const away=(side>=0?-1:1)*(tree.radius+.55);
        for(const pad of [-1,1]){
          const s=Math.max(0,Math.min(length,along+pad*(tree.radius+.56)));
          if(s===0||s===length)continue;
          hits.push({s,x:a.x+s*ux-uz*(side+away),z:a.z+s*uz+ux*(side+away)});
        }
      }
      hits.sort((p,q)=>p.s-q.s);route.push(...hits);
    }
    route.push(b);a=b;
  }
  return route;
}
// Animals cross the path, pause in cover, and return along the same clearing.
export function wildlifeAt(t){
  const animals = [-64,-32,4].map((z,i)=>{
    const phase=(t/(i===1?9:12)+i*.36)%(2*Math.PI),offset=2.45*Math.sin(phase);
    const speed=Math.abs(Math.cos(phase)),rabbit=i!==1;
    const beat=t*(rabbit?5.8:3.9)+i;
    return {x:trailX(z)+offset,z:z+.85*Math.sin(phase+.4),rabbit,
      direction:Math.cos(phase)>0?1:-1,hop:Math.max(0,Math.sin(beat))*speed*(rabbit?.24:.11),stride:Math.cos(beat)*speed};
  });
  // A short oval along the clear trail, just ahead of the forest entrance.
  const angle = t * .35;
  const z = -22 + 1.35 * Math.cos(angle);
  animals.push({
    fox: true,
    x: trailX(z) + 2.1 * Math.sin(angle),
    z,
    velocityX: .735 * Math.cos(angle),
    velocityZ: -.4725 * Math.sin(angle),
    frame: Math.floor(t * 10) % 36
  });
  return animals;
}
