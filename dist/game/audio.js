// No network/audio assets required. Quiet formant synthesis with distance attenuation.
export class MeadowAudio {
  constructor(){
    this.context=null;
    this.enabled=false;
    this.lastBaa=-10;
  }
  async toggle(){
    if(!this.context){
      const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!AC)throw Error('Audio unavailable');
      this.context=new AC();
      const c=this.context,b=c.createBuffer(1,c.sampleRate*4,c.sampleRate),data=b.getChannelData(0);
      let prev=0;
      for(let i=0;i<data.length;i++){
        prev=(prev+(Math.random()*2-1)*.03)/1.02;
        data[i]=prev;
      }
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
      source.buffer=b;
      source.loop=true;
      filter.type='lowpass';
      filter.frequency.value=420;
      gain.gain.value=.11;
      source.connect(filter).connect(gain).connect(c.destination);
      source.start();
    }
    this.enabled=!this.enabled;
    await this.context[this.enabled?'resume':'suspend']();
    return this.enabled;
  }
  baa(animal,player,yaw=0){
    if(!this.enabled||!this.context)return;
    const c=this.context,now=c.currentTime;
    if(now-this.lastBaa<2.5)return;
    this.lastBaa=now;
    const dx=(animal?.x??player.x)-player.x,dz=(animal?.z??player.z)-player.z,d=Math.hypot(dx,dz),volume=.075/(1+d*.12);
    const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(),vib=c.createOscillator(),vg=c.createGain();
    o.type='sawtooth';
    const pitch=animal?.isLamb?280:175;
    o.frequency.setValueAtTime(pitch,now);
    o.frequency.linearRampToValueAtTime(pitch*.85,now+.7);
    vib.frequency.value=7;
    vg.gain.value=9;
    vib.connect(vg).connect(o.frequency);
    f.type='bandpass';
    f.frequency.value=850;
    f.Q.value=.7;
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(volume,now+.12);
    g.gain.setValueAtTime(volume*.7,now+.35);
    g.gain.exponentialRampToValueAtTime(.0001,now+.95);
    o.connect(f).connect(g);
    if(c.createStereoPanner){
      const pan=c.createStereoPanner();
      pan.pan.value=Math.max(-.8,Math.min(.8,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/15));
      g.connect(pan).connect(c.destination);
    }
    else g.connect(c.destination);
    o.start();
    vib.start();
    o.stop(now+1);
    vib.stop(now+1);
  }
}
