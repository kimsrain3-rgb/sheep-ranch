import assert from 'node:assert/strict';
import {MeadowTime,parseMeadowTime} from '../dist/game/meadow-time.js';
import {MeadowWeather} from '../dist/game/weather.js';

const memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
const clock=new MeadowTime({storage});assert.equal(clock.value,'12:00');
const realMidnight={hour:0,minute:20,text:'오전 12:20',night:true,dusk:false,kind:'clear',wet:false,live:true,location:'서울'};
const day=clock.apply(realMidnight);
assert.equal(day.night,false,'a new visitor at real midnight still starts with sheep in daylight');
assert.equal(day.hour,12);assert.equal(day.minute,0);assert.equal(day.text,'오후 12:00');assert.equal(realMidnight.night,true,'time composition never mutates the weather source');
for(const [value,hour,minute,night,dusk,period] of [['07:00',7,0,false,false,'아침'],['12:00',12,0,false,false,'낮'],['18:00',18,0,false,true,'노을'],['22:00',22,0,true,false,'밤'],['00:05',0,5,true,false,'밤'],['23:59',23,59,true,false,'밤'],['06:00',6,0,false,true,'아침'],['19:00',19,0,true,false,'밤']]){
 assert.equal(clock.set(value),true);
 const chosen=clock.apply(realMidnight);assert.deepEqual([chosen.hour,chosen.minute,chosen.night,chosen.dusk,chosen.period],[hour,minute,night,dusk,period]);
 assert.equal(new MeadowTime({storage}).value,value,'the exact chosen minute survives a new visit');
}
const before=clock.value;
for(const value of ['24:00','07:60','-1:00','7:00','07:0','12:00:01','',null,undefined,NaN,'<script>']){
 assert.equal(parseMeadowTime(value),null);assert.equal(clock.set(value),false);assert.equal(clock.value,before,'invalid inputs cannot overwrite a valid saved time');
}
for(const saved of ['broken','{"version":2,"minutes":1320}','{"version":1,"minutes":-1}','{"version":1,"minutes":1440}','{"version":1,"minutes":720.5}']){
 assert.equal(new MeadowTime({storage:{getItem:()=>saved}}).value,'12:00','corrupt or incompatible data safely defaults to daytime');
}
const denied=new MeadowTime({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
assert.equal(denied.set('18:15'),true);assert.equal(denied.value,'18:15');assert.equal(denied.persistent,false,'blocked storage never prevents playing or selecting a time');
const noStorage=new MeadowTime({storage:null});assert.equal(noStorage.set('20:12'),true);assert.equal(noStorage.value,'20:12');
const otherVisitor=new MeadowTime({storage:{getItem:()=>null,setItem(){}}});assert.equal(otherVisitor.value,'12:00','visitors do not share one global server clock');

// Weather location, preview and real sunrise/sunset must never override the
// user's chosen scene, and the scene must never make rainy weather look dry.
const weather=new MeadowWeather({storage:null,now:()=>Date.parse('2026-11-19T15:00:00Z')});
weather.location={name:'서울',latitude:37.56,longitude:126.98,timezone:'Asia/Seoul'};
weather.current={kind:'rain',isDay:false,receivedAt:weather.now(),sunrise:weather.now()+3600000,sunset:weather.now()+7200000};
clock.set('12:34');let combined=clock.apply(weather.snapshot());assert.equal(combined.night,false);assert.equal(combined.wet,true);assert.equal(combined.kind,'rain');assert.equal(combined.minute,34);
weather.preview='clear';combined=clock.apply(weather.snapshot());assert.equal(combined.night,false);assert.equal(combined.wet,false);assert.equal(clock.value,'12:34');
weather.clear();assert.equal(clock.value,'12:34','disconnecting location never forgets personal time');
clock.set('22:00');assert.equal(clock.apply({night:false,kind:'clear',wet:false}).night,true,'a user may choose night during real daytime');
console.log('Personal time: midnight visits start in daylight, exact minute selection, morning/day/sunset/night, persistence, independent visitors, corrupt/blocked storage and separate weather passed.');
