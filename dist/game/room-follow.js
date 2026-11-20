import {lodgeWalkable,FLIGHT,LODGE_ROOM} from './lodge-layout.js?v=lodge-flight-1';
import {FARM_ROOMS} from './farm-room.js?v=solid-buildings-2';

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
     previous.z===player.z&&previous.yaw===view.yaw&&previous.zoom===view.zoom&&
     previous.w===w&&previous.h===h)return;
  view.roomFollow={kind,floor,elevation,x:player.x,z:player.z,yaw:view.yaw,zoom:view.zoom,w,h};
  const f=view.basis(w,h).f;
  const reach=Math.min(7,Math.max(2.5,f/(h*.12)));
  const sy=Math.sin(view.yaw),cy=Math.cos(view.yaw);
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

export function roomVisitorProjection(view,player,w,h,lift=0){
  const foot=view.project(player.x,player.z,lift,w,h);
  // When a wall shortens the camera arm, keep the visitor framed in the foreground.
  const maxScale=Math.min(h*.126,w*.18);
  const scale=foot?Math.min(foot.s,maxScale):maxScale;
  const y=foot?foot.y:h*.86;
  const x=foot?Math.max(w*.23,Math.min(w*.77,foot.x)):w*.44;
  return {x,y:Math.max(scale*2.4+h*.03,Math.min(h*.86,y)),s:scale,depth:foot?.depth??0};
}
