// Model each straight section as a cylinder lit from the upper left of the screen.
export const trouserColor='#60785b';
export const handColor='#dfbb96';

export function drawLimb(c,points,width,color){
  const transform=c.getTransform();
  const rgb=[1,3,5].map(start=>parseInt(color.slice(start,start+2),16));
  c.lineWidth=width;
  c.lineCap='round';
  for(let i=1;i<points.length;i++){
    const [x,y]=points[i-1],[endX,endY]=points[i];
    const dx=endX-x,dy=endY-y,length=Math.hypot(dx,dy);
    if(!length)continue;
    const nx=-dy/length,ny=dx/length;
    const sx=transform.a*nx+transform.c*ny,sy=transform.b*nx+transform.d*ny;
    const light=(-.8*sx-.6*sy)/(Math.hypot(sx,sy)||1);
    const gradient=c.createLinearGradient(x-nx*width/2,y-ny*width/2,x+nx*width/2,y+ny*width/2);
    for(const t of [-1,-.5,0,.5,1]){
      const tone=.20*light*t+.12*Math.sqrt(1-t*t)-.09;
      const channels=rgb.map(v=>Math.round(v+tone*(tone>0?255-v:v)));
      gradient.addColorStop((t+1)/2,'rgb('+channels.join(',')+')');
    }
    c.strokeStyle=gradient;
    c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();
  }
}

export function drawHand(c,x,y,rx=.09,ry=.11,angle=0){
  c.fillStyle=handColor;
  c.beginPath();c.ellipse(x,y,rx,ry,angle,0,2*Math.PI);c.fill();
}
