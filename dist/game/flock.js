import {
  CONFIG,clamp,distance,keepDry,seededRandom,actorRadius,buildingAccess,buildingPathClear
} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';
import {riverPathClear} from './waterways.js?v=lake-bridge-1';
const NAMES=['구름이','솜이','보리','몽실이','두부','우유','콩이','단추','포근이','밀크','달이','풀잎이'];
const STATIONARY=new Set(['sleep','drinking','nursing','nurse-wait','hay-eat','pet','milk','tug']);

const HEAD_ANGLES=[-.21,0,.28]; // Looking up, level, and down on right-facing artwork.

function chooseHeadPosture(pose,index){
  pose.index=index;
  pose.target=HEAD_ANGLES[index]+(pose.random()-.5)*.075;
  pose.remaining=2.5+pose.random()*6;
}

function updateHeadPosture(animal,dt){
  const pose=animal.headPosture;
  pose.remaining-=dt;
  if(pose.remaining<=0){
    chooseHeadPosture(pose,(pose.index+1+Math.floor(pose.random()*2))%3);
  }
  let target=pose.target;
  if(animal.state==='drinking'||animal.state==='hay-eat')target=.32;
  else if(animal.state==='sleep')target=.20;
  else if(animal.state==='nursing'||animal.state==='tug')target=0;
  else if(animal.careContact||animal.begging)target=-.14;
  pose.angle+=(target-pose.angle)*(1-Math.exp(-dt*2.4));
}

