export function drawShelter(c,p,{inside=0,total=0,wet=false,snow=false,night=false,time=0}={}){
  if(!p)return;
  c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  c.fillStyle='#233e292b';c.beginPath();c.ellipse(0,.2,6.7,1.1,0,0,Math.PI*2);c.fill();
  rect(-5.7,-3.5,11.4,3.5,'#cabd97');rect(-5.2,-3.2,10.4,3.2,'#e2d5b0');
  for(let i=-5;i<=5;i++)rect(i,-3.2,.035,3.1,'#bdad894f');
  poly([[-6.4,-3.4],[0,-5.6],[6.4,-3.4]],'#7d6957');
  if(snow)poly([[-6.4,-3.45],[0,-5.65],[6.4,-3.45],[5.8,-3.55],[0,-5.3],[-5.8,-3.5]],'#f6f3e6');
  rect(-1.1,-2.65,2.2,2.7,night?'#736b46':'#59604c');
  if(inside){
    c.fillStyle='#e6dec4';c.beginPath();c.ellipse(-.3,-.5,.5,.3,0,0,Math.PI*2);c.ellipse(.5,-.85,.4,.25,0,0,Math.PI*2);c.fill();
  }
  for(const x of [-3.7,2.7]){rect(x,-2.8,1,1.1,night?'#e8c981':'#828d72');rect(x+.46,-2.8,.07,1.1,'#c6b78e');rect(x,-2.3,1,.07,'#c6b78e');}
  rect(-1.7,-3.9,3.4,.63,'#586c50');c.fillStyle='#f9f2d8';c.textAlign='center';c.font='.36px sans-serif';c.fillText('양들의 축사',0,-3.47);
  if(wet||inside){rect(-2,-6.65,4,.7,'#3b563ee0');c.fillStyle='#fff8df';c.font='.34px sans-serif';c.fillText(`쉬는 양 ${inside} / ${total}`,0,-6.18);}
  c.restore();
}
