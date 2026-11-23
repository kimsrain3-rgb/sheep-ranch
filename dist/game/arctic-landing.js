import {BarnInteriorView} from './barn-camera.js';
import {TRAM_BOARDING_WALK,TRAM_STOP,tramBoardingPose} from './tram-station.js';

// The dock meets the ice along its full landward edge. Walking stays on the
// union of those two surfaces, even when tapping diagonally across a corner.
export const DOCK={left:-4.6,right:4.6,front:1.29,back:3.85};
export const ICE={left:-14,right:14,front:3.7,back:22};
export const FLOOR=.144;
export const APPROACH_START=13;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function onSurface(x,z,r){return x>=r.left&&x<=r.right&&z>=r.front&&z<=r.back;}
export function createArcticLanding(){
  return {phase:'approach',x:-2.55,z:.8,height:.797,clock:0,step:0,yaw:2.90,pitch:.18,
    headingX:0,headingZ:1,walking:false,goal:null,view:new BarnInteriorView()};
}
export function arcticCamera(s,w,h){
  const v=s.view,free=s.phase==='walk'||s.phase==='toTram';
  v.yaw=free?s.yaw:2.90;v.pitch=free?s.pitch:.16;
  let distance=free?5.8:9;
  const x=free?s.x:-.9,z=free?s.z:.8;
  // Keep the camera on the passenger side when orbiting beside the tram.
  if(free&&Math.cos(v.yaw)>.01){
    const wall=(z-1.35)/Math.cos(v.yaw);
    if(wall<distance&&Math.abs(x-Math.sin(v.yaw)*Math.max(0,wall))<4.2){
      distance=Math.max(.85,wall);
    }
  }
  v.target.x=TRAM_STOP.x+x-Math.sin(v.yaw)*distance;
  v.target.z=TRAM_STOP.z+z-Math.cos(v.yaw)*distance;
  v.eyeHeight=(free?1.25:1.48)+distance*Math.tan(v.pitch);
  v.orbitFocal=Math.min(h*.80,w*(free?1.13:.98));
  return v;
}
export function walkOnIce(s,x,z){
  if(s.phase!=='walk'||!(onSurface(x,z,ICE)||onSurface(x,z,DOCK)))return;
  s.goal={x,z};
}
export function returnToArcticTram(s){
  if(s.phase!=='walk')return;
  const door={x:TRAM_STOP.entrance.x-TRAM_STOP.x,z:TRAM_STOP.entrance.z-TRAM_STOP.z};
  // Cross from ice to dock through their overlap, including from either
  // distant end of the shore. Both legs stay on a walkable surface.
  s.returnPath=[door];
  if(!onSurface(s.x,s.z,DOCK))s.returnPath.unshift({x:door.x,z:(ICE.front+DOCK.back)/2});
  s.goal=s.returnPath.shift();
  s.phase='toTram';
  s.yaw=2.90;
}
export function stepArctic(s,dt){
  s.clock+=dt;
  s.walking=false;
  if(s.phase==='disembark'){
    s.step=Math.min(2,s.step+dt);
    const exit=tramBoardingPose(TRAM_STOP.entrance,Math.max(0,TRAM_BOARDING_WALK-s.step));
    s.x=exit.x-TRAM_STOP.x;s.z=exit.z-TRAM_STOP.z;s.height=exit.height;
    if(s.step>TRAM_BOARDING_WALK)s.z+=(s.step-TRAM_BOARDING_WALK)*2.65;
    s.walking=s.step<2;
    if(!s.walking){s.phase='walk';s.height=FLOOR;}
  }else if(s.phase==='board'){
    s.step=Math.min(TRAM_BOARDING_WALK,s.step+dt);
    const pose=tramBoardingPose(TRAM_STOP.entrance,s.step);
    s.x=pose.x-TRAM_STOP.x;s.z=pose.z-TRAM_STOP.z;s.height=pose.height;
    s.walking=pose.walking;
    if(!s.walking)s.phase='inside';
  }else if((s.phase==='walk'||s.phase==='toTram')&&s.goal){
    const dx=s.goal.x-s.x,dz=s.goal.z-s.z,len=Math.hypot(dx,dz);
    if(len<.02){
      s.x=s.goal.x;s.z=s.goal.z;s.goal=s.returnPath?.shift()??null;
      if(s.phase==='toTram'&&!s.goal){
        s.phase='board';s.step=0;s.headingX=0;s.headingZ=-1;
      }
      return;
    }
    const travel=Math.min(dt*2.8,len);
    s.headingX=dx/len;s.headingZ=dz/len;
    const x=s.x+travel*s.headingX,z=s.z+travel*s.headingZ;
    if(onSurface(x,z,DOCK)||onSurface(x,z,ICE)){s.x=x;s.z=z;s.walking=true;}
    else s.goal=null;
  }
}
export function turnOnIce(s,dx,dy){
  if(s.phase!=='walk')return;
  s.yaw-=dx*.010;s.pitch=clamp(s.pitch+dy*.003,.09,.52);
}
export function tapOnIce(s,px,py,w,h){
  const v=arcticCamera(s,w,h),b=v.basis(w,h);
  // Intersect the actual walking plane, using the ground ray at this pixel.
  const ground=v.ground(px,py,w,h);
  if(!ground)return;
  const ratio=(b.height-FLOOR)/b.height;
  walkOnIce(s,b.x+(ground.x-b.x)*ratio-TRAM_STOP.x,b.z+(ground.z-b.z)*ratio-TRAM_STOP.z);
}
