// Origin is the middle of the head. Side views face right in local coordinates.
export function drawVisitorHead(c, x, y, scale, pose, look) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  const oval = (x,y,rx,ry,color) => {
    c.beginPath(); c.ellipse(x,y,rx,ry,0,0,2*Math.PI); c.fillStyle=color; c.fill();
  };
  const stroke = (points,color,width) => {
    c.beginPath(); c.strokeStyle=color; c.lineWidth=width; c.lineCap='round';
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.stroke();
  };
  const glasses = (x,y) => {
    c.beginPath(); c.ellipse(x,y,.082,.067,0,0,2*Math.PI);
    c.lineWidth=.017; c.strokeStyle='#49483e'; c.stroke();
  };
  const side=pose==='right'||pose==='left', back=pose==='back';
  const hair=look.hairColor, skin='#dfbb96';
  if(look.id==='bun') {
    oval(side?-.29:back?.06:.25,-.11,.15,.15,hair);
    oval(side?-.23:back?.02:.21,-.1,.04,.09,look.shade);
  }
  oval(0,0,.29,.32,hair);
  if(!back) {
    if(side) {
      oval(.12,.03,.17,.25,skin); oval(.28,.04,.075,.065,'#d9ad88');
      oval(.19,-.03,.026,.033,'#3e4134'); oval(-.01,.04,.055,.08,'#cc9c79');
    } else {
      for(const x of [-.25,.25]) oval(x,.03,.055,.09,'#d0a47f');
      oval(0,.03,.24,.26,skin);
      for(const x of [-.09,.09]) oval(x,-.02,.027,.035,'#3e4134');
      stroke([[-.07,.16],[0,.19],[.07,.16]],'#946c50',.018);
    }
  } else oval(.23,.04,.06,.085,'#d8b699');
  if(look.id==='straw') {
    oval(0,-.22,.48,.10,'#c6b47d'); oval(0,-.33,.31,.19,'#e1cea1');
    stroke([[-.28,-.28],[.28,-.28]],'#b29e69',.05);
  } else if(look.id==='curls') {
    for(const [cx,cy,r] of [[-.22,-.12,.11],[-.18,-.23,.12],[-.05,-.28,.12],[.09,-.27,.12],[.2,-.19,.1]])
      oval(cx,cy,r,r,hair);
  } else {
    oval(side?.03:-.07,-.19,.21,.09,hair);
    if(look.id==='glasses'&&!back) {
      if(side) { glasses(.21,-.025); stroke([[.13,-.04],[.015,-.06]],'#49483e',.018); }
      else { for(const x of [-.105,.105]) glasses(x,-.018); stroke([[-.025,-.02],[.025,-.02]],'#49483e',.018); }
    }
  }
  c.restore();
}

export function drawVisitorClothes(c,x,y,scale,pose,look) {
  if(pose==='back'||look.id==='straw') return;
  const side=pose!=='front';
  c.save(); c.translate(x,y); c.scale(scale,scale);
  const patch=(points,color)=>{
    c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath(); c.fillStyle=color; c.fill();
  };
  if(look.id==='glasses') {
    patch(side?[[.11,-.32],[.22,-.32],[.17,.32],[.11,.32]]:[[-.14,-.32],[.14,-.32],[0,.04]],'#e7debf');
  } else if(look.id==='bun') {
    c.strokeStyle=look.shade; c.lineWidth=.055;
    for(const x of (side?[.16]:[-.18,.18])){
      c.beginPath(); c.moveTo(x,-.32); c.lineTo(x*.8,-.06); c.stroke();
    }
    c.fillStyle=look.shade; c.fillRect(side?.02:-.21,-.07,side?.19:.42,.43);
  } else {
    patch([[-.2,-.32],[.22,-.32],[.11,-.18],[.16,-.03],[0,-.14]],'#eedbb2');
  }
  c.restore();
}
