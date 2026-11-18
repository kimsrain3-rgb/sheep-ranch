import {CONFIG,clamp,distance} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';
export function barnSlot(animal,index=0){
  const number=Number(animal.id.split('-')[1])||0,mother=animal.isLamb?animal.mother:animal,n=animal.isLamb?Number(mother.id.split('-')[1])||0:number;
  return {x:(n%2?1:-1)*(3.5+Math.floor(n/2)%4*1.35)+(animal.isLamb?.45:0),z:3+Math.floor(n/8)*2.05+(animal.isLamb?.65:0)};
}
export function advanceRoute(entity,route,dt,speed){
  const goal=route[0];entity.walking=false;if(!goal)return;
  const dx=goal.x-entity.x,dz=goal.z-entity.z,d=Math.hypot(dx,dz);
  if(d>.04){const move=Math.min(d,dt*speed);entity.x+=dx/d*move;entity.z+=dz/d*move;entity.walking=true;entity.headingX=dx/d;entity.headingZ=dz/d;}
  if(d<.12)route.shift();
}
export class BarnVisit{
  constructor(){this.inside=false;this.trip=null;this.route=[];this.outside=null;this.visibleAnimals=[];this.screen=null;}
  request(player){if(this.inside)return;player.buildingAccess='barn';this.trip='enter';this.route=dryRoute(player,CONFIG.barn.entrance);this.nextTarget(player);}
  nextTarget(player){if(this.route[0]){player.tx=this.route[0].x;player.tz=this.route[0].z;}}
  cancel(player){if(this.inside)return;this.trip=null;this.route=[];player.buildingAccess=null;player.tx=player.x;player.tz=player.z;}
  walkTo(point,player){
    const target={x:clamp(point.x,-8.7,8.7),z:clamp(point.z,0,18)};
    if(target.z>2&&target.z<16)target.x=clamp(target.x,-1.45,1.45);
    this.route=[];
    if(Math.abs(player.x)>1.5&&Math.abs(target.z-player.z)>1)this.route.push({x:0,z:player.z});
    if(Math.abs(target.x)>1.5&&Math.abs(target.z-player.z)>1)this.route.push({x:0,z:target.z});
    this.route.push(target);this.nextTarget(player);
  }
  requestExit(player){this.trip='exit';this.walkTo({x:0,z:0},player);}
  tick(player){
    if(this.route.length&&distance(player,this.route[0])<.1){this.route.shift();this.nextTarget(player);}
    if(!this.inside&&this.trip==='enter'&&!this.route.length){
      this.outside={x:CONFIG.barn.entrance.x,z:CONFIG.barn.entrance.z-.7};this.inside=true;this.trip=null;player.buildingAccess=null;
      player.x=player.tx=0;player.z=player.tz=1;player.headingX=0;player.headingZ=1;player.walking=false;return 'entered';
    }
    if(this.inside&&this.trip==='exit'&&!this.route.length){
      this.inside=false;this.trip=null;Object.assign(player,this.outside);player.tx=player.x;player.tz=player.z;player.headingX=0;player.headingZ=-1;player.walking=false;return 'exited';
    }
    return null;
  }
  animals(flock){
    this.visibleAnimals=flock.animals.filter(a=>a.hiddenInBarn).map(a=>{const pos=a.barnPosition||barnSlot(a);return {...a,x:pos.x,z:pos.z,hiddenInBarn:false,state:pos.walking?'roam':'sleep',walking:!!pos.walking,headX:pos.walking?(pos.headingX>0?.83:-.83):0,headY:pos.walking?-1.05:-.78,source:a,screen:null};});
    return this.visibleAnimals;
  }
}
