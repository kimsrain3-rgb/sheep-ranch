import * as THREE from '../vendor/three/three.module.js';
import {RAIL_TOP,TRACK_CURVE,TRACK_GAUGE,STATION_FLOOR_TOP,TRAM_PLATFORM,TRAM_STATION,TRAM_STOP} from '../game/tram-station.js';
import {cabinOak,mapOakBoard} from './tram-oak.js';
import {builder} from './building-models.js?v=tram-station-1';

const letters={
  바:[[[.12,.92],[.12,.34],[.44,.34],[.44,.92]],[[.12,.66],[.44,.66]],[[.68,.99],[.68,.06]],[[.68,.60],[.90,.60]]],
  람:[[[.09,.94],[.46,.94],[.46,.76],[.12,.76],[.12,.57],[.48,.57]],[[.70,.99],[.70,.48]],[[.70,.75],[.91,.75]],[[.24,.35],[.73,.35],[.73,.07],[.24,.07],[.24,.35]]],
  목:[[[.18,.95],[.79,.95],[.79,.69],[.18,.69],[.18,.95]],[[.48,.69],[.48,.49]],[[.12,.49],[.86,.49]],[[.18,.28],[.77,.28],[.77,.04]]],
  장:[[[.09,.91],[.50,.91]],[[.30,.91],[.10,.51]],[[.30,.91],[.52,.53]],[[.68,.97],[.68,.45]],[[.68,.72],[.92,.72]],[[.28,.33],[.61,.35],[.76,.25],[.72,.09],[.42,.05],[.24,.13],[.28,.33]]],
  역:[[[.14,.84],[.30,.95],[.48,.84],[.48,.65],[.31,.54],[.14,.65],[.14,.84]],[[.76,.99],[.76,.49]],[[.48,.83],[.76,.83]],[[.48,.65],[.76,.65]],[[.20,.29],[.78,.29],[.78,.04]]],
  북:[[[.17,.99],[.17,.71],[.79,.71],[.79,.99]],[[.17,.85],[.79,.85]],[[.12,.55],[.86,.55]],[[.49,.55],[.49,.35]],[[.18,.21],[.77,.21],[.77,.02]]],
  극:[[[.18,.94],[.78,.94],[.78,.66]],[[.12,.50],[.86,.50]],[[.18,.29],[.77,.29],[.77,.04]]],
  사:[[[.32,.94],[.30,.61],[.08,.21]],[[.30,.61],[.52,.29]],[[.69,.99],[.69,.04]],[[.69,.58],[.92,.58]]],
  막:[[[.09,.93],[.49,.93],[.49,.52],[.09,.52],[.09,.93]],[[.68,.99],[.68,.44]],[[.68,.73],[.91,.73]],[[.17,.29],[.78,.29],[.78,.04]]],
  정:[[[.07,.91],[.52,.91]],[[.33,.91],[.09,.48]],[[.31,.79],[.52,.53]],[[.77,.98],[.77,.44]],[[.55,.72],[.77,.72]],[[.31,.32],[.58,.35],[.72,.24],[.68,.10],[.47,.05],[.28,.12],[.24,.23],[.31,.32]]],
  글:[[[.16,.96],[.78,.96],[.78,.69]],[[.09,.56],[.91,.56]],[[.18,.39],[.78,.39],[.78,.22],[.18,.22],[.18,.05],[.81,.05]]],
  행:[[[.20,.97],[.34,.97]],[[.07,.81],[.48,.81]],[[.18,.71],[.36,.71],[.42,.59],[.34,.48],[.18,.48],[.12,.59],[.18,.71]],[[.60,.96],[.60,.47]],[[.60,.72],[.80,.72]],[[.80,.96],[.80,.44]],[[.37,.32],[.64,.35],[.79,.25],[.74,.10],[.46,.06],[.29,.15],[.37,.32]]]
};

