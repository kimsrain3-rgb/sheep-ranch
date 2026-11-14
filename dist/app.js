import {MeadowView} from './orbit.js';
import {drawVisitor,drawHammock} from './visitor.js';
import {drawPasture,trees,cows,drawCow,drawWindmill} from './pasture.js';
const canvas=document.querySelector('#world'),c=canvas.getContext('2d');
const $=id=>document.getElementById(id);let W,H,dpr,started=false,feeding=false,seated=false,hammocking=false,sunset=false,selected=null,feedCount=0,friends=new Set(),t=0,last=0,toastUntil=0,paused=false;
let seed=1731;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646,range=(a,b)=>a+rnd()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const player={x:0,z:0,tx:0,tz:0},cam=Object.freeze({x:0,z:-9}),keys=new Set();let marker=null;const view=new MeadowView();let following=true;
const names=['구름이','솜이','보리','몽실이','두부','우유','콩이','단추','포근이','밀크','달이','풀잎이'];
const sheep=Array.from({length:50},(_,i)=>{const name=names[i]||'솜뭉치 '+(i+1);return ({name,x:i===0?3:range(-28,28),z:i===0?6:range(i<20?6:45,i<20?40:145),tx:range(-28,28),tz:range(i<20?6:45,i<20?40:145),phase:range(0,7),size:range(.8,1.18),hunger:0,cool:0,bite:0,pet:0,dir:1,walking:false,spots:Array.from({length:42},()=>({x:range(-.76,.75),y:range(-.45,.43),r:range(.17,.29)}))});});
// Lambs share their mother's model at exactly one third of her linear size.
const mothers=sheep.slice(0,12);
const lambs=mothers.map((mother,i)=>({...mother,name:mother.name+'의 아기양',mother,isLamb:true,size:mother.size/3,x:mother.x+(i%2?-1.7:1.7),z:mother.z-.65,tx:mother.x,tz:mother.z,phase:range(0,7),hunger:0,cool:0,bite:0,pet:0,screen:null}));
sheep.push(...lambs);
for(let i=20;i<50;i++){const a=sheep[i],angle=(i-20)/30*Math.PI*2,r=20+range(0,48);a.x=Math.sin(angle)*r;a.z=Math.cos(angle)*r;a.tx=a.x;a.tz=a.z;}
const grass=Array.from({length:850},()=>({x:range(-80,80),z:range(-80,160),h:range(.07,.2),p:range(0,7),flower:rnd()<.065}));
const clouds=Array.from({length:8},()=>({x:rnd(),y:range(.09,.3),s:range(.55,1.8),speed:range(.001,.003)}));
const particles=[];function notify(text){$('toast').textContent=text;toastUntil=t+6;$('toast').style.opacity=1;}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=W*dpr;canvas.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);if(started)centerView();}addEventListener('resize',resize);resize();
function centerView(){view.target.x=player.x;view.target.z=player.z;}
function updateViewLabel(){$('zoom-level').textContent=Math.round(view.zoom*100)+'%';$('camera-home').setAttribute('aria-pressed',String(Math.abs(view.yaw)<.01));}
function changeZoom(factor){view.zoomAt(view.zoom*factor);updateViewLabel();}
function project(x,z,y=0){return view.project(x,z,y,W,H);}
function ellipse(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function path(points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function hill(y,amp,color,freq,phase){c.beginPath();c.moveTo(-10,H);c.lineTo(-10,y);for(let x=-10;x<=W+20;x+=16)c.lineTo(x,y+Math.sin(x/W*freq+phase)*amp+Math.sin(x/W*freq*2.3+phase)*amp*.21);c.lineTo(W+20,H);c.closePath();c.fillStyle=color;c.fill();}
function background(){drawPasture(c,W,H,t,sunset,view,project,ellipse,path);
 for(const g of grass){const p=project(g.x,g.z);if(!p||p.x<-20||p.x>W+20||p.y<0||p.y>H+20)continue;const h=g.h*p.s,wind=Math.sin(t*1.4+g.p)*h*.3;c.strokeStyle=g.flower?'#e4e1ae':'#779b5270';c.lineWidth=Math.max(.6,p.s*.016);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+wind,p.y-h);c.stroke();if(g.flower)ellipse(p.x+wind,p.y-h,Math.max(1,p.s*.025),Math.max(1,p.s*.02),'#eee8ba');}
}
function barn(x,y,s){c.save();c.translate(x,y);c.scale(s,s);ellipse(0,20,70,9,'#4c66332b');path([[-46,-38],[45,-38],[45,22],[-46,22]],'#d3c8a6');path([[-60,-38],[0,-77],[58,-38]],sunset?'#76604d':'#7d6650');c.fillStyle='#656e55';c.fillRect(-14,-15,26,37);c.fillStyle='#ebe5cb';c.fillRect(-34,-21,13,13);c.fillRect(24,-21,13,13);c.strokeStyle='#c8c6a7';c.lineWidth=2;c.strokeRect(-13,-14,24,35);c.restore();}
function tree(x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#777458';c.fillRect(-3,-37,6,42);for(let i=0;i<7;i++)ellipse(Math.sin(i*2.4)*17,-40+Math.cos(i*2.4)*13,23,20,i%2?'#6f8a67':'#789574');c.restore();}
function drawSheep(a){const p=project(a.x,a.z);a.screen=null;if(!p||p.x<-250||p.x>W+250||p.y>H+300)return;const s=p.s*a.size; a.screen={x:p.x,y:p.y,w:s*2.5,h:s*1.9};c.save();c.translate(p.x,p.y);c.scale(s,s);const step=a.walking?Math.sin(t*8+a.phase)*.10:0;const chew=a.bite>0?Math.sin(t*18)*.035:0;const graze=!feeding&&a.cool>0||!a.walking&&Math.sin(t*.25+a.phase)>.65;
 ellipse(0,.01,1,.19,'#253c292e');
 // Four jointed legs, soft hoof highlights, fleece silhouette and individual curls.
 for(let i=0;i<4;i++){let x=[-.55,-.32,.35,.6][i],yy=-.12+(i%2)*.05;const dx=step*(i%2?-1:1);c.strokeStyle=i%2?'#766d59':'#5d594c';c.lineWidth=.105;c.lineCap='round';c.beginPath();c.moveTo(x,-.61);c.lineTo(x+dx,-.3);c.lineTo(x-dx,yy);c.stroke();ellipse(x-dx,yy,.10,.052,'#484b43');}
 const wool=c.createRadialGradient(-.3,-1.1,.1,0,-.7,1.1);wool.addColorStop(0,'#fffced');wool.addColorStop(.65,'#eee8d3');wool.addColorStop(1,'#bfbda7');ellipse(0,-.84,.94,.63,wool);
 for(const spot of a.spots){const x=spot.x,y=-.85+spot.y;if(x*x/.9+y*y>100)continue;const grad=c.createRadialGradient(x-.035,y-.045,.01,x,y,spot.r);grad.addColorStop(0,'#fffdef');grad.addColorStop(.65,'#f0ebd8');grad.addColorStop(1,'#d2ceba');ellipse(x,y,spot.r,spot.r*.92,grad);c.strokeStyle='#b8b5a22b';c.lineWidth=.012;c.beginPath();c.arc(x,y,spot.r*.55,.2,3.6);c.stroke();}
 const toward=feeding&&Math.hypot(a.x-player.x,a.z-player.z)<10,headX=a.headX??a.dir*.83,headY=a.headY??-1.05;
 c.save();c.translate(headX,headY+chew);if(!toward)c.rotate(-headX/.83*.13);ellipse(-.3,-.12,.24,.09,'#b3aa91');ellipse(.3,-.12,.24,.09,'#b3aa91');ellipse(-.33,-.12,.14,.044,'#d8b6a0');ellipse(.33,-.12,.14,.044,'#d8b6a0');
 const face=c.createLinearGradient(-.2,-.3,.2,.36);face.addColorStop(0,'#8d8876');face.addColorStop(1,'#bbb19a');ellipse(0,.07,.27,.37,face);for(let i=0;i<5;i++)ellipse((i-2)*.10,-.27+Math.abs(i-2)*.024,.115,.105,'#faf4df');
 for(const x of [-.15,.15]){ellipse(x,-.015,.042,.052,'#242f2a');ellipse(x-.009,-.03,.013,.015,'#fff8e8');}ellipse(0,.28,.08,.048,'#675f50');c.strokeStyle='#686353';c.lineWidth=.015;c.beginPath();c.moveTo(0,.31);c.lineTo(0,.35);c.stroke();c.restore();
 if(a.pet>0||a.bite>0){c.globalAlpha=Math.min(1,Math.max(a.pet,a.bite));c.fillStyle=a.pet>0?'#e6ad91':'#f3df95';c.font='.36px serif';c.textAlign='center';c.fillText(a.pet>0?'♥':'✦',.1,-1.8-Math.sin(t*2)*.05);c.globalAlpha=1;}c.restore();}
function drawHand(){if(!feeding)return;const x=W*.57,y=H*.96,scale=Math.min(W/700,1);c.save();c.translate(x,y+Math.sin(t*2)*3);c.scale(scale,scale);path([[0,70],[18,-1],[54,-24],[91,-10],[97,2],[62,25],[55,70]],'#d2af89');ellipse(57,-8,35,13,'#e7cba1');for(let i=0;i<18;i++){c.strokeStyle=i%2?'#e9cd7c':'#b99a45';c.lineWidth=2;c.beginPath();c.moveTo(35+(i%5)*8,5);c.quadraticCurveTo(30+i*3,-36,25+i*4,-68-(i%4)*9);c.stroke();}c.restore();}
function drawMarker(){if(!marker)return;const p=project(marker.x,marker.z);if(!p)return;c.strokeStyle='#fff5c8bb';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,p.s*.28,p.s*.09,0,0,Math.PI*2);c.stroke();}
function update(dt){if(paused)return;let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));player.walking=false;if(started&&!seated&&!hammocking&&(dx||dz)){const wx=dx*Math.cos(view.yaw)+dz*Math.sin(view.yaw),wz=-dx*Math.sin(view.yaw)+dz*Math.cos(view.yaw);player.tx=clamp(player.x+wx*3,-55,55);player.tz=clamp(player.z+wz*3,-55,145);marker=null;}if(!seated&&!hammocking){let x=player.tx-player.x,z=player.tz-player.z,d=Math.hypot(x,z);if(d>.08){player.walking=true;player.facing=x>=0?1:-1;const move=Math.min(d,dt*3.2);player.x+=x/d*move;player.z+=z/d*move;}else marker=null;}// All painted scenery and world objects share one camera transform.
 for(let i=0;i<sheep.length;i++){const a=sheep[i];a.pet=Math.max(0,a.pet-dt*.45);a.bite=Math.max(0,a.bite-dt);a.cool=Math.max(0,a.cool-dt);if(feeding&&a.cool===0){const rank=a.feedSlot??i,ring=Math.floor(rank/8);a.tx=player.x+Math.sin(rank*2.4)*(1.3+ring*1.25);a.tz=player.z+3.3+ring*1.3+(rank%3)*.65;}else if(a.isLamb){a.tx=a.mother.x+Math.sin(a.phase)*1.7;a.tz=Math.max(4,a.mother.z-.65);}else if(Math.hypot(a.tx-a.x,a.tz-a.z)<.3||rnd()<dt*.04){a.tx=clamp(a.x+range(-5,5),-75,75);a.tz=clamp(a.z+range(-6,6),-75,150);}let x=a.tx-a.x,z=a.tz-a.z,d=Math.hypot(x,z);const stop=a.isLamb?.35:.22,resume=a.isLamb?.8:.22;a.walking=d>(a.walking?stop:resume)&&a.bite<=0;const speed=feeding&&a.cool===0?1.6:a.isLamb?.65:.35;if(a.walking){a.x+=x/d*Math.min(d,dt*speed);a.z+=z/d*Math.min(d,dt*speed);const sideways=x*Math.cos(view.yaw)-z*Math.sin(view.yaw);if(Math.abs(sideways)>.15)a.dir=sideways>0?1:-1;}
 // Ease head turns instead of snapping from one side of the body to the other.
 const blend=1-Math.exp(-dt*7),toward=feeding&&Math.hypot(a.x-player.x,a.z-player.z)<10;
 const graze=(!feeding&&a.cool>0)||(!a.walking&&Math.sin(t*.25+a.phase)>.65);
 a.headX=(a.headX??a.dir*.83)+((toward?0:a.dir*.83)-(a.headX??a.dir*.83))*blend;
 a.headY=(a.headY??-1.05)+((graze?-.48:-1.05)-(a.headY??-1.05))*blend;
 if(feeding&&a.cool===0&&Math.hypot(a.x-player.x,a.z-player.z)<6){a.hunger+=dt;if(a.hunger>2.2){a.hunger=0;a.cool=18+range(0,12);a.bite=2.1;feedCount++;friends.add(a.name);$('fed-count').textContent=feedCount;$('friend-count').textContent=friends.size;notify(a.name+'가 건초를 오물오물 먹었어요. 고마운가 봐요.');baa(.16);for(let k=0;k<5;k++)particles.push({x:a.x+range(-.3,.3),z:a.z,y:1.5,v:range(.15,.5),life:1.8});}}else a.hunger=0;
 }for(const p of particles){p.life-=dt;p.y+=dt*p.v;}while(particles.length&&particles[0].life<0)particles.shift();if(soundOn&&rnd()<dt*.025)baa(.12);
}
function render(){centerView();c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.fillStyle=sunset?'#586d41':'#5c813f';c.fillRect(0,0,W,H);c.save();background();drawMarker();const layers=sheep.map(a=>({x:a.x,z:a.z,draw:()=>drawSheep(a)}));layers.push({x:-6,z:7,draw:()=>drawHammock(c,project(-6,7),{time:t,occupied:hammocking,sunset})});if(started&&!hammocking)layers.push({x:player.x,z:player.z,draw:()=>drawVisitor(c,project(player.x,player.z),{time:t,walking:player.walking,seated,feeding,facing:player.facing})});for(const a of trees)layers.push({x:a.x,z:a.z,draw:()=>{const p=project(a.x,a.z);if(p&&p.x>-300&&p.x<W+300)tree(p.x,p.y,p.s*a.size/45);}});
 for(const a of cows)layers.push({x:a.x,z:a.z,draw:()=>{const p=project(a.x,a.z);if(p&&p.x>-200&&p.x<W+200)drawCow(c,{...p,s:p.s*a.size},t,a.phase);}});
 layers.push({x:24,z:48,draw:()=>{const p=project(24,48);if(p)barn(p.x,p.y,p.s/8);}});
 layers.push({x:14,z:55,draw:()=>drawWindmill(c,project(14,55),t)});
 for(let i=0;i<4;i++)layers.push({x:20+i*1.2,z:45,draw:()=>{const p=project(20+i*1.2,45);if(p)ellipse(p.x,p.y-p.s*.4,p.s*.55,p.s*.5,'#d2bb74');}});
 layers.forEach(a=>a.depth=project(a.x??0,a.z)?.depth??-1);layers.sort((a,b)=>b.depth-a.depth).forEach(a=>{if(a.depth>0)a.draw();});for(const p of particles){const v=project(p.x,p.z,p.y);if(v){c.globalAlpha=clamp(p.life,0,1);ellipse(v.x,v.y,2.5,2.5,'#ffe8a3');c.globalAlpha=1;}}c.restore();if(selected){const base=project(selected.x,selected.z,2.1*selected.size),p=base&&view.toScreen(base.x,base.y);if(p){$('sheep-label').hidden=false;$('sheep-label').style.left=clamp(p.x,65,W-65)+'px';$('sheep-label').style.top=clamp(p.y,180,H-235)+'px';$('sheep-name').textContent=selected.name;$('sheep-mood').textContent=selected.bite>0?'오물오물, 맛있어요':selected.pet>0?'쓰다듬어 주니 좋아해요':selected.cool>0?'배불러서 풀밭을 산책해요':feeding?'건초 냄새를 맡고 다가와요':'느긋하게 풀을 뜯는 중';}}else $('sheep-label').hidden=true;if(t>toastUntil)$('toast').style.opacity=started?.65:1;}
