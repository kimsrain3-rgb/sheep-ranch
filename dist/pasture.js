let seed=981;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
export const trees=Array.from({length:105},(_,i)=>{const a=rnd()*Math.PI*2,r=34+rnd()*85;return {x:Math.sin(a)*r,z:Math.cos(a)*r,size:1.1+rnd()*1.1,phase:rnd()*6.28};});
export const cows=Array.from({length:9},(_,i)=>({x:15+(i%3)*5,z:24+Math.floor(i/3)*10,phase:rnd()*7,size:1.2+rnd()*.25}));
export function drawPasture(c,W,H,t,sunset,view,project,ellipse,path){
 const f=Math.min(W*.95,950),horizon=H*.52-f*Math.tan(view.pitch);
 const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,sunset?'#d7b2a6':'#b7d7d9');sky.addColorStop(1,sunset?'#f8dcad':'#f0f1d9');c.fillStyle=sky;c.fillRect(0,0,W,H);
 const sx=W*.5+Math.sin(.9-view.yaw)*W*.6,sy=horizon-100;
 if(Math.cos(.9-view.yaw)>0)ellipse(sx,sy,28,28,sunset?'#ffe2aa':'#fff9df');
 for(let i=0;i<9;i++){const angle=i/9*Math.PI*2+t*.001-view.yaw;if(Math.cos(angle)<.2)continue;const x=W*.5+Math.sin(angle)*W*.8,y=Math.max(35,horizon-110-i%3*44);for(let j=0;j<5;j++)ellipse(x+j*23,y+Math.sin(j)*5,32,12,'#fffdf053');}
 for(let layer=0;layer<3;layer++){c.beginPath();c.moveTo(0,H);for(let x=0;x<=W+16;x+=16){const a=(x/W-.5)*1.4+view.yaw;const y=horizon+layer*9-18-Math.sin(a*3.1+layer)*17-Math.sin(a*7-layer)*8;c.lineTo(x,y);}c.lineTo(W,H);c.closePath();c.fillStyle=['#a2b7a4','#8fa984','#829e69'][layer];c.fill();}
 const ground=c.createLinearGradient(0,Math.max(0,horizon),0,H);ground.addColorStop(0,sunset?'#98a36e':'#a1b979');ground.addColorStop(1,sunset?'#5d7447':'#668b47');c.fillStyle=ground;c.fillRect(0,Math.max(0,horizon+7),W,H);
 function polygon(points,color){const pp=points.map(p=>project(p[0],p[1],p[2]||.015));if(pp.some(p=>!p))return;path(pp.map(p=>[p.x,p.y]),color);}
 // World-space pond and a walking path remain anchored while the camera turns.
 polygon([[-2,-65],[3,-65],[11,130],[7,130]],'#c6c39366');
 const pond=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return [-16+Math.cos(a)*7,-5+Math.sin(a)*5];});polygon(pond,'#c6c7a5');polygon(pond.map(([x,z])=>[-16+(x+16)*.92,-5+(z+5)*.92,.03]),sunset?'#8da9a2':'#91beb5');
 for(let i=0;i<4;i++){const p=project(-16+i*1.5,-5+Math.sin(t*.4+i),.05);if(p)ellipse(p.x,p.y,p.s*.5,Math.max(.4,p.s*.014),'#e5f0de70');}
 for(let i=-10;i<30;i++){const x=i*4;for(const z of [65,-30]){const a=project(x,z),b=project(x,z,1.1),next=project(x+4,z,.75),rail=project(x,z,.75);if(!a||!b||!next||!rail)continue;c.strokeStyle='#ded9b9';c.lineWidth=Math.max(1,a.s*.06);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.moveTo(rail.x,rail.y);c.lineTo(next.x,next.y);c.stroke();}}
}
export function drawCow(c,p,t,phase){if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};ell(0,0,1.4,.22,'#354c2929');c.strokeStyle='#716c54';c.lineWidth=.16;for(const x of [-.8,-.45,.5,.85]){c.beginPath();c.moveTo(x,-.8);c.lineTo(x+Math.sin(t+phase)*.025,0);c.stroke();}ell(0,-1,1.15,.65,'#eeeede');for(const [x,y,rx,ry] of [[-.6,-1.1,.36,.4],[.22,-1.35,.4,.24],[.7,-.85,.22,.35]])ell(x,y,rx,ry,'#38433a');ell(1.12,-.7,.35,.48,'#eeeede');ell(1.25,-.42,.3,.18,'#c7a697');ell(1.23,-.83,.04,.045,'#27362c');ell(.88,-1.02,.2,.08,'#424e3f');ell(1.42,-1.02,.2,.08,'#424e3f');c.restore();}

export function drawWindmill(c,p,t){if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);c.fillStyle='#d4cba9';c.beginPath();c.moveTo(-.5,0);c.lineTo(-.24,-3.2);c.lineTo(.24,-3.2);c.lineTo(.5,0);c.fill();c.translate(0,-3);c.rotate(t*.18);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle='#e9e3c7';c.fillRect(.15,-.12,1.7,.27);c.fillStyle='#c5c6a9';c.fillRect(.75,-.18,.8,.5);}c.restore();}
