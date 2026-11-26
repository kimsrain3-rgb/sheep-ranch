import {isWater} from '../game/config.js';
import {denSites} from '../game/forest-hills.js';
import {birchCenter,birchDepth,birches,firs,trailX,generator,wildlifeAt} from '../game/fir-grove.js?v=deer-clearing-2';
import {clipPondPolygon} from './pond.js?v=water-join-1';

const atDen=(x,z,padding)=>denSites.some(p=>Math.abs(x-p.x)<padding&&Math.abs(z-p.z)<padding);
const TAU=Math.PI*2;
function oval(c,x,y,rx,ry,angle,color){
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();
}
function stroke(c,x,y,endX,endY,width,color){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();
}
function polygon(c,points,color){
  c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
}
// Layered needle sprays, bark plates and moss are painted once per sprite.
const treeArt=[],fernArt=[],floorArt=[];
function paintLitter(id){
  const canvas=document.createElement('canvas');canvas.width=150;canvas.height=70;
  const c=canvas.getContext('2d'),random=generator(6120+id*572),light=id%2===0;
  for(let i=0;i<130;i++){
    const angle=random()*TAU,r=Math.sqrt(random()),x=75+Math.cos(angle)*r*56,y=35+Math.sin(angle)*r*24;
    const size=1+random()*10*(1-r*.62);
    oval(c,x,y,size,size*(.23+random()*.5),random()*2.5,light?'#eed49428':'#3e4b3328');
    if(i%5===0)stroke(c,x,y,x+random()*6-2,y+random()*2,.8,light?'#f1d99c77':'#675d4199');
  }
  return canvas;
}
function paintFir(id){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=600;
  const c=canvas.getContext('2d'),rand=generator(39011+id*1221);
  const axis=y=>128+Math.sin(y/148+id)*2.3, bark=c.createLinearGradient(115,0,139,0);
  bark.addColorStop(0,'#4c5040');bark.addColorStop(.34,'#89745a');bark.addColorStop(.57,'#786249');bark.addColorStop(1,'#45493b');
  const outline=[];
  for(let y=18;y<=594;y+=8)outline.push([axis(y)-(1+y*.015+Math.pow(y/594,20)*6),y]);
  for(let y=594;y>=18;y-=8)outline.push([axis(y)+1+y*.016+Math.pow(y/594,20)*6,y]);
  polygon(c,outline,bark);c.save();c.clip();
  for(let i=0;i<670;i++){
    const y=rand()*598,x=axis(y)+(rand()-.5)*26;
    stroke(c,x,y,x-1+rand()*2,y+2+rand()*16,.55+rand()*2.3,['#ba9b715c','#413f344f','#746c50','#b1aa7670'][i%4]);
  }
  c.restore();c.lineCap='round';
  const needles=['#2f503e','#385b43','#47694a','#577750','#6e8858','#8a995f'];
  const base=348+rand()*45;
  for(let k=0;k<96;k++){
    const u=1-k/96,y=18+u*base,side=k%2?1:-1;
    const reach=(9+106*Math.pow(u,.75))*(.54+rand()*.51),tip=axis(y)+side*reach;
    const lift=9+rand()*17,dy=13+u*16;
    c.strokeStyle='#625844';c.lineWidth=1+u*2.3;c.beginPath();c.moveTo(axis(y),y);c.quadraticCurveTo(axis(y)+side*reach*.43,y+dy,tip,y+dy-lift);c.stroke();
    for(let j=0;j<15;j++){
      const v=j/15,xx=axis(y)+side*reach*v,yy=y+dy*(2*v-v*v)-lift*v*v;
      const length=(9+17*(1-v)+u*7)*(.65+rand()*.68);
      const hue=Math.min(5,Math.max(0,(k%4)+(side<0?1:0)-(j%4===0?1:0)));
      polygon(c,[[xx-side*5,yy-3],[xx+side*length*.38,yy-6-rand()*4],[xx+side*length,yy+2+rand()*8],[xx+side*length*.48,yy+4],[xx+side*length*.61,yy+8],[xx,yy+4]],needles[hue]);
      if(j%2===0)stroke(c,xx,yy,xx+side*length*.75,yy+3,1,needles[Math.min(5,hue+1)]);
    }
  }
  for(let i=0;i<5;i++){const y=base+25+rand()*125;stroke(c,axis(y),y,axis(y)+(i%2?1:-1)*(7+rand()*12),y-6-rand()*6,2.4,'#665a46');}
  return canvas;
}
function paintFern(id){
  const canvas=document.createElement('canvas');canvas.width=140;canvas.height=76;
  const c=canvas.getContext('2d'),rand=generator(8731+id*461);
  // Low sprays give the fern bank a continuous silhouette at walking height.
  for(let i=0;i<26;i++){
    const dx=(rand()-.5)*125,dy=-10-rand()*41,x=70+dx,y=73+dy;
    stroke(c,70,75,x,y,1.8,'#516342');
    for(let j=1;j<8;j++){
      const u=j/8,fx=70+dx*u,fy=74+dy*u;
      oval(c,fx,fy,6.5*(1-u*.5),2.2,j%2?-0.66:0.64,['#516b42','#69834c','#7c9055'][j%3]);
    }
  }
  for(let i=0;i<18;i++){
    const dx=(rand()-.5)*120,dy=-17-rand()*48;
    const tone=['#355740','#547347','#76904f','#8c9d58','#466a44'][i%5];
    for(let j=1;j<11;j++){
      const u=j/11,px=70+dx*u,py=72+dy*(2*u-u*u),w=8*Math.sin(Math.PI*u)+1;
      stroke(c,70+dx*(u-.09),72+dy*(2*(u-.09)-(u-.09)**2),px,py,1,tone);
      for(const side of [-1,1])polygon(c,[[px,py+1],[px+side*w*.6,py-2],[px+side*w+dx*.05,py-6],[px+side*w*.48,py]],tone);
    }
  }
  return canvas;
}

