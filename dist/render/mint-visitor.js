import {WALK_CYCLES_PER_SECOND} from '../game/gait.js';

import {hasPaintedCheek,paintedCheek} from '../game/painted-sheep-contact.js';

const directions = ['front','front-right','right','back-right','back','back-left','left','front-left'];
// Pixel pivots in each 160 x 232 cutout: shoulder, then grip.
const sleeves = [
  [[60,112,46,157],[109,110,120,157]], [[68,110,55,156],[107,112,120,156]],
  [[74,111,86,158]], [[94,111,113,156]], [[59,111,46,157],[110,110,123,157]],
  [[66,110,46,156]], [[83,110,76,157]], [[99,110,97,157],[54,113,40,152]]
];
function loadArt(file, version = 'ink-2') {
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = new URL(file + '?v=' + version, import.meta.url).href;
  return img;
}
const art = loadArt('mint-avatar.webp');
const items = loadArt('mint-items.webp');
const petSleeves = loadArt('mint-petting-sleeves.png', 'hand-edge-1');
const paintedEyes=[[[59,81],[110,81]],[[86,81],[122,79]],[[123,74]],[],[],[],[[40,70]],[[43,74],[79,76]]];
const pixelScale=.0091;
const crouchDrop=62;

// Transform the painted shoulder and the torso around the same point at the hip.
function petTorso(side,small) {
  const tilt=side*(small?.20:.10);
  const sx=small?.96:1, sy=small?.85:1;
  const a=sx*Math.cos(tilt), b=sy*Math.sin(tilt), c=-sx*Math.sin(tilt), d=sy*Math.cos(tilt);
  const pivot=small?155:172;
  return [a,b,c,d,80+side*4-a*80-c*pivot,pivot-b*80-d*pivot];
}

