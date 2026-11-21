// Perspective camera. Every object uses the same rotating world coordinates.
export class MeadowView {
 constructor(){this.zoom=1.65;this.yaw=0;this.pitch=.23;this.target={x:0,z:0};}
 get x(){return 0;} get y(){return 0;}
 center(){} constrain(){}
 toWorld(x,y){return {x,y};} toScreen(x,y){return {x,y};}
 zoomAt(next){this.zoom=Math.max(.65,Math.min(3.4,next));}
 pan(dx,dy){this.yaw=(this.yaw-dx*.006)%(Math.PI*2);this.pitch=Math.max(.08,Math.min(.65,this.pitch+dy*.002));}
 basis(w,h){const key=[w,h,this.zoom,this.yaw,this.pitch,this.target.x,this.target.z];if(this._key&&key.every((v,i)=>v===this._key[i]))return this._basis;this._key=key;const distance=30/this.zoom,sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);return this._basis={sy,cy,distance,x:this.target.x-sy*distance,z:this.target.z-cy*distance,height:Math.max(1+(this.terrainHeight?.(this.target.x,this.target.z)??0)+distance*Math.tan(this.pitch),1+(this.terrainHeight?.(this.target.x-sy*distance,this.target.z-cy*distance)??0)),f:Math.min(w*.95,950),cx:w/2,screenY:h*.52,cp:Math.cos(this.pitch),sp:Math.sin(this.pitch)};}
 project(x,z,y,w,h){const b=this.basis(w,h),dx=x-b.x,dz=z-b.z,forward=dx*b.sy+dz*b.cy,side=dx*b.cy-dz*b.sy,up=y-b.height,depth=forward*b.cp-up*b.sp;if(depth<.8)return null;return {x:b.cx+side*b.f/depth,y:b.screenY-(up*b.cp+forward*b.sp)*b.f/depth,s:b.f/depth,depth};}
 ground(x,y,w,h){const b=this.basis(w,h),side=(x-b.cx)/b.f,v=(b.screenY-y)/b.f,up=v*b.cp-b.sp,forward=v*b.sp+b.cp;if(up>=-.001)return null;const d=-b.height/up;return {x:b.x+d*(side*b.cy+forward*b.sy),z:b.z+d*(-side*b.sy+forward*b.cy)};}
}
