import {CONFIG,pondPoint,pondLevel} from '../game/config.js?v=solid-buildings-2';

const TAU=Math.PI*2;
const p=CONFIG.pond;
const shore=(angle,scale=1,height=.025)=>{
  const point=pondPoint(angle,scale);
  return [point.x,point.z,height];
};
const rim=Array.from({length:96},(_,i)=>shore(i/96*TAU));
const pads=[[2.0,.77,.72],[2.15,.82,.62],[2.32,.76,.59],[2.48,.83,.77],[2.65,.78,.47],[3.55,.80,.7],[3.72,.75,.8],[3.90,.82,.66],[5.38,.77,.52],[5.58,.83,.55],[5.73,.74,.7]];
const reeds=[.18,.36,.62,.91,2.2,2.7,3.6,4.15,5.65].map((angle,i)=>({angle,i,point:shore(angle,.995)}));

// Clip world polygons at the camera's near plane, so a large pond stays visible
// when some of its bank passes behind the camera.
export function clipPondPolygon(points,camera){
  if(!camera)return points;
  const depth=point=>((point[0]-camera.x)*camera.sy+(point[1]-camera.z)*camera.cy)*camera.cp-(point[2]-camera.height)*camera.sp;
  const out=[];let previous=points[points.length-1],pd=depth(previous);
  for(const current of points){
    const cd=depth(current),inside=cd>=.82,wasInside=pd>=.82;
    if(inside!==wasInside){
      const u=(.82-pd)/(cd-pd);
      out.push(previous.map((v,i)=>v+(current[i]-v)*u));
    }
    if(inside)out.push(current);
    previous=current;pd=cd;
  }
  return out;
}

export function drawPond(c,project,time,{sunset=false,night=false,snow=false}={},camera){
  function polygon(points,color){
    const clipped=clipPondPolygon(points,camera);
    if(clipped.length<3)return;
    const screen=clipped.map(([x,z,y])=>project(x,z,y));
    if(screen.some(point=>!point))return;
    c.fillStyle=color;c.beginPath();screen.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));c.closePath();c.fill();
  }
  function stroke(points,color,width){
    const screen=points.map(([x,z,y])=>project(x,z,y));if(screen.some(point=>!point))return;
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();screen.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));c.stroke();
  }
  c.save();c.lineCap='round';c.lineJoin='round';
  polygon(rim.map(([x,z],i)=>{
    const width=1.04+.014*Math.sin(i/rim.length*TAU*3);
    return [p.x+(x-p.x)*width,p.z+(z-p.z)*width,.012];
  }),'#748e5c');
  polygon(rim,'#8f9e73');
  for(const [start,end] of [[1.3,1.88],[3.38,3.78]]){
    const beach=[...Array.from({length:17},(_,i)=>shore(start+(end-start)*i/16,1.014)),...Array.from({length:17},(_,i)=>shore(end-(end-start)*i/16,.974))];
    polygon(beach,'#b9b994');
  }
  polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.987,p.z+(z-p.z)*.987,.035]),sunset?'#8da99b':'#9ab9a9');
  polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.94,p.z+(z-p.z)*.94,.04]),night?'#65918b':sunset?'#7b9e98':'#80b0a7');
  polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.72-.3,p.z+(z-p.z)*.72+.2,.045]),'#6b9f993b');
  for(let i=0;i<13;i++){
    const z=p.z+(i/12-.5)*p.rz*1.45,x=p.x+Math.sin(i*2.4)*p.rx*.4;
    if(pondLevel({x,z})>.82)continue;
    const length=.4+(i%4)*.25,drift=Math.sin(time*.6+i)*.14;
    stroke([[x-length+drift,z,.055],[x+drift,z+.025,.055],[x+length*.7+drift,z,.055]],'#d4e6d450',1.1);
  }
  const plants=[];
  for(const [i,pad] of pads.entries()){
    const [shoreAngle,scale,r]=pad,{x,z}=pondPoint(shoreAngle,scale);
    plants.push({x,z,draw(){
      const angle=i*2.37+Math.sin(time*.25+i)*.035,height=.065+Math.sin(time*.9+i)*.008;
      const leaf=[[x,z,height],...Array.from({length:33},(_,j)=>{
        const a=angle+.26+j/32*(TAU-.52);return [x+Math.cos(a)*r,z+Math.sin(a)*r*.82,height];
      })];
      polygon(leaf,i%3===0?'#87a76c':i%2?'#779a61':'#638a58');
      for(const a of [angle+1.3,angle+2.6,angle+4.1])stroke([[x,z,height+.005],[x+Math.cos(a)*r*.75,z+Math.sin(a)*r*.62,height+.005]],'#b2bf874d',.8);
      if(i!==3&&i!==6)return;
      const q=project(x,z,height+.04);if(!q)return;
      c.save();c.translate(q.x,q.y);c.scale(q.s,q.s);
      for(let j=0;j<7;j++){
        const a=j/7*TAU;c.fillStyle=j%2?'#eed2ce':'#f9e5d8';c.beginPath();c.ellipse(Math.cos(a)*.13,-.12+Math.sin(a)*.07,.09,.17,Math.cos(a)*.75,0,TAU);c.fill();
      }
      c.fillStyle='#d4b568';c.beginPath();c.ellipse(0,-.13,.095,.065,0,0,TAU);c.fill();c.restore();
    }});
  }
  for(const clump of reeds){
    const [x,z]=clump.point;
    plants.push({x,z,draw(){
      const base=project(x,z,.05);if(!base)return;
      for(let j=0;j<7;j++){
        const spread=(j-3)*.085,wind=Math.sin(time*1.1+clump.i+j*.4)*.1,height=.55+(j%3)*.23;
        const tip=project(x+spread+wind,z+(j%2)*.08,height);if(!tip)continue;
        c.strokeStyle=j%2?'#5c8053':'#78945d';c.lineWidth=Math.max(.8,base.s*.026);c.beginPath();c.moveTo(base.x+spread*base.s*.4,base.y);c.quadraticCurveTo(base.x+(spread+wind)*base.s*.7,base.y-height*base.s*.55,tip.x,tip.y);c.stroke();
        if(j%3===0){
          c.strokeStyle='#927648';c.lineWidth=Math.max(1.4,base.s*.065);c.beginPath();c.moveTo(tip.x,tip.y+base.s*.14);c.lineTo(tip.x,tip.y+base.s*.025);c.stroke();
        }
      }
    }});
  }
  for(let i=0;i<9;i++){
    const a=[.30,.45,.57,2.66,2.83,3.65,3.82,5.31,5.48][i],[x,z]=shore(a,1.015),radius=.22+i%3*.11;
    plants.push({x,z,draw(){
      const q=project(x,z,.035);if(!q)return;
      c.fillStyle=i%2?'#92977b':'#a5a58a';c.beginPath();c.ellipse(q.x,q.y-q.s*radius*.28,q.s*radius,q.s*radius*.52,-.12,0,TAU);c.fill();
      c.fillStyle='#c5c3a46b';c.beginPath();c.ellipse(q.x-q.s*radius*.18,q.y-q.s*radius*.48,q.s*radius*.65,q.s*radius*.19,-.2,0,TAU);c.fill();
    }});
  }
  plants.sort((a,b)=>(project(b.x,b.z)?.depth??-1)-(project(a.x,a.z)?.depth??-1));
  for(const plant of plants)plant.draw();
  if(snow)polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.94,p.z+(z-p.z)*.94,.08]),'#dce5d124');
  c.restore();
}
