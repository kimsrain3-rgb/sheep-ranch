// Both white adult drawings use a 654 × 446 canvas and rotate around the neck.
export function hasPaintedCheek(a) {
  return !a.isLamb && (a.thirdSheepAppearance || a.fifthSheepAppearance);
}

export function paintedHeadNod(a,time) {
  return (a.headPosture?.angle??0)+Math.sin(time*1.1+(a.phase||0))*.045;
}

// A short stroke inside the painted cheek, in units of the sheep's own scale.
export function paintedCheek(a,time,nod=paintedHeadNod(a,time)) {
  const stroke=Math.sin(time*3.4);
  const x=(a.fifthSheepAppearance?510:550)-405+stroke*3;
  const y=(a.fifthSheepAppearance?162:184)-95+stroke*11;
  const dx=x*2.2/654,dy=y*1.50/446;
  const cos=Math.cos(nod),sin=Math.sin(nod);
  const nuzzling=a.careContact && (a.state==='pet'||a.state==='milk');
  const neckX=-1.1+405*2.2/654+(nuzzling?.08:0);
  const neckY=-1.52+95*1.50/446+(nuzzling?.02:0);
  return {x:(a.dir<0?-1:1)*(neckX+cos*dx-sin*dy),
    y:neckY+sin*dx+cos*dy-(a.hop||0)};
}
