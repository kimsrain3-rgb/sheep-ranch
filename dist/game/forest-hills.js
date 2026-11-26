// Horizontal radii and summit rise, in outdoor world units.
export const hills=[
  [56,-73,10,15,3.2],[67,-32,13,19,4.4],[68,6,12,14,2.8],
  [-20,112,19,17,3.8],[-9,148,20,19,4.8],[-20,182,18,14,3.2]
];
export function forestHeight(x,z){
  if(z<-89||z>197||(z<95&&x<44)||(z>=95&&x>12))return 0;
  let height=0;
  for(const [cx,cz,rx,rz,rise] of hills){
    const u=(x-cx)/rx,v=(z-cz)/rz,r=u*u+v*v;
    if(r<1)height+=rise*(1-r)**2;
  }
  return height;
}
// Intersect the camera ray with each bounded hill, nearest surface first.
export function hillPick(view,x,y,w,h){
  const flat=view.ground(x,y,w,h),b=view.basis(w,h);
  const side=(x-b.cx)/b.f,v=(b.screenY-y)/b.f;
  const forward=v*b.sp+b.cp,dy=v*b.cp-b.sp;
  const dx=side*b.cy+forward*b.sy,dz=-side*b.sy+forward*b.cy;
  let best=flat?-b.height/dy:Infinity,hit=flat;
  const gap=t=>b.height+dy*t-forestHeight(b.x+dx*t,b.z+dz*t);
  for(const [cx,cz,rx,rz] of hills){
    const u=(b.x-cx)/rx,q=(b.z-cz)/rz,a=(dx/rx)**2+(dz/rz)**2;
    const k=u*dx/rx+q*dz/rz,disc=k*k-a*(u*u+q*q-1);
    if(disc<=0||a<1e-12)continue;
    let lo=Math.max(.8,(-k-Math.sqrt(disc))/a);
    const end=Math.min(best,(-k+Math.sqrt(disc))/a);
    for(let t=lo; t<end;){
      const next=Math.min(t+.45,end);
      if(gap(t)>=0&&gap(next)<=0){
        let hi=next;lo=t;
        for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(gap(mid)>0)lo=mid;else hi=mid;}
        best=hi;hit={x:b.x+dx*hi,z:b.z+dz*hi};break;
      }
      t=next;
    }
  }
  return hit;
}
