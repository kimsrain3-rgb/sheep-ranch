import {CONFIG,pondPoint,BRIDGES,bridgePoint,WATERWAYS,buildingFootprints,isWater,keepDry,clamp} from './game/config.js';
import {forestPins,trailX,clearTrunks} from './game/fir-grove.js';
import {TRAM_STATION} from './game/tram-station.js';

const bounds=CONFIG.playerBounds;
const buildings=buildingFootprints(CONFIG);
const names={barn:'양 축사',coop:'닭장',lodge:'목동 숙소',shed:'건초 창고',windmill:'풍차 전망대'};
export const streamLookout={name:'상류 물가',x:-45,z:87,kind:'stream'};
export const places=[
  {name:'전나무 숲',x:trailX(-27),z:-27,kind:'forest'},
  {name:'자작나무숲',x:-23,z:108,kind:'birch'},
  streamLookout,
  {name:'연못가',...pondPoint(4.82,1.29),kind:'water'},
  ...buildings.filter(b=>b.kind in names).map(b=>({name:names[b.kind],x:b.doorX,z:b.front-1.4,kind:b.kind})),
  {name:'바람목장역',...TRAM_STATION.waitingSpot,kind:'station'},
  {name:'해먹',...CONFIG.hammock,kind:'hammock'}
];
export function mapDestination(point){
  const footprint=buildings.find(b=>point.x>=b.left&&point.x<=b.right&&point.z>=b.front&&point.z<=b.back);
  if(footprint)return {...places.find(p=>p.kind===(footprint.kind==='tram'?'station':footprint.kind))};
  const goal={x:clamp(point.x,bounds.minX,bounds.maxX),z:clamp(point.z,bounds.minZ,bounds.maxZ)};
  const wet=isWater(goal);
  keepDry(goal);clearTrunks(goal);
  return {...goal,name:point.name||(wet?'가까운 물가':'선택한 지점')};
}
const ns='http://www.w3.org/2000/svg';
function add(parent,tag,attrs,text){
  const node=document.createElementNS(ns,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
  if(text)node.textContent=text;
  parent.append(node);return node;
}
const coords=p=>p.x+','+(-p.z);
function drawTerrain(svg){
  const {minX,maxX,minZ,maxZ}=bounds;
  svg.setAttribute('viewBox',[minX-7,-maxZ-7,maxX-minX+14,maxZ-minZ+14].join(' '));
  add(svg,'rect',{x:minX,y:-maxZ,width:maxX-minX,height:maxZ-minZ,rx:2,fill:'#e0e8cf',stroke:'#a9ba99','stroke-width':.7});
  const path=(points,color,width)=>add(svg,'polyline',{points:points.map(coords).join(' '),fill:'none',stroke:color,'stroke-width':width,'stroke-linejoin':'round','stroke-linecap':'round'});
  // Symbols, shorelines and picking share one north-up world coordinate system.
  const clip=add(add(svg,'defs',{}),'clipPath',{id:'pasture-map-boundary'});
  add(clip,'rect',{x:minX,y:-maxZ,width:maxX-minX,height:maxZ-minZ});
  const waterways=add(svg,'g',{'clip-path':'url(#pasture-map-boundary)'});
  for(const river of WATERWAYS){
    const bank=side=>river.points.map((p,i)=>{
      const a=river.points[Math.max(0,i-1)],b=river.points[Math.min(i+1,river.points.length-1)],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
      return {x:p.x-side*dz/len*p.width,z:p.z+side*dx/len*p.width};
    });
    add(waterways,'polygon',{points:[...bank(1),...bank(-1).reverse()].map(coords).join(' '),fill:'#7faeac'});
  }
  add(svg,'polygon',{points:Array.from({length:96},(_,i)=>coords(pondPoint(i*Math.PI/48))).join(' '),fill:'#7faeac'});
  const trail=Array.from({length:55},(_,i)=>({x:trailX(-84+i*2),z:-84+i*2}));
  path(trail,'#a0bb8b',25);path(trail,'#d8c899',2);
  for(const bridge of BRIDGES)path([-1,1].map(sign=>bridgePoint(sign*bridge.halfLength,0,bridge)),'#916e45',bridge.halfWidth*2);
  for(const b of buildings)add(svg,'rect',{x:b.left,y:-b.back,width:b.right-b.left,height:b.back-b.front,rx:1,fill:'#b58a69',stroke:'#896c50','stroke-width':.6});
  const text=(x,z,label)=>add(svg,'text',{x,y:-z,'text-anchor':'middle',fill:'#3d5c48','font-size':7,'paint-order':'stroke',stroke:'#e6edd8','stroke-width':2.2,'stroke-linejoin':'round'},label);
  text(-53,205,'산자락');text(20,123,'북쪽 초지');text(-35,71,'목장 건물');text(-26,-10,'연못');text(70,-48,'전나무 숲');
  for(const p of places)add(svg,'circle',{cx:p.x,cy:-p.z,r:1.55,fill:'#654f35',stroke:'white','stroke-width':.7});
}
export function setupRanchMap(read,travel){
  const dialog=document.getElementById('ranch-map'),svg=document.getElementById('ranch-map-drawing');
  const shortcuts=document.getElementById('ranch-map-places'),status=document.getElementById('ranch-map-status');
  drawTerrain(svg);
  const route=add(svg,'polyline',{fill:'none',stroke:'#b2603e','stroke-width':1.5,'stroke-dasharray':'3 2','stroke-linecap':'round'});
  const pin=add(svg,'circle',{r:3.5,fill:'#b2603e',stroke:'white','stroke-width':1});
  const halo=add(svg,'circle',{r:6,fill:'#226858',opacity:.23});
  const self=add(svg,'circle',{r:3.2,fill:'#226858',stroke:'white','stroke-width':1.4});
  function refresh(){
    const {position,points}=read();
    for(const dot of [self,halo]){dot.setAttribute('cx',position.x);dot.setAttribute('cy',-position.z);}
    route.setAttribute('points',points.length?[position,...points].map(coords).join(' '):'');
    pin.setAttribute('visibility',points.length?'visible':'hidden');
    if(points.length){const p=points.at(-1);pin.setAttribute('cx',p.x);pin.setAttribute('cy',-p.z);}
  }
  function select(point){
    const error=travel(mapDestination(point));
    if(error){status.textContent=error;return;}
    dialog.close();
  }
  svg.addEventListener('click',e=>{
    const matrix=svg.getScreenCTM();if(!matrix)return;
    const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()),x=point.x,z=-point.y;
    if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return;
    select({x,z});
  });
  for(const p of places){
    const button=document.createElement('button');button.type='button';button.textContent=p.name;button.onclick=()=>select(p);shortcuts.append(button);
  }
  let timer;
  dialog.addEventListener('close',()=>clearInterval(timer));
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  dialog.addEventListener('keyup',e=>e.stopPropagation());
  document.getElementById('ranch-map-close').onclick=()=>dialog.close();
  return ()=>{
    if(dialog.open)return;
    status.textContent='가고 싶은 땅이나 장소 이름을 누르세요.';
    refresh();dialog.showModal();timer=setInterval(refresh,250);
  };
}