function signLetters(model,text,x,y,z,side,height,material){
  const step=height*1.02;
  for(const [index,char] of [...text].entries()){
    const center=z+side*(index-(text.length-1)/2)*step;
    for(const line of letters[char]){
      const point=([u,v])=>[x,y+(v-.5)*height,center+side*(u-.5)*height];
      for(let i=1;i<line.length;i++)model.beam('painted sign stroke',point(line[i-1]),point(line[i]),height*.071,material);
    }
  }
}

export function createTramStation(){
  const {depth:width,width:depth,wallThickness,benchDepth}=TRAM_STATION;
  const b=builder('station',{width:TRAM_STATION.width,depth:TRAM_STATION.depth,eave:2.74,ridge:3.39});
  const {box,beam,add}=b;
  const timber=['#74654d','#7d6b52','#695943','#847357'].map((color,i)=>b.material('weathered cedar '+i,color));
  const framing=b.material('structural timber','#524536');
  const roof=b.material('weathered graphite roof','#43423d');
  const ribs=b.material('raised roofing seams','#59554b');
  const red=b.material('worn burgundy enamel','#853932');
  const ivory=b.material('sign and painted sheep','#ead8ac');
  const green=b.material('old green noticeboard','#435946');
  const stone=b.material('porous step stone','#a19b85');
  const left=-width/2,right=width/2,half=depth/2;
  const eave=2.74,ridge=3.39,overhang=half+.37,rise=ridge-eave;
  const roofLength=width+.91,roofCenter=-.12;
  const groove=b.material('dark cedar grain','#685942');
  const j=i=>timber[(i*7+Math.floor(i/4))%timber.length];

  box('station stone sill',0,.042,0,width,.084,depth,stone);
  box('low entrance step',left-.12,.022,0,.30,.044,1.82,stone);
  for(let i=0;i<12;i++){
    const pitch=depth/12;
    box('worn platform floorboard',0,STATION_FLOOR_TOP-pitch*.055/2,-half+(i+.5)*pitch,width,pitch*.055,pitch-.007,j(i));
    box('back wall vertical cedar board',right-wallThickness/2,1.397,-half+(i+.5)*pitch,
      wallThickness,2.61,pitch-.008,j(i+3));
  }

  for(const side of [-1,1]){
    const z=side*(half-wallThickness/2);
    for(const x of [left+.075,right-.075])box('heavy corner post',x,1.406,z,.15,2.73,.15,framing);
    for(let i=0;i<15;i++){
      const pitch=width/15;
      const x=left+(i+.5)*pitch;
      box('side wall vertical cedar board',x,1.401,z,pitch-.009,2.60,.086,j(i+side+1));
      const grainOffset=((i*5)%7-3)*.022;
      for(const face of [-1,1]){
        box('faint cedar grain',x+grainOffset,.68+(i%4)*.19,z+face*.044,.009,.46+(i%5)*.22,.005,groove);
      }
    }
    box('side wall sill',0,.22,z,width,.126,.115,framing);
    box('eaves beam',0,2.70,z,width+.23,.144,.143,framing);
    const angle=-side*Math.atan2(rise,overhang);
    const slant=Math.hypot(rise,overhang);
    box('corrugated graphite roof',roofCenter,(ridge+eave)/2,side*overhang/2,roofLength,.073,slant,roof,[angle,0,0]);
    const snow=box('snow on roof',roofCenter,(ridge+eave)/2+.047,side*overhang/2,roofLength-.09,.043,slant-.04,b.palette.snow,[angle,0,0]);
    snow.userData.snow=true;
    for(let i=0;i<25;i++){
      const x=roofCenter-roofLength/2+(i+.5)*roofLength/25;
      box('roof corrugation seam',x,(ridge+eave)/2+.044,side*overhang/2,.024,.026,slant,ribs,[angle,0,0]);
    }
    for(const x of [left-.58,left+.28,.2,right+.24]){
      beam('exposed rafter',[x,ridge-.05,0],[x,eave-.06,side*overhang],.107,framing);
    }
  }
  box('ridge cover',roofCenter,ridge+.044,0,roofLength+.06,.069,.139,ribs);
  box('open entrance lintel',left+.075,2.679,0,.154,.116,depth,framing);
  beam('gable diagonal brace',[left+.074,2.70,-.78],[left+.074,3.03,0],.075,timber[1]);
  beam('gable diagonal brace',[left+.074,2.70,.78],[left+.074,3.03,0],.075,timber[1]);
  box('back wall crosspiece',right-.168,1.31,0,.081,.096,depth-.09,framing);
  for(let i=0;i<4;i++){
    box('shelter bench seat',right-wallThickness-benchDepth+(i+.49)*benchDepth/4,.48,0,
      benchDepth/4-.008,.061,depth-.44,j(i+4));
  }
  for(const z of [-.98,.98])box('shelter bench support',right-wallThickness-benchDepth/2,.275,z,
    benchDepth-.05,.392,.124,framing);

  const signX=left-.19,signZ=half-.33;
  beam('round sign hanger',[left-.02,2.67,signZ],[signX,2.44,signZ],.047,framing);
  add(new THREE.CylinderGeometry(.305,.305,.065,36),ivory,'round station sign rim',signX,2.27,signZ,[0,0,Math.PI/2]);
  add(new THREE.CylinderGeometry(.274,.274,.083,36),red,'red round station sign',signX,2.27,signZ,[0,0,Math.PI/2]);
  signLetters(b,'바람',signX-.045,2.341,signZ,-1,.124,ivory);
  signLetters(b,'목장역',signX-.045,2.179,signZ,-1,.112,ivory);

  const board=right-wallThickness-.04,boardHeight=1.51;
  box('framed noticeboard',board,boardHeight,-.48,.071,.88,1.10,framing);
  box('green station noticeboard',board-.043,boardHeight,-.48,.03,.79,1.01,green);
  for(const [z,ry,rz] of [[-.66,.16,.24],[-.78,.145,.155],[-.52,.139,.176]]){
    b.sphere('painted wool',board-.065,boardHeight+.048,z,.018,ry,rz,ivory);
  }
  b.sphere('painted sheep face',board-.068,boardHeight+.035,-.37,.021,.089,.087,framing);
  for(const z of [-.77,-.55])beam('painted sheep leg',[board-.064,boardHeight-.085,z],[board-.063,boardHeight-.17,z],.031,ivory);
  // Turn the shelter, its bench and its signs together to face the platform at lower world Z.
  const up=new THREE.Vector3(0,1,0);
  for(const part of b.root.children){
    part.position.applyAxisAngle(up,Math.PI/2);
    part.rotateOnWorldAxis(up,Math.PI/2);
  }
  return b.finish();
}

