export function drawShelter(c,p,{inside=0,total=0,wet=false,snow=false,night=false,time=0}={}){
  if(!p)return null;
  c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  c.fillStyle='#233e292b';c.beginPath();c.ellipse(0,.2,11,1.3,0,0,Math.PI*2);c.fill();
  rect(-9.8,-4.8,19.6,4.8,'#cabd97');rect(-9.3,-4.5,18.6,4.5,'#e2d5b0');
  for(let i=-9;i<=9;i++)rect(i,-4.5,.035,4.4,'#bdad894f');
  poly([[-10.6,-4.7],[0,-8],[10.6,-4.7]],'#7d6957');
  if(snow)poly([[-10.6,-4.75],[0,-8.05],[10.6,-4.75],[9.8,-4.85],[0,-7.7],[-9.8,-4.85]],'#f6f3e6');
  rect(-1.7,-3.7,3.4,3.8,night?'#8b774a':'#59604c');rect(-1.5,-3.5,3,3.5,'#766343');
  if(inside){c.fillStyle='#e6dec4';c.beginPath();c.ellipse(-.5,-.6,.6,.4,0,0,Math.PI*2);c.ellipse(.6,-1,.5,.3,0,0,Math.PI*2);c.fill();}
  for(const x of [-7,-4.5,3.2,5.8]){rect(x,-3.6,1.4,1.5,night?'#f0d498':'#91a287');rect(x+.65,-3.6,.08,1.5,'#b9a67b');rect(x,-2.9,1.4,.08,'#b9a67b');}
  rect(-2.5,-5.6,5,.8,'#586c50');c.fillStyle='#f9f2d8';c.textAlign='center';c.font='.48px sans-serif';c.fillText('큰 양들의 축사',0,-5.03);
  rect(-2.8,-9.2,5.6,.8,'#3b563ee0');c.fillStyle='#fff8df';c.font='.4px sans-serif';c.fillText(`쉬는 양 ${inside} / ${total}`,0,-8.65);
  rect(-2.1,.15,4.2,.56,'#f1e7c9');c.fillStyle='#5d684b';c.font='.3px sans-serif';c.fillText('눌러서 들어가기',0,.54);
  c.restore();return {x:p.x,y:p.y,w:p.s*21.2,h:p.s*9.3};
}
