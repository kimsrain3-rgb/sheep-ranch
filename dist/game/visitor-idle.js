// Slow glances have a quiet interval between them. Blink timing is independent.
export function visitorIdle(time){
  const phase=time%15;
  function glance(start,length){
    const u=(phase-start)/length;
    return u>0&&u<1?Math.sin(Math.PI*u)**2:0;
  }
  const blinkTime=time%11.7;
  const distance=Math.min(...[2.6,6.9,10.2].map(at=>Math.abs(blinkTime-at)));
  return {turn:glance(1.3,3.8)-.88*glance(8,4.4),blink:distance<.12?Math.cos(distance*Math.PI/.24)**2:0};
}
