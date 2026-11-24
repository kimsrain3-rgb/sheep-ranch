// Hand-drawn whitecoat pup. Foreshorten its length as it turns towards
// the camera; the nearer head or hind flippers cover the body in turn.
export function drawHarpSeal(c,p,pup,yaw,time){
  const bearing=pup.bearing-yaw,side=Math.sin(bearing),away=Math.cos(bearing);
  const front=(1-away)/2,span=Math.abs(side);
  const push=pup.moving?Math.sin(pup.stride):0;
  const lift=.035*push+.009*Math.sin(time*2.2);
  c.save();c.translate(p.x,p.y);c.scale(p.s*(side<0?-1:1),p.s);
  function oval(x,y,rx,ry,angle,fill,outline){
    c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);
    c.fillStyle=fill;c.fill();
    if(outline){c.strokeStyle=outline;c.lineWidth=.012;c.stroke();}
  }
  function stroke(x,y,mx,my,ex,ey,color,width){
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(mx,my,ex,ey);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();
  }
  oval(0,-.005,.43+.30*span,.105,0,'#5a828747');
  const hx=.47*span,hy=-.44+.055*front-lift;
  function hind(){
    for(const k of [-1,1]){
      oval(-.55*span-.045+k*(1-span)*.095,-.10-.06*away+k*.023,
        .13+.085*span,.060,.20+k*.36+push*.13,'#b7c8c9','#819c9e');
    }
  }
  function head(){
    oval(hx,hy,.247,.222,-.06,'#f6f2db','#9aa9a4');
    oval(hx-.103,hy-.156,.093,.041,-.22,'#fcf8e8');
    if(away>.84)return;
    const muzzle=hx+.105*span, eyeY=hy-.028;
    for(const k of [-1,1]){
      if(k===1&&span>.76)continue;
      const ex=muzzle+k*(.112-.041*span);
      oval(ex,eyeY,.029,.039,-k*.13,'#27373a');
      oval(ex-.007,eyeY-.013,.008,.009,0,'#fefbf2');
    }
    oval(muzzle,hy+.065,.113,.077,0,'#e3dfcb');
    oval(muzzle+.018*span,hy+.035,.039,.023,-.04,'#38444a');
    stroke(muzzle+.018*span,hy+.05,muzzle+.014,hy+.087,muzzle-.035,hy+.081,'#727b78',.01);
    for(const k of [-1,1])for(let j=0;j<2;j++){
      stroke(muzzle+k*.060,hy+.072+j*.023,muzzle+k*.12,hy+.049+j*.02,muzzle+k*.161,hy+.055+j*.033,'#86918e',.007);
    }
  }
  if(away>0)head();else hind();
  const bodyY=-.238-lift*.55,bodyW=.34+.29*span;
  oval(-.043*span,bodyY,bodyW,.226,-.06*span,'#dcded1','#94a6a4');
  oval(-.038*span,bodyY-.046,bodyW*.91,.164,-.07*span,'#eeedda');
  for(let j=0;j<5;j++){
    const x=(j-2)*.093-.08;
    stroke(x,bodyY-.083+(j%2)*.033,x+.018,bodyY-.096+(j%2)*.033,x+.044,bodyY-.085+(j%2)*.033,'#d7dbce',.012);
  }
  if(away>0)hind();
  oval(.11*span-.19*(1-span),-.095,.14,.062,-.53+push*.19,'#ccd3c8','#93a5a1');
  if(span<.7)oval(.11*span+.22*(1-span),-.102,.115,.054,.50-push*.18,'#d4d9ce','#93a5a1');
  if(away<=0)head();
  c.restore();
}