// In the sleeve sheet the painted shoulder is (32,8) and palm is (32,55).
// Use one continuous piece of artwork for the sleeve, cuff and hand.
export function drawMintPetSleeve(ctx,feet,animalPoint,animal,time) {
  if(!mintArtReady())return false;
  const side=animalPoint.x>=feet.x?1:-1, view=side>0?2:6;
  const small=animal.size<.5;
  const [sx,sy,hx,hy]=sleeves[view][0];
  const [a,b,c,d,e,f]=petTorso(side,small);
  const shoulderX=feet.x+(a*sx+c*sy+e-80)*pixelScale*feet.s;
  const shoulderY=feet.y+(b*sx+d*sy+f+(small?crouchDrop:0)-224)*pixelScale*feet.s;
  const stroke=Math.sin(time*3.4);
  const animalScale=animalPoint.s*animal.size;
  const cheek=hasPaintedCheek(animal) && animal.dir===-side ? paintedCheek(animal,time) : null;
  const dx=cheek ? animalPoint.x+animalScale*cheek.x-shoulderX : animalPoint.x-side*animalScale*.89+side*stroke*.04*feet.s-shoulderX;
  // Stroke the near flank below the chin even when the sheep is taller.
  const dy=cheek ? animalPoint.y+animalScale*cheek.y-shoulderY : Math.max(.16*feet.s,animalPoint.y-animalScale*.86-shoulderY)+stroke*.075*feet.s;
  const distance=Math.max(.001,Math.hypot(dx,dy));
  const pixels=pixelScale*feet.s, span=hy-sy;
  const reach=cheek ? distance/pixels : Math.min(distance/pixels,span*1.22);
  ctx.save();
  ctx.translate(shoulderX,shoulderY);
  ctx.transform(dy/distance*pixels,-dx/distance*pixels,dx/distance*pixels,dy/distance*pixels,0,0);
  ctx.scale(1,reach/span);
  if(petSleeves?.naturalWidth){
    ctx.drawImage(petSleeves,side>0?0:64,0,64,72,-32,-8,64,72);
  }else{
    // The original sleeve is available while the small bent-pose sheet loads.
    ctx.transform(1,0,-(hx-sx)/span,1,0,0);
    ctx.drawImage(art,view*160+54,3*232+102,55,66,54-sx,102-sy,55,66);
  }
  ctx.restore();
  return true;
}
export function mintArtReady() { return !!art?.naturalWidth; }
export function onMintArtLoaded(redraw) {
  for (const img of [art,items]) {
    if (img && !img.complete) img.addEventListener('load',redraw,{once:true});
  }
}
export function drawMintVisitor(c,p,{pose,walking,time,seated,feeding,reaching,petting,milking,lambSize,appearance,label,idle}) {
  if (!p || !mintArtReady()) return false;
  const view = Math.max(0,directions.indexOf(pose));
  const side = Math.sin(view*Math.PI/4);
  const wave = walking ? Math.sin(time*Math.PI*2*WALK_CYCLES_PER_SECOND) : 0;
  const kneeling = milking || (petting && lambSize<.5);
  const compact = kneeling || seated;
  const holdingStill = !walking && !compact && !petting && !feeding && !reaching;
  const armSet = sleeves[view];
  const handIndex = armSet.length===1 || view===7 ? 0 : 1;
  const layer = row => c.drawImage(art,view*160,row*232,160,232,0,0,160,232);
  function drawBag(x,y) {
    if (appearance.bag && items?.naturalWidth) c.drawImage(items,0,160,90,81,x-15,y-3,32,29);
  }
  function drawHat() {
    if (!appearance.hat || !items?.naturalWidth) return;
    c.save();
    if (side>0) {c.translate(160,0);c.scale(-1,1);}
    c.drawImage(items,0,0,237,155,6,-42,148,91);
    c.restore();
  }
  c.save();
  c.translate(p.x,p.y); c.scale(p.s,p.s);
  c.fillStyle='#2e482d30'; c.beginPath(); c.ellipse(0,.025,.46,.11,0,0,Math.PI*2); c.fill();
  c.scale(pixelScale,pixelScale); c.translate(-80,-224);
  const drop = kneeling ? crouchDrop : seated ? 29 : -Math.abs(wave)*2.5;
  function drawIdleTorso(row){
    if(!idle || (!idle.turn && !idle.blink)){
      layer(row);drawHat();
    }else{
      const sy=row*232;
      const amount=Math.abs(idle.turn);
      // The rear portrait has no eyes. Show the painted profile when looking
      // over a shoulder, keeping the feet and lower body in the walking direction.
      const steps=amount>.68&&view===4?2:amount>.32?1:0;
      const headView=(view+Math.sign(idle.turn)*steps+8)%8;
      // The painted front-left chin meets its collar eight pixels higher
      // and eleven pixels farther left than the front portrait.
      const frontLeft=view===0 && headView===7;
      const neck=frontLeft?111:108;
      const sourceNeck=frontLeft?103:neck;
      const sx=headView*160;
      c.drawImage(art,view*160,sy+neck,160,232-neck,0,neck,160,232-neck);
      c.save();
      if(frontLeft)c.translate(11,neck-sourceNeck);
      const shear=-(idle?.turn||0)*.065;
      c.transform(1,0,shear,1,-shear*sourceNeck,0);
      c.drawImage(art,sx,sy,160,sourceNeck,0,0,160,sourceNeck);
      if(idle?.blink>.01){
        for(const [x,y] of paintedEyes[headView]){
          // Use the neighbouring paper colour, then compress the original ink eye.
          c.drawImage(art,sx+x-3,sy+y+5,7,2,x-3,y-5,7,10);
          if(idle.blink>.65){
            c.strokeStyle='#614637';c.lineWidth=2.6;c.lineCap='round';
            c.beginPath();c.moveTo(x-3.7,y);c.quadraticCurveTo(x,y+2.5,x+3.7,y);c.stroke();
            continue;
          }
          const height=10*(1-.87*idle.blink);
          c.drawImage(art,sx+x-3,sy+y-5,7,10,x-3,y-height/2,7,height);
        }
      }
      drawHat();c.restore();
    }
  }
  if (holdingStill) {
    drawIdleTorso(5);
    const [,,x,y] = armSet[handIndex];
    drawBag(x,y);
  } else {
    for (let foot=0;foot<2;foot++) {
      const stride = foot ? wave : -wave;
      const pivotX = foot ? 92 : 67;
      c.save(); c.translate(pivotX,173+drop);
      if (compact) {
        c.translate(side*(foot?5:12),0);
        c.scale(1,kneeling?.40:.67); c.rotate(-side*(foot?.45:.72));
      } else {
        c.translate(0,-Math.max(0,stride)*5 + stride*Math.cos(view*Math.PI/4)*2);
        c.rotate(-side*stride*.35);
      }
      c.translate(-pivotX,-173); layer(1+foot); c.restore();
    }
    c.save(); c.translate(0,drop);
    if (petting) c.transform(...petTorso(side,kneeling));
    else if (kneeling) {c.translate(80,155);c.scale(.96,.85);c.rotate(side*.12);c.translate(-80,-155);}
    c.translate(80,172); c.rotate(-wave*.014); c.translate(-80,-172);
    drawIdleTorso(0);
    armSet.forEach(([x,y,handX,handY],index)=>{
      const activeHand = index===handIndex;
      if (activeHand && petting) return; // The interaction draws the contacting arm.
      c.save(); c.translate(x,y);
      const swing = (index===0 ? 1 : -1)*wave*(side*.37+.045);
      const reach = activeHand && (feeding||reaching||milking);
      c.rotate(reach ? -(side<0?-1:1)*1.05 : swing);
      c.translate(-x,-y); layer(3+index);
      if (activeHand) {
        if (feeding) {
          c.strokeStyle='#c5a34d'; c.lineWidth=2;
          for(let i=0;i<8;i++){c.beginPath();c.moveTo(handX,handY);c.lineTo(handX-19+i*4,handY-28-i%3*4);c.stroke();}
        } else if (!milking) drawBag(handX,handY);
      }
      c.restore();
    });
    c.restore();
  }
  if (label) {
    const y=drop+(appearance.hat?-65:-23);
    c.fillStyle='#344a38c9'; c.beginPath();c.roundRect(56,y,48,24,5);c.fill();
    c.fillStyle='#fff8e6'; c.textAlign='center';c.font='17px sans-serif';c.fillText('나',80,y+18);
  }
  c.restore();
  return true;
}
