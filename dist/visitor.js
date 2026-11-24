import {drawLimb,drawHand,trouserColor} from './render/visitor-limbs.js';
import { currentAppearance } from './game/visitor-appearance.js';
import { drawVisitorHead, drawVisitorClothes } from './render/visitor-look.js';
import {gaitLegs,armSwing} from './game/gait.js';
import {drawMintModel} from './render/mint-model.js';
import {drawMintVisitor} from './render/mint-visitor.js';
import {drawKneelingVisitor} from './render/milk-pose.js?v=limb-light-1';
// World heading is resolved relative to the orbit camera, including while standing.
export function visitorPose(dx=0,dz=1,yaw=0){
 const side=dx*Math.cos(yaw)-dz*Math.sin(yaw),away=dx*Math.sin(yaw)+dz*Math.cos(yaw);
 const sector=(Math.round(Math.atan2(side,-away)/(Math.PI/4))+8)%8;
 return ['front','front-right','right','back-right','back','back-left','left','front-left'][sector];
}
export function drawVisitor(c,p,{time=0,walking=false,seated=false,feeding=false,reaching=false,petting=false,milking=false,lambSize=.33,pose='back',appearance=currentAppearance(),label=true}={}){
 if(appearance.model==='3d' && drawMintModel(c,p,{time,walking,seated,feeding,reaching,petting,milking,lambSize,pose,appearance,label}))return;
 if(appearance.id==='mint' && drawMintVisitor(c,p,{time,walking,seated,feeding,reaching,petting,milking,lambSize,pose,appearance,label}))return;
 pose=pose.split('-')[0];
 if(milking||(petting&&lambSize<.5))return drawKneelingVisitor(c,p,{pose,lambSize,petting,appearance});
 if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
 const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(v,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const rect=(x,y,w,h,r,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const side=pose==='left'||pose==='right',front=pose==='front',torso=seated?-.85:-1.06,swing=armSwing(time,walking);
 ell(0,.03,.48,.13,'#2e482d30');c.save();if(pose==='left')c.scale(-1,1);
 for(const leg of gaitLegs(time,pose,walking,seated)){
   drawLimb(c,[[leg.hip.x,leg.hip.y],[leg.knee.x,leg.knee.y],[leg.ankle.x,leg.ankle.y]],.16,trouserColor);
   ell(leg.ankle.x+(side?.035:0),leg.ankle.y+.025,.14,.06,'#594f3d');
 }
 if(side){
   const wrist=-.12-swing*1.8;
   drawLimb(c,[[-.08,torso-.16],[-.16-swing*.8,torso+.17],[wrist,torso+.37]],.14,appearance.coat);
   drawHand(c,wrist,torso+.39);
 }
 if(side)rect(-.34,torso-.19,.28,.55,.08,'#69816a');
 rect(side?-.21:-.34,torso-.35,side?.46:.68,.77,.11,appearance.coat);
 if(!side&&!front){rect(-.24,torso-.16,.48,.55,.09,'#69816a');line([[-.16,torso-.14],[-.16,torso+.35]],'#839783',.025);line([[.16,torso-.14],[.16,torso+.35]],'#839783',.025);line([[-.16,torso+.12],[.17,torso+.12]],'#506b55',.022);}
 if(front&&appearance.id==='straw'){line([[0,torso-.25],[0,torso+.36]],'#b18d43',.023);for(const y of [-.12,.06,.24])ell(.04,torso+y,.025,.025,'#8d783d');line([[-.29,torso-.28],[-.2,torso+.32]],'#7a8c62',.06);line([[.29,torso-.28],[.2,torso+.32]],'#7a8c62',.06);}
 drawVisitorClothes(c,0,torso,1,pose,appearance);
 if(!side){
   drawLimb(c,[[-.29,torso-.16],[-.43,torso+.15+Math.abs(swing)],[-.39,torso+.37]],.14,appearance.coat);
   drawHand(c,-.39,torso+.39);
 }
 if(!petting){
 const armX=side?.1:.29;
 drawLimb(c,feeding||reaching?[[armX,torso-.14],[.48,torso-.28],[.68,torso-.25]]:[[armX,torso-.16],[side?.14+swing*.8:.44,torso+.17-Math.abs(swing)],[side?.12+swing*1.8:.4,torso+.37]],.14,appearance.coat);
 drawHand(c,feeding||reaching?.7:side?.12+swing*1.8:.4,feeding||reaching?torso-.25:torso+.39);
 }
 drawVisitorHead(c,0,torso-.58,1,pose,appearance);
 if(feeding)for(let i=0;i<10;i++){c.strokeStyle=i%2?'#e0c575':'#ac8d3b';c.lineWidth=.022;c.beginPath();c.moveTo(.67,torso-.27);c.quadraticCurveTo(.65+i*.027,torso-.6,.54+i*.037,torso-.83+(i%3)*.07);c.stroke();}
 c.restore();if(label){rect(-.24,torso-1.25,.48,.26,.06,'#344a38c9');c.fillStyle='#fff8e6';c.textAlign='center';c.font='.16px sans-serif';c.fillText('나',0,torso-1.06);}c.restore();
}
export function drawHammock(c,p,{time=0,occupied=false,sunset=false,appearance=currentAppearance()}={}){
 if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(v,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 ell(0,.05,3.1,.52,'#314d2e1b');
 for(const x of [-3,3]){line([[x,.1],[x+.12,-2],[x+.03,-4.05]],'#857551',.23);line([[x+.08,-2.4],[x+(x>0?.5:-.5),-3.4]],'#857551',.1);for(let i=0;i<13;i++){const angle=i*2.4;ell(x+Math.sin(angle)*.72,-4.1+Math.cos(angle)*.44,.6+(i%3)*.13,.51,sunset?['#82945f','#728654','#96a86e'][i%3]:['#769c56','#63864b','#8ba963'][i%3]);}}
 const sway=Math.sin(time*.8)*(occupied?.055:.025);c.save();c.translate(sway,-.94);
 line([[-3,-1.35],[-2.02,-.7]],'#d2c6a0',.045);line([[3,-1.35],[2.02,-.7]],'#d2c6a0',.045);
 c.beginPath();c.moveTo(-2,-.73);c.bezierCurveTo(-1.2,-.14,1.2,-.14,2,-.73);c.bezierCurveTo(1.35,.62,-1.35,.62,-2,-.73);c.fillStyle='#e4d7b5';c.fill();
 // Woven sage and linen stripes follow the hammock's sag.
 for(let i=0;i<13;i++){const x=-1.7+i*.28,lower=.4*(1-x*x/4);line([[x,-.32*(1-x*x/4)],[x+.07,lower]],i%2?'#8da18a':'#c3bc9b',.09);}
 if(occupied && appearance.id==='mint'){
   c.save();c.translate(.96,-.28);c.rotate(-1.28);
   drawVisitor(c,{x:0,y:0,s:.91},{seated:true,pose:'front-right',appearance,label:false});c.restore();
 }else if(occupied){c.save();c.rotate(-.08);line([[-.65,-.10],[.4,-.05],[1.1,-.25]],appearance.coat,.39);drawLimb(c,[[.42,-.04],[1.1,-.22],[1.46,-.43]],.22,trouserColor);c.save();c.translate(-.60,-.10);c.rotate(-1.22);drawVisitorClothes(c,0,0,.82,'right',appearance);drawVisitorHead(c,0,-.52,.88,'right',appearance);c.restore();drawLimb(c,[[-.40,-.24],[-.15,-.62],[-.82,-.62]],.11,appearance.coat);drawHand(c,-.82,-.62,.075,.065);c.restore();}
 // Front edge and knotted fringe.
 c.beginPath();c.moveTo(-2,-.7);c.bezierCurveTo(-1.4,.66,1.4,.66,2,-.7);c.strokeStyle='#9ba788';c.lineWidth=.07;c.stroke();for(let i=0;i<15;i++){const x=-1.7+i*.24,y=.48*(1-x*x/3);line([[x,y],[x+.04,y+.15]],'#d8c9a3',.025);}
 c.restore();c.fillStyle='#3c543bd9';c.beginPath();c.roundRect(-.88,-2.67,1.76,.36,.08);c.fill();c.fillStyle='#fff7e0';c.font='.17px sans-serif';c.textAlign='center';c.fillText(occupied?'해먹에서 쉬는 중':'나무 그늘의 해먹',0,-2.44);c.restore();
}
