import assert from 'node:assert/strict';
import {createArcticLanding,stepArctic,walkOnIce,returnToArcticTram,ICE} from '../dist/game/arctic-landing.js';

const shore=createArcticLanding(),pup=shore.seal;
const seconds=n=>{for(let i=0;i<Math.round(n*30);i++){
  stepArctic(shore,1/30);
  assert.ok(pup.x>=ICE.left+.45&&pup.x<=ICE.right-.45);
  assert.ok(pup.z>=ICE.front+.55&&pup.z<=ICE.back-.55);
}};
const start=[pup.x,pup.z];
seconds(3);
assert.deepEqual([pup.x,pup.z],start);
shore.phase='disembark';
seconds(2.2);
assert.equal(shore.phase,'walk');
for(const [x,z] of [[8,13],[-10,17]]){
  walkOnIce(shore,x,z);seconds(9);
  assert.ok(Math.hypot(shore.x-x,shore.z-z)<.03);
  assert.ok(Math.abs(Math.hypot(shore.x-pup.x,shore.z-pup.z)-1.15)<.015);
  const stop=[pup.x,pup.z,pup.stride];seconds(1);
  assert.deepEqual([pup.x,pup.z,pup.stride],stop);
}
returnToArcticTram(shore);seconds(12);
assert.equal(shore.phase,'inside');
assert.equal(shore.seal,pup);
assert.ok(pup.z>=ICE.front+.55);
const next=createArcticLanding();
assert.notEqual(next.seal,pup);
assert.deepEqual([next.seal.x,next.seal.z],start);
console.log('Harp seal waits on arrival, follows and rests on the ice, stays ashore on return, and resets per visit.');
