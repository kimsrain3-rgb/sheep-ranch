export function drawSheep(c,a,{
  project,time:t,width:W,height:H,player,feeding=false
}){
  const ellipse=(x,y,rx,ry,color)=>{
    c.fillStyle=color;
    c.beginPath();
    c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    c.fill();
  };
  const resting=a.state==='sleep',happy=a.state==='pet'||a.state==='milk';
  const p=project(a.x,a.z);
  a.screen=null;
  if(!p||p.x<-250||p.x>W+250||p.y>H+300)return;
  const s=p.s*a.size;
  a.screen={
    x:p.x,y:p.y,w:s*2.5,h:s*1.9
  };
  c.save();
  c.translate(p.x,p.y);
  c.scale(s,s);
  const step=a.walking?Math.sin(t*8+a.phase)*.10:0;
  const chew=a.bite>0?Math.sin(t*18)*.035:0;
  ellipse(0,.01,1,.19,'#253c292e');if(a.isLamb&&(a.state==='milk'||a.state==='nursing'))ellipse(-.94+Math.sin(t*10)*.07,-.85,.15,.085,'#f6efda');
  if(resting)c.translate(0,.43);
  if(a.state==='nursing')c.rotate(Math.sin(t*5)*.018);
  // Four jointed legs, soft hoof highlights, fleece silhouette and individual curls.
  for(let i=0;i<4;i++){
    if(resting){
      ellipse((i-1.5)*.34,-.4,.16,.075,'#6a6451');
      continue;
    }
    let x=[-.55,-.32,.35,.6][i],yy=-.12+(i%2)*.05;
    const dx=step*(i%2?-1:1);
    c.strokeStyle=i%2?'#766d59':'#5d594c';
    c.lineWidth=.105;
    c.lineCap='round';
    c.beginPath();
    c.moveTo(x,-.61);
    c.lineTo(x+dx,-.3);
    c.lineTo(x-dx,yy);
    c.stroke();
    ellipse(x-dx,yy,.10,.052,'#484b43');
  }
  const wool=c.createRadialGradient(-.3,-1.1,.1,0,-.7,1.1);
  wool.addColorStop(0,'#fffced');
  wool.addColorStop(.65,'#eee8d3');
  wool.addColorStop(1,'#bfbda7');
  ellipse(0,-.84,.94,.63,wool);
  for(const [index,spot] of a.spots.entries()){
    if(s<14&&index>7)break;
    const x=spot.x,y=-.85+spot.y;
    if(x*x/.9+y*y>100)continue;
    let grad='#f0ebd8';
    if(s>=14){
      grad=c.createRadialGradient(x-.035,y-.045,.01,x,y,spot.r);
      grad.addColorStop(0,'#fffdef');
      grad.addColorStop(.65,'#f0ebd8');
      grad.addColorStop(1,'#d2ceba');
    }
    ellipse(x,y,spot.r,spot.r*.92,grad);
    c.strokeStyle='#b8b5a22b';
    c.lineWidth=.012;
    c.beginPath();
    c.arc(x,y,spot.r*.55,.2,3.6);
    c.stroke();
  }
  const toward=feeding&&Math.hypot(a.x-player.x,a.z-player.z)<10,headX=a.headX??a.dir*.83,headY=a.headY??-1.05;
  if(a.state==='nurse-wait'){
    ellipse(.2,-.34,.18,.13,'#c7a18b');
    c.fillStyle='#b98c78';
    c.fillRect(.11,-.33,.035,.12);
    c.fillRect(.25,-.33,.035,.12);
  }
  c.save();
  c.translate(headX+(happy?Math.sin(t*2)*.04:0),headY+chew);
  if(!toward)c.rotate(-headX/.83*.13);
  ellipse(-.3,-.12,.24,.09,'#b3aa91');
  ellipse(.3,-.12,.24,.09,'#b3aa91');
  ellipse(-.33,-.12,.14,.044,'#d8b6a0');
  ellipse(.33,-.12,.14,.044,'#d8b6a0');
  const face=c.createLinearGradient(-.2,-.3,.2,.36);
  face.addColorStop(0,'#8d8876');
  face.addColorStop(1,'#bbb19a');
  ellipse(0,.07,.27,.37,face);
  for(let i=0;i<5;i++)ellipse((i-2)*.10,-.27+Math.abs(i-2)*.024,.115,.105,'#faf4df');
  for(const x of [-.15,.15]){
    if(resting||happy){
      c.strokeStyle='#555c48';
      c.lineWidth=.025;
      c.beginPath();
      c.moveTo(x-.055,-.025);
      c.quadraticCurveTo(x,.035,x+.055,-.025);
      c.stroke();
    }
    else{
      ellipse(x,-.015,.042,.052,'#242f2a');
      ellipse(x-.009,-.03,.013,.015,'#fff8e8');
    }
  }
  if(happy){
    ellipse(-.22,.13,.07,.035,'#d5b5a1');
    ellipse(.22,.13,.07,.035,'#d5b5a1');
  }
  ellipse(0,.28,.08,.048,'#675f50');
  c.strokeStyle='#686353';
  c.lineWidth=.015;
  c.beginPath();
  c.moveTo(0,.31);
  c.lineTo(0,.35);
  c.stroke();
  c.restore();
  if(resting){
    c.fillStyle='#e9ecd4';
    c.font='.22px serif';
    c.fillText('z',.4,-1.6+Math.sin(t)*.04);
  }
  if(a.pet>0||a.bite>0){
    c.globalAlpha=Math.min(1,Math.max(a.pet,a.bite));
    c.fillStyle=a.pet>0?'#e6ad91':'#f3df95';
    c.font='.36px serif';
    c.textAlign='center';
    c.fillText(a.pet>0?'♥':'✦',.1,-1.8-Math.sin(t*2)*.05);
    c.globalAlpha=1;
  }
  c.restore();
}
