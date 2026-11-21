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
  export {update,player,centerView,resize,outdoorView,takeLodgeStairs};
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
  export function approachDoor(kind,distance){
    started=true;paused=false;doorwayWalk=null;outdoorWalk=null;
    barnVisit.inside=lodgeVisit.inside=farmVisit.inside=false;view=outdoorView;
    const door=CONFIG[kind].entrance;
    Object.assign(player,{x:door.x,tx:door.x,z:door.z-distance,tz:door.z-distance});
    entranceDoors[kind]=0;
    if(kind==='lodge'){goLodge();return lodgeVisit;}
    goFarmRoom(kind);return farmVisit;
  }
  export {entranceDoors,followMapPin,readMapPosition};
  export function visitorFrame(yaw){
    view.yaw=yaw;centerView();
    return {sprite:roomVisitorProjection(view,player,W,H),eye:view.basis(W,H)};
  }
  export function screen(x,z){return view.project(x,z,0,W,H);}
`;
const game=await import('data:text/javascript;base64,'+Buffer.from(source+hooks).toString('base64'));
const rooms=Object.entries(CONFIG).filter(([,place])=>place?.walkableFloors>0);
function tap(x,z){
  const p=game.screen(x,z);
  assert.ok(p&&p.x>=0&&p.x<innerWidth&&p.y>=0&&p.y<innerHeight,'target is on screen');
  for(const name of ['pointerdown','pointerup'])listeners.get(name)({button:0,pointerId:1,clientX:p.x,clientY:p.y});
}
for(const [w,h] of [[1000,700],[390,760]]){
  globalThis.innerWidth=w;globalThis.innerHeight=h;game.resize();
  for(const [kind] of rooms){
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
  for(const [kind,place] of rooms)for(let floor=1;floor<=place.walkableFloors;floor++){
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

// Each multi-storey building needs an actual way to start stair travel in the
// same game simulation used by the pointer tests above.
const startStairs={lodge:game.takeLodgeStairs};
for(const [kind,place] of rooms){
  if(place.walkableFloors<2)continue;
  assert.equal(typeof startStairs[kind],'function',kind+': connect the stair control to the round-trip test');
  const visit=game.enter(kind);
  for(const direction of [1,-1]){
    for(let leg=1;leg<place.walkableFloors;leg++){
      const from=visit.floor,to=from+direction;
      startStairs[kind](to);
      let previous=visit.elevation,sawIntermediate=false;
      for(let frame=0;frame<1800&&visit.floor!==to;frame++){
        game.update(1/60);
        const change=visit.elevation-previous;
        if(change*direction>0)sawIntermediate=true;
        assert.ok(Math.abs(change)<.15,kind+': stair travel must be continuous');
        previous=visit.elevation;
      }
      assert.ok(sawIntermediate&&visit.floor===to,kind+': each stair flight must reach the next landing');
    }
  }
}

for(const kind of Object.keys(game.entranceDoors)){
  for(const startDistance of [4,.05]){
    const visit=game.approachDoor(kind,startDistance);
    const threshold=CONFIG[kind].entrance;
    let openingFrames=0,waited=false;
    for(let i=0;i<250&&!visit.inside;i++){
      const previous={...game.player};
      game.update(1/60);
      const open=game.entranceDoors[kind];
      if(open>0&&open<1){
        openingFrames++;
        assert.equal(visit.inside,false,kind+' waits outside a moving door');
        if(distance(previous,threshold)<1.72&&distance(previous,game.player)<1e-8)waited=true;
      }
    }
    assert.ok(waited&&openingFrames>20&&visit.inside,kind+' visibly opens before entry');
    assert.equal(game.entranceDoors[kind],1);
    visit.requestExit(game.player);
    for(let i=0;i<250&&visit.inside;i++)game.update(1/60);
    assert.ok(!visit.inside&&game.entranceDoors[kind]===1,kind+' exits through an open door');
    Object.assign(game.player,{z:threshold.z-7,tz:threshold.z-7});
    for(let i=0;i<100;i++)game.update(1/60);
    assert.equal(game.entranceDoors[kind],0,kind+' closes after the visitor walks away');
  }
}

for(const [kind,floor] of [['barn',1],['coop',1],['shed',1],['lodge',2]]){
  const visit=game.enter(kind,floor);
  const door=CONFIG[kind].entrance;
  const goal={x:door.x,z:door.z-5,name:'입구 앞 풀밭'};
  assert.deepEqual(game.readMapPosition().position,visit.outside);
  assert.equal(game.followMapPin(goal),'');
  assert.ok(visit.inside,'selecting a map point must not teleport the visitor');
  for(let step=0;step<600;step++){
    game.update(.05);
    if(!visit.inside && distance(game.player,goal)<.1)break;
  }
  assert.ok(!visit.inside && distance(game.player,goal)<.1,kind+' follows the map pin via stairs and door');
}
console.log('Map pins from all walkable buildings reach their outdoor destination on foot.');
