import {LAMB_SPRITE} from '../assets/sheep/lamb/lamb-sprite.js?v=lamb-8';

const parts=LAMB_SPRITE.parts.map(part=>{
  const image=typeof Image==='undefined'?null:new Image();
  if(image)image.src=new URL(`../assets/sheep/lamb/${part.name}.png`,import.meta.url).href;
  return {...part,image};
});

// Use the author's separate parts; images are shared by every lamb.
export function drawLayeredLamb(c,p,animal,time){
  if(!parts.every(part=>part.image?.complete&&part.image.naturalWidth))return false;
  const s=p.s*animal.size,k=2.2/LAMB_SPRITE.width;
  const left=-1.1,top=-LAMB_SPRITE.height*k,phase=animal.phase||0;
  const resting=animal.state==='sleep',happy=animal.careContact&&(animal.state==='pet'||animal.state==='milk');
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  c.save();c.translate(p.x,p.y-(animal.hop||0)*s);c.scale(s*(animal.dir<0?-1:1),s);
  ellipse(0,.01,1,.19,'#253c292e');
  if(animal.walking)c.translate(0,Math.sin(time*8+phase)*.025);
  if(resting)c.translate(0,.35);
  function draw(part,angle=0,after){
    const px=left+part.pivot[0]*k,py=top+part.pivot[1]*k;
    c.save();c.translate(px,py);c.rotate(angle);if(resting&&part.name.startsWith('leg'))c.scale(1,.22);c.translate(-px,-py);
    c.drawImage(part.image,left+part.x*k,top+part.y*k,part.width*k,part.height*k);
    if(after)after();c.restore();
  }
  const stride=animal.walking?Math.sin(time*8+phase)*.15:0;
  for(let i=0;i<4;i++)draw(parts[2+i],stride*(i%2?1:-1));
  draw(parts[0]);
  const nod=(animal.headPosture?.angle??0)+Math.sin(time*1.2+phase)*.045+(happy?Math.sin(time*2+phase)*.02:0);
  draw(parts[1],nod,()=>{
    if(!resting&&!happy&&(time+phase*1.4)%5.1>=.17)return;
    for(const [x,y] of LAMB_SPRITE.eyes){
      const cx=left+x*k,cy=top+y*k;
      ellipse(cx,cy,.063,.069,'#664944');
      c.strokeStyle='#2c2020';c.lineWidth=.014;c.lineCap='round';c.beginPath();c.moveTo(cx-.034,cy);c.quadraticCurveTo(cx,cy+.018,cx+.034,cy);c.stroke();
    }
  });
  c.restore();return true;
}
