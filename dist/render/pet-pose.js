// A fixed-length, two-joint arm meets the near edge of the fleece.
export function petArmPose(playerPoint,animalPoint,animal,time=0){
  const side=animalPoint.x>=playerPoint.x?1:-1,s=playerPoint.s,kneeling=animal.size<.5;
  const shoulder={x:playerPoint.x+side*s*(kneeling?.08:.12),y:playerPoint.y-s*(kneeling?.68:1.18)};
  // Stroke along the fleece, with a visible back-and-forth sweep.
  const stroke=Math.sin(time*3.4);
  const contact={x:animalPoint.x-side*animalPoint.s*animal.size*.78+side*stroke*s*.09,y:animalPoint.y-animalPoint.s*animal.size*1.15+stroke*s*.08};
  let dx=contact.x-shoulder.x,dy=contact.y-shoulder.y,d=Math.hypot(dx,dy)||.001;
  // Size the two bones once for the whole stroke, not for the current hand
  // distance. Keep some bend even at full reach to avoid a straight-arm snap.
  const centerX=animalPoint.x-side*animalPoint.s*animal.size*.78-shoulder.x;
  const centerY=animalPoint.y-animalPoint.s*animal.size*1.15-shoulder.y;
  const strokeX=side*s*.09,strokeY=s*.08;
  const farthest=Math.max(Math.hypot(centerX+strokeX,centerY+strokeY),Math.hypot(centerX-strokeX,centerY-strokeY));
  const bone=Math.max(s*(kneeling?.32:.36),farthest/(2*.90));
  const hand={...contact};
  const bend=Math.sqrt(Math.max(0,bone*bone-d*d/4));
  const elbow={x:(shoulder.x+hand.x)/2-dy/d*bend*side,y:(shoulder.y+hand.y)/2+dx/d*bend*side};
  return {shoulder,elbow,hand,contact,bone,kneeling,wristAngle:Math.atan2(hand.y-elbow.y,hand.x-elbow.x)};
}
