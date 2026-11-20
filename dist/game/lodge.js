import {lodgeRoute,moveLodgePlayer,LODGE_STAIRS,UPPER_LANDING,FLIGHT,LODGE_ROOM} from './lodge-layout.js?v=lodge-flight-1';
import {CONFIG,distance} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';

export class LodgeVisit{
  constructor(){this.inside=false;this.floor=1;this.trip=null;this.route=[];this.outside=null;this.screen=null;this.exitAfterStairs=false;this.stair=null;}
  get elevation(){return this.stair?.y??(this.floor-1)*LODGE_ROOM.floorHeight;}
  get footLift(){
    if(!this.stair)return 0;
    const rise=LODGE_ROOM.floorHeight/FLIGHT.steps,phase=(this.stair.y/rise)%1;
    // Ease the feet onto each tread; the tracking camera follows the smooth incline.
    return (phase*phase*(3-2*phase)-phase)*rise;
  }
  get landing(){return this.floor===1?LODGE_STAIRS:UPPER_LANDING;}
  nextTarget(player){if(this.route[0]){player.tx=this.route[0].x;player.tz=this.route[0].z;}}
  request(player){if(this.inside)return;player.buildingAccess='lodge';this.trip='enter';this.route=dryRoute(player,CONFIG.lodge.entrance);this.nextTarget(player);}
  cancel(player){if(this.inside)return;this.trip=null;this.route=[];player.buildingAccess=null;player.tx=player.x;player.tz=player.z;}
  walkTo(point,player,keepTrip=false){
    if(this.stair)return;
    if(!keepTrip){this.trip=null;this.exitAfterStairs=false;}
    this.route=lodgeRoute(player,point,this.floor);this.nextTarget(player);
  }
  steer(wx,wz,player){
    if(this.stair)return;
    this.trip=null;this.exitAfterStairs=false;this.route=[];
    player.tx=player.x+wx*3;player.tz=player.z+wz*3;
  }
  move(player,next,manual=false){
    if(manual&&!this.stair&&!this.trip){
      const up=this.floor===1&&Math.abs(next.x-FLIGHT.x)<.5&&next.z>player.z&&
        player.z>=LODGE_STAIRS.z-.1&&next.z>LODGE_STAIRS.z;
      const down=this.floor===2&&Math.abs(next.z-UPPER_LANDING.z)<.24&&next.x>player.x&&
        player.x>=UPPER_LANDING.x-.1&&next.x>UPPER_LANDING.x;
      if(up||down){this.trip=up?'up':'down';this.beginStairs(player);return true;}
    }
    return moveLodgePlayer(player,next,this.floor);
  }

  requestFloor(floor,player){
    if(!this.inside||this.stair||floor===this.floor)return;
    this.trip=floor===2?'up':'down';this.walkTo(this.landing,player,true);
  }
  requestExit(player){
    if(!this.inside)return;
    if(this.stair){this.exitAfterStairs=true;return;}
    if(this.floor===2){this.exitAfterStairs=true;this.requestFloor(1,player);return;}
    this.trip='exit';this.walkTo({x:0,z:.55},player,true);
  }
  beginStairs(player){
    const top=LODGE_ROOM.floorHeight;
    const path=[{...LODGE_STAIRS,y:0},{x:FLIGHT.x,z:FLIGHT.front,y:0},
      {x:FLIGHT.x,z:FLIGHT.back,y:top},{x:FLIGHT.x,z:UPPER_LANDING.z,y:top},{...UPPER_LANDING,y:top}];
    if(this.floor===2)path.reverse();
    // Start at the actual last approach position (normal walks have an arrival tolerance).
    path[0]={x:player.x,z:player.z,y:this.elevation};
    this.stair={path,index:1,y:path[0].y};
    player.tx=player.x;player.tz=player.z;
  }
  advanceStairs(player,dt){
    const stair=this.stair;
    let remaining=2.05*dt;
    while(stair.index<stair.path.length&&remaining>0){
      const goal=stair.path[stair.index],dx=goal.x-player.x,dz=goal.z-player.z,dy=goal.y-stair.y;
      const length=Math.hypot(dx,dz,dy),travel=Math.min(remaining,length);
      if(length>0){
        player.x+=dx*travel/length;player.z+=dz*travel/length;stair.y+=dy*travel/length;
        const horizontal=Math.hypot(dx,dz);
        if(horizontal>.0001){player.headingX=dx/horizontal;player.headingZ=dz/horizontal;}
      }
      remaining-=travel;
      if(travel===length)stair.index++;
    }
    player.tx=player.x;player.tz=player.z;player.walking=true;
    if(stair.index<stair.path.length)return null;
    this.floor=this.trip==='up'?2:1;this.stair=null;this.trip=null;player.walking=false;
    if(this.exitAfterStairs){this.exitAfterStairs=false;this.requestExit(player);}
    return this.floor===2?'upstairs':'downstairs';
  }
  tick(player,dt=1/60){
    if(this.stair)return this.advanceStairs(player,dt);
    if(this.route.length&&distance(player,this.route[0])<.13){this.route.shift();this.nextTarget(player);}
    if(this.route.length||!this.trip)return null;
    if(this.trip==='enter'){
      this.outside={x:CONFIG.lodge.entrance.x,z:CONFIG.lodge.entrance.z-.7};
      this.inside=true;this.floor=1;this.trip=null;player.buildingAccess=null;
      player.x=player.tx=0;player.z=player.tz=1;player.walking=false;player.headingX=0;player.headingZ=1;
      return 'entered';
    }
    if(this.trip==='up'||this.trip==='down'){
      if(distance(player,this.landing)>.15){this.trip=null;this.exitAfterStairs=false;return null;}
      this.beginStairs(player);return this.advanceStairs(player,dt);
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
