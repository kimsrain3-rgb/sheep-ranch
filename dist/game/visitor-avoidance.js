// Keep a short look-ahead so a sheep crossing the path after a tap is also seen.
function clusterDetour(from,goal,obstacles) {
  const local=obstacles.filter(o=>!o.following && Math.hypot(o.x-from.x,o.z-from.z)<o.radius+5);
  if (local.length<2 || local.length>12) return null;
  const nodes=[from,goal], count=12;
  for (const o of local) {
    const radius=(o.radius+.12)/Math.cos(Math.PI/count);
    for (let i=0;i<count;i++) {
      const angle=i*2*Math.PI/count;
      const p={x:o.x+Math.cos(angle)*radius,z:o.z+Math.sin(angle)*radius};
      if (local.every(c=>Math.hypot(p.x-c.x,p.z-c.z)>c.radius+.05)) nodes.push(p);
    }
  }
  function visible(a,b) {
    const dx=b.x-a.x,dz=b.z-a.z,dd=dx*dx+dz*dz;
    if (!dd) return false;
    return local.every(o=>{
      const u=Math.min(1,Math.max(0,((o.x-a.x)*dx+(o.z-a.z)*dz)/dd));
      return Math.hypot(a.x+u*dx-o.x,a.z+u*dz-o.z)>=o.radius+.015;
    });
  }
  const cost=nodes.map(()=>Infinity), parent=[], done=new Set();cost[0]=0;
  for (;;) {
    let best=-1;
    for(let i=0;i<nodes.length;i++)
      if(!done.has(i)&&Number.isFinite(cost[i])&&(best<0||cost[i]<cost[best]))best=i;
    if(best<0)return null;
    if(best===1)break;
    done.add(best);
    for(let i=1;i<nodes.length;i++){
      if(done.has(i))continue;
      const d=cost[best]+Math.hypot(nodes[i].x-nodes[best].x,nodes[i].z-nodes[best].z);
      if(d<cost[i]&&visible(nodes[best],nodes[i])){cost[i]=d;parent[i]=best;}
    }
  }
  const route=[];
  for(let i=parent[1];i>0;i=parent[i])route.unshift(nodes[i]);
  return route.length ? route : null;
}
export function visitorStep(from, goal, stride, obstacles, allowed, steering = {}) {
  if (steering.route && Math.hypot(goal.x-steering.goal.x,goal.z-steering.goal.z)>.4) steering.route=null;
  while(steering.route?.length && Math.hypot(from.x-steering.route[0].x,from.z-steering.route[0].z)<.10)steering.route.shift();
  if (steering.route?.length) {
    const waypoint=steering.route[0];
    if (obstacles.some(o=>Math.hypot(o.x-waypoint.x,o.z-waypoint.z)<o.radius+.015)) {
      steering.route=null;steering.retry=0;
    }
  }
  const destination=goal;
  if (steering.route?.length) goal=steering.route[0];
  const dx = goal.x - from.x, dz = goal.z - from.z;
  const distance = Math.hypot(dx, dz);
  if (!distance) return from;
  const heading = Math.atan2(dz, dx);
  const ahead = Math.min(distance, Math.max(stride, 1.5));
  const nearby = obstacles.filter(o =>
    Math.abs(o.x - from.x) <= ahead + o.radius &&
    Math.abs(o.z - from.z) <= ahead + o.radius);
  // Test the swept segment, and allow escape if a moving sheep overlaps us.
  function clear(ux, uz) {
    return nearby.every(o => {
      const x = o.x - from.x, z = o.z - from.z;
      const projection = x * ux + z * uz;
      if (projection <= 0) return true;
      // A yielding actor is already walking ahead. Check the actual step
      // against its current body without steering around its future path.
      const nearest = Math.min(o.following ? stride : ahead, projection);
      return Math.hypot(x - ux * nearest, z - uz * nearest) >= o.radius;
    });
  }
  function candidate(angle) {
    const ux = Math.cos(angle), uz = Math.sin(angle);
    if (!clear(ux, uz)) return null;
    const next = {x:from.x+ux*stride, z:from.z+uz*stride};
    return allowed(next) ? next : null;
  }
  steering.retry=Math.max(0,(steering.retry||0)-stride);
  if (!steering.route?.length && !steering.retry && !nearby.some(o=>o.following) && !clear(dx/distance,dz/distance)) {
    steering.retry=.9;
    steering.route=clusterDetour(from,destination,obstacles);
    steering.goal={...destination};
    if(steering.route) return visitorStep(from,destination,stride,obstacles,allowed,steering);
  }
  stride=Math.min(stride,distance);
  const previous = steering.angle;
  const relative = Number.isFinite(previous) ? previous-heading : 0;
  const side = Math.sin(relative) < -.02 ? -1 : 1;
  for (let turn=0; turn<=8; turn++) {
    for (const sign of turn ? [side,-side] : [1]) {
      const angle=heading+sign*turn*Math.PI/16;
      let next=candidate(angle);
      if (!next) continue;
      // Ease out of a detour as space opens. Every blended step is checked
      // against the same bodies and railings as the original candidate.
      if (Number.isFinite(previous) && distance>.9) {
        const delta=Math.atan2(Math.sin(angle-previous),Math.cos(angle-previous));
        if (Math.abs(delta)>.015 && Math.abs(delta)<Math.PI/2) {
          const smooth=previous+delta*(1-Math.exp(-stride/.38));
          const eased=candidate(smooth);
          if (eased) {steering.angle=smooth;return eased;}
        }
      }
      steering.angle=angle;
      return next;
    }
  }
  steering.route=null;
  return from;
}

