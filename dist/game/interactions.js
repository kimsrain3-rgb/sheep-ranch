import {
  CONFIG,distance,keepDry
} from './config.js';
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
    const destination={
      x:animal.x-1.15,z:animal.z-.35
    };
    keepDry(destination);
    player.tx=destination.x;
    player.tz=destination.z;
    return {
      ok:true,message:kind==='milk'?'새끼 양에게 다가가 우유를 줄게요.':kind==='tug'?'장난꾸러기가 옷자락을 살짝 잡았어요.':'양에게 다가가 살살 쓰다듬을게요.'
    };
  }
  startTug(animal,player,view){
    if(this.active||this.supplyTrip||player.walking)return false;
    this.request('tug',animal,player,view);
    player.tx=player.x;
    player.tz=player.z;
    this.active.phase='playing';
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
    player.tx=CONFIG.shed.entrance.x;
    player.tz=CONFIG.shed.entrance.z;
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
    player,view,onMessage=()=>{
    },onMilk=()=>{
    }
  }){
    const active=this.active;
    if(this.supplyTrip&&distance(player,CONFIG.shed.entrance)<1.2){
      this.supplyTrip=false;
      this.carrying=true;
      onMessage('건초 한 다발을 가져왔어요. 원하는 풀밭에서 내려놓으세요.');
    }
    if(!active)return;
    active.time+=dt;
    if(active.phase==='approach'){
      if(distance(player,active.animal)<1.7){
        active.phase='playing';
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
      view.zoom+=(5.2-view.zoom)*blend;
      view.yaw+=(0-view.yaw)*blend;
      view.pitch+=(.28-view.pitch)*blend;
    }
  }
  cameraTarget(player){
    const a=this.active;
    return a?.phase==='playing'?{
      x:(player.x+a.animal.x)/2,z:(player.z+a.animal.z)/2
    }
    :player;
  }
  get busy(){
    return !!this.active;
  }
}
