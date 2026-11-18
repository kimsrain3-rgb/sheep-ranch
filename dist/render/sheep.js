import {drawLayeredLamb} from './lamb.js?v=lamb-8';
const handSheep = typeof Image === 'undefined' ? null : new Image();
if(handSheep) handSheep.src = new URL('./hand-sheep.png', import.meta.url).href;
const handParts = typeof Image === 'undefined' ? [] : ['body','head','leg0','leg1','leg2','leg3'].map(name=>{
  const image=new Image(); image.src=new URL(`./hand-${name}.png`,import.meta.url).href; return image;
});
const newSheepParts = typeof Image === 'undefined' ? [] : ['body','head','ears','leg0','leg1','leg2','leg3'].map(name=>{
  const image=new Image(); image.src=new URL(`./new-sheep-${name}.png`,import.meta.url).href; return image;
});
const thirdSheepParts = typeof Image === 'undefined' ? [] : ['body','head','leg0','leg1','leg2','leg3'].map(name=>{
  const image=new Image(); image.src=new URL(`./third-sheep-${name}.png`,import.meta.url).href; return image;
});
const fifthSheepParts = typeof Image === 'undefined' ? [] : ['body','head','leg0','leg1','leg2','leg3'].map(name=>{
  const image=new Image(); image.src=new URL(`./fifth-sheep-${name}.png`,import.meta.url).href; return image;
});

