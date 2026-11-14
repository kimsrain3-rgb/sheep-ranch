// All tunable counts, places and activity durations live here.
export const CONFIG = Object.freeze({
  adults: 50, lambs: 12, chickens: 10, dogs: 2,
  bounds: {
    minX:-75,maxX:75,minZ:-75,maxZ:150
  },
  pond: {
    x:-16,z:-5,rx:7,rz:5
  },
  drinkingSpots: [{
    x:-8.4,z:-4.5
  },{
    x:-10,z:-.8
  },{
    x:-18,z:.5
  }
  ],
  barn: {x:-25,z:37,entrance:{x:-25,z:28},halfWidth:10,depth:18,capacity:80},
  hammock: {x:-6,z:7},
  shed: {
    x:24,z:48,entrance:{
      x:22,z:42
    }
  },
  durations: {
    pet:5.5,milk:8,sleep:28,nurse:10,drink:8,tug:4
  },
  maxHayPiles: 4, hayPortions: 10,
});
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function seededRandom(seed=1731){
  return ()=>((seed=seed*16807%2147483647)-1)/2147483646;
}
export function keepDry(a){
  const p=CONFIG.pond,dx=(a.x-p.x)/p.rx,dz=(a.z-p.z)/p.rz,r=Math.hypot(dx,dz);
  if(r<1.06){
    const angle=r>.0001?Math.atan2(dz,dx):0;
    a.x=p.x+Math.cos(angle)*p.rx*1.06;
    a.z=p.z+Math.sin(angle)*p.rz*1.06;
  }
}
