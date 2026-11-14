import { Flock } from './game/flock.js';
import { Interactions } from './game/interactions.js';
import { Companions } from './game/companions.js';
import { MeadowAudio } from './game/audio.js';
import { CONFIG,keepDry } from './game/config.js';
import { drawSheep as renderSheep } from './render/sheep.js';
import { drawCompanion } from './render/companions.js?v=clean-mouth';
import { makeVegetation,drawVegetation,drawHayPile,drawRipples } from './render/details.js';
import { drawInteraction } from './render/interactions.js';
import { MeadowView } from './orbit.js';
import { drawVisitor,drawHammock,visitorPose } from './visitor.js?v=life1';
import { drawPasture,trees,drawWindmill } from './pasture.js';
const canvas=document.querySelector('#world'),c=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W,H,dpr,started=false,feeding=false,seated=false,hammocking=false,sunset=false,selected=null,feedCount=0,friends=new Set(),t=0,last=0,toastUntil=0,paused=false;
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
const grass=makeVegetation();
const particles=[];
function notify(text){
  if(W<=700&&text.includes('오물오물 먹었어요'))return;
  $('toast').textContent=W<=700?text.split('. ')[0]:text;
  toastUntil=t+(W<=700?2.2:6);
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
  drawPasture(c,W,H,t,sunset,view,project,ellipse,path);
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
  // All painted scenery and world objects share one camera transform.
  interaction.tick(dt,{
    player,view,onMessage:notify,onMilk:onFed
  });
  flock.tick(dt,{
    player,feeding,yaw:view.yaw,hayPiles:interaction.hayPiles,
    canTug:started&&!interaction.busy&&!seated&&!hammocking&&interaction.mode!=='milk',
    onFed,onBaa:a=>audioSystem.baa(a,player,view.yaw),
    onTug:a=>{
      if(interaction.startTug(a,player,view))notify('장난꾸러기가 옷자락을 살짝 당겨요.');
    }
  });
  companions.tick(dt,{
    player,sheep,yaw:view.yaw
  });
  updateCareUI();
  for(const p of particles){
    p.life-=dt;
    p.y+=dt*p.v;
  }
  while(particles.length&&particles[0].life<0)particles.shift();
}
function onFed(a){
  feedCount++;
  friends.add(a.name);
  $('fed-count').textContent=feedCount;
  $('friend-count').textContent=friends.size;
}
function updateCareUI(){
  updateViewLabel();
  $('care-cancel').hidden=!interaction.busy&&interaction.mode!=='milk'&&!interaction.supplyTrip;
  $('care-cancel').textContent=interaction.busy?'교감 마치기':interaction.supplyTrip?'창고 가기 취소':'우유 주기 마치기';
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
  const layers=sheep.map(a=>({
    x:a.x,z:a.z,draw:()=>drawSheep(a)
  }));
  layers.push({
    x:-6,z:7,draw:()=>drawHammock(c,project(-6,7),{
      time:t,occupied:hammocking,sunset
    })
  });
  if(started&&!hammocking)layers.push({
    x:player.x,z:player.z,draw:()=>drawVisitor(c,project(player.x,player.z),{
      time:t,walking:player.walking,seated,feeding,reaching:!!interaction.active,pose:interaction.active?.phase==='playing'?visitorPose(interaction.active.animal.x-player.x,interaction.active.animal.z-player.z,view.yaw):visitorPose(player.headingX??0,player.headingZ??1,view.yaw)
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
  for(const a of companions.animals)layers.push({
    x:a.x,z:a.z,draw:()=>drawCompanion(c,project(a.x,a.z),a,t)
  });
  layers.forEach(a=>a.depth=project(a.x??0,a.z)?.depth??-1);
  layers.sort((a,b)=>b.depth-a.depth).forEach(a=>{
    if(a.depth>0)a.draw();
  });
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
  if(selected&&interaction.busy){
    const base=project(selected.x,selected.z,2.1*selected.size),p=base&&view.toScreen(base.x,base.y);
    if(p){
      $('sheep-label').hidden=false;
      $('sheep-label').style.left=clamp(p.x,65,W-65)+'px';
      $('sheep-label').style.top=clamp(p.y,180,H-235)+'px';
      $('sheep-name').textContent=selected.name;
      $('sheep-mood').textContent=selected.state==='milk'?'젖병으로 우유를 먹고 있어요':selected.state==='pet'?'눈을 감고 손길을 느껴요':selected.state==='sleep'?'풀밭에서 꾸벅꾸벅 졸고 있어요':selected.state==='nursing'?'어미 곁에서 젖을 먹어요':selected.state==='drinking'?'물가에서 물을 마셔요':selected.bite>0?'오물오물, 맛있어요':selected.pet>0?'쓰다듬어 주니 좋아해요':selected.cool>0?'배불러서 풀밭을 산책해요':feeding?'건초 냄새를 맡고 다가와요':'느긋하게 풀을 뜯는 중';
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
  document.body.classList.add('walking');
  $('welcome').hidden=true;
  view.zoom=W<700?1.65:1.65;
  following=true;
  centerView();
  updateViewLabel();
  $('feed').disabled=false;
  $('sit').disabled=false;
  $('hammock').disabled=false;
  $('milk').disabled=false;
  $('hay').disabled=false;
  if(W>700)notify('좌우로 밀어 360° 회전 · 두 손가락으로 확대 · 짧게 눌러 걷기');
  else $('toast').style.opacity=0;
  notify('양을 누르면 가까이서 쓰다듬어요. 우유와 건초는 메뉴에 있어요.');
}
$('start').onclick=start;
function feed(){
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
let beforeHammock=null;
$('hammock').onclick=()=>{
  if(!started)start();
  interaction.cancel(view);
  interaction.mode='pet';
  interaction.supplyTrip=false;
  keys.clear();
  marker=null;
  selected=null;
  if(!hammocking){
    beforeHammock={
      x:player.x,z:player.z
    };
    if(feeding)feed();
    hammocking=true;
    seated=false;
    player.x=player.tx=-6;
    player.z=player.tz=7;
    player.walking=false;
    $('feed').disabled=true;
    $('sit').disabled=true;
    $('sit').querySelector('span:last-child').textContent='언덕에 앉기';
    $('hammock').querySelector('span:last-child').textContent='해먹에서 일어나기';
    $('move-hint').textContent='나무 그늘에서 흔들흔들';
    notify('해먹에 누웠어요. 바람과 양떼를 바라보며 쉬어가요.');
  }
  else{
    hammocking=false;
    player.x=player.tx=beforeHammock?.x??-6;
    player.z=player.tz=beforeHammock?.z??5;
    $('feed').disabled=false;
    $('sit').disabled=false;
    $('hammock').querySelector('span:last-child').textContent='해먹에서 쉬기';
    $('move-hint').textContent='짧게 눌러 걷기 · 밀어서 둘러보기';
    notify('해먹에서 일어났어요. 양들에게 다시 가볼까요?');
  }
};
$('time').onclick=()=>{
  sunset=!sunset;
  $('time-label').textContent=sunset?'노을':'오후';
  $('time').querySelector('span').textContent=sunset?'☾':'☀';
  $('time').setAttribute('aria-label',sunset?'오후로 바꾸기':'노을로 바꾸기');
  $('clock').textContent=sunset?'오후 6:12':'오후 3:24';
  notify(sunset?'하루 끝의 빛이 목장에 내려앉았어요.':'따뜻한 오후 햇살이 풀밭을 비춰요.');
};
function tapWorld(screenX,screenY){
  if(paused)return;
  if(!started){
    start();
    return;
  }
  const {
    x,y
  }
  =view.toWorld(screenX,screenY);
  const hit=[...sheep].sort((a,b)=>(project(a.x,a.z)?.depth??Infinity)-(project(b.x,b.z)?.depth??Infinity)).find(a=>{
    const p=a.screen;return p&&Math.abs(x-p.x)<p.w*.5&&y<p.y+8&&y>p.y-p.h;
  });
  if(hit){
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
$('sound').onclick=async()=>{
  try{
    const enabled=await audioSystem.toggle();
    $('sound').setAttribute('aria-pressed',enabled);
    $('sound').querySelector('span').textContent=enabled?'소리 끄기':'소리 켜기';
    if(enabled)audioSystem.baa(sheep[0],player,view.yaw);
  }
  catch{
    notify('이 브라우저에서는 소리를 켤 수 없어요.');
  }
};
$('milk').onclick=()=>{
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
  interaction.cancel(view);
  interaction.mode='pet';
  interaction.supplyTrip=false;
  player.tx=player.x;
  player.tz=player.z;
  selected=null;
  updateCareUI();
};
