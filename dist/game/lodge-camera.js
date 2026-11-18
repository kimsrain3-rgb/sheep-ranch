import {BarnInteriorView} from './barn-camera.js?v=immersive-barn-v2';
export class LodgeInteriorView extends BarnInteriorView{
  constructor(){super();this.zoom=1.25;this.pitch=.025;this.eyeHeight=1.65;}
  pan(dx,dy){this.yaw=(this.yaw-dx*.006)%(Math.PI*2);this.pitch=Math.max(-1.1,Math.min(1.0,this.pitch+dy*.002));}
  basis(w,h){if(this._eye!==this.eyeHeight){this._key=null;this._eye=this.eyeHeight;}return super.basis(w,h);}
}
