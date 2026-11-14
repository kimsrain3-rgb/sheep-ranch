// A walkable cutaway interior, using the same world projection as the meadow.
export function drawBarnInterior(c,W,H,project,{night=false,inside=0,total=0}={}){
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#6b5b43');sky.addColorStop(1,'#c0ac83');c.fillStyle=sky;c.fillRect(0,0,W,H);
  const poly=(points,color)=>{const pp=points.map(([x,z,y=0])=>project(x,z,y));if(pp.some(p=>!p))return;c.fillStyle=color;c.beginPath();pp.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
  const line=(a,b,color,width=.04)=>{const p=project(...a),q=project(...b);if(!p||!q)return;c.strokeStyle=color;c.lineWidth=Math.max(1,p.s*width);c.lineCap='round';c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();};
  poly([[-10,-1],[10,-1],[10,19],[-10,19]],'#bba37c');
  for(let z=0;z<19;z++)line([-10,z,.01],[10,z,.01],'#a58e6966',.02);
  for(let x=-9;x<10;x+=2)line([x,-1,.01],[x,19,.01],'#e5d1a333',.015);
  poly([[-10,19,0],[10,19,0],[10,19,5],[-10,19,5]],'#cbb995');
  for(let x=-10;x<=10;x++)line([x,19,.1],[x,19,5],'#b6a079',.025);
  for(const x of [-6,6]){
    poly([[x-1.5,18.96,2],[x+1.5,18.96,2],[x+1.5,18.96,3.7],[x-1.5,18.96,3.7]],night?'#4a5965':'#b6cfbd');
    line([x,18.9,2],[x,18.9,3.7],'#8d7553',.08);line([x-1.5,18.9,2.8],[x+1.5,18.9,2.8],'#8d7553',.08);
  }
  for(const x of [-9.8,9.8]){poly([[x,-1,0],[x,19,0],[x,19,2.5],[x,-1,2.5]],'#a9916c');for(let z=1;z<19;z+=3)line([x,z,0],[x,z,2.5],'#89714f',.12);}
  // Family pens leave a broad central aisle and cross aisles at both ends.
  for(const side of [-1,1])for(let row=0;row<7;row++){
    const z=2.3+row*2.05,x=side*2.35,far=side*9.1;
    poly([[x,z],[far,z],[far,z+1.8],[x,z+1.8]],row%2?'#d2bb7a88':'#d8c38988');
    line([x,z,.15],[far,z,.15],'#b59b6b',.07);
    line([x,z,0],[x,z,.8],'#8d7350',.08);line([x,z+1.8,0],[x,z+1.8,.8],'#8d7350',.08);
    line([x,z,.65],[x,z+1.8,.65],'#b69d73',.055);
  }
  // Warm ceiling lamps and open rafters; no roof hides the animals.
  for(const z of [3,10,18]){
    line([-9.8,z,4.5],[9.8,z,4.5],'#806747',.17);
    const p=project(0,z,4.25);if(p){c.save();c.shadowColor='#ffde8a';c.shadowBlur=18;c.fillStyle='#f4d48b';c.beginPath();c.ellipse(p.x,p.y,p.s*.22,p.s*.12,0,0,Math.PI*2);c.fill();c.restore();}
  }
  for(const x of [-8,8]){
    poly([[x-.8,.7,0],[x+.8,.7,0],[x+.8,1.6,0],[x-.8,1.6,0]],'#bd9b4e');
    poly([[x-.8,.7,.6],[x+.8,.7,.6],[x+.8,1.6,.6],[x-.8,1.6,.6]],'#e1c47a');
    poly([[x-.9,17.1,.2],[x+.9,17.1,.2],[x+.9,17.9,.2],[x-.9,17.9,.2]],'#748f88');
  }
  poly([[-1.1,-.5,.015],[1.1,-.5,.015],[1.1,.5,.015],[-1.1,.5,.015]],'#927c59');
  const p=project(0,18.8,4.1);if(p){c.fillStyle='#58714f';c.textAlign='center';c.font=`${Math.max(12,p.s*.45)}px sans-serif`;c.fillText('양들이 쉬어가는 집',p.x,p.y);}
}
