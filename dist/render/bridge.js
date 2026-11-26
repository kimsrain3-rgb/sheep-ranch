import {BRIDGE,BRIDGES,bridgePoint} from '../game/waterways.js?v=lake-bridge-1';
const arch=(u,bridge)=>bridge.rise*Math.max(0,1-(u/bridge.halfLength)**2);
const point=(bridge,u,v,y=arch(u,bridge))=>{const p=bridgePoint(u,v,bridge);return [p.x,p.z,y];};
function polygon(c,project,points,color){
  const screen=points.map(([x,z,y])=>project(x,z,y));if(screen.some(p=>!p))return;
  c.fillStyle=color;c.beginPath();screen.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
}
export function drawBridgeDeck(c,project){
  for(const bridge of BRIDGES){
    const footprint=[];
    for(const side of [-1,1]){
      for(let i=0;i<=8;i++){
        const u=side*bridge.halfLength*(1-i/4);
        const [x,z]=point(bridge,u,side*bridge.halfWidth);
        const rise=arch(u,bridge);
        footprint.push([x-.55*rise,z-.35*rise,0]);
      }
    }
    polygon(c,project,footprint,'#394b3440');
    const pieces=[];
    for(const side of [-1,1])for(let i=0;i<26;i++){
      const u=-bridge.halfLength+i/26*bridge.halfLength*2,next=u+bridge.halfLength*2/26,v=side*bridge.halfWidth;
      pieces.push({x:(u+next)/2,v,points:[point(bridge,u,v),point(bridge,next,v),point(bridge,next,v,arch(next,bridge)-.24),point(bridge,u,v,arch(u,bridge)-.24)],color:bridge.style==='logs'?'#68472c':'#74553c'});
    }
    for(let i=0;i<26;i++){
      const u=-bridge.halfLength+i/26*bridge.halfLength*2,next=u+bridge.halfLength*2/26-.025;
      pieces.push({x:(u+next)/2,v:0,points:[point(bridge,u,-bridge.halfWidth),point(bridge,next,-bridge.halfWidth),point(bridge,next,bridge.halfWidth),point(bridge,u,bridge.halfWidth)],color:bridge.style==='logs'?(i%3?'#a77543':'#bd8b52'):(i%3?'#b38e5e':'#c3a16b'),log:bridge.style==='logs',u,next});
    }
    pieces.sort((a,b)=>{const pa=bridgePoint(a.x,a.v,bridge),pb=bridgePoint(b.x,b.v,bridge);return (project(pb.x,pb.z,arch(b.x,bridge))?.depth??-1)-(project(pa.x,pa.z,arch(a.x,bridge))?.depth??-1);});
    c.save();
    for(const piece of pieces){
      polygon(c,project,piece.points,piece.color);
      if(!piece.log)continue;
      // Fine grain runs along each round log, across the width of the bridge.
      for(const offset of [.23,.7]){
        const u=piece.u+(piece.next-piece.u)*offset,grain=[-.84,-.35,.1,.54,.84].map((v,i)=>point(bridge,u+(i%2?.025:-.018),v*bridge.halfWidth,arch(u,bridge)+.012));
        const screen=grain.map(([x,z,y])=>project(x,z,y));if(screen.some(p=>!p))continue;
        c.strokeStyle=offset<.5?'#63402288':'#e0ad70a8';c.lineWidth=Math.max(.6,(screen[2].s||5)*.011);
        c.beginPath();screen.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
      }
      for(const side of [-1,1]){
        const u=(piece.u+piece.next)/2,p=point(bridge,u,side*bridge.halfWidth,arch(u,bridge)-.1),screen=project(...p);
        if(!screen)continue;
        const radius=Math.max(1,(screen.s||5)*.12);
        c.fillStyle='#604025';c.beginPath();c.ellipse(screen.x,screen.y,radius,radius*.8,0,0,Math.PI*2);c.fill();
        c.strokeStyle='#c7975f';c.lineWidth=Math.max(.5,radius*.18);c.beginPath();c.ellipse(screen.x,screen.y,radius*.58,radius*.43,0,0,Math.PI*2);c.stroke();
      }
    }
    c.restore();
  }
}
export function drawBridgeRail(c,project,side,bridge=BRIDGE){
  const v=side*(bridge.halfWidth-.05),center=bridgePoint(0,v,bridge),scale=project(center.x,center.z,1)?.s||5;
  function line(points,color,width){const pp=points.map(([x,z,y])=>project(x,z,y));if(pp.some(p=>!p))return;c.strokeStyle=color;c.lineWidth=width;c.beginPath();pp.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
  c.save();c.lineCap='round';c.lineJoin='round';
  for(const rise of [.46,.92]){
    const points=Array.from({length:33},(_,i)=>{const u=-bridge.halfLength+i/32*bridge.halfLength*2;return point(bridge,u,v,arch(u,bridge)+rise);});
    line(points,bridge.style==='logs'?'#65442a':'#7d5e3f',Math.max(1.4,scale*.075));line(points.map(([x,z,y])=>[x,z,y+.025]),bridge.style==='logs'?'#bd8953':'#c1a16e',Math.max(.65,scale*.023));
  }
  for(let i=0;i<=6;i++){
    const u=-bridge.halfLength+i/6*bridge.halfLength*2;
    line([point(bridge,u,v,arch(u,bridge)-.05),point(bridge,u,v,arch(u,bridge)+1.02)],bridge.style==='logs'?'#795333':'#8b6945',Math.max(1.8,scale*.085));
  }
  c.restore();
}
function barycentric(x,y,a,b,c){
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-8)return null;
  const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
  return u>=0&&v>=0&&w>=0?[u,v,w]:null;
}
export function pickBridge(x,y,project){
  for(const bridge of BRIDGES)for(let i=0;i<26;i++){
    const u=-bridge.halfLength+i/26*bridge.halfLength*2,next=u+bridge.halfLength*2/26;
    const vertices=[point(bridge,u,-bridge.halfWidth),point(bridge,next,-bridge.halfWidth),point(bridge,next,bridge.halfWidth),point(bridge,u,bridge.halfWidth)],screen=vertices.map(p=>project(...p));
    if(screen.some(p=>!p))continue;
    for(const indices of [[0,1,2],[0,2,3]]){
      const weights=barycentric(x,y,...indices.map(j=>screen[j]));if(!weights)continue;
      const perspective=indices.map((j,k)=>weights[k]/screen[j].depth),total=perspective.reduce((sum,w)=>sum+w,0);
      return {x:indices.reduce((sum,j,k)=>sum+vertices[j][0]*perspective[k]/total,0),z:indices.reduce((sum,j,k)=>sum+vertices[j][1]*perspective[k]/total,0)};
    }
  }
  return null;
}
