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
  if(active.kind==='pet'){
    const hand={
      x:head.x+Math.sin(time*3)*ap.s*a.size*.12,y:head.y-ap.s*a.size*.23
    };
    c.strokeStyle='#d5ae5e';
    c.lineWidth=pp.s*.12;
    c.beginPath();
    c.moveTo(shoulder.x,shoulder.y);
    c.quadraticCurveTo((shoulder.x+hand.x)/2,shoulder.y-.1*pp.s,hand.x,hand.y);
    c.stroke();
    c.fillStyle='#dfba95';
    c.beginPath();
    c.ellipse(hand.x,hand.y,pp.s*.1,pp.s*.065,-.2,0,Math.PI*2);
    c.fill();
  }
  else if(active.kind==='milk'){
    const x=head.x-side*pp.s*.25,y=head.y+ap.s*a.size*.2;
    c.strokeStyle='#d5ae5e';
    c.lineWidth=pp.s*.11;
    c.beginPath();
    c.moveTo(shoulder.x,shoulder.y);
    c.lineTo(x-side*pp.s*.18,y);
    c.stroke();
    c.translate(x,y);
    c.scale(side,1);
    c.rotate(-.25);
    c.fillStyle='#e7efe7';
    c.beginPath();
    c.roundRect(-pp.s*.23,-pp.s*.09,pp.s*.36,pp.s*.19,pp.s*.05);
    c.fill();
    c.fillStyle='#8faeae';
    c.fillRect(pp.s*.08,-pp.s*.1,pp.s*.065,pp.s*.2);
    c.fillStyle='#d8bd8c';
    c.beginPath();
    c.ellipse(pp.s*.18,0,pp.s*.065,pp.s*.04,0,0,Math.PI*2);
    c.fill();
  }
  else if(active.kind==='tug'){
    // A small fold attached to the coat hem, never a long connecting stroke.
    const foldSide=active.tugSide??side,pull=.012+Math.sin(active.time*5)*.012;
    c.translate(pp.x,pp.y);c.scale(pp.s,pp.s);
    c.fillStyle='#d5ae5e';c.beginPath();
    c.moveTo(foldSide*.20,-.72);c.lineTo(foldSide*(.34+pull),-.65);c.lineTo(foldSide*.22,-.57);c.closePath();c.fill();
  }
  c.restore();
}
