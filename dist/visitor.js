import {gaitLegs,armSwing} from './game/gait.js';
import {drawKneelingVisitor} from './render/milk-pose.js?v=side-pet';
// World heading is resolved relative to the orbit camera, including while standing.
export function visitorPose(dx=0,dz=1,yaw=0){
 const side=dx*Math.cos(yaw)-dz*Math.sin(yaw),away=dx*Math.sin(yaw)+dz*Math.cos(yaw);
 return Math.abs(side)>Math.abs(away)*1.15?(side>0?'right':'left'):(away>=0?'back':'front');
}
export function drawVisitor(c,p,{time=0,walking=false,seated=false,feeding=false,reaching=false,petting=false,milking=false,lambSize=.33,pose='back'}={}){
 if(milking||(petting&&lambSize<.5))return drawKneelingVisitor(c,p,{pose,lambSize,petting});
 if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
 const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(v,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const rect=(x,y,w,h,r,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const side=pose==='left'||pose==='right',front=pose==='front',torso=seated?-.85:-1.06,swing=armSwing(time,walking);
 ell(0,.03,.48,.13,'#2e482d30');c.save();if(pose==='left')c.scale(-1,1);
 for(const leg of gaitLegs(time,pose,walking,seated)){
   line([[leg.hip.x,leg.hip.y],[leg.knee.x,leg.knee.y],[leg.ankle.x,leg.ankle.y]],leg.index===0?'#4b624e':'#627d5c',.16);
   ell(leg.ankle.x+(side?.035:0),leg.ankle.y+.025,.14,.06,'#594f3d');
 }
 if(side)rect(-.34,torso-.19,.28,.55,.08,'#69816a');
 rect(side?-.21:-.34,torso-.35,side?.46:.68,.77,.11,'#d5ae5e');
 if(!side&&!front){rect(-.24,torso-.16,.48,.55,.09,'#69816a');line([[-.16,torso-.14],[-.16,torso+.35]],'#839783',.025);line([[.16,torso-.14],[.16,torso+.35]],'#839783',.025);line([[-.16,torso+.12],[.17,torso+.12]],'#506b55',.022);}
 if(front){line([[0,torso-.25],[0,torso+.36]],'#b18d43',.023);for(const y of [-.12,.06,.24])ell(.04,torso+y,.025,.025,'#8d783d');line([[-.29,torso-.28],[-.2,torso+.32]],'#7a8c62',.06);line([[.29,torso-.28],[.2,torso+.32]],'#7a8c62',.06);}
 if(!side)line([[-.29,torso-.16],[-.43,torso+.15+Math.abs(swing)],[-.39,torso+.37]],'#c39c51',.14);
 if(!petting){
 const armX=side?.1:.29;
 line(feeding||reaching?[[armX,torso-.14],[.48,torso-.28],[.68,torso-.25]]:[[armX,torso-.16],[side?.14+swing*.8:.44,torso+.17-Math.abs(swing)],[side?.12+swing*1.8:.4,torso+.37]],'#d9b569',.14);
 ell(feeding||reaching?.7:side?.12+swing*1.8:.4,feeding||reaching?torso-.25:torso+.39,.09,.11,'#d9b393');
 }
 ell(0,torso-.58,.29,.32,'#6d5744');
 if(front){ell(0,torso-.55,.24,.26,'#dfbb96');ell(-.255,torso-.55,.055,.09,'#d0a47f');ell(.255,torso-.55,.055,.09,'#d0a47f');for(const x of [-.09,.09])ell(x,torso-.6,.027,.035,'#3e4134');line([[-.07,torso-.42],[0,torso-.39],[.07,torso-.42]],'#946c50',.018);}
 else if(side){ell(.12,torso-.55,.17,.25,'#dfbb96');ell(.28,torso-.54,.075,.065,'#d9ad88');ell(.19,torso-.61,.026,.033,'#3e4134');ell(-.01,torso-.54,.055,.08,'#cc9c79');}
 else ell(.21,torso-.55,.075,.1,'#d8b699');
 ell(0,torso-.8,.48,.1,'#c6b47d');ell(0,torso-.91,.31,.19,'#e1cea1');line([[-.28,torso-.86],[.28,torso-.86]],'#b29e69',.05);
 if(feeding)for(let i=0;i<10;i++){c.strokeStyle=i%2?'#e0c575':'#ac8d3b';c.lineWidth=.022;c.beginPath();c.moveTo(.67,torso-.27);c.quadraticCurveTo(.65+i*.027,torso-.6,.54+i*.037,torso-.83+(i%3)*.07);c.stroke();}
 c.restore();rect(-.24,torso-1.25,.48,.26,.06,'#344a38c9');c.fillStyle='#fff8e6';c.textAlign='center';c.font='.16px sans-serif';c.fillText('나',0,torso-1.06);c.restore();
}
export function drawHammock(c,p,{time=0,occupied=false,sunset=false}={}){
 if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(v,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 ell(0,.05,3.1,.52,'#314d2e1b');
 for(const x of [-3,3]){line([[x,.1],[x+.12,-2],[x+.03,-4.05]],'#857551',.23);line([[x+.08,-2.4],[x+(x>0?.5:-.5),-3.4]],'#857551',.1);for(let i=0;i<13;i++){const angle=i*2.4;ell(x+Math.sin(angle)*.72,-4.1+Math.cos(angle)*.44,.6+(i%3)*.13,.51,sunset?['#82945f','#728654','#96a86e'][i%3]:['#769c56','#63864b','#8ba963'][i%3]);}}
 const sway=Math.sin(time*.8)*(occupied?.055:.025);c.save();c.translate(sway,-.94);
 line([[-3,-1.35],[-2.02,-.7]],'#d2c6a0',.045);line([[3,-1.35],[2.02,-.7]],'#d2c6a0',.045);
 c.beginPath();c.moveTo(-2,-.73);c.bezierCurveTo(-1.2,-.14,1.2,-.14,2,-.73);c.bezierCurveTo(1.35,.62,-1.35,.62,-2,-.73);c.fillStyle='#e4d7b5';c.fill();
 // Woven sage and linen stripes follow the hammock's sag.
 for(let i=0;i<13;i++){const x=-1.7+i*.28,lower=.4*(1-x*x/4);line([[x,-.32*(1-x*x/4)],[x+.07,lower]],i%2?'#8da18a':'#c3bc9b',.09);}
 if(occupied){c.save();c.rotate(-.08);line([[-.65,-.10],[.4,-.05],[1.1,-.25]],'#d3ac5d',.39);line([[.42,-.04],[1.1,-.22],[1.46,-.43]],'#587256',.22);ell(-1.03,-.26,.28,.25,'#d5b391');ell(-1.1,-.39,.43,.08,'#cbb782');ell(-1.11,-.49,.28,.16,'#e1cfa2');line([[-.40,-.24],[-.15,-.62],[-.82,-.62]],'#c9a35d',.11);c.restore();}
 // Front edge and knotted fringe.
 c.beginPath();c.moveTo(-2,-.7);c.bezierCurveTo(-1.4,.66,1.4,.66,2,-.7);c.strokeStyle='#9ba788';c.lineWidth=.07;c.stroke();for(let i=0;i<15;i++){const x=-1.7+i*.24,y=.48*(1-x*x/3);line([[x,y],[x+.04,y+.15]],'#d8c9a3',.025);}
 c.restore();c.fillStyle='#3c543bd9';c.beginPath();c.roundRect(-.88,-2.67,1.76,.36,.08);c.fill();c.fillStyle='#fff7e0';c.font='.17px sans-serif';c.textAlign='center';c.fillText(occupied?'해먹에서 쉬는 중':'나무 그늘의 해먹',0,-2.44);c.restore();
}
