import {createArcticLanding,returnToArcticTram,stepArctic,turnOnIce,tapOnIce,APPROACH_START} from './game/arctic-landing.js';
import {drawArctic} from './render/arctic-landing.js';
import {forestHeight,hillPick,denSites,nearbyDen} from './game/forest-hills.js';
import {drawHills,addDenLayers} from './render/forest-hills.js?v=hill-draw-2';
import {addGardenLayers} from './render/pond-garden.js?v=stream-banks-1';
import {setupRanchMap,streamLookout} from './ranch-map.js?v=tram-station-1';
import {TRAM_BOARDING_WALK,TRAM_BOARDING_HOLD,tramBoardingPose,stationWalkingHeight,TRAM_DESTINATIONS,TRAM_STATION,TRAM_STOP} from './game/tram-station.js';
import {drawTramRide} from './render/tram-ride.js?v=window-framing-2';
import {tramPlatformOrigin} from './render/tram-station.js';
import {trailX,inGrove,clearTrunks,groveRoute} from './game/fir-grove.js?v=birch-edge-1';
import {addBirchLayers,drawForestFloor,addForestLayers,groveVisible} from './render/fir-grove.js?v=deer-contact-1';
import {frameLodgeStairs,followRoomVisitor,roomVisitorProjection} from './game/room-follow.js?v=coop-circle-1';
import {groundThroughDoor} from './game/doorway.js';
import {BuildingOcclusion,spriteBounds} from './render/occlusion.js?v=visible-picking-1';
import {LodgeInteriorView} from './game/lodge-camera.js?v=lodge-eyes-2';
import {BarnVisit} from './game/barn.js?v=doorway-walk-1';
import {BarnInteriorView} from './game/barn-camera.js?v=zoom500';
import {FarmRoomVisit,FARM_ROOMS} from './game/farm-room.js?v=solid-buildings-2';
import {LodgeVisit} from './game/lodge.js?v=lodge-hearth-1';
import {setupShepherdChat} from './shepherd-chat.js?v=haru-voice-1';
import {ShepherdBoy} from './game/shepherd.js?v=solid-buildings-2';
import {drawShepherdBoy} from './render/shepherd.js?v=christmas';
import {MeadowWeather} from './game/weather.js?v=coop-herding';
import {MeadowTime} from './game/meadow-time.js?v=chosen-time-2';
import {SheepBond} from './game/bond.js?v=night-barn';
import {WeatherShelter} from './game/shelter.js?v=solid-buildings-2';
import {LambPlay} from './game/lamb-play.js?v=solid-buildings-2';
import {setTramBoardingDoor,setTramDestination,pickLodgeStairs,clipRoomDoorway,drawBuilding3D,drawBarnRoom3D,drawFarmRoom3D,drawLodgeRoom3D,getBuildingOcclusionMeshes} from './render/buildings-three.js?v=tram-station-1';
import {windmillStage,windmillStatus,windmillCountdown,windmillOpeningLabel} from './game/windmill-construction.js?v=countdown-1';
import {drawWeather,drawFriendBadge} from './render/weather.js?v=night-barn';
import {setupMeadowPanel} from './meadow-panel.js?v=chosen-time-2';
import { isCompactViewport } from './game/layout.js';
import { Flock } from './game/flock.js?v=head-posture-1';
import { Interactions } from './game/interactions.js?v=solid-buildings-2';
import { Companions } from './game/companions.js?v=companion-pet-1';
import { MeadowAudio } from './game/audio.js?v=popup-sound-2';
import {dryRoute} from './game/navigation.js?v=windmill-1';
import {drawBridgeDeck,drawBridgeRail,pickBridge} from './render/bridge.js?v=lake-bridge-1';
import { CONFIG,pondPoint,keepDry,bridgePathClear,bridgeHeight,bridgePoint,BRIDGES } from './game/config.js?v=hammock-p10';
import { drawSheep as renderSheep } from './render/sheep.js?v=head-posture-1';
import { drawCompanion } from './render/companions.js?v=night-barn';
import { drawOwl,owlPosition } from './render/owl.js?v=1';
import { makeVegetation,drawVegetation,drawHayPile,drawRipples } from './render/details.js?v=solid-buildings-2';
import { drawInteraction } from './render/interactions.js?v=limb-light-1';
import { MeadowView } from './orbit.js?v=zoom500';
import { drawVisitor,drawHammock,visitorPose } from './visitor.js?v=limb-light-1';
import { drawPasture,trees,drawWindmill,drawFirTree,firTree } from './pasture.js?v=meadow-ground-1';
const canvas=document.querySelector('#world'),c=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W,H,dpr,started=false,feeding=false,seated=false,hammocking=false,walkingToHammock=false,sunset=false,selected=null,feedCount=0,friends=new Set(),t=0,last=0,toastUntil=0,paused=false;
let seed=1731;
const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const player={
  x:0,z:0,tx:0,tz:0
},keys=new Set();
let marker=null,outdoorWalk=null,doorwayWalk=null;
const entranceDoors={lodge:0,shed:0};
function updateEntranceDoors(dt){
  const indoors=lodgeVisit.inside||farmVisit.inside||barnVisit.inside;
  for(const kind of Object.keys(entranceDoors)){
    const door=CONFIG[kind].entrance;
    const near=!indoors&&Math.hypot(player.x-door.x,player.z-door.z)<2.8;
    const inside=kind==='lodge'?lodgeVisit.inside:farmVisit.inside&&farmVisit.kind==='shed';
    const npcNear=kind==='lodge'&&[shepherd,...companions.dogs].some(a=>
      !a.insideLodge&&!a.hiddenInLodge&&(a.lodgeBound||a.buildingAccess==='lodge'||a.state==='lodge-go')&&Math.hypot(a.x-door.x,a.z-door.z)<2.8);
    const opening=inside||npcNear||(near&&(player.buildingAccess===kind||entranceDoors[kind]>0));
    entranceDoors[kind]=clamp(entranceDoors[kind]+dt*(opening?1.65:-1.25),0,1);
  }
}
function waitingForDoor(point){
  const kind=player.buildingAccess;
  if(!(kind in entranceDoors)||entranceDoors[kind]>=1)return false;
  const door=CONFIG[kind].entrance;
  return Math.hypot(point.x-door.x,point.z-door.z)<1.65;
}
const outdoorView=new MeadowView(),indoorView=new BarnInteriorView();
const lodgeView=new LodgeInteriorView(),lookoutView=new BarnInteriorView(),farmView=new BarnInteriorView();
lodgeView.zoom=1.25;lodgeView.pitch=.025;
outdoorView.terrainHeight=forestHeight;
const denKey='ranch-forest-dens-v1';
function readDens(){
  try{return new Set(JSON.parse(localStorage.getItem(denKey)||'[]').filter(i=>Number.isInteger(i)&&denSites[i]));}catch{return new Set();}
}
let dugDens=readDens();
function availableDen(){
  if(!started||view!==outdoorView)return -1;
  const id=nearbyDen(player.x,player.z);
  return dugDens.has(id)?-1:id;
}
$('dig-den').onclick=()=>{
  const id=availableDen();if(id<0)return;
  dugDens.add(id);
  try{for(const other of readDens())dugDens.add(other);localStorage.setItem(denKey,JSON.stringify([...dugDens]));}catch{}
  $('dig-den').hidden=true;notify('비탈에 여우굴을 팠어요.');
};
let view=outdoorView;
const millView=new LodgeInteriorView();
let millMode=null;
let following=true;
const flock=new Flock(rnd,{adults:45,lambs:CONFIG.lambs}),sheep=flock.animals,lambs=flock.lambs;
flock.adults.forEach((animal,i)=>{
  if(i%3===0)animal.newSheepAppearance=true;
  else if(i%3===1)animal.thirdSheepAppearance=true;
  else animal.fifthSheepAppearance=true;
});
const interaction=new Interactions(flock),companions=new Companions(),audioSystem=new MeadowAudio({onCallsReady:()=>{flock.nextBaa=0;}});
const weather=new MeadowWeather(),bond=new SheepBond(),shelter=new WeatherShelter(),lambPlay=new LambPlay(rnd);
const meadowTime=new MeadowTime();
let atmosphere=meadowTime.apply(weather.snapshot()),environmentTimer=0;
bond.apply(flock);
const shepherd=new ShepherdBoy(),barnVisit=new BarnVisit(),lodgeVisit=new LodgeVisit(),farmVisit=new FarmRoomVisit();
let chat=null,pendingShepherdTalk=false;
const stationBoard=$('station-board');
let selectedDestination=null;
const rideDialog=$('tram-ride');
let ride=null;
function nearBoardingDoor(){
  const door=TRAM_STOP.entrance;
  return started && view===outdoorView && Math.hypot(player.x-door.x,player.z-door.z)<.9;
}
function walkToTram(){
  if(!selectedDestination||ride)return;
  walkToOutdoor(TRAM_STOP.entrance);
  outdoorWalk.boardFor=selectedDestination;
  keys.clear();
}
function boardTram(name){
  if(ride||name!==selectedDestination||!nearBoardingDoor())return;
  keys.clear();
  player.walking=false;
  ride={name,elapsed:0,arrived:false,windowView:false,yaw:.36,pitch:.02,drag:null};
  ride.boarding={start:{x:player.x,z:player.z},time:0,last:null,landedAt:null};
  rideDialog.classList.add('boarding');
  $('ride-return').textContent='승차 취소';
  $('ride-return').hidden=false;
  $('ride-look-hint').textContent='화면을 밀어 둘러보기';
  $('ride-view').textContent='창밖 크게 보기';
  $('ride-view').hidden=true;
  $('ride-look-hint').hidden=true;
  $('ride-status').textContent=name+'행 · 탑승 중';
  rideDialog.showModal();
}
$('station-ride-open').onclick=()=>{
  if(atStationBoard()||nearBoardingDoor())walkToTram();
};
$('ride-view').onclick=()=>{
  if(!ride||ride.boarding)return;
  if(ride.shore&&!$('arctic-shore').hidden){
    if(ride.shore.phase!=='arrived')return;
    $('arctic-shore').hidden=true;
    ride.windowView=true;
  }
  ride.windowView=!ride.windowView;
  ride.yaw=.36;ride.pitch=.02;ride.drag=null;
  $('ride-view').textContent=ride.windowView?'좌석 보기':'창밖 크게 보기';
};
const shoreCanvas=$('arctic-shore');
$('ride-exit').onclick=()=>{
  if(ride?.homeward&&ride.arrived){
    if(ride.boarding)return;
    ride.boarding={start:{x:player.x,z:player.z},time:0,last:null,exiting:true};
    rideDialog.classList.add('boarding');
    $('ride-status').textContent='목장역 · 내리는 중';
    $('ride-exit').hidden=$('ride-view').hidden=$('ride-look-hint').hidden=true;
    return;
  }
  if(ride?.shore?.phase!=='arrived')return;
  $('ride-return').hidden=true;
  ride.shore.phase='disembark';
  ride.drag=null;
  setTramBoardingDoor(true);
  shoreCanvas.hidden=false;
  $('ride-exit').hidden=true;
  $('ride-view').hidden=true;
  $('ride-status').textContent='북극 승강장';
};
let shoreDrag=null;
shoreCanvas.onpointerdown=e=>{
  if(ride?.shore?.phase!=='walk'||e.button!==0||shoreDrag)return;
  shoreDrag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
  shoreCanvas.setPointerCapture(e.pointerId);
};
shoreCanvas.onpointermove=e=>{
  if(!shoreDrag||shoreDrag.id!==e.pointerId)return;
  const d=shoreDrag;
  if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>6)d.moved=true;
  if(d.moved)turnOnIce(ride.shore,e.clientX-d.x,e.clientY-d.y);
  d.x=e.clientX;d.y=e.clientY;
};
shoreCanvas.onpointerup=e=>{
  if(!shoreDrag||shoreDrag.id!==e.pointerId)return;
  if(!shoreDrag.moved){
    const r=shoreCanvas.getBoundingClientRect();
    tapOnIce(ride.shore,e.clientX-r.left,e.clientY-r.top,r.width,r.height);
  }
  shoreDrag=null;
};
shoreCanvas.onpointercancel=shoreCanvas.onlostpointercapture=e=>{
  if(shoreDrag?.id===e.pointerId)shoreDrag=null;
};
function beginHomewardRide(){
  if(!ride||ride.homeward)return;
  setTramDestination('목장역');
  if(ride.shore?.phase==='inside'){
    ride.windowView=false;ride.yaw=.36;ride.pitch=.02;
  }
  if(ride.shore)setTramBoardingDoor(false);
  ride.homeward=true;ride.shore=null;ride.arrived=false;ride.drag=null;
  shoreDrag=null;shoreCanvas.hidden=true;
  $('ride-exit').hidden=$('ride-return').hidden=true;
  $('ride-view').hidden=false;$('ride-look-hint').hidden=false;
  $('ride-look-hint').textContent='화면을 밀어 둘러보기';
  $('ride-view').textContent=ride.windowView?'좌석 보기':'창밖 크게 보기';
  $('ride-status').textContent='목장역행 · 운행 중';
}
function requestHomewardRide(){
  if(!ride||ride.homeward)return;
  if(ride.boarding){rideDialog.close();return;}
  if(ride.shore?.phase==='walk'){
    returnToArcticTram(ride.shore);
    shoreDrag=null;
    setTramDestination('목장역');
    $('ride-return').hidden=$('ride-look-hint').hidden=true;
    $('ride-status').textContent='목장역행 · 승강장으로 이동 중';
    return;
  }
  if(ride.shore&&ride.shore.phase!=='arrived'&&ride.shore.phase!=='approach')return;
  beginHomewardRide();
}
$('ride-return').onclick=requestHomewardRide;
rideDialog.addEventListener('cancel',e=>{e.preventDefault();requestHomewardRide();});
function turnInTram(dx,dy){
  const radiansPerPixel=Math.PI/Math.max(280,Math.min(W,H)*.9);
  ride.yaw=(ride.yaw-dx*radiansPerPixel)%(Math.PI*2);
  ride.pitch=clamp(ride.pitch-dy*radiansPerPixel,-1.05,.95);
  $('ride-look-hint').hidden=true;
}
const rideWindow=$('ride-cabin');
rideWindow.onpointerdown=event=>{
  if(!ride||ride.boarding||ride.drag||event.button!==0)return;
  ride.drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  rideWindow.setPointerCapture(event.pointerId);
};
rideWindow.onpointermove=event=>{
  const drag=ride?.drag;
  if(!drag||drag.id!==event.pointerId)return;
  turnInTram(event.clientX-drag.x,event.clientY-drag.y);
  drag.x=event.clientX;drag.y=event.clientY;
};
rideWindow.onpointerup=rideWindow.onpointercancel=rideWindow.onlostpointercapture=event=>{
  if(ride?.drag?.id===event.pointerId)ride.drag=null;
};
rideDialog.addEventListener('keydown',event=>{
  event.stopPropagation();
  if(!ride||ride.boarding||ride.shore&&!shoreCanvas.hidden)return;
  const arrows={ArrowLeft:[18,0],ArrowRight:[-18,0],ArrowUp:[0,18],ArrowDown:[0,-18]};
  const delta=arrows[event.key];
  if(delta){event.preventDefault();turnInTram(...delta);}
});
rideDialog.addEventListener('close',()=>{
  if(ride?.shore)setTramBoardingDoor(false);
  if(ride?.homeward)setTramDestination(selectedDestination);
  shoreCanvas.hidden=true;
  $('ride-exit').hidden=true;
  shoreDrag=null;
  ride=null;
  rideDialog.classList.toggle('boarding',false);
  keys.clear();
  notify('바람목장역 승강장이에요.');
  $('station-board-open').focus();
});
function atStationBoard(){
  const spot=TRAM_STATION.waitingSpot;
  return started && view===outdoorView && Math.hypot(player.x-spot.x,player.z-spot.z)<.82;
}
function openStationBoard(){
  if(stationBoard.open||ride||!(atStationBoard()||nearBoardingDoor()))return;
  keys.clear();
  const options=$('station-options');
  if(!options.childElementCount){
    for(const name of TRAM_DESTINATIONS){
      const button=document.createElement('button');
      button.type='button';button.value=name;button.textContent=name;
      button.onclick=()=>{
        if(!stationBoard.open||!(atStationBoard()||nearBoardingDoor()))return;
        setTramDestination(name);
        selectedDestination=name;
        stationBoard.close();
        notify(name+'행 트램이에요.');
      };
      options.append(button);
    }
  }
  for(const button of options.children){
    button.setAttribute('aria-pressed',String(button.value===selectedDestination));
  }
  stationBoard.showModal();
}
$('station-board-open').onclick=openStationBoard;
$('station-board-close').onclick=()=>stationBoard.close();
stationBoard.addEventListener('keydown',event=>event.stopPropagation());
let coopScreen=null,lodgeScreen=null,shedScreen=null;
const grass=makeVegetation().filter(p=>!inGrove(p.x,p.z));
const meadowTrees=trees.filter(p=>!inGrove(p.x,p.z));
const particles=[];
const buildingOcclusion=new BuildingOcclusion();
const shedOccluder={kind:'shed',billboard:true,x:CONFIG.shed.x,z:CONFIG.shed.z,scale:1/8,polygons:[
  [[-46,-60],[45,-60],[45,0],[-46,0]],[[-60,-60],[0,-99],[58,-60]]
]};
function notify(text){
  if(isCompactViewport(W,H)&&text.includes('오물오물 먹었어요'))return;
  $('toast').textContent=isCompactViewport(W,H)?text.split('. ')[0]:text;
  toastUntil=t+(isCompactViewport(W,H)?2.2:6);
  $('toast').style.opacity=1;
}
function resize(){
  W=innerWidth;
  H=innerHeight;
  dpr=Math.min(devicePixelRatio||1,1.75);
  canvas.width=W*dpr;
  canvas.height=H*dpr;
  c.setTransform(dpr,0,0,dpr,0,0);
  if(started)centerView();
}
addEventListener('resize',resize);
resize();
function centerView(){
  if(millMode){
    const radius=millMode==='balcony'?3.65:-Math.min(34,12+windmillStage()*2.75);
    view.target.x=CONFIG.windmill.x+Math.sin(view.yaw)*radius;
    view.target.z=CONFIG.windmill.z+Math.cos(view.yaw)*radius;
    return;
  }
  if(barnVisit.inside||farmVisit.inside||lodgeVisit.inside){
    const kind=barnVisit.inside?'barn':lodgeVisit.inside?'lodge':farmVisit.kind;
    if(kind==='lodge'&&frameLodgeStairs(view,lodgeVisit,player,W,H,t))return;
    if(kind==='lodge')followRoomVisitor(view,player,kind,lodgeVisit.floor,W,H,lodgeVisit.elevation,t<view.settleUntil?t:null);
    else followRoomVisitor(view,player,kind,1,W,H);
    return;
  }
  const target=interaction.cameraTarget(player);
  view.target.x=target.x;
  view.target.z=target.z;
}
function updateViewLabel(){
  $('zoom-level').textContent=Math.round(view.zoom*100)+'%';
  $('camera-home').setAttribute('aria-pressed',String(Math.abs(view.yaw)<.01));
}
function changeZoom(factor){
  interaction.cancel(view);
  view.zoomAt(view.zoom*factor);
  updateViewLabel();
}
function project(x,z,y){
  const outdoor=view!==indoorView&&view!==lodgeView&&view!==farmView;
  return view.project(x,z,(y??(outdoor?bridgeHeight({x,z}):0))+(outdoor?forestHeight(x,z):0),W,H);
}
function ellipse(x,y,rx,ry,color){
  c.fillStyle=color;
  c.beginPath();
  c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  c.fill();
}
function path(points,color){
  c.fillStyle=color;
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();
  c.fill();
}
function planOutdoorWalk(from,point){
  const goal={x:clamp(point.x,CONFIG.playerBounds.minX,CONFIG.playerBounds.maxX),z:clamp(point.z,CONFIG.playerBounds.minZ,CONFIG.playerBounds.maxZ)};
  keepDry(goal);
  clearTrunks(goal);
  const route=groveRoute(from,dryRoute(from,goal));
  return {goal,route};
}
function walkToOutdoor(point,plan=planOutdoorWalk(player,point)){
  const {goal,route}=plan,target=route.shift();
  outdoorWalk={goal,route,target};
  player.tx=target.x;player.tz=target.z;marker=goal;
}
// Test the sightline at the doorway, rather than the distant field point's x.
function tapBeyondDoor(kind,visit,ground,x,y){
  if(!ground||ground.z>=0)return false;
  if(!groundThroughDoor(kind,view.basis(W,H),ground))return true;
  const door=CONFIG[kind].entrance;
  const bridge=pickBridge(x,y,(wx,wz,height)=>view.project(wx-door.x,wz-door.z,height,W,H));
  const goal=bridge||{x:door.x+ground.x,z:door.z+ground.z};
  visit.requestExit(player);
  doorwayWalk={visit,route:visit.route,goal};
  keys.clear();marker=null;
  return true;
}
function continueThroughDoor(){
  if(!doorwayWalk)return;
  const {visit,route,goal}=doorwayWalk;
  if(visit.route!==route){
    if(doorwayWalk.fromMap && visit===lodgeVisit && (visit.exitAfterStairs||visit.trip==='exit'))doorwayWalk.route=visit.route;
    else{doorwayWalk=null;return;}
  }
  if(visit.inside)return;
  doorwayWalk=null;
  // All front doors face -z. Keep the outdoor orbit camera on the field side.
  if(Math.cos(outdoorView.yaw)<0)outdoorView.yaw=Math.sign(Math.sin(outdoorView.yaw))*Math.PI/2;
  following=true;
  walkToOutdoor(goal);
}
function cancelOutdoorWalk(){
  forestPet=null;
  if(!outdoorWalk)return;
  outdoorWalk=null;player.tx=player.x;player.tz=player.z;marker=null;
}
function advanceOutdoorWalk(){
  if(!outdoorWalk)return;
  const walk=outdoorWalk;
  if(barnVisit.inside||lodgeVisit.inside||farmVisit.inside||Math.hypot(player.tx-walk.target.x,player.tz-walk.target.z)>.001){outdoorWalk=null;return;}
  if(Math.hypot(player.x-player.tx,player.z-player.tz)>.08)return;
  if(walk.route.length){walk.target=walk.route.shift();player.tx=walk.target.x;player.tz=walk.target.z;}
  else{
    outdoorWalk=null;marker=null;
    if(walk.boardFor){boardTram(walk.boardFor);return;}
    const stop=TRAM_STATION.waitingSpot;
    if(Math.hypot(walk.goal.x-stop.x,walk.goal.z-stop.z)<.12 && atStationBoard())openStationBoard();
    if(forestPet?.walk===walk){
      if(Math.hypot(player.x-forestPet.x,player.z-forestPet.z)<1.3)forestPet.start=t;
      else forestPet=null;
    }
  }
}
function addBridgeRails(layers){
  for(const bridge of BRIDGES)for(const side of [-1,1]){
    const at=bridgePoint(0,side*(bridge.halfWidth-.05),bridge);
    layers.push({...at,cover:{halfWidth:18,above:5,below:5},draw:()=>drawBridgeRail(c,project,side,bridge)});
  }
}
function background(showGrove){
  drawPasture(c,W,H,t,sunset,view,project,ellipse,path,atmosphere);
  drawHills(c,view,W,H,atmosphere);
  if(showGrove)drawForestFloor(c,project,view.basis(W,H),W,H,atmosphere);
  drawBridgeDeck(c,project);
  drawVegetation(c,grass,project,t,W,H);
  for(const pile of interaction.hayPiles)drawHayPile(c,project(pile.x,pile.z),pile);
  for(const a of sheep)if(a.state==='drinking'){const dx=CONFIG.pond.x-a.x,dz=CONFIG.pond.z-a.z,d=Math.hypot(dx,dz)||1;drawRipples(c,project(a.x+dx/d*.8,a.z+dz/d*.8,.03),t);}
}
function barn(x,y,s){
  c.save();
  c.translate(x,y-22*s);
  c.scale(s,s);
  ellipse(0,20,70,9,'#4c66332b');
  path([[-46,-38],[45,-38],[45,22],[-46,22]],'#d3c8a6');
  path([[-60,-38],[0,-77],[58,-38]],sunset?'#76604d':'#7d6650');
  c.fillStyle='#433f32';
  c.fillRect(-14,-15,26,37);
  c.fillStyle='#593c2a';c.fillRect(-22,-35,44,12);
  c.fillStyle='#f7deab';c.font='bold 8px sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText('건초 창고',0,-29);
  c.fillStyle='#ebe5cb';
  c.fillRect(-34,-21,13,13);
  c.fillRect(24,-21,13,13);
  // Slide the panel along the wall to reveal the entrance.
  const panel=-14-entranceDoors.shed*27;
  c.fillStyle='#656e55';c.fillRect(panel,-15,26,37);
  c.strokeStyle='#c8c6a7';c.lineWidth=2;c.strokeRect(panel+1,-14,24,35);
  c.fillStyle='#423e32';c.fillRect(panel+21,1,2,5);
  c.restore();
}
function tree(x,y,s){
  c.save();
  c.translate(x,y);
  c.scale(s,s);
  c.fillStyle='#777458';
  c.fillRect(-3,-37,6,42);
  for(let i=0;i<7;i++)ellipse(Math.sin(i*2.4)*17,-40+Math.cos(i*2.4)*13,23,20,i%2?'#6f8a67':'#789574');
  c.restore();
}
function drawSheep(a){
  renderSheep(c,a,{
    project,time:t,width:W,height:H,player,feeding
  });
  drawFriendBadge(c,project(a.x,a.z),a,t);
}
function drawMarker(){
  if(!marker)return;
  const p=project(marker.x,marker.z);
  if(!p)return;
  c.strokeStyle='#fff5c8bb';
  c.lineWidth=1.5;
  c.beginPath();
  c.ellipse(p.x,p.y,p.s*.28,p.s*.09,0,0,Math.PI*2);
  c.stroke();
}
function refreshMeadowTime(){
  environmentTimer=0;
  const next=meadowTime.apply(weather.snapshot());
  // A deliberate daytime choice releases night shelter immediately. Animals
  // still walk through their door; rain/snow and manual gathering keep priority.
  if(!next.night&&!next.wet&&!shelter.manual)shelter.dryFor=20;
}
function update(dt){
  if(paused)return;
  weather.tick();environmentTimer-=dt;
  if(environmentTimer<=0){
    atmosphere=meadowTime.apply(weather.snapshot());environmentTimer=.5;sunset=atmosphere.dusk&&!atmosphere.night;
    $('clock').textContent=atmosphere.text;
    canvas.setAttribute('aria-label',`${farmVisit.inside?`${FARM_ROOMS[farmVisit.kind].title} 실내. 바닥을 누르거나 방향키로 걸어 다녀요.`:barnVisit.inside?'축사 실내. 쉬는 양들을 볼 수 있어요.':lodgeVisit.inside?`목동 숙소 ${lodgeVisit.floor}층. 방을 걸어 다니고 계단으로 층을 옮길 수 있어요.`:'양들이 지내는 목장.'} ${atmosphere.preview?'감상용 ':atmosphere.live?'지역 날씨 ':''}${atmosphere.label}. 축사에서 쉬는 양 ${shelter.inside}마리, 옆 닭장에서 쉬는 닭 ${companions.coopInside}마리. 목동을 누르면 대화합니다. 풀밭을 누르면 이동합니다.`);
    $('weather-label').textContent=atmosphere.preview?`${atmosphere.label} · 감상용`:atmosphere.live?`${atmosphere.location} · ${atmosphere.label}`:'바람목장 · 지역 날씨 미연결';
  }
  if(shelter.updateWeather(dt,atmosphere.wet,atmosphere.night)){
    if(shelter.active){interaction.cancel(view);interaction.mode='pet';interaction.supplyTrip=false;if(feeding)feed();notify(shelter.reason==='night'?'해가 졌어요. 개들이 양은 축사로, 닭은 닭장으로 안내해요.':'개들이 양은 축사로, 닭은 닭장으로 안내해요.');}
    else notify('하늘이 개었어요. 양과 닭이 차례로 밖에 나와요.');
  }
  let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
  if(!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside)player.buildingAccess=barnVisit.trip==='enter'?'barn':lodgeVisit.trip==='enter'?'lodge':farmVisit.trip==='enter'?farmVisit.kind:interaction.supplyTrip?'shed':null;
  updateEntranceDoors(dt);
  advanceOutdoorWalk();
  const byStation=atStationBoard()||nearBoardingDoor();
  $('station-board-open').hidden=!byStation||stationBoard.open||!!outdoorWalk?.boardFor;
  $('station-ride-open').hidden=$('station-board-open').hidden||!selectedDestination;
  player.walking=false;
  if(started&&!seated&&!hammocking&&interaction.active?.phase!=='playing'&&(dx||dz)){
    const wx=dx*Math.cos(view.yaw)+dz*Math.sin(view.yaw),wz=-dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw);
    if(farmVisit.inside)farmVisit.walkTo({x:player.x+wx*3,z:player.z+wz*3},player);
    else if(barnVisit.inside)barnVisit.walkTo({x:player.x+wx*3,z:player.z+wz*3},player);
    else if(lodgeVisit.inside)lodgeVisit.steer(wx,wz,player);
    else{cancelOutdoorWalk();player.tx=clamp(player.x+wx*3,CONFIG.playerBounds.minX,CONFIG.playerBounds.maxX);player.tz=clamp(player.z+wz*3,CONFIG.playerBounds.minZ,CONFIG.playerBounds.maxZ);}
    marker=null;
  }
  if(!seated&&!hammocking&&interaction.active?.phase!=='playing'){
    let x=player.tx-player.x,z=player.tz-player.z,d=Math.hypot(x,z);
    if(d>.08){
      player.walking=true;
      player.headingX=x/d;
      player.headingZ=z/d;
      player.facing=x>=0?1:-1;
      const move=Math.min(d,dt*3.2);
      const next={x:player.x+x/d*move,z:player.z+z/d*move};
      if(!farmVisit.inside&&!lodgeVisit.inside&&!barnVisit.inside&&waitingForDoor(next))player.walking=false;
      else if(lodgeVisit.inside)lodgeVisit.move(player,next,!!(dx||dz));
      else if(barnVisit.inside||farmVisit.inside||bridgePathClear(player,next)){
        player.x=next.x;player.z=next.z;
        if(!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside){keepDry(player);clearTrunks(player);}
      }
    }
    else marker=null;
  }
  if(walkingToHammock&&Math.hypot(player.x-CONFIG.hammock.x,player.z-CONFIG.hammock.z)<=.08)lieInHammock();
  const farmTransition=farmVisit.trip==='enter'&&farmVisit.kind==='shed'&&waitingForDoor(player)?null:farmVisit.tick(player);
  if(farmTransition){
    if(farmTransition==='blocked')notify('그곳으로 가는 길이 막혀 있어요. 다른 위치에서 다시 걸어가요.');
    else{
      interaction.cancel(view);keys.clear();selected=null;marker=null;feeding=false;
      view=farmVisit.inside?farmView:outdoorView;
      if(farmVisit.inside){farmView.roomFollow=null;farmView.yaw=0;farmView.pitch=-.03;farmView.eyeHeight=1.65;}
      document.body.classList.toggle('in-utility',farmVisit.inside);
      $('farm-room-leave').hidden=!farmVisit.inside;$('farm-room-status').hidden=!farmVisit.inside;
      notify(farmVisit.inside?`${FARM_ROOMS[farmVisit.kind].title} 안에 들어왔어요. 바닥을 눌러 걸으며 둘러보세요.`:'문을 지나 목장으로 나왔어요.');
    }
  }
  if(farmVisit.inside)$('farm-room-status').textContent=farmVisit.kind==='coop'?`닭장 · 쉬는 닭 ${companions.coopInside} / ${companions.chickens.length}`:'창고 · 건초와 목장 도구';
  const transition=barnVisit.tick(player);
  if(transition){
    interaction.cancel(view);keys.clear();selected=null;marker=null;feeding=false;
    view=barnVisit.inside?indoorView:outdoorView;document.body.classList.toggle('in-barn',barnVisit.inside);
    $('barn-leave').hidden=!barnVisit.inside;$('barn-room-status').hidden=!barnVisit.inside;
    notify(barnVisit.inside?'축사 안으로 들어왔어요. 중앙 통로를 걸어보세요.':'축사 문을 나왔어요.');
  }
  if(barnVisit.inside)$('barn-room-status').textContent=`큰 양들의 축사 · 쉬는 양 ${shelter.inside} / ${sheep.length}`;
  const lodgeTransition=lodgeVisit.trip==='enter'&&waitingForDoor(player)?null:lodgeVisit.tick(player,dt);
  if(lodgeTransition){
    interaction.cancel(view);keys.clear();selected=null;marker=null;feeding=false;
    view=lodgeVisit.inside?lodgeView:outdoorView;
    if(lodgeTransition==='entered'){lodgeView.stairShot=null;lodgeView.settleUntil=0;lodgeView.yaw=0;lodgeView.pitch=.025;lodgeView.zoom=1.25;}
    document.body.classList.toggle('in-lodge',lodgeVisit.inside);
    $('lodge-leave').hidden=!lodgeVisit.inside;
    $('lodge-stairs').hidden=!lodgeVisit.inside;
    $('lodge-room-status').hidden=!lodgeVisit.inside;
    notify(lodgeTransition==='entered'?'집 안에 들어왔어요. 화면을 밀어 둘러보고 바닥을 눌러 걸어보세요.':lodgeTransition==='upstairs'?'2층에 올라왔어요. 발코니 너머 목장을 둘러보세요.':lodgeTransition==='downstairs'?'1층으로 내려왔어요.':'목동의 집을 나왔어요.');
  }
  continueThroughDoor();
  if(lodgeVisit.inside){
    $('lodge-stairs').disabled=!!lodgeVisit.stair;
    $('lodge-stairs').textContent=lodgeVisit.stair?(lodgeVisit.trip==='up'?'계단 올라가는 중':'계단 내려가는 중'):lodgeVisit.floor===1?'↑ 2층 전망대로':'↓ 1층 휴식 공간으로';
    $('lodge-room-status').textContent=`${lodgeVisit.floor}층 · ${lodgeVisit.floor===1?'목동과 강아지의 휴식 공간':'목장 전망 발코니'} · 목동 ${shepherd.insideLodge?'휴식 중':'목장 순찰 중'} · 개 ${companions.dogs.filter(a=>a.hiddenInLodge).length}마리 휴식 중`;
  }
  if(pendingShepherdTalk&&!lodgeVisit.stair&&!farmVisit.inside&&!barnVisit.trip&&!lodgeVisit.trip&&!farmVisit.trip&&!barnVisit.inside&&(!lodgeVisit.inside||lodgeVisit.floor===1)){
    pendingShepherdTalk=false;requestShepherdTalk();
  }
  const talkEvent=shepherd.updateTalk(player,{indoors:lodgeVisit.inside&&lodgeVisit.floor===1});
  if(talkEvent==='ready'){keys.clear();marker=null;if(lodgeVisit.inside){lodgeView.yaw=Math.atan2(shepherd.talk.point.x-player.x,shepherd.talk.point.z-player.z);lodgeView.pitch=.015;}chat?.open();}
  else if(talkEvent==='cancelled')chat?.close();
  const worldPlayer=farmVisit.inside?farmVisit.outside:barnVisit.inside?barnVisit.outside:lodgeVisit.inside?lodgeVisit.outside:player;
  // All painted scenery and world objects share one camera transform.
  interaction.tick(dt,{
    player,view,width:W,height:H,onMessage:notify,onMilk:onFed
  });
  shelter.tick(dt,{flock,dogs:companions.dogs,yaw:view.yaw});
  flock.tick(dt,{
    player:worldPlayer,feeding:feeding&&!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside,yaw:outdoorView.yaw,hayPiles:interaction.hayPiles,
    canTug:started&&!millMode&&!outdoorWalk&&!shepherd.talk&&!pendingShepherdTalk&&!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside&&!barnVisit.trip&&!lodgeVisit.trip&&!farmVisit.trip&&!shelter.active&&!walkingToHammock&&!interaction.busy&&!seated&&!hammocking&&interaction.mode!=='milk',
    onFed,onBaa:a=>{if(!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside)audioSystem.baa(a,worldPlayer,outdoorView.yaw);},
    onTug:a=>{
      if(interaction.startTug(a,player,view))notify('장난꾸러기가 옷자락을 살짝 당겨요.');
    }
  });
  bond.tick(dt,{flock,player:worldPlayer,active:interaction.active,feeding,yaw:view.yaw,available:started&&!outdoorWalk&&!shepherd.talk&&!pendingShepherdTalk&&!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside&&!barnVisit.trip&&!lodgeVisit.trip&&!farmVisit.trip&&!shelter.active&&!hammocking&&!seated&&!walkingToHammock,notify});
  lambPlay.tick(dt,{flock,feeding,sheltering:shelter.active,yaw:view.yaw});
  if(started)shepherd.tick(dt,{player:worldPlayer,sheep,sheltering:shelter.active});
  if(forestPet?.companion){
    const pet=forestPet, room=farmVisit.inside?farmVisit.kind:lodgeVisit.inside?'lodge':null;
    if(room!==pet.room || (pet.room? !indoorPets.some(g=>g.animal===pet.companion) : shelter.active || (pet.start===Infinity && outdoorWalk!==pet.walk)))forestPet=null;
    else if(pet.room && pet.start===Infinity && !player.walking && Math.hypot(player.x-pet.x,player.z-pet.z)<1.05)pet.start=t;
    else if(t>=pet.start+1.5)forestPet=null;
  }
  companions.tick(dt,{
    held:forestPet?.companion,
    player:worldPlayer,sheep,yaw:outdoorView.yaw,sheltering:shelter.active,shepherd
  });
  updateCareUI();
  for(const p of particles){
    p.life-=dt;
    p.y+=dt*p.v;
  }
  while(particles.length&&particles[0].life<0)particles.shift();
}
function onFed(a){
  bond.add(a,2);
  feedCount++;
  friends.add(a.name);
  $('fed-count').textContent=feedCount;
  $('friend-count').textContent=friends.size;
}
function updateCareUI(){
  updateViewLabel();
  $('care-cancel').hidden=farmVisit.inside||barnVisit.inside||(lodgeVisit.inside&&!shepherd.talk)||(!shepherd.talk&&!barnVisit.trip&&!lodgeVisit.trip&&!farmVisit.trip&&!walkingToHammock&&!interaction.busy&&interaction.mode!=='milk'&&!interaction.supplyTrip);
  $('care-cancel').textContent=shepherd.talk?(shepherd.talk.phase==='approach'?'목동에게 가기 취소':'목동과 대화 마치기'):farmVisit.trip==='enter'?`${FARM_ROOMS[farmVisit.kind].title} 가기 취소`:barnVisit.trip==='enter'?'축사 가기 취소':walkingToHammock?'해먹 가기 취소':interaction.busy?'교감 마치기':interaction.supplyTrip?'창고 가기 취소':'우유 주기 마치기';
  if(interaction.carrying){
    $('feed').querySelector('strong').textContent='건초 내려놓기';
    $('feed').disabled=hammocking;
  }
  else{
    $('feed').querySelector('strong').textContent=feeding?'건초 거두기':'건초 내밀기';
    $('feed').disabled=hammocking||interaction.busy;
  }
  $('milk').setAttribute('aria-pressed',String(interaction.mode==='milk'));
  $('hay').textContent=interaction.carrying?'건초를 들고 있어요':'창고에서 건초 가져오기';
}
function drawWorldLayer(layer){
  const p=layer.projected??project(layer.x??0,layer.z,layer.height);if(!p)return;
  buildingOcclusion.draw(c,p.depth,spriteBounds(p,layer.cover),()=>layer.draw());
}
let forestPet=null;
function activeAnimalPet(){
  return forestPet && t>=forestPet.start && t<forestPet.start+1.5 ? forestPet : null;
}
function outdoorVisitorFeet(){
  const deck=stationWalkingHeight(player.x,player.z);
  return project(player.x,player.z,deck ? deck+.025 : undefined);
}
let indoorPets=[];
function companionHit(a,x,z){
  const p=project(a.x,a.z);
  if(!p)return false;
  const scale=p.s*(a.type==='chicken'?.55:1);
  return Math.abs(x-p.x)<=Math.max(6,scale*1.13)&&z>=p.y-Math.max(10,scale*1.6)&&z<=p.y+3;
}
function petCompanion(animal,position,room=null){
  if(seated||hammocking||interaction.carrying){notify('손을 비우고 일어난 뒤 쓰다듬을 수 있어요.');return;}
  if(!room&&shelter.active){notify('동물들이 비를 피하거나 쉴 곳으로 이동 중이에요.');return;}
  interaction.cancel(view);keys.clear();
  const chicken=animal.type==='chicken', size=chicken?.33:.56;
  const side=(player.x-position.x)*Math.cos(view.yaw)-(player.z-position.z)*Math.sin(view.yaw)<0?-1:1;
  const reach=chicken?.55:.85;
  const goal={x:position.x+side*reach*Math.cos(view.yaw),z:position.z-side*reach*Math.sin(view.yaw)};
  if(room)(room==='coop'?farmVisit:lodgeVisit).walkTo(goal,player);
  else walkToOutdoor(goal);
  forestPet={companion:animal,room,small:true,x:position.x,z:position.z,size,
    headX:animal.dir*(chicken?.25:.52)/size,headY:-(chicken?.59:animal.state==='rest'?.66:1.12)/size,start:Infinity,walk:outdoorWalk};
  notify((animal.name||'닭')+' 쓰다듬기');
}
let visibleWildlife=[];
function paintWorldLayers(layers){
  const visibleBuildings=new Set(layers.filter(layer=>layer.building).map(layer=>layer.building));
  const hub=project(CONFIG.windmill.x,CONFIG.windmill.entrance.z,17.8);
  const sailsInView=hub&&hub.x>-8*hub.s&&hub.x<W+8*hub.s&&hub.y>-8*hub.s&&hub.y<H+8*hub.s;
  const meshes=[...getBuildingOcclusionMeshes({snow:atmosphere.kind==='snow',millTime:sailsInView?t:undefined,lodgeDoor:entranceDoors.lodge}).filter(mesh=>visibleBuildings.has(mesh.kind)),...(visibleBuildings.has('shed')?[shedOccluder]:[])];
  buildingOcclusion.prepare(view.basis(W,H),W,H,meshes,view===lookoutView?.12:.8);
  layers.forEach(layer=>layer.depth=layer.projected?.depth??project(layer.x??0,layer.z,layer.height)?.depth??-1);
  layers.sort((a,b)=>b.depth-a.depth);
  visibleWildlife=layers.filter(layer=>layer.wildlife&&layer.depth>0).reverse();
  // Paint solid buildings first. Every subsequent world sprite uses their
  // actual nearest surface depth, rather than the building entrance's depth.
  for(const layer of layers)if(layer.building)buildingOcclusion.drawBuilding(c,layer.building,()=>layer.draw());
  for(const layer of layers)if(!layer.building&&!layer.focused&&layer.depth>0)drawWorldLayer(layer);
  for(const layer of layers)if(!layer.building&&layer.focused&&layer.depth>0)drawWorldLayer(layer);
}
function drawOutdoorScenery(interiorKind,showVisitor=true){
  const showGrove=groveVisible(project,W,H);
  background(showGrove);
  const railwayVisible=Math.hypot(view.target.x-TRAM_STATION.x,view.target.z-TRAM_STATION.z)<115;
  const railwayLighting={snow:atmosphere.kind==='snow',night:atmosphere.night,label:false};
  if(railwayVisible)drawBuilding3D(c,'tram-track',project,view,W,H,{...railwayLighting,shadow:false});
  if(!interiorKind)drawMarker();
  const petFocus=!interiorKind&&interaction.active?.kind==='pet'&&interaction.active.phase==='playing'?interaction.active.animal:null;
  const lowPet=interiorKind?null:activeAnimalPet();
  const layers=sheep.map(a=>({
    x:a.x,z:a.z,actor:true,focused:a===petFocus,cover:{halfWidth:1.9*a.size,above:3*a.size+(a.hop||0)*a.size+.5,below:.5*a.size},draw:()=>interiorKind?renderSheep(c,a,{project,time:t,width:W,height:H,player:lookoutView.target}):drawSheep(a)
  }));
  layers.push(windmillLayer());
  if(railwayVisible){
    for(const [kind,origin] of [['station',TRAM_STATION],['tram',TRAM_STOP],['tram-platform',tramPlatformOrigin]]){
      layers.push({...origin,building:kind,draw:()=>drawBuilding3D(c,kind,project,view,W,H,{...railwayLighting,shadow:kind!=='tram-platform'})});
    }
  }
  layers.push({
    x:CONFIG.hammock.x,z:CONFIG.hammock.z,cover:{halfWidth:4.3,above:5.1,below:.6},draw:()=>drawHammock(c,project(CONFIG.hammock.x,CONFIG.hammock.z),{
      time:t,occupied:hammocking,sunset
    })
  });
  layers.push({x:CONFIG.barn.x,z:CONFIG.barn.entrance.z,building:'barn',draw:()=>{barnVisit.screen=drawBuilding3D(c,'barn',project,view,W,H,{inside:shelter.inside,total:sheep.length,snow:atmosphere.kind==='snow',night:atmosphere.night,label:false});}});
  layers.push({x:CONFIG.coop.x,z:CONFIG.coop.entrance.z,building:'coop',draw:()=>{coopScreen=drawBuilding3D(c,'coop',project,view,W,H,{inside:companions.coopInside,total:companions.chickens.length,snow:atmosphere.kind==='snow',night:atmosphere.night,label:false});}});
  layers.push({x:CONFIG.lodge.x,z:CONFIG.lodge.entrance.z,building:'lodge',draw:()=>{lodgeScreen=drawBuilding3D(c,'lodge',project,view,W,H,{night:atmosphere.night,snow:atmosphere.kind==='snow',occupants:Number(shepherd.insideLodge)+companions.dogs.filter(a=>a.hiddenInLodge).length,label:false});}});
  if(showVisitor&&!interiorKind&&started&&!hammocking){
    const feet=outdoorVisitorFeet();
    const petTarget=lowPet||petFocus;
    const contactPoint=petTarget&&project(petTarget.x,petTarget.z);
    const facing=contactPoint&&feet ? (contactPoint.x>=feet.x?'right':'left')
      : interaction.active?.phase==='playing' ? visitorPose(interaction.active.animal.x-player.x,interaction.active.animal.z-player.z,view.yaw)
      : visitorPose(player.headingX??0,player.headingZ??1,view.yaw);
    layers.push({
      x:player.x,z:player.z,projected:feet,focused:!!petFocus,cover:{halfWidth:2.8,above:3,below:.5},draw:()=>drawVisitor(c,feet,{
        time:t,walking:player.walking,seated,feeding,petting:!!petTarget,milking:interaction.active?.kind==='milk'&&interaction.active.phase==='playing',lambSize:petTarget?.size??interaction.active?.animal.size,pose:facing
      })
    });
  }
  addDenLayers(layers,c,project,dugDens);
  addBirchLayers(layers,c,project,W,H);
  if(showGrove)addForestLayers(layers,c,project,W,H,t,view.yaw,forestPet);
  for(const a of meadowTrees)layers.push({
    x:a.x,z:a.z,cover:{halfWidth:a.size*1.3,above:a.size*1.8,below:.4},draw:()=>{
      const p=project(a.x,a.z);if(p&&p.x>-300&&p.x<W+300)tree(p.x,p.y,p.s*a.size/45);
    }
  });
  layers.push({x:firTree.x,z:firTree.z,cover:{halfWidth:4,above:10.2,below:.5},draw:()=>drawFirTree(c,project(firTree.x,firTree.z))});
  layers.push({
    x:CONFIG.shed.x,z:CONFIG.shed.z,building:'shed',draw:()=>{
      const p=project(CONFIG.shed.x,CONFIG.shed.z);if(p){barn(p.x,p.y,p.s/8);shedScreen={x:p.x,y:p.y,w:p.s*15,h:p.s*13};}
    }
  });
  layers.push({
    x:14,z:55,cover:{halfWidth:2.8,above:5.2,below:.5},draw:()=>drawWindmill(c,project(14,55),t)
  });
  for(let i=0;i<4;i++)layers.push({
    x:20+i*1.2,z:45,draw:()=>{
      const p=project(20+i*1.2,45);if(p)ellipse(p.x,p.y-p.s*.4,p.s*.55,p.s*.5,'#d2bb74');
    }
  });
  if(!shepherd.insideLodge)layers.push({x:shepherd.x,z:shepherd.z,actor:true,cover:{halfWidth:1.2,above:3.2,below:.4},draw:()=>drawShepherdBoy(c,project(shepherd.x,shepherd.z),shepherd,view.yaw)});
  for(const a of companions.animals)if(!a.hiddenInCoop&&!a.hiddenInLodge)layers.push({
    x:a.x,z:a.z,actor:true,cover:{halfWidth:2.1,above:2.3,below:.5},draw:()=>drawCompanion(c,project(a.x,a.z),a,t)
  });
  if(atmosphere.night){
    const owlTree=trees.reduce((best,a)=>Math.hypot(a.x-CONFIG.barn.x,a.z-CONFIG.barn.entrance.z)<Math.hypot(best.x-CONFIG.barn.x,best.z-CONFIG.barn.entrance.z)?a:best,trees[0]);
    const owl=owlPosition(t,CONFIG.barn,owlTree);
    layers.push({x:owl.x,z:owl.z,height:owl.y,cover:{halfWidth:1.8,above:1.8,below:.8},draw:()=>drawOwl(c,project(owl.x,owl.z,owl.y),t,owl.flying)});
  }
  addGardenLayers(c,project,layers,W,H);
  addBridgeRails(layers);
  paintWorldLayers(interiorKind?layers.filter(layer=>layer.building!==interiorKind):layers);
}
function render(){
  $('dig-den').hidden=availableDen()<0;
  if(farmVisit.inside){renderInsideFarmRoom();return;}
  if(lodgeVisit.inside){renderInsideLodge();return;}
  if(barnVisit.inside){renderInsideBarn();return;}
  centerView();
  c.setTransform(dpr,0,0,dpr,0,0);
  c.clearRect(0,0,W,H);
  c.fillStyle=sunset?'#586d41':'#5c813f';
  c.fillRect(0,0,W,H);
  c.save();
  drawOutdoorScenery();
  const visitor=outdoorVisitorFeet();
  const lowPet=activeAnimalPet();
  // The shared pet arm aims at the near edge of sheep fleece. For a deer's
  // narrower torso, move that reference inward so the palm lands on its coat.
  const petProject=lowPet?.deer?(x,z)=>{
    const p=project(x,z);
    if(!p||!visitor)return p;
    return {...p,x:p.x+(p.x>=visitor.x?1:-1)*p.s*.53};
  }:project;
  if(visitor)buildingOcclusion.draw(c,visitor.depth,spriteBounds(visitor,{halfWidth:5,above:4,below:1}),()=>drawInteraction(c,lowPet?{active:{kind:"pet",phase:"playing",animal:lowPet}}:interaction,player,petProject,t,visitor));
  for(const p of particles){
    const v=project(p.x,p.z,p.y);
    if(v&&!buildingOcclusion.occluded(v.x,v.y,v.depth)){
      c.globalAlpha=clamp(p.life,0,1);
      ellipse(v.x,v.y,2.5,2.5,'#ffe8a3');
      c.globalAlpha=1;
    }
  }
  c.restore();
  drawWeather(c,W,H,t,atmosphere);
  if(millMode)refreshMillPanel();
  if(selected&&interaction.busy){
    const base=project(selected.x,selected.z,2.1*selected.size),p=base&&view.toScreen(base.x,base.y);
    const head=project(selected.x,selected.z,1.2*selected.size),feet=project(selected.x,selected.z);
    if(p&&head&&feet&&!buildingOcclusion.occluded(head.x,head.y,feet.depth)){
      $('sheep-label').hidden=false;
      $('sheep-label').style.left=clamp(p.x,65,W-65)+'px';
      $('sheep-label').style.top=clamp(p.y,180,H-235)+'px';
      $('sheep-name').textContent=selected.name;
      $('sheep-mood').textContent=selected.state==='milk'?(selected.careContact?'젖병으로 우유를 먹고 있어요':'다가오는 사람을 바라봐요'):selected.state==='pet'?(selected.careContact?'눈을 감고 손길을 느껴요':'다가오는 사람을 바라봐요'):selected.state==='sleep'?'풀밭에서 꾸벅꾸벅 졸고 있어요':selected.state==='nursing'?'어미 곁에서 젖을 먹어요':selected.state==='drinking'?'물가에서 물을 마셔요':selected.bite>0?'오물오물, 맛있어요':selected.pet>0?'쓰다듬어 주니 좋아해요':selected.cool>0?'배불러서 풀밭을 산책해요':feeding?'건초 냄새를 맡고 다가와요':'느긋하게 풀을 뜯는 중';
    }else $('sheep-label').hidden=true;
  }
  else $('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=started?0:1;
}
// Render the same outdoor station once for this shot. Only the walking
// passenger needs repainting while the tram is stopped at the platform.
const boardingView=new BarnInteriorView();
// Look out through the open shelter front, clear of both its corner post and
// the face of the coach at the far end of the passenger's step.
boardingView.target={x:TRAM_STATION.x-.75,z:TRAM_STATION.z+.55};
boardingView.yaw=2.83;
boardingView.pitch=.095;
boardingView.eyeHeight=1.9;
function captureBoardingPlatform(){
  const previous=view;
  view=boardingView;
  view.orbitFocal=Math.min(W*.87,H*.68);
  c.save();
  try{
    setTramBoardingDoor(true);
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,W,H);
    drawOutdoorScenery(null,false);
    drawWeather(c,W,H,t,atmosphere);
  }finally{
    setTramBoardingDoor(false);
    c.restore();
    view=previous;
  }
}
function drawBoardingShot(boarding){
  const shot=$('boarding-shot');
  if(!boarding.captured||shot.width!==canvas.width||shot.height!==canvas.height){
    shot.width=canvas.width;shot.height=canvas.height;
    captureBoardingPlatform();
    boarding.captured=true;
  }
  const ctx=shot.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(canvas,0,0);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const pose=tramBoardingPose(boarding.start,boarding.exiting?TRAM_BOARDING_WALK-boarding.time:boarding.time);
  const feet=boardingView.project(pose.x,pose.z,pose.height+.025,W,H);
  if(!feet)return;
  buildingOcclusion.draw(ctx,feet.depth,spriteBounds(feet),()=>drawVisitor(ctx,feet,{
    time:boarding.time,walking:boarding.exiting?boarding.time<TRAM_BOARDING_WALK:pose.walking,pose:visitorPose(0,boarding.exiting?1:-1,boardingView.yaw),label:false
  }));
}
function advanceTramBoarding(now){
  const boarding=ride.boarding;
  if(boarding.last!==null){
    boarding.time=Math.min(TRAM_BOARDING_WALK,boarding.time+clamp((now-boarding.last)/1000,0,.16));
  }
  boarding.last=now;
  drawBoardingShot(boarding);
  if(boarding.time<TRAM_BOARDING_WALK)return;
  if(boarding.exiting){player.headingX=0;player.headingZ=1;rideDialog.close();return;}
  boarding.landedAt??=now;
  if(now-boarding.landedAt<TRAM_BOARDING_HOLD*1000)return;
  ride.boarding=null;
  drawTramRide($('ride-landscape'),$('ride-cabin'),ride.name,0,ride.yaw,ride.pitch,false);
  rideDialog.classList.toggle('boarding',false);
  $('ride-return').textContent='목장역행 열차 타기';
  $('ride-status').textContent=ride.name+'행 · 운행 중';
  $('ride-view').hidden=false;
  $('ride-look-hint').hidden=false;
}
function frame(now){
  const dt=Math.min((now-last)/1000||.016,.06);
  const rideDelta=Math.min(.5,Math.max(0,(now-last)/1000));
  last=now;
  if(ride?.boarding){
    advanceTramBoarding(now);
  }else if(ride?.homeward){
    ride.elapsed=Math.max(0,ride.elapsed-rideDelta);
    drawTramRide($('ride-landscape'),$('ride-cabin'),ride.name,ride.elapsed/16,ride.yaw,ride.pitch,ride.windowView);
    if(ride.elapsed===0&&!ride.arrived){
      ride.arrived=true;
      $('ride-status').textContent='목장역 도착';
      $('ride-exit').hidden=false;
    }
  }else if(ride){
    ride.elapsed=Math.min(16,ride.elapsed+rideDelta);
    if(ride.name==='북극'&&ride.elapsed>=APPROACH_START&&!ride.shore){
      ride.shore=createArcticLanding();
      ride.drag=null;
      shoreCanvas.hidden=false;
      $('ride-look-hint').hidden=true;
      $('ride-view').hidden=true;
      $('ride-status').textContent='북극 승강장 진입 중';
    }
    if(ride.elapsed>=16&&!ride.arrived){
      ride.arrived=true;
      $('ride-status').textContent=ride.name+' 도착';
      if(ride.shore){
        ride.shore.phase='arrived';
        $('ride-exit').hidden=false;
        $('ride-view').hidden=false;
        $('ride-view').textContent='객실 보기';
      }
    }
    if(ride.shore&&!shoreCanvas.hidden){
      const phase=ride.shore.phase;
      stepArctic(ride.shore,rideDelta);
      drawArctic(shoreCanvas,ride.shore,ride.elapsed);
      if(phase==='toTram'&&ride.shore.phase==='board')$('ride-status').textContent='목장역행 · 탑승 중';
      if(ride.shore.phase==='inside'){
        ride.shore.landedAt??=now;
        if(now-ride.shore.landedAt>=TRAM_BOARDING_HOLD*1000)beginHomewardRide();
      }
      if(phase==='disembark'&&ride.shore?.phase==='walk'){
        $('ride-return').hidden=false;
        $('ride-status').textContent='북극 해안';
        $('ride-look-hint').textContent='얼음을 눌러 걷기 · 밀어서 둘러보기';
        $('ride-look-hint').hidden=false;
      }
    }else{
      drawTramRide($('ride-landscape'),$('ride-cabin'),ride.name,ride.elapsed/16,ride.yaw,ride.pitch,ride.windowView);
    }
  }else if(!paused){
    t+=dt;
    update(dt);
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function start(){
  if(started)return;
  started=true;
  document.body.classList.add('walking');
  $('welcome').close?.();
  $('welcome').hidden=true;
  view.zoom=1.65;
  const spawn=new URLSearchParams(location.search).get('start');
  if(spawn==='station'){
    const x=TRAM_STATION.entrance.x-6,z=TRAM_STATION.entrance.z-3;
    Object.assign(player,{x,z,tx:x,tz:z,headingX:1,headingZ:0});
    view.yaw=1.05;view.pitch=.15;view.zoom=1.08;
  }
  if(spawn==='birch'){
    const x=-23,z=108;
    Object.assign(player,{x,z,tx:x,tz:z});
    view.pitch=.08;view.zoom=1.9;
  }
  if(spawn==='forest'){
    const z=-27,x=trailX(z);
    Object.assign(player,{x,z,tx:x,tz:z,headingX:0,headingZ:1});
    view.yaw=.03;view.pitch=.08;view.zoom=1.9;
  }
  if(spawn==='windmill'){
    const {x,z}=CONFIG.windmill.entrance;
    Object.assign(player,{x,z:z-8,tx:x,tz:z-8});
    view.zoom=.85;view.pitch=.10;
  }
  if(spawn==='upstream'){
    const {x,z}=streamLookout;
    Object.assign(player,{x,z,tx:x,tz:z});
    view.yaw=-.50;view.pitch=.24;view.zoom=1.65;
  }
  if(spawn==='garden'){
    const at={x:-9.415,z:6.267};
    Object.assign(player,{x:at.x,z:at.z,tx:at.x,tz:at.z});
    view.yaw=-1.36;view.pitch=.28;view.zoom=2.05;
  }
  if(spawn==='lakeshore'){
    const bank=pondPoint(4.82,1.29);
    Object.assign(player,{x:bank.x,z:bank.z,tx:bank.x,tz:bank.z});
    view.yaw=0;
    view.pitch=.47;
    view.zoom=2.35;
  }
  following=true;
  centerView();
  updateViewLabel();
  $('feed').disabled=false;
  $('sit').disabled=false;
  $('hammock').disabled=false;
  $('milk').disabled=false;
  $('hay').disabled=false;
  $('barn-enter').disabled=false;
  $('windmill-enter').disabled=false;
  $('lodge-enter').disabled=false;
  $('coop-enter').disabled=false;$('shed-enter').disabled=false;
  if(!isCompactViewport(W,H))notify('좌우로 밀어 360° 회전 · 두 손가락으로 확대 · 짧게 눌러 걷기');
  else $('toast').style.opacity=0;
  notify('양을 누르면 가까이서 쓰다듬어요. 우유와 건초는 메뉴에 있어요.');
}
const introKey='meadow.skipIntro.v1';
function rememberIntro(skip){
  try{localStorage.setItem(introKey,skip?'1':'0');}catch{}
}
$('start').onclick=()=>{rememberIntro($('skip-intro').checked);start();$('help').focus();};
$('help-skip').onchange=()=>rememberIntro($('help-skip').checked);
$('welcome').addEventListener('cancel',event=>event.preventDefault());
function feed(){
  if(farmVisit.inside){notify('건물 밖으로 나와 양들에게 건초를 주세요.');return;}
  if(barnVisit.inside){notify('양들이 축사에서 쉬고 있어요.');return;}
  if(lodgeVisit.inside){notify('숙소 밖에서 건초를 줄 수 있어요.');return;}
  cancelBarnTrip();cancelLodgeTrip();
  cancelHammockWalk();
  if(interaction.carrying){
    if(interaction.dropHay(player))notify('건초를 펼쳐 놓았어요. 양들이 찾아올 거예요.');
    else notify('놓아둔 건초를 양들이 더 먹은 뒤에 내려놓을 수 있어요.');
    updateCareUI();
    return;
  }
  if(interaction.busy)interaction.cancel(view);
  interaction.mode='pet';
  if(hammocking){
    notify('해먹에서 일어난 뒤 건초를 줄 수 있어요.');
    return;
  }
  if(!started)start();
  feeding=!feeding;
  if(feeding)flock.assignFeedSlots(player);
  $('feed').classList.toggle('active',feeding);
  $('feed').setAttribute('aria-pressed',feeding);
  $('feed').querySelector('strong').textContent=feeding?'건초 거두기':'건초 내밀기';
  $('feed').querySelector('small').textContent=feeding?'조금 기다리면 다가와요':'양들이 다가올 거예요';
  notify(feeding?'건초를 내밀었어요. 양들이 다가오도록 잠시 기다려 주세요.':'건초를 거뒀어요. 양을 눌러 쓰다듬어 보세요.');
}
$('feed').onclick=feed;
$('sit').onclick=()=>{
  if(farmVisit.inside){notify('건물 밖으로 나온 뒤 할 수 있어요.');return;}
  if(barnVisit.inside){notify('축사 밖에서 할 수 있어요.');return;}
  if(lodgeVisit.inside){notify('숙소 밖에서 할 수 있어요.');return;}
  cancelBarnTrip();cancelLodgeTrip();
  if(hammocking)return;
  cancelHammockWalk();
  interaction.cancel(view);
  interaction.mode='pet';
  interaction.supplyTrip=false;
  seated=!seated;
  keys.clear();
  player.tx=player.x;
  player.tz=player.z;
  $('sit').querySelector('span:last-child').textContent=seated?'자리에서 일어나기':'언덕에 앉기';
  $('move-hint').textContent=seated?'바람을 느끼며 쉬는 중':'짧게 눌러 걷기 · 밀어서 둘러보기';
  marker=null;
  notify(seated?'풀밭에 앉았어요. 잠시 양들과 같은 속도로 쉬어가요.':'다시 걸어볼까요?');
};
// Rest uses the same walking target and gait as normal movement.
function cancelHammockWalk(){
  if(!walkingToHammock)return;
  walkingToHammock=false;
  cancelOutdoorWalk();
  player.tx=player.x;
  player.tz=player.z;
  marker=null;
  $('hammock').querySelector('span:last-child').textContent='해먹에서 쉬기';
  $('move-hint').textContent='짧게 눌러 걷기 · 밀어서 둘러보기';
}
function lieInHammock(){
  walkingToHammock=false;
  hammocking=true;
  player.walking=false;
  marker=null;
  $('feed').disabled=true;
  $('sit').disabled=true;
  $('hammock').querySelector('span:last-child').textContent='해먹에서 일어나기';
  $('move-hint').textContent='나무 그늘에서 흔들흔들';
  notify('해먹에 누웠어요. 바람과 양떼를 바라보며 쉬어가요.');
}
$('hammock').onclick=()=>{
  if(farmVisit.inside){notify('건물 밖으로 나온 뒤 할 수 있어요.');return;}
  if(barnVisit.inside){notify('축사 밖에서 할 수 있어요.');return;}
  if(lodgeVisit.inside){notify('숙소 밖에서 할 수 있어요.');return;}
  cancelBarnTrip();cancelLodgeTrip();
  if(!started)start();
  if(walkingToHammock){
    cancelHammockWalk();
    notify('해먹으로 가던 발걸음을 멈췄어요.');
    return;
  }
  interaction.cancel(view);
  interaction.mode='pet';
  interaction.supplyTrip=false;
  keys.clear();
  selected=null;
  if(!hammocking){
    if(feeding)feed();
    seated=false;
    $('sit').querySelector('span:last-child').textContent='언덕에 앉기';
    walkingToHammock=true;
    walkToOutdoor(CONFIG.hammock);
    marker={...CONFIG.hammock};
    $('hammock').querySelector('span:last-child').textContent='해먹 가기 취소';
    $('move-hint').textContent='해먹으로 걸어가는 중';
    notify('나무 그늘의 해먹으로 걸어가요.');
  }
  else{
    hammocking=false;
    // Stand at the hammock instead of returning to a remembered distant spot.
    player.tx=player.x;
    player.tz=player.z;
    $('feed').disabled=false;
    $('sit').disabled=false;
    $('hammock').querySelector('span:last-child').textContent='해먹에서 쉬기';
    $('move-hint').textContent='짧게 눌러 걷기 · 밀어서 둘러보기';
    notify('해먹에서 일어났어요. 양들에게 다시 가볼까요?');
  }
};
function tapWorld(screenX,screenY){
  if(paused)return;
  if(!started){
    start();
    return;
  }
  if(lodgeVisit.stair)return;
  cancelHammockWalk();cancelShepherdTalk();cancelOutdoorWalk();
  const {
    x,y
  }
  =view.toWorld(screenX,screenY);
  if(farmVisit.inside||lodgeVisit.inside){
    const guest=indoorPets.find(g=>companionHit(g,x,y));
    if(guest){petCompanion(guest.animal,guest,farmVisit.inside?farmVisit.kind:'lodge');return;}
  }
  if(farmVisit.inside){
    const ground=view.ground(x,y,W,H);if(!ground)return;
    if(tapBeyondDoor(farmVisit.kind,farmVisit,ground,x,y))return;
    if(ground.z<.8&&Math.abs(ground.x)<1.2)farmVisit.requestExit(player);
    else farmVisit.walkTo(ground,player);
    marker={x:player.tx,z:player.tz};return;
  }
  if(lodgeVisit.inside){
    const npc=shepherd.screen;
    if(lodgeVisit.floor===1&&shepherd.insideLodge&&npc&&Math.abs(x-npc.x)<npc.w*.5&&y<npc.y+8&&y>npc.y-npc.h){requestShepherdTalk();return;}
    if(pickLodgeStairs(x,y,view,W,H,lodgeVisit.elevation)){takeLodgeStairs();return;}
    const ground=view.ground(x,y,W,H);
    if(!ground)return;
    if(lodgeVisit.floor===1&&tapBeyondDoor('lodge',lodgeVisit,ground,x,y))return;
    if(Math.hypot(ground.x-lodgeVisit.landing.x,ground.z-lodgeVisit.landing.z)<.75){takeLodgeStairs();return;}
    if(lodgeVisit.floor===1&&Math.hypot(ground.x,ground.z-.55)<1.3){lodgeVisit.requestExit(player);marker={x:0,z:.55};return;}
    lodgeVisit.walkTo(ground,player);marker={x:player.tx,z:player.tz};return;
  }
  if(barnVisit.inside){
    const hit=barnVisit.visibleAnimals.find(a=>a.screen&&Math.abs(x-a.screen.x)<a.screen.w*.5&&y<a.screen.y+8&&y>a.screen.y-a.screen.h);
    if(hit){notify(`${hit.name}가 포근한 짚 위에서 쉬고 있어요.`);return;}
    const ground=view.ground(x,y,W,H);if(!ground)return;
    if(tapBeyondDoor('barn',barnVisit,ground,x,y))return;
    if(ground.z<.8&&Math.abs(ground.x)<2.9)barnVisit.requestExit(player);
    else barnVisit.walkTo(ground,player);
    marker={x:player.tx,z:player.tz};return;
  }
  // Visible animals/NPCs have priority over the wall behind them. Buildings
  // are picked from the same nearest-surface map used to draw them, never
  // from their bounding rectangle (which also includes open sky and grass).
  cancelBarnTrip();cancelLodgeTrip();
  const hit=[...sheep,...companions.animals.filter(a=>!a.hiddenInCoop&&!a.hiddenInLodge),...(shepherd.insideLodge?[]:[shepherd])].sort((a,b)=>(project(a.x,a.z)?.depth??Infinity)-(project(b.x,b.z)?.depth??Infinity)).find(a=>{
    if(companions.animals.includes(a)){const root=project(a.x,a.z);return root&&companionHit(a,x,y)&&!buildingOcclusion.occluded(x,y,root.depth);}
    const p=a.screen,root=project(a.x,a.z);return !a.hiddenInBarn&&p&&root&&!buildingOcclusion.occluded(x,y,root.depth)&&Math.abs(x-p.x)<p.w*.5&&y<p.y+8&&y>p.y-p.h;
  });
  const wild=visibleWildlife.find(({wildlife:w,depth})=>x>=w.left&&x<=w.right&&y>=w.top&&y<=w.bottom&&!buildingOcclusion.occluded(x,y,depth));
  if(wild&&(!hit||wild.depth<project(hit.x,hit.z).depth)){
    interaction.cancel(view);
    if(seated||hammocking){notify('일어난 뒤 다가가 쓰다듬을 수 있어요.');return;}
    const side=(player.x-wild.x)*Math.cos(view.yaw)-(player.z-wild.z)*Math.sin(view.yaw)<0?-1:1;
    const deer=!wild.rabbit&&!wild.fox;
    const reach=wild.rabbit?.55:wild.fox?.70:.85;
    keys.clear();
    walkToOutdoor({x:wild.x+side*reach*Math.cos(view.yaw),z:wild.z-side*reach*Math.sin(view.yaw)});
    forestPet={id:wild.wildlife.id,deer,direction:wild.direction,x:wild.x,z:wild.z,
      size:wild.rabbit?.33:wild.fox?.46:1,start:Infinity,walk:outdoorWalk};
    notify(wild.wildlife.name+' 쓰다듬기');
    return;
  }
  if(companions.animals.includes(hit)){petCompanion(hit,hit);return;}
  if(hit===shepherd){requestShepherdTalk();return;}
  if(hit){
    if(shelter.active){notify('양들이 축사로 들어가 쉬고 있어요. 하늘이 개면 다시 만나요.');return;}
    if(hammocking||seated){
      notify('일어난 뒤 양과 교감할 수 있어요.');
      return;
    }
    if(feeding)feed();
    selected=hit;
    keys.clear();
    marker=null;
    const result=interaction.request(interaction.mode,hit,player,view);
    notify(result.message);
    return;
  }
  const building=buildingOcclusion.buildingAt(x,y);
  if(building==='windmill'){visitWindmill();return;}
  if(building==='barn'){goBarn();return;}
  if(building==='coop'||building==='shed'){goFarmRoom(building);return;}
  if(building==='lodge'){goLodge();return;}
  interaction.cancel(view);
  interaction.supplyTrip=false;
  selected=null;
  if(hammocking){
    notify('해먹에서 일어나기 버튼을 누르면 다시 걸을 수 있어요.');
    return;
  }
  if(seated){
    notify('일어나기 버튼을 누르면 다시 걸을 수 있어요.');
    return;
  }
  if(building==='station'||building==='tram'||building==='tram-platform'){
    if(building==='tram'&&selectedDestination)walkToTram();
    else walkToOutdoor(building==='tram-platform'?TRAM_STATION.entrance:TRAM_STATION.waitingSpot);
    following=true;
    updateViewLabel();
    return;
  }
  const ground=pickBridge(x,y,project)||hillPick(view,x,y,W,H);
  if(!ground)return;
  walkToOutdoor(ground);
  following=true;
  updateViewLabel();
}
// Delay walking until release so dragging and pinching never create a walk target.
const pointers=new Map();
let gesture=null;
function touchPair(){
  const [a,b]=[...pointers.values()];
  return {
    x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))
  };
}
canvas.addEventListener('pointerdown',e=>{
  if(paused||e.button>0||pointers.size>=2)return;if(!started){
    start();return;
  }
  canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{
    x:e.clientX,y:e.clientY
  });
  if(pointers.size===1)gesture={
    kind:'tap',x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY
  };
  else if(pointers.size===2){
    interaction.cancel(view);gesture={
      kind:'pinch',...touchPair()
    };following=false;
  }
});
canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)||!gesture)return;
  pointers.set(e.pointerId,{
    x:e.clientX,y:e.clientY
  });
  if(pointers.size>=2){
    const pair=touchPair();if(gesture.kind==='pinch'){
      view.zoomAt(view.zoom*pair.d/gesture.d,gesture.x,gesture.y,W,H);
      view.pan(pair.x-gesture.x,pair.y-gesture.y,W,H);
    }
    gesture={
      kind:'pinch',...pair
    };following=false;updateViewLabel();return;
  }
  if(gesture.kind==='blocked')return;
  if(gesture.kind==='tap'&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<8)return;
  interaction.cancel(view);view.pan(e.clientX-gesture.lastX,e.clientY-gesture.lastY,W,H);following=false;
  gesture.kind='drag';gesture.lastX=e.clientX;gesture.lastY=e.clientY;updateViewLabel();
});
function endPointer(e,cancelled=false){
  if(!pointers.has(e.pointerId))return;
  const tap=!cancelled&&pointers.size===1&&gesture?.kind==='tap';
  pointers.delete(e.pointerId);
  gesture=pointers.size?{
    kind:'blocked'
  }
  :null;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(tap)tapWorld(e.clientX,e.clientY);
}
canvas.addEventListener('pointerup',e=>endPointer(e));
canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('lostpointercapture',e=>endPointer(e,true));
canvas.addEventListener('wheel',e=>{
  if(!started||paused)return;e.preventDefault();changeZoom(Math.exp(-clamp(e.deltaY,-200,200)*.002),e.clientX,e.clientY);
},{
  passive:false
});
$('zoom-in').onclick=()=>changeZoom(1.25);
$('zoom-out').onclick=()=>changeZoom(.8);
$('camera-home').onclick=()=>{
  interaction.cancel(view);
  following=true;
  view.yaw=0;
  view.pitch=barnVisit.inside||farmVisit.inside?-.03:.23;
  centerView();
  updateViewLabel();
  notify('내 위치의 기본 시점으로 돌아왔어요.');
};
addEventListener('blur',()=>{
  pointers.clear();gesture=null;
});
addEventListener('keydown',e=>{
  if(millMode||lodgeVisit.stair||$('ranch-map').open)return;
  if(!started||paused||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','f'].includes(k)){
    e.preventDefault();if(!started)start();if(k!=='f'){
      cancelHammockWalk();cancelBarnTrip();
      if(!lodgeVisit.inside)cancelLodgeTrip();
      interaction.cancel(view);interaction.supplyTrip=false;
    }
    if(k==='f'){
      if(!e.repeat)feed();
    }
    else{
      keys.add(k);following=true;updateViewLabel();
    }
  }
});
addEventListener('keyup',e=>{
  const key=e.key.toLowerCase();keys.delete(key);
  if(lodgeVisit.inside&&!lodgeVisit.stair&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)&&!keys.size){
    lodgeVisit.route=[];player.tx=player.x;player.tz=player.z;player.walking=false;
  }
});
addEventListener('blur',()=>keys.clear());
function help(open){
  $('help-panel').hidden=!open;
  paused=open;
  keys.clear();
  if(open){
    try{$('help-skip').checked=localStorage.getItem(introKey)==='1';}catch{}
    $('close-help').focus();
  }
  else $('help').focus();
}
$('help').onclick=()=>help(true);
$('close-help').onclick=$('help-done').onclick=()=>help(false);
$('help-panel').onclick=e=>{
  if(e.target===$('help-panel'))help(false);
};
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&paused)help(false);
});
let soundStarted=false;
async function startMeadowSound(gesture=false){
  if(soundStarted)return;
  try{
    const playback=audioSystem.start({gesture});
    if(!gesture&&audioSystem.context?.state==='suspended')$('welcome-sound').hidden=false;
    if(!await playback||soundStarted)return;
    soundStarted=true;
    $('welcome-sound').hidden=true;
  }catch{
    if(!soundStarted)$('welcome-sound').hidden=false;
  }
}
function unlockMeadowSound(event){
  if(event.isTrusted&&!event.repeat&&!soundStarted)void startMeadowSound(true);
}
addEventListener('pointerup',unlockMeadowSound,{capture:true});
addEventListener('click',unlockMeadowSound,{capture:true});
addEventListener('keydown',unlockMeadowSound,{capture:true});
$('milk').onclick=()=>{
  if(farmVisit.inside){notify('건물 밖으로 나온 뒤 할 수 있어요.');return;}
  if(barnVisit.inside){notify('축사 밖에서 할 수 있어요.');return;}
  if(lodgeVisit.inside){notify('숙소 밖에서 할 수 있어요.');return;}
  cancelBarnTrip();cancelLodgeTrip();
  if(shelter.active){notify('새끼 양들이 축사에서 쉬고 있어요.');return;}
  cancelHammockWalk();
  if(hammocking||seated){
    notify('일어난 뒤 우유를 줄 수 있어요.');
    return;
  }
  interaction.cancel(view);
  interaction.supplyTrip=false;
  if(feeding)feed();
  interaction.mode=interaction.mode==='milk'?'pet':'milk';
  if(interaction.mode==='milk'){
    const baby=[...lambs].filter(a=>a.milkCooldown<=0).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0];
    if(baby){
      selected=baby;
      keys.clear();
      notify(interaction.request('milk',baby,player,view).message);
    }
    else notify('새끼 양들이 배불러 쉬고 있어요. 잠시 뒤에 주세요.');
  }
  else notify('우유 주기를 마쳤어요.');
  updateCareUI();
};
$('hay').onclick=()=>{
  if(farmVisit.inside){notify('건물 밖으로 나온 뒤 할 수 있어요.');return;}
  if(barnVisit.inside){notify('축사 밖에서 할 수 있어요.');return;}
  if(lodgeVisit.inside){notify('숙소 밖에서 할 수 있어요.');return;}
  cancelBarnTrip();cancelLodgeTrip();
  cancelHammockWalk();
  if(hammocking||seated){
    notify('일어난 뒤 창고에 갈 수 있어요.');
    return;
  }
  interaction.cancel(view);
  interaction.mode='pet';
  if(feeding)feed();
  notify(interaction.goForHay(player).message);
  updateCareUI();
};
$('care-cancel').onclick=()=>{
  cancelBarnTrip();cancelLodgeTrip();
  cancelHammockWalk();
  interaction.cancel(view);
  interaction.mode='pet';
  interaction.supplyTrip=false;
  player.tx=player.x;
  player.tz=player.z;
  selected=null;
  updateCareUI();
};

