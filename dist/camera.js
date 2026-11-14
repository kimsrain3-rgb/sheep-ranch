// One shared transform keeps scenery, animals, hit tests and labels aligned.
export class MeadowView {
 constructor(){this.zoom=1;this.x=0;this.y=0;}
 toWorld(x,y){return {x:(x-this.x)/this.zoom,y:(y-this.y)/this.zoom};}
 toScreen(x,y){return {x:x*this.zoom+this.x,y:y*this.zoom+this.y};}
 center(x,y,targetX,targetY){this.x=targetX-x*this.zoom;this.y=targetY-y*this.zoom;}
 zoomAt(next,x,y,w,h){const anchor=this.toWorld(x,y);this.zoom=Math.max(1,Math.min(4,next));this.x=x-anchor.x*this.zoom;this.y=y-anchor.y*this.zoom;this.constrain(w,h);}
 pan(dx,dy,w,h){this.x+=dx;this.y+=dy;this.constrain(w,h);}
 constrain(w,h){this.x=Math.max(w*(1-this.zoom),Math.min(0,this.x));this.y=Math.max(h*(1-this.zoom),Math.min(0,this.y));}
}
