import * as THREE from '../vendor/three/three.module.js';

// Model space uses metres-like game units: x = east, y = up, -z = meadow north.
// Geometry stays local to the existing entrance; neither building moves an NPC.
export const BUILDING_SPECS=Object.freeze({
  barn:Object.freeze({width:19.3,depth:18,eave:4.5,ridge:8.2}),
  lodge:Object.freeze({width:11.2,depth:13.5,eave:8.2,ridge:11.2}),
  coop:Object.freeze({width:7.6,depth:9,eave:3.7,ridge:5.9}),
  shed:Object.freeze({width:9.4,depth:11,eave:4.2,ridge:6.2})
});

function builder(name){
  const root=new THREE.Group();root.name=name;
  const parts=[],materials=new Map();
  const material=(name,color)=>{
    if(!materials.has(name)){
      const mat=new THREE.MeshLambertMaterial({color,flatShading:true});mat.name=name;
      materials.set(name,mat);
    }
    return materials.get(name);
  };
  const palette={
    wall:material('warm plaster','#e0cc9f'),wood:material('oak posts','#826447'),
    trim:material('light wood edges','#b39164'),dark:material('dark interior','#443e32'),
    door:material('sage doors','#73836a'),glass:material('window glass','#94b8ad'),
    frame:material('window frame','#e5ddbe'),roof:material('brown shingles','#77604c'),
    tile:material('alternate shingles','#856b53'),stone:material('foundation stones','#92917c'),
    straw:material('dry straw','#c9b072'),snow:material('roof snow','#f0eee0')
  };
  function add(geometry,mat,name,x=0,y=0,z=0,rotation){
    const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;
    mesh.position.set(x,y,-z);if(rotation)mesh.rotation.set(...rotation);
    root.add(mesh);parts.push(mesh);return mesh;
  }
  function box(name,x,y,z,w,h,d,mat=palette.wood,rotation){
    return add(new THREE.BoxGeometry(w,h,d),mat,name,x,y,z,rotation);
  }
  function beam(name,a,b,thickness=.13,mat=palette.wood){
    const start=new THREE.Vector3(a[0],a[1],-a[2]),end=new THREE.Vector3(b[0],b[1],-b[2]);
    const mesh=add(new THREE.BoxGeometry(thickness,start.distanceTo(end),thickness),mat,name);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());
    return mesh;
  }
  function sphere(name,x,y,z,rx,ry,rz,mat){
    const mesh=add(new THREE.SphereGeometry(1,8,6),mat,name,x,y,z);mesh.scale.set(rx,ry,rz);return mesh;
  }
  function gable(name,width,depth,eave,ridge,mat,z=0){
    const shape=new THREE.Shape();shape.moveTo(-width/2,eave);shape.lineTo(width/2,eave);shape.lineTo(0,ridge);shape.closePath();
    return add(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:1}),mat,name,0,0,z+depth);
  }
  function roof(width,depth,eave,ridge){
    const half=width/2+.55,front=-.6,back=depth+.6,center=(front+back)/2;
    const rise=ridge-eave,length=Math.hypot(half,rise),angle=Math.atan2(rise,half);
    for(const side of [-1,1]){
      box('roof slope',side*half/2,(eave+ridge)/2,center,length,.18,back-front,palette.roof,[0,0,-side*angle]);
      const rows=6,columns=Math.ceil((back-front)/1.5),along=(back-front)/columns;
      for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
        if((row+col)%3===0)continue;
        const f=(row+.5)/rows;
        box('shingle',side*half*f,ridge-rise*f+.11,front+(col+.5)*along,length/rows-.025,.025,along-.035,(row+col)%2?palette.roof:palette.tile,[0,0,-side*angle]);
      }
      for(const z of [front,back])beam('gable bargeboard',[0,ridge+.12,z],[side*(half+.05),eave-.02,z],.17);
      beam('eaves',[side*half,eave,front],[side*half,eave,back],.17);
      const snow=box('snow roof',side*half/2,(eave+ridge)/2+.14,center,length,.045,back-front,palette.snow,[0,0,-side*angle]);
      snow.userData.snow=true;
    }
    beam('ridge cap',[0,ridge+.12,front-.06],[0,ridge+.12,back+.06],.22);
  }
  function frontWindow(x,y,z,w=1.6,h=1.7,shutters=false){
    box('window recess',x,y,z,w+.2,h+.2,.13,palette.wood);
    box('window glass',x,y,z-.075,w,h,.055,palette.glass);
    for(const dx of [-w/2,w/2])box('window jamb',x+dx,y,z-.12,.09,h+.12,.10,palette.frame);
    for(const dy of [-h/2,h/2])box('window sill',x,y+dy,z-.15,w+.2,.09,.2,palette.frame);
    box('window mullion',x,y,z-.15,.07,h,.08,palette.frame);
    box('window transom',x,y,z-.15,w,.07,.08,palette.frame);
    if(shutters)for(const side of [-1,1]){
      const sx=x+side*(w/2+.36);
      box('green shutter',sx,y,z-.05,.5,h+.12,.1,palette.door);
      beam('shutter brace',[sx-.18,y-h*.36,z-.12],[sx+.18,y+h*.36,z-.12],.055,palette.trim);
    }
  }
  function sideWindow(side,z,y,w=1.5,h=1.5){
    const x=side*(BUILDING_SPECS[name].width/2+.04);
    box('side window',x,y,z,.10,h,w,palette.glass);
    for(const dz of [-w/2,w/2])box('side jamb',x+side*.05,y,z+dz,.14,h+.12,.09,palette.frame);
    for(const dy of [-h/2,0,h/2])box('side sill',x+side*.06,y+dy,z,.16,.08,w+.14,palette.frame);
    box('side mullion',x+side*.06,y,z,.16,h,.07,palette.frame);
  }
  function finish(){
    root.updateMatrixWorld(true);
    const metadata=parts.map(part=>{
      const bounds=new THREE.Box3().setFromObject(part);
      return {name:part.name,min:bounds.min.toArray(),max:bounds.max.toArray()};
    });
    // Bake static details by material. Both buildings share one WebGL context;
    // hundreds of visible planks need only a small number of draw calls.
    const batches=new Map();
    for(const part of parts){
      const key=part.material.uuid+(part.userData.snow?':snow':'');
      if(!batches.has(key))batches.set(key,{material:part.material,snow:!!part.userData.snow,positions:[],normals:[]});
      const batch=batches.get(key),geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
      geometry.applyMatrix4(part.matrixWorld);
      batch.positions.push(...geometry.attributes.position.array);batch.normals.push(...geometry.attributes.normal.array);
      geometry.dispose();part.geometry.dispose();
    }
    root.clear();
    for(const batch of batches.values()){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(batch.positions,3));
      geometry.setAttribute('normal',new THREE.Float32BufferAttribute(batch.normals,3));
      geometry.computeBoundingBox();geometry.computeBoundingSphere();
      const mesh=new THREE.Mesh(geometry,batch.material);mesh.name=batch.material.name;
      mesh.userData.snow=batch.snow;mesh.visible=!batch.snow;root.add(mesh);
    }
    root.userData={kind:name,parts:metadata,palette,spec:BUILDING_SPECS[name]};
    return root;
  }
  return {root,palette,box,beam,sphere,add,material,gable,roof,frontWindow,sideWindow,finish};
}

