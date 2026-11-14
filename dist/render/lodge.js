import {CONFIG} from '../game/config.js?v=shepherd-lodge';

export function drawLodge(c,p,{night=false,snow=false,occupants=0}={}){
  if(!p)return null;
  c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  c.fillStyle='#223d292d';c.beginPath();c.ellipse(0,.2,7.2,1,0,0,Math.PI*2);c.fill();
  rect(-5.7,-8.4,11.4,8.4,'#c0a078');
  rect(-5.35,-8.1,10.7,7.9,'#ead5aa');
  for(let x=-5.1;x<5.4;x+=.8)rect(x,-8.1,.07,7.9,'#b78e604d');
  rect(-6.2,-5.1,12.4,.35,'#735c42');
  rect(-6.2,-9.2,12.4,.38,'#735c42');
  poly([[-6.5,-9.2],[0,-12.2],[6.5,-9.2]],'#725d4a');
  if(snow)poly([[-6.5,-9.25],[0,-12.25],[6.5,-9.25],[5.9,-9.32],[0,-11.9],[-5.9,-9.32]],'#f7f3e9');
  rect(-1.25,-3.9,2.5,3.9,'#6f563d');
  rect(-1,-3.65,2,3.65,'#92724f');
  rect(.68,-2,.18,.18,'#efcf80');
  for(const x of [-4.5,2.7]){
    rect(x,-7.7,1.8,1.7,night?'#f7d98d':'#9ebfbe');
    rect(x+.84,-7.7,.11,1.7,'#f5e7c5');rect(x,-6.91,1.8,.11,'#f5e7c5');
  }
  for(const x of [-4.5,2.7]){
    rect(x,-3.6,1.8,1.5,night?'#f7d98d':'#9ebfbe');
    rect(x+.84,-3.6,.11,1.5,'#f5e7c5');
  }
  rect(-6.4,-5.3,12.8,.22,'#513f32');
  for(const x of [-5.8,-2.8,.2,3.2,5.6])rect(x,-5.3,.15,1.05,'#735840');
  rect(-3,-10.4,6,.7,'#385643');
  c.fillStyle='#fff6dc';c.textAlign='center';c.font='.48px sans-serif';c.fillText('목동과 강아지의 집',0,-9.91);
  rect(-4.2,-13.35,8.4,.7,'#355443e8');
  c.fillStyle='#fff9e7';c.font='.41px sans-serif';c.fillText('2층 전망대 · 함께 쉬는 곳',0,-12.86);
  if(occupants){c.fillStyle='#46694e';c.font='.43px sans-serif';c.fillText(`쉬는 친구 ${occupants}`,0,.65);}
  c.restore();
  return {x:p.x,y:p.y,w:p.s*13,h:p.s*13.5};
}

// A live, elevated view from the lodge balcony. Animal positions come from the
// same simulation as the meadow; no separate decorative flock is invented.
export function drawLodgePanorama(c,width,height,{sheep=[],chickens=[],dogs=[],shepherd=null,night=false}={}){
  const scale=Math.min(globalThis.devicePixelRatio||1,2);
  const pixelWidth=Math.max(1,Math.round(width*scale)),pixelHeight=Math.max(1,Math.round(height*scale));
  if(c.canvas.width!==pixelWidth||c.canvas.height!==pixelHeight){c.canvas.width=pixelWidth;c.canvas.height=pixelHeight;}
  c.setTransform(scale,0,0,scale,0,0);
  const sky=c.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,night?'#223848':'#9bc2b8');
  sky.addColorStop(.62,night?'#536875':'#e9d9ae');
  sky.addColorStop(1,night?'#44583e':'#89a86b');
  c.fillStyle=sky;c.fillRect(0,0,width,height);
  const horizon=height*.37;
  c.fillStyle=night?'#526d54':'#92ad7b';
  c.beginPath();c.moveTo(0,horizon+18);c.quadraticCurveTo(width*.24,horizon-35,width*.48,horizon+6);c.quadraticCurveTo(width*.72,horizon+38,width,horizon-10);c.lineTo(width,height);c.lineTo(0,height);c.fill();
  c.fillStyle=night?'#3b6344':'#7da15b';c.fillRect(0,horizon+35,width,height-horizon);
  // North is at the top. The balcony looks south across the sheep field.
  const point=(x,z)=>({x:width*.5+(x-CONFIG.lodge.x)*width/125,y:horizon+43+(CONFIG.lodge.z-z)*(height-horizon-55)/100});
  const house=(position,w,h,fill,label)=>{
    const p=point(position.x,position.z);
    c.fillStyle='#30452f48';c.beginPath();c.ellipse(p.x,p.y+3,w*.58,h*.18,0,0,Math.PI*2);c.fill();
    c.fillStyle=fill;c.fillRect(p.x-w/2,p.y-h,w,h);
    c.fillStyle='#715945';c.beginPath();c.moveTo(p.x-w*.65,p.y-h);c.lineTo(p.x,p.y-h-h*.48);c.lineTo(p.x+w*.65,p.y-h);c.fill();
    c.fillStyle=night?'#fff1c8':'#324933';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(label,p.x,p.y+17);
  };
  house(CONFIG.barn,Math.max(28,width*.075),Math.max(20,height*.13),'#d9c6a0','축사');
  house(CONFIG.coop,Math.max(17,width*.04),Math.max(14,height*.08),'#cfab7d','닭장');
  const dot=(a,r,color)=>{const p=point(a.x,a.z);if(p.x<4||p.x>width-4||p.y<horizon+6||p.y>height-28)return;c.fillStyle=color;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();};
  for(const a of sheep)if(!a.hiddenInBarn)dot(a,a.isLamb?2.2:3.3,'#fff7e7');
  for(const a of chickens)if(!a.hiddenInCoop)dot(a,2,'#e7ba63');
  for(const a of dogs)if(!a.hiddenInLodge)dot(a,3.3,'#a16b43');
  if(shepherd&&!shepherd.insideLodge)dot(shepherd,3.8,'#355b72');
  c.fillStyle='#594333';c.fillRect(0,height-28,width,28);
  for(let x=12;x<width;x+=48)c.fillRect(x,height-56,6,28);
  c.fillStyle='#fbf5df';c.font='12px sans-serif';c.textAlign='left';
  c.fillText('2층 발코니 · 목장 전망',14,23);
}
