import * as THREE from '../vendor/three/three.module.js';
import {createBuildingBuilder} from './building-models.js?v=lodge-eyes-2';
import {LODGE_ROOM,FLIGHT} from '../game/lodge-layout.js?v=lodge-flight-1';

// Local floor coordinates are shared with the walking controller. Windows are
// genuine openings: the live meadow is rendered behind this opaque room shell.
export function createLodgeRoomModel(floor=1){
  const b=createBuildingBuilder('lodge'),p=b.palette,{box,beam,sphere,add,material}=b;
  const H=floor===1?LODGE_ROOM.floorHeight:LODGE_ROOM.height,D=LODGE_ROOM.depth;
  const linen=material('linen','#eee1bd'),fabric=material('sage upholstery','#8c9c7c'),iron=material('stove iron','#514d40');
  const terracotta=material('terracotta','#b37f60'),paper=material('book paper','#e9d9ae'),red=material('book red','#a36953');
  const cylinder=(name,x,y,z,r,h,mat,rotation)=>add(new THREE.CylinderGeometry(r,r,h,12),mat,name,x,y,z,rotation);
  function wall(name,axis,fixed,start,end,openings){
    const us=[...new Set([start,end,...openings.flatMap(o=>[o[0],o[1]])])].sort((a,b)=>a-b);
    const ys=[...new Set([0,H,...openings.flatMap(o=>[o[2],o[3]])])].sort((a,b)=>a-b);
    for(let i=1;i<us.length;i++)for(let j=1;j<ys.length;j++){
      const u=(us[i-1]+us[i])/2,y=(ys[j-1]+ys[j])/2;
      if(openings.some(o=>u>o[0]&&u<o[1]&&y>o[2]&&y<o[3]))continue;
      if(axis==='x')box(name,u,y,fixed,us[i]-us[i-1],ys[j]-ys[j-1],.18,p.wall);
      else box(name,fixed,y,u,.18,ys[j]-ys[j-1],us[i]-us[i-1],p.wall);
    }
  }
  function windowFrame(axis,fixed,u,w,sill,top){
    const at=(name,u,y,span,height,mat=p.frame)=>axis==='x'?box(name,u,y,fixed,span,height,.13,mat):box(name,fixed,y,u,.13,height,span,mat);
    const middle=(sill+top)/2;
    for(const side of [-1,1])at('window jamb',u+side*w/2,middle,.1,top-sill+.16);
    for(const y of [sill,middle,top])at('window frame',u,y,w+.17,.09);
    at('window mullion',u,middle,.065,top-sill);
    for(const side of [-1,1])at('linen curtain',u+side*(w/2+.14),middle,.23,top-sill+.2,fabric);
  }
  const sill=floor===1?1.5:1.1,top=floor===1?3.15:3.05;
  const front=[[-4.48,-2.82,sill,top],[2.82,4.48,sill,top],[-1.1,1.1,0,3.1]];
  const back=[[-4.4,-2.8,sill,top],[2.8,4.4,sill,top]];
  const sideWindows=[[2.55,4.05,sill,top],[9.15,10.65,sill,top]];
  wall('front room wall','x',0,-5.5,5.5,front);wall('back room wall','x',D,-5.5,5.5,back);
  for(const side of [-1,1])wall('side room wall','z',side*5.5,0,D,sideWindows);
  for(const x of [-3.65,3.65])windowFrame('x',.1,x,1.66,sill,top);
  for(const x of [-3.6,3.6])windowFrame('x',D-.1,x,1.6,sill,top);
  for(const side of [-1,1])for(const z of [3.3,9.9])windowFrame('z',side*5.39,z,1.5,sill,top);
  // Floor and ceiling stay closed around the real stair opening at the rear.
  const slab=(name,y,mat)=>{
    box(name,-1.275,y,D/2,8.45,.16,D,mat);
    box(name,4.225,y,FLIGHT.opening/2,2.55,.16,FLIGHT.opening,mat);
  };
  if(floor===1)box('closed wooden floor',0,-.04,D/2,11,.16,D,p.trim);
  else slab('upper wooden floor',-.04,p.trim);
  if(floor===1)slab('closed ceiling',LODGE_ROOM.height,p.wood);
  else box('closed ceiling',0,H,D/2,11,.17,D,p.wood);
  for(let z=.25;z<D;z+=.65){
    const width=floor===2&&z>FLIGHT.opening?8.4:10.95,x=floor===2&&z>FLIGHT.opening?-1.275:0;
    box('floor board seam',x,.047,z,width,.008,.015,p.wood);
  }
  for(const z of [1.3,5.9,10.25]){
    const cut=floor===1&&z>FLIGHT.opening;
    box('ceiling beam',cut?-1.275:0,LODGE_ROOM.height-.17,z,cut?8.45:11,.24,.2,p.wood);
  }
  for(const side of [-1,1])box('wall skirting',side*5.38,.17,D/2,.09,.24,D,p.trim);
  box('back wall skirting',0,.17,D-.12,10.8,.24,.09,p.trim);
  for(const side of [-1,1])box('front wall skirting',side*3.25,.17,.12,4.3,.24,.09,p.trim);
  for(const x of [-1.15,1.15])box('door frame',x,1.57,.1,.13,3.25,.16,p.wood);
  box('door lintel',0,3.16,.1,2.4,.14,.16,p.wood);
  if(floor===1){
    // The leaf swings outward from the left jamb; its full width runs along z.
    box('open front door',-1.06,1.5,-1.05,.10,3,2.1,p.door);
    for(const z of [-.35,-1.05,-1.75])box('open door stile',-1,1.5,z,.04,2.8,.06,p.trim);
    sphere('open door handle',-.94,1.4,-1.85,.075,.075,.075,p.straw);
  }else{
    box('balcony deck',0,-.04,-.8,8.3,.16,1.65,p.trim);
    for(let x=-4.05;x<=4.06;x+=.81)box('balcony spindle',x,.59,-1.6,.09,1.18,.09,p.wood);
    box('balcony handrail',0,1.18,-1.6,8.4,.14,.14,p.wood);
    for(const x of [-4.05,4.05]){
      box('balcony side rail',x,1.18,-.8,.12,.13,1.65,p.wood);
      for(const z of [-.8,-.08])box('balcony side post',x,.6,z,.1,1.2,.1,p.wood);
    }
  }
  // One flight serves both storeys, with room to turn left at the top.
  if(floor===1){
    const rise=LODGE_ROOM.floorHeight,run=FLIGHT.back-FLIGHT.front,going=run/FLIGHT.steps;
    for(let i=0;i<FLIGHT.steps;i++){
      const top=(i+1)/FLIGHT.steps*rise,z=FLIGHT.front+(i+.5)*going;
      box('stair tread',FLIGHT.x,top-rise/FLIGHT.steps/2,z,FLIGHT.width,rise/FLIGHT.steps,going+.01,p.trim);
      box('stair nosing',FLIGHT.x,top-.025,z-going/2,FLIGHT.width+.025,.05,.055,p.wood);
    }
    box('top landing',3.8,rise-.09,(FLIGHT.back+D)/2,1.9,.18,D-FLIGHT.back);
    for(const x of [3.02,4.58])beam('stair stringer',[x,-.12,FLIGHT.front],[x,rise-.12,FLIGHT.back],.18,p.wood);
    for(const f of [.02,.36,.69,.98]){
      const y=f*rise,z=FLIGHT.front+f*run;
      beam('stair rail post',[4.72,y,z],[4.72,y+.8,z],.09,p.wood);
    }
    beam('stair handrail',[4.72,.8,FLIGHT.front],[4.72,rise+.8,FLIGHT.back],.12,p.wood);
  }else{
    const end=FLIGHT.back-.2;
    for(const z of [FLIGHT.opening,end])box('stairwell post',2.95,.55,z,.1,1.1,.1,p.wood);
    box('stairwell left rail',2.95,1.1,(FLIGHT.opening+end)/2,.12,.12,end-FLIGHT.opening,p.wood);
  }

  if(floor===1){
    // A real bed, separate mattress, pillows and folded blanket.
    box('bed frame',-3.62,.38,4.85,2.7,.3,3.9,p.wood);
    box('linen mattress',-3.62,.64,4.85,2.47,.35,3.65,linen);
    box('headboard',-3.62,.99,6.7,2.72,1.25,.15,p.wood);
    box('sage blanket',-3.62,.85,4.22,2.47,.08,2.45,fabric);
    for(const x of [-4.2,-3.1])box('pillow',x,.89,6.05,.9,.22,.7,linen);
    for(const x of [-4.7,-2.55])for(const z of [3.18,6.52])box('bed leg',x,.2,z,.15,.4,.15,p.wood);
    box('table top',3.425,.96,4.275,2.75,.15,2.55,p.trim);
    for(const x of [2.3,4.55])for(const z of [3.25,5.3])box('table leg',x,.48,z,.14,.96,.14,p.wood);
    cylinder('tea mug',3.22,1.17,4,.13,.25,linen);
    add(new THREE.TorusGeometry(.09,.025,6,12),p.trim,'mug handle',3.39,1.17,4,[0,Math.PI/2,0]);
    box('table book',3.8,1.08,4.7,.7,.09,.9,red);
    box('table pages',3.8,1.11,4.7,.65,.04,.85,paper);
    box('washstand',-4.15,.72,1.55,1.7,1.4,1.3,p.wood);
    cylinder('wash basin',-4.15,1.46,1.55,.55,.12,linen);
    cylinder('basin water',-4.15,1.53,1.55,.43,.015,material('water ceramic','#9bbdb6'));
    beam('water tap',[-4.75,1.4,1.6],[-4.75,1.85,1.6],.07,p.stone);
    beam('tap spout',[-4.75,1.85,1.6],[-4.4,1.85,1.6],.07,p.stone);
    for(const y of [.2,1.15,2.1,3.05])box('book shelf',-4.4,y,10.35,1.3,.12,2.7,p.wood);
    for(const z of [9,11.7])box('bookcase side',-4.4,1.6,z,1.3,3.2,.1,p.wood);
    for(let i=0;i<9;i++)box('book spine',-3.71,1.55,9.25+i*.27,.07,.65+(i%3)*.13,.18,i%3===0?red:i%3===1?fabric:paper);
    box('stone hearth',4.05,.1,7.9,2,.2,2,p.stone);
    box('iron stove',4.05,.85,7.9,1.35,1.4,1.25,iron);
    box('stove glass',4.05,.85,7.255,.9,.75,.04,p.dark);
    box('stove fire',4.05,.72,7.224,.61,.28,.02,material('warm fire','#ddad61'));
    cylinder('stove chimney',4.05,2.6,8.15,.14,2.6,iron);
    for(const x of [-1.65,1.65]){
      box('dog bed',x,.13,11.9,1.8,.2,1.55,terracotta);
      box('dog blanket',x,.25,11.9,1.55,.08,1.3,fabric);
    }
    box('woven rug',0,.061,6.6,3.25,.015,5.7,fabric);
    for(const x of [-1.45,1.45])box('rug border',x,.073,6.6,.06,.012,5.5,linen);
  }else{
    box('reading bench base',-3.68,.38,4.05,2.35,.24,2.1,p.wood);
    box('reading cushion',-3.68,.57,4.05,2.2,.2,1.9,fabric);
    box('bench back',-4.75,1.05,4.05,.18,1.05,2.1,p.wood);
    for(const z of [3.15,4.95])box('bench leg',-3.68,.19,z,2.1,.38,.12,p.wood);
    cylinder('reading table',0,.7,6.87,.83,.13,p.trim);
    for(const x of [-.5,.5])for(const z of [6.45,7.25])box('small table leg',x,.35,z,.1,.7,.1,p.wood);
    box('open journal',0,.8,6.87,.7,.04,.85,paper);
    box('journal spine',0,.83,6.87,.025,.02,.85,p.wood);
    box('upstairs cabinet',-4.5,1.0,10.6,1.1,2,2.6,p.wood);
    for(const z of [9.9,11.2])box('cabinet panel',-3.92,1.1,z,.06,1.55,1.05,p.door);
    box('upper woven rug',0,.061,4.3,3.4,.015,4.5,fabric);
    const tx=2.9,tz=-.85;
    for(const [dx,dz] of [[-.3,.25],[.3,.25],[0,-.3]])beam('telescope tripod',[tx+dx,.06,tz+dz],[tx,1.05,tz],.06,p.wood);
    const scope=cylinder('telescope barrel',tx,1.3,tz,.13,.8,p.door,[Math.PI/2+.25,0,-.25]);
    scope.name='balcony telescope';
  }
  // Hanging light and framed pastoral artwork give scale without floating labels.
  beam('lamp cord',[0,H,7.8],[0,3.22,7.8],.025,p.wood);
  cylinder('lamp shade',0,3.15,7.8,.35,.24,linen);
  sphere('warm lamp',0,3.01,7.8,.18,.12,.18,p.straw);
  box('picture frame',0,2.3,D-.13,1.8,1.2,.09,p.wood);
  box('pastoral picture',0,2.3,D-.19,1.57,.97,.03,fabric);
  box('picture sky',0,2.51,D-.215,1.52,.45,.015,linen);
  const model=b.finish();model.name='lodge interior '+floor;model.userData.floor=floor;return model;
}