// Native modal panel is separate from simulation and responsive menu placement.
if(typeof document.querySelectorAll==='function')setupMeadowPanel({
  weather,meadowTime,bond,flock,getSelected:()=>selected,onMessage:notify,onTimeChange:refreshMeadowTime,onPause:open=>{paused=open;keys.clear();if(!open){environmentTimer=0;bond.save();}},
  onFind:animal=>{
    if(!started)start();
    if(barnVisit.inside||lodgeVisit.inside||farmVisit.inside){notify('밖으로 나온 뒤 내 양을 만나러 가요.');return;}
    cancelBarnTrip();cancelLodgeTrip();
    if(shelter.active||animal.hiddenInBarn){notify('내 양도 축사에서 쉬고 있어요.');return;}
    if(hammocking||seated){notify('자리에서 일어난 뒤 만나러 가요.');return;}
    cancelHammockWalk();if(feeding)feed();selected=animal;interaction.mode='pet';keys.clear();notify(interaction.request('pet',animal,player,view).message);
  }
});
addEventListener('pagehide',()=>bond.save());

function currentMapVisit(){
  return barnVisit.inside?barnVisit:lodgeVisit.inside?lodgeVisit:farmVisit.inside?farmVisit:null;
}
function readMapPosition(){
  const visit=currentMapVisit(),position=visit?.outside??player;
  const points=doorwayWalk?[doorwayWalk.goal]:outdoorWalk?[outdoorWalk.target,...outdoorWalk.route]:[];
  return {position,points};
}
function followMapPin(point){
  const visit=currentMapVisit();
  if(lodgeVisit.stair)return '계단을 다 걸은 뒤 목적지를 선택해 주세요.';
  const plan=planOutdoorWalk(visit?.outside??{x:player.x,z:player.z},point);
  const last=plan.route.at(-1);
  if(!last||Math.hypot(last.x-plan.goal.x,last.z-plan.goal.z)>.12)return '이 지점까지 걷는 길을 찾지 못했어요. 가까운 풀밭을 짚어 주세요.';
  cancelHammockWalk();cancelBarnTrip();cancelLodgeTrip();
  if(hammocking)$('hammock').onclick();
  if(seated)$('sit').onclick();
  if(feeding)feed();
  interaction.cancel(view);interaction.supplyTrip=false;interaction.mode='pet';
  selected=null;keys.clear();following=true;
  if(visit){
    visit.requestExit(player);
    doorwayWalk={visit,route:visit.route,goal:plan.goal,fromMap:true};
  }else{
    walkToOutdoor(point,plan);
  }
  notify(point.name+'까지 걸어가요.');
  return '';
}
let openRanchMap;
$('map-open').onclick=()=>{
  if(!started||millMode)return;
  keys.clear();
  openRanchMap??=setupRanchMap(readMapPosition,followMapPin);
  openRanchMap();
};
function cancelFarmTrip(){if(!farmVisit.inside&&farmVisit.trip)farmVisit.cancel(player);}
function cancelBarnTrip(){cancelFarmTrip();cancelOutdoorWalk();cancelShepherdTalk();if(!barnVisit.inside&&barnVisit.trip==='enter')barnVisit.cancel(player);}
function cancelLodgeTrip(){if(!lodgeVisit.inside&&lodgeVisit.trip==='enter')lodgeVisit.cancel(player);}
function cancelShepherdTalk(){
  pendingShepherdTalk=false;
  if(!shepherd.talk)return;
  shepherd.endTalk(player);chat?.close();
}
function requestShepherdTalk(){
  if(lodgeVisit.stair){notify('계단을 다 걷고 나면 목동과 이야기할 수 있어요.');return;}
  if(farmVisit.inside){farmVisit.requestExit(player);pendingShepherdTalk=true;notify('밖으로 나와 목동에게 걸어가요.');return;}
  if(!started)start();
  if(hammocking||seated){notify('자리에서 일어난 뒤 목동에게 다가가요.');return;}
  if(barnVisit.inside){barnVisit.requestExit(player);pendingShepherdTalk=true;notify('축사 밖으로 나와 목동에게 걸어가요.');return;}
  if(shepherd.insideLodge&&!lodgeVisit.inside){goLodge();pendingShepherdTalk=true;notify('숙소에서 쉬는 목동을 만나러 걸어가요.');return;}
  if(lodgeVisit.inside&&!shepherd.insideLodge){lodgeVisit.requestExit(player);pendingShepherdTalk=true;notify('밖에서 일하는 목동에게 걸어가요.');return;}
  if(lodgeVisit.inside&&lodgeVisit.floor===2){lodgeVisit.requestFloor(1,player);pendingShepherdTalk=true;notify('1층으로 내려가 목동에게 다가가요.');return;}
  cancelBarnTrip();cancelLodgeTrip();cancelHammockWalk();interaction.cancel(view);
  interaction.supplyTrip=false;interaction.mode='pet';if(feeding)feed();
  keys.clear();selected=null;marker=null;
  if(lodgeVisit.inside){lodgeVisit.route=[];lodgeVisit.trip=null;}
  if(shepherd.requestTalk(player,{indoors:lodgeVisit.inside,yaw:view.yaw}))notify('목동에게 걸어가 마주 보고 이야기해요.');
}
function goBarn(){
  if(farmVisit.inside){notify('지금 있는 건물에서 나온 뒤 걸어가요.');return '지금 있는 건물에서 먼저 나가요.';}
  cancelFarmTrip();
  if(!started)start();
  if(barnVisit.inside)return '이미 축사 안에 있어요. 통로를 걸으며 양들을 살펴보세요.';
  if(lodgeVisit.inside)return '목동 숙소에서 나온 뒤 축사에 갈 수 있어요.';
  if(hammocking||seated){const text='자리에서 일어난 뒤 축사로 가요.';notify(text);return text;}
  cancelOutdoorWalk();cancelHammockWalk();cancelLodgeTrip();interaction.cancel(view);interaction.mode='pet';interaction.supplyTrip=false;if(feeding)feed();keys.clear();selected=null;
  barnVisit.request(player);marker={...CONFIG.barn.entrance};notify('축사 문까지 걸어가요. 도착하면 안으로 들어갑니다.');return '축사 문까지 걸어가요. 도착하면 안으로 들어갈게요.';
}
function goLodge(){
  if(farmVisit.inside){notify('지금 있는 건물에서 나온 뒤 걸어가요.');return '지금 있는 건물에서 먼저 나가요.';}
  cancelFarmTrip();
  if(!started)start();
  if(lodgeVisit.inside)return '이미 목동 숙소 안에 있어요. 방을 걸으며 둘러보세요.';
  if(barnVisit.inside){const message='축사 밖으로 나온 뒤 숙소에 갈 수 있어요.';notify(message);return message;}
  if(hammocking||seated){const message='자리에서 일어난 뒤 숙소에 갈 수 있어요.';notify(message);return message;}
  cancelBarnTrip();cancelHammockWalk();interaction.cancel(view);interaction.mode='pet';interaction.supplyTrip=false;
  if(feeding)feed();
  keys.clear();selected=null;
  lodgeVisit.request(player);
  marker={...CONFIG.lodge.entrance};
  const message='목동과 강아지의 숙소 문까지 걸어가요.';
  notify(message);return message;
}
function windmillLayer(){
  const mill=CONFIG.windmill;
  return {x:mill.x,z:mill.z,building:'windmill',draw:()=>drawBuilding3D(c,'windmill',project,view,W,H,{night:atmosphere.night,snow:atmosphere.kind==='snow',label:false})};
}
function refreshMillPanel(){
  const now=Date.now(),stage=windmillStage(now),panel=$('windmill-panel');
  const countdown=$('mill-countdown'),remaining=windmillCountdown(now);
  if(countdown.textContent!==remaining)countdown.textContent=remaining;
  if(panel.dataset.stage===String(stage)&&panel.dataset.mode===millMode)return;
  panel.dataset.stage=String(stage);panel.dataset.mode=millMode;
  $('mill-status').textContent=millMode==='balcony'?'풍차 전망대 · 발코니':windmillStatus(stage);
  $('mill-opening').textContent=`${windmillOpeningLabel} 완공 예정 (한국 시간)`;
  $('mill-opening').hidden=countdown.hidden=stage===10;
  $('mill-climb').hidden=stage!==10||millMode==='balcony';
}
function setMillView(mode){
  millMode=mode;view=millView;
  const balcony=mode==='balcony';
  view.eyeHeight=balcony?CONFIG.windmill.deckHeight+1.95:5;
  view.yaw=balcony?.56:.28;view.pitch=balcony?.24:(windmillStage()<3?.28:-.17);
  view.zoom=balcony?1.1:1.22;centerView();refreshMillPanel();
}
function visitWindmill(){
  if(farmVisit.inside||lodgeVisit.inside||barnVisit.inside){notify('건물 밖에서 풍차 전망대를 볼 수 있어요.');return;}
  cancelBarnTrip();cancelLodgeTrip();cancelHammockWalk();interaction.cancel(view);
  interaction.supplyTrip=false;selected=null;keys.clear();marker=null;
  player.tx=player.x;player.tz=player.z;
  setMillView(windmillStage()===10?'balcony':'site');
  document.body.classList.add('mill-view');
  $('windmill-panel').showModal();$('mill-close').focus();
}
$('windmill-enter').onclick=visitWindmill;
$('mill-climb').onclick=()=>{if(windmillStage()===10)setMillView('balcony');};
$('mill-close').onclick=()=>$('windmill-panel').close();
$('windmill-panel').onclose=()=>{
  millMode=null;view=outdoorView;document.body.classList.remove('mill-view');
  centerView();updateViewLabel();
};
let millDrag=null;
const millPanel=$('windmill-panel');
millPanel.onpointerdown=e=>{
  if(e.button!==0||e.target.closest('button'))return;
  millPanel.setPointerCapture(e.pointerId);millDrag={id:e.pointerId,x:e.clientX,y:e.clientY};
};
millPanel.onpointermove=e=>{
  if(millDrag?.id!==e.pointerId)return;
  millView.pan(e.clientX-millDrag.x,e.clientY-millDrag.y);
  millDrag.x=e.clientX;millDrag.y=e.clientY;
};
millPanel.onlostpointercapture=()=>{millDrag=null;};
millPanel.onkeydown=e=>{
  const delta={ArrowLeft:[28,0],ArrowRight:[-28,0],ArrowUp:[0,-25],ArrowDown:[0,25]}[e.key];
  if(delta){e.preventDefault();millView.pan(...delta);}
};
function renderRoomOutlook(kind,elevation=0){
  const roomView=view;
  c.save();
  try{
    if(kind!=='lodge'){
      c.fillStyle=atmosphere.night?'#584c39':'#b4a17e';
      c.fillRect(0,0,W,H);
      if(!clipRoomDoorway(c,kind,roomView,W,H))return;
    }
    const door=CONFIG[kind].entrance;
    lookoutView.orbitPitch=roomView.orbitPitch;lookoutView.orbitFocal=roomView.orbitFocal;
    lookoutView.yaw=roomView.yaw;lookoutView.pitch=roomView.orbitPitch??roomView.pitch;lookoutView.zoom=roomView.zoom;
    lookoutView.eyeHeight=roomView.eyeHeight+elevation;
    lookoutView.target.x=door.x+roomView.target.x;
    lookoutView.target.z=door.z+roomView.target.z;
    view=lookoutView;
    drawOutdoorScenery(kind);
    drawWeather(c,W,H,t,atmosphere);
  }finally{
    view=roomView;
    c.restore();
  }
}
function drawRoomOccupants(guests){
  indoorPets=guests.filter(g=>g.animal).sort((a,b)=>(project(a.x,a.z)?.depth??Infinity)-(project(b.x,b.z)?.depth??Infinity));
  const pet=forestPet?.room&&activeAnimalPet(), target=pet&&project(pet.x,pet.z);
  const visitor=roomVisitorProjection(view,player,W,H,lodgeVisit.inside?lodgeVisit.footLift:0);
  const layers=guests.map(guest=>({depth:project(guest.x,guest.z)?.depth??-1,draw:guest.draw}));
  layers.push({depth:visitor.depth,draw:()=>drawVisitor(c,visitor,{
    time:t,walking:player.walking,petting:!!target,lambSize:pet?.size,pose:target?(target.x>=visitor.x?'right':'left'):visitorPose(player.headingX??0,player.headingZ??1,view.yaw)
  })});
  if(target)layers.push({depth:Math.min(visitor.depth,target.depth)-.01,draw:()=>drawInteraction(c,{active:{kind:"pet",phase:"playing",animal:pet}},player,project,t,visitor)});
  layers.sort((a,b)=>b.depth-a.depth).forEach(layer=>layer.draw());
}
function renderInsideLodge(){
  centerView();c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  renderRoomOutlook('lodge',lodgeVisit.elevation);
  drawLodgeRoom3D(c,lodgeVisit.floor,view,W,H,{night:atmosphere.night,elevation:lodgeVisit.elevation});
  if(!lodgeVisit.stair)drawMarker();
  const people=[];shepherd.screen=null;
  if(lodgeVisit.elevation<1.8){
    if(shepherd.insideLodge){const guest={...shepherd,x:-3.1,z:7.8,walking:false};people.push({x:guest.x,z:guest.z,draw:()=>{drawShepherdBoy(c,project(guest.x,guest.z,-lodgeVisit.elevation),guest,view.yaw);shepherd.screen=guest.screen;}});}
    for(const [index,dog] of companions.dogs.entries())if(dog.hiddenInLodge){const guest={...dog,x:index?1.65:-1.65,z:11.9,walking:false};people.push({animal:dog,type:dog.type,x:guest.x,z:guest.z,draw:()=>drawCompanion(c,project(guest.x,guest.z,-lodgeVisit.elevation),guest,t)});}
  }
  drawRoomOccupants(people);
  $('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=0;
}
$('lodge-enter').onclick=goLodge;
$('lodge-leave').onclick=()=>{lodgeVisit.requestExit(player);keys.clear();notify('계단과 문을 지나 목장으로 나가요.');};
function takeLodgeStairs(){
  if(lodgeVisit.stair)return;
  lodgeVisit.requestFloor(lodgeVisit.floor===1?2:1,player);keys.clear();marker={...lodgeVisit.landing};
  notify(lodgeVisit.floor===1?'계단으로 걸어가 2층으로 올라가요.':'계단을 따라 1층으로 내려가요.');
}
$('lodge-stairs').onclick=takeLodgeStairs;
function renderInsideBarn(){
  centerView();c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const options={night:atmosphere.night,inside:shelter.inside,total:sheep.length};
  renderRoomOutlook('barn');
  drawBarnRoom3D(c,view,W,H,options);
  drawMarker();
  drawRoomOccupants(barnVisit.animals(flock).map(a=>({x:a.x,z:a.z,draw:()=>drawSheep(a)})));
  $('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=0;
}
$('barn-enter').onclick=goBarn;
$('barn-leave').onclick=()=>{barnVisit.requestExit(player);keys.clear();notify('문까지 걸어가 밖으로 나가요.');};
if(typeof document.querySelectorAll==='function')chat=setupShepherdChat({
  snapshot:()=>({month:new Date().getMonth()+1,time:atmosphere.text,weather:atmosphere.label,weatherSource:atmosphere.preview?'preview':atmosphere.live?'live':'local',location:weather.location?.name||'',night:atmosphere.night,total:sheep.length,lambs:lambs.length,inside:shelter.inside,chickens:companions.chickens.length,chickensInside:companions.coopInside,playingLambs:lambPlay.groups.length*2,dogs:companions.dogs.length,dogsInLodge:companions.dogs.filter(a=>a.hiddenInLodge).length,shepherdInLodge:shepherd.insideLodge,feeding,shelterReason:shelter.active?shelter.reason:'',inFarmRoom:farmVisit.inside?farmVisit.kind:null,inBarn:barnVisit.inside,inLodge:lodgeVisit.inside,lodgeFloor:lodgeVisit.inside?lodgeVisit.floor:0,friend:flock.adults.find(a=>a.id===bond.friendId)?.name||null}),
  requestOpen:requestShepherdTalk,
  canTalk:()=>!farmVisit.inside&&shepherd.canTalk(player,lodgeVisit.inside&&lodgeVisit.floor===1),
  onOpen:()=>keys.clear(),
  onClose:()=>shepherd.endTalk(player),
  execute:action=>{
    if(action==='enter_barn')return goBarn();
    if(action==='enter_lodge')return goLodge();
    if(action==='leave_barn'){if(!barnVisit.inside)return '지금은 목장 밖 풍경을 보고 있어요.';barnVisit.requestExit(player);return '축사 문으로 걸어가 밖으로 나갈게요.';}
    if(action==='gather'){shelter.manual=true;return '그래요. 개들과 함께 양은 축사로, 닭은 그 옆 닭장으로 천천히 들일게요.';}
    if(action==='release'){if(atmosphere.night||atmosphere.wet)return '지금은 어둡거나 궂은 날씨라 양과 닭이 안에서 쉬는 게 좋아요. 밝아지고 하늘이 개면 내보낼게요.';shelter.manual=false;return '좋아요. 양이랑 닭이 제 걸음으로 나올 수 있게 차례로 내보낼게요.';}
    if(action==='inspect'){cancelShepherdTalk();if(shelter.active)return '양들이 축사로 들어오는지 문 앞에서 살펴볼게요.';shepherd.timer=0;shepherd.state='watch';shepherd.route=[];return '네, 양들과 축사 주변을 천천히 둘러볼게요.';}
    return '';
  }
});


function goFarmRoom(kind){
  if(!started)start();
  if(barnVisit.inside||lodgeVisit.inside||farmVisit.inside){notify('지금 있는 건물에서 나온 뒤 걸어가요.');return;}
  if(hammocking||seated){notify('자리에서 일어난 뒤 걸어가요.');return;}
  cancelBarnTrip();cancelLodgeTrip();cancelHammockWalk();interaction.cancel(view);interaction.mode='pet';interaction.supplyTrip=false;
  if(feeding)feed();keys.clear();selected=null;
  farmVisit.request(kind,player);marker={...CONFIG[kind].entrance};
  notify(`${FARM_ROOMS[kind].title} 문까지 걸어가요. 도착하면 안으로 들어갑니다.`);
}
function renderInsideFarmRoom(){
  centerView();c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  renderRoomOutlook(farmVisit.kind);
  drawFarmRoom3D(c,farmVisit.kind,view,W,H,{night:atmosphere.night});
  drawMarker();
  const occupants=[];
  if(farmVisit.kind==='coop'){
    const guests=companions.chickens.filter(a=>a.hiddenInCoop).map((a,i)=>({...a,animal:a,x:i%2?1.7:-1.7,z:3.1+Math.floor(i/2)*1.05,walking:false}));
    for(const guest of guests)occupants.push({animal:guest.animal,type:guest.type,x:guest.x,z:guest.z,draw:()=>drawCompanion(c,project(guest.x,guest.z),guest,t)});
  }
  drawRoomOccupants(occupants);
  $('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=0;
}
$('coop-enter').onclick=()=>goFarmRoom('coop');
$('shed-enter').onclick=()=>goFarmRoom('shed');
$('farm-room-leave').onclick=()=>{farmVisit.requestExit(player);keys.clear();marker={x:0,z:.55};notify('문으로 걸어가 목장으로 나가요.');};

let skipIntro=false;
try{skipIntro=localStorage.getItem(introKey)==='1';}catch{}
if(skipIntro)start();
else $('welcome').showModal?.();
void startMeadowSound();
