import {currentAppearance} from '../game/visitor-appearance.js';
import {petArmPose} from './pet-pose.js?v=soft-elbow-5';
import {drawMilkBottle} from './milk-pose.js?v=visitor-look-1';
export function drawInteraction(c,controller,player,project,time){
  const active=controller.active,pp=project(player.x,player.z);
  if(!pp)return;
  if(controller.carrying){
    c.save();
    c.translate(pp.x+pp.s*.3,pp.y-pp.s*.9);
    c.rotate(-.3);
    for(let i=0;i<22;i++){
      c.strokeStyle=i%2?'#dfc277':'#ac8d44';
      c.lineWidth=Math.max(1,pp.s*.028);
      c.beginPath();
      c.moveTo(-pp.s*.3+i*pp.s*.025,0);
      c.lineTo(-pp.s*.25+i*pp.s*.025,-pp.s*(.4+i%3*.07));
      c.stroke();
    }
    c.restore();
  }
  if(!active||active.phase!=='playing')return;
  const a=active.animal,ap=project(a.x,a.z);
  if(!ap)return;
  const head={
    x:ap.x+(a.headX||0)*ap.s*a.size,y:ap.y+(a.headY||-1.05)*ap.s*a.size
  };
  const side=head.x>=pp.x?1:-1;
  const shoulder={
    x:pp.x+side*pp.s*.25,y:pp.y-pp.s*1.18
  };
  c.save();
  c.lineCap='round';
  c.lineJoin='round';
  if(active.kind==='pet'){
    const arm=petArmPose(pp,ap,a,time);
    c.strokeStyle=currentAppearance().sleeve;c.lineWidth=pp.s*.12;
    c.beginPath();c.moveTo(arm.shoulder.x,arm.shoulder.y);c.lineTo(arm.elbow.x,arm.elbow.y);c.lineTo(arm.hand.x,arm.hand.y);c.stroke();
    c.fillStyle='#dfba95';c.beginPath();c.ellipse(arm.hand.x,arm.hand.y,pp.s*.09,pp.s*.065,arm.wristAngle,0,Math.PI*2);c.fill();
  }
  else if(active.kind==='milk'){
    drawMilkBottle(c,pp,{pose:side>0?'right':'left',lambSize:a.size});
  }
  else if(active.kind==='tug'){
    // A small fold attached to the coat hem, never a long connecting stroke.
    const foldSide=active.tugSide??side,pull=.012+Math.sin(active.time*5)*.012;
    c.translate(pp.x,pp.y);c.scale(pp.s,pp.s);
    c.fillStyle=currentAppearance().coat;c.beginPath();
    c.moveTo(foldSide*.20,-.72);c.lineTo(foldSide*(.34+pull),-.65);c.lineTo(foldSide*.22,-.57);c.closePath();c.fill();
  }
  c.restore();
}