export class Flock {
  constructor(random=seededRandom(),counts=CONFIG){
    this.random=random;
    this.nextBaa=5;
    this.time=0;
    const range=(a,b)=>a+random()*(b-a);
    this.adults=Array.from({
      length:counts.adults
    },(_,i)=>{
      const angle=i/counts.adults*Math.PI*2,r=18+range(0,48);
      const x=i===0?3:i<12?range(-22,22):Math.sin(angle)*r;
      const z=i===0?6:i<12?range(5,35):Math.cos(angle)*r;
      return {
        id:'sheep-'+i,name:NAMES[i]||'솜뭉치 '+(i+1),x,z,tx:x,tz:z,
        phase:range(0,7),size:range(.8,1.18),state:'roam',timer:0,decision:range(8,35),
        cool:0,bite:0,pet:0,hunger:0,dir:1,walking:false,lock:null,feedSlot:i,
        headX:.83,headY:-1.05,screen:null,nursingWith:null,tugCooldown:range(25,80),
        spots:Array.from({
          length:30
        },()=>({
          x:range(-.76,.75),y:range(-.45,.43),r:range(.17,.29)
        }))
      };
    });
    this.lambs=this.adults.slice(0,counts.lambs).map((mother,i)=>({
      ...mother,
      id:'lamb-'+i,name:mother.name+'의 아기양',mother,isLamb:true,size:mother.size/3,
      x:mother.x+(i%2?-1.65:1.65),z:mother.z-.6,phase:range(0,7),decision:range(15,45),
      milkCooldown:0,nursingWith:null,screen:null
    }));
    this.animals=[...this.adults,...this.lambs];
    // Each sheep has its own timing without consuming the movement random stream.
    this.animals.forEach((animal,index)=>{
      const seed=1+(Math.floor(animal.phase*1000000)+index*7919)%2147483646;
      const pose={random:seededRandom(seed)};
      chooseHeadPosture(pose,Math.floor(pose.random()*3));
      pose.angle=pose.target;
      animal.headPosture=pose;
    });
    for(const animal of this.animals){keepDry(animal);animal.tx=animal.x;animal.tz=animal.z;}
    // Living scenes are present from the first visit, not only after a long wait.
    for(const i of [4,13,27,36])if(this.adults[i])this.setState(this.adults[i],'sleep',15+i*.4);
    if(this.adults[6])Object.assign(this.adults[6],{
      x:CONFIG.drinkingSpots[0].x,z:CONFIG.drinkingSpots[0].z,tx:CONFIG.drinkingSpots[0].x,tz:CONFIG.drinkingSpots[0].z,drinkSpot:0
    });
    if(this.adults[6])this.setState(this.adults[6],'drinking',8);
    if(this.lambs[2])this.beginNursing(this.lambs[2]);
  }
  setState(a,state,timer=0){
    a.state=state;
    a.timer=timer;
    if(STATIONARY.has(state))a.walking=false;
  }
  releasePair(a){
    const child=a.isLamb?a:a.nursingWith,mother=a.isLamb?a.mother:a;
    if(child&&(child.state==='nursing'||child.state==='nurse-go')){
      child.state='roam';
      child.decision=35;
    }
    if(mother?.nursingWith===child){
      mother.nursingWith=null;
      if(mother.state==='nurse-wait')mother.state='roam';
    }
  }
  beginNursing(lamb){
    const mother=lamb.mother;
    if(!mother||mother.lock||mother.nursingWith||lamb.lock||lamb.milkCooldown>0)return false;
    this.releasePair(lamb);
    mother.nursingWith=lamb;
    this.setState(mother,'nurse-wait',22);
    this.setState(lamb,'nurse-go',18);
    return true;
  }
  lock(a,kind){
    this.releasePair(a);
    a.lock=kind;
    a.careContact=false;
    this.setState(a,kind);
    a.tx=a.x;
    a.tz=a.z;
  }
  unlock(a){
    if(!a)return;
    a.lock=null;
    a.careContact=false;
    a.pet=0;
    this.setState(a,'roam');
    a.decision=18;
  }
  assignFeedSlots(player){
    [...this.animals].sort((a,b)=>distance(a,player)-distance(b,player)).forEach((a,i)=>a.feedSlot=i);
  }
  move(a,dt,speed,yaw){
    const options={radius:actorRadius(a),access:buildingAccess(a)},goal={x:a.tx,z:a.tz};
    keepDry(goal,options);a.tx=goal.x;a.tz=goal.z;
    if(!a.walkGoal||distance(a.walkGoal,goal)>.35){
      a.walkGoal=goal;
      a.walkRoute=riverPathClear(a,goal)&&buildingPathClear(a,goal,CONFIG,options)?null:dryRoute(a,goal);
    }
    while(a.walkRoute?.length&&distance(a,a.walkRoute[0])<.24)a.walkRoute.shift();
    const waypoint=a.walkRoute?.[0],target=waypoint||goal;
    const dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz),stop=waypoint?.05:a.isLamb?.3:.2;
    a.walking=d>(a.walking?stop:waypoint?.08:a.isLamb?.7:.3);
    if(a.walking){
      const amount=Math.min(d,dt*speed);
      a.x+=dx/d*amount;
      a.z+=dz/d*amount;
      keepDry(a);
      const side=dx*Math.cos(yaw)-dz*Math.sin(yaw);
      if(Math.abs(side)>.18)a.dir=side>0?1:-1;
    }
    return d;
  }
  tick(dt,{
    player,feeding=false,yaw=0,hayPiles=[],canTug=true,onFed=()=>{
    },onBaa=()=>{
    },onTug=()=>{
    }
  }){
    this.time+=dt;
    this.nextBaa-=dt;
    if(this.nextBaa<=0){
      const near=this.animals.filter(a=>distance(a,player)<35&&!a.lock&&!a.hiddenInBarn);
      if(near.length)onBaa(near[Math.floor(this.random()*near.length)]);
      this.nextBaa=7+this.random()*12;
    }
    for(const a of this.animals){
      updateHeadPosture(a,dt);
      a.cool=Math.max(0,a.cool-dt);
      a.bite=Math.max(0,a.bite-dt);
      a.pet=Math.max(0,a.pet-dt*.45);
      a.milkCooldown=Math.max(0,(a.milkCooldown||0)-dt);
      a.decision-=dt;
      a.timer-=dt;
      a.tugCooldown-=dt;
      if(a.lock){
        if(a.lock!=='tug'){a.walking=false;this.head(a,dt,true);}
        continue;
      }
      // External coordinators own these activities; never advance two behaviors at once.
      if(a.state.startsWith('shelter')||(!feeding&&(a.state==='play'||a.state.startsWith('friend-')))){
        this.head(a,dt,a.state.startsWith('friend-'));continue;
      }
      if(feeding&&a.cool===0){
        this.releasePair(a);
        this.setState(a,'hand-feed');
        const rank=a.feedSlot,ring=Math.floor(rank/8);
        a.tx=player.x+Math.sin(rank*2.4)*(1.3+ring*1.25);
        a.tz=player.z+2.5+ring*1.3+rank%3*.55;
        this.move(a,dt,a.isLamb?1.8:1.6,yaw);
        if(distance(a,player)<5.8){
          a.hunger+=dt;
          if(a.hunger>=2.2){
            a.hunger=0;
            a.cool=22+this.random()*12;
            a.bite=2.1;
            onFed(a);
          }
        }
        else a.hunger=0;
      }
      else{
        a.hunger=0;
        if(a.state==='hand-feed')this.setState(a,'roam');
        if(a.state==='nurse-go'){
          if(a.timer<=0||a.mother.lock||a.mother.nursingWith!==a){
            this.releasePair(a);
            this.setState(a,'roam');
          }
          else{
            a.tx=a.mother.x+.25;
            a.tz=a.mother.z-.18;
            this.move(a,dt,.95,yaw);
            if(distance(a,{
              x:a.tx,z:a.tz
            })<.75)this.setState(a,'nursing',CONFIG.durations.nurse);
          }
        }
        else if(a.state==='nursing'){
          a.walking=false;
          a.x=a.mother.x+.25;
          a.z=a.mother.z-.18;
          if(a.timer<=0||a.mother.lock){
            this.releasePair(a);
            a.milkCooldown=35;
            this.setState(a,'roam');
          }
        }
        else if(a.state==='nurse-wait'){
          a.walking=false;
          if(a.timer<=0||!a.nursingWith){
            this.releasePair(a);
            this.setState(a,'roam');
          }
        }
        else if(a.state==='sleep'||a.state==='drinking'){
          a.walking=false;
          if(a.timer<=0){
            this.setState(a,'roam');
            a.decision=15+this.random()*20;
          }
        }
        else if(a.state==='drink-go'){
          const spot=CONFIG.drinkingSpots[a.drinkSpot??0];
          a.tx=spot.x;
          a.tz=spot.z;
          this.move(a,dt,.55,yaw);
          if(distance(a,spot)<.8)this.setState(a,'drinking',CONFIG.durations.drink);
          else if(a.timer<=0)this.setState(a,'roam');
        }
        else if(a.state==='hay-go'||a.state==='hay-eat'){
          const pile=hayPiles.find(p=>p.id===a.pileId&&p.portions>0);
          if(!pile){
            this.setState(a,'roam');
            a.pileId=null;
          }
          else{
            const angle=a.feedSlot*2.4;
            a.tx=pile.x+Math.sin(angle)*1.4;
            a.tz=pile.z+Math.cos(angle)*1.1;
            if(distance(a,pile)<2.1){
              this.setState(a,'hay-eat');
              a.walking=false;
              a.hayBite=(a.hayBite||0)+dt;
              if(a.hayBite>=4&&pile.portions>0){
                a.hayBite=0;
                pile.portions--;
                a.bite=1;
                a.cool=5;
                onFed(a);
              }
            }
            else{
              a.state='hay-go';
              this.move(a,dt,.75,yaw);
            }
          }
        }
        else{
          const pile=hayPiles.find(p=>p.portions>0&&distance(a,p)<22);
          if(pile&&a.cool===0){
            a.pileId=pile.id;
            this.setState(a,'hay-go');
          }
          else if(a.decision<=0){
            a.decision=18+this.random()*32;
            const choice=this.random();
            if(a.isLamb&&choice<.45)this.beginNursing(a);
            else if(choice<.23)this.setState(a,'sleep',CONFIG.durations.sleep*(.6+this.random()));
            else if(choice<.43){
              a.drinkSpot=Math.floor(this.random()*CONFIG.drinkingSpots.length);
              this.setState(a,'drink-go',160);
            }
          }
          if(a.state==='roam'){
            if(a.isLamb){
              a.tx=a.mother.x+Math.sin(a.phase)*1.7;
              a.tz=a.mother.z-.65;
            }
            else if(distance(a,{
              x:a.tx,z:a.tz
            })<.4||this.random()<dt*.035){
              const b=CONFIG.bounds;
              a.tx=clamp(a.x+(this.random()-.5)*9,b.minX,b.maxX);
              a.tz=clamp(a.z+(this.random()-.5)*10,b.minZ,b.maxZ);
            }
            this.move(a,dt,a.isLamb?.65:.35,yaw);
          }
        }
      }
      // Only two adults are playful; interaction coordinator owns the actual tug.
      if(canTug&&!feeding&&!a.isLamb&&['sheep-1','sheep-8'].includes(a.id)&&a.state==='roam'&&a.tugCooldown<=0){
        a.tx=player.x+1;
        a.tz=player.z+.1;
        if(distance(a,player)<1.6){
          a.tugCooldown=65;
          onTug(a);
        }
        else this.move(a,dt,.65,yaw);
      }
      if(a.state==='drinking'){
        const dx=CONFIG.pond.x-a.x,dz=CONFIG.pond.z-a.z;
        a.dir=dx*Math.cos(yaw)-dz*Math.sin(yaw)>=0?1:-1;
      }
      this.head(a,dt,feeding&&distance(a,player)<10);
    }
  }
  head(a,dt,toward){
    const blend=1-Math.exp(-dt*7),low=['drinking','hay-eat','nursing'].includes(a.state)||(!a.walking&&a.cool>0);
    const hx=toward||a.state==='pet'||a.state==='milk'?0:a.dir*.83,hy=low?-.45:a.state==='sleep'?-.78:-1.05;
    a.headX+=(hx-a.headX)*blend;
    a.headY+=(hy-a.headY)*blend;
  }
}
