(async()=>{
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map(),listeners=new Map(),captures=new Set();
function el(id){if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},toggle(){}},setAttribute(k,v){this[k]=v},querySelector(){return el(id+'child')},focus(){},addEventListener(k,fn){listeners.set(k,fn)},setPointerCapture(id){captures.add(id)},hasPointerCapture(id){return captures.has(id)},releasePointerCapture(id){captures.delete(id)}});return elements.get(id)}
el('world').getContext=()=>({setTransform(){}});
const ctx=vm.createContext({console,Math,Map,Set,Object,URLSearchParams,location:{search:''},innerWidth:390,innerHeight:780,devicePixelRatio:1,document:{querySelector:()=>el('world'),getElementById:el,body:el('body')},addEventListener(){},requestAnimationFrame(){}});
 const modules=await Promise.all(['forest-hills','fir-grove','flock','interactions','companions','audio','config','layout','weather','bond','shelter','lamb-play','shepherd','barn','barn-camera','lodge','navigation','farm-room','room-follow','lodge-camera','meadow-time','tram-station'].map(name=>import('../dist/game/'+name+'.js')));
for(const module of modules)Object.assign(ctx,module);Object.assign(ctx,await import('../dist/pasture.js'),await import('../dist/render/fir-grove.js'));Object.assign(ctx,await import('../dist/render/details.js'));Object.assign(ctx,await import('../dist/render/bridge.js'));Object.assign(ctx,await import('../dist/render/occlusion.js'));
Object.assign(ctx,await import('../dist/render/tram-station.js'));
const source=fs.readFileSync('dist/orbit.js','utf8').replace('export class','class')+'\n'+fs.readFileSync('dist/app.js','utf8').replace(/^import[\s\S]*?;\n/gm,'');
vm.runInContext(source,ctx);vm.runInContext('start()',ctx);
const read=expression=>vm.runInContext(expression,ctx),event=(k,id,x,y)=>listeners.get(k)({pointerId:id,button:0,clientX:x,clientY:y});
// Dig once at a hillside, and recover the same den after loading storage.
const store=new Map();ctx.localStorage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
read('Object.assign(player,denSites[0])');
assert.equal(read('availableDen()'),0);
el('dig-den').onclick();
assert.equal(read('availableDen()'),-1);
assert.ok(read('readDens().has(0)'));
read('player.x=player.z=0');
const initial=read('view.zoom');event('pointerdown',1,140,400);event('pointerdown',2,240,400);event('pointermove',2,300,400);
assert.ok(read('view.zoom')>initial);assert.equal(read('following'),false);assert.equal(read('player.tx'),0);
event('pointerup',2,300,400);event('pointerup',1,140,400);assert.equal(read('player.tx'),0);assert.equal(read('player.tz'),0);
event('pointerdown',3,200,400);event('pointermove',3,240,440);event('pointerup',3,240,440);assert.equal(read('player.tx'),0);assert.equal(read('player.tz'),0);
vm.runInContext('view.zoom=2;view.yaw=0;view.pitch=.23;following=true;centerView()',ctx);const tap=read('view.toScreen(project(2,10).x,project(2,10).y)');event('pointerdown',4,tap.x,tap.y);event('pointerup',4,tap.x,tap.y);
assert.ok(Math.abs(read('player.tx')-2)<1e-8);assert.ok(Math.abs(read('player.tz')-10)<1e-8);
event('pointerdown',5,200,400);event('pointercancel',5,200,400);assert.equal(read('pointers.size'),0);
// Exercise real app handlers and update loop: no teleport on entry or exit.
read('player.x=player.tx=20;player.z=player.tz=30');
el('hammock').onclick();
assert.equal(read('player.x'),20);
assert.equal(read('player.z'),30);
assert.equal(read('hammocking'),false);
assert.equal(read('walkingToHammock'),true);
read('update(.05)');
assert.equal(read('player.walking'),true);
assert.ok(Math.hypot(read('player.x')-20,read('player.z')-30)<=.160001);
assert.equal(read('hammocking'),false,'still walking when far from hammock');
// Allow the longer walk from the far pasture to P10 at normal speed.
for(let i=0;i<1200&&!read('hammocking');i++){
  const x=read('player.x'),z=read('player.z');
  read('update(.05)');
  assert.ok(Math.hypot(read('player.x')-x,read('player.z')-z)<=.160001,'continuous walking speed');
}
assert.equal(read('hammocking'),true);
assert.ok(read('Math.hypot(player.x-CONFIG.hammock.x,player.z-CONFIG.hammock.z)')<=.08);
const restX=read('player.x'),restZ=read('player.z');
el('hammock').onclick();
assert.equal(read('hammocking'),false);
assert.equal(read('player.x'),restX);
assert.equal(read('player.z'),restZ);
read('player.x=player.tx=20;player.z=player.tz=30');
el('hammock').onclick();read('update(.05)');el('care-cancel').onclick();
assert.equal(read('walkingToHammock'),false);
const stopped=read('player.x');read('update(1)');assert.equal(read('player.x'),stopped);
assert.equal(read('hammocking'),false,'cancellation never triggers delayed rest');
el('hammock').onclick();el('hammock').onclick();assert.equal(read('walkingToHammock'),false);
el('hammock').onclick();el('sit').onclick();assert.equal(read('walkingToHammock'),false);
// Click-to-walk must use the same dry route as the bridge geometry.
read('seated=false;hammocking=false;walkingToHammock=false;interaction.cancel(view);flock.animals.forEach(a=>{a.locked=true;});shepherd.talk=null;cancelOutdoorWalk();Object.assign(player,bridgePoint(-7));player.tx=player.x;player.tz=player.z;walkToOutdoor(bridgePoint(7))');
let highest=0;
for(let i=0;i<150;i++){
 const before=read('({x:player.x,z:player.z})');read('update(.05)');
 assert.ok(Math.hypot(read('player.x')-before.x,read('player.z')-before.z)<=.160001,'real app crosses at normal walking speed');
 assert.equal(read('isWater(player)'),false);
 highest=Math.max(highest,read('bridgeHeight(player)'));
 if(!read('outdoorWalk'))break;
}
assert.ok(highest>.9,'real app walks over the top of the arch');
assert.ok(read('Math.hypot(player.x-bridgePoint(7).x,player.z-bridgePoint(7).z)')<.09);
read('Object.assign(player,bridgePoint(LAKE_BRIDGE.halfLength+2,0,LAKE_BRIDGE));player.tx=player.x;player.tz=player.z;walkToOutdoor(bridgePoint(-LAKE_BRIDGE.halfLength-2,0,LAKE_BRIDGE))');
let lakeHeight=0;
for(let i=0;i<250;i++){
 const before=read('({x:player.x,z:player.z})');read('update(.05)');
 assert.ok(Math.hypot(read('player.x')-before.x,read('player.z')-before.z)<=.160001,'lake bridge walk keeps normal speed');
 assert.equal(read('isWater(player)'),false);
 lakeHeight=Math.max(lakeHeight,read('bridgeHeight(player)'));
 if(!read('outdoorWalk'))break;
}
assert.ok(lakeHeight>.8,'real app walks over the log arch');
assert.ok(read('Math.hypot(player.x-bridgePoint(-LAKE_BRIDGE.halfLength-2,0,LAKE_BRIDGE).x,player.z-bridgePoint(-LAKE_BRIDGE.halfLength-2,0,LAKE_BRIDGE).z)')<.09);
read('Object.assign(player,bridgePoint(0));player.tx=player.x;player.tz=player.z;centerView()');
const foot=read('project(player.x,player.z)'),under=read('project(player.x,player.z,0)');
assert.ok(foot.y<under.y-10,'actor feet are projected onto the raised deck');
read('walkToOutdoor(bridgePoint(-7));cancelBarnTrip()');assert.equal(read('outdoorWalk'),null);assert.equal(read('player.tx'),read('player.x'));

