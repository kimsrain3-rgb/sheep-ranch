import assert from 'node:assert/strict';
import {presets,resolveAppearance,applyAppearance,currentAppearance,appearanceKey} from '../dist/game/visitor-appearance.js';
import {drawVisitor,drawHammock} from '../dist/visitor.js';
import {drawInteraction} from '../dist/render/interactions.js';

const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
assert.equal(currentAppearance().id,'straw');
assert.equal(resolveAppearance({outfit:'constructor',hair:'__proto__'}).outfit,'ochre');
const colors=new Set();
const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,v)=>{
  if(key==='fillStyle'||key==='strokeStyle')colors.add(v);
  obj[key]=v; return true;
}});
const player={x:0,z:0}, projected={x:60,y:120,s:50};
for(const preset of presets){
  assert.ok(applyAppearance({...preset,outfit:'clay',hair:'silver'}));
  const look=currentAppearance();
  for(const options of [{pose:'front'},{pose:'back'},{pose:'left',walking:true},{pose:'right',feeding:true},{seated:true},{petting:true},{milking:true}]){
    colors.clear(); drawVisitor(ctx,projected,options);
    assert.ok(colors.has(look.hairColor)&&colors.has(look.coat),preset.id+JSON.stringify(options));
  }
  colors.clear(); drawHammock(ctx,projected,{occupied:true});
  assert.ok(colors.has(look.hairColor)&&colors.has(look.coat));
  const animal={x:1,z:1,size:.33};
  for(const kind of ['pet','tug']){
    colors.clear(); drawInteraction(ctx,{active:{kind,phase:'playing',animal,time:0}},player,()=>projected,0);
    assert.ok(colors.has(kind==='pet'?look.sleeve:look.coat));
  }
}
const reload=async tag=>(await import('../dist/game/visitor-appearance.js?'+tag)).currentAppearance();
assert.deepEqual(await reload('returning'),currentAppearance());
storage.set(appearanceKey,'{invalid');
assert.equal((await reload('invalid')).id,'straw');
delete globalThis.localStorage;
assert.equal(applyAppearance({id:'glasses'}),false);
assert.equal(currentAppearance().outfit,'navy');
console.log('Four visitor styles, walking, interiors/shared drawing, animal care, hammock and returning visitors passed.');
