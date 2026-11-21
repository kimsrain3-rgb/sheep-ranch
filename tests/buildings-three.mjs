import {followRoomVisitor,roomVisitorProjection} from "../dist/game/room-follow.js";
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.js';
import {createBarnModel,createBarnRoomModel,createLodgeModel,createCoopModel,createFarmRoomModel} from '../dist/render/building-models.js';
import {BuildingRenderer,syncBuildingCamera} from '../dist/render/buildings-three.js';
import {FarmRoomVisit,FARM_ROOMS} from '../dist/game/farm-room.js';
import {CONFIG,distance,isWater} from '../dist/game/config.js';
import {buildingFootprints} from '../dist/game/building-collision.js';
import {MeadowView} from '../dist/orbit.js';
import {BarnInteriorView} from '../dist/game/barn-camera.js';

for(const model of [createBarnModel(),createBarnRoomModel(),createLodgeModel(),createCoopModel(),createFarmRoomModel('coop'),createFarmRoomModel('shed')]){
 assert.ok(model.isGroup&&model.children.every(mesh=>mesh.isMesh),'buildings are actual Three.js geometry');
 assert.ok(model.children.length<=13,'static details batch into a small draw count');
 const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
 assert.ok(size.x>7&&size.y>3&&size.z>8,'each model has real width, height and depth');
 for(const mesh of model.children){
  assert.ok([...mesh.geometry.attributes.position.array,...mesh.geometry.attributes.normal.array].every(Number.isFinite));
 }
}
const house=createLodgeModel(),coop=createCoopModel();
const barn=createBarnModel();
assert.ok(barn.userData.parts.some(p=>p.name==='barn side wall'));
assert.ok(barn.userData.parts.some(p=>p.name==='open barn door'));
assert.ok(barn.userData.parts.some(p=>p.name==='barn stall rail'));
const barnFootprint=buildingFootprints(CONFIG).find(p=>p.kind==='barn');
const frontWalls=barn.userData.parts.filter(p=>p.name==='barn front wall').sort((a,b)=>a.min[0]-b.min[0]);
assert.ok(Math.abs(frontWalls[0].max[0]-(barnFootprint.doorX-CONFIG.barn.x-barnFootprint.doorHalf))<.001);
assert.ok(Math.abs(frontWalls[1].min[0]-(barnFootprint.doorX-CONFIG.barn.x+barnFootprint.doorHalf))<.001);
assert.ok(Math.abs(Math.max(...barn.userData.parts.filter(p=>p.name==='barn side wall').map(p=>p.max[0]))-(barnFootprint.right-CONFIG.barn.x))<.001);
assert.ok(createBarnRoomModel().userData.parts.some(p=>p.name==='barn room ceiling'));
assert.ok(house.userData.parts.some(p=>p.name==='balcony deck'));
assert.ok(house.userData.parts.some(p=>p.name==='stone chimney'));
assert.ok(coop.userData.parts.some(p=>p.name==='open coop door'));
assert.ok(coop.userData.parts.some(p=>p.name==='nest boxes'));
assert.ok(createFarmRoomModel('coop').userData.parts.some(p=>p.name==='closed ceiling'),'new interiors have a ceiling, not a cutaway model view');

// Compare the real Three.js camera to Canvas projection at full and cropped
// desktop / phone viewports, from every side and at eye height indoors.
for(const [W,H] of [[1440,900],[390,844]])for(const yaw of [0,.7,Math.PI,Math.PI*1.5])for(const indoor of [false,true]){
 const view=indoor?new BarnInteriorView():new MeadowView();view.yaw=yaw;
 const b=view.basis(W,H),crop={x:W*.13,y:H*.09,w:W*.73,h:H*.78};
 const camera=syncBuildingCamera(new THREE.PerspectiveCamera(),b,crop,indoor?.12:.8);
 for(const [side,forward,y] of [[0,5,0],[-2,10,2],[3,18,4]]){
   const x=b.x+b.sy*forward+b.cy*side,z=b.z+b.cy*forward-b.sy*side;
   const p=view.project(x,z,y,W,H),v=new THREE.Vector3(x,y,-z).project(camera);
   assert.ok(Math.abs(p.x-(crop.x+(v.x+1)*crop.w/2))<1e-6);
   assert.ok(Math.abs(p.y-(crop.y+(1-v.y)*crop.h/2))<1e-6);
 }
}