export function createLodgeModel(){
  const b=builder('lodge'),p=b.palette,{box,beam,sphere}=b;
  box('foundation',0,.13,6.75,11.7,.26,14,p.stone);
  box('house walls',0,4.18,6.75,11.2,8.1,13.5,p.wall);
  b.gable('plaster gables',11.2,13.5,8.2,11.2,p.wall);
  for(const x of [-5.6,5.6])for(const z of [0,6.75,13.5])box('timber post',x,4.2,z,.19,8.3,.19);
  for(const y of [.35,4.2,8.15]){
    for(const z of [-.07,13.57])box('horizontal timber',0,y,z,11.5,.19,.18);
    for(const x of [-5.64,5.64])box('side timber',x,y,6.75,.18,.19,13.65);
  }
  b.roof(11.2,13.5,8.2,11.2);
  // Chimney emerges from the rear roof slope and has an open dark top.
  box('stone chimney',3.5,10.05,10,1,2.7,1.05,p.stone);
  box('chimney cap',3.5,11.45,10,1.3,.22,1.35,p.wood);
  box('chimney opening',3.5,11.57,10,.75,.03,.8,p.dark);
  for(const y of [9.1,9.65,10.2,10.75])box('chimney mortar',3.5,y,9.46,1.02,.055,.02,p.trim);
  // Door is aligned with the existing entrance / return position.
  box('door frame',0,1.55,-.13,2.65,3.1,.2,p.wood);
  box('front door',0,1.5,-.27,2.25,3,.14,p.door);
  for(const x of [-.67,0,.67])box('door planks',x,1.55,-.36,.045,2.65,.035,p.trim);
  box('door cross rail',0,.8,-.38,2.1,.12,.08,p.wood);
  sphere('brass handle',.8,1.45,-.42,.08,.08,.08,p.straw);
  box('porch deck',0,.08,-.72,4.7,.16,1.5,p.trim);
  for(const x of [-2.35,2.35])box('porch support',x,1.95,-1.3,.16,3.8,.16,p.wood);
  box('porch canopy',0,3.75,-.75,5.2,.15,2,p.roof,[.12,0,0]);
  for(const x of [-3.65,3.65]){
    b.frontWindow(x,2.35,-.13,1.65,1.65,true);
    b.frontWindow(x,6.2,-.13,1.65,1.9,true);
    box('flower box',x,1.38,-.42,1.95,.32,.5,p.wood);
    for(let i=0;i<5;i++)sphere('flower foliage',x-.65+i*.32,1.63,-.47,.2,.16,.16,p.door);
  }
  b.frontWindow(0,6,-.13,1.75,2.7,false);
  box('balcony deck',0,4.12,-.78,8.5,.2,1.7,p.trim);
  for(let x=-4.1;x<=4.11;x+=.82)box('balcony spindle',x,4.75,-1.6,.09,1.18,.09,p.wood);
  for(const x of [-4.1,4.1]){
    box('balcony end rail',x,5.36,-.82,.13,.13,1.7,p.wood);
    beam('balcony bracket',[x,3.25,-.05],[x,4.05,-1.45],.14,p.wood);
  }
  box('balcony handrail',0,5.36,-1.6,8.5,.15,.16,p.wood);
  for(const side of [-1,1])for(const z of [3.3,9.9])for(const y of [2.35,6.25])b.sideWindow(side,z,y);
  for(const x of [-3.6,3.6])for(const y of [2.35,6.2])b.frontWindow(x,y,13.7,1.6,1.65);
  box('lodge name board',0,8.7,-.17,3.6,.58,.18,p.door);
  // Small carved bone identifies the house shared with the shepherd dogs.
  box('bone emblem',0,8.7,-.29,1.05,.15,.09,p.frame);
  for(const x of [-.52,.52])for(const y of [8.6,8.8])sphere('bone end',x,y,-.3,.13,.13,.06,p.frame);
  return b.finish();
}

