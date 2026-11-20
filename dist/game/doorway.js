// Interior coordinates use z=0 for the front wall and positive z inside.
export const ROOM_DOORS={
  barn:{halfWidth:3.1,height:3.5},
  coop:{halfWidth:1,height:2.6},
  shed:{halfWidth:1,height:2.6},
  lodge:{halfWidth:1.1,height:3.1}
};

export function groundThroughDoor(kind,eye,ground){
  if(!ground||ground.z>=0||eye.z<=0)return false;
  const fraction=eye.z/(eye.z-ground.z);
  const x=eye.x+(ground.x-eye.x)*fraction;
  const height=eye.height*(1-fraction);
  const door=ROOM_DOORS[kind];
  return Math.abs(x)<door.halfWidth&&height<door.height;
}
