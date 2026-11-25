import {BarnInteriorView} from '../game/barn-camera.js';
import {TRAM_STOP} from '../game/tram-station.js';
import {drawVisitor,visitorPose} from '../visitor.js?v=limb-light-1';
import {currentAppearance} from '../game/visitor-appearance.js';
import {mintModelReady} from './mint-model.js';
import {onMintArtLoaded} from './mint-visitor.js';
import {drawTramCabin} from './buildings-three.js?v=tram-station-1';

const routes={
  '목장':['#95c8d8','#ffebc9','#b1bd83','#81a36b','#789057'],
  '북극':['#78bacd','#e4f3ef','#aacdd2','#79b7c2','#4d97ab'],
  '사막':['#8fbdd2','#ffe7b5','#d5ae87','#e6b571','#c58c55'],
  '정글':['#8fbcb8','#d9e8c0','#84ad91','#51896e','#3b725c']
};
function poly(c,color,points){
  c.fillStyle=color;c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();c.fill();
}
// Repeat the painted horizon exactly once per turn, keeping the two windows
// on opposite sides of the same panorama.
const panoramaWidth=20*173;
const wrap=(value,size)=>((value%size)+size)%size;
function ridge(c,width,base,height,travel,color){
  c.beginPath();c.moveTo(0,1800);
  for(let x=0;x<=width+8;x+=8){
    const p=x+travel;
    c.lineTo(x,base-height*(.52+.32*Math.sin(p*2*Math.PI*5/panoramaWidth)+.22*Math.cos(p*2*Math.PI*12/panoramaWidth)));
  }
  c.lineTo(width+8,1800);c.closePath();c.fillStyle=color;c.fill();
}
function landmark(c,route,seed){
  const r=Math.abs(Math.sin(seed*73.37));
  c.scale(.66+r*.55,.66+r*.55);
  if(route==='북극'){
    poly(c,'#c4ebed',[[-68,0],[-42,-8],[-6,-32],[15,-23],[31,-40],[48,-8],[76,-2],[30,8]]);
    poly(c,'#f1fbf5',[[-68,0],[-6,-32],[2,-18],[15,-23],[31,-40],[19,-10],[-32,1]]);
    poly(c,'#72b1c1',[[2,-18],[15,-23],[9,-8],[-32,1]]);
    poly(c,'#b4dbe0',[[-56,8],[35,12],[66,8],[31,16]]);
  }else if(route==='사막'){
    poly(c,'#ac7161',[[-62,1],[-46,-21],[-35,-23],[-28,-63],[5,-64],[11,-52],[30,-50],[37,-18],[66,1]]);
    poly(c,'#c68d68',[[-62,1],[-46,-21],[-35,-23],[-28,-63],[-4,-62],[-10,-39],[-19,-38],[-25,-10]]);
  }else if(route==='정글'){
    poly(c,'#664f37',[[-6,2],[1,-44],[15,-93],[18,-92],[9,-42],[4,2]]);
    for(let i=0;i<9;i++){
      const a=i*Math.PI/6+.2,dx=Math.cos(a)*54,dy=Math.sin(a)*25;
      poly(c,i%2?'#275b49':'#41775a',[[16,-91],[16+dx*.45,-105+dy*.48],[16+dx,-89+dy],[16+dx*.53,-93+dy*.65]]);
    }
  }else{
    poly(c,'#705e42',[[-3,2],[-3,-49],[4,-50],[4,2]]);
    for(let i=0;i<3;i++)poly(c,i===2?'#557755':'#648460',[[-28+i*5,-14-i*16],[0,-59-i*11],[28-i*5,-14-i*16]]);
  }
}
function paintRegion(c,w,name,distance,heading){
  const [top,light,far,mid,near]=routes[name];
  const sky=c.createLinearGradient(0,40,0,414);
  sky.addColorStop(0,top);sky.addColorStop(1,light);
  c.fillStyle=sky;c.fillRect(0,-1800,w,3600);
  c.fillStyle='#fff1c8';
  for(let x=wrap(w*.72-heading,panoramaWidth)-panoramaWidth;x<w+27;x+=panoramaWidth){
    c.beginPath();c.arc(x,164,27,0,Math.PI*2);c.fill();
  }
  ridge(c,w,322,55,heading+distance*.10,far);
  ridge(c,w,362,46,heading+distance*.27,mid);
  if(name==='북극'){
    const sea=c.createLinearGradient(0,338,0,600);
    sea.addColorStop(0,mid);sea.addColorStop(1,near);c.fillStyle=sea;c.fillRect(0,342,w,1800);
    c.fillStyle='#bce0df';
    for(let i=0;i<52;i++){
      const x=wrap(i*137.7-heading-distance*(.21+i%5*.13),panoramaWidth)-50;
      c.fillRect(x,349+(i*37)%225,9+i%39,1.4);
    }
  }else ridge(c,w,445,51,heading+distance*.58,near);
  const offset=heading+distance*.73,first=Math.floor(offset/173)-1;
  for(let i=first;i<=first+Math.ceil(w/173)+2;i++){
    const seed=wrap(i,20);
    const x=i*173-offset,y=373+Math.sin(seed*32)*22;
    c.save();c.translate(x,y);landmark(c,name,seed+14);c.restore();
  }
}