const rng=generator(813743),strips=[],litter=[],ferns=[];
for(let z=-88;z<=27;z+=1.5){
  const center=trailX(z),end=Math.max(.06,Math.min(1,(z+88)/7,(27-z)/7));
  const width=end*(14+Math.sin(z*.36)*1.1);
  const path=end*(1.23+.18*Math.sin(z*.58)+rng()*.21);
  strips.push({z,x:[center-width,center-width*.77,center-path-.36,center-path,center+path,center+path+.36,center+width*.77,center+width]});
  for(let i=0;i<17;i++){
    const offset=(rng()-.5)*width*1.88;
    litter.push({x:center+offset,z:z+rng()*1.2,r:.12+rng()**2*.7,lit:Math.sin(z*.41+offset*.58)+rng()>.47,trail:Math.abs(offset)<path,angle:rng()*3});
  }
  for(const side of [-1,1])for(let j=0;j<3;j++){
    const offset=(1.65+rng()*9)*end;
    ferns.push({x:center+side*offset,z:z+rng(),width:(.85+rng()*1.1)*end,id:Math.floor(rng()*5)});
  }
}
// The same conservative box covers ground, animals, and the tallest crowns.
export function groveVisible(project,w,h){
  const corners=[];
  for(const x of [30,90])for(const z of [-90,30])for(const y of [0,30])corners.push(project(x,z,y));
  const front=corners.filter(Boolean);
  if(!front.length)return false;
  if(front.length!==corners.length)return true;
  return !(front.every(p=>p.x<0)||front.every(p=>p.x>w)||front.every(p=>p.y<0)||front.every(p=>p.y>h));
}
export function drawForestFloor(c,project,camera,w,h,weather){
  const colors=weather.night?['#596b4e','#536549','#665e48','#827353']:
    weather.kind==='snow'?['#acb99f','#bfc8ae','#aaa995','#bab19c']:['#78875a','#64794c','#887950','#aa956b'];
  for(let i=1;i<strips.length;i++){
    const a=strips[i-1],b=strips[i];
    for(let k=0;k<7;k++){
      const ring=clipPondPolygon([[a.x[k],a.z,0],[a.x[k+1],a.z,0],[b.x[k+1],b.z,0],[b.x[k],b.z,0]],camera);
      if(ring.length<3)continue;
      const pts=ring.map(([x,z,y])=>project(x,z,y));
      if(pts.some(p=>!p)||pts.every(p=>p.x<0)||pts.every(p=>p.x>w)||pts.every(p=>p.y>h)||pts.every(p=>p.y<0))continue;
      const color=colors[Math.min(k,6-k)];
      polygon(c,pts.map(p=>[p.x,p.y]),color);
      c.lineWidth=.7;c.strokeStyle=color;c.stroke();
    }
  }
  for(const bit of litter){
    const p=project(bit.x,bit.z,.012);
    if(!p||p.s<3||p.x< -65||p.x>w+65||p.y<0||p.y>h+30)continue;
    const size=p.s*(.48+bit.r*2),light=bit.lit&&!weather.night&&!weather.wet;
    const id=(Math.floor(bit.angle*2)%3)*2+(light?0:1);
    c.drawImage(floorArt[id]??=paintLitter(id),p.x-size,p.y-size*.35,size*2,size*.7);
    if(bit.trail && p.s>10)stroke(c,p.x,p.y,p.x+p.s*.074,p.y-p.s*.019,.55+p.s*.012,'#685e4770');
  }
}
let foxSheet;
function drawFox(c,p,a,yaw){
  if(!foxSheet){
    foxSheet = new Image();
    foxSheet.src = new URL('../assets/forest-fox.webp', import.meta.url).href;
  }
  if(!foxSheet.complete || !foxSheet.naturalWidth)return;
  const frameWidth = foxSheet.naturalWidth / 6;
  const frameHeight = foxSheet.naturalHeight / 6;
  const width = 1.5 * p.s, height = width * frameHeight / frameWidth;
  const screenVelocity = Math.cos(yaw)*a.velocityX - Math.sin(yaw)*a.velocityZ;
  c.save();
  c.translate(p.x,p.y);
  c.scale(screenVelocity>0 ? -1 : 1,1);
  c.drawImage(foxSheet,(a.frame%6)*frameWidth,Math.floor(a.frame/6)*frameHeight,
    frameWidth,frameHeight,-width/2,-height*.94,width,height);
  c.restore();
}
function drawAnimal(c,p,a,yaw,project){
  if(a.fox){drawFox(c,p,a,yaw);return;}
  const side=Math.cos(yaw)*a.direction;
  const width=(side<0?-1:1)*(.68+.32*Math.abs(side));
  c.save();c.translate(p.x,p.y-(a.rabbit?a.hop:0)*p.s);c.scale(p.s*width,p.s);
  if(a.rabbit){
    oval(c,-.04,-.22,.26,.17,-.18,'#a4967a');oval(c,.17,-.34,.14,.135,0,'#aa9b80');
    oval(c,.13,-.5,.042,.13,-.36,'#84785f');oval(c,.22,-.49,.037,.14,.15,'#ac9b7e');
    oval(c,-.27,-.19,.075,.07,0,'#d7cfb5');oval(c,-.11,-.095,.14,.066,-.13,'#8c8067');
    oval(c,.215,-.36,.018,.018,0,'#3d372d');
  }else{
    const coat='#9e7652';
    oval(c,0,0,.49,.065,0,'rgba(56,47,29,.16)');
    for(let i=0;i<4;i++){
      const x=(i<2?-.43:.38)+(i%2)*.1,step=a.stride*(i%2?.22:-.22);
      const offset=(x+step*.7)*width;
      const ground=project(a.x+Math.cos(yaw)*offset,a.z-Math.sin(yaw)*offset,0);
      const hoofX=ground?(ground.x-p.x)/(p.s*width):x+step*.7;
      const hoofY=ground?(ground.y-p.y)/p.s:0;
      stroke(c,x,-.9,x+step,-.39+hoofY*.4,.084,i%2?coat:'#785f48');
      stroke(c,x+step,-.39+hoofY*.4,hoofX,hoofY,.06,'#6e5946');
    }
    oval(c,-.03,-.97,.61,.27,.02,coat);oval(c,.43,-1.22,.15,.43,.41,coat);
    oval(c,.64,-1.55,.22,.135,.2,coat);oval(c,.51,-1.73,.066,.17,-.5,coat);oval(c,.68,-1.74,.06,.16,.32,coat);
    oval(c,.8,-1.53,.06,.055,0,'#514539');oval(c,.66,-1.6,.024,.026,0,'#322e27');
    oval(c,-.57,-.9,.10,.13,.35,'#e1d0b0');
  }
  c.restore();
}
export function addForestLayers(layers,c,project,w,h,time,yaw,pet=null){
  for(const tree of firs){
    const p=project(tree.x,tree.z,0);
    if(!p||p.x+p.s*tree.width/2<0||p.x-p.s*tree.width/2>w||p.y<0||p.y-p.s*tree.height>h)continue;
    layers.push({...tree,projected:p,cover:{halfWidth:tree.width/2,above:tree.height,below:.2},draw:()=>{
      const art=treeArt[tree.variant]??=paintFir(tree.variant);
      c.drawImage(art,p.x-tree.width*p.s/2,p.y-tree.height*p.s,tree.width*p.s,tree.height*p.s);
    }});
  }
  addUnderstory(layers,c,project,w,h,ferns);
  for(const [id,moving] of wildlifeAt(time).entries()){
    const elapsed=pet?.id===id ? time-pet.start : Infinity;
    const touching=elapsed>=0 && elapsed<1.5;
    const waiting=pet?.small && pet.id===id && (pet.start===Infinity || elapsed<2);
    const blend=waiting?Math.max(0,Math.min(1,(elapsed-1.5)*2)):1;
    const a=waiting?{...moving,x:pet.x+(moving.x-pet.x)*blend,z:pet.z+(moving.z-pet.z)*blend,hop:0,stride:0,frame:0}:touching?{...moving,hop:0,stride:0,frame:0}:moving;
    const p=project(a.x,a.z,0);if(!p||p.x<-p.s||p.x>w+p.s||p.y<0||p.y>h+p.s*2)continue;
    const height=a.rabbit?.64:a.fox?.95:1.92;
    const half=a.rabbit?.35:a.fox?.75:.88;
    const foot=p.y-(a.rabbit?a.hop:0)*p.s;
    const pad=Math.max(3,Math.min(10,12-p.s*half));
    const wildlife={id,name:a.rabbit?'토끼':a.fox?'여우':'사슴',left:p.x-half*p.s-pad,right:p.x+half*p.s+pad,top:foot-height*p.s-pad,bottom:foot+pad};
    layers.push({...a,wildlife,projected:p,cover:{halfWidth:1.2,above:2.7,below:.2},draw:()=>{
      drawAnimal(c,p,a,yaw,project);
      if(touching){
        c.save();
        const size=Math.max(14,Math.min(34,p.s*.55));
        c.font=size+'px sans-serif';c.textAlign='center';
        if(!pet.small)c.fillText('✋',p.x+Math.sin(elapsed*12)*size*.32,foot-height*p.s*.70);
        c.fillStyle='#ed8391';c.globalAlpha=1-elapsed/1.5;
        c.fillText('♥',p.x,foot-height*p.s-elapsed*size*.7);
        c.restore();
      }
    }});
  }
}

