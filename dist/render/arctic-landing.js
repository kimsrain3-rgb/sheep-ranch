import {drawHarpSeal} from './harp-seal.js';
import {arcticCamera,APPROACH_START,DOCK,FLOOR,ICE} from '../game/arctic-landing.js';
import {TRAM_STOP} from '../game/tram-station.js';
import {drawVisitor,visitorPose} from '../visitor.js?v=limb-light-1';
import {clippedPolygon,drawBuilding3D} from './buildings-three.js?v=tram-station-1';

const ox=TRAM_STOP.x,oz=TRAM_STOP.z;
const bergs=Array.from({length:19},(_,i)=>{
  const a=i*2.39996,r=36+(i%5)*6;
  return {x:Math.sin(a)*r,z:Math.cos(a)*r,size:2.5+(i%4)*1.45};
});
export function drawArctic(canvas,s,elapsed){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return;
  const ratio=Math.min(window.devicePixelRatio||1,1.5);
  const pw=Math.round(w*ratio),ph=Math.round(h*ratio);
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
  const c=canvas.getContext('2d'),v=arcticCamera(s,w,h),b=v.basis(w,h);
  c.setTransform(pw/w,0,0,ph/h,0,0);
  const project=(x,z,y=0)=>v.project(x,z,y,w,h);
  function face(color,vertices){
    const world=vertices.map(([x,z,y])=>[ox+x,oz+z,y]);
    const points=clippedPolygon(world,b,.13);
    if(points.length<3)return;
    c.beginPath();
    points.forEach((p,i)=>{const q=project(...p);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);});
    c.closePath();c.fillStyle=color;c.fill();
  }
  function slab(color,x1,z1,x2,z2,y){
    face(color,[[x1,z1,y],[x2,z1,y],[x2,z2,y],[x1,z2,y]]);
  }
  const horizon=b.screenY-b.f*Math.tan(v.pitch);
  const sky=c.createLinearGradient(0,0,0,Math.max(1,horizon));
  sky.addColorStop(0,'#79b8ce');sky.addColorStop(.78,'#cde6e6');sky.addColorStop(1,'#f4e8d3');
  c.fillStyle=sky;c.fillRect(0,0,w,h);
  const sea=c.createLinearGradient(0,horizon,0,h);
  sea.addColorStop(0,'#91c8ce');sea.addColorStop(.6,'#4e99ad');sea.addColorStop(1,'#387c93');
  c.fillStyle=sea;c.fillRect(0,horizon,w,h-horizon);
  const depth=p=>(ox+p.x-b.x)*b.sy+(oz+p.z-b.z)*b.cy;
  for(const {x,z,size:k} of [...bergs].sort((a,d)=>depth(d)-depth(a))){
    face('#a6ced8',[[x-k,z,0],[x-.48*k,z,.68*k],[x+.12*k,z,.89*k],[x+k,z,.07*k],[x+.55*k,z-.3*k,-.08]]);
    face('#e4f4f2',[[x-k,z,0],[x-.48*k,z,.68*k],[x+.12*k,z,.89*k],[x-.12*k,z-.12*k,.45*k],[x-.52*k,z,0]]);
    face('#bedfe3',[[x-k,z,0],[x+.65*k,z,-.02],[x+.78*k,z-.35*k,-.02],[x-.46*k,z-.34*k,-.02]]);
  }
  for(let i=0;i<68;i++){
    const x=(i*37%79)-38,z=(i*17%47)-26;
    const sway=.15*Math.sin(s.clock*.8+i);
    slab('#b4dada99',x+sway,z,x+.4+i%4+sway,z+.045,.01);
  }
  // Sleepers and iron are visible through ten centimetres of shallow water.
  for(let x=-35;x<35;x+=.74)slab('#71989a',x,-.94,x+.14,.94,-.14);
  for(const z of [-.56,.56])slab('#658d96',-35,z-.04,35,z+.04,-.10);
  const remaining=Math.max(0,(16-elapsed)/(16-APPROACH_START));
  const offset=-8*remaining*remaining;
  // Bright, short arcs at the bow and behind the wheels remain legible
  // on a phone. As the tram settles, the wake gives way to gentle lapping.
  const strength=s.phase==='approach'?1:Math.max(.30,1-(s.clock-3)*.30);
  for(const end of [-1,1]){
    for(let i=0;i<3;i++){
      const phase=(s.clock*.52+i/3)%1;
      const x=offset+end*(3.32+phase*1.25),spread=.36+phase*.52;
      const arc=[[x-end*.52,1.04+spread],[x,1.15],[x+end*.25,.50],[x+end*.26,-.30],[x,-.94],[x-end*.45,-1.18-spread]];
      const edge=arc.map(([px,pz])=>[px,pz,.025]);
      const inner=arc.slice().reverse().map(([px,pz])=>[px-end*.09,pz*.96,.025]);
      face('rgba(224,251,247,'+((1-phase)*strength*.82)+')',[...edge,...inner]);
    }
  }
  // The irregular outer snow lip surrounds the entire playable rectangle.
  const coast=[[-17,5],[-13,3.48],[-5,3.65],[4.8,3.60],[9,3.32],[15,3.59],[17,6],[15,14],[16,21],[11,25],[-9,24],[-16,22],[-17,13]];
  face('#acd4db',coast.map(([x,z])=>[x,z,-.10]));
  face('#e5f1ef',coast.map(([x,z])=>[x,z,FLOOR]));
  for(let i=0;i<48;i++){
    const x=ICE.left+(i*73%163)/163*27,z=4+(i*51%109)/109*18;
    face(i%3?'#f4f8f2':'#d0e4e5',[[x,z,.15],[x+.38,z+.045,.15],[x+1.05,z+.02,.15],[x+.28,z+.12,.15]]);
  }
  for(let i=0;i<24;i++){
    const x=DOCK.left+i*(DOCK.right-DOCK.left)/24;
    slab(['#997653','#ac8964','#a07e5b','#b7936c'][i%4],x,DOCK.front,x+(DOCK.right-DOCK.left)/24-.013,DOCK.back,FLOOR+.012);
  }
  // Render the original coach shifted along the rails while it brakes.
  const cameraX=v.target.x;
  const outside=['walk','disembark','toTram','board','inside'].includes(s.phase);
  const key=[pw,ph,b.x-offset,b.z,b.height,b.sp,b.sy,b.cy,b.f,outside,!!s.returnPath].join(',');
  if(s.tramKey!==key){
    s.tramImage??=document.createElement('canvas');
    const image=s.tramImage;
    if(image.width!==pw||image.height!==ph){image.width=pw;image.height=ph;}
    const ctx=image.getContext('2d');
    ctx.setTransform(pw/w,0,0,ph/h,0,0);ctx.clearRect(0,0,w,h);
    try{
      v.target.x-=offset;
      drawBuilding3D(ctx,'tram',project,v,w,h,{shadow:false});
    }finally{v.target.x=cameraX;}
    s.tramKey=key;
  }
  c.drawImage(s.tramImage,0,0,w,h);
  const feet=outside&&project(ox+s.x,oz+s.z,s.height+.025);
  const pup=s.seal, paws=project(ox+pup.x,oz+pup.z,FLOOR);
  const seal=()=>drawHarpSeal(c,paws,pup,v.yaw,s.clock);
  if(paws&&(!feet||paws.depth>=feet.depth))seal();
  if(feet)drawVisitor(c,feet,{time:s.clock,walking:s.walking,label:false,pose:visitorPose(s.headingX,s.headingZ,v.yaw)});
  if(paws&&feet&&paws.depth<feet.depth)seal();
}
