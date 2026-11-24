import {
  CONFIG,distance,keepDry,seededRandom,actorRadius,buildingAccess,buildingPathClear
} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';
export class Companions {
  constructor(random=seededRandom(8703)){
    this.random=random;
    this.chickens=Array.from({
      length:CONFIG.chickens
    },(_,i)=>({
      id:'chicken-'+i,type:'chicken',x:5+random()*13,z:9+random()*17,tx:0,tz:0,phase:random()*7,dir:1,timer:random()*5,state:'peck'
    }));
    this.dogs=Array.from({
      length:CONFIG.dogs
    },(_,i)=>({
      id:'dog-'+i,name:i?'보리개':'바람개',type:'dog',x:i?4.45:12,z:i?.45:16,tx:0,tz:0,phase:i*3,dir:1,timer:0,state:i?'rest':'patrol',role:i?'escort':'shepherd'
    }));
    this.animals=[...this.chickens,...this.dogs];
    this.time=0;
  }
  get coopInside(){return this.chickens.filter(a=>a.hiddenInCoop).length;}
  move(a,dt,speed,yaw){
    const goal={x:a.tx,z:a.tz};keepDry(goal,{radius:actorRadius(a),access:buildingAccess(a)});a.tx=goal.x;a.tz=goal.z;
    if(!a.walkGoal||distance(a.walkGoal,goal)>.15){
      a.walkGoal=goal;a.walkRoute=buildingPathClear(a,goal,CONFIG)?null:dryRoute(a,goal);
    }
    while(a.walkRoute?.length&&distance(a,a.walkRoute[0])<.15)a.walkRoute.shift();
    const target=a.walkRoute?.[0]||goal,dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz);
    a.walking=speed>0&&d>.08;
    if(!a.walking)return;
    a.x+=dx/d*Math.min(d,dt*speed);a.z+=dz/d*Math.min(d,dt*speed);keepDry(a);
    const side=dx*Math.cos(yaw)-dz*Math.sin(yaw);
    if(Math.abs(side)>.2)a.dir=side>0?1:-1;
  }
  tickChicken(a,index,dt,{sheltering,yaw}){
    a.timer-=dt;
    if(sheltering){
      if(a.hiddenInCoop){a.state='coop-inside';a.walking=false;return;}
      if(a.state!=='coop-go'){
        a.state='coop-go';a.coopRoute=dryRoute(a,CONFIG.coop.entrance);
      }
      if(a.coopRoute.length>1&&distance(a,a.coopRoute[0])<.3)a.coopRoute.shift();
      const target=a.coopRoute[0]||CONFIG.coop.entrance;
      a.tx=target.x;a.tz=target.z;
      const driven=this.dogs.some(d=>d.state==='herd-chicken'&&distance(d,a)<7);
      this.move(a,dt,driven?1.65:1.05,yaw);
      if(distance(a,target)<.3)a.coopRoute.shift();
      if(!a.coopRoute.length&&distance(a,CONFIG.coop.entrance)<.4){
        a.hiddenInCoop=true;a.walking=false;a.state='coop-inside';
      }
      return;
    }
    if(a.state.startsWith('coop-')){
      if(a.state!=='coop-exit'){a.state='coop-exit';a.exitDelay=index*.3;}
      if(a.hiddenInCoop){
        a.exitDelay-=dt;a.walking=false;
        if(a.exitDelay>0)return;
        a.hiddenInCoop=false;
      }
      a.tx=CONFIG.coop.entrance.x+3+(index%4)*1.4;
      a.tz=CONFIG.coop.entrance.z-5-(index%3)*.8;
      this.move(a,dt,1.05,yaw);
      if(distance(a,{x:a.tx,z:a.tz})<.25){a.state='peck';a.timer=2+this.random()*3;}
      return;
    }
    if(a.timer<=0){
      a.state=a.state==='peck'?'walk':'peck';
      a.timer=2+this.random()*5;
      a.tx=a.x+(this.random()-.5)*6;
      a.tz=a.z+(this.random()-.5)*6;
    }
    this.move(a,dt,a.state==='walk'?.55:0,yaw);
  }
  tick(dt,{
    player,sheep,yaw=0,sheltering=false,shepherd=null,held=null
  }){
    this.time+=dt;
    for(const [index,a] of this.chickens.entries()){
      if(a===held&&!sheltering){a.walking=false;continue;}
      this.tickChicken(a,index,dt,{sheltering,yaw});
    }
    const sheepOutside=sheltering?sheep.filter(s=>s.state==='shelter-go').sort((a,b)=>distance(b,CONFIG.barn.entrance)-distance(a,CONFIG.barn.entrance)):[];
    const chickensOutside=sheltering?this.chickens.filter(a=>a.state==='coop-go').sort((a,b)=>distance(b,CONFIG.coop.entrance)-distance(a,CONFIG.coop.entrance)):[];
    for(const a of this.dogs){
      if(a===held&&!sheltering){a.walking=false;continue;}
      if(a.buildingAccess==='lodge'&&a.z<CONFIG.lodge.entrance.z-actorRadius(a)-.05)a.buildingAccess=null;
      a.timer-=dt;
      if(!sheltering&&a.hiddenInLodge){
        a.hiddenInLodge=false;a.lodgeRoute=[];a.x=CONFIG.lodge.entrance.x;a.z=CONFIG.lodge.entrance.z;a.buildingAccess='lodge';
      }
      let speed;
      const preferred=a.role==='escort'?chickensOutside:sheepOutside;
      const other=a.role==='escort'?sheepOutside:chickensOutside;
      const target=sheltering?(preferred[0]||other[this.dogs.indexOf(a)%Math.max(1,other.length)]):null;
      if(target){
        a.hiddenInLodge=false;
        const entrance=target.type==='chicken'?CONFIG.coop.entrance:CONFIG.barn.entrance;
        const dx=target.x-entrance.x,dz=target.z-entrance.z,d=Math.hypot(dx,dz)||1;
        const goal={x:target.x+dx/d*2.5,z:target.z+dz/d*2.5};keepDry(goal);
        a.herdTimer=(a.herdTimer||0)-dt;
        if(a.herdTarget!==target.id||!a.herdRoute?.length||a.herdTimer<=0){
          a.herdTarget=target.id;a.herdRoute=dryRoute(a,goal);a.herdTimer=.65;
        }
        if(a.herdRoute.length>1&&distance(a,a.herdRoute[0])<.3)a.herdRoute.shift();
        const waypoint=a.herdRoute[0]||goal;a.tx=waypoint.x;a.tz=waypoint.z;
        a.state=target.type==='chicken'?'herd-chicken':'herd';speed=2.5;
      }
      else if(sheltering&&shepherd?.insideLodge){
        if(a.hiddenInLodge){a.walking=false;a.state='lodge-rest';continue;}
        if(!a.lodgeRoute?.length)a.lodgeRoute=dryRoute(a,CONFIG.lodge.entrance);
        if(a.lodgeRoute.length>1&&distance(a,a.lodgeRoute[0])<.3)a.lodgeRoute.shift();
        const waypoint=a.lodgeRoute[0]||CONFIG.lodge.entrance;
        a.tx=waypoint.x;a.tz=waypoint.z;a.state='lodge-go';speed=2;
      }
      else if(a.role==='escort'&&shepherd){
        a.lodgeRoute=[];
        const goal={x:shepherd.x+1.65,z:shepherd.z-.65};keepDry(goal);
        const gap=distance(a,goal);
        a.escortMoving=gap>(a.escortMoving ? .55 : 1);
        if(a.escortMoving){
          a.routeTimer=(a.routeTimer||0)-dt;
          if(!a.escortRoute?.length||a.routeTimer<=0){a.escortRoute=dryRoute(a,goal);a.routeTimer=.6;}
          if(a.escortRoute.length>1&&distance(a,a.escortRoute[0])<.4)a.escortRoute.shift();
          const waypoint=a.escortRoute[0]||goal;a.tx=waypoint.x;a.tz=waypoint.z;
          speed=distance(a,shepherd)>4?2.7:2;
          a.state='follow';
        }else{
          a.tx=a.x;a.tz=a.z;a.escortRoute=[];speed=0;a.state='rest';
          const face=(shepherd.x-a.x)*Math.cos(yaw)-(shepherd.z-a.z)*Math.sin(yaw);
          if(Math.abs(face)>.2)a.dir=face>0?1:-1;
        }
      }
      else if(sheltering){
        a.state='rest';a.tx=CONFIG.barn.entrance.x-3;a.tz=CONFIG.barn.entrance.z-2;speed=1;
      }
      else{
        if(a.timer<=0){
          const near=sheep.filter(s=>!s.isLamb&&distance(s,player)<40),target=near[Math.floor(this.random()*near.length)]||player;
          a.tx=target.x+5;
          a.tz=target.z+3;
          a.timer=8+this.random()*8;
        }
        a.state='patrol';
        speed=.8;
      }
      this.move(a,dt,speed,yaw);
      if(target&&a.herdRoute.length>1&&distance(a,a.herdRoute[0])<.3)a.herdRoute.shift();
      if(a.state==='lodge-go'&&distance(a,CONFIG.lodge.entrance)<.35){
        a.hiddenInLodge=true;a.state='lodge-rest';a.walking=false;a.lodgeRoute=[];
      }
    }
  }
}
