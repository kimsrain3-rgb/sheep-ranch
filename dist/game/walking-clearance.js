// Steer one normal walking step, looking ahead far enough to turn before contact.
export function steerWalk(from,goal,step,near,legal,memory={}){
  const dx=goal.x-from.x,dz=goal.z-from.z,d=Math.hypot(dx,dz);
  if(!d)return from;
  const heading=Math.atan2(dz,dx),probe=Math.min(d,2.2);
  function clear(ux,uz,length){
    for(const obj of near){
      const x=obj.x-from.x,z=obj.z-from.z,along=x*ux+z*uz;
      if(along<=0)continue; // Always allow walking away from an overlapping animal.
      const alongSegment=Math.min(along,length);
      if((x-ux*alongSegment)**2+(z-uz*alongSegment)**2<obj.r**2)return false;
    }
    return true;
  }
  const sameGoal=memory.goal && Math.hypot(goal.x-memory.goal.x,goal.z-memory.goal.z)<.2;
  if(!sameGoal){memory.turn=0;memory.goal={...goal};}
  if(clear(dx/d,dz/d,probe)&&legal({x:from.x+dx/d*step,z:from.z+dz/d*step})){
    memory.turn=0;
    return {x:from.x+dx/d*step,z:from.z+dz/d*step};
  }
  // Keep circling a touching group on the same side until the route opens.
  if(!memory.turn){
    for(let k=1;k<=12&&!memory.turn;k++){
      for(const side of [1,-1]){
        const angle=heading+side*k*Math.PI/12,ux=Math.cos(angle),uz=Math.sin(angle);
        if(clear(ux,uz,probe)&&legal({x:from.x+ux*step,z:from.z+uz*step})){memory.turn=side;break;}
      }
    }
  }
  for(const look of [probe,step]){
    for(let k=0;k<=24;k++){
      const angle=heading+(memory.turn||1)*k*Math.PI/12;
      const ux=Math.cos(angle),uz=Math.sin(angle);
      if(!clear(ux,uz,look))continue;
      const next={x:from.x+ux*step,z:from.z+uz*step};
      if(legal(next))return next;
    }
  }
  return from;
}