export function createCoopModel(){
  const b=builder('coop'),p=b.palette,{box,beam}=b;
  box('coop foundation',0,.12,4.5,8,.24,9.4,p.stone);
  // Side/back walls and an actual front opening, rather than a door painted on a cube.
  for(const side of [-1,1])box('coop side wall',side*3.7,1.96,4.5,.2,3.5,9,p.trim);
  box('coop back wall',0,1.96,8.9,7.6,3.5,.2,p.trim);
  for(const side of [-1,1])box('coop front wall',side*2.45,1.96,0,2.7,3.5,.18,p.trim);
  box('coop door lintel',0,3.2,0,2.2,1.05,.2,p.trim);
  box('coop floor',0,.22,4.5,7.5,.14,9,p.wood);
  box('dark doorway',0,1.35,.8,2.05,2.25,.1,p.dark);
  box('straw inside',0,.31,.5,2.1,.04,1.4,p.straw);
  for(const x of [-3.7,-2.9,-2.1,2.1,2.9,3.7])box('front plank seam',x,1.95,-.13,.035,3.45,.04,p.wood);
  for(const side of [-1,1]){
    for(let z=.5;z<8.8;z+=.85)box('side plank seam',side*3.82,1.95,z,.035,3.45,.035,p.wood);
    for(const z of [0,4.5,9])box('coop post',side*3.8,1.95,z,.16,3.8,.16,p.wood);
    for(const y of [.4,3.6])box('coop side rail',side*3.8,y,4.5,.14,.15,9.1,p.wood);
  }
  b.gable('coop gables',7.6,9,3.7,5.9,p.trim);
  b.roof(7.6,9,3.7,5.9);
  b.frontWindow(-2.45,2.3,-.18,1.3,1.35);
  b.frontWindow(2.45,2.3,-.18,1.3,1.35);
  for(const side of [-1,1])b.sideWindow(side,5.5,2.2,1.4,1.35);
  for(const x of [-1.08,1.08])box('coop door jamb',x,1.42,-.14,.13,2.7,.2,p.door);
  // Open timber door pivots away from the real chicken entry path.
  const door=box('open coop door',-1.75,1.43,-.78,1.75,2.5,.13,p.door,[0,-.85,0]);
  // Door details use the same transform so the brace cannot float in space.
  door.updateMatrixWorld(true);
  const ends=[new THREE.Vector3(-.68,-1.05,.1),new THREE.Vector3(.68,1.05,.1)].map(v=>v.applyMatrix4(door.matrixWorld));
  beam('coop door brace',...ends.map(v=>[v.x,v.y,-v.z]),.09,p.wood);
  box('entry board',0,.08,-.65,2.05,.13,1.5,p.trim,[.08,0,0]);
  // Egg boxes protrude from the back, visible when orbiting around the coop.
  box('nest boxes',0,1.12,9.5,4.8,1.25,1.2,p.wood);
  for(const x of [-1.6,0,1.6])box('nest lid',x,1.8,9.55,1.55,.12,1.4,p.roof,[.16,0,0]);
  box('nest sill',0,.48,9.5,5,.12,1.35,p.trim);
  box('coop name plaque',0,4.25,-.16,2.3,.52,.18,p.door);
  // A simple timber vent in the gable.
  box('gable vent',0,5.05,-.14,.8,.65,.11,p.dark);
  for(const y of [4.84,5.05,5.26])box('vent slat',0,y,-.23,.85,.075,.13,p.door);
  return b.finish();
}

