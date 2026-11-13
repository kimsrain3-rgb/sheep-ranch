// Distant sheep now belong to the same fifty-animal interactive flock.
let seed=491;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
const distantSheep=Array.from({length:0},(_,i)=>({x:.10+random()*.55,y:.405+random()*.07,s:5+random()*5,phase:random()*6.28,dir:i%3?1:-1}));
const cows=Array.from({length:9},(_,i)=>({x:.64+random()*.31,y:.485+random()*.075,s:12+random()*8,phase:random()*6.28,dir:i%2?1:-1})).sort((a,b)=>a.y-b.y);
const flowers=Array.from({length:240},()=>({x:random(),y:random(),h:random(),p:random()*6.28}));
const treeDots=Array.from({length:35},()=>({x:(random()-.5)*1.1,y:(random()-.5)*.8,r:.12+random()*.14}));
export function drawScenery(c,W,H,t,sunset,camX){
 const ell=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const poly=(points,col)=>{c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const stroke=(points,col,width)=>{c.strokeStyle=col;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 function oak(x,y,s,tone=0){
  c.save();c.translate(x,y);c.scale(s,s);ell(5,2,36,7,'#2d4c2927');poly([[-4,2],[-2,-57],[5,-58],[5,-18],[11,1]],'#7d7657');stroke([[2,-28],[-13,-49]],'#777052',3);stroke([[3,-38],[20,-57]],'#777052',3);
  ell(0,-66,32,28,tone?'#68815c':'#637f52');for(const a of treeDots){const cols=sunset?['#7d8b59','#718152','#929b64']:['#769653','#668849','#8ca968'];ell(a.x*55,-66+a.y*45,a.r*65,a.r*53,cols[Math.floor((a.x+.6)*7)%3]);}c.restore();
 }
 // Orchard and hedgerows connect the distant pasture to the farm buildings.
 for(let i=0;i<30;i++){const x=W*(.01+i*.034)-camX*.3,y=H*(.425+Math.sin(i*.7)*.012);if(i>12&&i<17)continue;oak(x,y,.36+Math.sin(i*1.4)*.06,i%2);}
 // Fine contour fences on the far hillside.
 for(let row=0;row<2;row++){const y=H*(.416+row*.033);for(let i=0;i<17;i++){let x=W*(.06+i*.035)-camX*.2,yy=y+Math.sin(i*.3+row)*5;stroke([[x,yy-8],[x,yy+3]],'#d8dbbd',1.3);stroke([[x,yy-4],[x+W*.035,yy-4+Math.cos(i*.3+row)*1.5]],'#d8dbbd',1);}}
 function farSheep(a){const x=W*a.x-camX*.25+Math.sin(t*.07+a.phase)*8,y=H*a.y,s=a.s*Math.min(1,W/850+.25);c.save();c.translate(x,y);c.scale(s*a.dir,s);ell(0,0,1.1,.17,'#3a543122');for(const xx of [-.65,-.35,.4,.65])stroke([[xx,-.7],[xx+Math.sin(t*1.5+a.phase)*.045,0]],'#827e64',.11);ell(0,-.83,.96,.57,'#eee9d2');for(let i=0;i<7;i++)ell(Math.sin(i*2.4)*.58,-.86+Math.cos(i*2.4)*.25,.34,.29,i%2?'#f5efd9':'#e2ddc5');const grazing=Math.sin(t*.3+a.phase)>.15;ell(.9,grazing?-.35:-.9,.23,.3,'#958f75');ell(.88,grazing?-.55:-1.15,.24,.08,'#c5bda0');c.restore();}
 for(const a of distantSheep)farSheep(a);
 function cow(a){const x=W*a.x-camX*.55+Math.sin(t*.055+a.phase)*10,y=H*a.y,s=a.s*Math.min(1,W/850+.35);c.save();c.translate(x,y);c.scale(s*a.dir,s);ell(0,.02,1.25,.18,'#304e2927');const gait=Math.sin(t*1.2+a.phase)*.05;
 for(let i=0;i<4;i++){const xx=[-.85,-.56,.52,.86][i];stroke([[xx,-.85],[xx+gait,-.35],[xx-gait,0]],i%2?'#eee9d5':'#b9b9a5',.15);ell(xx-gait,.01,.13,.06,'#414942');}
 c.save();c.beginPath();c.ellipse(0,-1.03,1.2,.66,0,0,Math.PI*2);c.clip();c.fillStyle='#f7f3e3';c.fillRect(-1.5,-1.8,3,1.5);ell(-.62,-1.23,.38,.51,'#35433b');ell(.48,-.87,.43,.34,'#35433b');ell(.74,-1.55,.5,.32,'#35433b');ell(-.25,-.5,.32,.23,'#35433b');c.restore();
 // Low, grazing head, wide muzzle and characteristic Holstein ears.
 const hy=-.6+Math.sin(t*.4+a.phase)*.12;poly([[.84,-1.15],[1.22,-1.01],[1.48,hy],[1.11,hy+.17]],'#e5e2d0');ell(1.34,hy,.32,.42,'#35433b');ell(1.46,hy+.26,.28,.17,'#d5b9aa');ell(1.1,hy-.2,.25,.1,'#425044');ell(1.56,hy-.19,.21,.09,'#425044');ell(1.47,hy-.1,.033,.04,'#fffae8');stroke([[1.12,hy-.31],[1.03,hy-.47]],'#c7c3aa',.07);stroke([[-1.12,-1.18],[-1.36,-.68],[-1.36+Math.sin(t*2+a.phase)*.14,-.35]],'#75785f',.045);ell(-1.36+Math.sin(t*2+a.phase)*.14,-.34,.08,.13,'#3f4b3e');c.restore();
 }
 // Pasture gate and a dairy shed, with hay bales outside.
 const farmX=W*.88-camX*.5,farmY=H*.47,fs=W<700?.48:.75;c.save();c.translate(farmX,farmY);c.scale(fs,fs);poly([[-50,-37],[52,-37],[52,24],[-50,24]],sunset?'#a47858':'#b28565');poly([[-61,-36],[0,-74],[64,-36]],'#6e705c');c.fillStyle='#ede4c6';c.fillRect(-22,-22,40,46);c.fillStyle='#6a7058';c.fillRect(-18,-19,32,43);stroke([[-17,-17],[12,22]],'#d2c8a8',2);stroke([[12,-17],[-17,22]],'#d2c8a8',2);for(let i=0;i<3;i++){const x=65+i*18,y=18-(i%2)*9;ell(x,y,15,13,'#c8ae65');ell(x,y,10,9,'#b49a56');stroke([[x-8,y],[x+7,y]],'#ddc985',1.2);}c.restore();
 for(const a of cows)cow(a);
 // The small windmill turns slowly beside the barns.
 const mx=W*.78-camX*.4,my=H*.44,ms=W<700?.45:.7;c.save();c.translate(mx,my);c.scale(ms,ms);stroke([[-9,10],[0,-65],[10,10]],'#9b9978',4);stroke([[-6,-10],[7,-10]],'#9b9978',3);c.translate(0,-64);c.rotate(t*.16);for(let i=0;i<4;i++){c.rotate(Math.PI/2);poly([[2,3],[7,-26],[18,-31],[12,-2]],'#dedbc2');}ell(0,0,4,4,'#8d8b6b');c.restore();
 // A grove in the left pasture, not scattered isolated trees.
 for(const [x,y,s] of [[.01,.55,1.1],[.05,.55,1.0],[.11,.54,.86],[.18,.54,.72],[.23,.53,.6],[.035,.61,1.45],[.09,.60,1.18],[.16,.58,.95],[.20,.57,.7],[.035,.58,1.2]])oak(W*x-camX*1.5,H*y,s*(W<700?.65:1));
 for(const [x,y,s] of [[.93,.55,.85],[.97,.56,1.0],[1.01,.58,1.4],[.97,.65,1.8],[1.02,.7,2.1],[.95,.60,1.1]])oak(W*x-camX*1.5,H*y,s*(W<700?.6:1));
 // Pond with a stony bank, moving glints and reeds.
 const px=W*.17-camX*1.25,py=H*.73,pw=Math.min(W*.145,185),ph=H*.043;
 ell(px,py+4,pw+14,ph+10,'#768856');ell(px,py,pw+6,ph+4,'#b6b69a');const water=c.createLinearGradient(0,py-ph,0,py+ph);water.addColorStop(0,sunset?'#9cab96':'#8faea5');water.addColorStop(1,sunset?'#d2c39c':'#c1d3b5');ell(px,py,pw,ph,water);
 c.save();c.beginPath();c.ellipse(px,py,pw,ph,0,0,Math.PI*2);c.clip();for(let i=0;i<18;i++){let xx=px+Math.sin(i*9.2)*pw*.9,yy=py+Math.cos(i*7.3)*ph*.8;stroke([[xx,yy],[xx+12+Math.sin(t+i)*7,yy]],i%2?'#edf0d05c':'#668f843d',1);}c.restore();
 for(let i=0;i<22;i++){const angle=i/22*Math.PI*2,x=px+Math.cos(angle)*(pw+5),y=py+Math.sin(angle)*(ph+2);if(i%3===0)ell(x,y,5+i%3,2.7,'#a1a28a');if(i<8||i>16)for(let j=0;j<3;j++)stroke([[x+j*2,y],[x+j*2+Math.sin(t*1.5+i)*3,y-12-j*4]],'#60784d',1.1);}
 // White and golden wildflower drifts and taller blades break up the lawn.
 for(const f of flowers){let x,y;if(f.x<.55){x=W*(.015+f.x*.48)-camX*2;y=H*(.76+f.y*.22);}else{x=W*(.85+(f.x-.55)*.4)-camX*1.5;y=H*(.70+f.y*.27);}const size=1.1+f.y*2.3,wind=Math.sin(t*1.6+f.p)*3;
 stroke([[x,y],[x+wind,y-5-f.h*11]],'#5e7e3e',.8);if(f.h>.37){const yy=y-5-f.h*11;for(let j=0;j<5;j++)ell(x+wind+Math.cos(j*1.257)*size,yy+Math.sin(j*1.257)*size,size*.75,size*.55,f.h>.7?'#eee8cf':'#ddcb81');ell(x+wind,yy,size*.53,size*.53,'#c4a355');}}
 // Split-rail fence recedes from the left edge into the grove.
 for(let i=0;i<8;i++){const f=i/7,x=W*(-.03+f*.08)-camX*.9,y=H*(.88-f*.26),height=35-f*17;stroke([[x,y],[x,y-height]],'#a3a17a',5-f*2);if(i<7){const nx=W*(-.03+(i+1)/7*.08)-camX*.9,ny=H*(.88-(i+1)/7*.26),nh=35-(i+1)/7*17;for(const r of [.3,.75])stroke([[x,y-height*r],[nx,ny-nh*r]],'#c7c39c',4-f*2);}}
 // Swallows cross the open sky slowly.
 for(let i=0;i<5;i++){const x=((t*.008+i*.13)%1.25-.1)*W,y=H*(.27+i*.013)+Math.sin(t*.3+i)*6,wing=Math.sin(t*4+i)*4;c.beginPath();c.moveTo(x-6,y+wing);c.quadraticCurveTo(x-2,y-3,x,y);c.quadraticCurveTo(x+2,y-3,x+6,y+wing);c.strokeStyle='#6c81765c';c.lineWidth=1;c.stroke();}
}