export function createTramPlatform(){
  const b=builder('tram-platform',{width:TRAM_PLATFORM.width,depth:TRAM_PLATFORM.depth});
  const {box,palette:p}=b;
  for(let i=0;i<36;i++){
    box('platform boards',-5.10+i*.29,TRAM_PLATFORM.height/2,0,.278,TRAM_PLATFORM.height,TRAM_PLATFORM.depth,i%3?p.trim:p.wood);
  }
  box('platform edge',0,.116,-.65,10.5,.095,.12,p.stone);
  box('bench seat',-2.65,.49,.38,1.18,.08,.37,p.wood);
  box('bench back',-2.65,.69,.54,1.18,.31,.08,p.wood);
  for(const x of [-3.08,-2.22])box('bench legs',x,.315,.38,.12,.364,.28,p.dark);
  return b.finish();
}

function roundedBody(builder,name,length,width,radius,y,height,material,bevel=.02){
  const l=length/2,w=width/2,r=radius;
  const shape=new THREE.Shape();
  shape.moveTo(-l+r,-w);
  shape.lineTo(l-r,-w);shape.quadraticCurveTo(l,-w,l,-w+r);
  shape.lineTo(l,w-r);shape.quadraticCurveTo(l,w,l-r,w);
  shape.lineTo(-l+r,w);shape.quadraticCurveTo(-l,w,-l,w-r);
  shape.lineTo(-l,-w+r);shape.quadraticCurveTo(-l,-w,-l+r,-w);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,curveSegments:4,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
  geometry.rotateX(-Math.PI/2);
  return builder.add(geometry,material,name,0,y,0);
}

