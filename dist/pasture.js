import {drawPond} from './render/pond.js?v=pond-bank-1';
import {drawRiverMountains,drawWaterways,drawRiverMouths} from './render/waterways.js?v=solid-buildings-2';
import {CONFIG,keepDry,pondPoint,onBridge,WATERWAYS} from './game/config.js?v=solid-buildings-2';
let seed=981;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
export const trees=Array.from({length:105},(_,i)=>{const a=rnd()*Math.PI*2,r=(34+rnd()*85)*(i>=70?1.8:1),tree={x:Math.sin(a)*r,z:Math.cos(a)*r,size:1.1+rnd()*1.1,phase:rnd()*6.28};if(i<16){
   const angles=[.9,1.03,1.15,1.3,1.42,2.3,2.45,2.57,2.7,3.3,3.43,3.55,4.28,4.4,4.52,4.65];
   Object.assign(tree,pondPoint(angles[i],1.19+(i%3)*.045));
 }else if(i<23){
   const z=35+(i-16)*24;
   const bank=WATERWAYS[0].points.reduce((best,p)=>Math.abs(p.z-z)<Math.abs(best.z-z)?p:best);
   Object.assign(tree,{x:bank.x+(i%2&&z>80?1:-1)*(bank.width+5.5),z});
 }
 keepDry(tree);
 if(onBridge(tree,3)){tree.x+=12;keepDry(tree);}
 return tree;});
