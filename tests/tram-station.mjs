import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.js';
import {CONFIG,isWater} from '../dist/game/config.js';
import {buildingPathClear} from '../dist/game/building-collision.js';
import {TRAM_STATION,TRAM_STOP,TRACK_CURVE,RAIL_TOP} from '../dist/game/tram-station.js';
import {dryRoute} from '../dist/game/navigation.js';
import {mapDestination,places} from '../dist/ranch-map.js';
import {MeadowView} from '../dist/orbit.js';
import {BuildingRenderer} from '../dist/render/buildings-three.js';
import {createTram,createTramStation,createTramTrack,trackPoint} from '../dist/render/tram-station.js';

const station=places.find(place=>place.kind==='station');
assert.deepEqual({x:station.x,z:station.z},TRAM_STATION.waitingSpot);
assert.deepEqual(mapDestination(TRAM_STOP),station);
const route=dryRoute({x:36,z:48,type:'visitor'},station);
assert.deepEqual(route.at(-1),TRAM_STATION.waitingSpot);
const sheltered=TRAM_STATION.waitingSpot;
assert.equal(buildingPathClear(TRAM_STATION.entrance,sheltered,CONFIG),true,'the open front admits visitors');
assert.ok(TRAM_STOP.z<TRAM_STATION.entrance.z&&TRAM_STATION.entrance.z<sheltered.z);
assert.deepEqual(dryRoute(sheltered,TRAM_STATION.entrance),[TRAM_STATION.entrance],'walk straight back onto the platform');
for(const side of [-1,1]){
  assert.equal(buildingPathClear(sheltered,{x:sheltered.x+side*2,z:sheltered.z},CONFIG),false,'side walls block visitors');
}
assert.equal(buildingPathClear(sheltered,{x:sheltered.x,z:TRAM_STATION.z+2},CONFIG),false,'the rear wall and bench block visitors');
const stationModel=createTramStation();
const sightline=new THREE.Raycaster(new THREE.Vector3(0,1.2,-.78),new THREE.Vector3(0,0,1));
assert.equal(sightline.intersectObject(stationModel,true).length,0,'seated passengers see the track through the opening');
const step=stationModel.userData.parts.find(p=>p.name==='low entrance step');
assert.ok(step.min[2]>0,'the modeled doorstep faces the rails');

let nearest=Infinity;
for(let distance=0;distance<95;distance+=.12){
  const point=trackPoint(distance);
  assert.ok(!isWater(point,1));
  assert.ok(point.x+1<CONFIG.playerBounds.maxX);
  nearest=Math.min(nearest,Math.hypot(point.x-TRACK_CURVE.x,point.z-TRACK_CURVE.z));
}
assert.ok(nearest<.12,'rail centerline passes the designated P01 curve');
const tram=createTram();
const woodGroups=tram.children.filter(mesh=>mesh.material.map?.isDataTexture);
assert.equal(woodGroups.length,3,'cabin joinery, seat varnish and foot-worn floor each have a finish');
for(const mesh of woodGroups){
  const {position,uv}=mesh.geometry.attributes;
  assert.equal(uv.count,position.count,'batching preserves the board grain coordinates');
  assert.ok(uv.array.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
}
assert.ok(woodGroups.find(m=>m.name.includes('seats')).material.roughness<
  woodGroups.find(m=>m.name.includes('floor')).material.roughness);
const wheel=tram.userData.parts.find(part=>part.name==='rail wheel');
const seats=tram.userData.parts.filter(part=>part.name==='long bench seat slat');
assert.equal(seats.length,16);
assert.ok(seats.every(part=>part.min[2]>.37||part.max[2]<-.37),'both benches leave a clear center aisle');
assert.ok(tram.children.some(mesh=>mesh.material.transparent&&mesh.material.opacity<.25),'the passenger windows are transparent');
assert.equal(tram.userData.parts.filter(part=>part.name==='curved ivory ceiling').length,16);
const eye=new THREE.Vector3(.33,1.75,0),glassDirection=new THREE.Vector3(0,0,1);
const ray=new THREE.Raycaster(eye,glassDirection);
const faces=ray.intersectObject(tram,true);
assert.ok(faces.length&&faces.every(hit=>hit.object.material.transparent),'a seated sightline passes out through the window');
assert.ok(Math.abs(wheel.min[1]-RAIL_TOP)<.00001,'wheel meets the rail head');
for(const model of [stationModel,tram,createTramTrack()]){
  assert.ok(model instanceof THREE.Group&&model.children.length<20);
  for(const mesh of model.children)assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));
}

const renderer=new BuildingRenderer({createCanvas:()=>null});
renderer.prepareRailway();
const renderedTram=renderer.buildings.tram;
assert.equal(renderedTram.model.userData.parts.filter(part=>part.name==='wine destination box').length,2);
assert.equal(renderedTram.model.userData.parts.some(part=>part.name==='painted sign stroke'),false);
assert.equal(renderedTram.lettering,undefined,'both destination boards start blank');
for(const name of ['북극','사막','정글','북극']){
  renderer.caches.set('tram',{});
  renderer.setTramDestination(name);
  const ink=renderedTram.lettering;
  assert.equal(ink.name,name+'행');
  assert.equal(ink.parent,renderedTram.model,'WebGL shows lettering on the actual tram');
  assert.equal(renderer.caches.has('tram'),false,'a parked camera must refresh the tram image');
  const inkFaces=renderedTram.faces.filter(face=>face.material===ink.material);
  assert.equal(inkFaces.length,ink.geometry.attributes.position.count/3);
  const front=inkFaces.filter(face=>face.points.every(([x])=>x>TRAM_STOP.x+2.85));
  const back=inkFaces.filter(face=>face.points.every(([x])=>x<TRAM_STOP.x-2.85));
  assert.ok(front.length&&front.length===back.length,'Canvas fallback gets both outward signs');
  assert.equal(renderedTram.faces.length,renderedTram.bodyFaces.length+inkFaces.length,'old letters are removed');
  renderer.setTramDestination(name);
  assert.equal(renderedTram.lettering,ink,'same selection keeps its meshes');
}
let fills=0;
const c=new Proxy({canvas:{dataset:{}}},{get(target,key){
  if(key==='fill')return ()=>fills++;
  return target[key]??(()=>{});
}});
for(const [width,height] of [[1280,800],[390,844],[844,390]])for(const yaw of [.15,1.35,3.45,5.45]){
  const camera=new MeadowView();
  Object.assign(camera,{target:{x:67,z:47},yaw,pitch:.24,zoom:1.44});
  const project=(x,z,y=0)=>camera.project(x,z,y,width,height);
  for(const part of ['tram-track','tram-platform','station','tram']){
    const before=fills;
    const bounds=renderer.draw(c,part,project,camera,width,height,{label:false,shadow:false});
    assert.ok(bounds&&bounds.w>0&&bounds.h>0&&fills>before,part+' has visible projected faces');
  }
}
renderer.dispose();
console.log('Tram station and cabin: shelter access and perimeter, open sightlines, clear aisle, P01 curve, rail contact and desktop/phone projection passed.');
