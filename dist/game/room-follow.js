import {lodgeWalkable,FLIGHT,LODGE_ROOM} from './lodge-layout.js?v=lodge-hearth-1';
import {FARM_ROOMS} from './farm-room.js?v=solid-buildings-2';

// Top of the farm room floor slab (center .03, thickness .12).
const coopFloorHeight=.09;

function cameraFits(kind,floor,x,z,elevation){
  if(kind==='lodge'){
    const inShaft=x>3.05&&x<5.12&&z>FLIGHT.opening&&z<13.12;
    if(inShaft){
      const stepHeight=Math.max(0,Math.min(1,(z-FLIGHT.front)/(FLIGHT.back-FLIGHT.front)))*LODGE_ROOM.floorHeight;
      return elevation+1.65>stepHeight+.18;
    }
    if(elevation>2.1&&elevation<3.05)return false;
    return lodgeWalkable({x,z},elevation>=3.05?2:1);
  }
  if(kind==='barn')return z>=.35&&z<=17.65&&Math.abs(x)<=(z>1.5&&z<16.6?2.75:9.1);
  const room=FARM_ROOMS[kind];
  const back=kind==='shed'?room.depth-1:room.depth; // Leave room for the rear tool shelf.
  return z>=.35&&z<=back&&Math.abs(x)<=(z>1.3?1.45:room.halfWidth);
}

// Keep the camera in the same walkable space, including at doors and on the balcony.
export function followRoomVisitor(view,player,kind,floor,w,h,elevation=(floor-1)*LODGE_ROOM.floorHeight,travelTime=null){
  const previous=view.roomFollow;
  if(travelTime===null&&previous&&previous.elevation===elevation&&previous.kind===kind&&previous.floor===floor&&previous.x===player.x&&
     previous.z===player.z&&previous.yaw===view.yaw&&previous.pitch===view.pitch&&previous.zoom===view.zoom&&
     previous.w===w&&previous.h===h)return;
  view.roomFollow={kind,floor,elevation,x:player.x,z:player.z,yaw:view.yaw,pitch:view.pitch,zoom:view.zoom,w,h};
  const sy=Math.sin(view.yaw),cy=Math.cos(view.yaw);
  if(kind==='coop'){
    // A fixed, moderate field of view keeps walls and fittings in proportion.
    const zoom=view.zoom/1.4;
    const focal=Math.max(w,h)*.82*Math.max(.92,Math.pow(zoom,.22));
    const scale=Math.min(h*.15,w*.20)*Math.sqrt(zoom);
    const footSlope=h*.26/focal;
    const pitch=Math.max(.03-Math.atan(footSlope),.05+view.pitch*.45);
    const cp=Math.cos(pitch),sp=Math.sin(pitch);
    const rise=(sp+footSlope*cp)/(cp-footSlope*sp);
    // Fit the orbit smoothly inside the aisle. The near wall can shorten
    // the arm, but never opens the lens or moves the feet off their plank.
    const desired=focal/scale*(cp-footSlope*sp);
    const room=FARM_ROOMS.coop;
    const side=sy>=0?1:-1;
    const lateral=Math.max(.2,1.45+side*player.x);
    const wall=room.halfWidth+.25+side*player.x;
    const longitudinal=cy>=0?player.z-.35:room.depth+.45-player.z;
    const arm=1/Math.hypot(1/desired,sy/Math.min(lateral,wall),cy/longitudinal,rise/2.2);
    view.roomFollow.spriteScale=scale;
    view.target.x=player.x-sy*arm;
    view.target.z=player.z-cy*arm;
    view.eyeHeight=coopFloorHeight+arm*rise;
    view.orbitPitch=pitch;
    view.orbitFocal=focal;
    return;
  }
  if(view.orbitFocal!==undefined)view.eyeHeight=1.65;
  view.orbitPitch=undefined;view.orbitFocal=undefined;
  const f=view.basis(w,h).f;
  const reach=Math.min(7,Math.max(2.5,f/(h*.12)));
  // A slight shoulder offset leaves the path straight ahead visible.
  const dx=-sy+.15*cy,dz=-cy-.15*sy;
  let distance=0;
  for(let step=.15;step<reach+.15;step+=.15){
    const next=Math.min(step,reach);
    if(!cameraFits(kind,floor,player.x+dx*next,player.z+dz*next,elevation)){
      let edge=next;
      for(let i=0;i<4;i++){
        const mid=(distance+edge)/2;
        if(cameraFits(kind,floor,player.x+dx*mid,player.z+dz*mid,elevation))distance=mid;
        else edge=mid;
      }
      break;
    }
    distance=next;
  }
  const targetX=player.x+dx*distance,targetZ=player.z+dz*distance;
  const dt=travelTime===null?0:Math.max(0,travelTime-(view.lastStairTime??travelTime-1/60));
  const blend=travelTime===null?1:1-Math.exp(-dt*10);
  view.target.x+=(targetX-view.target.x)*blend;
  view.target.z+=(targetZ-view.target.z)*blend;
  view.lastStairTime=travelTime;
}

