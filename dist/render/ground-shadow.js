// A reusable soft contact patch, projected onto the local ground plane.
let patch;
function shadowPatch(){
  if(patch)return patch;
  patch=document.createElement('canvas');
  patch.width=patch.height=96;
  const ctx=patch.getContext('2d'),ink=ctx.createRadialGradient(48,48,0,48,48,48);
  ink.addColorStop(0,'rgba(34,49,37,.42)');
  ink.addColorStop(.54,'rgba(34,49,37,.29)');
  ink.addColorStop(1,'rgba(34,49,37,0)');
  ctx.fillStyle=ink;
  ctx.fillRect(0,0,96,96);
  return patch;
}

export function drawGroundShadow(c,layer,project,basis,w,h){
  const radius=layer.shadowRadius;
  const p=layer.projected??project(layer.x,layer.z,0);
  if(!p)return;
  const extent=p.s*radius;
  if(extent<.8 || p.x+extent*2<0 || p.x-extent*2>w ||
     p.y+extent*2<0 || p.y-extent*2>h)return;

  // Sample across and along the view on the actual hillside. Keep even a
  // distant patch readable in the same illustrated style as the sheep.
  const right=project(layer.x+basis.cy*radius,layer.z-basis.sy*radius,0);
  const far=project(layer.x+basis.sy*radius,layer.z+basis.cy*radius,0);
  if(!right||!far)return;
  c.save();
  c.globalAlpha*=layer.shadowOpacity??1;
  c.transform(right.x-p.x,right.y-p.y,far.x-p.x,
    Math.min(-extent*.12,far.y-p.y),p.x,p.y);
  c.drawImage(shadowPatch(),-1,-1,2,2);
  c.restore();
}