const makeContext=()=>new Proxy({canvas:{dataset:{}},measureText:text=>({width:String(text).length*8})},{
 set(t,k,v){t[k]=v;return true;},get(t,k){
  if(k in t)return t[k];
  if(['moveTo','lineTo','fillRect','drawImage'].includes(k))return (...args)=>assert.ok(args.filter(v=>typeof v==='number').every(Number.isFinite));
  return ()=>{};
 }});
const software=new BuildingRenderer({createCanvas:()=>null}),context=makeContext();
const lodgeBuilding=software.buildings.lodge;
const entrance=CONFIG.lodge.entrance;
const ray=new THREE.Raycaster(new THREE.Vector3(entrance.x,1.5,-entrance.z+3),new THREE.Vector3(0,0,-1));
const entranceDepth=()=>ray.intersectObject(lodgeBuilding.model,true)[0].distance;
const closedDepth=entranceDepth();
software.setLodgeDoor(.5);
assert.ok(Math.abs(entranceDepth()-closedDepth)>.15,'the rendered leaf swings around its hinge');
software.setLodgeDoor(1);
assert.ok(entranceDepth()>closedDepth+1.7,'the open leaf reveals a recessed doorway');
software.setLodgeDoor(0);
assert.ok(Math.abs(entranceDepth()-closedDepth)<1e-6,'closing returns the door to its frame');
for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const kind of ['barn','lodge','coop']){
 const view=new MeadowView();view.target={x:CONFIG[kind].x,z:CONFIG[kind].entrance.z+5};view.yaw=yaw;view.zoom=.9;
 const project=(x,z,y=0)=>view.project(x,z,y,900,700);
 const hit=software.draw(context,kind,project,view,900,700,{night:true,snow:true,inside:5,total:10,occupants:3});
 assert.ok(hit&&hit.w>0&&hit.h>0,'projected building remains clickable from all four sides');
 assert.equal(context.canvas.dataset.buildings,'three-mesh-canvas','WebGL fallback still draws the real model');
}
for(const kind of ['coop','shed']){
 const view=new BarnInteriorView();for(const yaw of [0,1.5,3.14,4.7]){view.yaw=yaw;software.drawInterior(context,kind,view,900,700);}
}
for(const yaw of [0,1.5,3.14,4.7]){const view=new BarnInteriorView();view.yaw=yaw;software.drawBarnRoom(context,view,900,700);}
assert.equal(context.canvas.dataset.barnInterior,'eye-height-three');

let glCreates=0,renders=0;const sizes=[];
const canvasFactory=()=>({width:0,height:0,addEventListener(){},getContext:()=>({clearRect(){},drawImage(){}})});
const cached=new BuildingRenderer({createCanvas:canvasFactory,createRenderer:options=>{
 glCreates++;assert.equal(options.alpha,true);assert.equal(options.powerPreference,'low-power');
 return {domElement:options.canvas,setPixelRatio(){},setClearColor(){},setSize(w,h){sizes.push(w*h);},render(){renders++;},dispose(){}};
}});
const view=new MeadowView();view.target={x:-25,z:36};view.zoom=.65;
const project=(x,z,y=0)=>view.project(x,z,y,1400,900);
for(let i=0;i<3;i++)for(const kind of ['barn','lodge','coop'])cached.draw(context,kind,project,view,1400,900);
assert.equal(glCreates,1,'all buildings share a single WebGL context');assert.equal(renders,3,'standing still reuses building snapshots');
view.yaw=.4;cached.draw(context,'lodge',project,view,1400,900);assert.equal(renders,4,'camera rotation refreshes the model');
cached.draw(context,'lodge',project,view,1400,900,{snow:true,night:true});assert.equal(renders,5);
assert.ok(sizes.every(n=>n<1810000),'phone rendering uses a capped pixel budget');
assert.ok(cached.buildings.lodge.model.children.filter(m=>m.userData.snow).every(m=>m.visible));
cached.dispose();software.dispose();

