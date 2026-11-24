import * as THREE from '../vendor/three/three.module.js';
import {GLTFLoader} from '../vendor/three/loaders/GLTFLoader.js';
import {WALK_CYCLES_PER_SECOND} from '../game/gait.js';

const headings=['front','front-right','right','back-right','back','back-left','left','front-left'];
const top=4.85, bottom=-.35, halfWidth=2.05, artScale=.46;

export async function createModelPainter() {
  const gltf=await new GLTFLoader().loadAsync(new URL('../assets/mint-girl.glb',import.meta.url).href);
  const model=gltf.scene;
  const scene=new THREE.Scene();
  scene.add(model,new THREE.HemisphereLight(0xfff8ed,0xc3d3b6,1.95));
  const sun=new THREE.DirectionalLight(0xfff2df,1.45);
  sun.position.set(-3,7,5);
  scene.add(sun);
  const camera=new THREE.OrthographicCamera(-halfWidth,halfWidth,top,bottom,.1,40);
  camera.position.set(0,1.05,10);
  camera.lookAt(0,0,0);
  const gpu=new THREE.WebGLRenderer({alpha:true,antialias:true});
  gpu.setClearColor(0,0);
  gpu.setSize(320,406,false);
  const frame=document.createElement('canvas');
  frame.width=320; frame.height=406;
  const ink=frame.getContext('2d');
  const mixer=new THREE.AnimationMixer(model);
  const clips=gltf.animations.map(clip=>mixer.clipAction(clip));
  const actionFor=name=>clips.find(action=>action.getClip().name===name);
  const walk=actionFor('01 Walk'), sit=actionFor('02 Sit and rise'), pet=actionFor('03 Pet sheep');
  const hat=model.getObjectByName('Hat_-_tilt_or_remove');
  const bag=model.getObjectByName('Satchel_-_move_by_handle');
  const seatedLegs=sit.getClip().tracks.filter(track=>/^(Pelvis|Thigh|Shin|Foot|Toe)/.test(track.name)).map(track=>{
    const [name,property]=track.name.split('.');
    return {joint:model.getObjectByName(name)[property],value:track.createInterpolant().evaluate(1.1)};
  });
  let active, previous, lastTime, sitProgress=0;
  return function paint(ctx,p,{pose,walking,seated,petting,milking,feeding,reaching,time,lambSize,appearance,label}) {
    const stroking=petting||milking||feeding||reaching;
    const low=(petting&&lambSize<.5)||milking;
    const action=seated?sit:stroking?pet:walking?walk:sit;
    let seconds=0;
    // The tram and hammock request an already seated passenger without a clock.
    // In the pasture use the incoming/outgoing parts of the Blender clip.
    if(time>0 && label) {
      const dt=time-lastTime;
      lastTime=time;
      if(!Number.isFinite(dt)||dt<0||dt>.5||walking||stroking) sitProgress=seated?1:0;
      else sitProgress=THREE.MathUtils.clamp(sitProgress+(seated?dt:-dt)*1.6,0,1);
    }
    if(seated) seconds=time>0&&label ? sitProgress*23/24 : 1.1;
    else if(stroking) seconds=(16+(1-Math.cos(time*4))*4)/24;
    else if(walking) seconds=(time*WALK_CYCLES_PER_SECOND%1)*walk.getClip().duration;
    else if(time>0 && label && sitProgress>0) seconds=(74-22*sitProgress)/24;
    const sample=Math.floor(seconds*24)/24;
    const key=[pose,action.getClip().name,sample,low,appearance.hat,appearance.bag].join('/');
    if(previous!==key) {
      if(active!==action) { active?.stop(); action.reset().play(); active=action; }
      action.time=sample;
      mixer.update(0);
      // Overlay the seated legs for lambs for this draw only.
      const originals=low?seatedLegs.map(({joint,value})=>{
        const original=joint.clone();
        joint.fromArray(value);
        return original;
      }):null;
      if(hat)hat.visible=!!appearance.hat;
      if(bag)bag.visible=!!appearance.bag;
      model.rotation.y=headings.indexOf(pose)*Math.PI/4;
      gpu.render(scene,camera);
      if(originals)seatedLegs.forEach(({joint},i)=>joint.copy(originals[i]));
      ink.clearRect(0,0,frame.width,frame.height);
      ink.drawImage(gpu.domElement,0,0);
      previous=key;
    }
    ctx.save();
    ctx.translate(p.x,p.y); ctx.scale(p.s,p.s);
    ctx.fillStyle='#2e482d30';ctx.beginPath();ctx.ellipse(0,.025,.46,.11,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(frame,-halfWidth*artScale,-top*artScale,halfWidth*2*artScale,(top-bottom)*artScale);
    if(label) {
      const y=((seated||low) ? .20 : 0)-(appearance.hat?2.41:2.23);
      ctx.fillStyle='#344a38c9';ctx.beginPath();ctx.roundRect(-.22,y,.44,.22,.05);ctx.fill();
      ctx.fillStyle='#fff8e6';ctx.font='.16px sans-serif';ctx.textAlign='center';ctx.fillText('나',0,y+.16);
    }
    ctx.restore();
  };
}