function frame(now){const dt=Math.min((now-last)/1000||.016,.06);last=now;if(!paused){t+=dt;update(dt);render();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
function start(){if(started)return;started=true;document.body.classList.add('walking');$('welcome').hidden=true;view.zoom=W<700?1.65:1.65;following=true;centerView();updateViewLabel();$('feed').disabled=false;$('sit').disabled=false;$('hammock').disabled=false;notify('좌우로 밀어 360° 회전 · 두 손가락으로 확대 · 짧게 눌러 걷기');}
$('start').onclick=start;
function feed(){if(hammocking){notify('해먹에서 일어난 뒤 건초를 줄 수 있어요.');return;}if(!started)start();feeding=!feeding;if(feeding){[...sheep].sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z)).forEach((a,i)=>a.feedSlot=i);}$('feed').classList.toggle('active',feeding);$('feed').setAttribute('aria-pressed',feeding);$('feed').querySelector('strong').textContent=feeding?'건초 거두기':'건초 내밀기';$('feed').querySelector('small').textContent=feeding?'조금 기다리면 다가와요':'양들이 다가올 거예요';notify(feeding?'건초를 내밀었어요. 양들이 다가오도록 잠시 기다려 주세요.':'건초를 거뒀어요. 양을 눌러 쓰다듬어 보세요.');} $('feed').onclick=feed;
$('sit').onclick=()=>{if(hammocking)return;seated=!seated;keys.clear();player.tx=player.x;player.tz=player.z;$('sit').querySelector('span:last-child').textContent=seated?'자리에서 일어나기':'언덕에 앉기';$('move-hint').textContent=seated?'바람을 느끼며 쉬는 중':'짧게 눌러 걷기 · 밀어서 둘러보기';marker=null;notify(seated?'풀밭에 앉았어요. 잠시 양들과 같은 속도로 쉬어가요.':'다시 걸어볼까요?');};

