import assert from 'node:assert/strict';
import {presets,resolveAppearance,applyAppearance,currentAppearance,appearanceKey} from '../dist/game/visitor-appearance.js';
import {drawVisitor,drawHammock} from '../dist/visitor.js';
import {handColor} from '../dist/render/visitor-limbs.js';
import {drawTramRide} from '../dist/render/tram-ride.js';
import {drawInteraction} from '../dist/render/interactions.js';

const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
assert.equal(currentAppearance().id,'straw');
assert.equal(resolveAppearance({outfit:'constructor',hair:'__proto__'}).outfit,'ochre');
const colors=new Set();
const gradients=[],hands=[];
const ctx=new Proxy({
  getTransform:()=>({a:1,b:0,c:0,d:1}),
  createLinearGradient(){
    const stops=[];
    gradients.push(stops);
    return {addColorStop:(offset,color)=>stops.push(color)};
  },
  ellipse(x,y,rx,ry){if(this.fillStyle===handColor && rx===.09 && ry===.11)hands.push(x);}
}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,v)=>{
  if(key==='fillStyle'||key==='strokeStyle')colors.add(v);
  obj[key]=v; return true;
}});
const player={x:0,z:0}, projected={x:60,y:120,s:50};
for(const preset of presets){
  assert.ok(applyAppearance({...preset,outfit:'clay',hair:'silver'}));
  const look=currentAppearance();
  for(const options of [{pose:'front'},{pose:'back'},{pose:'left',walking:true},{pose:'right',feeding:true},{seated:true},{petting:true},{milking:true}]){
    colors.clear();hands.length=0;gradients.length=0;
    drawVisitor(ctx,projected,options);
    if(options.pose==='front'||options.pose==='back'){
      assert.ok(hands.some(x=>x<0)&&hands.some(x=>x>0),'both cuffs end in a visible hand');
      assert.equal(gradients.length,8,'both segments of each sleeve and trouser leg are shaded');
      assert.deepEqual(gradients[0],gradients[2],'left and right trouser legs share a palette and light');
      assert.ok(gradients.every(stops=>new Set(stops).size>1));
    }
    assert.ok(colors.has(look.hairColor)&&colors.has(look.coat),preset.id+JSON.stringify(options));
  }
  colors.clear(); drawHammock(ctx,projected,{occupied:true});
  assert.ok(colors.has(look.hairColor)&&colors.has(look.coat));
  const animal={x:1,z:1,size:.33};
  for(const kind of ['pet','tug']){
    colors.clear(); drawInteraction(ctx,{active:{kind,phase:'playing',animal,time:0}},player,()=>projected,0);
    if(kind==='pet')assert.ok(colors.has(handColor)&&gradients.at(-1).length===5);
    else assert.ok(colors.has(look.coat));
  }
}
// Board with the same saved outfit, including when the previous trip ended
// at this exact angle. Turning away should leave just the cabin in view.
globalThis.window={devicePixelRatio:1};
const surface=()=>({clientWidth:390,clientHeight:760,dataset:{},getContext:()=>ctx});
const cabin=surface(),scenery=surface();
let passengerAnchor;
ctx.transform=(sx,b,c,sy,x,y)=>{passengerAnchor={sx,sy,x,y};};
for(const preset of presets){
  applyAppearance({id:preset.id,outfit:'navy',hair:'silver'});
  const look=currentAppearance();
  colors.clear();passengerAnchor=null;
  drawTramRide(scenery,cabin,'북극',1,.36,.02);
  assert.ok(colors.has(look.hairColor)&&colors.has(look.coat),'tram uses active hair and coat: '+preset.id);
  assert.ok(passengerAnchor.x>0&&passengerAnchor.x<390,'seated visitor visible when boarding');
  assert.ok(passengerAnchor.y-passengerAnchor.sy*1.6>0&&passengerAnchor.y+passengerAnchor.sy*.5<760,'framed from hat to feet');
}
const initialAnchor=passengerAnchor;
passengerAnchor=null;colors.clear();
drawTramRide(scenery,cabin,'북극',1,.36+Math.PI,.02);
assert.equal(passengerAnchor,null,'visitor does not follow the screen when looking away');
drawTramRide(scenery,cabin,'북극',1,.36,.02);
assert.deepEqual(passengerAnchor,initialAnchor,'turning back finds the visitor on the same seat');
delete globalThis.window;
const reload=async tag=>(await import('../dist/game/visitor-appearance.js?'+tag)).currentAppearance();
assert.deepEqual(await reload('returning'),currentAppearance());
storage.set(appearanceKey,'{invalid');
assert.equal((await reload('invalid')).id,'straw');
delete globalThis.localStorage;
assert.equal(applyAppearance({id:'glasses'}),false);
assert.equal(currentAppearance().outfit,'navy');
console.log('Four visitor styles, walking, interiors/shared drawing, animal care, hammock and returning visitors passed.');
