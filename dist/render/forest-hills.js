import {clipPondPolygon} from './pond.js';
import {hills,forestHeight} from '../game/forest-hills.js';

const meshes=[];
for(const [x,z,rx,rz,rise] of hills){
  const faces=[],bounds=[];
  for(const px of [x-rx,x+rx])for(const pz of [z-rz,z+rz])for(const y of [0,rise])bounds.push([px,pz,y]);
  meshes.push({bounds,faces});
  const point=(ring,sector)=>{
    const angle=sector*Math.PI/10;
    const px=x+rx*ring/6*Math.cos(angle),pz=z+rz*ring/6*Math.sin(angle);
    return [px,pz,forestHeight(px,pz)];
  };
  for(let r=1;r<=6;r++)for(let s=0;s<20;s++){
    const points=[point(r-1,s),point(r,s),point(r,s+1),point(r-1,s+1)];
    const [px,pz]=point(r-.5,s+.5);
    const shade=forestHeight(px+.5,pz)-forestHeight(px-.5,pz)+.5*(forestHeight(px,pz+.5)-forestHeight(px,pz-.5));
    faces.push({points,x:px,z:pz,shade});
  }
}
export function drawHills(c,view,w,h,weather){
  const palette=weather.kind==='snow'?[175,191,158]:weather.night?[79,99,66]:[118,150,83];
  const visible=[];
  const camera=view.basis(w,h);
  for(const mesh of meshes){
    const corners=mesh.bounds.map(([x,z,y])=>view.project(x,z,y,w,h));
    if(corners.every(p=>!p))continue;
    if(corners.every(Boolean)&&(corners.every(p=>p.x<0)||corners.every(p=>p.x>w)||corners.every(p=>p.y<0)||corners.every(p=>p.y>h)))continue;
    for(const face of mesh.faces){
      const ring=clipPondPolygon(face.points,camera);
      if(ring.length<3)continue;
      const points=ring.map(([x,z,y])=>view.project(x,z,y,w,h));
      if(points.some(p=>!p)||points.every(p=>p.x<0)||points.every(p=>p.x>w)||points.every(p=>p.y<0)||points.every(p=>p.y>h))continue;
      visible.push({points,depth:points.reduce((sum,p)=>sum+p.depth,0)/points.length,shade:face.shade});
    }
  }
  visible.sort((a,b)=>b.depth-a.depth);
  for(const {points,shade} of visible){
    c.fillStyle='rgb('+palette.map(v=>Math.round(v+shade*32)).join(',')+')';
    c.strokeStyle=c.fillStyle;c.lineWidth=.7;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();c.stroke();
  }
}
