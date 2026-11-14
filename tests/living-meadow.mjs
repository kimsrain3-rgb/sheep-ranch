import assert from 'node:assert/strict';
import {MeadowWeather,weatherKind,localClock,citySearchTerm} from '../dist/game/weather.js';
import {SheepBond} from '../dist/game/bond.js';
import {WeatherShelter} from '../dist/game/shelter.js';
import {LambPlay} from '../dist/game/lamb-play.js';
import {Flock} from '../dist/game/flock.js';
import {Companions} from '../dist/game/companions.js';
import {CONFIG,distance} from '../dist/game/config.js';
assert.equal(citySearchTerm('양주시').term,'Yangju');assert.equal(citySearchTerm('서울').korean,true);
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
assert.deepEqual([0,2,3,45,61,75,95].map(weatherKind),['clear','clouds','overcast','fog','rain','snow','rain']);
assert.equal(localClock(new Date('2026-11-14T15:05:00Z'),'Asia/Seoul').text,'오전 12:05');
assert.equal(localClock(new Date('2026-11-14T03:05:00Z'),'Asia/Seoul').night,false);
let now=100000,calls=0;
const weather=new MeadowWeather({storage,now:()=>now,fetcher:async url=>{calls++;assert.equal(url.searchParams.get('latitude'),'37.56');return {ok:true,json:async()=>({timezone:'Asia/Seoul',current:{weather_code:75,cloud_cover:100,is_day:0}})};}});
await weather.choose({name:'서울',latitude:37.566,longitude:126.978});assert.equal(weather.snapshot().kind,'snow');assert.equal(weather.snapshot().night,true);
weather.tick();assert.equal(calls,1,'no fetch per frame');
weather.preview='rain';assert.equal(weather.snapshot().preview,true);
const restored=new MeadowWeather({storage,now:()=>now});assert.equal(restored.location.name,'서울');assert.equal(restored.preview,'live');
now+=61*60*1000;weather.preview='live';assert.equal(weather.snapshot().live,false,'stale weather is not presented as current');
weather.clear();assert.equal(weather.location,null);assert.equal(memory.has('meadow.weather.v1'),false);
const failing=new MeadowWeather({storage,fetcher:async()=>{throw Error('offline');},now:()=>now});await failing.choose({latitude:0,longitude:0,name:'테스트'});assert.match(failing.status,/지연/);assert.equal(failing.snapshot().live,false);
// An older request must not overwrite a newly selected city.
const resolvers=[];const race=new MeadowWeather({storage:null,fetcher:()=>new Promise(resolve=>resolvers.push(resolve))});
const first=race.choose({latitude:1,longitude:1,name:'이전'}),second=race.choose({latitude:2,longitude:2,name:'최근'});
resolvers[1]({ok:true,json:async()=>({current:{weather_code:0,is_day:1}})});await second;
resolvers[0]({ok:true,json:async()=>({current:{weather_code:75,is_day:0}})});await first;assert.equal(race.location.name,'최근');assert.equal(race.current.kind,'clear');
const flock=new Flock(),player={x:0,z:0},bond=new SheepBond({storage});
const animal=flock.adults[0];bond.add(animal,5);assert.equal(bond.friendId,null);bond.add(animal,2);assert.equal(bond.friendId,animal.id);
assert.equal(bond.name(animal,'  별이  ',flock),true);assert.equal(animal.name,'별이');assert.equal(flock.lambs[0].name,'별이의 아기양');
const returning=new SheepBond({storage});returning.apply(flock);assert.equal(returning.friendId,animal.id);assert.equal(returning.points[animal.id],7);
returning.tick(.1,{flock,player});assert.equal(animal.state,'friend-go');assert.ok(distance(animal,player)>0);
returning.tick(100,{flock,player,available:false});assert.equal(returning.points[animal.id],7,'absence never erodes affection');
const stranger=new SheepBond({storage:null});assert.equal(stranger.friendId,null,'different browser has independent sheep');
const blocked=new SheepBond({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});blocked.add(animal,7);blocked.save();assert.equal(blocked.persistent,false);
const herd=new Flock(),dogs=new Companions(),shelter=new WeatherShelter();
const context={player:{x:0,z:0},feeding:false,canTug:false};
for(let i=0;i<2;i++)shelter.updateWeather(1,true);assert.equal(shelter.active,false);shelter.updateWeather(1,true);assert.equal(shelter.active,true);
let dogMoved=false;
for(let i=0;i<5000;i++){
 const before=dogs.dogs[0].x;shelter.tick(.05,{flock:herd,dogs:dogs.dogs});herd.tick(.05,context);dogs.tick(.05,{player,sheep:herd.animals,sheltering:true});if(dogs.dogs[0].x!==before)dogMoved=true;
}
assert.equal(shelter.inside,herd.animals.length,'all sheep reach shelter including routes around pond');assert.ok(dogMoved);
assert.ok(herd.animals.every(a=>a.hiddenInBarn&&!a.walking));
for(let i=0;i<19;i++)shelter.updateWeather(1,false);assert.equal(shelter.active,true);shelter.updateWeather(1,false);assert.equal(shelter.active,false);
for(let i=0;i<1400;i++){shelter.tick(.05,{flock:herd,dogs:dogs.dogs});herd.tick(.05,context);}
assert.ok(herd.animals.every(a=>!a.hiddenInBarn&&!a.state.startsWith('shelter')),'sheep leave in a staggered stream');
const babies=new Flock(),play=new LambPlay(()=>.5);
for(const [i,a] of babies.lambs.entries()){babies.releasePair(a);Object.assign(a,{x:i*.6,z:10,state:'roam',decision:100});}
for(let i=0;i<100;i++){babies.tick(.05,context);play.tick(.05,{flock:babies});}
assert.ok(play.groups.length>0);assert.ok(babies.lambs.some(a=>a.hop>0));
const group=play.groups[0];babies.lock(group.animals[0],'milk');play.tick(.05,{flock:babies});
assert.equal(group.animals[0].state,'milk');assert.equal(group.animals[1].state,'roam');assert.ok(group.animals.every(a=>a.hop===0));
play.tick(15,{flock:babies,sheltering:true});assert.equal(play.groups.length,0);
assert.ok([...babies.animals,...herd.animals].every(a=>Number.isFinite(a.x)&&Number.isFinite(a.z)));
console.log('Living meadow: weather mapping, time zones, offline/stale/race handling, local bond/name persistence, independent visitors, herd shelter/exit, active dogs, lamb play and care cancellation passed.');
