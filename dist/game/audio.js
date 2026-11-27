const MUSIC_VOLUME = 1;
const SHEEP_CALL_GAIN = 0.84;

// Original uploaded recordings; gain offsets balance their measured loudness.
export const SHEEP_CALLS=[{file:'sheep-voice1.mp3',gain:.72},{file:'sheep-voice2.mp3',gain:.5},{file:'sheep-voice3.mp3',gain:1}];
// Stream background music, decode short calls once, never synthesize replacement calls.
export class MeadowAudio {
  constructor({random=Math.random,onCallsReady=()=>{},fetcher=globalThis.fetch?.bind(globalThis)}={}){
    this.context=null;
    this.enabled=false;
    this.musicPlaying=false;
    this.onCallsReady=onCallsReady;
    this.callsAnnounced=false;
    this.lastBaa=-10;
    this.chickenBuffers=[];
    this.chickenLoading=null;
    this.chickenIndex=0;
    this.nextChickenTime=0;
    this.chickenSource=null;
    this.music=null;
    this.pending=null;
    this.attempt=0;
    this.random=random;this.fetcher=fetcher;this.calls=[];this.callsLoading=null;this.lastCallIndex=-1;this.activeCall=null;this.callCount=0;
  }
  start({gesture=false}={}){
    if(this.enabled)return Promise.resolve(true);
    // Some browsers leave automatic resume pending until a real gesture.
    if(this.pending&&!gesture)return this.pending;
    const attempt=++this.attempt;
    const pending=this.play(attempt).finally(()=>{
      if(this.pending===pending)this.pending=null;
    });
    this.pending=pending;
    return pending;
  }
  toggle(){
    if(this.pending)return this.pending;
    if(!this.enabled)return this.start();
    this.music.pause();
    this.musicPlaying=false;
    this.stopCall();
    this.stopChicken();
    this.pending=this.context.suspend().then(()=>{
      this.enabled=false;
      return false;
    }).finally(()=>{this.pending=null;});
    return this.pending;
  }
  async play(attempt){
    try{
      await Promise.all([this.startMusic(),this.startVoices()]);
      if(attempt!==this.attempt)return false;
      this.enabled=true;
      return true;
    }catch(error){
      if(attempt!==this.attempt)return false;
      // A restriction on one audio API must not silence the other.
      this.enabled=false;
      throw error;
    }
  }
  async startMusic(){
    if(this.musicPlaying&&this.music?.paused!==true)return;
    if(!this.music){
      this.music=new Audio(new URL('../assets/sounds/pastoral-loop.mp3',import.meta.url).href);
      this.music.loop=true;
      this.music.volume=MUSIC_VOLUME;
      this.music.preload='none';
      this.music.id='background-music';
      this.music.hidden=true;
      globalThis.document?.body?.append?.(this.music);
    }
    await this.music.play();
    this.musicPlaying=true;
  }
  async startVoices(){
    if(!this.context){
      const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!AC)throw Error('Sheep audio unavailable');
      this.context=new AC();
    }
    // Fetch the calls while the browser decides whether it can resume audio.
    const clips=this.prepareCalls();
    if(this.context.state!=='running')await this.context.resume();
    void clips.then(ready=>{
      if(ready.length&&!this.callsAnnounced&&this.context.state==='running'){
        this.callsAnnounced=true;
        this.onCallsReady();
      }
    });
  }
  prepareCalls(){
    if(this.callsLoading)return this.callsLoading;
    if(!this.fetcher||!this.context?.decodeAudioData)return Promise.resolve([]);
    this.callsLoading=Promise.all(SHEEP_CALLS.map(async clip=>{
      const url=new URL('../assets/sounds/'+clip.file,import.meta.url).href;
      try{
        const response=await this.fetcher(url);if(!response.ok)throw Error('Missing sheep clip');
        const buffer=await this.context.decodeAudioData(await response.arrayBuffer());
        if(!Number.isFinite(buffer.duration)||buffer.duration<=0)throw Error('Invalid sheep clip');
        return {...clip,url,buffer};
      }catch{return null;}
    })).then(results=>{
      this.calls=results.filter(Boolean);
      this.music?.setAttribute?.('data-sheep-voices-ready',String(this.calls.length));
      return this.calls;
    });
    return this.callsLoading;
  }
  stopChicken(){
    const source=this.chickenSource;
    if(source){this.chickenSource=null;source.stop();}
  }
  chickenNearby(distance){
    const c=this.context;
    if(!c || c.state!=='running' || distance>6){
      this.stopChicken();
      return;
    }
    if(!this.chickenLoading && this.fetcher && c.decodeAudioData){
      const files=['chekin_voice1.mp3','chekin_voice2.mp3'];
      this.chickenLoading=Promise.all(files.map(async file=>{
        try{
          const url=new URL('../assets/sounds/originals/'+file,import.meta.url);
          const response=await this.fetcher(url.href);
          if(response.ok)return await c.decodeAudioData(await response.arrayBuffer());
        }catch{}
        return null;
      })).then(buffers=>{this.chickenBuffers=buffers.filter(Boolean);});
    }
    if(this.chickenSource || !this.chickenBuffers.length || c.currentTime<this.nextChickenTime)return;
    const source=c.createBufferSource(),gain=c.createGain();
    source.buffer=this.chickenBuffers[this.chickenIndex];
    gain.gain.value=.78/(1+.14*distance);
    source.connect(gain).connect(c.destination);
    source.onended=()=>{
      source.disconnect();gain.disconnect();
      if(this.chickenSource===source)this.chickenSource=null;
    };
    source.start();
    this.chickenSource=source;
    this.chickenIndex=(this.chickenIndex+1)%this.chickenBuffers.length;
    this.nextChickenTime=c.currentTime+source.buffer.duration+3;
  }
  stopCall(){
    const call=this.activeCall;this.activeCall=null;
    if(call){try{call.source.stop();}catch{}call.cleanup();}
  }
  baa(animal,player,yaw=0){
    if(!this.context||this.context.state!=='running'||!this.calls.length||this.activeCall)return false;
    const c=this.context,now=c.currentTime;
    if(now-this.lastBaa<2.5)return false;
    const dx=(animal?.x??player.x)-player.x,dz=(animal?.z??player.z)-player.z,d=Math.hypot(dx,dz);
    if(d>45)return false;
    // Uniform random choice without immediately repeating the last recording.
    const choices=this.calls.map((_,i)=>i).filter(i=>this.calls.length===1||i!==this.lastCallIndex);
    const index=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))],clip=this.calls[index];
    const source=c.createBufferSource(),gain=c.createGain(),pan=c.createStereoPanner?.();
    source.buffer=clip.buffer;
    const volume=SHEEP_CALL_GAIN*clip.gain/(1+d*.1),duration=clip.buffer.duration;
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.015);
    gain.gain.setValueAtTime(volume,now+Math.max(.015,duration-.04));gain.gain.linearRampToValueAtTime(0,now+duration);
    source.connect(gain);
    if(pan){pan.pan.value=Math.max(-.8,Math.min(.8,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/15));gain.connect(pan).connect(c.destination);}
    else gain.connect(c.destination);
    let cleaned=false;
    const call={source,cleanup:()=>{
      if(cleaned)return;cleaned=true;
      if(this.activeCall===call)this.activeCall=null;
      source.disconnect();gain.disconnect();pan?.disconnect();
    }};
    source.onended=call.cleanup;
    this.activeCall=call;
    try{source.start();}catch{call.cleanup();return false;}
    this.lastBaa=now;this.lastCallIndex=index;this.callCount++;
    this.music?.setAttribute?.('data-last-sheep-voice',clip.file);
    this.music?.setAttribute?.('data-sheep-call-count',String(this.callCount));
    return true;
  }
}