const carriagePerimeter=[[-2.83,-.56],[-2.48,-.93],[2.48,-.93],[2.83,-.56],
  [2.83,.56],[2.48,.93],[-2.48,.93],[-2.83,.56]];

function carriageOutline(builder,name,y,height,material){
  // The end platforms have a flat center and two canted corner faces.
  const shape=new THREE.Shape()
    .moveTo(-2.83,-.56).lineTo(-2.48,-.93).lineTo(2.48,-.93)
    .lineTo(2.83,-.56).lineTo(2.83,.56).lineTo(2.48,.93)
    .lineTo(-2.48,.93).lineTo(-2.83,.56).closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}).rotateX(-Math.PI/2);
  builder.add(geometry,material,name,0,y,0);
}

function carriageSkin(b,name,y,height,material,boardingDoorOpen=false){
  for(let i=0;i<carriagePerimeter.length;i++){
    const start=carriagePerimeter[i],end=carriagePerimeter[(i+1)%carriagePerimeter.length];
    // The platform-side west bay must be open through the full body skin.
    const wallEnd=boardingDoorOpen&&start[1]===.93&&end[1]===.93 ? [-1.96,.93] : end;
    const face=tramFacade(b,start,wallEnd,1);
    face.panel(name,0,y,face.length+.026,height,-.037,material,.074);
  }
}

function tramFacade(builder,start,end,outward){
  const dx=end[0]-start[0],dz=end[1]-start[1],length=Math.hypot(dx,dz);
  const angle=Math.atan2(dz,dx);
  function place(geometry,material,name,u,y,offset){
    const x=(start[0]+end[0])/2+(dx*u+dz*offset*outward)/length;
    const z=(start[1]+end[1])/2+(dz*u-dx*offset*outward)/length;
    builder.add(geometry,material,name,x,y,z,[0,angle,0]);
  }
  function panel(name,u,y,w,h,offset,material,depth=.022){
    place(new THREE.BoxGeometry(w,h,depth),material,name,u,y,offset);
  }
  function windowProfile(path,w,h){
    const x=w/2,top=h/2,r=Math.min(w*.22,.11);
    return path.moveTo(-x,-top).lineTo(x,-top).lineTo(x,top-r)
      .quadraticCurveTo(x,top,x-r,top).lineTo(-x+r,top)
      .quadraticCurveTo(-x,top,-x,top-r).closePath();
  }
  function sash(name,y,w,h,offset,depth,material,opening){
    const shape=windowProfile(new THREE.Shape(),w,h);
    if(opening)shape.holes.push(windowProfile(new THREE.Path(),...opening));
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,curveSegments:5,bevelEnabled:false});
    geometry.translate(0,0,-depth/2);
    place(geometry,material,name,0,y,offset);
  }
  return {length,panel,sash};
}

