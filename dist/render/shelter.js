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

export function drawCoop(c,p,{inside=0,total=10,snow=false,night=false}={}){
  if(!p)return null;
  c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  c.fillStyle='#223d292b';c.beginPath();c.ellipse(0,.15,4.9,.85,0,0,Math.PI*2);c.fill();
  rect(-4,-3.8,8,3.8,'#b99a6c');rect(-3.7,-3.55,7.4,3.55,'#d7ba85');
  for(let x=-3.5;x<3.8;x+=.8)rect(x,-3.5,.055,3.5,'#9b795657');
  poly([[-4.5,-3.8],[0,-6.3],[4.5,-3.8]],'#775b47');
  if(snow)poly([[-4.5,-3.82],[0,-6.35],[4.5,-3.82],[4,-3.9],[0,-6],[-4,-3.9]],'#f6f2e5');
  rect(-1.1,-2.5,2.2,2.5,'#66503b');rect(-.9,-2.3,1.8,2.3,night?'#ab824e':'#8b7046');
  rect(-3.15,-2.9,1.3,1.3,night?'#efce85':'#93a18a');rect(1.85,-2.9,1.3,1.3,night?'#efce85':'#93a18a');
  for(const x of [-2.5,2.5]){rect(x-.035,-2.9,.07,1.3,'#705d44');rect(x-.65,-2.3,1.3,.07,'#705d44');}
  if(inside){c.fillStyle='#f2e5c8';for(let i=0;i<Math.min(inside,3);i++){c.beginPath();c.ellipse(-.5+i*.48,-.43, .18,.15,0,0,Math.PI*2);c.fill();}}
  rect(-2,-4.8,4,.65,'#546543');c.fillStyle='#fff5dc';c.textAlign='center';c.font='.48px sans-serif';c.fillText('닭장',0,-4.35);
  rect(-2.3,-7.45,4.6,.7,'#36533de0');c.font='.37px sans-serif';c.fillText(`쉬는 닭 ${inside} / ${total}`,0,-6.97);
  c.restore();return {x:p.x,y:p.y,w:p.s*9,h:p.s*7.5};
}
