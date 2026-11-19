import {BuildingOcclusion,spriteBounds} from './render/occlusion.js?v=visible-picking-1';
import {LodgeInteriorView} from './game/lodge-camera.js?v=lodge-eyes-2';
import {BarnVisit} from './game/barn.js?v=solid-buildings-2';
import {BarnInteriorView} from './game/barn-camera.js?v=immersive-barn-v2';
import {FarmRoomVisit,FARM_ROOMS} from './game/farm-room.js?v=solid-buildings-2';
import {LodgeVisit} from './game/lodge.js?v=solid-buildings-2';
import {setupShepherdChat} from './shepherd-chat.js?v=public-ai-1';
import {ShepherdBoy} from './game/shepherd.js?v=solid-buildings-2';
import {drawShepherdBoy} from './render/shepherd.js?v=christmas';
import {MeadowWeather} from './game/weather.js?v=coop-herding';
import {MeadowTime} from './game/meadow-time.js?v=chosen-time-2';
import {SheepBond} from './game/bond.js?v=night-barn';
import {WeatherShelter} from './game/shelter.js?v=solid-buildings-2';
import {LambPlay} from './game/lamb-play.js?v=solid-buildings-2';
import {drawBuilding3D,drawBuildingLabel3D,drawBarnRoom3D,drawFarmRoom3D,drawLodgeRoom3D,getBuildingOcclusionMeshes} from './render/buildings-three.js?v=windmill-1';
import {windmillStage,windmillStatus,windmillCountdown,windmillOpeningLabel} from './game/windmill-construction.js?v=countdown-1';
import {drawWeather,drawFriendBadge} from './render/weather.js?v=night-barn';
import {setupMeadowPanel} from './meadow-panel.js?v=chosen-time-2';
import { isCompactViewport } from './game/layout.js';
import { Flock } from './game/flock.js?v=solid-buildings-2';
import { Interactions } from './game/interactions.js?v=solid-buildings-2';
import { Companions } from './game/companions.js?v=solid-buildings-2';
import { MeadowAudio } from './game/audio.js?v=night-barn';
import {dryRoute} from './game/navigation.js?v=windmill-1';
import {drawBridgeDeck,drawBridgeRail,pickBridge} from './render/bridge.js?v=lake-bridge-1';
import { CONFIG,keepDry,bridgePathClear,bridgeHeight,bridgePoint,BRIDGES } from './game/config.js?v=windmill-1';
import { drawSheep as renderSheep } from './render/sheep.js?v=lamb-8';
import { drawCompanion } from './render/companions.js?v=night-barn';
import { drawOwl,owlPosition } from './render/owl.js?v=1';
import { makeVegetation,drawVegetation,drawHayPile,drawRipples } from './render/details.js?v=solid-buildings-2';
import { drawInteraction } from './render/interactions.js?v=soft-elbow-5';
import { MeadowView } from './orbit.js';
import { drawVisitor,drawHammock,visitorPose } from './visitor.js?v=night-barn';
import { drawPasture,trees,drawWindmill,drawFirTree,firTree } from './pasture.js?v=solid-buildings-2';
const canvas=document.querySelector('#world'),c=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W,H,dpr,started=false,feeding=false,seated=false,hammocking=false,walkingToHammock=false,sunset=false,selected=null,feedCount=0,friends=new Set(),t=0,last=0,toastUntil=0,paused=false;
let seed=1731;
const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const player={
  x:0,z:0,tx:0,tz:0
},keys=new Set();
let marker=null,outdoorWalk=null;
const outdoorView=new MeadowView(),indoorView=new BarnInteriorView();
const lodgeView=new LodgeInteriorView(),lookoutView=new LodgeInteriorView(),farmView=new BarnInteriorView();
lodgeView.zoom=1.25;lodgeView.pitch=.025;
let view=outdoorView;
const millView=new LodgeInteriorView();
let millMode=null,millLabel=null;
let following=true;
const flock=new Flock(rnd,{adults:45,lambs:CONFIG.lambs}),sheep=flock.animals,lambs=flock.lambs;
flock.adults.forEach((animal,i)=>{
  if(i%3===0)animal.newSheepAppearance=true;
  else if(i%3===1)animal.thirdSheepAppearance=true;
  else animal.fifthSheepAppearance=true;
});
const interaction=new Interactions(flock),companions=new Companions(),audioSystem=new MeadowAudio();
const weather=new MeadowWeather(),bond=new SheepBond(),shelter=new WeatherShelter(),lambPlay=new LambPlay(rnd);
const meadowTime=new MeadowTime();
let atmosphere=meadowTime.apply(weather.snapshot()),environmentTimer=0;
bond.apply(flock);
const shepherd=new ShepherdBoy(),barnVisit=new BarnVisit(),lodgeVisit=new LodgeVisit(),farmVisit=new FarmRoomVisit();
let chat=null,pendingShepherdTalk=false;
let coopScreen=null,lodgeScreen=null,shedScreen=null;
const grass=makeVegetation();
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
  return view.project(x,z,y??(outdoor?bridgeHeight({x,z}):0),W,H);
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
function walkToOutdoor(point){
  const goal={x:clamp(point.x,CONFIG.playerBounds.minX,CONFIG.playerBounds.maxX),z:clamp(point.z,CONFIG.playerBounds.minZ,CONFIG.playerBounds.maxZ)};
  keepDry(goal);
  const route=dryRoute(player,goal),target=route.shift();
  outdoorWalk={goal,route,target};
  player.tx=target.x;player.tz=target.z;marker=goal;
}
function cancelOutdoorWalk(){
  if(!outdoorWalk)return;
  outdoorWalk=null;player.tx=player.x;player.tz=player.z;marker=null;
}
function advanceOutdoorWalk(){
  if(!outdoorWalk)return;
  const walk=outdoorWalk;
  if(barnVisit.inside||lodgeVisit.inside||farmVisit.inside||Math.hypot(player.tx-walk.target.x,player.tz-walk.target.z)>.001){outdoorWalk=null;return;}
  if(Math.hypot(player.x-player.tx,player.z-player.tz)>.08)return;
  if(walk.route.length){walk.target=walk.route.shift();player.tx=walk.target.x;player.tz=walk.target.z;}
  else{outdoorWalk=null;marker=null;}
}
function addBridgeRails(layers){
  for(const bridge of BRIDGES)for(const side of [-1,1]){
    const at=bridgePoint(0,side*(bridge.halfWidth-.05),bridge);
    layers.push({...at,cover:{halfWidth:18,above:5,below:5},draw:()=>drawBridgeRail(c,project,side,bridge)});
  }
}
function background(){
  drawPasture(c,W,H,t,sunset,view,project,ellipse,path,atmosphere);
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
  c.fillStyle='#656e55';
  c.fillRect(-14,-15,26,37);
  c.fillStyle='#ebe5cb';
  c.fillRect(-34,-21,13,13);
  c.fillRect(24,-21,13,13);
  c.strokeStyle='#c8c6a7';
  c.lineWidth=2;
  c.strokeRect(-13,-14,24,35);
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
  advanceOutdoorWalk();
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
      if(lodgeVisit.inside)lodgeVisit.move(player,next);
      else if(barnVisit.inside||farmVisit.inside||bridgePathClear(player,next)){
        player.x=next.x;player.z=next.z;
        if(!barnVisit.inside&&!lodgeVisit.inside&&!farmVisit.inside)keepDry(player);
      }
    }
    else marker=null;
  }
  if(walkingToHammock&&Math.hypot(player.x-CONFIG.hammock.x,player.z-CONFIG.hammock.z)<=.08)lieInHammock();
  const farmTransition=farmVisit.tick(player);
  if(farmTransition){
    if(farmTransition==='blocked')notify('그곳으로 가는 길이 막혀 있어요. 다른 위치에서 다시 걸어가요.');
    else{
      interaction.cancel(view);keys.clear();selected=null;marker=null;feeding=false;
      view=farmVisit.inside?farmView:outdoorView;
      if(farmVisit.inside){farmView.yaw=0;farmView.pitch=-.03;farmView.eyeHeight=1.65;}
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
  const lodgeTransition=lodgeVisit.tick(player);
  if(lodgeTransition){
    interaction.cancel(view);keys.clear();selected=null;marker=null;feeding=false;
    view=lodgeVisit.inside?lodgeView:outdoorView;
    if(lodgeTransition==='entered'){lodgeView.yaw=0;lodgeView.pitch=.025;lodgeView.zoom=1.25;}
    else if(lodgeTransition==='upstairs'||lodgeTransition==='downstairs'){lodgeView.yaw=Math.PI;lodgeView.pitch=.035;}
    document.body.classList.toggle('in-lodge',lodgeVisit.inside);
    $('lodge-leave').hidden=!lodgeVisit.inside;
    $('lodge-stairs').hidden=!lodgeVisit.inside;
    $('lodge-room-status').hidden=!lodgeVisit.inside;
    notify(lodgeTransition==='entered'?'집 안에 들어왔어요. 화면을 밀어 둘러보고 바닥을 눌러 걸어보세요.':lodgeTransition==='upstairs'?'2층에 올라왔어요. 발코니 너머 목장을 둘러보세요.':lodgeTransition==='downstairs'?'1층으로 내려왔어요.':'목동의 집을 나왔어요.');
  }
  if(lodgeVisit.inside){
    $('lodge-stairs').textContent=lodgeVisit.floor===1?'↑ 2층 전망대로':'↓ 1층 휴식 공간으로';
    $('lodge-room-status').textContent=`${lodgeVisit.floor}층 · ${lodgeVisit.floor===1?'목동과 강아지의 휴식 공간':'목장 전망 발코니'} · 목동 ${shepherd.insideLodge?'휴식 중':'목장 순찰 중'} · 개 ${companions.dogs.filter(a=>a.hiddenInLodge).length}마리 휴식 중`;
  }
  if(pendingShepherdTalk&&!farmVisit.inside&&!barnVisit.trip&&!lodgeVisit.trip&&!farmVisit.trip&&!barnVisit.inside&&(!lodgeVisit.inside||lodgeVisit.floor===1)){
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
  companions.tick(dt,{
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
  const p=project(layer.x??0,layer.z,layer.height);if(!p)return;
  buildingOcclusion.draw(c,p.depth,spriteBounds(p,layer.cover),()=>layer.draw());
}
function paintWorldLayers(layers){
  const visibleBuildings=new Set(layers.filter(layer=>layer.building).map(layer=>layer.building));
  const hub=project(CONFIG.windmill.x,CONFIG.windmill.entrance.z,17.8);
  const sailsInView=hub&&hub.x>-8*hub.s&&hub.x<W+8*hub.s&&hub.y>-8*hub.s&&hub.y<H+8*hub.s;
  const meshes=[...getBuildingOcclusionMeshes({snow:atmosphere.kind==='snow',millTime:sailsInView?t:undefined}).filter(mesh=>visibleBuildings.has(mesh.kind)),...(visibleBuildings.has('shed')?[shedOccluder]:[])];
  buildingOcclusion.prepare(view.basis(W,H),W,H,meshes,view===lookoutView?.12:.8);
  layers.forEach(layer=>layer.depth=project(layer.x??0,layer.z,layer.height)?.depth??-1);
  layers.sort((a,b)=>b.depth-a.depth);
  // Paint solid buildings first. Every subsequent world sprite uses their
  // actual nearest surface depth, rather than the building entrance's depth.
  for(const layer of layers)if(layer.building)buildingOcclusion.drawBuilding(c,layer.building,()=>layer.draw());
  millLabel=null;
  for(const kind of ['barn','lodge','coop','windmill'])if(visibleBuildings.has(kind)&&!millMode){
    const options=kind==='barn'?{inside:shelter.inside,total:sheep.length}:kind==='coop'?{inside:companions.coopInside,total:companions.chickens.length}:{occupants:Number(shepherd.insideLodge)+companions.dogs.filter(a=>a.hiddenInLodge).length};
    const label=drawBuildingLabel3D(c,kind,project,options);
    if(kind==='windmill')millLabel=label;
  }
  for(const layer of layers)if(!layer.building&&!layer.focused&&layer.depth>0)drawWorldLayer(layer);
  for(const layer of layers)if(!layer.building&&layer.focused&&layer.depth>0)drawWorldLayer(layer);
}
function render(){
  if(farmVisit.inside){renderInsideFarmRoom();return;}
  if(lodgeVisit.inside){renderInsideLodge();return;}
  if(barnVisit.inside){renderInsideBarn();return;}
  centerView();
  c.setTransform(dpr,0,0,dpr,0,0);
  c.clearRect(0,0,W,H);
  c.fillStyle=sunset?'#586d41':'#5c813f';
  c.fillRect(0,0,W,H);
  c.save();
  background();
  drawMarker();
  const petFocus=interaction.active?.kind==='pet'&&interaction.active.phase==='playing'?interaction.active.animal:null;
  const layers=sheep.map(a=>({
    x:a.x,z:a.z,actor:true,focused:a===petFocus,cover:{halfWidth:1.9*a.size,above:3*a.size+(a.hop||0)*a.size+.5,below:.5*a.size},draw:()=>drawSheep(a)
  }));
  layers.push(windmillLayer());
  layers.push({
    x:CONFIG.hammock.x,z:CONFIG.hammock.z,cover:{halfWidth:4.3,above:5.1,below:.6},draw:()=>drawHammock(c,project(CONFIG.hammock.x,CONFIG.hammock.z),{
      time:t,occupied:hammocking,sunset
    })
  });
  layers.push({x:CONFIG.barn.x,z:CONFIG.barn.entrance.z,building:'barn',draw:()=>{barnVisit.screen=drawBuilding3D(c,'barn',project,view,W,H,{inside:shelter.inside,total:sheep.length,snow:atmosphere.kind==='snow',night:atmosphere.night,label:false});}});
  layers.push({x:CONFIG.coop.x,z:CONFIG.coop.entrance.z,building:'coop',draw:()=>{coopScreen=drawBuilding3D(c,'coop',project,view,W,H,{inside:companions.coopInside,total:companions.chickens.length,snow:atmosphere.kind==='snow',night:atmosphere.night,label:false});}});
  layers.push({x:CONFIG.lodge.x,z:CONFIG.lodge.entrance.z,building:'lodge',draw:()=>{lodgeScreen=drawBuilding3D(c,'lodge',project,view,W,H,{night:atmosphere.night,snow:atmosphere.kind==='snow',occupants:Number(shepherd.insideLodge)+companions.dogs.filter(a=>a.hiddenInLodge).length,label:false});}});
  if(started&&!hammocking)layers.push({
    x:player.x,z:player.z,focused:!!petFocus,cover:{halfWidth:2.8,above:3,below:.5},draw:()=>drawVisitor(c,project(player.x,player.z),{
      time:t,walking:player.walking,seated,feeding,petting:interaction.active?.kind==='pet'&&interaction.active.phase==='playing',milking:interaction.active?.kind==='milk'&&interaction.active.phase==='playing',lambSize:interaction.active?.animal.size,pose:interaction.active?.phase==='playing'?visitorPose(interaction.active.animal.x-player.x,interaction.active.animal.z-player.z,view.yaw):visitorPose(player.headingX??0,player.headingZ??1,view.yaw)
    })
  });
  for(const a of trees)layers.push({
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
  addBridgeRails(layers);
  paintWorldLayers(layers);
  const visitor=project(player.x,player.z);
  if(visitor)buildingOcclusion.draw(c,visitor.depth,spriteBounds(visitor,{halfWidth:5,above:4,below:1}),()=>drawInteraction(c,interaction,player,project,t));
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
function frame(now){
  const dt=Math.min((now-last)/1000||.016,.06);
  last=now;
  if(!paused){
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
  ensureSound();
  document.body.classList.add('walking');
  $('welcome').hidden=true;
  view.zoom=1.65;
  const spawn=new URLSearchParams(location.search).get('start');
  if(spawn==='windmill'){
    const {x,z}=CONFIG.windmill.entrance;
    Object.assign(player,{x,z:z-8,tx:x,tz:z-8});
    view.zoom=.85;view.pitch=.10;
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
$('start').onclick=start;
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
  cancelHammockWalk();cancelShepherdTalk();cancelOutdoorWalk();
  const {
    x,y
  }
  =view.toWorld(screenX,screenY);
  if(farmVisit.inside){
    const ground=view.ground(x,y,W,H);if(!ground)return;
    if(ground.z<.8&&Math.abs(ground.x)<1.2)farmVisit.requestExit(player);
    else farmVisit.walkTo(ground,player);
    marker={x:player.tx,z:player.tz};return;
  }
  if(lodgeVisit.inside){
    const npc=shepherd.screen;
    if(lodgeVisit.floor===1&&shepherd.insideLodge&&npc&&Math.abs(x-npc.x)<npc.w*.5&&y<npc.y+8&&y>npc.y-npc.h){requestShepherdTalk();return;}
    const ground=view.ground(x,y,W,H);
    if(!ground)return;
    if(Math.hypot(ground.x-3.65,ground.z-10.5)<1.7){lodgeVisit.requestFloor(lodgeVisit.floor===1?2:1,player);marker={x:3.65,z:10.5};return;}
    if(lodgeVisit.floor===1&&Math.hypot(ground.x,ground.z-.55)<1.3){lodgeVisit.requestExit(player);marker={x:0,z:.55};return;}
    lodgeVisit.walkTo(ground,player);marker={x:player.tx,z:player.tz};return;
  }
  if(barnVisit.inside){
    const hit=barnVisit.visibleAnimals.find(a=>a.screen&&Math.abs(x-a.screen.x)<a.screen.w*.5&&y<a.screen.y+8&&y>a.screen.y-a.screen.h);
    if(hit){notify(`${hit.name}가 포근한 짚 위에서 쉬고 있어요.`);return;}
    const ground=view.ground(x,y,W,H);if(ground){barnVisit.walkTo(ground,player);marker={x:player.tx,z:player.tz};}return;
  }
  // Visible animals/NPCs have priority over the wall behind them. Buildings
  // are picked from the same nearest-surface map used to draw them, never
  // from their bounding rectangle (which also includes open sky and grass).
  cancelBarnTrip();cancelLodgeTrip();
  const hit=[...sheep,...(shepherd.insideLodge?[]:[shepherd])].sort((a,b)=>(project(a.x,a.z)?.depth??Infinity)-(project(b.x,b.z)?.depth??Infinity)).find(a=>{
    const p=a.screen,root=project(a.x,a.z);return !a.hiddenInBarn&&p&&root&&!buildingOcclusion.occluded(x,y,root.depth)&&Math.abs(x-p.x)<p.w*.5&&y<p.y+8&&y>p.y-p.h;
  });
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
  if(building==='windmill'||(millLabel&&x>=millLabel.left&&x<=millLabel.right&&y>=millLabel.top&&y<=millLabel.bottom)){visitWindmill();return;}
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
  const ground=pickBridge(x,y,project)||view.ground(x,y,W,H);
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
  if(millMode)return;
  if(paused||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','f'].includes(k)){
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
  if(lodgeVisit.inside&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)&&!keys.size){
    lodgeVisit.route=[];player.tx=player.x;player.tz=player.z;player.walking=false;
  }
});
addEventListener('blur',()=>keys.clear());
function help(open){
  $('help-panel').hidden=!open;
  paused=open;
  keys.clear();
  if(open)$('close-help').focus();
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
let soundRetryNotified=false;
function ensureSound(){
  audioSystem.start().catch(()=>{
    if(!soundRetryNotified){notify('화면을 한 번 더 누르면 음악이 시작됩니다.');soundRetryNotified=true;}
  });
}
// Entry starts sound. If a browser blocks it, the next normal tap retries it.
addEventListener('pointerdown',()=>{if(started&&!audioSystem.enabled)ensureSound();},{capture:true});
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

function cancelFarmTrip(){if(!farmVisit.inside&&farmVisit.trip)farmVisit.cancel(player);}
function cancelBarnTrip(){cancelFarmTrip();cancelOutdoorWalk();cancelShepherdTalk();if(!barnVisit.inside&&barnVisit.trip==='enter')barnVisit.cancel(player);}
function cancelLodgeTrip(){if(!lodgeVisit.inside&&lodgeVisit.trip==='enter')lodgeVisit.cancel(player);}
function cancelShepherdTalk(){
  pendingShepherdTalk=false;
  if(!shepherd.talk)return;
  shepherd.endTalk(player);chat?.close();
}
function requestShepherdTalk(){
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
function renderLodgeOutlook(){
  lookoutView.yaw=lodgeView.yaw;lookoutView.pitch=lodgeView.pitch;lookoutView.zoom=lodgeView.zoom;
  lookoutView.eyeHeight=lodgeView.eyeHeight+(lodgeVisit.floor-1)*4.2;
  lookoutView.target.x=CONFIG.lodge.x+player.x;
  lookoutView.target.z=CONFIG.lodge.entrance.z+player.z;
  const previous=view;view=lookoutView;
  c.save();
  drawPasture(c,W,H,t,sunset,view,project,ellipse,path,atmosphere);
  drawBridgeDeck(c,project);
  drawVegetation(c,grass,project,t,W,H);
  const layers=sheep.filter(a=>!a.hiddenInBarn).map(a=>({x:a.x,z:a.z,cover:{halfWidth:1.9*a.size,above:3*a.size+.5,below:.5*a.size},draw:()=>renderSheep(c,a,{project,time:t,width:W,height:H,player:lodgeVisit.outside,feeding:false})}));
  layers.push(windmillLayer());
  layers.push({x:CONFIG.barn.x,z:CONFIG.barn.entrance.z,building:'barn',draw:()=>drawBuilding3D(c,'barn',project,view,W,H,{inside:shelter.inside,total:sheep.length,night:atmosphere.night,snow:atmosphere.kind==='snow',label:false})});
  layers.push({x:CONFIG.coop.x,z:CONFIG.coop.entrance.z,building:'coop',draw:()=>drawBuilding3D(c,'coop',project,view,W,H,{inside:companions.coopInside,total:companions.chickens.length,night:atmosphere.night,snow:atmosphere.kind==='snow',label:false})});
  for(const a of companions.animals)if(!a.hiddenInCoop&&!a.hiddenInLodge)layers.push({x:a.x,z:a.z,draw:()=>drawCompanion(c,project(a.x,a.z),a,t)});
  if(!shepherd.insideLodge)layers.push({x:shepherd.x,z:shepherd.z,draw:()=>drawShepherdBoy(c,project(shepherd.x,shepherd.z),shepherd,view.yaw)});
  layers.push({x:14,z:55,cover:{halfWidth:2.8,above:5.2,below:.5},draw:()=>drawWindmill(c,project(14,55),t)});
  for(const a of trees)layers.push({x:a.x,z:a.z,cover:{halfWidth:a.size*1.3,above:a.size*1.8,below:.4},draw:()=>{const p=project(a.x,a.z);if(p)tree(p.x,p.y,p.s*a.size/45);}});
  layers.push({x:firTree.x,z:firTree.z,cover:{halfWidth:4,above:10.2,below:.5},draw:()=>drawFirTree(c,project(firTree.x,firTree.z))});
  addBridgeRails(layers);
  paintWorldLayers(layers);
  c.restore();view=previous;
}
function renderInsideLodge(){
  centerView();c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  renderLodgeOutlook();
  drawLodgeRoom3D(c,lodgeVisit.floor,view,W,H,{night:atmosphere.night});
  drawMarker();
  const people=[];shepherd.screen=null;
  if(lodgeVisit.floor===1){
    if(shepherd.insideLodge){const guest={...shepherd,x:-3.1,z:7.8,walking:false};people.push({x:guest.x,z:guest.z,draw:()=>{drawShepherdBoy(c,project(guest.x,guest.z),guest,view.yaw);shepherd.screen=guest.screen;}});}
    for(const [index,dog] of companions.dogs.entries())if(dog.hiddenInLodge){const guest={...dog,x:index?1.65:-1.65,z:11.9,walking:false};people.push({x:guest.x,z:guest.z,draw:()=>drawCompanion(c,project(guest.x,guest.z),guest,t)});}
  }
  people.sort((a,b)=>(project(b.x,b.z)?.depth??-1)-(project(a.x,a.z)?.depth??-1)).forEach(a=>a.draw());
  $('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=0;
}
$('lodge-enter').onclick=goLodge;
$('lodge-leave').onclick=()=>{lodgeVisit.requestExit(player);keys.clear();notify('계단과 문을 지나 목장으로 나가요.');};
$('lodge-stairs').onclick=()=>{lodgeVisit.requestFloor(lodgeVisit.floor===1?2:1,player);keys.clear();marker={x:3.65,z:10.5};notify(lodgeVisit.floor===1?'계단으로 걸어가 2층으로 올라가요.':'계단으로 걸어가 1층으로 내려가요.');};
function renderInsideBarn(){
  centerView();c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const options={night:atmosphere.night,inside:shelter.inside,total:sheep.length};
  drawBarnRoom3D(c,view,W,H,options);
  drawMarker();
  const inside=barnVisit.animals(flock),layers=inside.map(a=>({depth:project(a.x,a.z)?.depth||0,draw:()=>drawSheep(a)}));
  layers.sort((a,b)=>b.depth-a.depth).forEach(a=>a.draw());$('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=0;
}
$('barn-enter').onclick=goBarn;
$('barn-leave').onclick=()=>{barnVisit.requestExit(player);keys.clear();notify('문까지 걸어가 밖으로 나가요.');};
if(typeof document.querySelectorAll==='function')chat=setupShepherdChat({
  snapshot:()=>({time:atmosphere.text,weather:atmosphere.label,weatherSource:atmosphere.preview?'preview':atmosphere.live?'live':'local',location:weather.location?.name||'',night:atmosphere.night,total:sheep.length,lambs:lambs.length,inside:shelter.inside,chickens:companions.chickens.length,chickensInside:companions.coopInside,playingLambs:lambPlay.groups.length*2,dogs:companions.dogs.length,dogsInLodge:companions.dogs.filter(a=>a.hiddenInLodge).length,shepherdInLodge:shepherd.insideLodge,feeding,shelterReason:shelter.active?shelter.reason:'',inFarmRoom:farmVisit.inside?farmVisit.kind:null,inBarn:barnVisit.inside,inLodge:lodgeVisit.inside,lodgeFloor:lodgeVisit.inside?lodgeVisit.floor:0,friend:flock.adults.find(a=>a.id===bond.friendId)?.name||null}),
  requestOpen:requestShepherdTalk,
  canTalk:()=>!farmVisit.inside&&shepherd.canTalk(player,lodgeVisit.inside&&lodgeVisit.floor===1),
  onOpen:()=>keys.clear(),
  onClose:()=>shepherd.endTalk(player),
  execute:action=>{
    if(action==='enter_barn')return goBarn();
    if(action==='enter_lodge')return goLodge();
    if(action==='leave_barn'){if(!barnVisit.inside)return '지금은 목장 밖 풍경을 보고 있어요.';barnVisit.requestExit(player);return '축사 문으로 걸어가 밖으로 나갈게요.';}
    if(action==='gather'){shelter.manual=true;return '네, 개들이 양은 축사로, 닭은 옆 닭장으로 차례로 몰아넣을게요.';}
    if(action==='release'){if(atmosphere.night||atmosphere.wet)return '지금은 어둡거나 궂은 날씨라 양과 닭이 안에서 쉬는 게 좋아요. 밝아지고 하늘이 개면 내보낼게요.';shelter.manual=false;return '네, 양과 닭을 차례로 밖에 내보낼게요.';}
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
  drawFarmRoom3D(c,farmVisit.kind,view,W,H,{night:atmosphere.night});
  drawMarker();
  if(farmVisit.kind==='coop'){
    const guests=companions.chickens.filter(a=>a.hiddenInCoop).map((a,i)=>({...a,x:i%2?1.7:-1.7,z:3.1+Math.floor(i/2)*1.05,walking:false}));
    guests.sort((a,b)=>(project(b.x,b.z)?.depth??-1)-(project(a.x,a.z)?.depth??-1));
    for(const guest of guests)drawCompanion(c,project(guest.x,guest.z),guest,t);
  }
  $('sheep-label').hidden=true;
  if(t>toastUntil)$('toast').style.opacity=0;
}
$('coop-enter').onclick=()=>goFarmRoom('coop');
$('shed-enter').onclick=()=>goFarmRoom('shed');
$('farm-room-leave').onclick=()=>{farmVisit.requestExit(player);keys.clear();marker={x:0,z:.55};notify('문으로 걸어가 목장으로 나가요.');};
