// A gait in the forward/up plane. Lateral leg lanes never bend outward.
const TAU=Math.PI*2;
export const WALK_CYCLES_PER_SECOND=1.15;
export function legJoints(phase,walking=true){
  const hip={forward:0,y:-.68};
  if(!walking)return {hip,knee:{forward:0,y:-.37},ankle:{forward:0,y:-.06},lift:0};
  const cycle=((phase%1)+1)%1,stance=cycle<.62;
  const swing=stance?0:(cycle-.62)/.38;
  const forward=stance?.19*(1-2*cycle/.62):-.19+.38*(swing*swing*(3-2*swing));
  const lift=stance?0:.13*Math.sin(Math.PI*swing);
  const ankle={forward,y:-.06-lift};
  const bone=.325;
  if(stance)hip.y=ankle.y-Math.sqrt((2*bone-.005)**2-forward**2);
  const dx=ankle.forward,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
  const bend=Math.sqrt(Math.max(0,bone*bone-d*d/4));
  // Select the knee on the forward side of the hip-to-ankle line.
  const knee={forward:dx/2+dy/d*bend,y:hip.y+dy/2-dx/d*bend};
  return {hip,knee,ankle,lift};
}
export function gaitLegs(time,pose='back',walking=false,seated=false){
  const side=pose==='left'||pose==='right',front=pose==='front';
  return [0,1].map(i=>{
    const lane=side?(i? .045:-.045):(i? .145:-.145);
    if(seated)return {hip:{x:lane,y:-.5},knee:{x:lane+.2,y:-.26},ankle:{x:lane+.21,y:-.04},index:i};
    const joints=legJoints(time*WALK_CYCLES_PER_SECOND+i*.5,walking);
    const project=p=>({x:lane+(side?p.forward:0),y:p.y+(side?0:p.forward*(front?.16:-.16))});
    return {hip:project(joints.hip),knee:project(joints.knee),ankle:project(joints.ankle),index:i};
  });
}
export function armSwing(time,walking){return walking?Math.sin(time*TAU*WALK_CYCLES_PER_SECOND)*.085:0;}
