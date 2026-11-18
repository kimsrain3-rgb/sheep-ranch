import {petStand,petCameraYaw,petZoom,angleDelta} from './petting.js?v=solid-buildings-2';
import {
  CONFIG,distance,keepDry,actorRadius,buildingPathClear
} from './config.js?v=solid-buildings-2';
import {dryRoute} from './navigation.js?v=solid-buildings-2';
export class Interactions {
  constructor(flock){
    this.flock=flock;
    this.active=null;
    this.restore=null;
    this.mode='pet';
    this.carrying=false;
    this.hayPiles=[];
    this.nextPile=1;
    this.supplyTrip=false;
  }
  request(kind,animal,player,view){
    if(kind==='milk'&&!animal.isLamb)return {
      ok:false,message:'우유는 새끼 양에게 줄 수 있어요.'
    };
    if(kind==='milk'&&animal.milkCooldown>0)return {
      ok:false,message:'지금은 배가 불러요. 조금 쉬었다 줄까요?'
    };
    this.cancel(view);
    this.flock.lock(animal,kind);
    this.active={
      kind,animal,phase:'approach',time:0,saved:{
        zoom:view.zoom,yaw:view.yaw,pitch:view.pitch
      },original:{
        x:player.x,z:player.z
      }
    };
    let destination={
      x:animal.x-1.15,z:animal.z-.35
    };
    if(kind==='pet'){
      destination=petStand(animal,player);
      this.active.petYaw=petCameraYaw(animal,destination,view.yaw);
    }
    if(kind==='milk'){
      // Stand close on either dry side of the lamb, then kneel beside it.
      const left={x:animal.x-.82,z:animal.z},right={x:animal.x+.82,z:animal.z};
      const dryLeft={...left},dryRight={...right};keepDry(dryLeft);keepDry(dryRight);
      const chosen=distance(left,dryLeft)<=distance(right,dryRight)?dryLeft:dryRight;
      destination.x=chosen.x;destination.z=chosen.z;
    }
    keepDry(destination);
    this.active.route=dryRoute(player,destination);
    const first=this.active.route[0];player.tx=first.x;player.tz=first.z;
    return {
      ok:true,message:kind==='milk'?'새끼 양에게 다가가 우유를 줄게요.':kind==='tug'?'장난꾸러기가 옷자락을 살짝 잡았어요.':'양의 옆으로 다가가 살살 쓰다듬을게요.'
    };
  }
  startTug(animal,player,view){
    if(this.active||this.supplyTrip||player.walking)return false;
    this.request('tug',animal,player,view);
    player.tx=player.x;
    player.tz=player.z;
    this.active.phase='tug-approach';
    this.active.tugSide=(animal.x-player.x)*Math.cos(view.yaw)-(animal.z-player.z)*Math.sin(view.yaw)>=0?1:-1;
    return true;
  }
  cancel(view){
    if(this.active){
      const a=this.active;
      if(a.kind==='milk'&&a.phase==='playing')a.animal.milkCooldown=Math.max(a.animal.milkCooldown||0,35);
      this.flock.unlock(a.animal);
      this.restore=a.saved;
      this.active=null;
    }
    if(view&&this.restore){
      Object.assign(view,this.restore);
      this.restore=null;
    }
  }
  goForHay(player){
    if(this.carrying)return {
      ok:false,message:'건초를 들고 있어요. 풀밭에 내려놓아 주세요.'
    };
    this.supplyTrip=true;
    player.buildingAccess='shed';this.supplyRoute=dryRoute(player,CONFIG.shed.entrance);
    player.tx=this.supplyRoute[0].x;player.tz=this.supplyRoute[0].z;
    return {
      ok:true,message:'건초 창고로 걸어갑니다. 도착하면 한 다발 가져올게요.'
    };
  }
  dropHay(player){
    if(!this.carrying)return false;
    const live=this.hayPiles.filter(p=>p.portions>0);
    if(live.length>=CONFIG.maxHayPiles)return false;
    const p={
      id:'hay-'+this.nextPile++,x:player.x+1.5,z:player.z+.4,portions:CONFIG.hayPortions
    };
    keepDry(p);
    this.hayPiles=live;
    this.hayPiles.push(p);
    this.carrying=false;
    return true;
  }
  tick(dt,{
    player,view,width=0,height=0,onMessage=()=>{
    },onMilk=()=>{
    }
  }){
    const active=this.active;
    if(this.supplyTrip){
      while(this.supplyRoute?.length&&distance(player,this.supplyRoute[0])<.08)this.supplyRoute.shift();
      const next=this.supplyRoute?.[0];if(next){player.tx=next.x;player.tz=next.z;}
    }
    if(this.supplyTrip&&distance(player,CONFIG.shed.entrance)<1.2){
      this.supplyTrip=false;this.supplyRoute=[];player.buildingAccess=null;player.tx=player.x;player.tz=player.z;player.walking=false;
      this.carrying=true;
      onMessage('건초 한 다발을 가져왔어요. 원하는 풀밭에서 내려놓으세요.');
    }
    if(!active)return;
    active.time+=dt;
    if(active.kind==='tug'){
      // Bring the mouth to the coat. Never stretch the coat across an empty gap.
      const a=active.animal,side=active.tugSide,rightX=Math.cos(view.yaw),rightZ=-Math.sin(view.yaw);
      const offset=.34+.83*a.size;
      const target={x:player.x+side*rightX*offset,z:player.z+side*rightZ*offset};
      const safe={...target};keepDry(safe,{radius:actorRadius(a)});
      if(distance(safe,target)>.03||!buildingPathClear(a,target,CONFIG)){this.cancel(view);return;}
      const dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz);
      if(active.phase==='tug-approach'){
        const step=Math.min(d,dt*.85);if(d>.001){a.x+=dx/d*step;a.z+=dz/d*step;}
        a.walking=d>.03;
        const blend=1-Math.exp(-dt*10);a.headX+=(-side*.83-a.headX)*blend;a.headY+=(-.65/a.size-.3-a.headY)*blend;
        if(d<.04){active.phase='playing';active.time=0;}
        else if(active.time>3)this.cancel(view);
      }else{
        const nudge=Math.sin(active.time*5)*.015;
        a.x=target.x+side*rightX*nudge;a.z=target.z+side*rightZ*nudge;
        a.headX=-side*.83;a.headY=-.65/a.size-.3;a.walking=false;
        if(active.time>=CONFIG.durations.tug)this.cancel(view);
      }
      return;
    }
    if(active.kind==='pet'){
      // Align the camera while approaching; touch begins only after a side view is ready.
      const blend=1-Math.exp(-dt*6);
      view.yaw+=angleDelta(active.petYaw,view.yaw)*blend;
    }
    if(active.phase==='approach'){
      while(active.route?.length&&distance(player,active.route[0])<.085)active.route.shift();
      const next=active.route?.[0];if(next){player.tx=next.x;player.tz=next.z;}
      const aligned=active.kind!=='pet'||Math.abs(angleDelta(active.petYaw,view.yaw))<.015;
      if(Math.hypot(player.x-player.tx,player.z-player.tz)<.085&&aligned){
        active.phase='playing';
        active.animal.careContact=true;
        active.time=0;
        player.tx=player.x;
        player.tz=player.z;
        player.walking=false;
      }
      else if(active.time>25){
        this.cancel(view);
        onMessage('양에게 다가가기 어려워요. 다시 눌러 주세요.');
        return;
      }
    }
    else{
      active.animal.pet=active.kind==='pet'?1:0;
      const duration=CONFIG.durations[active.kind];
      if(active.time>=duration){
        if(active.kind==='milk'){
          active.animal.milkCooldown=45;
          onMilk(active.animal);
          onMessage('우유를 잘 먹었어요. 이제 잠시 쉬어요.');
        }
        this.cancel(view);
        return;
      }
      const blend=1-Math.exp(-dt*5);
      view.zoom+=((active.kind==='pet'?petZoom(width,height):5.2)-view.zoom)*blend;
      if(active.kind!=='pet')view.yaw+=(0-view.yaw)*blend;
      view.pitch+=(.28-view.pitch)*blend;
    }
  }
  cameraTarget(player){
    const a=this.active;
    return a?.phase==='playing'&&a.kind!=='tug'?{
      x:(player.x+a.animal.x)/2,z:(player.z+a.animal.z)/2
    }
    :player;
  }
  get busy(){
    return !!this.active;
  }
}
