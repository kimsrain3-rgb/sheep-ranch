import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CONFIG,distance} from '../dist/game/config.js';

// Drive the game canvas's pointer handlers and simulation without starting a render loop.
const listeners=new Map(),elements=new Map();
function element(id){
  if(!elements.has(id))elements.set(id,{
    style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},focus(){},
    querySelector(){return element(id+'.child');},setAttribute(){},addEventListener(){}
  });
  return elements.get(id);
}
const canvas=Object.assign(element('world'),{
  getContext:()=>({setTransform(){}}),setPointerCapture(){},hasPointerCapture:()=>false,
  addEventListener(name,handler){listeners.set(name,handler);}
});
Object.assign(globalThis,{
  innerWidth:1000,innerHeight:700,devicePixelRatio:1,location:{search:'',origin:'http://localhost'},
  document:{querySelector:()=>canvas,getElementById:element,body:element('body')},
  addEventListener(){},requestAnimationFrame(){},window:globalThis
});
const file=new URL('../dist/app.js',import.meta.url);
const source=(await readFile(file,'utf8')).replace(/from '([.][^']+)'/g,(_,path)=>"from '"+new URL(path,file).href+"'");
const hooks=`
  export {update,player,centerView,resize,outdoorView};
  export function enter(kind,floor=1){
    started=true;paused=false;doorwayWalk=null;outdoorWalk=null;
    barnVisit.inside=farmVisit.inside=lodgeVisit.inside=false;
    const visit=kind==='barn'?barnVisit:kind==='lodge'?lodgeVisit:farmVisit;
    visit.kind=kind;visit.floor=floor;visit.inside=true;visit.route=[];visit.trip=null;
    visit.outside={x:CONFIG[kind].entrance.x,z:CONFIG[kind].entrance.z-.7};
    Object.assign(player,{x:0,tx:0,z:4,tz:4});
    view=visit===barnVisit?indoorView:visit===lodgeVisit?lodgeView:farmView;
    view.yaw=Math.PI+.08;view.pitch=-.09;centerView();return visit;
  }
  export function visitorFrame(yaw){
    view.yaw=yaw;centerView();
    return {sprite:roomVisitorProjection(view,player,W,H),eye:view.basis(W,H)};
  }
  export function screen(x,z){return view.project(x,z,0,W,H);}
`;
const game=await import('data:text/javascript;base64,'+Buffer.from(source+hooks).toString('base64'));
function tap(x,z){
  const p=game.screen(x,z);
  assert.ok(p&&p.x>=0&&p.x<innerWidth&&p.y>=0&&p.y<innerHeight,'target is on screen');
  for(const name of ['pointerdown','pointerup'])listeners.get(name)({button:0,pointerId:1,clientX:p.x,clientY:p.y});
}
for(const [w,h] of [[1000,700],[390,760]]){
  globalThis.innerWidth=w;globalThis.innerHeight=h;game.resize();
  for(const kind of ['barn','coop','shed','lodge']){
    const visit=game.enter(kind),door=CONFIG[kind].entrance;
    const x=kind==='barn'?2.1:.65;
    tap(x,-11);
    assert.equal(visit.trip,'exit',kind+' starts walking to door');
    assert.equal(visit.inside,true,'no teleport on touch');
    const end={x:door.x+x,z:door.z-11};
    for(let i=0;i<200;i++){
      game.update(.05);
      if(visit.inside)assert.ok(game.player.z>=.45,'eye stays clear of the doorway plane');
      else if(distance(game.player,end)<.1)break;
    }
    assert.equal(visit.inside,false,kind+' crosses door');
    assert.ok(distance(game.player,end)<.1,kind+' reaches the touched point outdoors');
  }
}
const barn=game.enter('barn');
tap(2.1,-11);tap(.1,2);
assert.equal(barn.trip,null,'another indoor step cancels the exit');
for(let i=0;i<70;i++)game.update(.05);
assert.ok(barn.inside&&distance(game.player,{x:.1,z:2})<.1);
globalThis.innerWidth=1000;globalThis.innerHeight=700;game.resize();
const coop=game.enter('coop');
tap(4,-5);
assert.equal(coop.trip,null,'a touch hitting the wall alongside the door cannot trigger an exit');
const balcony=game.enter('lodge',2);
tap(0,-11);
assert.equal(balcony.trip,null,'balcony view cannot be used as a ground-floor exit');
console.log('Touch walking through four open doors, indoor retargeting, walls and balcony passed.');

for(const [w,h] of [[390,760],[900,390],[1000,700]]){
  globalThis.innerWidth=w;globalThis.innerHeight=h;game.resize();
  for(const [kind,floor] of [['barn',1],['coop',1],['shed',1],['lodge',1],['lodge',2]]){
    game.enter(kind,floor);
    for(const z of [.55,1,4]){
      game.player.z=z;
      for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        const {sprite,eye}=game.visitorFrame(yaw);
        assert.ok(sprite.y-2.32*sprite.s>=0&&sprite.y+.16*sprite.s<h,'hat and feet stay in view');
        assert.ok(sprite.x-.5*sprite.s>=0&&sprite.x+.5*sprite.s<w,'whole visitor fits the screen');
        assert.ok(eye.z>=(floor===2?-1.35:.34),'camera stays within the room or its balcony');
      }
    }
  }
}
console.log('Indoor visitor framing at the threshold and along the aisle passed.');