// Exercise the actual outdoor tap handler, including the old oversized barn
// rectangle. Only visible front animals and opaque building pixels count.
read(`cancelBarnTrip();cancelLodgeTrip();interaction.cancel(view);outdoorWalk=null;shepherd.talk=null;shepherd.insideLodge=true;shepherd.screen=null;shelter.active=false;seated=false;hammocking=false;feeding=false;view=outdoorView;view.target={x:-25,z:28};view.zoom=1.65;view.yaw=0;view.pitch=.23;Object.assign(player,{x:-25,z:23,tx:-25,tz:23});sheep.forEach(a=>a.screen=null);barnVisit.screen={x:W/2,y:H,w:10000,h:10000};buildingOcclusion.prepare(view.basis(W,H),W,H,[{kind:'barn',polygons:[[[-34.6,28,0],[-15.4,28,0],[-15.4,28,7],[-34.6,28,7]]]}]);`);
read(`Object.assign(sheep[0],{x:-25,z:25,state:'roam',hiddenInBarn:false});const sheepRoot=project(sheep[0].x,sheep[0].z);sheep[0].screen={x:sheepRoot.x,y:sheepRoot.y,w:sheepRoot.s*2.5,h:sheepRoot.s*1.9};`);
const frontTap=read('project(sheep[0].x,sheep[0].z,.9)');
assert.equal(read(`buildingOcclusion.buildingAt(${frontTap.x},${frontTap.y})`),'barn','fixture puts a visible wall behind the sheep');
event('pointerdown',101,frontTap.x,frontTap.y);event('pointerup',101,frontTap.x,frontTap.y);
assert.equal(read('interaction.active?.animal===sheep[0]'),true,'sheep in front of a barn wall receives the real pointer tap');
assert.equal(read('barnVisit.trip'),null,'tapping a foreground sheep never starts barn entry');
read(`interaction.cancel(view);sheep[0].z=32;const hiddenRoot=project(sheep[0].x,sheep[0].z);sheep[0].screen={x:hiddenRoot.x,y:hiddenRoot.y,w:hiddenRoot.s*2.5,h:hiddenRoot.s*1.9};`);
const hiddenTap=read('project(sheep[0].x,sheep[0].z,.9)');
event('pointerdown',102,hiddenTap.x,hiddenTap.y);event('pointerup',102,hiddenTap.x,hiddenTap.y);
assert.equal(read('interaction.active'),null,'a sheep behind a solid wall cannot steal a building tap');
assert.equal(read('barnVisit.trip'),'enter','a visible barn surface still starts the normal doorway approach');
read('cancelBarnTrip();sheep.forEach(a=>a.screen=null)');
const grassTap=read('project(-25,20,0)');
assert.equal(read(`buildingOcclusion.buildingAt(${grassTap.x},${grassTap.y})`),null);
event('pointerdown',103,grassTap.x,grassTap.y);event('pointerup',103,grassTap.x,grassTap.y);
assert.equal(read('barnVisit.trip'),null,'grass inside the old bounding rectangle never enters the barn');
assert.ok(read('outdoorWalk'),'grass creates an ordinary walking route');
console.log('Outdoor tap picking: foreground sheep before buildings, no hidden sheep through walls, actual wall entry and ordinary grass movement passed.');


