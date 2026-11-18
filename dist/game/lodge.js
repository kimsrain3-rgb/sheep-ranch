import {lodgeRoute,moveLodgePlayer,LODGE_STAIRS} from './lodge-layout.js?v=lodge-eyes-2';
import {CONFIG,distance} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';

export class LodgeVisit{
  constructor(){this.inside=false;this.floor=1;this.trip=null;this.route=[];this.outside=null;this.screen=null;this.exitAfterStairs=false;}
  nextTarget(player){if(this.route[0]){player.tx=this.route[0].x;player.tz=this.route[0].z;}}
  request(player){if(this.inside)return;player.buildingAccess='lodge';this.trip='enter';this.route=dryRoute(player,CONFIG.lodge.entrance);this.nextTarget(player);}
  cancel(player){if(this.inside)return;this.trip=null;this.route=[];player.buildingAccess=null;player.tx=player.x;player.tz=player.z;}
  walkTo(point,player,keepTrip=false){
    if(!keepTrip){this.trip=null;this.exitAfterStairs=false;}
    this.route=lodgeRoute(player,point,this.floor);this.nextTarget(player);
  }
  steer(wx,wz,player){
    this.trip=null;this.exitAfterStairs=false;this.route=[];
    player.tx=player.x+wx*3;player.tz=player.z+wz*3;
  }
  move(player,next){return moveLodgePlayer(player,next,this.floor);}

  requestFloor(floor,player){
    if(!this.inside||floor===this.floor)return;
    this.trip=floor===2?'up':'down';this.walkTo(LODGE_STAIRS,player,true);
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
      this.inside=true;this.floor=1;this.trip=null;player.buildingAccess=null;
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