for(const kind of ['coop','shed']){
 const visit=new FarmRoomVisit(),player={x:0,z:0,tx:0,tz:0};visit.request(kind,player);
 assert.equal(visit.inside,false,'clicking starts a walk, not a teleport');
 const advance=()=>{
  const dx=player.tx-player.x,dz=player.tz-player.z,d=Math.hypot(dx,dz),old={...player};
  if(d>.001){const step=Math.min(d,.16);player.x+=dx/d*step;player.z+=dz/d*step;}
  const wasInside=visit.inside,event=visit.tick(player);
  if(wasInside===visit.inside)assert.ok(distance(old,player)<=.160001,'entry and exit walk at the normal speed');
  if(!visit.inside)assert.ok(!isWater(player));
  return event;
 };
 let event;for(let i=0;i<4000&&!visit.inside;i++)event=advance();
 assert.equal(event,'entered');assert.equal(visit.inside,true);assert.equal(player.z,1);
 visit.walkTo({x:100,z:100},player);assert.ok(player.tx<=1.25&&player.tz<=FARM_ROOMS[kind].depth,'walk space stays within walls and furniture aisle');
 for(let i=0;i<60;i++)advance();
 visit.requestExit(player);visit.walkTo({x:0,z:4},player);assert.equal(visit.trip,null,'new walking cancels a pending exit');
 visit.requestExit(player);for(let i=0;i<200&&visit.inside;i++)event=advance();
 assert.equal(event,'exited');assert.ok(distance(player,CONFIG[kind].entrance)<1,'exit returns to the same outdoor door');
 visit.request(kind,player);visit.cancel(player);assert.equal(visit.trip,null);assert.equal(player.tx,player.x);
}
console.log('Three.js buildings: actual batched meshes, camera alignment, four-side picking, WebGL fallback/cache/pixel budget, closed rooms and continuous coop/warehouse entry-walk-exit passed.');

// Rotating at the open doorway must keep the feet on the same floor plank.
for(const [w,h] of [[390,760],[900,390],[1000,700]]){
  for(const [x,z] of [[0,.55],[0,1],[1.25,1.3],[-3.3,1],[0,4],[1.25,6],[0,8.4]]){
    const camera=new BarnInteriorView(),player={x,z};
    for(const zoom of [.65,1.4,3.4])for(const pitch of [-.4,-.03,.55]){
      camera.zoom=zoom;camera.pitch=pitch;
      let first,firstOrbit;
      for(let degree=-360;degree<=360;degree+=5){
        camera.yaw=degree*Math.PI/180;
        followRoomVisitor(camera,player,'coop',1,w,h);
        const foot=roomVisitorProjection(camera,player,w,h);
        const floorHeight=.09;
        const physical=camera.project(x,z,floorHeight,w,h);
        assert.equal(foot.x,physical.x);assert.equal(foot.y,physical.y);assert.equal(foot.depth,physical.depth);
        const eye=camera.basis(w,h),ground=camera.ground(foot.x,foot.y,w,h);
        const radius=Math.hypot(eye.x-x,eye.z-z);
        const reference=camera.project(x+eye.sy*2,z+eye.cy*2,1,w,h);
        firstOrbit??={radius,height:eye.height,focal:eye.f,scale:reference.s};
        assert.ok(Math.abs(radius-firstOrbit.radius)<1e-9,'dragging must not dolly the camera');
        assert.equal(eye.f,firstOrbit.focal);assert.equal(eye.height,firstOrbit.height);
        assert.ok(Math.abs(reference.s-firstOrbit.scale)<1e-9,'equal-distance scenery keeps its scale');
        const fieldOfView=2*Math.atan(Math.max(w,h)/(2*eye.f))*180/Math.PI;
        assert.ok(fieldOfView>45 && fieldOfView<70,'the longer screen axis stays within a normal lens range');
        const upright=[.1,2.6].map(y=>camera.project(eye.x+eye.sy*4,eye.z+eye.cy*4,y,w,h));
        assert.ok(upright[0]&&upright[1]&&upright[0].s/upright[1].s>.80,'door frame perspective stays moderate');
        assert.ok(eye.height>floorHeight&&eye.height<3.6 && eye.z>=.34,'lens is inside the room');
        const fraction=(eye.height-floorHeight)/eye.height;
        assert.ok(Math.hypot(eye.x+(ground.x-eye.x)*fraction-x,
          eye.z+(ground.z-eye.z)*fraction-z)<1e-8,'ray from the drawn feet hits the original plank');
        assert.ok(foot.y-2.32*foot.s>=0 && foot.y+.16*foot.s<h,'hat and shadow fit inside the viewport');
        first??=foot;
        assert.ok(Math.abs(foot.y-first.y)<1e-6 && Math.abs(foot.s-first.s)<1e-6);
      }
    }
  }
}

// Manual zoom still changes the lens at each step, even in the narrow doorway.
const zoomCamera=new BarnInteriorView();
let previousFocal=0;
for(const zoom of [.65,.75,.9,1.1,1.4,1.8,2.4,3.4]){
  zoomCamera.zoomAt(zoom);
  followRoomVisitor(zoomCamera,{x:0,z:1},'coop',1,390,760);
  const focal=zoomCamera.basis(390,760).f;
  assert.ok(focal>previousFocal);
  previousFocal=focal;
}
