(async()=>{
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map(),listeners=new Map(),captures=new Set();
function el(id){if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},toggle(){}},setAttribute(k,v){this[k]=v},querySelector(){return el(id+'child')},focus(){},addEventListener(k,fn){listeners.set(k,fn)},setPointerCapture(id){captures.add(id)},hasPointerCapture(id){return captures.has(id)},releasePointerCapture(id){captures.delete(id)}});return elements.get(id)}
el('world').getContext=()=>({setTransform(){}});
const ctx=vm.createContext({console,Math,Map,Set,Object,URLSearchParams,location:{search:''},innerWidth:390,innerHeight:780,devicePixelRatio:1,document:{querySelector:()=>el('world'),getElementById:el,body:el('body')},addEventListener(){},requestAnimationFrame(){}});
const modules=await Promise.all(['walking-clearance','forest-hills','fir-grove','flock','interactions','companions','audio','config','layout','weather','bond','shelter','lamb-play','shepherd','barn','barn-camera','lodge','navigation','farm-room','lodge-camera','meadow-time','tram-station'].map(name=>import('../dist/game/'+name+'.js')));
for(const module of modules)Object.assign(ctx,module);Object.assign(ctx,await import('../dist/pasture.js'),await import('../dist/render/pond-garden.js'),await import('../dist/render/fir-grove.js'));Object.assign(ctx,await import('../dist/render/details.js'));Object.assign(ctx,await import('../dist/render/bridge.js'));Object.assign(ctx,await import('../dist/render/occlusion.js'));
const source=fs.readFileSync('dist/orbit.js','utf8').replace('export class','class')+'\n'+fs.readFileSync('dist/app.js','utf8').replace(/^import[\s\S]*?;\n/gm,'');
vm.runInContext(source,ctx);vm.runInContext('start();atmosphere={...atmosphere,night:false,wet:false};environmentTimer=Infinity',ctx);
const read=expression=>vm.runInContext(expression,ctx),event=(k,id,x,y)=>listeners.get(k)({pointerId:id,button:0,clientX:x,clientY:y});
vm.runInContext('player.x=player.tx=0;player.z=player.tz=0;feed()',ctx);
const slots=read('sheep.map(a=>a.feedSlot).join(",")');
for(let i=0;i<1800;i++) vm.runInContext('t+=1/60;update(1/60)',ctx);
assert.equal(read('sheep.map(a=>a.feedSlot).join(",")'),slots);
assert.ok(read('feedCount')>0);
assert.equal(read('lambs.every(a=>a.size===a.mother.size/3)'),true);
if(read('lambs.length')){
  vm.runInContext('feed();lambPlay.next=Infinity;const baby=lambs[0];baby.x=baby.mother.x+Math.sin(baby.phase)*1.7;baby.z=baby.mother.z-.65;baby.walking=false;update(1/60)',ctx);
  assert.equal(read('lambs[0].walking'),false);
}else vm.runInContext('feed()',ctx);
vm.runInContext('sheep[0].headX=.83;sheep[0].dir=-1;update(1/60)',ctx);
assert.ok(read('sheep[0].headX')>0,'head must turn gradually rather than flip sides in a frame');
assert.equal(read('sheep.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.z)&&Number.isFinite(a.headX))'),true);
console.log('30-second flock simulation: stable feeding slots, successful feeding, exact lamb scale, resting near mother, smooth head turns, finite positions.');

})().catch(error=>{console.error(error);process.exitCode=1;});
