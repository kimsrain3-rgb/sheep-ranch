import {CONFIG,clamp,distance} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';

export const FARM_ROOMS=Object.freeze({
  coop:Object.freeze({title:'닭장',halfWidth:3.3,depth:8.4}),
  shed:Object.freeze({title:'창고',halfWidth:4.1,depth:10.4})
});

export class FarmRoomVisit{
  constructor(){this.kind=null;this.inside=false;this.trip=null;this.route=[];this.outside=null;}
  request(kind,player){
    if(this.inside||!FARM_ROOMS[kind])return false;
    this.kind=kind;player.buildingAccess=kind;this.trip='enter';this.route=dryRoute(player,CONFIG[kind].entrance);this.nextTarget(player);return true;
  }
  nextTarget(player){const point=this.route[0];if(point){player.tx=point.x;player.tz=point.z;}}
  cancel(player){if(this.inside)return;this.trip=null;this.route=[];player.buildingAccess=null;player.tx=player.x;player.tz=player.z;}
  walkTo(point,player,keepTrip=false){
    if(!this.inside)return;
    if(!keepTrip)this.trip=null;
    const room=FARM_ROOMS[this.kind],target={x:clamp(point.x,-room.halfWidth,room.halfWidth),z:clamp(point.z,.55,room.depth)};
    if(target.z>2)target.x=clamp(target.x,-1.25,1.25);
    this.route=[];
    if(Math.abs(player.x)>1.35&&Math.abs(target.z-player.z)>1)this.route.push({x:0,z:player.z});
    this.route.push(target);this.nextTarget(player);
  }
  requestExit(player){if(!this.inside)return;this.trip='exit';this.walkTo({x:0,z:.55},player,true);}
  tick(player){
    if(this.route.length&&distance(player,this.route[0])<.1){this.route.shift();this.nextTarget(player);}
    if(this.route.length||!this.trip)return null;
    if(!this.inside&&this.trip==='enter'){
      // A failed route must never become an instantaneous building entry.
      if(distance(player,CONFIG[this.kind].entrance)>.2){this.cancel(player);return 'blocked';}
      this.outside={x:CONFIG[this.kind].entrance.x,z:CONFIG[this.kind].entrance.z-.7};
      this.inside=true;this.trip=null;player.buildingAccess=null;player.x=player.tx=0;player.z=player.tz=1;
      player.headingX=0;player.headingZ=1;player.walking=false;return 'entered';
    }
    if(this.inside&&this.trip==='exit'){
      this.inside=false;this.trip=null;Object.assign(player,this.outside);player.tx=player.x;player.tz=player.z;
      player.headingX=0;player.headingZ=-1;player.walking=false;return 'exited';
    }
    return null;
  }
}
