import {CONFIG,clamp,distance} from './config.js?v=lodge-interior';
import {dryRoute} from './navigation.js?v=night-barn';

export class LodgeVisit{
  constructor(){this.inside=false;this.floor=1;this.trip=null;this.route=[];this.outside=null;this.screen=null;this.exitAfterStairs=false;}
  nextTarget(player){if(this.route[0]){player.tx=this.route[0].x;player.tz=this.route[0].z;}}
  request(player){if(this.inside)return;this.trip='enter';this.route=dryRoute(player,CONFIG.lodge.entrance);this.nextTarget(player);}
  cancel(player){if(this.inside)return;this.trip=null;this.route=[];player.tx=player.x;player.tz=player.z;}
  walkTo(point,player,keepTrip=false){
    if(!keepTrip){this.trip=null;this.exitAfterStairs=false;}
    const target={x:clamp(point.x,-4.7,4.7),z:clamp(point.z,.5,13.3)};
    this.route=[];
    if(this.floor===1&&Math.abs(target.z-player.z)>1){
      if(Math.abs(player.x)>1.7)this.route.push({x:0,z:player.z});
      if(Math.abs(target.x)>1.7)this.route.push({x:0,z:target.z});
    }
    this.route.push(target);this.nextTarget(player);
  }
  requestFloor(floor,player){
    if(!this.inside||floor===this.floor)return;
    this.trip=floor===2?'up':'down';this.walkTo({x:3.65,z:10.5},player,true);
  }
  requestExit(player){
    if(!this.inside)return;
    if(this.floor===2){this.exitAfterStairs=true;this.requestFloor(1,player);return;}
    this.trip='exit';this.walkTo({x:0,z:.55},player,true);
  }
  tick(player){
    if(this.route.length&&distance(player,this.route[0])<.13){this.route.shift();this.nextTarget(player);}
    if(this.route.length||!this.trip)return null;
    if(this.trip==='enter'){
      this.outside={x:CONFIG.lodge.entrance.x,z:CONFIG.lodge.entrance.z-.7};
      this.inside=true;this.floor=1;this.trip=null;
      player.x=player.tx=0;player.z=player.tz=1;player.walking=false;player.headingX=0;player.headingZ=1;
      return 'entered';
    }
    if(this.trip==='up'||this.trip==='down'){
      this.floor=this.trip==='up'?2:1;this.trip=null;
      player.x=player.tx=3.65;player.z=player.tz=10.5;player.walking=false;
      if(this.exitAfterStairs){this.exitAfterStairs=false;this.requestExit(player);}
      return this.floor===2?'upstairs':'downstairs';
    }
    if(this.trip==='exit'){
      this.inside=false;this.floor=1;this.trip=null;
      Object.assign(player,this.outside);player.tx=player.x;player.tz=player.z;player.walking=false;
      player.headingX=0;player.headingZ=-1;
      return 'exited';
    }
    return null;
  }
}