// The visitor sits on the edge of the long bench, facing across the aisle.
const passengerSeat={x:TRAM_STOP.x+.87,z:TRAM_STOP.z+.50,hipHeight:1.35};
const coachView=new BarnInteriorView();

let lastLook=null, lastModelReady=false;
onMintArtLoaded(()=>{lastLook=null;});
let lastWindowView=null, shell=null, lastTick=-1;

function drawPassenger(context,w,h,look,seatedIdleTime){
  const {x,z,hipHeight}=passengerSeat;
  const hip=coachView.project(x,z,hipHeight,w,h);
  if(!hip)return;
  const eye=coachView.target;
  const bearing=Math.atan2(x-eye.x,z-eye.z);
  const distance=Math.hypot(x-eye.x,z-eye.z);
  // Anchor the seated pose at the hips. Project the upright axis too, so a
  // tilted camera does not lift the visitor off the bench.
  const crown=coachView.project(x,z,hipHeight+1,w,h);
  if(!crown)return;
  const scale=coachView.orbitFocal/distance;
  const upX=crown.x-hip.x,upY=crown.y-hip.y;
  if(hip.x+scale<0||hip.x-scale>w)return;
  context.save();
  context.transform(scale,0,-upX,-upY,hip.x,hip.y);
  drawVisitor(context,{x:0,y:.5,s:1},{seated:true,seatedIdleTime,pose:visitorPose(0,-1,bearing),appearance:look});
  context.restore();
}

export function drawTramRide(scenery,cabin,name,progress,yaw,pitch,windowView=false,clock=performance.now()/1000){
  const w=scenery.clientWidth,h=scenery.clientHeight;
  if(!w||!h)return;
  const ratio=Math.min(window.devicePixelRatio||1,1.5);
  const pw=Math.round(w*ratio),ph=Math.round(h*ratio);
  const resized=!scenery.dataset.ready||scenery.width!==pw||scenery.height!==ph;
  if(resized){
    scenery.width=pw;scenery.height=ph;
    cabin.width=pw;cabin.height=ph;
    scenery.dataset.ready='1';
  }
  // In the cabin, frame the occupied bench on the left and sight through the
  // adjacent pane. At the window, the eye stays inside the glass as it turns.
  const eyeX=windowView ? -.342 : 1.70;
  const eyeZ=windowView ? .71 : -.84;
  const focal=h*(windowView ? .79 : .43);
  const look=currentAppearance();
  // Frame the wider painted bob on portrait phones while the seat stays fixed.
  const portraitOffset=look.id==='mint' ? Math.min(.25,Math.max(0,(h/w-1.25)*.27)) : 0;
  yaw-=windowView ? .36 : .66+portraitOffset;
  // On tall screens leave the bottom action row below the shoes.
  if(!windowView)pitch+=h>w ? .22 : .12;
  const turned=coachView.yaw!==yaw||coachView.pitch!==pitch;
  const changed=resized||turned||look!==lastLook||lastModelReady!==mintModelReady()||windowView!==lastWindowView;
  const tick=Math.floor(clock*24);
  if(changed||(!windowView&&tick!==lastTick)){
    lastTick=tick;
    lastLook=look;lastModelReady=mintModelReady();lastWindowView=windowView;
    coachView.yaw=yaw;coachView.pitch=pitch;
    coachView.eyeHeight=windowView ? 2.65 : 2.70;
    coachView.target.x=TRAM_STOP.x+eyeX;
    coachView.target.z=TRAM_STOP.z+eyeZ;
    const interior=cabin.getContext('2d');
    interior.setTransform(pw/w,0,0,ph/h,0,0);
    interior.clearRect(0,0,w,h);
    coachView.orbitFocal=focal;
    if(changed){
      shell??=cabin.cloneNode?.(false);
      if(shell){
        shell.width=pw;shell.height=ph;
        const background=shell.getContext('2d');
        background.setTransform(pw/w,0,0,ph/h,0,0);
        drawTramCabin(background,coachView,w,h);
      }
      scenery.dataset.arrived='';
    }
    if(shell)interior.drawImage(shell,0,0,w,h);
    else drawTramCabin(interior,coachView,w,h);
    drawPassenger(interior,w,h,look,tick/24);
  }
  if(progress===1 && scenery.dataset.arrived===name)return;
  scenery.dataset.arrived=progress===1?name:'';
  const c=scenery.getContext('2d'), width=600*w/h;
  c.setTransform(ph/600,0,0,ph/600,0,0);
  const travel=1760*(progress-Math.sin(2*Math.PI*progress)/(2*Math.PI));
  const heading=panoramaWidth*(yaw-.36)/(2*Math.PI);
  const distance=travel*Math.cos(yaw);
  c.translate(0,-600*focal/h*Math.tan(pitch));
  // On the 16-second Arctic run, leave six seconds for the meadow and
  // four for the transition before the three-second platform approach.
  const arctic=name==='북극';
  const start=arctic?6/16:.12, end=arctic?10/16:.34;
  if(progress<end)paintRegion(c,width,'목장',distance,heading);
  if(progress>start){
    const mix=Math.min(1,(progress-start)/(end-start));
    c.globalAlpha=arctic?mix*mix*(3-2*mix):mix;
    paintRegion(c,width,name,distance,heading);c.globalAlpha=1;
  }
}
