import * as THREE from '../vendor/three/three.module.js';

const sizeX=1024, rowHeight=40, rows=16;
let oakMap;

function randomSeed(seed){
  let state=seed>>>0;
  return ()=>{
    state=(Math.imul(1664525,state)+1013904223)>>>0;
    return state/4294967296;
  };
}

function noiseGrid(nx,ny,random){
  const cells=Float32Array.from({length:(nx+1)*(ny+1)},()=>random()*2-1);
  return (u,v)=>{
    const x=Math.max(0,Math.min(.99999,u))*nx,y=Math.max(0,Math.min(.99999,v))*ny;
    const i=Math.floor(x),j=Math.floor(y),offset=j*(nx+1)+i;
    let a=x-i,b=y-j;
    a=a*a*(3-2*a);b=b*b*(3-2*b);
    const first=cells[offset]*(1-a)+cells[offset+1]*a;
    const next=cells[offset+nx+1]*(1-a)+cells[offset+nx+2]*a;
    return first*(1-b)+next*b;
  };
}

// Each atlas row is a different sawn board. The lower rows are varnished;
// the middle rows have greyed foot wear, the last rows are vertical joinery.
function makeOakMap(){
  const pixels=new Uint8Array(sizeX*rowHeight*rows*4);
  for(let row=0;row<rows;row++){
    const random=randomSeed(71+row*17519),isFloor=row>=8&&row<12;
    const warp=noiseGrid(7,3,random),cloud=noiseGrid(9,4,random);
    const lines=noiseGrid(15,36,random),pores=noiseGrid(195,38,random);
    const glaze=noiseGrid(39,9,random);
    const knots=Array.from({length:row%3===0?2:1},()=>({
      x:.08+.84*random(),y:random()*1.4-.2,w:.024+random()*.035,h:.13+.21*random()
    }));
    const boardTone=random()*11-5.5;
    const centerWear=isFloor?(row===8||row===9?.94:.30):.36;
    const wave=random()*6.28;
    for(let j=0;j<rowHeight;j++)for(let i=0;i<sizeX;i++){
      const u=i/(sizeX-1),v=j/(rowHeight-1);
      let flow=v+.138*warp(u,v)+.080*Math.sin(u*9.3+wave);
      let burl=0;
      for(const knot of knots){
        const dx=(u-knot.x)/knot.w,dy=(v-knot.y)/knot.h;
        const distance=dx*dx+dy*dy;
        flow+=.28*dy*Math.exp(-distance*.62);
        burl+=Math.exp(-distance*3.1)*(.57+.43*Math.cos(Math.sqrt(distance)*15.0));
      }
      const fiber=.5+.5*Math.sin(flow*77+2.0*cloud(u,v)+.8*Math.sin(flow*91+wave));
      const striation=lines(u,Math.min(.998,Math.max(.001,.16+.66*flow)));
      const vessel=Math.max(0,-pores(u,v)-.20)*Math.max(.15,fiber);
      const dark=16*Math.pow(fiber,4.8)+10*vessel+24*burl;
      const edge=Math.pow(Math.abs(2*v-1),5);
      const rubPatch=Math.max(0,cloud(u,v)+.4*glaze(u,v)-.04);
      const rubbedVarnish=row<8?.62*rubPatch+.43*edge*(.7+.3*Math.cos(u*7+wave)):0;
      const polish=centerWear*(.51+.30*cloud(u,v)+.19*glaze(u,v))+.20*edge+rubbedVarnish;
      const patina=boardTone+17*cloud(u,v)+18*striation+6*glaze(u,v)-dark+(random()-.5)*6;
      const base=isFloor?[99,70,49]:row<8?[142,83,45]:[112,65,36];
      const off=((row*rowHeight+j)*sizeX+i)*4;
      pixels[off]=Math.max(0,base[0]+patina+polish*(isFloor?54:34));
      pixels[off+1]=Math.max(0,base[1]+patina*.85+polish*(isFloor?54:33));
      pixels[off+2]=Math.max(0,base[2]+patina*.66+polish*(isFloor?54:27));
      pixels[off+3]=255;
    }
    // Broken, narrow scratches run with the boards. Floors also carry oblique scuffs.
    for(let s=0;s<(isFloor?65:25);s++){
      const x=Math.floor(random()*(sizeX-60)),y=3+random()*(rowHeight-7);
      const length=Math.floor(5+random()**2*(isFloor?53:27));
      const slope=(random()-.5)*(isFloor?.16:.045),brightness=(random()<.24?-19:23);
      for(let k=0;k<length;k++){
        const py=Math.round(y+k*slope);
        if(py<1||py>=rowHeight-1||random()<.12)continue;
        const off=((row*rowHeight+py)*sizeX+x+k)*4;
        const delta=brightness*Math.sin(Math.PI*k/length);
        for(let c=0;c<3;c++)pixels[off+c]+=delta;
      }
    }
  }
  const tex=new THREE.DataTexture(pixels,sizeX,rowHeight*rows,THREE.RGBAFormat);
  tex.name='Oiled oak grain and worn floorboards';tex.colorSpace=THREE.SRGBColorSpace;
  tex.generateMipmaps=true;tex.magFilter=THREE.LinearFilter;
  tex.minFilter=THREE.LinearMipmapLinearFilter;tex.anisotropy=4;tex.needsUpdate=true;
  return tex;
}

export function cabinOak(name,roughness){
  oakMap??=makeOakMap();
  const material=new THREE.MeshStandardMaterial({map:oakMap,roughness,metalness:0});
  material.name=name;
  return material;
}

export function mapOakBoard(mesh,variant,index){
  const geometry=mesh.geometry;
  const {width,height,depth}=geometry.parameters,dimensions=[width,height,depth];
  const axes=[0,1,2].sort((a,b)=>dimensions[b]-dimensions[a]);
  const positions=geometry.attributes.position,normals=geometry.attributes.normal,uv=geometry.attributes.uv;
  const row=variant==='seat'?index%8:variant==='floor'?8+index%4:12+index%4;
  const length=Math.min(.94,.27+dimensions[axes[0]]*.17);
  const start=(1-length)*((index*.381966+.137)%1);
  for(let i=0;i<positions.count;i++){
    const point=[positions.getX(i),positions.getY(i),positions.getZ(i)];
    const normal=[normals.getX(i),normals.getY(i),normals.getZ(i)];
    const visibleAxes=axes.filter(axis=>Math.abs(normal[axis])<.5);
    const [along,across]=visibleAxes;
    const u=point[along]/dimensions[along]+.5,v=point[across]/dimensions[across]+.5;
    uv.setXY(i,start+u*length,(row+(1.5+v*(rowHeight-3))/rowHeight)/rows);
  }
  return mesh;
}
