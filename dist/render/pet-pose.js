// A fixed-length, two-joint arm meets the near edge of the fleece.
export function petArmPose(playerPoint,animalPoint,animal,time=0){
  const side=animalPoint.x>=playerPoint.x?1:-1,s=playerPoint.s,kneeling=animal.size<.5;
  const shoulder={x:playerPoint.x+side*s*(kneeling?.08:.12),y:playerPoint.y-s*(kneeling?.68:1.18)};
  const contact={x:animalPoint.x-side*animalPoint.s*animal.size*.78,y:animalPoint.y-animalPoint.s*animal.size*1.15+Math.sin(time*3)*s*.015};
  let dx=contact.x-shoulder.x,dy=contact.y-shoulder.y,d=Math.hypot(dx,dy)||.001;
  const bone=s*(kneeling?.32:.36),reach=Math.min(d,bone*2-.001);
  const hand={x:shoulder.x+dx/d*reach,y:shoulder.y+dy/d*reach};
  dx=hand.x-shoulder.x;dy=hand.y-shoulder.y;d=Math.hypot(dx,dy)||.001;
  const bend=Math.sqrt(Math.max(0,bone*bone-d*d/4));
  const elbow={x:(shoulder.x+hand.x)/2-dy/d*bend*side,y:(shoulder.y+hand.y)/2+dx/d*bend*side};
  return {shoulder,elbow,hand,contact,bone,kneeling};
}