// Choosing daylight after night must release shelter without the real-weather
// 20-second delay. Manual gathering and rainy weather still keep animals safe.
read(`cancelBarnTrip();cancelLodgeTrip();interaction.cancel(view);cancelOutdoorWalk();shelter.active=false;shelter.manual=false;weather.preview='clear';meadowTime.set('22:00');refreshMeadowTime();update(.05)`);
assert.equal(read('atmosphere.night'),true);assert.equal(read('shelter.active'),true,'a user-selected night triggers normal herding');
read(`meadowTime.set('12:00');refreshMeadowTime();update(.05)`);
assert.equal(read('atmosphere.night'),false);assert.equal(read('shelter.active'),false,'choosing day immediately begins the normal walking exit');
read(`shelter.manual=true;meadowTime.set('07:00');refreshMeadowTime();update(.05)`);
assert.equal(read('shelter.active'),true,'time selection preserves explicit gathering');
read(`shelter.manual=false;weather.preview='rain';meadowTime.set('12:00');refreshMeadowTime();update(.05)`);
assert.equal(read('shelter.active'),true,'daylight never forces animals out in rain');
console.log('App time choice: selected night herds, selected daylight releases promptly, rain and manual gathering retain priority.');

// Exercise the same station arrival and modal controls the map and canvas use.
const options=el('station-options'),board=el('station-board'),shown=[];
options.children=[];
options.append=button=>{options.children.push(button);options.childElementCount=options.children.length;};
ctx.document.createElement=()=>({setAttribute(key,value){this[key]=value;}});
board.showModal=()=>{board.open=true;};board.close=()=>{board.open=false;};
ctx.setTramDestination=name=>shown.push(name);
read('view=outdoorView;Object.assign(player,TRAM_STATION.waitingSpot);walkToOutdoor(TRAM_STATION.waitingSpot);advanceOutdoorWalk()');
assert.equal(board.open,true);assert.deepEqual(shown,[]);
assert.deepEqual(options.children.map(b=>b.value),['북극','사막','정글']);
el('station-board-close').onclick();assert.deepEqual(shown,[]);
el('station-board-open').onclick();options.children[1].onclick();
assert.deepEqual(shown,['사막']);assert.equal(board.open,false);
el('station-board-open').onclick();assert.equal(options.children[1]['aria-pressed'],'true');
options.children[2].onclick();assert.deepEqual(shown,['사막','정글']);
read('Object.assign(player,{x:0,z:0})');el('station-board-open').onclick();
assert.equal(board.open,false,'the board is only available inside the station');

