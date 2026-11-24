import assert from 'node:assert/strict';

globalThis.Image = class {
  naturalWidth=1280;
  complete=true;
};
const {drawVisitor,visitorPose}=await import('../dist/visitor.js');
const {currentAppearance,applyAppearance}=await import('../dist/game/visitor-appearance.js');
const storage=new Map();
globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)};
assert.equal(currentAppearance().id,'mint');
applyAppearance({id:'mint',hat:true,bag:true});
const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{})});
const draws=[],rotations=[];
ctx.drawImage=(img,...rect)=>draws.push([img.src.split('/').pop(),...rect]);
ctx.rotate=angle=>rotations.push(angle);
function render(options){
  draws.length=0;rotations.length=0;
  drawVisitor(ctx,{x:100,y:200,s:40},{...options,label:false});
  return draws.filter(call=>call[0]==='mint-avatar.webp');
}
for(let index=0;index<8;index++){
  const yaw=index*Math.PI/4;
  const pose=visitorPose(0,-1,yaw);
  const idle=render({pose});
  assert.deepEqual(idle.map(row=>row.slice(1,3)),[[index*160,5*232]]);
  assert.equal(draws.filter(d=>d[0]==='mint-items.webp').length,2);
  const layers=render({pose,time:.21,walking:true});
  assert.deepEqual(layers.slice(0,3).map(d=>d.slice(1,3)),[[index*160,232],[index*160,464],[index*160,0]]);
  if(index===2){
    const a=rotations.slice(0,2);
    render({pose,time:.21+.5/1.15,walking:true});
    assert.ok(a[0]*a[1]<0 && a[0]*rotations[0]<0 && a[1]*rotations[1]<0);
  }
}
for(const action of [{seated:true},{milking:true},{petting:true,lambSize:.33}])assert.ok(render({pose:'right',...action}).length>=3);
applyAppearance({id:'mint',hat:false,bag:true});
render({pose:'back'});
assert.equal(draws.filter(d=>d[0]==='mint-items.webp').length,1);
const restored=(await import('../dist/game/visitor-appearance.js?reload-mint')).currentAppearance();
assert.deepEqual([restored.id,restored.hat,restored.bag],['mint',false,true]);
const {drawTramRide}=await import('../dist/render/tram-ride.js');
globalThis.window={devicePixelRatio:1};
ctx.createLinearGradient=()=>({addColorStop(){}});
let hip;
ctx.transform=(sx,b,c,sy,x,y)=>{hip={x,y,sx,sy};};
const surface=()=>({clientWidth:390,clientHeight:844,dataset:{},getContext:()=>ctx});
drawTramRide(surface(),surface(),'북극',.1,.36,.02);
assert.ok(hip.x-.66*hip.sx>0 && hip.x+.66*hip.sx<390,'portrait cabin frames the bob on the bench');
console.log('Eight camera-relative painted views, alternating feet, care poses and saved accessories passed.');
