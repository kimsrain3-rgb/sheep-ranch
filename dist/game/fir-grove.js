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
    firs.push({x:trailX(z)+side*offset,z,height,width:height*(.35+random()*.12),
      radius:.3+random()*.18,variant:Math.floor(random()*7)});
  }
}
// Snap a destination out of the solid wood; grazing the trunk slides along it.
export function clearTrunks(p){
  if(!inGrove(p.x,p.z,3))return;
  for(const tree of firs){
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
      for(const tree of firs){
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