// A booking follows this particular walk. Replacing the route cancels boarding.
const ridePanel=el('tram-ride');
ridePanel.showModal=()=>{ridePanel.open=true;};
ridePanel.close=()=>{ridePanel.open=false;listeners.get('close')();};
read('Object.assign(player,TRAM_STATION.waitingSpot)');
el('station-ride-open').onclick();
assert.equal(read('ride'),null);
assert.equal(read('outdoorWalk.boardFor'),'정글');
read('walkToOutdoor(TRAM_STATION.waitingSpot);advanceOutdoorWalk()');
assert.equal(read('ride'),null);
board.close();
el('station-ride-open').onclick();
for(let i=0;i<180&&!ridePanel.open;i++)read('update(.05)');
assert.equal(ridePanel.open,true);
assert.equal(read('ride.name'),'정글');
assert.equal(read('nearBoardingDoor()'),true);
const rideCanvas=el('ride-cabin');
const dragEvent=(id,x,y)=>({pointerId:id,button:0,clientX:x,clientY:y});
const seat=read('[player.x,player.z]');
rideCanvas.onpointerdown(dragEvent(7,270,220));
rideCanvas.onpointermove(dragEvent(7,95,250));
assert.ok(read('ride.yaw')>1.8&&read('ride.pitch')<0,'horizontal and vertical drag turn the view');
const firstYaw=read('ride.yaw');
rideCanvas.onpointercancel(dragEvent(7,95,250));
rideCanvas.onpointermove(dragEvent(7,130,250));
assert.equal(read('ride.yaw'),firstYaw);
let drawnLook;
ctx.drawTramRide=(_s,_c,_name,_progress,yaw,pitch)=>{drawnLook=[yaw,pitch];};
read('ride.elapsed=15.9;frame(last+250)');
assert.equal(el('ride-status').textContent,'정글 도착');
rideCanvas.onpointerdown(dragEvent(8,55,150));
rideCanvas.onpointermove(dragEvent(8,175,510));
read('frame(last+16)');
assert.notEqual(drawnLook[0],firstYaw,'can turn after arrival');
assert.equal(drawnLook[1],-1.05,'looking up stays within the cabin camera tilt limit');
assert.deepEqual(read('[player.x,player.z]'),seat);
el('ride-return').onclick();
assert.equal(read('ride'),null);
el('station-board-open').onclick();options.children[0].onclick();
el('station-ride-open').onclick();read('advanceOutdoorWalk()');
assert.equal(read('ride.name'),'북극');
assert.equal(read('ride.yaw'),.36,'new trip starts from the original window view');
el('ride-return').onclick();
console.log('Tram ride: platform approach, replacement walk, arrival, return and repeat boarding passed.');

console.log('App bridge: continuous dry crossing, raised feet, destination arrival and replacement-action cancellation passed.');
console.log('Hammock: continuous normal-speed walk, rest only on arrival, stand in place, cancellation and replacement actions.');
console.log('Pinch expands zoom; pinch release and drag never walk; zoomed tap reaches correct world location; cancellation clears pointers.');

})().catch(error=>{console.error(error);process.exitCode=1;});
