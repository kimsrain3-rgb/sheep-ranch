// One quiet nighttime visitor: rest on the barn, fly to a tree, and return.
export function owlPosition(time, barn, tree){
  const roof={x:barn.x,z:barn.entrance.z,y:8.1};
  const branch={x:tree.x,z:tree.z,y:tree.size*1.05};
  const cycle=((time%72)+72)%72;
  if(cycle<25)return {...roof,flying:false};
  if(cycle<33)return flight(roof,branch,(cycle-25)/8);
  if(cycle<58)return {...branch,flying:false};
  if(cycle<66)return flight(branch,roof,(cycle-58)/8);
  return {...roof,flying:false};
}
function flight(a,b,t){
  const u=t*t*(3-2*t);
  return {x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,y:a.y+(b.y-a.y)*u+Math.sin(Math.PI*t)*4,flying:true};
}
export function drawOwl(c,p,time,flying){
  if(!p)return;
  c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
  const ell=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  const flap=flying?Math.sin(time*11)*.38:0;
  ell(-.38,-.48+flap,.34,.18,'#82664e');ell(.38,-.48+flap,.34,.18,'#82664e');
  ell(0,-.42,.42,.48,'#997858');
  poly([[-.34,-.69],[-.32,-1.04],[-.08,-.85]],'#997858');poly([[.34,-.69],[.32,-1.04],[.08,-.85]],'#997858');
  ell(0,-.25,.28,.23,'#d9c5a0');
  for(const x of [-.19,.19]){ell(x,-.65,.19,.22,'#eee1c4');ell(x,-.65,.075,.09,'#3e3830');ell(x+.023,-.68,.022,.025,'#fff9e8');}
  poly([[0,-.56],[-.075,-.49],[.075,-.49]],'#d6a45e');
  if(!flying){ell(-.19,.02,.13,.035,'#b38552');ell(.19,.02,.13,.035,'#b38552');}
  c.restore();
}
