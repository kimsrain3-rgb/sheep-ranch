import {ShepherdBoy} from './game/shepherd.js?v=boy-shepherd';
import {drawShepherdBoy} from './render/shepherd.js?v=shepherd-staff';
import {MeadowWeather} from './game/weather.js?v=living-meadow';
import {SheepBond} from './game/bond.js?v=living-meadow';
import {WeatherShelter} from './game/shelter.js?v=living-meadow';
import {LambPlay} from './game/lamb-play.js?v=living-meadow';
import {drawShelter} from './render/shelter.js?v=living-meadow';
import {drawWeather,drawFriendBadge} from './render/weather.js?v=living-meadow';
import {setupMeadowPanel} from './meadow-panel.js?v=living-meadow';
import { isCompactViewport } from './game/layout.js';
import { Flock } from './game/flock.js?v=living-meadow';
import { Interactions } from './game/interactions.js?v=side-pet';
import { Companions } from './game/companions.js?v=shepherd-staff';
import { MeadowAudio } from './game/audio.js?v=recorded-sheep';
import { CONFIG,keepDry } from './game/config.js?v=living-meadow';
import { drawSheep as renderSheep } from './render/sheep.js?v=living-meadow';
import { drawCompanion } from './render/companions.js?v=clean-mouth';
import { makeVegetation,drawVegetation,drawHayPile,drawRipples } from './render/details.js';
import { drawInteraction } from './render/interactions.js?v=side-pet';
import { MeadowView } from './orbit.js';
import { drawVisitor,drawHammock,visitorPose } from './visitor.js?v=side-pet';
import { drawPasture,trees,drawWindmill } from './pasture.js?v=living-meadow';
const canvas=document.querySelector('#world'),c=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W,H,dpr,started=false,feeding=false,seated=false,hammocking=false,walkingToHammock=false,sunset=false,selected=null,feedCount=0,friends=new Set(),t=0,last=0,toastUntil=0,paused=false;
let seed=1731;
const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const player={
  x:0,z:0,tx:0,tz:0
},keys=new Set();
let marker=null;
const view=new MeadowView();
let following=true;
const flock=new Flock(rnd),sheep=flock.animals,lambs=flock.lambs;
const interaction=new Interactions(flock),companions=new Companions(),audioSystem=new MeadowAudio();
const weather=new MeadowWeather(),bond=new SheepBond(),shelter=new WeatherShelter(),lambPlay=new LambPlay(rnd);
let atmosphere=weather.snapshot(),environmentTimer=0;
bond.apply(flock);
const shepherd=new ShepherdBoy();
const grass=makeVegetation();
const particles=[];
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
function project(x,z,y=0){
  return view.project(x,z,y,W,H);
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
function background(){
  drawPasture(c,W,H,t,sunset,view,project,ellipse,path,atmosphere);
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
function update(dt){
  if(paused)return;
  weather.tick();environmentTimer-=dt;
  if(environmentTimer<=0){
    atmosphere=weather.snapshot();environmentTimer=.5;sunset=atmosphere.dusk&&!atmosphere.night;
    $('clock').textContent=atmosphere.text;
    canvas.setAttribute('aria-label',`양들이 지내는 목장. ${atmosphere.preview?'감상용 ':atmosphere.live?'지역 날씨 ':''}${atmosphere.label}. 축사에서 쉬는 양 ${shelter.inside}마리. 뛰노는 새끼 양 ${lambPlay.groups.length*2}마리. 소년 목동이 양들을 살피고 있어요. 목동을 누르면 인사합니다. 풀밭을 누르면 이동합니다.`);
    $('weather-label').textContent=atmosphere.preview?`${atmosphere.label} · 감상용`:atmosphere.live?`${atmosphere.location} · ${atmosphere.label}`:'바람목장 · 지역 날씨 미연결';
  }
  if(shelter.updateWeather(dt,atmosphere.wet)){
    if(shelter.active){interaction.cancel(view);interaction.mode='pet';interaction.supplyTrip=false;if(feeding)feed();notify('비와 눈을 피해 개들이 양들을 축사로 안내해요.');}
    else notify('하늘이 개었어요. 양들이 차례로 풀밭에 나와요.');
  }
  let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
  player.walking=false;
  if(started&&!seated&&!hammocking&&interaction.active?.phase!=='playing'&&(dx||dz)){
    const wx=dx*Math.cos(view.yaw)+dz*Math.sin(view.yaw),wz=-dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw);
    player.tx=clamp(player.x+wx*3,-55,55);
    player.tz=clamp(player.z+wz*3,-55,145);
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
      player.x+=x/d*move;
      player.z+=z/d*move;
      keepDry(player);
    }
    else marker=null;
  }
  if(walkingToHammock&&Math.hypot(player.x-CONFIG.hammock.x,player.z-CONFIG.hammock.z)<=.08)lieInHammock();
  // All painted scenery and world objects share one camera transform.
  interaction.tick(dt,{
    player,view,width:W,height:H,onMessage:notify,onMilk:onFed
  });
  shelter.tick(dt,{flock,dogs:companions.dogs,yaw:view.yaw});
  flock.tick(dt,{
    player,feeding,yaw:view.yaw,hayPiles:interaction.hayPiles,
    canTug:started&&!shelter.active&&!walkingToHammock&&!interaction.busy&&!seated&&!hammocking&&interaction.mode!=='milk',
    onFed,onBaa:a=>audioSystem.baa(a,player,view.yaw),
    onTug:a=>{
      if(interaction.startTug(a,player,view))notify('장난꾸러기가 옷자락을 살짝 당겨요.');
    }
  });
  bond.tick(dt,{flock,player,active:interaction.active,feeding,yaw:view.yaw,available:started&&!shelter.active&&!hammocking&&!seated&&!walkingToHammock,notify});
  lambPlay.tick(dt,{flock,feeding,sheltering:shelter.active,yaw:view.yaw});
  if(started)shepherd.tick(dt,{player,sheep,sheltering:shelter.active});
  companions.tick(dt,{
    player,sheep,yaw:view.yaw,sheltering:shelter.active,shepherd
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
  $('care-cancel').hidden=!walkingToHammock&&!interaction.busy&&interaction.mode!=='milk'&&!interaction.supplyTrip;
  $('care-cancel').textContent=walkingToHammock?'해먹 가기 취소':interaction.busy?'교감 마치기':interaction.supplyTrip?'창고 가기 취소':'우유 주기 마치기';
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
function render(){
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
    x:a.x,z:a.z,actor:true,focused:a===petFocus,draw:()=>drawSheep(a)
  }));
  layers.push({
    x:CONFIG.hammock.x,z:CONFIG.hammock.z,draw:()=>drawHammock(c,project(CONFIG.hammock.x,CONFIG.hammock.z),{
      time:t,occupied:hammocking,sunset
    })
  });
  layers.push({x:CONFIG.barn.x,z:CONFIG.barn.entrance.z,draw:()=>drawShelter(c,project(CONFIG.barn.x,CONFIG.barn.entrance.z),{inside:shelter.inside,total:sheep.length,wet:shelter.active,snow:atmosphere.kind==='snow',night:atmosphere.night,time:t})});
  if(started&&!hammocking)layers.push({
    x:player.x,z:player.z,focused:!!petFocus,draw:()=>drawVisitor(c,project(player.x,player.z),{
      time:t,walking:player.walking,seated,feeding,petting:interaction.active?.kind==='pet'&&interaction.active.phase==='playing',milking:interaction.active?.kind==='milk'&&interaction.active.phase==='playing',lambSize:interaction.active?.animal.size,pose:interaction.active?.phase==='playing'?visitorPose(interaction.active.animal.x-player.x,interaction.active.animal.z-player.z,view.yaw):visitorPose(player.headingX??0,player.headingZ??1,view.yaw)
    })
  });
  for(const a of trees)layers.push({
    x:a.x,z:a.z,draw:()=>{
      const p=project(a.x,a.z);if(p&&p.x>-300&&p.x<W+300)tree(p.x,p.y,p.s*a.size/45);
    }
  });
  layers.push({
    x:CONFIG.shed.x,z:CONFIG.shed.z,draw:()=>{
      const p=project(CONFIG.shed.x,CONFIG.shed.z);if(p)barn(p.x,p.y,p.s/8);
    }
  });
  layers.push({
    x:14,z:55,draw:()=>drawWindmill(c,project(14,55),t)
  });
  for(let i=0;i<4;i++)layers.push({
    x:20+i*1.2,z:45,draw:()=>{
      const p=project(20+i*1.2,45);if(p)ellipse(p.x,p.y-p.s*.4,p.s*.55,p.s*.5,'#d2bb74');
    }
  });
  layers.push({x:shepherd.x,z:shepherd.z,actor:true,draw:()=>drawShepherdBoy(c,project(shepherd.x,shepherd.z),shepherd,view.yaw)});
  for(const a of companions.animals)layers.push({
    x:a.x,z:a.z,actor:true,draw:()=>drawCompanion(c,project(a.x,a.z),a,t)
  });
  layers.forEach(a=>a.depth=project(a.x??0,a.z)?.depth??-1);
  layers.sort((a,b)=>b.depth-a.depth);
  const focalPoints=petFocus?[project(player.x,player.z),project(petFocus.x,petFocus.z)].filter(Boolean):[];
  const focusArea=focalPoints.length===2?{left:Math.min(...focalPoints.map(p=>p.x-p.s*1.5)),right:Math.max(...focalPoints.map(p=>p.x+p.s*1.5)),top:Math.min(...focalPoints.map(p=>p.y-p.s*2.6)),bottom:Math.max(...focalPoints.map(p=>p.y+p.s*.25))}:null;
  // During the closeup, passersby recede and cannot hide the touching pair.
  for(const layer of layers){
    if(layer.depth<=0||layer.focused)continue;
    const p=focusArea&&layer.actor?project(layer.x,layer.z):null;
    const recede=p&&p.x+p.s*1.5>focusArea.left&&p.x-p.s*1.5<focusArea.right&&p.y>focusArea.top&&p.y-p.s*2.5<focusArea.bottom;
    c.save();if(recede)c.globalAlpha=.22;layer.draw();c.restore();
  }
  for(const layer of layers)if(layer.focused&&layer.depth>0)layer.draw();
  drawInteraction(c,interaction,player,project,t);
  for(const p of particles){
    const v=project(p.x,p.z,p.y);
    if(v){
      c.globalAlpha=clamp(p.life,0,1);
      ellipse(v.x,v.y,2.5,2.5,'#ffe8a3');
      c.globalAlpha=1;
    }
  }
  c.restore();
  drawWeather(c,W,H,t,atmosphere);
  if(selected&&interaction.busy){
    const base=project(selected.x,selected.z,2.1*selected.size),p=base&&view.toScreen(base.x,base.y);
    if(p){
      $('sheep-label').hidden=false;
      $('sheep-label').style.left=clamp(p.x,65,W-65)+'px';
      $('sheep-label').style.top=clamp(p.y,180,H-235)+'px';
      $('sheep-name').textContent=selected.name;
      $('sheep-mood').textContent=selected.state==='milk'?(selected.careContact?'젖병으로 우유를 먹고 있어요':'다가오는 사람을 바라봐요'):selected.state==='pet'?(selected.careContact?'눈을 감고 손길을 느껴요':'다가오는 사람을 바라봐요'):selected.state==='sleep'?'풀밭에서 꾸벅꾸벅 졸고 있어요':selected.state==='nursing'?'어미 곁에서 젖을 먹어요':selected.state==='drinking'?'물가에서 물을 마셔요':selected.bite>0?'오물오물, 맛있어요':selected.pet>0?'쓰다듬어 주니 좋아해요':selected.cool>0?'배불러서 풀밭을 산책해요':feeding?'건초 냄새를 맡고 다가와요':'느긋하게 풀을 뜯는 중';
    }
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
  following=true;
  centerView();
  updateViewLabel();
  $('feed').disabled=false;
  $('sit').disabled=false;
  $('hammock').disabled=false;
  $('milk').disabled=false;
  $('hay').disabled=false;
  if(!isCompactViewport(W,H))notify('좌우로 밀어 360° 회전 · 두 손가락으로 확대 · 짧게 눌러 걷기');
  else $('toast').style.opacity=0;
  notify('양을 누르면 가까이서 쓰다듬어요. 우유와 건초는 메뉴에 있어요.');
}
$('start').onclick=start;
function feed(){
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
    player.tx=CONFIG.hammock.x;
    player.tz=CONFIG.hammock.z;
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
  cancelHammockWalk();
  const {
    x,y
  }
  =view.toWorld(screenX,screenY);
  const hit=[...sheep,shepherd].sort((a,b)=>(project(a.x,a.z)?.depth??Infinity)-(project(b.x,b.z)?.depth??Infinity)).find(a=>{
    const p=a.screen;return p&&Math.abs(x-p.x)<p.w*.5&&y<p.y+8&&y>p.y-p.h;
  });
  if(hit===shepherd){
    interaction.cancel(view);interaction.supplyTrip=false;interaction.mode='pet';keys.clear();player.tx=player.x;player.tz=player.z;marker=null;selected=null;
    shepherd.greet(player);notify(shelter.active?'목동: 양들이 축사에 잘 들어가는지 살펴보고 있어요.':'목동: 안녕하세요! 오늘도 양들과 편히 쉬어가세요.');return;
  }
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
  const ground=view.ground(x,y,W,H);
  if(!ground)return;
  player.tx=clamp(ground.x,-55,55);
  player.tz=clamp(ground.z,-55,145);
  const z=player.tz;
  marker={
    x:player.tx,z
  };
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
  view.pitch=.23;
  centerView();
  updateViewLabel();
  notify('내 위치의 기본 시점으로 돌아왔어요.');
};
addEventListener('blur',()=>{
  pointers.clear();gesture=null;
});
addEventListener('keydown',e=>{
  if(paused)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','f'].includes(k)){
    e.preventDefault();if(!started)start();if(k!=='f'){
      cancelHammockWalk();
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
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
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
  weather,bond,flock,getSelected:()=>selected,onMessage:notify,onPause:open=>{paused=open;keys.clear();if(!open){environmentTimer=0;bond.save();}},
  onFind:animal=>{
    if(!started)start();
    if(shelter.active||animal.hiddenInBarn){notify('내 양도 축사에서 쉬고 있어요.');return;}
    if(hammocking||seated){notify('자리에서 일어난 뒤 만나러 가요.');return;}
    cancelHammockWalk();if(feeding)feed();selected=animal;interaction.mode='pet';keys.clear();notify(interaction.request('pet',animal,player,view).message);
  }
});
addEventListener('pagehide',()=>bond.save());