let beforeHammock=null;
$('hammock').onclick=()=>{
 if(!started)start();keys.clear();marker=null;selected=null;
 if(!hammocking){beforeHammock={x:player.x,z:player.z};if(feeding)feed();hammocking=true;seated=false;player.x=player.tx=-6;player.z=player.tz=7;player.walking=false;$('feed').disabled=true;$('sit').disabled=true;$('sit').querySelector('span:last-child').textContent='언덕에 앉기';$('hammock').querySelector('span:last-child').textContent='해먹에서 일어나기';$('move-hint').textContent='나무 그늘에서 흔들흔들';notify('해먹에 누웠어요. 바람과 양떼를 바라보며 쉬어가요.');}
 else{hammocking=false;player.x=player.tx=beforeHammock?.x??-6;player.z=player.tz=beforeHammock?.z??5;$('feed').disabled=false;$('sit').disabled=false;$('hammock').querySelector('span:last-child').textContent='해먹에서 쉬기';$('move-hint').textContent='짧게 눌러 걷기 · 밀어서 둘러보기';notify('해먹에서 일어났어요. 양들에게 다시 가볼까요?');}
};

$('time').onclick=()=>{sunset=!sunset;$('time-label').textContent=sunset?'노을':'오후';$('time').querySelector('span').textContent=sunset?'☾':'☀';$('time').setAttribute('aria-label',sunset?'오후로 바꾸기':'노을로 바꾸기');$('clock').textContent=sunset?'오후 6:12':'오후 3:24';notify(sunset?'하루 끝의 빛이 목장에 내려앉았어요.':'따뜻한 오후 햇살이 풀밭을 비춰요.');};
function tapWorld(screenX,screenY){if(paused)return;if(!started){start();return;}const {x,y}=view.toWorld(screenX,screenY);const hit=[...sheep].sort((a,b)=>(project(a.x,a.z)?.depth??Infinity)-(project(b.x,b.z)?.depth??Infinity)).find(a=>{const p=a.screen;return p&&Math.abs(x-p.x)<p.w*.5&&y<p.y+8&&y>p.y-p.h;});if(hit){selected=hit;hit.pet=2;notify(hit.name+'의 폭신한 털을 살살 쓰다듬었어요.');baa(.1);return;}selected=null;if(hammocking){notify('해먹에서 일어나기 버튼을 누르면 다시 걸을 수 있어요.');return;}if(seated){notify('일어나기 버튼을 누르면 다시 걸을 수 있어요.');return;}const ground=view.ground(x,y,W,H);if(!ground)return;player.tx=clamp(ground.x,-55,55);player.tz=clamp(ground.z,-55,145);const z=player.tz;marker={x:player.tx,z};following=true;updateViewLabel();}
// Delay walking until release so dragging and pinching never create a walk target.
const pointers=new Map();let gesture=null;
function touchPair(){const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};}
canvas.addEventListener('pointerdown',e=>{
 if(paused||e.button>0||pointers.size>=2)return;if(!started){start();return;}
 canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===1)gesture={kind:'tap',x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};
 else if(pointers.size===2){gesture={kind:'pinch',...touchPair()};following=false;}
});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)||!gesture)return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size>=2){const pair=touchPair();if(gesture.kind==='pinch'){
  view.zoomAt(view.zoom*pair.d/gesture.d,gesture.x,gesture.y,W,H);
  view.pan(pair.x-gesture.x,pair.y-gesture.y,W,H);
 }gesture={kind:'pinch',...pair};following=false;updateViewLabel();return;}
 if(gesture.kind==='blocked')return;
 if(gesture.kind==='tap'&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<8)return;
 view.pan(e.clientX-gesture.lastX,e.clientY-gesture.lastY,W,H);following=false;
 gesture.kind='drag';gesture.lastX=e.clientX;gesture.lastY=e.clientY;updateViewLabel();
});
function endPointer(e,cancelled=false){
 if(!pointers.has(e.pointerId))return;const tap=!cancelled&&pointers.size===1&&gesture?.kind==='tap';
 pointers.delete(e.pointerId);gesture=pointers.size?{kind:'blocked'}:null;
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(tap)tapWorld(e.clientX,e.clientY);
}
canvas.addEventListener('pointerup',e=>endPointer(e));
canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('lostpointercapture',e=>endPointer(e,true));
canvas.addEventListener('wheel',e=>{if(!started||paused)return;e.preventDefault();changeZoom(Math.exp(-clamp(e.deltaY,-200,200)*.002),e.clientX,e.clientY);},{passive:false});
$('zoom-in').onclick=()=>changeZoom(1.25);
$('zoom-out').onclick=()=>changeZoom(.8);
$('camera-home').onclick=()=>{following=true;view.yaw=0;view.pitch=.23;centerView();updateViewLabel();notify('내 위치의 기본 시점으로 돌아왔어요.');};
addEventListener('blur',()=>{pointers.clear();gesture=null;});

