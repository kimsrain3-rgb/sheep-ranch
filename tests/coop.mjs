import assert from 'node:assert/strict';
import {CONFIG,distance} from '../dist/game/config.js';
import {Flock} from '../dist/game/flock.js';
import {Companions} from '../dist/game/companions.js';
import {WeatherShelter} from '../dist/game/shelter.js';
import {drawCoop} from '../dist/render/shelter.js';

const barnRight=CONFIG.barn.x+CONFIG.barn.halfWidth;
const coopLeft=CONFIG.coop.x-CONFIG.coop.halfWidth;
assert.ok(coopLeft>barnRight&&coopLeft-barnRight<4,'coop stands beside the sheep barn with a walkable gap');

const flock=new Flock(),companions=new Companions(),shelter=new WeatherShelter();
const player={x:0,z:0},context={player,feeding:false,canTug:false};
const tick=()=>{
  const before=companions.chickens.map(a=>({x:a.x,z:a.z}));
  shelter.tick(.05,{flock,dogs:companions.dogs});
  flock.tick(.05,context);
  companions.tick(.05,{player,sheep:flock.animals,sheltering:shelter.active});
  companions.chickens.forEach((a,i)=>assert.ok(distance(a,before[i])<=.05*1.65+.00001,'chicken walks continuously'));
};
shelter.manual=true;shelter.updateWeather(.1,false);
let sheepHerd=false,chickenHerd=false;
for(let i=0;i<4000;i++){
  tick();
  sheepHerd ||= companions.dogs.some(a=>a.state==='herd');
  chickenHerd ||= companions.dogs.some(a=>a.state==='herd-chicken');
  if(shelter.inside===flock.animals.length&&companions.coopInside===companions.chickens.length)break;
}
assert.ok(sheepHerd&&chickenHerd,'dogs actively herd both groups');
assert.equal(shelter.inside,flock.animals.length,'sheep enter the barn');
assert.equal(companions.coopInside,CONFIG.chickens,'chickens enter their own coop');
assert.ok(companions.chickens.every(a=>a.hiddenInCoop&&distance(a,CONFIG.coop.entrance)<.4));

shelter.manual=false;for(let i=0;i<21;i++)shelter.updateWeather(1,false);
const exitSteps=companions.chickens.map(()=>-1);
for(let step=0;step<1000;step++){
  tick();
  companions.chickens.forEach((a,i)=>{if(!a.hiddenInCoop&&exitSteps[i]<0)exitSteps[i]=step;});
  if(companions.coopInside===0&&companions.chickens.every(a=>!a.state.startsWith('coop-')))break;
}
assert.equal(companions.coopInside,0,'all chickens leave after shelter clears');
assert.ok(exitSteps.every(step=>step>=0)&&exitSteps.at(-1)>exitSteps[0]+20,'chickens exit in a staggered stream');

let saves=0;const labels=[];
const canvas=new Proxy({},{get(_target,key){if(key==='save')return()=>saves++;if(key==='restore')return()=>saves--;if(key==='fillText')return text=>labels.push(text);return()=>{};},set(){return true;}});
const screen=drawCoop(canvas,{x:100,y:200,s:20},{inside:5,total:10,night:true});
assert.ok(screen.w>0&&screen.h>0);assert.equal(saves,0);
assert.ok(labels.includes('닭장'));assert.ok(labels.some(text=>text.includes('5 / 10')));
console.log('Chicken coop: adjacent building, active dog herding, continuous entry, staggered exit and occupancy sign passed.');