// In the narrow stairwell the usual wall-constrained arm can collapse. Frame the
// flight from inside the room, with a constant arm throughout the climb.
export function frameLodgeStairs(view,visit,player,w,h,time){
  const nearLanding=visit.landing&&Math.hypot(player.x-visit.landing.x,player.z-visit.landing.z)<1.7;
  const travelling=!!visit.stair||((visit.trip==='up'||visit.trip==='down')&&nearLanding);
  let shot=view.stairShot;
  if(!travelling){
    if(!shot)return false;
    const moved=Math.hypot(player.x-shot.x,player.z-shot.z);
    if(!shot.onFlight||moved>.75||view.yaw!==shot.yaw||view.pitch!==shot.pitch){
      view.stairShot=null;view.roomFollow=null;
      view.settleUntil=time+.6;view.lastStairTime=time-1/60;
      return false;
    }
  }
  if(!shot){
    const dx=player.x-view.target.x,dz=player.z-view.target.z;
    shot=view.stairShot={start:time,initialYaw:view.yaw,initialPitch:view.pitch,
      armYaw:Math.atan2(dx,dz),arm:Math.hypot(dx,dz)};
  }
  if(travelling){shot.x=player.x;shot.z=player.z;}
  if(visit.stair)shot.onFlight=true;
  const elapsed=Math.min(1,(time-shot.start)/.55);
  const blend=elapsed*elapsed*(3-2*elapsed);
  const stairYaw=.72;
  const turn=from=>from+Math.atan2(Math.sin(stairYaw-from),Math.cos(stairYaw-from))*blend;
  const focal=view.basis(w,h).f;
  const distance=shot.arm+(Math.min(7,Math.max(3.4,focal/Math.min(h*.106,w*.14)))-shot.arm)*blend;
  const armYaw=turn(shot.armYaw);
  view.yaw=shot.yaw=turn(shot.initialYaw);
  view.pitch=shot.pitch=shot.initialPitch+(.17-shot.initialPitch)*blend;
  view.target.x=player.x-Math.sin(armYaw)*distance;
  view.target.z=player.z-Math.cos(armYaw)*distance;
  const foot=view.project(player.x,player.z,0,w,h);
  // Only the floor between the two storeys can pass between this eye and the
  // walker. Pull its cut plane back to the lens once both are on the same level.
  const floorGap=Math.min(visit.elevation,LODGE_ROOM.floorHeight-visit.elevation);
  const cut=Math.min(1,Math.max(0,floorGap/.65));
  shot.slabNear=Math.max(.12,((foot?.depth??0)-.85)*cut);
  shot.grounded=blend===1;
  return true;
}

export function roomVisitorProjection(view,player,w,h,lift=0){
  if(view.roomFollow?.kind==='coop'){
    const foot=view.project(player.x,player.z,coopFloorHeight,w,h);
    return {...foot,s:view.roomFollow.spriteScale};
  }
  const foot=view.project(player.x,player.z,lift,w,h);
  if(foot&&view.stairShot?.grounded)return foot;
  // When a wall shortens the camera arm, keep the visitor framed in the foreground.
  const maxScale=Math.min(h*.126,w*.18);
  const scale=foot?Math.min(foot.s,maxScale):maxScale;
  const y=foot?foot.y:h*.86;
  const x=foot?Math.max(w*.23,Math.min(w*.77,foot.x)):w*.44;
  return {x,y:Math.max(scale*2.4+h*.03,Math.min(h*.86,y)),s:scale,depth:foot?.depth??0};
}
