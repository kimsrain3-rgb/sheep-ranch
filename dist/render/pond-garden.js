import {CONFIG, pondPoint, pondLevel, LAKE_BRIDGE, bridgePoint, onBridge, nearestRiver} from '../game/config.js?v=solid-buildings-2';
import {generator} from '../game/fir-grove.js';
import {clipPondPolygon} from './pond.js?v=water-join-1';

const random = generator(83521);
const landing = bridgePoint(LAKE_BRIDGE.halfLength, 0, LAKE_BRIDGE);
const tau = Math.PI * 2;
const steps = 42;
export const gardenPath = [];
const ornaments = [];
const speckles = [];

function shoreClear(p, margin) {
  return pondLevel(p) > 1.01 && nearestRiver(p).clearance > margin && !onBridge(p, margin);
}

// The first tangent follows the bridge deck. The far end fades into the pasture.
for (let i = 0; i <= steps; i++) {
  const t = i / steps, u = 1 - t;
  const x = u**3 * landing.x + 3*u*u*t*(-22) + 3*u*t*t*(-12) + t**3*1;
  const z = u**3 * landing.z + 3*u*u*t*21 + 3*u*t*t*6 - t**3;
  const dx = u*u*(-22-landing.x) + 2*u*t*10 + t*t*13;
  const dz = u*u*(21-landing.z) - 2*u*t*15 - t*t*7;
  const length = Math.hypot(dx,dz), nx = -dz/length, nz = dx/length;
  const width = (1.16 + .16*Math.sin(t*13) + random()*.11) * Math.min(1, (1-t)*12);
  const offset = (side) => ({x:x+nx*side, z:z+nz*side});
  gardenPath.push({x,z,left:offset(-width),right:offset(width)});
  for (let k=0; k<4; k++) {
    const pt=offset((random()*2-1)*width);
    speckles.push({...pt,r:.025+random()*.115});
  }
  if (i<3 || i>steps-2) continue;
  for (const side of [-1,1]) {
    // Loose islands and pockets of grass keep the borders from looking like hedges.
    if (Math.sin(i*.48+side*2.3)<-.55) continue;
    for (let row=0; row<2; row++) {
      const size=.68+random()*.61;
      const pt=offset(side*(width+.7+random()*.5+row*1.05));
      if (shoreClear(pt,1) && CONFIG.drinkingSpots.every(s=>Math.hypot(s.x-pt.x,s.z-pt.z)>1.5))
        ornaments.push({...pt,size,kind:'flowers',variant:(Math.floor(i/5)+row+(side+1)*2)%9});
    }
  }
}

for (let i=0; i<51; i++) {
  const a=.46+i*.024+random()*.013;
  if (Math.sin(a*19)<-.47) continue;
  const pt=pondPoint(a,1.009+random()*.023);
  if (!shoreClear(pt,.8) || CONFIG.drinkingSpots.some(s=>Math.hypot(s.x-pt.x,s.z-pt.z)<1.55)) continue;
  ornaments.push({...pt,kind:'stone',size:.47+random()*.92,variant:i%5});
  if(i%5===0) ornaments.push({...pondPoint(a+.014,1.002),kind:'reeds',size:.87+random()*.36,variant:i%4});
}

export function drawGardenPath(c,project,camera) {
  const ground = (p) => [p.x,p.z,.025];
  for (let i=1; i<gardenPath.length; i++) {
    const a=gardenPath[i-1], b=gardenPath[i];
    const quad=clipPondPolygon([a.left,b.left,b.right,a.right].map(ground),camera);
    if (quad.length<3) continue;
    c.beginPath();
    quad.forEach(([x,z,y],j)=>{const p=project(x,z,y);if(p){if(j)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);}});
    c.closePath();c.fillStyle='#d6c295';c.fill();
  }
  for (const [i,pt] of speckles.entries()) {
    const p=project(pt.x,pt.z,.035);
    if (!p || p.s*pt.r<.55 || p.x<0 || p.x>c.canvas.width || p.y<0 || p.y>c.canvas.height) continue;
    c.fillStyle=i%3?'#e9d5ae':'#b5a17c';
    c.beginPath(); c.ellipse(p.x,p.y,p.s*pt.r,p.s*pt.r*.30,0,0,tau);c.fill();
  }
}

