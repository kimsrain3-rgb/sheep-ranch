import {CONFIG,pondPoint,pondLevel,pondEdge} from '../game/config.js?v=solid-buildings-2';

const TAU=Math.PI*2;
const p=CONFIG.pond;
const shore=(angle,scale=1,height=.025)=>{
  const point=pondPoint(angle,scale);
  return [point.x,point.z,height];
};
const rim=Array.from({length:96},(_,i)=>shore(i/96*TAU));
const pads=[[2.0,.77,.72],[2.15,.82,.62],[2.32,.76,.59],[2.48,.83,.77],[2.65,.78,.47],[3.55,.80,.7],[3.72,.75,.8],[3.90,.82,.66],[5.38,.77,.52],[5.58,.83,.55],[5.73,.74,.7]];
const reeds=[.18,.36,.62,.91,2.2,2.7,3.6,4.15,5.65].map((angle,i)=>({angle,i,point:shore(angle,.995)}));
// Short, staggered beds leave long stretches of bank open for drinking and views.
const nestBank=4.82;
const nest=pondPoint(nestBank,1.09);
const bankGrass=[];
const bedAreaScale=3;
const shoreLengthScale=Math.sqrt(bedAreaScale);
const innerBank=.99;
for(const [center,arc,originalRows] of [[3.12,.39,2],[nestBank,.53,3],[5.62,.31,2]]){
  const count=Math.ceil(arc*23*shoreLengthScale);
  const rows=Math.ceil((originalRows-1)*shoreLengthScale)+1;
  for(let row=0;row<rows;row++){
    for(let i=0;i<count;i++){
      const along=(i+(row%2)*.42)/(count-1)-.5;
      const originalAngle=center+arc*along;
      const angle=center+arc*shoreLengthScale*along;
      const seed=i*2.4+row*4.7+center;
      const originalRadius=innerBank+(originalRows-1)*.046*row/(rows-1)+.012*Math.sin(seed);
      // Sector area is proportional to angle times the difference of squared radii.
      // Account for the irregular shoreline so each bed gains the same area ratio.
      const edgeRatio=pondEdge(originalAngle)/pondEdge(angle);
      const radius=Math.sqrt(innerBank**2+(originalRadius**2-innerBank**2)*edgeRatio**2*bedAreaScale/shoreLengthScale);
      const point=pondPoint(angle,radius);
      if(Math.hypot(point.x-nest.x,point.z-nest.z)<.90)continue;
      bankGrass.push({...point,seed,size:(1.03+.29*Math.sin(seed))*(1-.64*Math.abs(along))});
    }
  }
}

function drawBankGrass(c,q,tuft,time){
  const width=q.s*tuft.size,height=2*width,wind=.09*Math.sin(time+tuft.seed);
  for(let layer=0;layer<2;layer++){
    c.fillStyle=layer?'#879452':'#5a7949';c.beginPath();
    for(let j=0;j<5;j++){
      const fan=(j-2)*.27+(layer-.5)*.12;
      const length=height*(.65+.29*Math.cos(j*2.3+tuft.seed+layer));
      const root=q.x+fan*width*.6,tip=root+(fan+wind)*length;
      c.moveTo(root-width*.055,q.y);
      c.quadraticCurveTo(root,q.y-length*.6,tip,q.y-length);
      c.quadraticCurveTo(root+width*.11,q.y-length*.36,root+width*.065,q.y);
      c.closePath();
    }
    c.fill();
  }
}