// In a single-file passage, keep one yielding direction until the visitor passes.
// Outside that encounter the normal flock and walking controllers retain control.
export function passageTraffic(player,goal,stride,dt,bodies,memory,legal){
  const dx=goal.x-player.x,dz=goal.z-player.z,length=Math.hypot(dx,dz);
  const moves=[];
  if(!length)return {moves,stride};
  const ux=dx/length,uz=dz/length;
  let clearance=stride;
  const retained=new Set();
  function fits(from,to,margin,ignored){
    if(!legal(from,to,ignored?.actor))return false;
    return bodies.every(o=>{
      if(o===ignored)return true;
      const limit=Math.max(.12,o.radius+margin);
      const before=Math.hypot(from.x-o.x,from.z-o.z);
      return Math.hypot(to.x-o.x,to.z-o.z)>=Math.min(before,limit)-1e-6;
    });
  }
  const actors=bodies.filter(b=>b.actor).sort((a,b)=>(a.x-b.x)*ux+(a.z-b.z)*uz);
  const queue=[];
  for(const b of actors){
    const a=b.actor;
    if(!a||a.lock||a.talk||a.state==='nursing'||a.state==='sleep')continue;
    const x=b.x-player.x,z=b.z-player.z,along=x*ux+z*uz,side=z*ux-x*uz;
    const pushed=queue.some(front=>Math.hypot(front.x-b.x,front.z-b.z)<front.radius+b.radius+.65);
    if(along<-.3||Math.abs(side)>b.radius+.5||(!pushed&&along>Math.min(length+b.radius+.5,b.radius+2.8)))continue;
    let direction=memory.get(a);
    if(direction && direction.ux*ux+direction.uz*uz<.65)direction=null;
    if(!direction){
      if(Math.abs(side)>=b.radius||along<=0)continue;
      const open=[-1,1].some(sign=>{
        const offset=sign*(b.radius+.32);
        const to={x:b.x-uz*offset,z:b.z+ux*offset};
        return fits(player,to,0,b);
      });
      if(open&&!pushed)continue;
      const sign=side>=0?1:-1;
      direction={ux,uz,sign};
    }
    retained.add(a);memory.set(a,direction);queue.push(b);
    const gap=Math.hypot(x,z)-b.radius;
    if(along>=0&&Math.abs(side)<b.radius+.15)clearance=Math.min(clearance,Math.max(0,gap-.08));
    b.following=true;
    const step=Math.min(dt*2.5,.16);
    let point={x:b.x,z:b.z};
    for(const angle of [direction.sign*.87,0,-direction.sign*.87]){
      const c=Math.cos(angle),s=Math.sin(angle);
      const candidate={x:b.x+(direction.ux*c-direction.uz*s)*step,z:b.z+(direction.uz*c+direction.ux*s)*step};
      if(fits(b,candidate,b.radius-.8,b)){
        point=candidate;
        if(angle)direction.sign=Math.sign(angle);
        break;
      }
    }
    moves.push({actor:a,point,walking:point.x!==b.x||point.z!==b.z});
  }
  for(const a of memory.keys())if(!retained.has(a))memory.delete(a);
  return {moves,stride:clearance};
}