export function drawSheep(c,a,{
  project,time:t,width:W,height:H,player,feeding=false
}){
  if(a.hiddenInBarn){a.screen=null;return;}
  const ellipse=(x,y,rx,ry,color)=>{
    c.fillStyle=color;
    c.beginPath();
    c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    c.fill();
  };
  const resting=a.state==='sleep',happy=a.careContact&&(a.state==='pet'||a.state==='milk');
  const p=project(a.x,a.z);
  a.screen=null;
  if(!p||p.x<-250||p.x>W+250||p.y>H+300)return;
  const s=p.s*a.size;
  a.screen={
    x:p.x,y:p.y-(a.hop||0)*s,w:s*2.5,h:s*1.9
  };
  if(a.isLamb&&drawLayeredLamb(c,p,a,t))return;
  const selectedSheepParts=a.fifthSheepAppearance?fifthSheepParts:thirdSheepParts;
  if((a.thirdSheepAppearance||a.fifthSheepAppearance) && selectedSheepParts.length && selectedSheepParts.every(image=>image.complete&&image.naturalWidth)){
    c.save();c.translate(p.x,p.y-(a.hop||0)*s);c.scale(s,s);
    c.fillStyle='#253c292e';c.beginPath();c.ellipse(0,.01,1,.19,0,0,Math.PI*2);c.fill();
    if(a.dir<0)c.scale(-1,1);
    const phase=Number.isFinite(a.phase)?a.phase:0;
    if(a.walking)c.translate(0,Math.sin(t*8+phase)*.025);
    const x=-1.1,y=-1.52,w=2.2,h=1.50;
    const draw=(image,px,py,angle,after)=>{
      const ax=x+w*px/654,ay=y+h*py/446;
      c.save();c.translate(ax,ay);c.rotate(angle);c.translate(-ax,-ay);c.drawImage(image,x,y,w,h);if(after)after();c.restore();
    };
    const step=a.walking?Math.sin(t*8+phase)*.12:0;
    [130,202,350,420].forEach((px,i)=>draw(selectedSheepParts[2+i],px,335,step*(i%2?1:-1)));
    c.drawImage(selectedSheepParts[0],x,y,w,h);
    const nod=Math.sin(t*1.1+phase)*.045;
    const blinking=resting||happy||((t+phase*1.4)%5.1<.17);
    c.save();if(happy)c.translate(.08,.02);
    draw(selectedSheepParts[1],405,95,nod,()=>{
      if(!blinking)return;
      for(const [ex,ey] of (a.fifthSheepAppearance?[[437,149],[504,122]]:[[441,188],[531,149]])){
        const cx=x+w*ex/654,cy=y+h*ey/446;
        c.fillStyle='#533332';c.beginPath();c.ellipse(cx,cy,.044,.046,0,0,Math.PI*2);c.fill();
        c.strokeStyle='#201819';c.lineWidth=.014;c.lineCap='round';c.beginPath();c.moveTo(cx-.028,cy);c.quadraticCurveTo(cx,cy+.016,cx+.028,cy);c.stroke();
      }
    });c.restore();
    c.restore();return;
  }
  if(a.newSheepAppearance && newSheepParts.length && newSheepParts.every(image=>image.complete&&image.naturalWidth)){
    c.save(); c.translate(p.x,p.y-(a.hop||0)*s); c.scale(s,s);
    c.fillStyle='#253c292e'; c.beginPath(); c.ellipse(0,.01,1,.19,0,0,Math.PI*2); c.fill();
    if(a.dir<0)c.scale(-1,1);
    const phase=Number.isFinite(a.phase)?a.phase:0;
    if(a.walking)c.translate(0,Math.sin(t*8+phase)*.025);
    const x=-1.1,y=-1.42,w=2.2,h=1.405;
    const draw=(image,px,py,angle,after)=>{
      const ax=x+w*px/405,ay=y+h*py/259;
      c.save();c.translate(ax,ay);c.rotate(angle);c.translate(-ax,-ay);c.drawImage(image,x,y,w,h);if(after)after();c.restore();
    };
    const step=a.walking?Math.sin(t*8+phase)*.12:0;
    [53,93,203,237].forEach((px,i)=>draw(newSheepParts[3+i],px,175,step*(i%2?1:-1)));
    c.drawImage(newSheepParts[0],x,y,w,h);
    const nod=Math.sin(t*1.15+phase)*.075+(a.walking?Math.sin(t*4+phase)*.025:0);
    const blinking=resting||happy||((t+phase*1.4)%5.1<.17);
    c.save();
    if(happy)c.translate(.11,.025);
    draw(newSheepParts[2],285,65,nod);draw(newSheepParts[1],285,65,nod,()=>{
      if(!blinking)return;
      for(const [ex,ey] of [[292,113],[339,92]]){
        const cx=x+w*ex/405,cy=y+h*ey/259;
        c.fillStyle='#596560';c.beginPath();c.ellipse(cx,cy,.043,.048,0,0,Math.PI*2);c.fill();
        c.strokeStyle='#202b28';c.lineWidth=.014;c.lineCap='round';
        c.beginPath();c.moveTo(cx-.027,cy);c.quadraticCurveTo(cx,cy+.015,cx+.027,cy);c.stroke();
      }
    });
    c.restore();
    c.restore();return;
  }
  if(!a.classicAppearance && handSheep && handSheep.complete && handSheep.naturalWidth){
    c.save();
    c.translate(p.x,p.y-(a.hop||0)*s);
    c.scale(s,s);
    c.fillStyle='#253c292e';
    c.beginPath(); c.ellipse(0,.01,1,.19,0,0,Math.PI*2); c.fill();
    if(a.walking)c.translate(0,Math.sin(t*8+a.phase)*.035);
    if(a.dir<0)c.scale(-1,1);
    if(handParts.length && handParts.every(image=>image.complete && image.naturalWidth)){
      const variant=a.isLamb?5:(Number(String(a.id||'0').split('-').pop())||0)%5;
      // Variations alter the original drawing's shape, retaining its painted texture.
      const shapes=[
        {body:[1,1],head:[1,1],ears:[1,1]},
        {body:[.92,1.1],head:[1.16,.91],ears:[.72,1.25]},
        {body:[1.12,.94],head:[.84,1.08],ears:[1.32,.76]},
        {body:[.88,1.13],head:[1.08,1.08],ears:[.78,.72]},
        {body:[1.13,1.02],head:[.91,.9],ears:[1.2,1.22]},
        {body:[.91,1.06],head:[1.2,1.15],ears:[.85,1.2]}
      ];
      const shape=shapes[variant];
      const part=(image,x,y,angle,after)=>{
        const px=-1.1+2.2*x/715,py=-1.62+1.58*y/502;
        c.save(); c.translate(px,py); c.rotate(angle); c.translate(-px,-py);
        if(image===handParts[1]){
          const X=x=>-1.1+2.2*x/715,Y=y=>-1.62+1.58*y/502;
          c.translate(px,py); c.scale(...shape.head); c.translate(-px,-py);
          const ears=[{x:300,y:120,w:105,h:160,px:395,py:120},{x:570,y:0,w:145,h:110,px:575,py:45}];
          c.save(); c.beginPath(); c.rect(-1.1,-1.62,2.2,1.58);
          for(const e of ears)c.rect(X(e.x),Y(e.y),2.2*e.w/715,1.58*e.h/502);
          c.clip('evenodd'); c.drawImage(image,-1.1,-1.62,2.2,1.58); c.restore();
          ears.forEach((e,i)=>{
            const px=X(e.px),py=Y(e.py),phase=Number.isFinite(a.phase)?a.phase:0;
            const flick=Math.sin(t*(1.1+i*.23)+phase*2+i)*.055;
            c.save(); c.translate(px,py); c.rotate(i?-flick:flick); c.scale(1,shape.ears[i]); c.translate(-px,-py);
            c.beginPath(); c.rect(X(e.x),Y(e.y),2.2*e.w/715,1.58*e.h/502); c.clip();
            c.drawImage(image,-1.1,-1.62,2.2,1.58); c.restore();
          });
        }else c.drawImage(image,-1.1,-1.62,2.2,1.58);
        if(after)after(); c.restore();
      };
      const colors=['none','sepia(.24) saturate(.85)','sepia(.4) brightness(.88)','grayscale(.65) brightness(.94)','sepia(.18) hue-rotate(320deg)','sepia(.14) brightness(1.06)'];
      c.filter=colors[variant];
      const stride=a.walking?Math.sin(t*8+a.phase)*.16:0;
      [[128,320],[198,350],[363,370],[438,350]].forEach(([x,y],i)=>part(handParts[i+2],x,y,stride*(i%2?1:-1)));
      c.save(); c.translate(-.18,-.74); c.scale(...shape.body); c.translate(.18,.74);
      c.drawImage(handParts[0],-1.1,-1.62,2.2,1.58); c.restore();
      const phase=Number.isFinite(a.phase)?a.phase:0;
      const individuality=Math.sin(phase*2.31);
      const headAngle=individuality*.025+Math.sin(t*(.65+.2*(individuality+1))+phase*2)*.018
        +(a.walking?Math.sin(t*4+phase)*.009:0)
        +(a.careContact?Math.sin(t*1.4+phase)*.025:0);
      const blinkCycle=(t+phase*1.7)%(4.2+(variant%3)*.7);
      const blinking=blinkCycle<.16||resting||happy;
      part(handParts[1],425,155,headAngle,()=>{
        if(!blinking)return;
        for(const [x,y] of [[478,210],[574,163]]){
          const ex=-1.1+2.2*x/715,ey=-1.62+1.58*y/502;
          c.fillStyle='#533332'; c.beginPath(); c.ellipse(ex,ey,.052,.065,0,0,Math.PI*2); c.fill();
          c.strokeStyle='#f8f5ef'; c.lineWidth=.018; c.lineCap='round';
          c.beginPath(); c.moveTo(ex-.033,ey); c.quadraticCurveTo(ex,ey+.018,ex+.033,ey); c.stroke();
        }
      });
    }else c.drawImage(handSheep,-1.1,-1.62,2.2,1.58);
    c.restore();
    return;
  }
  c.save();
  c.translate(p.x,p.y);
  c.scale(s,s);
  const step=a.walking?Math.sin(t*8+a.phase)*.10:0;
  const chew=a.bite>0?Math.sin(t*18)*.035:0;
  ellipse(0,.01,1,.19,'#253c292e');
  c.translate(0,-(a.hop||0));
  if(a.isLamb&&((a.state==='milk'&&a.careContact)||a.state==='nursing'))ellipse(-.94+Math.sin(t*10)*.07,-.85,.15,.085,'#f6efda');
  if(resting)c.translate(0,.43);
  if(a.state==='nursing')c.rotate(Math.sin(t*5)*.018);
  // Four jointed legs, soft hoof highlights, fleece silhouette and individual curls.
  for(let i=0;i<4;i++){
    if(resting){
      ellipse((i-1.5)*.34,-.4,.16,.075,'#6a6451');
      continue;
    }
    let x=[-.55,-.32,.35,.6][i],yy=-.12+(i%2)*.05;
    const dx=step*(i%2?-1:1);
    c.strokeStyle=i%2?'#766d59':'#5d594c';
    c.lineWidth=.105;
    c.lineCap='round';
    c.beginPath();
    c.moveTo(x,-.61);
    c.lineTo(x+dx,-.3);
    c.lineTo(x-dx,yy);
    c.stroke();
    ellipse(x-dx,yy,.10,.052,'#484b43');
  }
  const wool=c.createRadialGradient(-.3,-1.1,.1,0,-.7,1.1);
  wool.addColorStop(0,'#fffced');
  wool.addColorStop(.65,'#eee8d3');
  wool.addColorStop(1,'#bfbda7');
  ellipse(0,-.84,.94,.63,wool);
  for(const [index,spot] of a.spots.entries()){
    if(s<14&&index>7)break;
    const x=spot.x,y=-.85+spot.y;
    if(x*x/.9+y*y>100)continue;
    let grad='#f0ebd8';
    if(s>=14){
      grad=c.createRadialGradient(x-.035,y-.045,.01,x,y,spot.r);
      grad.addColorStop(0,'#fffdef');
      grad.addColorStop(.65,'#f0ebd8');
      grad.addColorStop(1,'#d2ceba');
    }
    ellipse(x,y,spot.r,spot.r*.92,grad);
    c.strokeStyle='#b8b5a22b';
    c.lineWidth=.012;
    c.beginPath();
    c.arc(x,y,spot.r*.55,.2,3.6);
    c.stroke();
  }
  const toward=feeding&&Math.hypot(a.x-player.x,a.z-player.z)<10,headX=a.headX??a.dir*.83,headY=a.headY??-1.05;
  if(a.state==='nurse-wait'){
    ellipse(.2,-.34,.18,.13,'#c7a18b');
    c.fillStyle='#b98c78';
    c.fillRect(.11,-.33,.035,.12);
    c.fillRect(.25,-.33,.035,.12);
  }
  c.save();
  c.translate(headX+(happy?Math.sin(t*2)*.04:0),headY+chew+(a.begging?Math.sin(t*2)*.035:0));
  if(!toward)c.rotate(-headX/.83*.13);
  ellipse(-.3,-.12,.24,.09,'#b3aa91');
  ellipse(.3,-.12,.24,.09,'#b3aa91');
  ellipse(-.33,-.12,.14,.044,'#d8b6a0');
  ellipse(.33,-.12,.14,.044,'#d8b6a0');
  const face=c.createLinearGradient(-.2,-.3,.2,.36);
  face.addColorStop(0,'#8d8876');
  face.addColorStop(1,'#bbb19a');
  ellipse(0,.07,.27,.37,face);
  for(let i=0;i<5;i++)ellipse((i-2)*.10,-.27+Math.abs(i-2)*.024,.115,.105,'#faf4df');
  for(const x of [-.15,.15]){
    if(resting||happy){
      c.strokeStyle='#555c48';
      c.lineWidth=.025;
      c.beginPath();
      c.moveTo(x-.055,-.025);
      c.quadraticCurveTo(x,.035,x+.055,-.025);
      c.stroke();
    }
    else{
      ellipse(x,-.015,.042,.052,'#242f2a');
      ellipse(x-.009,-.03,.013,.015,'#fff8e8');
    }
  }
  if(happy){
    ellipse(-.22,.13,.07,.035,'#d5b5a1');
    ellipse(.22,.13,.07,.035,'#d5b5a1');
  }
  ellipse(0,.28,.08,.048,'#675f50');
  c.strokeStyle='#686353';
  c.lineWidth=.015;
  c.beginPath();
  c.moveTo(0,.31);
  c.lineTo(0,.35);
  c.stroke();
  c.restore();
  if(resting){
    c.fillStyle='#e9ecd4';
    c.font='.22px serif';
    c.fillText('z',.4,-1.6+Math.sin(t)*.04);
  }
  if(a.pet>0||a.bite>0){
    c.globalAlpha=Math.min(1,Math.max(a.pet,a.bite));
    c.fillStyle=a.pet>0?'#e6ad91':'#f3df95';
    c.font='.36px serif';
    c.textAlign='center';
    c.fillText(a.pet>0?'♥':'✦',.1,-1.8-Math.sin(t*2)*.05);
    c.globalAlpha=1;
  }
  c.restore();
}
