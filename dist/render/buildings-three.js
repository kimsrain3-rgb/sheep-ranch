import {ROOM_DOORS} from '../game/doorway.js';
import {FLIGHT,LODGE_ROOM} from '../game/lodge-layout.js?v=lodge-flight-1';
import {createLodgeRoomModel} from './lodge-room-model.js?v=lodge-stair-scale-1';
import * as THREE from '../vendor/three/three.module.js';
import {createBarnModel,createBarnRoomModel,createLodgeModel,createLodgeDoor,createCoopModel,createFarmRoomModel} from './building-models.js?v=entry-motion-1';
import {CONFIG} from '../game/config.js?v=windmill-1';
import {createWindmill,createSails,axle} from './windmill.js';
import {windmillStage,windmillStatus} from '../game/windmill-construction.js';

// The existing Canvas actors and these Three.js meshes use exactly the same
// projection. A single transparent WebGL canvas is composited at each building's
// depth-sorted position, so it cannot cover foreground sheep with a full overlay.
export function syncBuildingCamera(camera,basis,crop,near=.8,far=1800){
  camera.position.set(basis.x,basis.height,-basis.z);
  camera.up.set(0,1,0);
  camera.lookAt(basis.x+basis.sy*basis.cp,basis.height-basis.sp,-basis.z-basis.cy*basis.cp);
  camera.near=near;camera.far=far;
  camera.projectionMatrix.set(
    2*basis.f/crop.w,0,1-2*(basis.cx-crop.x)/crop.w,0,
    0,2*basis.f/crop.h,2*(basis.screenY-crop.y)/crop.h-1,0,
    0,0,-(far+near)/(far-near),-2*far*near/(far-near),
    0,0,-1,0
  );
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld(true);
  return camera;
}

export function buildingOrigin(kind){
  const config=CONFIG[kind];return {x:config.x,z:config.entrance.z};
}

function clippedPolygon(points,basis,near=.805){
  const depth=p=>((p[0]-basis.x)*basis.sy+(p[1]-basis.z)*basis.cy)*basis.cp-(p[2]-basis.height)*basis.sp;
  const output=[];let previous=points.at(-1),pd=depth(previous);
  for(const current of points){
    const cd=depth(current);
    if((cd>=near)!==(pd>=near)){
      const t=(near-pd)/(cd-pd);output.push(previous.map((v,i)=>v+(current[i]-v)*t));
    }
    if(cd>=near)output.push(current);previous=current;pd=cd;
  }
  return output;
}

// Door openings are in room-local coordinates, with the threshold at z=0.
export function clipRoomDoorway(c,kind,view,W,H){
  const {halfWidth,height}=ROOM_DOORS[kind];
  const opening=[[-halfWidth,0,0],[halfWidth,0,0],[halfWidth,0,height],[-halfWidth,0,height]];
  const points=clippedPolygon(opening,view.basis(W,H),.121).map(p=>view.project(...p,W,H));
  if(points.length<3 || points.every(p=>p.x<0) || points.every(p=>p.x>W) ||
     points.every(p=>p.y<0) || points.every(p=>p.y>H))return false;
  c.beginPath();
  points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
  c.closePath();c.clip();
  return true;
}

function prepareBuilding(model,origin,cullBackFaces=false){
  model.position.set(origin.x,origin.y??0,-origin.z);model.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(model),corners=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push([x,-z,y]);
  const faces=[];
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal;
    for(let i=0;i<position.count;i+=3){
      const points=[0,1,2].map(j=>{
        const v=new THREE.Vector3().fromBufferAttribute(position,i+j).applyMatrix4(mesh.matrixWorld);return [v.x,-v.z,v.y];
      });
      const n=new THREE.Vector3().fromBufferAttribute(normal,i).transformDirection(mesh.matrixWorld);
      faces.push({points,normal:cullBackFaces?n:null,material:mesh.material,snow:mesh.userData.snow,shade:.72+.28*Math.max(0,-.38*n.x+.8*n.y+.46*n.z)});
    }
  });
  return {model,origin,bounds,corners,faces};
}

