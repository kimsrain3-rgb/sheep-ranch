import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MeadowView} from '../dist/orbit.js';
import {BarnInteriorView} from '../dist/game/barn-camera.js';
import {drawBarnImmersiveModel,drawBarnModel,hasBarnModel,loadBarnModel} from '../dist/render/barn-model.js';

const data=JSON.parse(await readFile(new URL('../dist/assets/models/sheep-barn-mesh.json',import.meta.url),'utf8'));
assert.equal(data.faces.length,2405);
assert.equal(data.materials.length,10);
const oldFetch=globalThis.fetch;
globalThis.fetch=async()=>({ok:true,json:async()=>data});
await loadBarnModel();
globalThis.fetch=oldFetch;
assert.ok(hasBarnModel());

for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const view=new MeadowView();
  view.target={x:-25,z:35};view.yaw=yaw;view.zoom=.75;view.pitch=.35;
  const canvas={canvas:{width:1200},fills:0,save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){this.fills++},stroke(){},fillRect(){},fillText(){},measureText(text){return {width:text.length*8}}};
  const hit=drawBarnModel(canvas,(x,z,y)=>view.project(x,z,y,1200,800),{x:-25,z:28},{inside:5,total:62});
  assert.ok(hit&&Number.isFinite(hit.x)&&Number.isFinite(hit.y));
  assert.ok(hit.w>100&&hit.h>50,'building has a useful tap area from every direction');
  assert.ok(canvas.fills>2000,'actual Blender faces are projected into the scene');
  const indoor=new BarnInteriorView();indoor.target={x:0,z:6};indoor.yaw=yaw;
  canvas.fills=0;
  assert.ok(drawBarnImmersiveModel(canvas,1200,800,indoor));
  assert.ok(canvas.fills>10,'closed interior projects floor, walls and roof from eye height');
  const floor=indoor.ground(600,650,1200,800),screen=indoor.project(floor.x,floor.z,0,1200,800);
  assert.ok(Math.abs(screen.x-600)<.01&&Math.abs(screen.y-650)<.01,'floor picking matches the immersive camera');
}
console.log('Blender barn exterior and closed eye-height interior render in four directions with an entry hit area.');
