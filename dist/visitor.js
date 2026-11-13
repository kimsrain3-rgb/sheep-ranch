// Small illustrated visitor and a world-space hammock, sharing the pasture projection.
export function drawVisitor(c,p,{time=0,walking=false,seated=false,feeding=false,facing=1}={}){
 if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
 const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(v,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 ell(0,.03,.48,.13,'#2e482d30');const swing=walking?Math.sin(time*9)*.19:0,torso=seated?-.85:-1.06;
 for(const [i,x] of [-.17,.17].entries()){const d=swing*(i?1:-1);line(seated?[[x,-.5],[x+.2,-.26],[x+.21,-.04]]:[[x,-.68],[x+d,-.33],[x-d,-.07]],'#526b53',.17);ell(x-d+(seated?.21:0),-.035,.15,.065,'#594f3d');}
 // Ochre coat, backpack seams and a soft brimmed straw hat.
 c.fillStyle='#d5ae5e';c.beginPath();c.roundRect(-.34,torso-.35,.68,.77,.11);c.fill();
 line([[-.29,torso-.16],[-.43,torso+.15+Math.abs(swing)],[-.39,torso+.37]],'#c39c51',.14);
 line(feeding?[[.27,torso-.14],[.48,torso-.28],[.68,torso-.25]]:[[.29,torso-.16],[.44,torso+.17-Math.abs(swing)],[.4,torso+.37]],'#d9b569',.14);
 ell(feeding?.70:.40,feeding?torso-.25:torso+.39,.09,.11,'#d9b393');
 c.fillStyle='#69816a';c.beginPath();c.roundRect(-.24,torso-.16,.48,.55,.09);c.fill();line([[-.16,torso-.14],[-.16,torso+.35]],'#839783',.025);line([[.16,torso-.14],[.16,torso+.35]],'#839783',.025);line([[-.16,torso+.12],[.17,torso+.12]],'#506b55',.022);
 ell(0,torso-.58,.29,.32,'#6d5744');ell(facing*.21,torso-.55,.075,.10,'#d8b699');ell(0,torso-.80,.48,.10,'#c6b47d');ell(0,torso-.91,.31,.19,'#e1cea1');line([[-.28,torso-.86],[.28,torso-.86]],'#b29e69',.05);
 if(feeding){for(let i=0;i<10;i++){c.strokeStyle=i%2?'#e0c575':'#ac8d3b';c.lineWidth=.022;c.beginPath();c.moveTo(.67,torso-.27);c.quadraticCurveTo(.65+i*.027,torso-.6,.54+i*.037,torso-.83+(i%3)*.07);c.stroke();}}
 c.fillStyle='#344a38c9';c.beginPath();c.roundRect(-.24,torso-1.25,.48,.26,.06);c.fill();c.fillStyle='#fff8e6';c.textAlign='center';c.font='.16px sans-serif';c.fillText('나',0,torso-1.06);c.restore();
}
export function drawHammock(c,p,{time=0,occupied=false,sunset=false}={}){
 if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);const ell=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(v,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 ell(0,.05,3.1,.52,'#314d2e1b');
 for(const x of [-3,3]){line([[x,.1],[x+.12,-2],[x+.03,-4.05]],'#857551',.23);line([[x+.08,-2.4],[x+(x>0?.5:-.5),-3.4]],'#857551',.1);for(let i=0;i<13;i++){const angle=i*2.4;ell(x+Math.sin(angle)*.72,-4.1+Math.cos(angle)*.44,.6+(i%3)*.13,.51,sunset?['#82945f','#728654','#96a86e'][i%3]:['#769c56','#63864b','#8ba963'][i%3]);}}
 const sway=Math.sin(time*.8)*(occupied?.055:.025);c.save();c.translate(sway,-.94);
 line([[-3,-1.35],[-2.02,-.7]],'#d2c6a0',.045);line([[3,-1.35],[2.02,-.7]],'#d2c6a0',.045);
 c.beginPath();c.moveTo(-2,-.73);c.bezierCurveTo(-1.2,-.14,1.2,-.14,2,-.73);c.bezierCurveTo(1.35,.62,-1.35,.62,-2,-.73);c.fillStyle='#e4d7b5';c.fill();
 // Woven sage and linen stripes follow the hammock's sag.
 for(let i=0;i<13;i++){const x=-1.7+i*.28,lower=.4*(1-x*x/4);line([[x,-.32*(1-x*x/4)],[x+.07,lower]],i%2?'#8da18a':'#c3bc9b',.09);}
 if(occupied){c.save();c.rotate(-.08);line([[-.65,-.10],[.4,-.05],[1.1,-.25]],'#d3ac5d',.39);line([[.42,-.04],[1.1,-.22],[1.46,-.43]],'#587256',.22);ell(-1.03,-.26,.28,.25,'#d5b391');ell(-1.1,-.39,.43,.08,'#cbb782');ell(-1.11,-.49,.28,.16,'#e1cfa2');line([[-.40,-.24],[-.15,-.62],[-.82,-.62]],'#c9a35d',.11);c.restore();}
 // Front edge and knotted fringe.
 c.beginPath();c.moveTo(-2,-.7);c.bezierCurveTo(-1.4,.66,1.4,.66,2,-.7);c.strokeStyle='#9ba788';c.lineWidth=.07;c.stroke();for(let i=0;i<15;i++){const x=-1.7+i*.24,y=.48*(1-x*x/3);line([[x,y],[x+.04,y+.15]],'#d8c9a3',.025);}
 c.restore();c.fillStyle='#3c543bd9';c.beginPath();c.roundRect(-.88,-2.67,1.76,.36,.08);c.fill();c.fillStyle='#fff7e0';c.font='.17px sans-serif';c.textAlign='center';c.fillText(occupied?'해먹에서 쉬는 중':'나무 그늘의 해먹',0,-2.44);c.restore();
}
