import {CONFIG, pondPoint, pondLevel, onBridge, nearestRiver, WATERWAYS} from '../game/config.js?v=solid-buildings-2';
import {generator} from '../game/fir-grove.js';
const tau = Math.PI * 2;
const ornaments = [];

function shoreClear(p, margin) {
  return pondLevel(p) > 1.01 && nearestRiver(p).clearance > margin && !onBridge(p, margin);
}

// Each patch spreads over a small oval on the bank, leaving grass between patches.
const bloomRandom = generator(32451);
for (const [angle, scale, count] of [[.58,1.12,7], [1.11,1.15,12], [1.44,1.13,9], [1.67,1.16,5]]) {
  const center = pondPoint(angle,scale);
  for (let i=0; i<count; i++) {
    const theta=bloomRandom()*tau, radius=Math.sqrt(bloomRandom());
    const pt={x:center.x+2.5*radius*Math.cos(theta),z:center.z+1.2*radius*Math.sin(theta)};
    if (!shoreClear(pt,1) || CONFIG.drinkingSpots.some(s=>Math.hypot(s.x-pt.x,s.z-pt.z)<1.7)) continue;
    ornaments.push({...pt,size:.7+bloomRandom()*.4,kind:'flowers',variant:Math.floor(bloomRandom()*9)});
  }
}

// Keep the existing stone and cattail arrangement independent of flower placement.
const random = generator(1485463037);
for (let i=0; i<51; i++) {
  const a=.46+i*.024+random()*.013;
  if (Math.sin(a*19)<-.47) continue;
  const pt=pondPoint(a,1.009+random()*.023);
  if (!shoreClear(pt,.8) || CONFIG.drinkingSpots.some(s=>Math.hypot(s.x-pt.x,s.z-pt.z)<1.55)) continue;
  ornaments.push({...pt,kind:'stone',size:.47+random()*.92,variant:i%5});
  if(i%5===0) ornaments.push({...pondPoint(a+.014,1.002),kind:'reeds',size:.87+random()*.36,variant:i%4});
}

// Round the remaining shoreline in loose groups, leaving both river mouths open.
const bankRandom=generator(903771);
const nest=pondPoint(4.82,1.09);
function addBankItem(pt,kind,size,bank='pond'){
  if(onBridge(pt,2) || Math.hypot(pt.x-nest.x,pt.z-nest.z)<2.4 ||
     CONFIG.drinkingSpots.some(s=>Math.hypot(pt.x-s.x,pt.z-s.z)<2.1)) return;
  const variants={flowers:9,stone:5,reeds:4};
  ornaments.push({...pt,bank,kind,size,variant:Math.floor(bankRandom()*variants[kind])});
}
for(let a=1.78;a<tau+.41;a+=.14+bankRandom()*.12){
  for(let j=0;j<3;j++){
    const angle=a+(bankRandom()-.5)*.10;
    const pt=pondPoint(angle,1.017+bankRandom()*.028);
    if(shoreClear(pt,.75))addBankItem(pt,'stone',.55+bankRandom()*1.05);
  }
  const reeds=pondPoint(a+.038,1.004);
  if(nearestRiver(reeds).clearance>.8)addBankItem(reeds,'reeds',.70+bankRandom()*.63);
  for(let j=0;j<4;j++){
    const pt=pondPoint(a+(bankRandom()-.5)*.15,1.09+bankRandom()*.085);
    if(shoreClear(pt,1))addBankItem(pt,'flowers',.66+bankRandom()*.62);
  }
}

// Scatter small groups with open stretches between them, on alternating banks.
const inlet=WATERWAYS[0].points;
let sinceGroup=0,spacing=4,side=-1;
for(let i=1;i<inlet.length-1;i++){
  const a=inlet[i-1],p=inlet[i],b=inlet[i+1];
  sinceGroup+=Math.hypot(p.x-a.x,p.z-a.z);
  if(sinceGroup<spacing || p.z<19)continue;
  sinceGroup=0;spacing=8+bankRandom()*10;side=-side;
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  const tx=dx/length,tz=dz/length;
  for(const [kind,offset,mass] of [['stone',.35,3],['reeds',.08,2],['flowers',1.5,3]]){
    for(let j=0;j<mass;j++){
      const along=(bankRandom()-.5)*4,across=side*(p.width+offset+bankRandom()*.6);
      const pt={x:p.x+tx*along-tz*across,z:p.z+tz*along+tx*across};
      if(pondLevel(pt)<1.04 || (kind==='flowers' && nearestRiver(pt).clearance<.8))continue;
      addBankItem(pt,kind,.56+bankRandom()*(kind==='stone'?1.0:.58),'inlet');
    }
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

export const gardenStones=ornaments.filter(item=>item.kind==='stone');

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
