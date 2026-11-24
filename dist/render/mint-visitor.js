import {WALK_CYCLES_PER_SECOND} from '../game/gait.js';

const directions = ['front','front-right','right','back-right','back','back-left','left','front-left'];
// Pixel pivots in each 160 x 232 cutout: shoulder, then grip.
const sleeves = [
  [[60,112,46,157],[109,110,120,157]], [[68,110,55,156],[107,112,120,156]],
  [[74,111,86,158]], [[94,111,113,156]], [[59,111,46,157],[110,110,123,157]],
  [[66,110,46,156]], [[83,110,76,157]], [[99,110,97,157],[54,113,40,152]]
];
function loadArt(file) {
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = new URL(file, import.meta.url).href;
  return img;
}
const art = loadArt('mint-avatar.webp');
const items = loadArt('mint-items.webp');
export function mintArtReady() { return !!art?.naturalWidth; }
export function onMintArtLoaded(redraw) {
  for (const img of [art,items]) {
    if (img && !img.complete) img.addEventListener('load',redraw,{once:true});
  }
}
export function drawMintVisitor(c,p,{pose,walking,time,seated,feeding,reaching,petting,milking,lambSize,appearance,label}) {
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
  c.scale(.0091,.0091); c.translate(-80,-224);
  const drop = kneeling ? 62 : seated ? 29 : -Math.abs(wave)*2.5;
  if (holdingStill) {
    layer(5); drawHat();
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
    if (kneeling) {c.translate(80,155);c.scale(.96,.85);c.rotate(side*.12);c.translate(-80,-155);}
    c.translate(80,172); c.rotate(-wave*.014); c.translate(-80,-172);
    layer(0); drawHat();
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