export const firTree={x:17,z:25};
export function drawFirTree(c,p){
 if(!p)return;
 c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);
 c.fillStyle='#263f2c42';c.beginPath();c.ellipse(0,.04,2.4,.36,0,0,Math.PI*2);c.fill();
 c.fillStyle='#75583d';c.fillRect(-.3,-2,.6,2);
 const layers=[[-9.4,2.0,3.5],[-7.7,2.55,3.55],[-5.9,3.05,3.6],[-4.0,3.55,3.55]];
 for(let i=layers.length-1;i>=0;i--){
  const [top,width,height]=layers[i];c.beginPath();c.moveTo(0,top);
  c.bezierCurveTo(-width*.2,top+height*.42,-width*.62,top+height*.75,-width,top+height);
  c.quadraticCurveTo(-width*.55,top+height+.28,-width*.27,top+height-.05);
  c.quadraticCurveTo(0,top+height+.32,width*.27,top+height-.05);
  c.quadraticCurveTo(width*.62,top+height+.27,width,top+height);
  c.bezierCurveTo(width*.62,top+height*.75,width*.2,top+height*.42,0,top);
  c.fillStyle=['#527b52','#416e48','#396441','#315a3b'][i];c.fill();
  c.strokeStyle='#76966b70';c.lineWidth=.06;c.beginPath();c.moveTo(-width*.65,top+height*.82);c.quadraticCurveTo(-width*.3,top+height*.94,0,top+height*.8);c.stroke();
 }
 c.restore();
}
export function drawPasture(c,W,H,t,sunset,view,project,ellipse,path,weather={}){
 const f=view.basis?.(W,H)?.f??Math.min(W*.95,950),horizon=H*.52-f*Math.tan(view.pitch);
 const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,weather.night?'#40536a':weather.cloud>.7?'#aabdc0':sunset?'#d7b2a6':'#b7d7d9');sky.addColorStop(1,weather.night?'#89988b':weather.cloud>.7?'#d5dbd0':sunset?'#f8dcad':'#f0f1d9');c.fillStyle=sky;c.fillRect(0,0,W,H);
 const sx=W*.5+Math.sin(.9-view.yaw)*W*.6,sy=horizon-100;
 if(Math.cos(.9-view.yaw)>0&&!(weather.cloud>.7))ellipse(sx,sy,28,28,weather.night?'#eee8c7':sunset?'#ffe2aa':'#fff9df');
 for(let i=0;i<(weather.cloud>.7?17:weather.kind==='clear'?4:9);i++){const angle=i/9*Math.PI*2+t*.001-view.yaw;if(Math.cos(angle)<.2)continue;const x=W*.5+Math.sin(angle)*W*.8,y=Math.max(35,horizon-110-i%3*44);for(let j=0;j<5;j++)ellipse(x+j*23,y+Math.sin(j)*5,32,12,weather.cloud>.7?'#dce1d580':'#fffdf053');}
 const christmas=new Date();
 if(christmas.getMonth()===11&&christmas.getDate()>=20&&christmas.getDate()<=26&&t%100<14){
  const x=-100+(t%100)/14*(W+200),y=Math.max(70,horizon-85)+Math.sin(t*.8)*5;
  c.save();c.translate(x,y);c.scale(.75,.75);
  c.strokeStyle='#e6cf96';c.lineWidth=3;c.beginPath();c.moveTo(-55,20);c.quadraticCurveTo(-20,31,20,20);c.stroke();
  c.fillStyle='#aa3534';c.beginPath();c.moveTo(-50,-7);c.quadraticCurveTo(-30,2,-28,17);c.lineTo(7,17);c.quadraticCurveTo(22,12,22,-5);c.closePath();c.fill();
  c.fillStyle='#ba3031';c.beginPath();c.arc(-8,-18,12,0,Math.PI*2);c.fill();
  c.fillStyle='#f0c39e';c.beginPath();c.arc(-6,-30,8,0,Math.PI*2);c.fill();
  c.fillStyle='#fff7e7';c.beginPath();c.arc(-5,-25,7,0,Math.PI);c.fill();
  c.fillStyle='#b92e2f';c.beginPath();c.moveTo(-16,-34);c.lineTo(-7,-47);c.lineTo(4,-34);c.closePath();c.fill();
  c.fillStyle='#fff7e7';c.fillRect(-16,-35,20,3);c.restore();
 }
 drawRiverMountains(c,project,view.basis?.(W,H));
 for(let layer=0;layer<3;layer++){c.beginPath();c.moveTo(0,H);for(let x=0;x<=W+16;x+=16){const a=(x/W-.5)*1.4+view.yaw;const y=horizon+layer*9-18-Math.sin(a*3.1+layer)*17-Math.sin(a*7-layer)*8;c.lineTo(x,y);}c.lineTo(W,H);c.closePath();c.fillStyle=['#a2b7a4','#8fa984','#829e69'][layer];c.fill();}
 const ground=c.createLinearGradient(0,Math.max(0,horizon),0,H);ground.addColorStop(0,sunset?'#98a36e':'#a1b979');ground.addColorStop(1,sunset?'#5d7447':'#668b47');c.fillStyle=ground;c.fillRect(0,Math.max(0,horizon+7),W,H);
 function polygon(points,color){const pp=points.map(p=>project(p[0],p[1],p[2]||.015));if(pp.some(p=>!p))return;path(pp.map(p=>[p.x,p.y]),color);}
 if(weather.kind==='snow'){c.fillStyle='#eeeedd48';c.fillRect(0,Math.max(0,horizon+7),W,H);}
 // World-space pond and a walking path remain anchored while the camera turns.
 polygon([[-2,CONFIG.playerBounds.minZ],[3,CONFIG.playerBounds.minZ],[11,CONFIG.playerBounds.maxZ],[7,CONFIG.playerBounds.maxZ]],'#c6c39366');
 drawWaterways(c,project,t,view.basis?.(W,H));
 drawPond(c,project,t,{sunset,night:weather.night,snow:weather.kind==='snow',month:christmas.getMonth()+1},view.basis?.(W,H));
 drawRiverMouths(c,project,view.basis?.(W,H));
 const bounds=CONFIG.bounds;
 function fence(x,z,nx,nz){
  const a=project(x,z),b=project(x,z,1.1),next=project(nx,nz,.75),rail=project(x,z,.75);
  if(!a||!b||!next||!rail)return;
  c.strokeStyle='#ded9b9';c.lineWidth=Math.max(1,a.s*.06);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.moveTo(rail.x,rail.y);c.lineTo(next.x,next.y);c.stroke();
 }
 for(let x=bounds.minX;x<bounds.maxX;x+=8)for(const z of [bounds.minZ,bounds.maxZ])fence(x,z,Math.min(x+8,bounds.maxX),z);
 for(let z=bounds.minZ;z<bounds.maxZ;z+=8)for(const x of [bounds.minX,bounds.maxX])fence(x,z,x,Math.min(z+8,bounds.maxZ));
}

export function drawWindmill(c,p,t){if(!p)return;c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);c.fillStyle='#d4cba9';c.beginPath();c.moveTo(-.5,0);c.lineTo(-.24,-3.2);c.lineTo(.24,-3.2);c.lineTo(.5,0);c.fill();c.translate(0,-3);c.rotate(t*.18);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle='#e9e3c7';c.fillRect(.15,-.12,1.7,.27);c.fillStyle='#c5c6a9';c.fillRect(.75,-.18,.8,.5);}c.restore();}
