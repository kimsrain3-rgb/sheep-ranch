import assert from 'node:assert/strict';
import {Flock} from '../dist/game/flock.js';
import {Interactions} from '../dist/game/interactions.js';
import {Companions} from '../dist/game/companions.js';
import {CONFIG,seededRandom,distance,keepDry} from '../dist/game/config.js';
const player={x:0,z:0,tx:0,tz:0,walking:false},view={zoom:1.65,yaw:1.2,pitch:.23};
let flock=new Flock(),care=new Interactions(flock),pets=new Companions();
assert.equal(flock.adults.length,50);assert.equal(flock.lambs.length,12);
assert.equal(new Set(flock.animals.map(a=>a.id)).size,62);
assert.equal(pets.chickens.length,10);assert.equal(pets.dogs.length,2);
assert.ok(flock.animals.some(a=>a.state==='sleep'));
assert.ok(flock.animals.some(a=>a.state==='drinking'));
assert.ok(flock.lambs.some(a=>a.state==='nurse-go'));
assert.ok(flock.lambs.every(a=>a.size===a.mother.size/3));
// A sleeping sheep stays still, then wakes without invalid coordinates.
const sleepy=flock.adults[4],before={x:sleepy.x,z:sleepy.z};
flock.tick(.1,{player,canTug:false});assert.equal(distance(sleepy,before),0);
// A nursing pair has one reservation and can be cleanly interrupted.
const baby=flock.lambs[2],mother=baby.mother;
assert.equal(mother.nursingWith,baby);flock.lock(baby,'pet');
assert.equal(mother.nursingWith,null);assert.equal(mother.state,'roam');flock.unlock(baby);
// Close-up finish and cancellation both restore exact previous camera settings.
let result=care.request('pet',flock.adults[0],player,view);assert.equal(result.ok,true);
Object.assign(player,{x:player.tx,z:player.tz});care.tick(.1,{player,view});
assert.equal(care.active.phase,'playing');care.tick(1,{player,view});assert.ok(view.zoom>1.65);
care.tick(6,{player,view});assert.equal(care.active,null);assert.equal(view.zoom,1.65);assert.equal(view.yaw,1.2);assert.equal(flock.adults[0].lock,null);
assert.equal(care.request('milk',flock.adults[0],player,view).ok,false);
result=care.request('milk',flock.lambs[0],player,view);assert.equal(result.ok,true);
Object.assign(player,{x:player.tx,z:player.tz});care.tick(.1,{player,view});let milkEvents=0;
care.tick(9,{player,view,onMilk:()=>milkEvents++});assert.equal(milkEvents,1);assert.equal(care.active,null);
assert.equal(care.request('milk',flock.lambs[0],player,view).ok,false);
care.request('pet',flock.adults[1],player,view);care.cancel(view);assert.equal(flock.adults[1].lock,null);
// Warehouse arrival is required; carried hay can only be dropped once.
Object.assign(player,{x:0,z:0});care.goForHay(player);care.tick(.1,{player,view});assert.equal(care.carrying,false);
Object.assign(player,CONFIG.shed.entrance);care.tick(.1,{player,view});assert.equal(care.carrying,true);
assert.equal(care.dropHay(player),true);assert.equal(care.dropHay(player),false);
assert.equal(care.hayPiles.length,1);assert.equal(care.hayPiles[0].portions,10);
// Eating hay is finite; no negative portions or double spending between sheep.
const pile=care.hayPiles[0];for(let i=0;i<6;i++){const a=flock.adults[i];flock.unlock(a);a.x=pile.x+i*.1;a.z=pile.z;a.cool=0;a.state='hay-eat';a.pileId=pile.id;}
for(let i=0;i<1200;i++)flock.tick(1/60,{player,hayPiles:care.hayPiles,canTug:false});assert.equal(pile.portions,0);
// A playful sheep reserves just one interaction, and cancellation releases it.
assert.equal(care.startTug(flock.adults[1],player,view),true);
assert.equal(care.startTug(flock.adults[8],player,view),false);care.cancel(view);
// Stable feed positions and ten minutes of mixed behavior at varying frame times.
flock=new Flock(seededRandom(77));care=new Interactions(flock);pets=new Companions();
flock.assignFeedSlots(player);const slots=flock.animals.map(a=>a.feedSlot);const states=new Set();let fed=0,bleats=0;
for(let i=0;i<18000;i++){
 const dt=i%7===0?.06:.025,feeding=i%3000<750;
 flock.tick(dt,{player,feeding,hayPiles:care.hayPiles,yaw:i*.001,canTug:false,onFed:()=>fed++,onBaa:()=>bleats++});pets.tick(dt,{player,sheep:flock.animals,yaw:i*.001});
 for(const a of flock.animals){states.add(a.state);assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.z)&&Number.isFinite(a.headX)&&Number.isFinite(a.headY));assert.ok(a.cool>=0);if(a.isLamb)assert.ok(a.mother);}
}
assert.deepEqual(flock.animals.map(a=>a.feedSlot),slots);assert.ok(fed>0);assert.ok(bleats>0);
assert.ok(states.has('sleep')&&states.has('drinking')&&states.has('nursing'));
assert.equal(pets.animals.length,12);assert.ok(pets.animals.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.z)));
const wet={x:CONFIG.pond.x,z:CONFIG.pond.z};keepDry(wet);assert.ok(distance(wet,CONFIG.pond)>6);
console.log('Behavior regression passed: counts, sleep, nursing reservations, pet/milk camera restore, cooldown, warehouse trip, finite hay, single tug, long mixed simulation.');