export function createBarnModel(){
  const b=builder('barn'),p=b.palette,{box,beam}=b;
  const half=BUILDING_SPECS.barn.width/2,depth=BUILDING_SPECS.barn.depth;
  const wall=b.material('barn cream boards','#c8b48b');
  const timber=b.material('barn warm timber','#76583e');
  const door=b.material('barn sage doors','#667966');
  const opening=3.1;
  box('barn stone foundation',0,.13,depth/2,19.3,.26,depth,p.stone);
  box('barn floor',0,.24,depth/2,19.05,.18,depth-.2,p.trim);
  for(const side of [-1,1]){
    box('barn side wall',side*(half-.09),2.25,depth/2,.18,4.5,depth,wall);
    box('barn front wall',side*(half+opening)/2,2.25,0,half-opening,4.5,.18,wall);
    for(let z=.55;z<depth;z+=.95)box('barn side board seam',side*(half+.025),2.2,z,.035,4.3,.04,timber);
    for(let x=opening+.55;x<half;x+=.95)box('barn front board seam',side*x,2.2,-.12,.035,4.3,.04,timber);
    for(const z of [0,4.5,9,13.5,18])box('barn side post',side*half,2.25,z,.24,4.5,.24,timber);
    for(const x of [opening,half])box('barn front post',side*x,2.25,-.15,.26,4.5,.27,timber);
    for(const y of [.42,4.25])box('barn side rail',side*half,y,depth/2,.2,.19,depth,timber);
    for(const z of [4,9,14])b.sideWindow(side,z,2.65,1.8,1.5);
    // The two leaves sit open beside the six-metre entry, matching the collision gap.
    box('open barn door',side*4.1,1.65,-.34,1.65,3.2,.15,door,[0,side*.4,0]);
    beam('barn door brace',[side*3.4,.65,-.5],[side*4.8,2.7,-.5],.095,timber);
  }
  box('barn back wall',0,2.25,depth,19.3,4.5,.18,wall);
  for(let x=-9.1;x<9.2;x+=.96)box('barn back board seam',x,2.2,depth+.12,.035,4.3,.04,timber);
  for(const y of [.42,4.25])box('barn back rail',0,y,depth+.13,19.3,.19,.2,timber);
  box('barn door lintel',0,4.05,-.05,opening*2, .9,.22,timber);
  box('barn entry ramp',0,.1,-.56,opening*2,.16,1.35,p.trim,[.08,0,0]);
  b.gable('barn front gable',19.3,.16,4.5,8.2,wall,-.12);
  b.gable('barn rear gable',19.3,.16,4.5,8.2,wall,17.96);
  b.roof(19.3,18,4.5,8.2);
  for(const z of [0,6,12,18]){
    beam('barn roof truss left',[-half,4.5,z],[0,8.05,z],.2,timber);
    beam('barn roof truss right',[0,8.05,z],[half,4.5,z],.2,timber);
  }
  b.frontWindow(-5.8,2.75,-.15,1.75,1.65);
  b.frontWindow(5.8,2.75,-.15,1.75,1.65);
  box('barn loft vent',0,6.05,-.37,1.5,1.25,.12,p.dark);
  for(const y of [5.7,6.05,6.4])box('barn vent slat',0,y,-.46,1.6,.09,.13,door);
  box('barn sign board',0,4.85,-.35,3.4,.5,.15,door);
  for(const x of [-1.25,1.25])box('barn sign end cap',x,4.85,-.46,.14,.53,.12,p.frame);
  // Interior details are visible through the open doorway.
  for(const side of [-1,1])for(const z of [3,6,9,12,15]){
    box('barn stall rail',side*3.1,1.05,z,.13,.14,2.7,timber);
    box('barn stall post',side*3.1,.8,z-1.3,.16,1.55,.16,timber);
    box('barn hay',side*5.7,.4,z,3.1,.55,1.8,p.straw);
  }
  return b.finish();
}