addEventListener('keydown',e=>{if(paused)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','f'].includes(k)){e.preventDefault();if(!started)start();if(k==='f'){if(!e.repeat)feed();}else{keys.add(k);following=true;updateViewLabel();}}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
function help(open){$('help-panel').hidden=!open;paused=open;keys.clear();if(open)$('close-help').focus();else $('help').focus();}$('help').onclick=()=>help(true);$('close-help').onclick=$('help-done').onclick=()=>help(false);$('help-panel').onclick=e=>{if(e.target===$('help-panel'))help(false);};addEventListener('keydown',e=>{if(e.key==='Escape'&&paused)help(false);});
let audio,soundOn=false;function baa(volume=.2){if(!audio||!soundOn)return;const now=audio.currentTime,o=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(220+Math.random()*35,now);o.frequency.exponentialRampToValueAtTime(150,now+.5);filter.type='lowpass';filter.frequency.value=700;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume*.25,now+.06);gain.gain.exponentialRampToValueAtTime(.001,now+.65);o.connect(filter).connect(gain).connect(audio.destination);o.start(now);o.stop(now+.7);}
$('sound').onclick=async()=>{try{if(!audio){audio=new AudioContext();const b=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate),data=b.getChannelData(0);let prev=0;for(let i=0;i<data.length;i++){prev=(prev+(Math.random()*2-1)*.03)/1.02;data[i]=prev;}const n=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();n.buffer=b;n.loop=true;f.type='lowpass';f.frequency.value=480;g.gain.value=.32;n.connect(f).connect(g).connect(audio.destination);n.start();}soundOn=!soundOn;await audio[soundOn?'resume':'suspend']();$('sound').setAttribute('aria-pressed',soundOn);$('sound').querySelector('span').textContent=soundOn?'소리 끄기':'소리 켜기';if(soundOn)baa(.15);}catch{notify('이 브라우저에서는 소리를 켤 수 없어요.');}};
