import {CONFIG,distance} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';
import {barnSlot,advanceRoute} from './barn.js?v=solid-buildings-2';
export class WeatherShelter{
  constructor(){this.active=false;this.wetFor=0;this.dryFor=0;this.inside=0;this.manual=false;this.reason='';}
  updateWeather(dt,wet,night=false){
    this.wetFor=wet?this.wetFor+dt:0;this.dryFor=wet||night||this.manual?0:this.dryFor+dt;
    const before=this.active;
    if(night||this.manual||this.wetFor>=3)this.active=true;
    if(this.active&&this.dryFor>=20)this.active=false;
    this.reason=night?'night':wet?'weather':this.manual?'request':'';
    return before!==this.active;
  }
  tick(dt,{flock,dogs=[],yaw=0}){
    let inside=0;
    for(const [index,a] of flock.animals.entries()){
      if(this.active){
        if(a.lock)continue;
        if(!a.state.startsWith('shelter')||a.state==='shelter-exit'){
          if(a.hiddenInBarn){a.state='shelter-inside';const slot=barnSlot(a,index);a.barnRoute=[{x:0,z:slot.z},slot];}
          else{flock.releasePair(a);flock.setState(a,'shelter-go');a.begging=false;a.hop=0;a.shelterRoute=dryRoute(a,CONFIG.barn.entrance);}
        }
        if(a.state==='shelter-go'){
          const target=a.shelterRoute[0]||CONFIG.barn.entrance;a.tx=target.x;a.tz=target.z;
          const driven=dogs.some(d=>distance(d,a)<9);flock.move(a,dt,driven?1.7:1.05,yaw);flock.head(a,dt,false);
          if(distance(a,target)<.35){a.shelterRoute.shift();if(!a.shelterRoute.length){
            a.state='shelter-inside';a.walking=false;a.hiddenInBarn=true;a.barnPosition={x:0,z:0};const slot=barnSlot(a,index);a.barnRoute=[{x:0,z:slot.z},slot];
          }}
        }
        if(a.state==='shelter-inside'){inside++;a.hiddenInBarn=true;a.walking=false;advanceRoute(a.barnPosition,a.barnRoute||[],dt,.95);}
      }else if(a.state.startsWith('shelter')){
        if(a.state!=='shelter-exit'){
          a.state='shelter-exit';a.exitDelay=index*.17;a.exitReady=!a.hiddenInBarn;
          if(a.hiddenInBarn)a.barnRoute=[{x:0,z:a.barnPosition.z},{x:0,z:0}];
        }
        a.exitDelay-=dt;
        if(a.exitDelay<=0){
          if(a.hiddenInBarn){advanceRoute(a.barnPosition,a.barnRoute,dt,1.2);if(!a.barnRoute.length){a.hiddenInBarn=false;a.exitReady=true;}}
          if(a.exitReady){
            a.tx=CONFIG.barn.entrance.x+Math.sin(index*2.4)*4;a.tz=CONFIG.barn.entrance.z-4-index%3;flock.move(a,dt,1,yaw);flock.head(a,dt,false);
            if(distance(a,{x:a.tx,z:a.tz})<.5){a.state='roam';a.decision=15;a.barnPosition=null;}
          }
        }
        if(a.hiddenInBarn)inside++;
      }
    }
    this.inside=inside;
  }
}