export function createBarnRoomModel(){
  const b=builder('barn'),p=b.palette,{box,beam}=b;
  const wall=b.material('barn interior boards','#c8b48b');
  box('barn room floor',0,.06,9,19.1,.12,18,p.trim);
  for(const side of [-1,1]){
    box('barn room side wall',side*9.6,2.3,9,.18,4.6,18,wall);
    for(const z of [4,9,14]){
      box('barn room window',side*9.48,2.55,z,.05,1.5,1.8,p.glass);
      for(const dz of [-.95,.95])box('barn room window frame',side*9.4,2.55,z+dz,.13,1.65,.1,p.frame);
    }
    for(const z of [3,6,9,12,15]){
      box('barn stall divider',side*5.2,.95,z-1.3,4.1,1.6,.13,p.wood);
      box('barn stall front',side*3.1,.9,z,.14,1.65,2.7,p.wood);
      box('barn hay bed',side*6.35,.22,z,4.3,.24,2.25,p.straw);
    }
  }
  box('barn room back wall',0,2.3,18,19.2,4.6,.18,wall);
  for(const side of [-1,1])box('barn room front wall',side*6.35,2.3,0,6.5,4.6,.18,wall);
  box('barn room lintel',0,4.05,0,6.2,1.1,.18,p.wood);
  box('barn room ceiling',0,7.55,9,19.2,.18,18,p.wood);
  for(let z=1;z<18;z+=2)box('barn floor seam',0,.125,z,19,.01,.03,p.wood);
  for(const z of [3,6,9,12,15]){
    beam('barn ceiling truss left',[-9.5,4.5,z],[0,7.5,z],.22,p.wood);
    beam('barn ceiling truss right',[0,7.5,z],[9.5,4.5,z],.22,p.wood);
  }
  return b.finish();
}

