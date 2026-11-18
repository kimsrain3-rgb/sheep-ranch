import {gaitLegs,armSwing} from '../game/gait.js';
import {visitorPose} from '../visitor.js?v=night-barn';
export function drawShepherdBoy(c,p,boy,yaw=0){
  boy.screen=null;if(!p)return;
  const size=p.s*.94;
  boy.screen={x:p.x,y:p.y,w:size*1.3,h:size*2.2};
  const pose=visitorPose(boy.headingX,boy.headingZ,yaw),side=pose==='left'||pose==='right',back=pose==='back';
  const date=new Date(),festive=date.getMonth()===11&&date.getDate()>=20&&date.getDate()<=26;
  const t=boy.time,swing=armSwing(t,boy.walking),waving=boy.state==='greet';
  c.save();c.translate(p.x,p.y);c.scale(size,size);
  const ell=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const line=(points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const rect=(x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
  ell(0,.02,.43,.12,'#29432d2b');
  c.save();if(pose==='left')c.scale(-1,1);
  const gripX=side?-.36:-.42;
  // Short wooden crook sits in the free hand, including while the other waves.
  c.save();c.translate(gripX,-.67);c.rotate(boy.walking?Math.sin(t*4)*.025:0);
  c.strokeStyle='#805b3b';c.lineWidth=.055;c.lineCap='round';c.beginPath();
  c.moveTo(-.05,.68);c.lineTo(.02,-.75);
  c.quadraticCurveTo(.02,-.94,-.13,-.91);c.quadraticCurveTo(-.28,-.87,-.2,-.73);c.stroke();
  c.strokeStyle='#b18b56';c.lineWidth=.018;c.beginPath();c.moveTo(-.035,.63);c.lineTo(.033,-.72);c.stroke();c.restore();
  // Reuse the tested forward-bending gait with shorter child-sized legs.
  for(const leg of gaitLegs(t,pose,boy.walking)){
    line([[leg.hip.x,leg.hip.y*.77],[leg.knee.x,leg.knee.y*.77],[leg.ankle.x,leg.ankle.y*.77]],leg.index?'#4e7776':'#396362',.145);
    ell(leg.ankle.x+.035,leg.ankle.y*.77+.015,.14,.07,'#705344');
  }
  if(side)rect(-.36,-1.03,.22,.4,.06,'#a68b5b');
  rect(side?-.23:-.32,-1.23,side?.48:.64,.63,.14,festive?'#b63130':'#eee1b3');
  rect(side?-.23:-.32,-.98,side?.48:.64,.49,.09,festive?'#b63130':'#598783');
  if(!side){
    line([[-.23,-1.19],[-.2,-.74]],festive?'#b63130':'#598783',.085);line([[.23,-1.19],[.2,-.74]],festive?'#b63130':'#598783',.085);
    if(!back){rect(-.16,-.97,.32,.23,.045,festive?'#f5ead4':'#709b91');for(const x of [-.21,.21])ell(x,-1.02,.035,.035,'#d6be76');}
    else{rect(-.26,-1.08,.52,.43,.09,'#b69865');line([[-.22,-.93],[.22,-.93]],'#8e744d',.035);}
  }
  // Sleeves and fixed-length arms; a small greeting stays near the head.
  const left=side?-.17:-.3;
  line([[left,-1.13],[gripX+.015,-.89],[gripX,-.67]],festive?'#b63130':'#e8d8a3',.14);ell(gripX,-.67,.075,.085,'#e2b38d');
  const shoulder=side?.14:.3;
  if(waving){
    line([[shoulder,-1.12],[.47,-1.32],[.48+Math.sin(t*5)*.045,-1.6]],festive?'#b63130':'#eadca9',.14);
    ell(.48+Math.sin(t*5)*.045,-1.63,.085,.1,'#e7bc96');
  }else{
    line([[shoulder,-1.12],[shoulder+.08+swing,-.88],[shoulder+swing*1.5,-.66]],festive?'#b63130':'#eadca9',.14);ell(shoulder+swing*1.5,-.64,.075,.085,'#e7bc96');
  }
  // Round cheeks, short fringe, small smile and a floppy straw hat.
  ell(0,-1.47,.33,.34,'#5b4436');
  if(!back){
    ell(side?.08:0,-1.43,side?.24:.30,.29,'#efc8a0');
    if(side){ell(.3,-1.44,.06,.055,'#e5b58d');ell(.16,-1.50,.027,.039,'#344238');ell(.18,-1.37,.065,.032,'#dfa28c');}
    else{
      for(const x of [-.115,.115]){ell(x,-1.49,.032,.045,'#344238');ell(x-.008,-1.505,.01,.012,'#fff8e5');ell(x*1.7,-1.35,.065,.032,'#dfa28c');}
      line([[-.065,-1.31],[0,-1.28],[.065,-1.31]],'#a66f58',.021);
      for(const [x,y] of [[-.2,-1.67],[-.08,-1.69],[.04,-1.69],[.16,-1.67]])ell(x,y,.105,.11,'#5b4436');
    }
    ell(side?-.13:-.31,-1.43,.055,.075,'#e3b48d');
    if(!side)ell(.31,-1.43,.055,.075,'#e3b48d');
  }
  if(festive){c.fillStyle='#bb3232';c.beginPath();c.moveTo(-.32,-1.78);c.lineTo(.02,-2.16);c.quadraticCurveTo(.28,-2.18,.4,-1.94);c.lineTo(.26,-1.77);c.closePath();c.fill();ell(0,-1.78,.36,.075,'#f9f1dd');ell(.4,-1.95,.08,.08,'#f9f1dd');}
  else{ell(0,-1.76,.47,.085,'#c9b37a');ell(-.015,-1.88,.31,.19,'#e4d09b');
  line([[-.29,-1.8],[.27,-1.8]],'#9a704b',.045);
  // A tiny leaf tucked into the hat helps distinguish him from the visitor.
  line([[.23,-1.83],[.35,-2.02]],'#6a8051',.022);ell(.32,-1.98,.07,.032,'#8c9c5b');}
  c.restore();
  rect(-.38,-2.36,.76,.25,.07,'#526b4de0');c.fillStyle='#fff7dc';c.font='.15px sans-serif';c.textAlign='center';c.fillText('목동',0,-2.18);
  c.restore();
}
