import assert from 'node:assert/strict';
import {Flock} from '../dist/game/flock.js';
import {Interactions} from '../dist/game/interactions.js';
import {MeadowView} from '../dist/orbit.js';
import {visitorPose} from '../dist/visitor.js';
import {petArmPose} from '../dist/render/pet-pose.js';
import {petZoom} from '../dist/game/petting.js';
for(const size of [.8,1.18,.8/3,1.18/3])for(const yaw of [-Math.PI,-Math.PI/2,0,Math.PI/2,Math.PI-.01])for(const startSide of [-1,1]){
 const flock=new Flock(),animal=size<.5?flock.lambs[0]:flock.adults[0];Object.assign(animal,{x:3,z:6,size});
 const care=new Interactions(flock),player={x:3+startSide*6,z:6,tx:0,tz:0},view=new MeadowView();view.yaw=yaw;
 const before={x:player.x,z:player.z};care.request('pet',animal,player,view);
 assert.deepEqual({x:player.x,z:player.z},before,'request never teleports player');
 assert.equal(animal.careContact,false);
 Object.assign(player,{x:player.tx,z:player.tz});
 for(let i=0;i<100&&care.active.phase!=='playing';i++)care.tick(.025,{player,view,width:780,height:360});
 assert.equal(care.active.phase,'playing');assert.equal(animal.careContact,true);
 for(let i=0;i<30;i++)care.tick(.025,{player,view,width:780,height:360});
 assert.ok(['left','right'].includes(visitorPose(animal.x-player.x,animal.z-player.z,view.yaw)));
 view.target=care.cameraTarget(player);
 const pp=view.project(player.x,player.z,0,780,360),ap=view.project(animal.x,animal.z,0,780,360);
 const gap=Math.abs(ap.x-pp.x)-pp.s*.35-ap.s*animal.size*1.05;
 assert.ok(gap>0,'torso and fleece silhouettes remain separated');
 const arm=petArmPose(pp,ap,animal,0),length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 assert.ok(Math.abs(length(arm.shoulder,arm.elbow)-arm.bone)<1e-7);
 assert.ok(Math.abs(length(arm.elbow,arm.hand)-arm.bone)<1e-7);
 assert.ok(length(arm.hand,arm.contact)<pp.s*.015,'normal-length arm touches the near fleece');
 // Sample an entire stroke: a single frame cannot catch straight-arm popping.
 const poses=Array.from({length:121},(_,i)=>petArmPose(pp,ap,animal,i/120*Math.PI*2/3.4));
 for(const [i,pose] of poses.entries()){
   assert.ok(Math.abs(pose.bone-arm.bone)<1e-7,'arm length stays constant through a stroke');
   assert.ok(Math.abs(length(pose.shoulder,pose.elbow)-pose.bone)<1e-7);
   assert.ok(Math.abs(length(pose.elbow,pose.hand)-pose.bone)<1e-7);
   assert.ok(length(pose.shoulder,pose.hand)<=pose.bone*1.8+1e-7,'elbow keeps a bend instead of locking straight');
   assert.ok(length(pose.hand,pose.contact)<1e-7,'hand keeps its stroke on the fleece');
   if(i>0)assert.ok(length(pose.elbow,poses[i-1].elbow)<pp.s*.025,'elbow has no sudden step');
   if(i>1){
     const previous=poses[i-1].elbow,older=poses[i-2].elbow;
     const acceleration=Math.hypot(pose.elbow.x-2*previous.x+older.x,pose.elbow.y-2*previous.y+older.y);
     assert.ok(acceleration<pp.s*.004,'elbow changes direction smoothly');
   }
 }
 const handY=poses.map(pose=>pose.hand.y);
 assert.ok(Math.max(...handY)-Math.min(...handY)>=pp.s*.159,'visible hand movement is preserved');
 care.cancel(view);assert.equal(view.yaw,yaw);assert.equal(view.zoom,1.65);assert.equal(animal.careContact,false);
}
assert.ok(petZoom(780,360)<petZoom(390,780),'landscape closeup fits its shorter viewport');
console.log('Side petting: left/right approaches, five camera angles, adult/lamb sizes, visible body separation, fixed arm lengths, fleece contact and exact camera restore passed.');
