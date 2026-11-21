import assert from 'node:assert/strict';
import {places,mapDestination} from '../dist/ranch-map.js';
import {CONFIG,isWater,BRIDGE,bridgeLocal} from '../dist/game/config.js';
import {dryRoute} from '../dist/game/navigation.js';
import {groveRoute} from '../dist/game/fir-grove.js';
const grove=places.find(p=>p.kind==='forest');
for(const point of places){
  const goal=mapDestination(point);
  const route=groveRoute(grove,dryRoute(grove,goal));
  assert.ok(!isWater(goal));
  assert.ok(Math.hypot(route.at(-1).x-goal.x,route.at(-1).z-goal.z)<.13,point.name);
}
assert.equal(mapDestination(CONFIG.pond).name,'가까운 물가');
assert.equal(mapDestination(CONFIG.barn).kind,'barn');
assert.equal(mapDestination({x:900,z:999}).x,CONFIG.playerBounds.maxX);
const route=dryRoute({x:-5,z:-33},{x:22,z:-28});
assert.ok(route.some(p=>Math.abs(bridgeLocal(p).u)<BRIDGE.halfLength+1&&Math.abs(bridgeLocal(p).v)<1));
assert.deepEqual(route.at(-1),{x:22,z:-28});
console.log('Map destinations reach named places, resolve water and building taps, and use bridge approaches.');
