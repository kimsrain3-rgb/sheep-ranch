import {WATERWAYS} from '../game/waterways.js?v=river-14';
import {clipPondPolygon,pondWaterColors} from './pond.js?v=water-join-1';
const meshes=WATERWAYS.map(river=>{
  let length=0;
  const points=river.points.map((point,i)=>{
    if(i)length+=Math.hypot(point.x-river.points[i-1].x,point.z-river.points[i-1].z);
    const before=river.points[Math.max(0,i-1)],after=river.points[Math.min(river.points.length-1,i+1)],dx=after.x-before.x,dz=after.z-before.z,d=Math.hypot(dx,dz)||1;
    return {...point,nx:-dz/d,nz:dx/d,length};
  });
  return {points,length};
});
function polygon(c,project,points,color,camera){
  const clipped=clipPondPolygon(points,camera);if(clipped.length<3)return;
  const screen=clipped.map(([x,z,y])=>project(x,z,y));if(screen.some(p=>!p))return;
  c.fillStyle=color;c.beginPath();screen.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
}
export function drawRiverMountains(c,project,camera){
  const ranges=[
    {z:345,color:'#9eafa4',peaks:[[-240,0],[-205,31],[-170,18],[-140,57],[-110,27],[-77,65],[-42,36],[-8,47],[35,12],[70,0]]},
    {z:267,color:'#839d8c',peaks:[[-190,0],[-160,24],[-130,13],[-107,38],[-86,9],[-66,37],[-35,18],[-7,25],[27,0]]}
  ];
  for(const range of ranges){
    const points=[[range.peaks[0][0],range.z,0],...range.peaks.map(([x,y])=>[x,range.z,y]),[range.peaks.at(-1)[0],range.z,0]];
    polygon(c,project,points,range.color,camera);
  }
}
function ribbon(c,project,river,scale,color,height,camera){
  const side=sign=>river.points.map(p=>[p.x+p.nx*p.width*scale*sign,p.z+p.nz*p.width*scale*sign,height]);
  polygon(c,project,[...side(1),...side(-1).reverse()],color,camera);
}
export function drawRiverBanks(c,project,camera){
  for(const river of meshes){
    ribbon(c,project,river,1.30,'#7c9566',.012,camera);
    ribbon(c,project,river,1.12,'#a3af88',.02,camera);
  }
}
export function drawWaterways(c,project,time,camera,water=pondWaterColors()){
  c.save();c.lineCap='round';
  for(const river of meshes){
    ribbon(c,project,river,1,water.shallow,.035,camera);
    ribbon(c,project,river,.85,water.deep,.045,camera);
    for(let i=0;i<24;i++){
      const progress=(time*1.45+i/24*river.length)%river.length;
      const index=Math.max(1,river.points.findIndex(p=>p.length>=progress)),a=river.points[index-1],b=river.points[index];
      const t=(progress-a.length)/(b.length-a.length||1),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
      const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1,offset=Math.sin(i*2.3)*a.width*.42;
      const tail=project(x-dx/d*.7+a.nx*offset,z-dz/d*.7+a.nz*offset,.055),head=project(x+dx/d*.45+a.nx*offset,z+dz/d*.45+a.nz*offset,.055);
      if(!tail||!head)continue;
      c.strokeStyle='#e3eee16b';c.lineWidth=Math.max(.65,head.s*.018);c.beginPath();c.moveTo(tail.x,tail.y);c.lineTo(head.x,head.y);c.stroke();
    }
  }
  c.restore();
}