function addTramCabin(b,{cream,iron,gold,lamp}){
  const {box,beam,add}=b;
  const dark=cabinOak('aged cabin joinery',.48);
  const honey=cabinOak('polished old oak seats',.31);
  const floor=cabinOak('scuffed cabin floor',.81);
  let joineryIndex=0;
  function board(name,x,y,z,w,h,d,material=dark,index=joineryIndex++){
    const variant=material===honey?'seat':material===floor?'floor':'trim';
    return mapOakBoard(box(name,x,y,z,w,h,d,material),variant,index);
  }
  board('cabin subfloor',0,.735,0,5.57,.094,1.70,dark);
  for(let i=0;i<21;i++){
    const inAisle=Math.abs(i-10)<=3;
    const floorRow=(inAisle?0:2)+(i%2);
    board('longitudinal floorboard',0,.785,-.82+i*.082,5.52,.024,.077,floor,4*i+floorRow);
  }
  for(const side of [-1,1]){
    for(let i=0;i<8;i++){
      board('long bench seat slat',-.003,1.083,side*(.418+i*.054),4.03,.049,.048,honey,i+(side+1)*3);
    }
    for(let i=0;i<7;i++){
      board('long bench back slat',0,1.135+i*.050,side*(.79+i*.007),4.06,.044,.036,honey,i+3+(side+1)*7);
    }
    for(const x of [-1.89,0,1.89]){
      box('bench cast iron footing',x,.937,side*.64,.108,.274,.36,iron);
      beam('rack bracket',[x,2.124,side*.864],[x,2.213,side*.639],.031,gold);
      beam('curved rail support',[x,2.210,side*.639],[x,2.269,side*.721],.024,iron);
    }
    for(const z of [.650,.727,.804]){
      beam('long brass luggage rail',[-2.02,2.218,side*z],[2.02,2.218,side*z],.023,gold);
    }
    for(const x of [-1.945,-1.295,-.645,.005,.655,1.305,1.955]){
      board('aged interior sash lining',x,1.919,side*.846,.091,.729,.025);
    }
    board('honey wood interior window sill',0,1.552,side*.869,4.08,.051,.124);
  }

  const ceilingHeight=z=>2.346-.102*(z/.91)**2;
  for(let i=0;i<16;i++){
    const a=(i/16-.5)*1.82,z=((i+1)/16-.5)*1.82;
    const dy=ceilingHeight(z)-ceilingHeight(a);
    box('curved ivory ceiling',0,(ceilingHeight(a)+ceilingHeight(z))/2,(a+z)/2,
      4.99,.032,Math.hypot(z-a,dy)+.009,cream,[Math.atan2(dy,z-a),0,0]);
  }
  for(const x of [-1.25,.15,1.52]){
    add(new THREE.CylinderGeometry(.09,.12,.064,16),iron,'ceiling lamp socket',x,2.305,0);
    b.sphere('warm glass ceiling bulb',x,2.242,0,.047,.066,.047,lamp);
  }

  for(const end of [-1,1]){
    const x=end*2.46;
    for(const side of [-1,1]){
      board('driver partition foot panel',x,1.077,side*.641,.075,.56,.435,dark);
      board('driver partition raised inset',x-end*.05,1.095,side*.643,.024,.365,.316);
      board('driver partition wood center',x-end*.066,1.095,side*.643,.022,.306,.249);
      for(const z of [.414,.853])board('driver partition frame',x,1.62,side*z,.075,1.66,.068);
      board('driver partition sash rail',x,1.481,side*.638,.077,.073,.446);
      board('driver partition sash rail',x,2.047,side*.638,.077,.077,.446);
    }
    board('driver door header',x,2.129,0,.091,.089,.824);
    const grilleWidth=.761;
    for(let i=0;i<12;i++){
      board('driver vent slat',x,2.266,((i+.5)/12-.5)*grilleWidth,.069,.159,.031,dark);
    }
    for(const y of [2.192,2.236,2.290,2.345]){
      board('driver vent cross rail',x,y,0,.084,.024,.798,honey);
    }
    board('driver console',end*2.664,1.163,0,.234,.385,.512,dark);
    beam('driver brake handle',[end*2.644,1.351,.173],[end*2.590,1.510,.195],.039,iron);
    b.sphere('driver brake knob',end*2.588,1.520,.198,.048,.038,.038,gold);
  }
}

const tramEndX=2.83;
const destinationBoardY=2.731;