export function buildingScreenBounds(building,project,basis,W,H){
  const screen=building.corners.map(p=>project(...p)),valid=screen.filter(Boolean);
  if(!valid.length)return null;
  let left=Math.min(...valid.map(p=>p.x)),right=Math.max(...valid.map(p=>p.x));
  let top=Math.min(...valid.map(p=>p.y)),bottom=Math.max(...valid.map(p=>p.y));
  // A nearby wall can cross the near plane while its box corners leave the
  // viewport. Keep the visible clipped portion rather than dropping the house.
  if(valid.length!==screen.length){left=0;right=W;top=0;bottom=H;}
  if(right<0||left>W||bottom<0||top>H)return null;
  const x=Math.max(0,Math.floor(left)-4),y=Math.max(0,Math.floor(top)-4);
  const w=Math.min(W,Math.ceil(right)+4)-x,h=Math.min(H,Math.ceil(bottom)+4)-y;
  return w>0&&h>0?{x,y,w,h,left,right,top,bottom}:null;
}

export class BuildingRenderer{
  constructor({createCanvas=()=>globalThis.document?.createElement?.('canvas'),createRenderer=options=>new THREE.WebGLRenderer(options)}={}){
    this.createCanvas=createCanvas;this.createRenderer=createRenderer;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera();
    this.ambient=new THREE.HemisphereLight('#fff8e3','#768068',2.1);
    this.roomLight=new THREE.AmbientLight('#fff0d2',0);
    this.sun=new THREE.DirectionalLight('#fff0cf',2.2);this.sun.position.set(-35,65,45);
    this.scene.add(this.ambient,this.sun,this.roomLight);
    this.buildings={barn:prepareBuilding(createBarnModel(),buildingOrigin('barn')),lodge:prepareBuilding(createLodgeModel(false),buildingOrigin('lodge')),coop:prepareBuilding(createCoopModel(),buildingOrigin('coop'))};
    const lodge=this.buildings.lodge;
    lodge.staticFaces=lodge.faces;
    lodge.door=createLodgeDoor();lodge.model.add(lodge.door);
    this.rooms=new Map();
    for(const building of Object.values(this.buildings)){
      for(const material of Object.values(building.model.userData.palette))material.side=THREE.DoubleSide;
      building.model.visible=false;this.scene.add(building.model);
    }
    this.renderer=null;this.attempted=false;this.lost=false;this.caches=new Map();this.lastMode=null;
    this.setLodgeDoor(0);
    this.setMillStage(windmillStage());
  }
  setLodgeDoor(open){
    const lodge=this.buildings.lodge,step=Math.round(open*30);
    if(lodge.doorStep===step)return;
    lodge.doorStep=step;
    lodge.door.rotation.y=-step/30*Math.PI*.49;
    const leaf=prepareBuilding(lodge.door,{x:-1.125,z:-.27});
    lodge.faces=lodge.staticFaces.concat(leaf.faces);
    lodge.dryOcclusion=lodge.snowOcclusion=null;
    this.caches.delete('lodge');
  }
  setMillStage(stage){
    const previous=this.buildings.windmill;
    if(previous?.stage===stage)return;
    if(previous){
      this.scene.remove(previous.model);
      previous.model.traverse(node=>{
        if(node.isMesh)node.geometry.dispose();
        for(const material of Object.values(node.userData.palette||{}))material.dispose();
      });
      this.caches.delete('windmill');
    }
    const mill=prepareBuilding(createWindmill(stage),buildingOrigin('windmill'));
    mill.stage=stage;mill.towerFaces=mill.faces;
    this.buildings.windmill=mill;
    if(stage>=9){
      mill.sails=createSails();mill.model.add(mill.sails);
      mill.sailOrigin={x:0,y:axle.height,z:axle.front};
      for(const side of [-7,7])for(const height of [axle.height-7,axle.height+7])
        mill.corners.push([mill.origin.x+side,mill.origin.z+axle.front-.6,height]);
      this.turnSails(0);
    }
    mill.model.traverse(node=>{if(node.isMesh)node.material.side=THREE.DoubleSide;});
    mill.model.visible=false;this.scene.add(mill.model);
  }
  initialise(){
    if(this.attempted)return;this.attempted=true;
    try{
      const canvas=this.createCanvas();if(!canvas?.addEventListener)throw Error('WebGL canvas unavailable');
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.caches.clear();});
      canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.caches.clear();});
      this.renderer=this.createRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',stencil:false,depth:true});
      this.renderer.setPixelRatio(1);this.renderer.setClearColor(0x000000,0);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.renderer.toneMapping=THREE.NoToneMapping;
    }catch{this.renderer=null;}
  }
  turnSails(time){
    const mill=this.buildings.windmill,step=Math.floor(time*7)%48;
    if(!mill.sails||step===mill.step)return;
    mill.step=step;mill.sails.rotation.z=.55+step*Math.PI/96;
    const rotor=prepareBuilding(mill.sails,mill.sailOrigin);
    mill.faces=mill.towerFaces.concat(rotor.faces);
    mill.dryOcclusion=mill.snowOcclusion=null;
  }
  appearance(building,{night=false,snow=false}){
    this.ambient.intensity=night?.75:2.1;this.sun.intensity=night?.4:2.2;
    building.model.userData.palette.glass.color.set(night?'#f3ce85':'#94b8ad');
    building.model.userData.palette.glass.emissive.set(night?'#ad7829':'#000000');
    building.model.userData.palette.glass.emissiveIntensity=night?.7:0;
    building.model.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.snow)mesh.visible=snow;});
  }
  drawShadow(c,building,project,basis){
    const spec=building.model.userData.spec,{x,z}=building.origin;
    const points=Array.from({length:32},(_,i)=>{const a=i/32*Math.PI*2;return [x+Math.cos(a)*(spec.width/2+1),z+spec.depth/2+Math.sin(a)*(spec.depth/2+1),.025];});
    const screen=clippedPolygon(points,basis).map(p=>project(...p));if(screen.length<3||screen.some(p=>!p))return;
    c.fillStyle='#29433225';c.beginPath();screen.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
  }
  drawSoftware(c,building,project,basis,{night=false,snow=false,near=.8,slabNear=near}){
    const visible=[];
    for(const face of building.faces){
      if(face.snow&&!snow)continue;
      if(face.normal){
        const [x,z,y]=face.points[0],n=face.normal;
        if(n.x*(basis.x-x)+n.y*(basis.height-y)-n.z*(basis.z-z)<=0)continue;
      }
      const clip=face.material.userData.stairSlab?slabNear:near;
      const points=clippedPolygon(face.points,basis,clip+.005).map(p=>project(...p));if(points.length<3||points.some(p=>!p))continue;
      visible.push({face,points,depth:points.reduce((sum,p)=>sum+p.depth,0)/points.length});
    }
    visible.sort((a,b)=>b.depth-a.depth);
    for(const {face,points} of visible){
      const color=face.material.color.clone().convertLinearToSRGB().multiplyScalar(face.shade*(night?.55:1));
      c.fillStyle=`#${color.getHexString(THREE.LinearSRGBColorSpace)}`;
      c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
    }
  }
  drawWebGL(c,building,kind,basis,crop,W,H,options){
    const ratio=Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(1800000/(crop.w*crop.h)));
    const width=Math.max(1,Math.ceil(crop.w*ratio)),height=Math.max(1,Math.ceil(crop.h*ratio));
    const key=[W,H,width,height,crop.x,crop.y,crop.w,crop.h,basis.x,basis.z,basis.height,basis.sy,basis.cy,basis.sp,basis.cp,basis.f,building.step,!!options.night,!!options.snow,options.near??.8,options.slabNear??0].join('|');
    let cache=this.caches.get(kind);
    if(cache?.key!==key){
      const image=cache?.image||this.createCanvas(),context=image?.getContext?.('2d');
      if(!context)throw Error('Building snapshot unavailable');
      image.width=width;image.height=height;
      this.renderer.setSize(width,height,false);syncBuildingCamera(this.camera,basis,crop,options.near??.8);
      building.model.visible=true;
      try{this.renderer.render(this.scene,this.camera);}
      finally{building.model.visible=false;}
      context.clearRect(0,0,width,height);context.drawImage(this.renderer.domElement,0,0);
      cache={key,image};this.caches.set(kind,cache);
    }
    c.drawImage(cache.image,crop.x,crop.y,crop.w,crop.h);
  }
  label(c,kind,building,project,options){
    const {x,z}=building.origin,spec=building.model.userData.spec;
    const point=project(x,z+spec.depth*.2,spec.ridge+1.15);if(!point)return null;
    const title=kind==='windmill'?'풍차 전망대':kind==='barn'?'양들의 축사':kind==='lodge'?'목동과 강아지의 집':'닭장';
    const status=kind==='windmill'?windmillStatus(building.stage):kind==='barn'?`쉬는 양 ${options.inside||0} / ${options.total??0}`:kind==='lodge'?`2층 전망대${options.occupants?` · 쉬는 친구 ${options.occupants}`:''}`:`쉬는 닭 ${options.inside||0} / ${options.total??10}`;
    const size=Math.max(10,Math.min(17,point.s*.38));
    c.font=`${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';
    const w=Math.max(c.measureText(title).width,c.measureText(status).width)+20,h=size*3.1;
    c.fillStyle='#35533ee8';c.fillRect(point.x-w/2,point.y-h,w,h);
    c.fillStyle='#fff7e0';c.fillText(title,point.x,point.y-h+size*.85);
    c.font=`${size*.83}px sans-serif`;c.fillStyle='#ede9cf';c.fillText(status,point.x,point.y-size*.75);
    return {left:point.x-w/2,right:point.x+w/2,top:point.y-h,bottom:point.y};
  }
  draw(c,kind,project,view,W,H,options={}){
    const building=this.buildings[kind];if(!building)return null;
    const basis=view.basis(W,H),crop=buildingScreenBounds(building,project,basis,W,H);if(!crop)return null;
    this.initialise();this.appearance(building,options);this.roomLight.intensity=0;
    c.save();this.drawShadow(c,building,project,basis);
    let mode='three-mesh-canvas';
    if(this.renderer&&!this.lost){
      try{this.drawWebGL(c,building,kind,basis,crop,W,H,options);mode='three-webgl';}
      catch{this.lost=true;this.caches.clear();this.drawSoftware(c,building,project,basis,options);}
    }else this.drawSoftware(c,building,project,basis,options);
    const label=options.label===false?null:this.label(c,kind,building,project,options);c.restore();
    this.lastMode=mode;if(c.canvas?.dataset)c.canvas.dataset.buildings=mode;
    return {x:(crop.left+crop.right)/2,y:Math.max(crop.bottom,label?.bottom??-Infinity),w:crop.right-crop.left,h:Math.max(crop.bottom,label?.bottom??-Infinity)-Math.min(crop.top,label?.top??Infinity)};
  }
  drawLabel(c,kind,project,options={}){
    const building=this.buildings[kind];
    return building?this.label(c,kind,building,project,options):null;
  }
  drawInterior(c,kind,view,W,H,options={}){
    if(!this.rooms.has(kind)){
      const room=prepareBuilding(createFarmRoomModel(kind),{x:0,z:0});
      room.model.visible=false;this.scene.add(room.model);this.rooms.set(kind,room);
    }
    const building=this.rooms.get(kind),basis=view.basis(W,H),settings={...options,near:.12,snow:false};
    const project=(x,z,y=0)=>view.project(x,z,y,W,H);
    this.initialise();this.appearance(building,settings);this.roomLight.intensity=options.night?.65:1.35;
    c.save();
    if(this.renderer&&!this.lost){
      try{this.drawWebGL(c,building,'room-'+kind,basis,{x:0,y:0,w:W,h:H},W,H,settings);}
      catch{this.lost=true;this.caches.clear();this.drawSoftware(c,building,project,basis,settings);}
    }else this.drawSoftware(c,building,project,basis,settings);
    c.restore();
  }
  drawBarnRoom(c,view,W,H,options={}){
    const key='barn-room';
    if(!this.rooms.has(key)){
      const room=prepareBuilding(createBarnRoomModel(),{x:0,z:0});
      room.model.visible=false;this.scene.add(room.model);this.rooms.set(key,room);
    }
    const building=this.rooms.get(key),basis=view.basis(W,H),settings={...options,near:.12,snow:false};
    const project=(x,z,y=0)=>view.project(x,z,y,W,H);
    this.initialise();this.appearance(building,settings);this.roomLight.intensity=options.night?.8:1.3;
    c.save();
    if(this.renderer&&!this.lost){
      try{this.drawWebGL(c,building,key,basis,{x:0,y:0,w:W,h:H},W,H,settings);}
      catch{this.lost=true;this.caches.clear();this.drawSoftware(c,building,project,basis,settings);}
    }else this.drawSoftware(c,building,project,basis,settings);
    c.restore();if(c.canvas?.dataset)c.canvas.dataset.barnInterior='eye-height-three';
  }
  lodgeBuilding(){
    const key='lodge-interior';
    if(!this.rooms.has(key)){
      const model=createLodgeRoomModel(1),upper=createLodgeRoomModel(2);
      upper.position.y=LODGE_ROOM.floorHeight;model.add(upper);
      const room=prepareBuilding(model,{x:0,z:0},true);
      model.visible=false;this.scene.add(model);this.rooms.set(key,room);
    }
    return this.rooms.get(key);
  }
  pickLodgeStairs(x,y,view,W,H,elevation){
    const room=this.lodgeBuilding(),b=view.basis(W,H);
    const side=(x-b.cx)/b.f,vertical=(b.screenY-y)/b.f,forward=vertical*b.sp+b.cp;
    const direction=new THREE.Vector3(side*b.cy+forward*b.sy,vertical*b.cp-b.sp,side*b.sy-forward*b.cy).normalize();
    const ray=new THREE.Raycaster(new THREE.Vector3(b.x,b.height+elevation,-b.z),direction,.12*Math.hypot(1,side,vertical));
    const hit=ray.intersectObject(room.model,true).find(hit=>!hit.object.material.userData.stairSlab||hit.distance>=(view.stairShot?.slabNear??.12)*Math.hypot(1,side,vertical));
    if(!hit)return false;
    const point=hit.point,z=-point.z;
    return Math.abs(point.x-FLIGHT.x)<=FLIGHT.width/2+.12&&z>=FLIGHT.front-.03&&z<=LODGE_ROOM.depth&&
      Math.abs(point.y-Math.min(1,(z-FLIGHT.front)/(FLIGHT.back-FLIGHT.front))*LODGE_ROOM.floorHeight)<.32;
  }
  drawLodgeRoom(c,floor,view,W,H,options={}){
    const key='lodge-interior',building=this.lodgeBuilding();
    const elevation=options.elevation??(floor-1)*LODGE_ROOM.floorHeight;
    const eye=view.basis(W,H),basis={...eye,height:eye.height+elevation};
    const settings={...options,near:.12,slabNear:view.stairShot?.slabNear??.12,snow:false};
    const project=(x,z,y=0)=>view.project(x,z,y-elevation,W,H);
    this.initialise();
    if(this.renderer&&settings.slabNear>.12){
      this.renderer.localClippingEnabled=true;
      const normal=new THREE.Vector3(basis.sy*basis.cp,-basis.sp,-basis.cy*basis.cp);
      const eyePosition=new THREE.Vector3(basis.x,basis.height,-basis.z);
      this.slabPlane??=new THREE.Plane();
      this.slabPlane.set(normal,-normal.dot(eyePosition)-settings.slabNear);
    }
    building.model.traverse(mesh=>{
      if(mesh.material?.userData.stairSlab)mesh.material.clippingPlanes=settings.slabNear>.12&&this.slabPlane?[this.slabPlane]:null;
    });
    this.appearance(building,settings);this.roomLight.intensity=options.night?.8:1.15;
    c.save();
    if(this.renderer&&!this.lost){
      try{this.drawWebGL(c,building,key,basis,{x:0,y:0,w:W,h:H},W,H,settings);}
      catch{this.lost=true;this.caches.clear();this.drawSoftware(c,building,project,basis,settings);}
    }else this.drawSoftware(c,building,project,basis,settings);
    c.restore();if(c.canvas?.dataset)c.canvas.dataset.lodgeInterior='eye-height-three';
  }
  dispose(){
    this.renderer?.dispose();this.caches.clear();
    for(const building of [...Object.values(this.buildings),...this.rooms.values()]){
      building.model.traverse(mesh=>{if(mesh.isMesh)mesh.geometry.dispose();});
      for(const material of Object.values(building.model.userData.palette))material.dispose();
    }
  }
}

let shared=null;
export function drawBuilding3D(...args){shared??=new BuildingRenderer();return shared.draw(...args);}
export function drawBuildingLabel3D(...args){shared??=new BuildingRenderer();return shared.drawLabel(...args);}
export function drawFarmRoom3D(...args){shared??=new BuildingRenderer();return shared.drawInterior(...args);}

export function pickLodgeStairs(...args){shared??=new BuildingRenderer();return shared.pickLodgeStairs(...args);}
export function drawLodgeRoom3D(...args){shared??=new BuildingRenderer();return shared.drawLodgeRoom(...args);}
export function drawBarnRoom3D(...args){shared??=new BuildingRenderer();return shared.drawBarnRoom(...args);}

export function getBuildingOcclusionMeshes({snow=false,millTime,lodgeDoor=0}={}){
  shared??=new BuildingRenderer();
  shared.setLodgeDoor(lodgeDoor);
  shared.setMillStage(windmillStage());
  if(millTime!==undefined&&shared.buildings.windmill.stage===10)shared.turnSails(millTime);
  return Object.values(shared.buildings).map(building=>{
    const key=snow?'snowOcclusion':'dryOcclusion';
    return building[key]??={kind:building.model.userData.kind,near:.8,skipNearCrossing:building.model.userData.kind==='barn',polygons:building.faces.filter(face=>!face.snow||snow).map(face=>face.points)};
  });
}