function drawShoreNest(c,q,withEggs){
  c.save();c.translate(q.x,q.y);c.scale(q.s,q.s);
  function oval(x,y,w,h,tilt,color){
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,tilt,0,TAU);c.fill();
  }
  oval(0,-.08,.46,.20,0,'#9b8257');
  oval(0,-.11,.36,.13,0,'#665a44');
  if(withEggs){
    oval(-.10,-.15,.07,.096,-.32,'#dcdcc2');
    oval(.05,-.16,.07,.098,.26,'#e8e3c9');
    oval(.17,-.12,.067,.086,.52,'#d3d6b9');
  }
  c.strokeStyle='#bc9e6b';c.lineWidth=.025;
  c.beginPath();
  for(let i=0;i<8;i++){
    const a=i/7*Math.PI;
    c.moveTo(Math.cos(a)*.39,Math.sin(a)*.15-.09);
    c.lineTo(Math.cos(a+.55)*.44,Math.sin(a+.55)*.16-.08);
  }
  c.stroke();c.restore();
}

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

function fillPondPolygon(c,project,camera,points,color){
  const clipped=clipPondPolygon(points,camera);
  if(clipped.length<3)return;
  const screen=clipped.map(([x,z,y])=>project(x,z,y));
  if(screen.some(point=>!point))return;
  c.fillStyle=color;c.beginPath();screen.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));c.closePath();c.fill();
}

export function pondWaterColors(sunset=false,night=false){
  return {shallow:sunset?'#8da99b':'#9ab9a9',deep:night?'#65918b':sunset?'#7b9e98':'#80b0a7'};
}

export function drawPondBank(c,project,camera,water=pondWaterColors()){
  const polygon=(points,color)=>fillPondPolygon(c,project,camera,points,color);
  polygon(rim.map(([x,z],i)=>{
    const width=1.04+.014*Math.sin(i/rim.length*TAU*3);
    return [p.x+(x-p.x)*width,p.z+(z-p.z)*width,.012];
  }),'#748e5c');
  polygon(rim,'#8f9e73');
  for(const [start,end] of [[1.3,1.88],[3.38,3.78]]){
    const beach=[...Array.from({length:17},(_,i)=>shore(start+(end-start)*i/16,1.014)),...Array.from({length:17},(_,i)=>shore(end-(end-start)*i/16,.974))];
    polygon(beach,'#b9b994');
  }
  polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.987,p.z+(z-p.z)*.987,.035]),water.shallow);
}

export function drawPond(c,project,time,{sunset=false,night=false,snow=false,month}={},camera){
  const polygon=(points,color)=>fillPondPolygon(c,project,camera,points,color);
  function stroke(points,color,width){
    const screen=points.map(([x,z,y])=>project(x,z,y));if(screen.some(point=>!point))return;
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();screen.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));c.stroke();
  }
  c.save();c.lineCap='round';c.lineJoin='round';
  const water=pondWaterColors(sunset,night);
  polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.94,p.z+(z-p.z)*.94,.04]),water.deep);
  polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.72-.3,p.z+(z-p.z)*.72+.2,.045]),'#6b9f993b');
  for(let i=0;i<13;i++){
    const z=p.z+(i/12-.5)*p.rz*1.45,x=p.x+Math.sin(i*2.4)*p.rx*.4;
    if(pondLevel({x,z})>.82)continue;
    const length=.4+(i%4)*.25,drift=Math.sin(time*.6+i)*.14;
    stroke([[x-length+drift,z,.055],[x+drift,z+.025,.055],[x+length*.7+drift,z,.055]],'#d4e6d450',1.1);
  }
  const plants=[];
  for(const tuft of bankGrass){
    const q=project(tuft.x,tuft.z,.04);
    if(q)plants.push({x:tuft.x,z:tuft.z,draw:()=>drawBankGrass(c,q,tuft,time)});
  }
  const nestView=project(nest.x,nest.z,.05);
  if(nestView)plants.push({...nest,draw:()=>drawShoreNest(c,nestView,month>=3&&month<=6)});
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
  for(const plant of plants)plant.depth=project(plant.x,plant.z)?.depth??-1;
  plants.sort((a,b)=>b.depth-a.depth);
  for(const plant of plants)plant.draw();
  if(snow)polygon(rim.map(([x,z])=>[p.x+(x-p.x)*.94,p.z+(z-p.z)*.94,.08]),'#dce5d124');
  c.restore();
}