// The original coach was drawn in miniature. Keep the axles and floor at
// rail height, widen the door bays and grow the occupied cabin to visitor scale.
function finishPassengerCoach(b){
  const floor=.797,roof=2.35,bayStart=1.96,bayEnd=2.48;
  const widthScale=1.19;
  const heightAt=y=>y+.79*Math.max(0,Math.min(y,roof)-floor)
    +.12*Math.max(0,y-roof);
  const lengthAt=x=>x*1.07+Math.sign(x)*.66*Math.max(0,Math.min(Math.abs(x),bayEnd)-bayStart);
  const point=new THREE.Vector3();
  for(const mesh of b.root.children){
    if(mesh.name==='rail wheel'||mesh.name==='wheel hub'){
      mesh.position.x=lengthAt(mesh.position.x);
      continue;
    }
    mesh.updateMatrix();
    const geometry=mesh.geometry;
    geometry.applyMatrix4(mesh.matrix);
    const position=geometry.attributes.position;
    const roundLamp=mesh.name==='brass headlight ring'||mesh.name==='single round headlight';
    const centerY=mesh.position.y;
    for(let i=0;i<position.count;i++){
      point.fromBufferAttribute(position,i);
      const y=roundLamp?heightAt(centerY)+(point.y-centerY)*widthScale:heightAt(point.y);
      position.setXYZ(i,lengthAt(point.x),y,point.z*widthScale);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    mesh.position.set(0,0,0);
    mesh.quaternion.identity();
    mesh.scale.set(1,1,1);
  }
  return b.finish();
}

export function createTramLettering(destination){
  const b=builder('tram-lettering');
  const ink=b.material('destination lettering','#f5e4ba');
  for(const side of [-1,1]){
    signLetters(b,destination+'행',side*(tramEndX+.050),destinationBoardY,0,side,.200,ink);
  }
  const mesh=finishPassengerCoach(b).children[0];
  mesh.name=destination+'행';
  return mesh;
}

export function createTram(boardingDoorOpen=false){
  const b=builder('tram',{width:TRAM_STOP.width,depth:TRAM_STOP.depth});
  const {box,add,beam}=b;
  const red=b.material('vermilion enamel','#a21d23'),redPanel=b.material('red painted wood','#b1272c');
  const claret=b.material('dark wine trim','#511e25'),cream=b.material('ivory window bands','#eddec3');
  const wood=b.material('honey varnished window frames','#965624'),edge=b.material('polished sash molding','#c28746');
  const gold=b.material('fine gold pinstripes','#d1a25c'),roof=b.material('wine-colored roof canvas','#633b44');
  const glass=b.material('smoke blue windows','#395356'),reflection=b.material('window sky highlights','#77908b');
  glass.transparent=true;
  glass.opacity=.21;
  glass.depthWrite=false;
  const iron=b.material('aged dark iron','#382e2a'),lamp=b.material('warm white lamp lens','#f5e4ba');

  beam('tram underframe',[-2.63,.46,0],[2.63,.46,0],.25,iron);
  for(const x of [-1.76,1.76])for(const side of [-1,1]){
    const z=side*TRACK_GAUGE/2;
    add(new THREE.CylinderGeometry(.28,.28,.14,16),iron,'rail wheel',x,RAIL_TOP+.28,z,[Math.PI/2,0,0]);
    add(new THREE.CylinderGeometry(.145,.145,.065,12),claret,'wheel hub',x,RAIL_TOP+.28,z+side*.09,[Math.PI/2,0,0]);
  }

  carriageOutline(b,'dark lower sill',.55,.13,claret);
  carriageSkin(b,'red wooden body',1.021,.682,red,boardingDoorOpen);
  carriageSkin(b,'brass waist pinstripe',1.369,.020,gold,boardingDoorOpen);
  carriageSkin(b,'ivory strip below windows',1.474,.194,cream,boardingDoorOpen);
  carriageSkin(b,'ivory strip above windows',2.348,.104,cream);
  for(const [x,z] of carriagePerimeter)box('ivory cabin corner post',x*.989,1.945,z*.978,.087,.790,.078,cream);
  addTramCabin(b,{cream,iron,gold,lamp});
  roundedBody(b,'curved dark roof eaves',5.91,1.97,.47,2.40,.074,claret,.030);
  roundedBody(b,'warm roof canvas',5.65,1.81,.46,2.48,.12,roof,.064);
  roundedBody(b,'rounded roof crest',5.18,1.38,.49,2.571,.066,roof,.058);
  box('trolley pole mount',-.78,2.66,0,.46,.087,.26,iron);
  beam('trolley pole',[-.79,2.70,0],[-2.27,3.12,0],.042,iron);
  add(new THREE.CylinderGeometry(.074,.074,.069,12),iron,'trolley collector wheel',-2.27,3.12,0,[Math.PI/2,0,0]);

  for(const side of [-1,1]){
    const z=side*.93;
    for(const x of [-1.945,-1.295,-.645,.005,.655,1.305,1.955]){
      box('ivory side window post',x,1.944,side*.892,.127,.797,.076,cream);
    }
    for(const x of [-1.62,-.97,-.32,.33,.98,1.63]){
      const wall=tramFacade(b,[x-.31,z],[x+.31,z],-side);
      wall.sash('side varnished sash',1.870,.58,.86,.021,.089,wood,[.479,.734]);
      wall.sash('side window bead',1.871,.499,.765,.065,.018,edge,[.448,.697]);
      wall.sash('side window pane',1.888,.451,.703,.059,.005,glass);
      wall.panel('side sash crossbar',0,2.071,.461,.030,.078,wood);
      wall.panel('side pane reflection',-.111,2.184,.135,.040,.080,reflection);
      wall.panel('gilt panel border',0,.981,.573,.393,.015,gold);
      wall.panel('vermilion inset panel',0,.981,.537,.358,.029,redPanel);
      box('gilt panel medallion',x,.98,z+side*.044,.075,.075,.024,gold,[0,0,Math.PI/4]);
      box('enamel medallion center',x,.98,z+side*.057,.041,.041,.019,red,[0,0,Math.PI/4]);
    }
    for(const x of [-2.22,2.22]){
      box('entry step',x,.56,side*.982,.48,.083,.13,iron);
      if(boardingDoorOpen&&side===1&&x<0){
        box('folded boarding door',x-.227,1.53,z-.10,.054,1.50,.22,wood);
        continue;
      }
      const door=tramFacade(b,[x-.25,z],[x+.25,z],-side);
      door.panel('door bottom oak panel',0,1.037,.462,.786,.028,wood);
      door.panel('door lower enamel panel',0,1.050,.385,.641,.050,red);
      door.sash('door upper oak frame',1.927,.484,.847,.019,.094,wood,[.347,.647]);
      door.sash('door upper glaze',1.927,.35,.652,.057,.005,glass);
      door.panel('folding door center rail',0,1.495,.033,1.596,.068,edge);
    }
  }

  for(const side of [-1,1]){
    const x=side*tramEndX;
    const center=tramFacade(b,[x,-.56],[x,.56],side);
    const left=tramFacade(b,[side*2.48,-.93],[x,-.56],side);
    const right=tramFacade(b,[x,.56],[side*2.48,.93],side);
    for(const face of [left,center,right]){
      face.sash('wraparound front varnished sash',1.893,face.length-.055,.897,.019,.090,wood,[face.length-.169,.791]);
      face.sash('front honey-colored window bead',1.907,face.length-.159,.804,.061,.021,edge,[face.length-.215,.738]);
      face.sash('front windscreen pane',1.924,face.length-.212,.741,.059,.005,glass);
      face.panel('front glass reflection',-.031,2.167,face.length*.32,.042,.085,reflection);
      face.panel('front pinstripe',0,1.321,face.length,.022,.020,gold);
    }

    center.panel('front central window post',0,1.912,.045,.785,.083,edge);
    const headlightX=x+side*.057;
    add(new THREE.CylinderGeometry(.138,.138,.09,20),gold,'brass headlight ring',headlightX,1.164,0,[0,0,Math.PI/2]);
    add(new THREE.CylinderGeometry(.106,.106,.082,20),lamp,'single round headlight',headlightX+side*.035,1.164,0,[0,0,Math.PI/2]);
    center.panel('front enamel badge',0,1.349,.246,.130,.043,claret);

    for(const z of [-.42,.42])box('destination board stay',x-side*.07,2.616,z,.096,.24,.069,iron);
    box('ivory destination frame',x-side*.04,destinationBoardY,0,.118,.296,1.22,gold);
    box('wine destination box',x+side*.019,destinationBoardY,0,.047,.253,1.171,claret);

    // The basket follows the curve of the end rather than sitting flat on the buffer.
    const guardPoint=(z,upper)=>[x+side*((upper?.068:.200)-.163*z*z),upper?.876:.460,z];
    for(let i=0;i<=16;i++){
      const z=(i-8)*.086;
      beam('curved wicker-style guard bar',guardPoint(z,false),guardPoint(z,true),.022,claret);
      if(i===16)continue;
      for(const upper of [false,true]){
        beam('curved guard edge',guardPoint(z,upper),guardPoint(z+.086,upper),.034,claret);
      }
    }
  }
  return finishPassengerCoach(b);
}

const vector=(x,z)=>new THREE.Vector3(x,0,-z);
const curve=new THREE.CurvePath();
curve.add(new THREE.LineCurve3(vector(43,46),vector(73,46)));
curve.add(new THREE.CubicBezierCurve3(vector(73,46),vector(79,46),vector(83,47.6),vector(TRACK_CURVE.x,TRACK_CURVE.z)));
curve.add(new THREE.CubicBezierCurve3(vector(TRACK_CURVE.x,TRACK_CURVE.z),vector(102,47.6),vector(108,63),vector(108,83)));

export function trackPoint(distance){
  const t=Math.max(0,Math.min(distance/curve.getLength(),1));
  const p=curve.getPoint(t),d=curve.getTangent(t);
  return {x:p.x,z:-p.z,dx:d.x,dz:-d.z};
}

export function createTramTrack(){
  const b=builder('tram-track',{width:1.8,depth:1.8});
  const ballast=b.material('brown track bed','#8c7961');
  const sleeper=b.material('weathered wooden sleeper','#64513f');
  const metal=b.material('muted steel rail','#77736f');
  const length=curve.getLength();
  for(let distance=0;distance<length;distance+=.53){
    const {x,z,dx,dz}=trackPoint(distance);
    b.box('wooden rail sleeper',x,.078,z,.19,.096,1.57,sleeper,[0,Math.atan2(dz,dx),0]);
  }
  for(let distance=0;distance<length;distance+=.72){
    const a=trackPoint(distance),c=trackPoint(Math.min(length,distance+.72));
    const dx=c.x-a.x,dz=c.z-a.z,segment=Math.hypot(dx,dz);
    const yaw=Math.atan2(dz,dx);
    b.box('gravel track bed',(a.x+c.x)/2,.022,(a.z+c.z)/2,segment+.05,.044,1.74,ballast,[0,yaw,0]);
    for(const side of [-1,1]){
      const offset=side*TRACK_GAUGE/2;
      b.beam('continuous rail',[a.x-a.dz*offset,RAIL_TOP-.032,a.z+a.dx*offset],
        [c.x-c.dz*offset,RAIL_TOP-.032,c.z+c.dx*offset],.064,metal);
    }
  }
  return b.finish();
}

export const tramPlatformOrigin=TRAM_PLATFORM;
