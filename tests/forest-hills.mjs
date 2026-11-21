import assert from 'node:assert/strict';
import {MeadowView} from '../dist/orbit.js';
import {drawHills} from '../dist/render/forest-hills.js';
import {forestHeight} from '../dist/game/forest-hills.js';

for(const [x,z] of [[0,0],[68,-27],[-23,108]]){
  const view=new MeadowView();
  view.target={x,z};
  view.terrainHeight=forestHeight;
  for(const [w,h] of [[390,844],[1280,800]]){
    let painted=0;
    const ctx={beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){painted++;}};
    drawHills(ctx,view,w,h,{});
    assert.ok(painted>0,'Outdoor renderer must paint visible hill faces');
  }
}
