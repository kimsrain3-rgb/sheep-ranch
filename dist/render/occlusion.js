// A small cached depth buffer for the opaque buildings. Canvas animals stay
// fully opaque; only fragments actually behind a nearer wall/roof are clipped.
// Inverse depth is interpolated in screen space for perspective-correct tests.
export class BuildingOcclusion{
  constructor(){this.width=0;this.height=0;this.scale=1;this.depth=new Float32Array(0);this.owner=new Uint8Array(0);this.sourceIds=new Map();this.buildingMaskCache=new Map();this.sources=[];this.key='';this.regions=[];this.builds=0;}
  prepare(basis,W,H,sources,near=.8){
    const key=[W,H,basis.x,basis.z,basis.height,basis.sy,basis.cy,basis.cp,basis.sp,basis.f,basis.cx,basis.screenY,near].join('|');
    if(key===this.key&&sources.length===this.sources.length&&sources.every((source,i)=>source===this.sources[i]))return;
    this.key=key;this.sources=[...sources];this.builds++;
    this.screenWidth=W;this.screenHeight=H;this.scale=Math.min(1,Math.sqrt(1500000/(W*H)));
    const width=Math.ceil(W*this.scale),height=Math.ceil(H*this.scale);
    if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.depth=new Float32Array(width*height);this.owner=new Uint8Array(width*height);}else{this.depth.fill(0);this.owner.fill(0);}
    this.regions=[];this.sourceIds.clear();this.buildingMaskCache.clear();
    const transform=([x,z,y=0])=>{
      const dx=x-basis.x,dz=z-basis.z,forward=dx*basis.sy+dz*basis.cy,up=y-basis.height;
      return {side:dx*basis.cy-dz*basis.sy,up:up*basis.cp+forward*basis.sp,depth:forward*basis.cp-up*basis.sp};
    };
    const screen=p=>({x:(basis.cx+p.side*basis.f/p.depth)*this.scale,y:(basis.screenY-p.up*basis.f/p.depth)*this.scale,inverse:1/p.depth});
    for(const source of sources){
      if(!source)continue;
      this.currentOwner=this.sourceIds.size+1;this.sourceIds.set(source.kind??source,this.currentOwner);
      this.region={id:this.currentOwner,left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity,maxInverse:0};
      if(source.billboard){
        const origin=transform([source.x,source.z,0]);
        if(origin.depth>=near){
          const p=screen(origin),scale=basis.f/origin.depth*this.scale*(source.scale??1);
          for(const polygon of source.polygons){
            const points=polygon.map(([x,y])=>({x:p.x+x*scale,y:p.y+y*scale,inverse:p.inverse}));
            for(let i=1;i<points.length-1;i++)this.triangle(points[0],points[i],points[i+1]);
          }
        }
      }else for(const polygon of source.polygons){
        const points=polygon.map(transform),cutoff=source.near??near;
        if(source.skipNearCrossing&&points.some(p=>p.depth<cutoff))continue;
        const clipped=[];let previous=points.at(-1);
        for(const point of points){
          const a=previous.depth>=cutoff,b=point.depth>=cutoff;
          if(a!==b){const t=(cutoff-previous.depth)/(point.depth-previous.depth);clipped.push({side:previous.side+(point.side-previous.side)*t,up:previous.up+(point.up-previous.up)*t,depth:cutoff});}
          if(b)clipped.push(point);previous=point;
        }
        const projected=clipped.map(screen);
        for(let i=1;i<projected.length-1;i++)this.triangle(projected[0],projected[i],projected[i+1]);
      }
      if(this.region.right>=this.region.left)this.regions.push(this.region);
    }
    this.region=null;
  }
  triangle(a,b,c){
    const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
    if(!Number.isFinite(denominator)||Math.abs(denominator)<1e-9)return;
    const left=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),right=Math.min(this.width-1,Math.ceil(Math.max(a.x,b.x,c.x)));
    const top=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),bottom=Math.min(this.height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    if(right<left||bottom<top)return;
    const region=this.region;region.left=Math.min(region.left,left);region.right=Math.max(region.right,right);region.top=Math.min(region.top,top);region.bottom=Math.max(region.bottom,bottom);
    region.maxInverse=Math.max(region.maxInverse,a.inverse,b.inverse,c.inverse);
    const ax=(b.y-c.y)/denominator,ay=(c.x-b.x)/denominator,bx=(c.y-a.y)/denominator,by=(a.x-c.x)/denominator;
    const da=a.inverse-c.inverse,db=b.inverse-c.inverse;
    for(let y=top;y<=bottom;y++){
      let wa=ax*(left+.5-c.x)+ay*(y+.5-c.y),wb=bx*(left+.5-c.x)+by*(y+.5-c.y),index=y*this.width+left;
      for(let x=left;x<=right;x++,index++,wa+=ax,wb+=bx){
        if(wa<-.000001||wb<-.000001||wa+wb>1.000001)continue;
        const inverse=c.inverse+wa*da+wb*db;
        if(inverse>this.depth[index]){this.depth[index]=inverse;this.owner[index]=this.currentOwner;}
      }
    }
  }
  buildingAt(x,y){
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=this.screenWidth||y>=this.screenHeight)return null;
    const ix=Math.floor(x*this.scale),iy=Math.floor(y*this.scale);
    if(ix>=this.width||iy>=this.height)return null;
    const owner=this.owner[iy*this.width+ix];
    if(!owner)return null;
    for(const [kind,id] of this.sourceIds)if(id===owner)return typeof kind==='string'?kind:null;
    return null;
  }
  occluded(x,y,depth){
    const ix=Math.floor(x*this.scale),iy=Math.floor(y*this.scale);
    return depth>.04&&ix>=0&&iy>=0&&ix<this.width&&iy<this.height&&this.depth[iy*this.width+ix]>1/(depth-.04);
  }
  masks(depth,bounds){
    if(!Number.isFinite(depth)||depth<=.04)return [];
    const inverse=1/(depth-.04),s=this.scale;
    let left=Math.max(0,Math.floor(bounds.left*s)),right=Math.min(this.width-1,Math.ceil(bounds.right*s));
    let top=Math.max(0,Math.floor(bounds.top*s)),bottom=Math.min(this.height-1,Math.ceil(bounds.bottom*s));
    const overlaps=this.regions.filter(r=>r.maxInverse>inverse&&r.left<=right&&r.right>=left&&r.top<=bottom&&r.bottom>=top);
    if(!overlaps.length)return [];
    left=Math.max(left,Math.min(...overlaps.map(r=>r.left)));right=Math.min(right,Math.max(...overlaps.map(r=>r.right)));
    top=Math.max(top,Math.min(...overlaps.map(r=>r.top)));bottom=Math.min(bottom,Math.max(...overlaps.map(r=>r.bottom)));
    return this.runs(left,right,top,bottom,index=>this.depth[index]>inverse);
  }
  runs(left,right,top,bottom,hiddenAt){
    const s=this.scale,rectangles=[];let active=new Map();
    for(let y=top;y<=bottom;y++){
      const next=new Map();let start=-1,index=y*this.width+left;
      for(let x=left;x<=right+1;x++,index++){
        const hidden=x<=right&&hiddenAt(index);
        if(hidden&&start<0)start=x;
        if(!hidden&&start>=0){
          const key=start+':'+x,previous=active.get(key);
          const rectangle=previous||{x:start,y,w:x-start,h:0};rectangle.h++;next.set(key,rectangle);if(previous)active.delete(key);start=-1;
        }
      }
      rectangles.push(...active.values());active=next;
    }
    rectangles.push(...active.values());
    return rectangles.map(r=>({x:r.x/s,y:r.y/s,w:r.w/s,h:r.h/s}));
  }
  buildingMasks(kind){
    if(this.buildingMaskCache.has(kind))return this.buildingMaskCache.get(kind);
    const id=this.sourceIds.get(kind);
    if(!id)return [];
    // Shadows and signs can extend beyond a building's mesh bounds. They must
    // also stay behind any nearer opaque surface when layers are composited.
    const others=this.regions.filter(r=>r.id!==id);
    if(!others.length)return [];
    const left=Math.min(...others.map(r=>r.left)),right=Math.max(...others.map(r=>r.right));
    const top=Math.min(...others.map(r=>r.top)),bottom=Math.max(...others.map(r=>r.bottom));
    const masks=this.runs(left,right,top,bottom,index=>this.owner[index]!==0&&this.owner[index]!==id);
    this.buildingMaskCache.set(kind,masks);return masks;
  }
  drawBuilding(c,kind,draw){this.clip(c,this.buildingMasks(kind),draw);}
  draw(c,depth,bounds,draw){this.clip(c,this.masks(depth,bounds),draw);}
  clip(c,masks,draw){
    c.save();
    if(masks.length){
      // These disjoint raster runs form a union, so even-odd subtraction has
      // no overlap holes even when several building faces cover one animal.
      c.beginPath();c.rect(0,0,this.screenWidth,this.screenHeight);
      for(const r of masks)c.rect(r.x,r.y,r.w,r.h);
      c.clip('evenodd');
    }
    try{draw();}finally{c.restore();}
  }
}

export function spriteBounds(p,{halfWidth=1.8,above=3,below=.45}={}){
  return {left:p.x-p.s*halfWidth,right:p.x+p.s*halfWidth,top:p.y-p.s*above,bottom:p.y+p.s*below};
}
