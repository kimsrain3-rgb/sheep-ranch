import {lodgeWalkable} from './lodge-layout.js?v=lodge-eyes-2';
import {FARM_ROOMS} from './farm-room.js?v=solid-buildings-2';

function cameraFits(kind,floor,x,z){
  if(kind==='lodge')return lodgeWalkable({x,z},floor);
  if(kind==='barn')return z>=.35&&z<=17.65&&Math.abs(x)<=(z>1.5&&z<16.6?2.75:9.1);
  const room=FARM_ROOMS[kind];
  const back=kind==='shed'?room.depth-1:room.depth; // Leave room for the rear tool shelf.
  return z>=.35&&z<=back&&Math.abs(x)<=(z>1.3?1.45:room.halfWidth);
}

// Keep the camera in the same walkable space, including at doors and on the balcony.
export function followRoomVisitor(view,player,kind,floor,w,h){
  const previous=view.roomFollow;
  if(previous&&previous.kind===kind&&previous.floor===floor&&previous.x===player.x&&
     previous.z===player.z&&previous.yaw===view.yaw&&previous.zoom===view.zoom&&
     previous.w===w&&previous.h===h)return;
  view.roomFollow={kind,floor,x:player.x,z:player.z,yaw:view.yaw,zoom:view.zoom,w,h};
  const f=view.basis(w,h).f;
  const reach=Math.min(7,Math.max(2.5,f/(h*.12)));
  const sy=Math.sin(view.yaw),cy=Math.cos(view.yaw);
  // A slight shoulder offset leaves the path straight ahead visible.
  const dx=-sy+.15*cy,dz=-cy-.15*sy;
  let distance=0;
  for(let step=.15;step<reach+.15;step+=.15){
    const next=Math.min(step,reach);
    if(!cameraFits(kind,floor,player.x+dx*next,player.z+dz*next)){
      let edge=next;
      for(let i=0;i<4;i++){
        const mid=(distance+edge)/2;
        if(cameraFits(kind,floor,player.x+dx*mid,player.z+dz*mid))distance=mid;
        else edge=mid;
      }
      break;
    }
    distance=next;
  }
  view.target.x=player.x+dx*distance;
  view.target.z=player.z+dz*distance;
}

export function roomVisitorProjection(view,player,w,h){
  const foot=view.project(player.x,player.z,0,w,h);
  // When a wall shortens the camera arm, keep the visitor framed in the foreground.
  const maxScale=Math.min(h*.126,w*.18);
  const scale=foot?Math.min(foot.s,maxScale):maxScale;
  const y=foot?foot.y:h*.86;
  const x=foot?Math.max(w*.23,Math.min(w*.77,foot.x)):w*.44;
  return {x,y:Math.max(scale*2.4+h*.03,Math.min(h*.86,y)),s:scale,depth:foot?.depth??0};
}
