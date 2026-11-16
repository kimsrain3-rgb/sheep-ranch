// The Blender mesh is projected through the meadow camera so it turns with the rest of the game.
let model=null;

const toSrgb=value=>value<=.0031308?value*12.92:1.055*value**(1/2.4)-.055;
const color=(rgb,shade)=>`rgb(${rgb.map(value=>Math.round(255*Math.max(0,Math.min(1,toSrgb(value)*shade)))).join(',')})`;

export function prepareBarnModel(data){
  if(!Array.isArray(data?.vertices)||!Array.isArray(data?.faces)||!Array.isArray(data?.materials))throw Error('Invalid barn mesh');
  const vertices=data.vertices;
  // The indoor walk space is the main room. Undo the outdoor footprint scaling.
  const interiorVertices=vertices.map(([x,z,y])=>[(x/1.2-1.5)*1.6,z/.82-3.112,y/.82]);
  const faces=data.faces.map(([indices,material])=>{
    const a=vertices[indices[0]],b=vertices[indices[1]],d=vertices[indices[2]];
    if(!a||!b||!d||!data.materials[material])throw Error('Invalid barn face');
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[d[0]-a[0],d[1]-a[1],d[2]-a[2]];
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...n)||1,up=n[2]/length;
    const light=Math.max(0,(-.35*n[0]-.55*n[1]+.75*n[2])/length),shade=.7+.3*light;
    const rgb=data.materials[material],roof=(material===2||material===3)&&up>.25;
    const snow=roof?rgb.map((value,i)=>value*.24+[.92,.94,.91][i]*.76):rgb;
    const wet=roof?rgb.map(value=>value*.78):rgb;
    const indoor=indices.map(index=>interiorVertices[index]);
    const center=[0,1,2].map(axis=>indoor.reduce((sum,point)=>sum+point[axis],0)/indoor.length);
    const roofPanel=(material===2||material===3)&&length>20;
    const immersive=center[0]>-10.1&&center[1]>-.9&&center[1]<18.6&&(center[2]<7.7||roofPanel)&&(material!==2&&material!==3||roofPanel);
    return {indices,immersive,styles:[color(rgb,shade),color(rgb,shade*.52),color(snow,shade),color(snow,shade*.52),color(wet,shade),color(wet,shade*.52)]};
  });
  const bounds=[0,1,2].map(axis=>[Math.min(...vertices.map(vertex=>vertex[axis])),Math.max(...vertices.map(vertex=>vertex[axis]))]);
  return {vertices,interiorVertices,faces,bounds};
}

export async function loadBarnModel(){
  try{
    const response=await fetch(new URL('../assets/models/sheep-barn-mesh.json',import.meta.url));
    if(!response.ok)throw Error(`Barn mesh HTTP ${response.status}`);
    model=prepareBarnModel(await response.json());
  }catch(error){console.warn('Barn model unavailable; using painted shelter.',error);}
}

export function hasBarnModel(){return !!model;}

