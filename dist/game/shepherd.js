import {CONFIG,distance} from './config.js?v=living-meadow';
import {dryRoute} from './navigation.js?v=living-meadow';
// The NPC owns only its own movement. It never locks sheep or changes care records.
export class ShepherdBoy{
  constructor(){
    this.id='shepherd-boy';this.name='소년 목동';this.x=2.8;this.z=1.1;this.tx=this.x;this.tz=this.z;
    this.headingX=0;this.headingZ=-1;this.walking=false;this.state='greet';this.timer=7;this.time=0;this.route=[];this.task=0;this.wet=false;this.screen=null;
  }
  greet(player){
    this.state='greet';this.timer=5;this.walking=false;this.route=[];
    this.headingX=player.x-this.x;this.headingZ=player.z-this.z;
    if(Math.hypot(this.headingX,this.headingZ)<.01)this.headingZ=-1;
  }
  go(destination){this.route=dryRoute(this,destination);this.state='walk';this.timer=0;}
  tick(dt,{player,sheep=[],sheltering=false}){
    this.time+=dt;this.timer-=dt;this.walking=false;
    if(sheltering!==this.wet){this.wet=sheltering;this.route=[];if(sheltering)this.go({x:CONFIG.barn.entrance.x+3,z:CONFIG.barn.entrance.z-1});else{this.state='watch';this.timer=3;}}
    if(this.state==='greet'&&this.timer>0)return;
    if(this.state==='watch'&&this.timer>0)return;
    if(this.state!=='walk'){
      if(sheltering){
        const entrance={x:CONFIG.barn.entrance.x+3,z:CONFIG.barn.entrance.z-1};
        if(distance(this,entrance)>.3)this.go(entrance);
        else{this.state='watch';this.timer=5;this.headingX=-1;this.headingZ=0;return;}
      }
      if(!sheltering){
      this.task++;
      const nearby=sheep.filter(a=>!a.hiddenInBarn&&!a.lock&&distance(this,a)<22);
      const animal=nearby[(this.task*7)%Math.max(1,nearby.length)];
      const destination=this.task%3===0?{x:CONFIG.barn.entrance.x+3,z:CONFIG.barn.entrance.z-2}:animal?{x:animal.x+2.3,z:animal.z-1.5}:{x:5,z:12};
      this.go(destination);
      }
    }
    const target=this.route[0];
    if(!target){this.state='watch';this.timer=5;return;}
    this.tx=target.x;this.tz=target.z;
    const dx=target.x-this.x,dz=target.z-this.z,d=Math.hypot(dx,dz);
    if(d>.08){
      const step=Math.min(d,dt*(sheltering?1.5:.95));this.x+=dx/d*step;this.z+=dz/d*step;
      this.walking=true;this.headingX=dx/d;this.headingZ=dz/d;
    }
    if(d<.15){this.route.shift();if(!this.route.length){this.state='watch';this.timer=5;}}
  }
}
