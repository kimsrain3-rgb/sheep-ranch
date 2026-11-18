import assert from 'node:assert/strict';
import {BuildingOcclusion} from '../dist/render/occlusion.js';

const basis={x:0,z:0,height:1.5,sy:0,cy:1,cp:1,sp:0,f:100,cx:100,screenY:100};
const wall={polygons:[[[ -2,10,0],[2,10,0],[2,10,4],[-2,10,4]]]};
const overlap={polygons:[[[-1,10,0],[3,10,0],[3,10,4],[-1,10,4]]]};
const depth=new BuildingOcclusion();depth.prepare(basis,200,200,[wall,overlap]);
assert.equal(depth.occluded(100,100,12),true,'animal fragments behind the wall are hidden');
assert.equal(depth.occluded(100,100,8),false,'foreground animals remain visible');
assert.equal(depth.occluded(55,100,12),false,'animals beyond the actual silhouette stay visible');
const masks=depth.masks(12,{left:60,top:60,right:150,bottom:130});
for(const [x,y] of [[100.5,100.5],[90.5,90.5],[120.5,105.5]])assert.equal(masks.filter(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h).length,1,'overlapping faces never create mask overlap holes');
const builds=depth.builds;depth.prepare(basis,200,200,[wall,overlap]);assert.equal(depth.builds,builds,'standing still reuses the building depth map');
depth.prepare({...basis,x:1},200,200,[wall,overlap]);assert.equal(depth.builds,builds+1,'walking changes the depth map');

// A receding wall is z = 2*x+12; its ray depth must interpolate reciprocally.
const slanted={polygons:[[[-3,6,0],[3,18,0],[3,18,6],[-3,6,6]]]};
depth.prepare(basis,200,200,[slanted]);
const expected=12/(1-2*(110.5-basis.cx)/basis.f);
assert.ok(Math.abs(1/depth.depth[100*200+110]-expected)<.0001,'perspective depth matches the physical wall ray');
assert.equal(depth.occluded(110,100,14),false);assert.equal(depth.occluded(110,100,16),true);

const opening={polygons:[
 [[-4,10,0],[-1,10,0],[-1,10,4],[-4,10,4]],
 [[1,10,0],[4,10,0],[4,10,4],[1,10,4]]
]};
depth.prepare(basis,200,200,[opening]);assert.equal(depth.occluded(100,100,15),false,'real openings preserve the view beyond them');assert.equal(depth.occluded(75,100,15),true);
const near={polygons:[[[-1,.4,0],[1,4,0],[1,4,3]]]};
depth.prepare(basis,200,200,[near]);assert.ok(depth.depth.some(v=>v>0),'near-plane crossings stay clipped and finite');assert.ok(depth.depth.every(Number.isFinite));
depth.prepare(basis,200,200,[{...near,skipNearCrossing:true}]);assert.ok(depth.depth.every(v=>v===0),'legacy barn mask matches its near-plane draw behavior');
const billboard={billboard:true,x:0,z:10,polygons:[[[-2,-4],[2,-4],[2,0],[-2,0]]]};
depth.prepare(basis,200,200,[billboard]);assert.equal(depth.occluded(100,100,12),true,'legacy warehouse uses its actual flat painted silhouette');
depth.prepare(basis,3840,2160,[wall]);assert.ok(depth.depth.length<1505000,'large displays keep a bounded memory budget');

const calls=[];const context={save(){calls.push('save');},restore(){calls.push('restore');},beginPath(){},rect(){},clip(rule){calls.push(rule);}};
depth.prepare(basis,200,200,[wall]);depth.draw(context,12,{left:80,top:70,right:120,bottom:120},()=>calls.push('draw'));
assert.deepEqual(calls,['save','evenodd','draw','restore'],'mask clips only hidden pixels and restores state without changing animal opacity');
console.log('Building occlusion: true surface depth, foreground visibility, partial silhouettes, overlap union, perspective, real openings, near clipping, cache and bounded memory passed.');

// Two crossing walls cannot be ordered by a single entrance/center point.
// The nearest building owns each pixel, even if the paint order reverses.
const crossing=[{...slanted,kind:'barn'},{kind:'coop',polygons:[[[-3,18,0],[3,6,0],[3,6,6],[-3,18,6]]]}];
for(const sources of [crossing,[...crossing].reverse()]){
 depth.prepare(basis,200,200,sources);
 const blocked=(kind,x,y)=>depth.buildingMasks(kind).some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
 assert.equal(blocked('barn',90.5,100.5),false,'near left barn wall remains opaque');
 assert.equal(blocked('coop',90.5,100.5),true,'rear coop cannot paint across the nearer barn wall');
 assert.equal(blocked('barn',110.5,100.5),true,'on the right the nearer building changes');
 assert.equal(blocked('coop',110.5,100.5),false);
 const masks=depth.buildingMasks('barn');assert.equal(depth.buildingMasks('barn'),masks,'building masks are cached at a fixed camera');
}
console.log('Building overlap: nearest surface ownership is independent of building paint order.');

// The warehouse shadow extends below its opaque billboard geometry.
depth.prepare(basis,200,200,[{kind:'shed',polygons:[[[-1,20,3],[1,20,3],[1,20,4],[-1,20,4]]]},{kind:'barn',polygons:[[[-3,10,0],[3,10,0],[3,10,3],[-3,10,3]]]}]);
assert.ok(depth.buildingMasks('shed').some(r=>100.5>=r.x&&100.5<r.x+r.w&&105.5>=r.y&&105.5<r.y+r.h),'a rear building shadow cannot paint onto a front roof outside its own mesh bounds');


// Picking uses exactly the same opaque nearest surface as composition.
depth.prepare(basis,200,200,[{...opening,kind:'barn'},{kind:'coop',polygons:[[[-2,15,0],[2,15,0],[2,15,4],[-2,15,4]]]}]);
assert.equal(depth.buildingAt(75,100),'barn','actual wall selects its building');
assert.equal(depth.buildingAt(100,100),'coop','a real opening selects the visible building beyond it');
assert.equal(depth.buildingAt(100,119),null,'empty grass below the building is never part of its hit area');
assert.equal(depth.buildingAt(70,59),null,'empty sky inside a broad bounding box is not a building');
for(const point of [[-1,100],[200,100],[100,200],[NaN,100]])assert.equal(depth.buildingAt(...point),null);
depth.prepare(basis,3840,2160,[{...wall,kind:'barn'}]);
assert.equal(depth.buildingAt(100,100),'barn','CSS coordinates match the bounded-resolution atlas on large displays');
console.log('Visible building picking: nearest wall, genuine openings, sky/grass rejection, viewport bounds and scaled atlas passed.');
