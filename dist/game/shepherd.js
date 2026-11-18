import {CONFIG,distance,keepDry} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';
// The NPC owns only its own movement. It never locks sheep or changes care records.
export class ShepherdBoy{
  constructor(){
    this.id='shepherd-boy';this.name='소년 목동';this.x=2.8;this.z=1.1;this.tx=this.x;this.tz=this.z;
    this.headingX=0;this.headingZ=-1;this.walking=false;this.state='greet';this.timer=7;this.time=0;this.route=[];this.task=0;this.wet=false;this.screen=null;this.insideLodge=false;this.lodgeBound=false;
  }
  requestTalk(player,{indoors=false,yaw=0}={}){
    if(indoors!==this.insideLodge)return false;
    if(this.talk)return true;
    const point=indoors?{x:-3.1,z:7.8}:{x:this.x,z:this.z};
    let destination;
    if(indoors)destination={x:-1.3,z:7.8};
    else{
      const options=Array.from({length:8},(_,i)=>{
        const angle=yaw+i*Math.PI/4,raw={x:point.x+Math.cos(angle)*1.8,z:point.z+Math.sin(angle)*1.8};
        const dry={...raw};keepDry(dry);
        return {point:dry,score:distance(raw,dry)*100+distance(player,dry)};
      }).sort((a,b)=>a.score-b.score);
      destination=options[0].point;
    }
    const route=indoors?[{x:0,z:player.z},{x:0,z:destination.z},destination]:dryRoute(player,destination);
    this.talk={phase:'approach',point,indoors,route};this.state='talk';this.walking=false;
    this.aimTalk(player);return true;
  }
  aimTalk(player){
    const target=this.talk?.route[0];
    if(target){player.tx=target.x;player.tz=target.z;}
  }
  canTalk(player,indoors=false){
    return this.talk?.phase==='talking'&&this.talk.indoors===indoors&&this.insideLodge===indoors&&distance(player,this.talk.point)<=2.2;
  }
  updateTalk(player,{indoors=false}={}){
    const talk=this.talk;if(!talk)return null;
    if(talk.indoors!==indoors||this.insideLodge!==indoors){this.endTalk(player);return 'cancelled';}
    if(talk.phase==='approach'){
      while(talk.route.length&&distance(player,talk.route[0])<.13)talk.route.shift();
      this.aimTalk(player);
    }else if(!this.canTalk(player,indoors)||Math.hypot(player.tx-player.x,player.tz-player.z)>.15){
      this.endTalk(player,false);return 'cancelled';
    }
    this.headingX=player.x-talk.point.x;this.headingZ=player.z-talk.point.z;this.walking=false;
    if(talk.route.length)return null;
    if(distance(player,talk.point)>2.2){this.endTalk(player);return 'cancelled';}
    player.tx=player.x;player.tz=player.z;player.walking=false;
    player.headingX=talk.point.x-player.x;player.headingZ=talk.point.z-player.z;
    const ready=talk.phase!=='talking';talk.phase='talking';
    return ready?'ready':null;
  }
  endTalk(player,stop=true){
    if(!this.talk)return;
    if(stop&&this.talk.phase==='approach'){player.tx=player.x;player.tz=player.z;player.walking=false;}
    this.talk=null;this.state=this.insideLodge?'rest':'watch';this.timer=1.5;this.route=[];
  }
  greet(player){
    this.state='greet';this.timer=5;this.walking=false;this.route=[];
    this.headingX=player.x-this.x;this.headingZ=player.z-this.z;
    if(Math.hypot(this.headingX,this.headingZ)<.01)this.headingZ=-1;
  }
  go(destination){this.route=dryRoute(this,destination);this.state='walk';this.timer=0;}
  tick(dt,{player,sheep=[],sheltering=false}){
    this.time+=dt;this.timer-=dt;this.walking=false;
    if(this.buildingAccess==='lodge'&&this.z<CONFIG.lodge.entrance.z-.45)this.buildingAccess=null;
    if(this.talk)return;
    if(sheltering!==this.wet){
      this.wet=sheltering;this.route=[];this.lodgeBound=false;
      if(sheltering)this.go({x:CONFIG.barn.entrance.x+3,z:CONFIG.barn.entrance.z-1});
      else{this.buildingAccess=this.insideLodge?'lodge':null;this.insideLodge=false;this.state='watch';this.timer=3;}
    }
    if(this.insideLodge&&sheltering)return;
    if(sheltering&&sheep.length&&sheep.every(a=>a.hiddenInBarn)&&!this.lodgeBound){
      this.lodgeBound=true;this.go(CONFIG.lodge.entrance);
    }
    if(this.state==='greet'&&this.timer>0)return;
    if(this.state==='watch'&&this.timer>0)return;
    if(this.state!=='walk'){
      if(sheltering){
        if(this.lodgeBound){
          if(distance(this,CONFIG.lodge.entrance)<.3){this.insideLodge=true;this.walking=false;return;}
          this.go(CONFIG.lodge.entrance);
        }
        const entrance={x:CONFIG.barn.entrance.x+3,z:CONFIG.barn.entrance.z-1};
        if(!this.lodgeBound){
          if(distance(this,entrance)>.3)this.go(entrance);
          else{this.state='watch';this.timer=5;this.headingX=-1;this.headingZ=0;return;}
        }
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
      const step=Math.min(d,dt*(sheltering?1.5:.95));this.x+=dx/d*step;this.z+=dz/d*step;keepDry(this);
      this.walking=true;this.headingX=dx/d;this.headingZ=dz/d;
    }
    if(d<.15){
      this.route.shift();
      if(!this.route.length){
        if(this.lodgeBound&&distance(this,CONFIG.lodge.entrance)<.3){this.insideLodge=true;this.state='rest';this.timer=0;}
        else{this.state='watch';this.timer=5;}
      }
    }
  }
}