export function createFarmRoomModel(kind){
  if(!['coop','shed'].includes(kind))throw Error('Unknown farm room');
  const b=builder(kind),p=b.palette,{box,beam}=b,spec=BUILDING_SPECS[kind];
  const w=spec.width,d=spec.depth,h=spec.eave,wall=kind==='coop'?p.trim:p.wall;
  box('room floor',0,.03,d/2,w,.12,d,p.trim);
  for(const side of [-1,1])box('closed side wall',side*w/2,h/2,d/2,.18,h,d,wall);
  box('closed back wall',0,h/2,d,w,h,.18,wall);
  for(const side of [-1,1])box('entry wall',side*(w/4+.5),h/2,0,w/2-1,h,.18,wall);
  box('entry lintel',0,(h+2.6)/2,0,2,h-2.6,.18,wall);
  box('closed ceiling',0,h,d/2,w,.15,d,p.wood);
  for(let z=1;z<d;z+=1)box('floor plank seam',0,.101,z,w,.012,.018,p.wood);
  for(const z of [1.8,d/2,d-1.6])box('ceiling beam',0,h-.2,z,w,.22,.17,p.wood);
  for(const side of [-1,1]){
    const x=side*(w/2-.14),z=d*.5;
    box('inside window glass',x,2.25,z,.04,1.45,1.65,p.glass);
    for(const dz of [-.83,0,.83])box('inside window jamb',x-side*.04,2.25,z+dz,.11,1.55,.08,p.frame);
    for(const y of [1.52,2.25,2.98])box('inside window sill',x-side*.04,y,z,.14,.08,1.8,p.frame);
  }
  for(const x of [-1.03,1.03])box('inside door jamb',x,1.35,.05,.12,2.7,.17,p.door);
  if(kind==='coop'){
    for(const z of [3.5,5.4,7.3]){
      box('nest back',-2.8,1,z,.14,1.5,1.5,p.wood);
      for(const dz of [-.72,.72])box('nest side',-2.2,1,z+dz,1.3,1.5,.09,p.wood);
      box('nest straw',-2.2,.38,z,1.3,.12,1.45,p.straw);
      box('nest roof',-2.2,1.78,z,1.45,.13,1.6,p.wood);
    }
    for(const z of [4.2,6.5]){
      for(const x of [2.25,3.15])box('roost support',x,.7,z,.12,1.4,.12,p.wood);
      beam('roost perch',[2.1,1.45,z],[3.3,1.45,z],.12,p.trim);
    }
    box('feed trough',2.75,.38,2,1.2,.5,1.3,p.wood);
    box('grain',2.75,.65,2,1.03,.06,1.13,p.straw);
  }else{
    for(const x of [-3.4,-2.2])for(const z of [4,6,8]){
      const height=z===8?2:1.3;
      box('hay bale',x,height/2+.12,z,1.05,height,1.6,p.straw);
      for(const dy of [-.3,.3])box('hay binding',x,height/2+.12+dy,z-.82,1.08,.06,.035,p.wood);
    }
    for(const z of [3.5,5.6,7.7])box('wooden crate',3.1,.75,z,1.65,1.35,1.65,p.wood);
    for(const y of [.55,1.7,2.85])box('tool shelf',1.8,y,d-.65,4,.12,1,p.trim);
    for(const x of [.2,3.45])box('shelf support',x,1.6,d-.65,.15,3.1,1,p.wood);
    for(const x of [1,2,3])box('tool handle',x,2,d-.35,.07,1.1,.07,p.wood);
    box('garden bench',-3,.65,1.7,2,.25,1.1,p.wood);
  }
  return b.finish();
}

export {builder as createBuildingBuilder};
