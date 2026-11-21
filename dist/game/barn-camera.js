// Eye-height camera for walking inside the closed barn.
export class BarnInteriorView {
  constructor(){this.zoom=1.4;this.yaw=0;this.pitch=-.03;this.target={x:0,z:1};this.eyeHeight=1.7;}
  get x(){return 0;} get y(){return 0;}
  center(){} constrain(){}
  toWorld(x,y){return {x,y};} toScreen(x,y){return {x,y};}
  zoomAt(next){this.zoom=Math.max(.65,Math.min(5,next));}
  pan(dx,dy){this.yaw=(this.yaw-dx*.006)%(Math.PI*2);this.pitch=Math.max(-.4,Math.min(.55,this.pitch+dy*.002));}
  basis(w,h){
    const key=[w,h,this.zoom,this.yaw,this.pitch,this.target.x,this.target.z,this.eyeHeight,this.orbitPitch,this.orbitFocal];
    if(this._key&&key.every((value,i)=>value===this._key[i]))return this._basis;
    this._key=key;
    const pitch=this.orbitPitch??this.pitch;
    return this._basis={x:this.target.x,z:this.target.z,height:this.eyeHeight,sy:Math.sin(this.yaw),cy:Math.cos(this.yaw),cp:Math.cos(pitch),sp:Math.sin(pitch),f:this.orbitFocal??Math.min(w*.7,850)*this.zoom/1.4,cx:w/2,screenY:h*.52};
  }
  project(x,z,y,w,h){
    const b=this.basis(w,h),dx=x-b.x,dz=z-b.z,forward=dx*b.sy+dz*b.cy,side=dx*b.cy-dz*b.sy,up=y-b.height;
    const depth=forward*b.cp-up*b.sp;
    if(depth<.12)return null;
    return {x:b.cx+side*b.f/depth,y:b.screenY-(up*b.cp+forward*b.sp)*b.f/depth,s:b.f/depth,depth};
  }
  ground(x,y,w,h){
    const b=this.basis(w,h),side=(x-b.cx)/b.f,v=(b.screenY-y)/b.f,up=v*b.cp-b.sp,forward=v*b.sp+b.cp;
    if(up>=-.001)return null;
    const d=-b.height/up;
    return {x:b.x+d*(side*b.cy+forward*b.sy),z:b.z+d*(-side*b.sy+forward*b.cy)};
  }
}
