import {distance,keepDry} from './config.js?v=solid-buildings-2';
export class LambPlay{
  constructor(random=Math.random){this.random=random;this.time=0;this.next=4;this.groups=[];}
  tick(dt,{flock,feeding=false,sheltering=false,yaw=0}){
    this.time+=dt;
    for(const group of this.groups){
      const [a,b]=group.animals;
      if(sheltering||feeding||group.until<=this.time||group.animals.some(a=>a.lock||a.state!=='play')){
        for(const child of group.animals){child.hop=0;if(child.state==='play'){child.state='roam';child.decision=12;}}
        group.done=true;continue;
      }
      for(const [i,child] of group.animals.entries()){
        const angle=this.time*1.25+i*Math.PI;
        const target={x:group.x+Math.cos(angle)*1.7,z:group.z+Math.sin(angle)*1.2};keepDry(target);
        child.tx=target.x;child.tz=target.z;flock.move(child,dt,1.9,yaw);flock.head(child,dt,false);
        const phase=(this.time+i*.35)%1.5;
        child.hop=phase<.65?Math.sin(phase/.65*Math.PI)*.6:0;
      }
    }
    this.groups=this.groups.filter(g=>!g.done);
    if(this.time<this.next||feeding||sheltering)return;
    this.next=this.time+8+this.random()*8;
    if(this.groups.length>=2)return;
    const candidates=flock.lambs.filter(a=>!a.lock&&a.state==='roam'&&!a.mother.lock);
    let pair;
    for(const a of candidates){const b=candidates.find(b=>b!==a&&distance(a,b)<14);if(b){pair=[a,b];break;}}
    if(!pair)return;
    for(const a of pair){flock.releasePair(a);a.state='play';a.walking=true;}
    const center={x:(pair[0].x+pair[1].x)/2,z:(pair[0].z+pair[1].z)/2};keepDry(center);
    this.groups.push({animals:pair,...center,until:this.time+7+this.random()*4});
  }
}