export function drawBarnModel(c,project,origin,{night=false,snow=false,wet=false,inside=0,total=0}={}){
  if(!model)return null;
  const [xs,zs,ys]=model.bounds;
  const box=[];
  for(const x of xs)for(const z of zs)for(const y of ys)box.push(project(origin.x+x,origin.z+z,y));
  const screenWidth=c.canvas.clientWidth||c.canvas.width,screenHeight=c.canvas.clientHeight||c.canvas.height||Infinity;
  if(box.every(Boolean)&&(
    Math.max(...box.map(p=>p.x)) < -100 || Math.min(...box.map(p=>p.x)) > screenWidth+100 ||
    Math.max(...box.map(p=>p.y)) < -100 || Math.min(...box.map(p=>p.y)) > screenHeight+100
  ))return null;
  const points=model.vertices.map(([x,z,y])=>project(origin.x+x,origin.z+z,y));
  const visible=[];
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const p of points)if(p){left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);}
  if(left===Infinity)return null;
  if(right < -100 || left > screenWidth+100 || bottom < -100 || top > screenHeight+100)return null;
  const corners=[[-9.7,0],[9.7,0],[9.7,18],[-9.7,18]].map(([x,z])=>project(origin.x+x,origin.z+z,.01));
  c.save();
  if(corners.every(Boolean)){
    c.fillStyle='#233e292b';c.beginPath();
    corners.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
  }
  for(let i=0;i<model.faces.length;i++){
    const face=model.faces[i],p=face.indices.map(index=>points[index]);
    if(p.every(Boolean))visible.push({face,points:p,depth:p.reduce((sum,item)=>sum+item.depth,0)/p.length});
  }
  visible.sort((a,b)=>b.depth-a.depth);
  const style=(snow?2:wet?4:0)+(night?1:0);
  for(const {face,points:p} of visible){
    c.fillStyle=face.styles[style];c.beginPath();
    p.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));
    c.closePath();c.fill();
  }
  const label=project(origin.x,origin.z,5.2);
  if(label&&label.x>-180&&label.x<c.canvas.width+180){
    const size=Math.max(10,Math.min(19,label.s*.43));
    c.font=`${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';
    const caption=`큰 양들의 축사 · 쉬는 양 ${inside} / ${total}`;
    const width=c.measureText(caption).width+18;
    c.fillStyle=night?'#304b3bea':'#3b563eea';
    c.fillRect(label.x-width/2,label.y-size*.8,width,size*1.7);
    c.fillStyle='#fff8df';c.fillText(caption,label.x,label.y+size*.05);
  }
  c.restore();
  return {x:(left+right)/2,y:bottom,w:right-left,h:bottom-top};
}

const near=.12;
function clipInteriorFace(indices,coords,b){
  const original=indices.map(index=>coords[index]);
  const clipped=[];
  for(let i=0;i<original.length;i++){
    const a=original[(i+original.length-1)%original.length],d=original[i];
    const aInside=a.depth>=near,dInside=d.depth>=near;
    if(aInside!==dInside){
      const t=(near-a.depth)/(d.depth-a.depth);
      clipped.push({side:a.side+(d.side-a.side)*t,vertical:a.vertical+(d.vertical-a.vertical)*t,depth:near});
    }
    if(dInside)clipped.push(d);
  }
  if(clipped.length<3)return null;
  return clipped.map(point=>({x:b.cx+point.side*b.f/point.depth,y:b.screenY-point.vertical*b.f/point.depth,depth:point.depth}));
}

export function drawBarnImmersiveModel(c,W,H,view,{night=false}={}){
  if(!model)return false;
  c.fillStyle=night?'#423c35':'#8b806b';c.fillRect(0,0,W,H);
  const b=view.basis(W,H);
  const coords=model.interiorVertices.map(([x,z,y])=>{
    const dx=x-b.x,dz=z-b.z,forward=dx*b.sy+dz*b.cy,side=dx*b.cy-dz*b.sy,up=y-b.height;
    return {side,vertical:up*b.cp+forward*b.sp,depth:forward*b.cp-up*b.sp};
  });
  const visible=[];
  for(const face of model.faces){
    if(!face.immersive)continue;
    const polygon=clipInteriorFace(face.indices,coords,b);
    if(polygon)visible.push({face,polygon,depth:polygon.reduce((sum,point)=>sum+point.depth,0)/polygon.length});
  }
  visible.sort((a,b)=>b.depth-a.depth);
  c.save();
  for(const {face,polygon} of visible){
    c.fillStyle=face.styles[night?1:0];c.beginPath();
    polygon.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));
    c.closePath();c.fill();
  }
  const projectPoint=([x,z,y])=>view.project(x,z,y,W,H);
  const line=(a,d,stroke,width)=>{
    const p=projectPoint(a),q=projectPoint(d);
    if(!p||!q)return;
    c.strokeStyle=stroke;c.lineWidth=Math.max(1,Math.min(9,(p.s+q.s)*width/2));
    c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();
  };
  const pane=(corners)=>{
    const p=corners.map(projectPoint);if(!p.every(Boolean))return;
    c.fillStyle=night?'#c8a66f':'#829b98';c.beginPath();
    p.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));
    c.closePath();c.fill();
    c.strokeStyle='#648073';c.lineWidth=Math.max(2,Math.min(7,p[0].s*.07));c.stroke();
    const mid=(a,d)=>[(a[0]+d[0])/2,(a[1]+d[1])/2,(a[2]+d[2])/2];
    line(mid(corners[0],corners[1]),mid(corners[3],corners[2]),'#d5d4b8',.045);
    line(mid(corners[0],corners[3]),mid(corners[1],corners[2]),'#d5d4b8',.045);
  };
  for(const x of [-5.2,5.2])pane([[x-.65,17.86,2],[x+.65,17.86,2],[x+.65,17.86,3.4],[x-.65,17.86,3.4]]);
  for(const x of [-9.53,9.53])for(const z of [3.8,9,14.2])pane([[x,z-.58,2],[x,z+.58,2],[x,z+.58,3.25],[x,z-.58,3.25]]);
  for(const z of [3.5,9,14.5]){
    line([-9.55,z,4.14],[9.55,z,4.14],'#745238',.11);
    line([-9.55,z,4.14],[0,z,7.55],'#745238',.085);
    line([0,z,7.55],[9.55,z,4.14],'#745238',.085);
  }
  for(let z=2;z<18;z+=2)line([-9.5,z,.11],[9.5,z,.11],'#806b51',.012);
  c.restore();
  return true;
}
