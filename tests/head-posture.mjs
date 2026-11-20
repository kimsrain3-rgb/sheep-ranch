import assert from 'node:assert/strict';
import {Flock} from '../dist/game/flock.js';

const flock=new Flock(undefined,{adults:45,lambs:12});
const poses=flock.animals.map(a=>a.headPosture);
assert.equal(new Set(poses).size,57);
assert.equal(new Set(poses.map(p=>p.index)).size,3);
const sheep=flock.adults[0],lamb=flock.lambs[0],seen=new Set();
const step=()=>flock.tick(.05,{player:{x:0,z:0},canTug:false});
for(let i=0;i<2000;i++){
  const previous=sheep.headPosture.angle;
  step();
  seen.add(sheep.headPosture.index);
  assert.ok(Math.abs(sheep.headPosture.angle-previous)<.075);
}
assert.equal(seen.size,3);
for(const [state,contact,expected] of [['drinking',false,.32],['sleep',false,.20],['pet',true,-.14]]){
  flock.setState(sheep,state,20);
  sheep.lock=state;sheep.careContact=contact;
  for(let i=0;i<70;i++)step();
  assert.ok(Math.abs(sheep.headPosture.angle-expected)<.002,state);
}

// Trace the neck rotation through each production sprite path, including mirrored sheep.
const originalImage=globalThis.Image;
globalThis.Image=class{complete=true;naturalWidth=700;};
try{
  const {drawSheep}=await import('../dist/render/sheep.js?head-posture-test');
  const options={project:()=>({x:100,y:100,s:50}),time:1,width:400,height:300,player:{x:0,z:0}};
  for(const [animal,appearance] of [[sheep,'newSheepAppearance'],[sheep,'thirdSheepAppearance'],[sheep,'fifthSheepAppearance'],[sheep,''],[lamb,'']]){
    for(const dir of [-1,1]){
      const sample={...animal,dir,state:'roam',hiddenInBarn:false,careContact:false,walking:false};
      if(appearance)sample[appearance]=true;
      function headRotation(angle){
        const stack=[];let rotation=0,head;
        const context=new Proxy({}, {get(_,key){
          if(key==='save')return ()=>stack.push(rotation);
          if(key==='restore')return ()=>{rotation=stack.pop();};
          if(key==='rotate')return value=>{rotation+=value;};
          if(key==='drawImage')return image=>{if(/head\.png$/.test(image.src))head=rotation;};
          return ()=>{};
        }});
        sample.headPosture={angle};
        drawSheep(context,sample,options);
        return head;
      }
      assert.ok(Math.abs(headRotation(.24)-headRotation(0)-.24)<1e-8,appearance||animal.id);
    }
  }
}finally{
  if(originalImage===undefined)delete globalThis.Image;else globalThis.Image=originalImage;
}
console.log('Sheep head postures: three poses, individual timing, smooth transitions, activity targets and sprite pivots passed.');
