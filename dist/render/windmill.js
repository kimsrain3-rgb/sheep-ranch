import {woodenSign} from './wood-sign.js';
import * as THREE from '../vendor/three/three.module.js';
import {createBuildingBuilder} from './building-models.js?v=barn-three-1';
import {CONFIG} from '../game/config.js?v=windmill-1';

const {deckHeight,ridge}=CONFIG.windmill;
const center=4,segments=12,deckRadius=5.55;
export const axle={height:17.8,front:-1.95};

export function createWindmill(stage=10){
  const b=createBuildingBuilder('windmill'),p=b.palette;
  const ring=(name,low,high,y,height,mat)=>b.add(new THREE.CylinderGeometry(high,low,height,segments),mat,name,0,y+height/2,center);
  const wallHeight=[0,0,3,6,9,12,18.5][Math.min(stage,6)];
  if(stage<10){
    ring('cleared earth',4.65,4.65,0,.08,p.wood);
    for(const side of [-1,1]){
      for(const end of [-1,1])b.box('survey stake',side*4.25,.68,center+end*4.25,.17,1.36,.17,p.trim);
      b.beam('setting out line',[side*4.25,.6,center-4.25],[side*4.25,.6,center+4.25],.08,p.straw);
    }
    for(let i=0;i<5;i++)b.box('stacked lumber',2.9,.22+i*.20,center-3.4,3.4,.17,.56,p.trim);
    if(stage>=2){
      const h=Math.min(wallHeight+2,19);
      for(const x of [-2.6,2.6])b.box('scaffold upright',x,h/2,center-4.45,.17,h,.17,p.wood);
      for(let y=1.4;y<h;y+=3){
        b.box('scaffold plank',0,y,center-4.45,5.7,.13,.72,p.trim);
        b.beam('scaffold brace',[-2.6,y,center-4.45],[2.6,Math.min(y+3,h),center-4.45],.12,p.wood);
      }
    }
  }
  if(stage>=1)ring('stone plinth',4,4,0,1.1,p.stone);
  if(wallHeight)ring('tapered limewashed tower',3.98,3.98-1.43*wallHeight/18.5,1.1,wallHeight,p.wall);
  if(stage>=8){
    ring('oak mill cap',3.05,3.05,19.6,.45,p.wood);
    ring('faceted shingle cap',3.25,.2,20.05,ridge-20.05,p.roof);
  }
  if(stage>=7){
    ring('gallery boards',deckRadius,deckRadius,deckHeight-.26,.26,p.trim);
    const at=(angle,r,y)=>[r*Math.sin(angle),y,center+r*Math.cos(angle)];
    for(let i=0;i<segments;i++){
      const a=i*2*Math.PI/segments,next=(i+1)*2*Math.PI/segments;
      b.beam('gallery knee brace',at(a,3,deckHeight-2.45),at(a,5.35,deckHeight-.26),.23,p.wood);
      b.beam('gallery newel',at(a,5.4,deckHeight),at(a,5.4,deckHeight+1.02),.18,p.wood);
      for(const h of [.45,1])b.beam('gallery railing',at(a,5.4,deckHeight+h),at(next,5.4,deckHeight+h),.13,p.trim);
    }
    b.box('gallery door',0,deckHeight+1,center+2.74,1.15,2,.18,p.door);
  }
  if(stage>=3){
    b.box('entrance surround',0,1.65,.12,2.5,3.3,.34,p.wood);
    b.box('sage entrance door',0,1.48,-.10,2.03,2.92,.16,p.door);
    b.beam('door brace',[-.95,.45,-.21],[.95,2.42,-.21],.14,p.trim);
  }
  if(stage>=5)for(const [y,z] of [[6.3,.44],[11.4,.82]])b.frontWindow(0,y,z,1.05,1.48);
  if(stage>=9)b.beam('sail shaft',[0,axle.height,.96],[0,axle.height,axle.front],.64,p.wood);
  if(stage>=3){
    b.box('nameboard mounting rail',0,3.91,.19,2.95,.36,.72,p.wood);
    woodenSign(b,'풍차 전망대',3.91,-.22,.54);
  }else{
    for(const x of [1.5,3.8])b.box('site sign post',x,.83,-.67,.16,1.66,.14,p.wood);
    woodenSign(b,'풍차 전망대',1.34,-.81,.51,2.65);
  }
  const tower=b.finish();
  tower.userData.spec={width:8,depth:8,ridge:new THREE.Box3().setFromObject(tower).max.y};
  return tower;
}

// Local origin at the axle lets the WebGL and software paths share one rotor.
export function createSails(){
  const b=createBuildingBuilder('sails'),p=b.palette;
  for(let i=0;i<4;i++){
    const angle=i*Math.PI/2,cs=Math.cos(angle),sn=Math.sin(angle);
    const at=(side,r)=>[side*cs-r*sn,side*sn+r*cs,0];
    b.beam('oak sail spar',at(0,0),at(0,6.5),.19,p.wood);
    const [x,y]=at(.63,4.24);
    b.box('linen sail',x,y,.05,1.19,4,.075,p.frame,[0,0,angle]);
    b.beam('sail edge',at(1.28,2.1),at(1.28,6.44),.09,p.trim);
    for(let r=2.12;r<6.5;r+=.7)b.beam('sail batten',at(-.08,r),at(1.37,r),.09,p.wood);
  }
  b.sphere('axle boss',0,0,-.2,.48,.48,.34,p.wood);
  return b.finish();
}
