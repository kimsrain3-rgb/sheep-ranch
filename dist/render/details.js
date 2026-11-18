import {
  CONFIG,seededRandom,pondLevel,inRiver,onBridge
} from '../game/config.js?v=solid-buildings-2';
export function makeVegetation(){
  const random=seededRandom(4528),out=[];
  for(let i=0;i<2700;i++){
    const patch=i%18,a=patch*2.4,r=6+(patch%6)*8,center={
      x:Math.sin(a)*r*(patch>12?2.2:1),z:Math.cos(a)*r*(patch>12?2.2:1)+8
    };
    const x=center.x+(random()-.5)*16,z=center.z+(random()-.5)*15,p=CONFIG.pond;
    if(pondLevel({x,z})<1.15||inRiver({x,z},1)||onBridge({x,z},.6)||Math.abs(x-5)<2)continue;
    out.push({
      x,z,h:.12+random()*.25,p:random()*7,flower:random()<.24,color:Math.floor(random()*3)
    });
  }
  return out;
}
export function drawVegetation(c,items,project,time,W,H){
  for(const g of items){
    const p=project(g.x,g.z);
    if(!p||p.s<2||p.x<-10||p.x>W+10||p.y<0||p.y>H+20)continue;
    const h=g.h*p.s,wind=Math.sin(time*1.4+g.p)*h*.25;
    c.strokeStyle=g.flower?'#638347':'#789c5377';
    c.lineWidth=Math.max(.65,p.s*.018);
    c.beginPath();
    c.moveTo(p.x,p.y);
    c.quadraticCurveTo(p.x+wind,p.y-h*.6,p.x+wind,p.y-h);
    c.stroke();
    if(g.flower&&p.s>6){
      const r=Math.min(3.6,Math.max(1.1,p.s*.055)),x=p.x+wind,y=p.y-h;
      c.fillStyle=['#f1ead1','#ddc778','#d0b7c5'][g.color];
      for(let j=0;j<5;j++){
        c.beginPath();
        c.ellipse(x+Math.cos(j*1.257)*r,y+Math.sin(j*1.257)*r,r*.65,r*.65,0,0,Math.PI*2);
        c.fill();
      }
    }
  }
}
export function drawHayPile(c,p,pile){
  if(!p||pile.portions<=0)return;
  c.save();
  c.translate(p.x,p.y);
  c.scale(p.s,p.s);
  const r=.35+pile.portions*.04;
  c.fillStyle='#b49d57';
  c.beginPath();
  c.ellipse(0,0,r,.17,0,0,Math.PI*2);
  c.fill();
  for(let i=0;i<32;i++){
    c.strokeStyle=i%2?'#e1c97d':'#b79a48';
    c.lineWidth=.025;
    c.beginPath();
    c.moveTo(Math.sin(i*4)*r,-Math.abs(Math.cos(i*3))*.16);
    c.lineTo(Math.cos(i*2)*r,-.08-Math.abs(Math.sin(i*3))*.25);
    c.stroke();
  }
  c.restore();
}
export function drawRipples(c,p,time){
  if(!p)return;
  c.save();
  c.strokeStyle='#e8f0d6aa';
  c.lineWidth=1;
  for(let i=0;i<3;i++){
    const r=((time*.5+i*.33)%1);
    c.globalAlpha=1-r;
    c.beginPath();
    c.ellipse(p.x,p.y,r*p.s*.55,r*p.s*.12,0,0,Math.PI*2);
    c.stroke();
  }
  c.restore();
}
