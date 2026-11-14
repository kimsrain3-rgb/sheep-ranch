import {
  CONFIG,distance,keepDry,seededRandom
} from './config.js?v=living-meadow';
import {dryRoute} from './navigation.js?v=living-meadow';
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
  tick(dt,{
    player,sheep,yaw=0,sheltering=false,shepherd=null
  }){
    this.time+=dt;
    for(const a of this.animals){
      a.timer-=dt;
      let speed;
      if(a.type==='chicken'){
        if(a.timer<=0){
          a.state=a.state==='peck'?'walk':'peck';
          a.timer=2+this.random()*5;
          a.tx=a.x+(this.random()-.5)*6;
          a.tz=a.z+(this.random()-.5)*6;
        }
        speed=a.state==='walk'?.55:0;
      }
      // Escort ownership comes before weather: this dog stays with the boy.
      else if(a.role==='escort'&&shepherd){
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
        const outside=sheep.filter(s=>s.state==='shelter-go').sort((a,b)=>distance(b,CONFIG.barn.entrance)-distance(a,CONFIG.barn.entrance));
        const target=outside[this.dogs.indexOf(a)%Math.max(1,outside.length)];
        a.state=target?'herd':'rest';
        if(target){const dx=target.x-CONFIG.barn.entrance.x,dz=target.z-CONFIG.barn.entrance.z,d=Math.hypot(dx,dz)||1;a.tx=target.x+dx/d*3;a.tz=target.z+dz/d*3;}
        else{a.tx=CONFIG.barn.entrance.x+(this.dogs.indexOf(a)?3:-3);a.tz=CONFIG.barn.entrance.z-2;}
        speed=target?2.5:1;
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
      const dx=a.tx-a.x,dz=a.tz-a.z,d=Math.hypot(dx,dz);
      a.walking=speed>0&&d>.45;
      if(a.walking){
        a.x+=dx/d*Math.min(d,dt*speed);
        a.z+=dz/d*Math.min(d,dt*speed);
        keepDry(a);
        const side=dx*Math.cos(yaw)-dz*Math.sin(yaw);
        if(Math.abs(side)>.2)a.dir=side>0?1:-1;
      }
    }
  }
}
