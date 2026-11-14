import {keepDry,distance} from './config.js?v=living-meadow';
export const angleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export function petStand(animal,player){
  const gap=.45+1.05*animal.size;
  const options=[-1,1].map(side=>{
    const raw={x:animal.x+side*gap,z:animal.z},dry={...raw};keepDry(dry);
    return {dry,score:distance(raw,dry)*100+distance(dry,player)};
  });
  options.sort((a,b)=>a.score-b.score);
  return options[0].dry;
}
export function petCameraYaw(animal,stand,previousYaw){
  const angle=Math.atan2(-(animal.z-stand.z),animal.x-stand.x);
  const a=previousYaw+angleDelta(angle,previousYaw),b=previousYaw+angleDelta(angle+Math.PI,previousYaw);
  return Math.abs(a-previousYaw)<=Math.abs(b-previousYaw)?a:b;
}
export function petZoom(width=0,height=0){
  return width>0&&height>0?Math.max(1.4,Math.min(4.4,height*.58*30/(Math.min(width*.95,950)*2.6))):4.4;
}