const sprites = new Map();
function paint(kind,id) {
  const canvas=document.createElement('canvas');
  canvas.width=168; canvas.height=128;
  const c=canvas.getContext('2d'), rand=generator(8401+id*293);
  function oval(x,y,w,h,a,color){
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,a,0,tau);c.fill();
  }
  function stem(x,y,tx,ty,width,color){
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);
    c.quadraticCurveTo(x+(tx-x)*.42,(y+ty)*.5,tx,ty);c.stroke();
  }
  oval(84,113,58,8,0,'#43593d30');
  if(kind==='flowers'){
    const hues=[['#d69548','#ffd955','#ffe680'],['#c36b79','#ee96a3','#fac1b3'],['#cbc5a4','#fff1ce','#fff9e1']];
    const leaves=['#496a42','#628448','#79964c','#8da45b'];
    for(let i=0;i<115;i++){
      const x=84+(rand()-.5)*127, arc=Math.abs(x-84)/65;
      const y=109-rand()*30*(1-arc*.6), lean=rand()-.5;
      oval(x,y,4+rand()*9,2+rand()*2,lean*2,leaves[i%4]);
    }
    for(let i=0;i<24;i++){
      const x=84+(rand()-.5)*135, y=37+Math.abs(x-84)*.3+rand()*47;
      const root=84+(x-84)*.77, r=2+rand()*3.3,phase=rand()*tau;
      const colors=hues[(id+(i%6===0?1:0))%3];
      stem(root,103,x,y,1.5,'#617d43');
      oval((x+root)/2+3,(y+103)/2,5,2,-.65,'#7e994f');
      for(let j=0;j<7;j++){
        const a=phase+j*tau/7;
        oval(x+Math.cos(a)*r*.87,y+Math.sin(a)*r*.68,r*.77,r*.44,a,colors[j%2+1]);
      }
      oval(x,y,r*.48,r*.35,0,id%3===0?'#9e7636':'#d7a747');
    }
  }else if(kind==='stone'){
    const w=44+rand()*22,h=23+rand()*18;
    const gradient=c.createLinearGradient(66,107-h*1.8,85,117);
    gradient.addColorStop(0,'#e1d7b7');gradient.addColorStop(.47,'#b9b69d');gradient.addColorStop(1,'#848c79');
    c.beginPath();c.moveTo(84-w,107);c.bezierCurveTo(79-w,88,73-w*.4,108-h*1.75,86,108-h*1.75);
    c.bezierCurveTo(96+w*.58,104-h*1.8,91+w,88,84+w,106);
    c.bezierCurveTo(80+w*.55,120,84-w*.8,120,84-w,107);c.fillStyle=gradient;c.fill();
    c.save();c.clip();
    for(let i=0;i<100;i++)oval(84+(rand()-.5)*w*2,118-rand()*h*2,1+rand()*4,1,-.2,i%3?'#fff1c927':'#4c60532b');
    c.restore();
  }else{
    c.lineCap='round';
    for(let i=0;i<23;i++){
      const x=84+(rand()-.5)*91,y=27+rand()*52;
      stem(83+(x-84)*.34,113,x,y,2+rand()*2,i%2?'#5b7850':'#819653');
      if(i%4===0)stem(x,y+9,x-1,y-2,4.8,'#a77a43');
    }
  }
  sprites.set(kind+id,canvas);return canvas;
}

export function addGardenLayers(c,project,layers,w,h) {
  for(const item of ornaments){
    const p=project(item.x,item.z,.03);
    if(!p) continue;
    const width=p.s*item.size*1.9,height=width*128/168;
    if(width<3 || p.x+width*.5<0 || p.x-width*.5>w || p.y-height>h || p.y+height*.12<0) continue;
    layers.push({...item,projected:p,cover:{halfWidth:item.size,above:item.size*1.4,below:item.size*.2},draw(){
      const sprite=sprites.get(item.kind+item.variant)||paint(item.kind,item.variant);
      c.drawImage(sprite,p.x-width*.5,p.y-height*113/128,width,height);
    }});
  }
}
