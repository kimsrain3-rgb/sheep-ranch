// Original uploaded recordings; gain offsets balance their measured loudness.
export const SHEEP_CALLS=[{file:'sheep-voice1.mp3',gain:.72},{file:'sheep-voice2.mp3',gain:.5},{file:'sheep-voice3.mp3',gain:1}];
// Stream background music, decode short calls once, never synthesize replacement calls.
export class MeadowAudio {
  constructor({random=Math.random,fetcher=globalThis.fetch?.bind(globalThis)}={}){
    this.context=null;
    this.enabled=false;
    this.lastBaa=-10;
    this.music=null;
    this.pending=null;
    this.random=random;this.fetcher=fetcher;this.calls=[];this.callsLoading=null;this.lastCallIndex=-1;this.activeCall=null;this.callCount=0;
  }
  async start(){
    if(this.enabled)return true;
    return this.toggle();
  }
  async toggle(){
    // Repeated taps share the in-flight action instead of starting duplicate music.
    if(this.pending)return this.pending;
    this.pending=this.togglePlayback();
    try{return await this.pending;}finally{this.pending=null;}
  }
  async togglePlayback(){
    if(!this.context){
      const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!AC)throw Error('Audio unavailable');
      this.context=new AC();
    }
    if(!this.music){
      this.music=new Audio(new URL('../assets/pastoral-loop.mp3',import.meta.url).href);
      this.music.loop=true;
      this.music.volume=.22;
      this.music.preload='none';
      this.music.id='background-music';
      this.music.hidden=true;
      globalThis.document?.body?.append?.(this.music);
    }
    if(this.enabled){
      this.music.pause();
      this.stopCall();
      await this.context.suspend();
      this.enabled=false;
      return false;
    }
    try{
      // Invoke both while the user's tap is active (needed on mobile browsers).
      await Promise.all([this.context.resume(),this.music.play()]);
      this.enabled=true;
      void this.prepareCalls();
      return true;
    }catch(error){
      this.music.pause();
      this.enabled=false;
      await this.context.suspend();
      throw error;
    }
  }
  prepareCalls(){
    if(this.callsLoading)return this.callsLoading;
    if(!this.fetcher||!this.context?.decodeAudioData)return Promise.resolve([]);
    this.callsLoading=Promise.all(SHEEP_CALLS.map(async clip=>{
      const url=new URL('../assets/'+clip.file,import.meta.url).href;
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
  stopCall(){
    const call=this.activeCall;this.activeCall=null;
    if(call){try{call.source.stop();}catch{}call.cleanup();}
  }
  baa(animal,player,yaw=0){
    if(!this.enabled||!this.context||this.context.state!=='running'||!this.calls.length||this.activeCall)return false;
    const c=this.context,now=c.currentTime;
    if(now-this.lastBaa<2.5)return false;
    const dx=(animal?.x??player.x)-player.x,dz=(animal?.z??player.z)-player.z,d=Math.hypot(dx,dz);
    if(d>45)return false;
    // Uniform random choice without immediately repeating the last recording.
    const choices=this.calls.map((_,i)=>i).filter(i=>this.calls.length===1||i!==this.lastCallIndex);
    const index=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))],clip=this.calls[index];
    const source=c.createBufferSource(),gain=c.createGain(),pan=c.createStereoPanner?.();
    source.buffer=clip.buffer;
    const volume=.42*clip.gain/(1+d*.1),duration=clip.buffer.duration;
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
