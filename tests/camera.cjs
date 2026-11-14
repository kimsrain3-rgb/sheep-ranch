(async()=>{
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map(),listeners=new Map(),captures=new Set();
function el(id){if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},toggle(){}},setAttribute(k,v){this[k]=v},querySelector(){return el(id+'child')},focus(){},addEventListener(k,fn){listeners.set(k,fn)},setPointerCapture(id){captures.add(id)},hasPointerCapture(id){return captures.has(id)},releasePointerCapture(id){captures.delete(id)}});return elements.get(id)}
el('world').getContext=()=>({setTransform(){}});
const ctx=vm.createContext({console,Math,Map,Set,Object,innerWidth:390,innerHeight:780,devicePixelRatio:1,document:{querySelector:()=>el('world'),getElementById:el,body:el('body')},addEventListener(){},requestAnimationFrame(){}});
const modules=await Promise.all(['flock','interactions','companions','audio','config','layout'].map(name=>import('../dist/game/'+name+'.js')));
for(const module of modules)Object.assign(ctx,module);Object.assign(ctx,await import('../dist/render/details.js'));
const source=fs.readFileSync('dist/orbit.js','utf8').replace('export class','class')+'\n'+fs.readFileSync('dist/app.js','utf8').replace(/^import[\s\S]*?;\n/gm,'');
vm.runInContext(source,ctx);vm.runInContext('start()',ctx);
const read=expression=>vm.runInContext(expression,ctx),event=(k,id,x,y)=>listeners.get(k)({pointerId:id,button:0,clientX:x,clientY:y});
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
for(let i=0;i<400&&!read('hammocking');i++){
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
console.log('Hammock: continuous normal-speed walk, rest only on arrival, stand in place, cancellation and replacement actions.');
console.log('Pinch expands zoom; pinch release and drag never walk; zoomed tap reaches correct world location; cancellation clears pointers.');

})().catch(error=>{console.error(error);process.exitCode=1;});
