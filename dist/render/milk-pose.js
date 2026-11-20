import {currentAppearance} from '../game/visitor-appearance.js';
import {drawVisitorHead,drawVisitorClothes} from './visitor-look.js';
// Shared, fixed-length kneeling pose. The arm never stretches toward a target.
export function milkPose(lambSize=.33){
  const mouthY=-.75*lambSize;
  return {shoulder:{x:.08,y:-.68},elbow:{x:.28,y:-.43},hand:{x:.49,y:mouthY-.015},bottle:{x:.63,y:mouthY},nipple:{x:.82,y:mouthY}};
}
export function drawKneelingVisitor(c,p,{pose='right',lambSize=.33,petting=false,appearance=currentAppearance()}={}){
  if(!p)return;const side=pose==='left'?-1:1,g=milkPose(lambSize);
  c.save();c.translate(p.x,p.y);c.scale(p.s*side,p.s);
  const ell=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const line=(points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  ell(0,.02,.55,.12,'#2e482d30');
  // Folded rear leg and raised knee, with both feet resting on the ground.
  line([[-.13,-.27],[-.34,-.12],[-.10,-.04]],'#4b624e',.18);
  line([[.08,-.29],[.32,-.25],[.34,-.05]],'#627d5c',.18);
  ell(-.12,-.025,.17,.06,'#594f3d');ell(.37,-.025,.18,.06,'#594f3d');
  c.fillStyle='#69816a';c.beginPath();c.roundRect(-.34,-.8,.26,.48,.08);c.fill();
  c.fillStyle=appearance.coat;c.beginPath();c.roundRect(-.21,-.85,.46,.62,.10);c.fill();
  line([[-.16,-.72],[-.14,-.38],[.17,-.29]],appearance.shade,.11);
  drawVisitorClothes(c,0,-.60,.78,'right',appearance);
  drawVisitorHead(c,.05,-1.02,.9,'right',appearance);
  if(!petting){
  line([[g.shoulder.x,g.shoulder.y],[g.elbow.x,g.elbow.y],[g.hand.x,g.hand.y]],appearance.sleeve,.115);
  ell(g.hand.x,g.hand.y,.085,.065,'#dfba95');
  }
  c.restore();
}
export function drawMilkBottle(c,p,{pose='right',lambSize=.33}={}){
  if(!p)return;const side=pose==='left'?-1:1,g=milkPose(lambSize);
  c.save();c.translate(p.x,p.y);c.scale(p.s*side,p.s);c.translate(g.bottle.x,g.bottle.y);
  c.fillStyle='#edf3e8';c.beginPath();c.roundRect(-.18,-.085,.30,.17,.045);c.fill();
  c.fillStyle='#8faeae';c.fillRect(.10,-.09,.055,.18);
  c.fillStyle='#d8bd8c';c.beginPath();c.ellipse(.19,0,.06,.035,0,0,Math.PI*2);c.fill();c.restore();
}
