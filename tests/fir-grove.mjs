import assert from 'node:assert/strict';
import {forestPins,trailX,firs,wildlifeAt,clearTrunks,groveRoute} from '../dist/game/fir-grove.js';
import {isWater,CONFIG} from '../dist/game/config.js';
import {dryRoute} from '../dist/game/navigation.js';
for(const p of forestPins)assert.equal(trailX(p.z),p.x);
for(const t of firs){
  assert.ok(!isWater(t,2) && t.x<CONFIG.playerBounds.maxX);
  assert.ok(Math.abs(trailX(t.z)-t.x)>3);
  assert.ok(t.x>CONFIG.shed.x+10);
}
const a={x:trailX(-84),z:-84},b={x:trailX(24),z:24};
for(const end of [a,b]){
  const way=groveRoute({x:0,z:0},dryRoute({x:0,z:0},end));
  assert.ok(Math.hypot(way.at(-1).x-end.x,way.at(-1).z-end.z)<.01);
}
const tree=firs[0],from={x:tree.x-2,z:tree.z},to={x:tree.x+2,z:tree.z};
let prev=from;
for(const point of groveRoute(from,[to])){
  for(let i=0;i<=24;i++){
    const u=i/24,p={x:prev.x+(point.x-prev.x)*u,z:prev.z+(point.z-prev.z)*u};
    assert.ok(Math.hypot(p.x-tree.x,p.z-tree.z)>=tree.radius+.24);
  }
  prev=point;
}
const inTrunk={x:tree.x,z:tree.z};clearTrunks(inTrunk);
assert.ok(Math.hypot(inTrunk.x-tree.x,inTrunk.z-tree.z)>tree.radius);
for(let i=0;i<180;i++)for(const animal of wildlifeAt(i*.5)){
  assert.ok(!isWater(animal));
  assert.ok(!firs.some(t=>Math.hypot(t.x-animal.x,t.z-animal.z)<t.radius+.22));
}
console.log('Four forest landmarks, dry connected access, solid trunks and wildlife clearings passed.');

const foxFrames = new Set();
for(let step=0;step<200;step++){
  const animals = wildlifeAt(step*.1);
  const foxes = animals.filter(a=>a.fox);
  assert.equal(foxes.length,1);
  const fox = foxes[0];
  assert.ok(Math.abs(fox.x-trailX(fox.z))<=2.11 && Math.abs(fox.z+22)<=1.351);
  foxFrames.add(fox.frame);
}
assert.equal(foxFrames.size,36);

// Every painted hoof ends on the same
// projected surface as the forest path, even when the camera faces uphill.
const {addForestLayers}=await import('../dist/render/fir-grove.js');
const {forestHeight}=await import('../dist/game/forest-hills.js');
// Keep the whole patrol on the clearing floor, including the hoof footprint.
for(let time=0;time<58;time+=.2){
  const deer=wildlifeAt(time)[1];
  for(const dx of [-.8,.8])for(const dz of [-.8,.8])
    assert.ok(forestHeight(deer.x+dx,deer.z+dz)<.03);
}
for(const yaw of [0,Math.PI/2,Math.PI]){
  for(const time of [0,.25,2]){
    const deer=wildlifeAt(time)[1],scale=65,points=[],feet=[];
    const project=(x,z)=>{
      const p={x:400+scale*((x-deer.x)*Math.cos(yaw)-(z-deer.z)*Math.sin(yaw)),
        y:500-scale*forestHeight(x,z),s:scale};
      points.push(p);return p;
    };
    let ox,oy,sx,sy,last;
    const ctx={save(){},restore(){},translate(x,y){ox=x;oy=y;},scale(x,y){sx=x;sy=y;},
      beginPath(){},moveTo(){},lineTo(x,y){last=[ox+x*sx,oy+y*sy];},
      stroke(){if(this.strokeStyle==='#6e5946')feet.push(last);},ellipse(){},fill(){}};
    const layers=[];
    addForestLayers(layers,ctx,project,800,700,time,yaw);
    points.length=0;
    layers.find(l=>l.wildlife?.name==='사슴').draw();
    assert.equal(feet.length,4);assert.equal(points.length,4);
    feet.forEach(([x,y],i)=>assert.ok(Math.hypot(x-points[i].x,y-points[i].y)<.001));
  }
}
