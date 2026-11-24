import assert from 'node:assert/strict';
import {MeadowAudio} from '../dist/game/audio.js';
let count=0,plays=0,pauses=0,fail=false,release=null;
globalThis.Audio=class{constructor(src){this.src=src;this.currentTime=0;count++;}play(){plays++;if(fail)return Promise.reject(Error('blocked'));if(release!==null)return new Promise(resolve=>{release=resolve;});return Promise.resolve();}pause(){pauses++;}};
globalThis.AudioContext=class{resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}};
const audio=new MeadowAudio();
assert.equal(await audio.toggle(),true);assert.equal(audio.music.loop,true);assert.equal(audio.music.volume,.70);assert.ok(audio.music.src.endsWith('/assets/sounds/pastoral-loop.mp3'));
audio.music.currentTime=40;assert.equal(await audio.toggle(),false);assert.equal(audio.music.currentTime,40);assert.equal(audio.context.state,'suspended');assert.ok(pauses>0);
assert.equal(await audio.toggle(),true);assert.equal(count,1);await audio.toggle();
fail=true;await assert.rejects(audio.toggle());assert.equal(audio.enabled,false);assert.equal(audio.context.state,'running','music denial leaves available sheep audio running');
fail=false;release=()=>{};const a=audio.toggle(),b=audio.toggle();release();await Promise.all([a,b]);assert.equal(count,1);assert.equal(audio.enabled,true);assert.equal(plays,4);
console.log('Audio: one streamed looping MP3, 70% music volume, pause/resume position, no duplicate playback and independent playback when music is blocked passed.');

const before=plays;assert.equal(await audio.start(),true);assert.equal(await audio.start(),true);assert.equal(plays,before,"automatic start never toggles off or starts another track");

// Uploaded calls use decoded buffers, not oscillators or extra media elements.
release=null;
const sources=[],gains=[],panners=[];let downloads=0;
function node(extra={}){return {connect(target){return target;},disconnect(){this.disconnected=true;},...extra};}
globalThis.AudioContext=class{
 constructor(){this.currentTime=0;this.state='suspended';this.destination=node();}
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
 decodeAudioData(data){const clip=new Uint8Array(data)[0];return Promise.resolve({duration:clip===2?2.04:1.04,clip});}
 createBufferSource(){const s=node({start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}});sources.push(s);return s;}
 createGain(){const events=[];const g=node({gain:{events,setValueAtTime(v,t){events.push(['set',v,t]);},linearRampToValueAtTime(v,t){events.push(['ramp',v,t]);}}});gains.push(g);return g;}
 createStereoPanner(){const p=node({pan:{value:0}});panners.push(p);return p;}
};
const fetcher=async url=>{downloads++;const clip=Number(/voice(\d)/.exec(url)[1]);return {ok:true,arrayBuffer:async()=>new Uint8Array([clip]).buffer};};
const recorded=new MeadowAudio({random:()=>0,fetcher});
assert.equal(recorded.baa({x:1,z:0},{x:0,z:0}),false);assert.equal(downloads,0);
await recorded.start();await recorded.prepareCalls();assert.equal(recorded.calls.length,3);assert.equal(downloads,3);assert.equal(recorded.music.loop,true);
for(let i=0;i<3;i++){
 recorded.context.currentTime=i*3;
 assert.equal(recorded.baa({x:3,z:0},{x:0,z:0}),true);
 assert.equal(recorded.baa({x:3,z:0},{x:0,z:0}),false,'no overlapping calls');
 const source=sources.at(-1);assert.ok(source.started);source.onended();assert.ok(source.disconnected);assert.equal(recorded.activeCall,null);
}
assert.deepEqual(sources.map(s=>s.buffer.clip),[1,2,1],'random selection skips previous recording');
recorded.random=()=>.99;recorded.context.currentTime=9;
assert.equal(recorded.baa({x:3,z:0},{x:0,z:0}),true);assert.equal(sources.at(-1).buffer.clip,3,'third recording is selectable');
const closeGain=gains.at(-1).gain.events[1][1];assert.ok(panners.at(-1).pan.value>0);
assert.ok(Math.abs(closeGain-.588/1.3)<1e-8,'reference sheep call at distance 3 uses the agreed ranch mix');
sources.at(-1).onended();recorded.context.currentTime=12;
recorded.baa({x:30,z:0},{x:0,z:0},Math.PI);assert.ok(panners.at(-1).pan.value<0);
assert.ok(gains.at(-1).gain.events[1][1]<closeGain,'distant animals sound quieter');
const active=sources.at(-1);await recorded.toggle();assert.ok(active.stopped);assert.equal(recorded.activeCall,null);
assert.equal(recorded.baa({x:0,z:0},{x:0,z:0}),false);await recorded.start();await recorded.prepareCalls();assert.equal(downloads,3,'decoded clips are reused');
recorded.context.currentTime=15;recorded.baa({x:0,z:0},{x:0,z:0});sources.at(-1).onended();recorded.context.currentTime=16;
assert.equal(recorded.baa({x:0,z:0},{x:0,z:0}),false,'cooldown remains in effect even after a short clip ends');
const partial=new MeadowAudio({fetcher:async url=>{if(url.includes('voice2'))throw Error('missing');return fetcher(url);}});await partial.start();await partial.prepareCalls();assert.equal(partial.calls.length,2);
console.log('Recorded sheep: all three MP3s selectable, no immediate repeats/overlap, distance and yaw, cooldown, cleanup, decoded-buffer reuse and partial download failure passed.');

// A blocked automatic resume can stay pending even after the visitor taps.
let rejectAutomatic, pendingResume=true;
globalThis.AudioContext=class{
  constructor(){this.state='suspended';}
  resume(){
    if(pendingResume)return new Promise((_,reject)=>{rejectAutomatic=reject;});
    this.state='running';return Promise.resolve();
  }
  suspend(){this.state='suspended';return Promise.resolve();}
};
const intro=new MeadowAudio();
const automatic=intro.start();
const oneTrack=intro.music;
pendingResume=false;
assert.equal(await intro.start({gesture:true}),true);
rejectAutomatic(Error('late automatic rejection'));
assert.equal(await automatic,false);
assert.equal(intro.music,oneTrack);
assert.ok(intro.enabled);
assert.equal(intro.context.state,'running','late rejection cannot stop the unlocked sound');
const starts=plays;
await intro.start();
assert.equal(plays,starts,'entering the meadow keeps playing the same track');
console.log('Welcome audio: immediate attempt, gesture during pending autoplay and late rejection passed.');

const workingContext=recorded.context.constructor;
globalThis.AudioContext=class{resume(){return Promise.reject(Error('blocked'));}};
const musicOnly=new MeadowAudio();
await assert.rejects(musicOnly.start());
assert.ok(musicOnly.musicPlaying,'welcome music keeps playing even when sheep audio is blocked');
globalThis.AudioContext=workingContext;
let readyCount=0;
const voicesOnly=new MeadowAudio({fetcher,onCallsReady:()=>readyCount++});
fail=true;
await assert.rejects(voicesOnly.start());
await voicesOnly.prepareCalls();
assert.equal(readyCount,1);
assert.ok(voicesOnly.baa({x:0,z:0},{x:0,z:0}),'welcome sheep can call while music is blocked');
fail=false;
await voicesOnly.start({gesture:true});
assert.equal(readyCount,1,'first tap does not replay the opening call');