// Repeat small plant communities across the grove with open spaces between them.
const birchPlants=[];
const plantRandom=generator(93213);
for(const tree of birches){
  const kind=plantRandom();
  for(let i=0;i<4;i++){
    const x=tree.x+(plantRandom()-.5)*7,z=tree.z+(plantRandom()-.5)*7;
    if(isWater({x,z},1)||Math.hypot(x-tree.x,z-tree.z)<.65)continue;
    const variant=Math.floor(plantRandom()*3);
    const id=kind<.5?variant:kind<.76?5+variant:8+variant;
    birchPlants.push({x,z,id,width:(id>=8?.72:1.15)+plantRandom()*.8});
  }
}
// Small independent islands of ferns and flowers spill into the meadow.
for(let i=0;i<160;i++){
  const z=81+plantRandom()*126,x=birchCenter(z)+(plantRandom()-.5)*82;
  const depth=birchDepth(x,z);
  if(depth>5||depth< -9)continue;
  const id=i%3===0?8+i%2:i%5;
  for(let j=0;j<3;j++){
    const plant={x:x+(plantRandom()-.5)*3,z:z+(plantRandom()-.5)*3,id,width:.7+plantRandom()*.65};
    if(!isWater(plant,1))birchPlants.push(plant);
  }
}
function paintUnderstory(id){
  if(id<5)return paintFern(id);
  const canvas=document.createElement('canvas');
  canvas.width=140;canvas.height=76;
  const c=canvas.getContext('2d'),rand=generator(12017+id*187);
  const bush=id<8;
  for(let i=0;i<(bush?34:20);i++){
    const x=14+112*rand(),y=10+rand()*28+Math.abs(x-70)*.28;
    const root=bush?70:x+rand()*12-6;
    stroke(c,root,74,x,y,bush?2:1.4,bush?'#716547':'#59864e');
    for(let j=1;j<=5;j++){
      const u=j/5;
      oval(c,root+(x-root)*u,74+(y-74)*u,bush?6:3,bush?3:1.7,j%2?.6:-.7,['#496944','#688850','#829956'][j%3]);
    }
    if(!bush){
      const color=['#af87c7','#e4c35d','#dccce5'][id-8];
      for(let petal=0;petal<5;petal++){
        const angle=petal*TAU/5;
        oval(c,x+2.4*Math.cos(angle),y+2.4*Math.sin(angle),2.4,1.6,angle,color);
      }
      oval(c,x,y,1.4,1.4,0,'#d9ae50');
    }
  }
  return canvas;
}
for(const plant of [...ferns,...birchPlants])plant.atDen=atDen(plant.x,plant.z,1.15);
function addUnderstory(layers,c,project,w,h,plants){
  for(const fern of plants){
    if(fern.atDen)continue;
    const p=project(fern.x,fern.z,0);
    if(!p||p.s<3||p.x<-p.s*2||p.x>w+p.s*2||p.y<0||p.y>h+p.s*2)continue;
    const width=p.s*fern.width*1.5;
    layers.push({...fern,projected:p,cover:{halfWidth:fern.width*.75,above:fern.width*.80,below:.08},draw:()=>c.drawImage(fernArt[fern.id]??=paintUnderstory(fern.id),p.x-width/2,p.y-width*.52,width,width*.52)});
  }
}
const birchArt=[];
function paintBirch(id){
  const canvas=document.createElement('canvas');
  canvas.width=180;canvas.height=400;
  const c=canvas.getContext('2d'),random=generator(71380+id*181);
  const lean=(random()-.5)*30;
  const axis=y=>90+lean*(1-y/395);
  // A tapered ivory trunk and broken charcoal bands under an airy canopy.
  polygon(c,[[84,394],[axis(24)-1,24],[axis(24)+1,24],[96,394]],'#eeeadd');
  for(let i=0;i<46;i++){
    const y=30+random()*361,r=1+5*y/395,side=i%2?1:-1;
    stroke(c,axis(y)-side*r,y,axis(y)+side*r*(random()-.35),y-1,1+random()*2,'#57594f');
  }
  let lowestBranch=0;
  for(let i=0;i<39;i++){
    const u=random(),y=20+u*180,side=i%2?1:-1;
    const x=axis(y)+side*(7+Math.sin(Math.PI*u)*62)*(.5+.5*random()),tip=y-12-random()*28;
    lowestBranch=Math.max(lowestBranch,Math.ceil(y+26+2));
    stroke(c,axis(y),y+26,x,tip,1+u,'#777a60');
    for(let j=0;j<26;j++){
      const angle=random()*TAU,r=Math.sqrt(random());
      oval(c,x+Math.cos(angle)*r*14,tip+Math.sin(angle)*r*15,2+random()*4,2+random()*3,angle,
        ['#66824c','#83a45b','#a7bf70','#bad183'][j%4]);
    }
  }
  // Soft moss, grass blades and occasional flower clusters at the roots.
  oval(c,90,395,26,4,0,'#80935880');
  for(let i=0;i<28;i++){
    const x=66+random()*49,y=394+random()*4;
    stroke(c,x,y,x+random()*6-3,y-3-random()*6,1.5,'#78944d');
    if(id%3&&i%4===0)oval(c,x,y-7,2,2.6,0,id%3===1?'#ab82c8':'#ebca60');
  }
  return {canvas,lowestBranch};
}
// Overlapping low patches give the grove a continuous ground layer.
const grassArt=[];
const grassRows=[];
const grassRandom=generator(52931);
for(let z=77;z<211;z+=1.8){
  const patches=[];
  for(let offset=-46;offset<=46;offset+=2.35){
    const pz=z+(grassRandom()-.5)*.75;
    const x=birchCenter(pz)+offset+(grassRandom()-.5)*.85;
    const depth=birchDepth(x,pz)+4*Math.sin(pz*.20+x*.32);
    const density=Math.min(1,Math.max(0,(depth+7)/17));
    if(grassRandom()>=density||isWater({x,z:pz},2))continue;
    patches.push({x,z:pz,
      width:(3.8+grassRandom()*.9)*(.42+.58*density),variant:Math.floor(grassRandom()*8)});
  }
  grassRows.push(patches.filter(p=>!atDen(p.x,p.z,1.45)));
}
function paintGrassPatch(variant){
  const art=document.createElement('canvas');
  art.width=160;art.height=64;
  const c=art.getContext('2d'),random=generator(8371+variant*797);
  const tones=['#526d40','#648047','#75904f','#859a58','#9ba969'];
  for(let i=0;i<210;i++){
    const angle=random()*TAU,r=Math.sqrt(random());
    const x=80+Math.cos(angle)*r*70,y=39+Math.sin(angle)*r*21;
    const height=(6+random()*17)*(1-.45*r);
    oval(c,x,y,7,2.4,0,'#67814877');
    for(let blade=0;blade<3;blade++){
      const bend=(random()-.5)*14;
      polygon(c,[[x-1.5,y],[x+bend*.3,y-height*.52],[x+bend,y-height],[x+1.3,y]],tones[Math.floor(random()*tones.length)]);
    }
  }
  return art;
}
function addGrassCarpet(layers,c,project,w,h){
  for(const row of grassRows){
    for(const patch of row){
      const p=project(patch.x,patch.z,0);
      if(!p)continue;
      const width=patch.width*p.s,height=width*.28;
      if(p.x+width/2<0||p.x-width/2>w||p.y+height*.35<0||p.y-height*.65>h)continue;
      layers.push({x:patch.x,z:patch.z,projected:p,cover:{halfWidth:patch.width/2,above:.55,below:.4},draw:()=>{
        const art=grassArt[patch.variant]??=paintGrassPatch(patch.variant);
        c.drawImage(art,p.x-width/2,p.y-height*.65,width,height);
      }});
    }
  }
}
export function addBirchLayers(layers,c,project,w,h){
  addGrassCarpet(layers,c,project,w,h);
  addUnderstory(layers,c,project,w,h,birchPlants);
  for(const tree of birches){
    const p=project(tree.x,tree.z,0);
    if(!p)continue;
    const width=tree.width*p.s,scale=tree.height*p.s/400;
    if(p.x+width/2<0||p.x-width/2>w||p.y<0||p.y-600*scale>h)continue;
    const {canvas,lowestBranch}=birchArt[tree.variant]??=paintBirch(tree.variant);
    const root=394,extra=(root-lowestBranch)*.5;
    const height=(canvas.height+extra)*scale;
    if(p.y-height>h)continue;
    layers.push({...tree,projected:p,cover:{halfWidth:tree.width/2,above:height/p.s,below:.2},draw:()=>{
      const x=p.x-width/2,top=p.y-height;
      // Keep leaves and root vegetation at their painted scale.
      c.drawImage(canvas,0,0,canvas.width,lowestBranch,x,top,width,lowestBranch*scale);
      c.drawImage(canvas,0,lowestBranch,canvas.width,root-lowestBranch,
        x,top+lowestBranch*scale,width,(root-lowestBranch)*1.5*scale);
      c.drawImage(canvas,0,root,canvas.width,canvas.height-root,
        x,p.y-(canvas.height-root)*scale,width,(canvas.height-root)*scale);
    }});
  }
}
