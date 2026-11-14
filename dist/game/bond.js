import {browserStorage} from './persistence.js?v=night-barn';
// Stable animal IDs and versioned, browser-local records. No login or shared ownership.
export class SheepBond{
  constructor({storage=browserStorage()}={}){
    this.storage=storage;this.points={};this.names={};this.friendId=null;this.savedAt=0;this.dirty=false;this.persistent=!!storage;this.time=0;this.followUntil=0;this.nextVisit=0;this.greeted=false;
    try{const data=JSON.parse(storage?.getItem('meadow.bond.v1')||'null');if(data?.version===1){
      for(const [id,p] of Object.entries(data.points||{}))if(/^sheep-\d+$/.test(id)&&Number.isFinite(p))this.points[id]=Math.max(0,Math.min(p,10000));
      for(const [id,name] of Object.entries(data.names||{}))if(/^sheep-\d+$/.test(id)&&typeof name==='string')this.names[id]=name.slice(0,16);
      if(/^sheep-\d+$/.test(data.friendId))this.friendId=data.friendId;
    }}catch{this.persistent=false;}
  }
  apply(flock){for(const a of flock.adults){if(this.names[a.id])a.name=this.names[a.id];a.isFriend=a.id===this.friendId;}for(const a of flock.lambs)a.name=a.mother.name+'의 아기양';}
  add(animal,amount){
    if(!animal||animal.isLamb||amount<=0)return;
    this.points[animal.id]=Math.min(10000,(this.points[animal.id]||0)+amount);this.dirty=true;
    if(!this.friendId&&this.points[animal.id]>=6){this.friendId=animal.id;this.nextVisit=0;}
  }
  name(animal,name,flock){
    if(!animal||animal.isLamb)return false;
    const clean=String(name).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,16);if(!clean)return false;
    this.names[animal.id]=clean;this.friendId=animal.id;this.dirty=true;this.apply(flock);this.save();return true;
  }
  save(){
    if(!this.dirty)return;
    try{this.storage?.setItem('meadow.bond.v1',JSON.stringify({version:1,points:this.points,names:this.names,friendId:this.friendId}));this.dirty=false;}catch{this.persistent=false;}
    this.savedAt=this.time;
  }
  tick(dt,{flock,player,active,feeding=false,available=true,yaw=0,notify=()=>{}}){
    this.time+=dt;
    if(active?.kind==='pet'&&active.phase==='playing'&&active.animal.careContact)this.add(active.animal,dt);
    if(this.dirty&&this.time-this.savedAt>2)this.save();
    const a=flock.adults.find(a=>a.id===this.friendId);if(!a)return;
    a.isFriend=true;const familiar=(this.points[a.id]||0)>=6;
    if(!available||!familiar||a.lock||feeding||a.state.startsWith('shelter')||a.state==='drinking'||a.state==='nurse-wait'){
      if(a.state.startsWith('friend-')){a.state='roam';a.tx=a.x;a.tz=a.z;}
      a.begging=false;return;
    }
    if(!a.state.startsWith('friend-')&&this.time>=this.nextVisit&&['roam','sleep'].includes(a.state)){
      this.followUntil=this.time+22;this.nextVisit=this.time+45;
      if(!this.greeted){notify(`${a.name}가 나를 알아보고 다가와요.`);this.greeted=true;}
      flock.setState(a,'friend-go');
    }
    if(a.state.startsWith('friend-')){
      if(this.time>this.followUntil){a.state='roam';a.begging=false;a.decision=15;a.tx=a.x;a.tz=a.z;return;}
      const dx=a.x-player.x,dz=a.z-player.z,d=Math.hypot(dx,dz);
      a.tx=player.x+2.1;a.tz=player.z+.8;
      if(d>3.2){a.state='friend-go';flock.move(a,dt,d>10?2:1.25,yaw);a.begging=false;}
      else{a.state='friend-wait';a.walking=false;a.begging=a.cool<=0;}
    }
  }
}
